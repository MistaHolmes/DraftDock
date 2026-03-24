import React from 'react';
import MDEditor from '@uiw/react-md-editor';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your blog in Markdown (e.g. ```bash for code blocks)...',
  className = '',
  error = false,
}) => {
  return (
    <div 
      className={`w-full bg-white rounded-lg overflow-hidden border ${error ? 'border-red-500' : 'border-gray-200'} ${className}`} 
      data-color-mode="light"
    >
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={500}
        preview="live"
        extraCommands={[]} // Removes the full-screen button since it normally lives in extraCommands
        visibleDragbar={true} // Explicitly strictly enables the draggable resize bar
        className="w-full !border-none custom-md-editor"
        textareaProps={{
          placeholder: placeholder
        }}
        previewOptions={{
          rehypePlugins: [], // Can add rehypeSanitize here if needed, but MDEditor is generally safe for input
        }}
      />
      <style>
        {`
          /* Custom CSS to make the Markdown Editor look integrated */
          .custom-md-editor.w-md-editor {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .custom-md-editor .w-md-editor-toolbar {
            background-color: #f9fafb !important;
            border-bottom: 1px solid #e5e7eb !important;
            padding: 8px 16px !important;
          }
          /* Prettier syntax highlighted code blocks in both preview and blog view */
          .wmde-markdown pre {
            background-color: #1e1e1e !important;
            border-radius: 0.5rem !important;
          }
          .wmde-markdown pre > code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            background-color: transparent !important;
            color: #d4d4d4 !important;
            font-size: 0.95rem !important;
          }
        `}
      </style>
    </div>
  );
};

export default RichTextEditor;
