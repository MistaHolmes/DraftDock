/**
 * Y.Doc ↔ content converters.
 *
 * TipTap's Collaboration extension stores editor content in a Y.XmlFragment
 * (named "default"), NOT a Y.Text.  We use y-prosemirror to convert the
 * XmlFragment → ProseMirror Node → JSON → Markdown string for persistence.
 *
 * The non-collab editor stores content as Markdown, and BlogView renders
 * via MDEditor.Markdown, so we must output Markdown (not HTML).
 *
 * Legacy Y.Text("content") is still checked as a fallback for old docs.
 */

import * as Y from 'yjs';
import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { Schema } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';

/** ProseMirror schema matching TipTap StarterKit (basic + lists). */
const pmSchema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
});

// ── ProseMirror JSON → Markdown renderer (no DOM required) ──────────────────

function wrapMarks(text: string, marks?: any[]): string {
  if (!marks || marks.length === 0) return text;
  let result = text;
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
      case 'strong':
        result = `**${result}**`;
        break;
      case 'italic':
      case 'em':
        result = `*${result}*`;
        break;
      case 'code':
        result = `\`${result}\``;
        break;
      case 'strike':
        result = `~~${result}~~`;
        break;
      case 'link': {
        const href = mark.attrs?.href || '';
        result = `[${result}](${href})`;
        break;
      }
    }
  }
  return result;
}

function renderInline(content: any[]): string {
  if (!content) return '';
  return content
    .map((node: any) => {
      if (node.type === 'text') return wrapMarks(node.text || '', node.marks);
      if (node.type === 'hardBreak' || node.type === 'hard_break') return '  \n';
      return '';
    })
    .join('');
}

function renderNode(node: any, listDepth = 0, listIndex = 0): string {
  if (!node) return '';

  // Text node
  if (node.type === 'text') {
    return wrapMarks(node.text || '', node.marks);
  }

  const children = node.content || [];

  switch (node.type) {
    case 'doc':
      return children.map((c: any) => renderNode(c)).join('\n\n');

    case 'paragraph':
      return renderInline(children);

    case 'heading': {
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${renderInline(children)}`;
    }

    case 'bulletList':
    case 'bullet_list':
      return children
        .map((child: any) => renderNode(child, listDepth, -1))
        .join('\n');

    case 'orderedList':
    case 'ordered_list':
      return children
        .map((child: any, idx: number) => renderNode(child, listDepth, idx + 1))
        .join('\n');

    case 'listItem':
    case 'list_item': {
      const indent = '  '.repeat(listDepth);
      const bullet = listIndex > 0 ? `${listIndex}. ` : '- ';
      const inner = children
        .map((c: any, i: number) => {
          if (c.type === 'bulletList' || c.type === 'bullet_list' ||
              c.type === 'orderedList' || c.type === 'ordered_list') {
            return renderNode(c, listDepth + 1);
          }
          return renderInline(c.content || []);
        })
        .join('\n');
      return `${indent}${bullet}${inner}`;
    }

    case 'blockquote':
      return children
        .map((c: any) => `> ${renderNode(c)}`)
        .join('\n');

    case 'codeBlock':
    case 'code_block': {
      const lang = node.attrs?.language || '';
      const code = renderInline(children);
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case 'horizontalRule':
    case 'horizontal_rule':
      return '---';

    case 'hardBreak':
    case 'hard_break':
      return '  \n';

    case 'image': {
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      return `![${alt}](${src})`;
    }

    default:
      return children.map((c: any) => renderNode(c)).join('\n\n');
  }
}

/**
 * Extract Markdown content from a Y.Doc.
 *
 * Tries the TipTap Y.XmlFragment ("default") first, then falls back to
 * legacy Y.Text("content") for backwards compatibility.
 */
export function ydocToMarkdown(ydoc: Y.Doc): string {
  // 1. Try TipTap XmlFragment (the correct source for TipTap Collaboration)
  try {
    const xmlFragment = ydoc.getXmlFragment('default');
    if (xmlFragment && xmlFragment.length > 0) {
      const pmNode = yXmlFragmentToProseMirrorRootNode(xmlFragment, pmSchema);
      const json = pmNode.toJSON();
      const md = renderNode(json);
      if (md && md.trim().length > 0) {
        return md;
      }
    }
  } catch (err) {
    console.warn('[ydocToContent] Failed to extract from XmlFragment:', err);
  }

  // 2. Fallback: legacy Y.Text("content")
  const ytext = ydoc.getText('content');
  return ytext.toJSON();
}

/**
 * Initialise a Y.Doc's shared text type from an existing Markdown string.
 * This is used when a blog is opened in collab mode for the first time.
 */
export function contentToYdoc(content: string, ydoc?: Y.Doc): Y.Doc {
  const doc = ydoc || new Y.Doc();
  const ytext = doc.getText('content');
  if (ytext.length === 0 && content) {
    ytext.insert(0, content);
  }
  return doc;
}

/**
 * Decode a stored Y.Doc binary (Buffer / Uint8Array) and return Markdown content.
 */
export function decodeYdocToMarkdown(binary: Buffer | Uint8Array): string {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(binary));
  return ydocToMarkdown(doc);
}
