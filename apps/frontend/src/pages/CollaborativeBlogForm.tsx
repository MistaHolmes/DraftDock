/**
 * CollaborativeBlogForm — real-time collaborative blog editor.
 *
 * Routes:
 *  /collab/:blogId       — owner / accepted co-author
 *  /collab/join/:token   — invite-link guest (→ CollabJoinPage → CollabEditor)
 *
 * Features:
 *  - Title editable & synced live across clients via ydoc.getText('title')
 *  - Content synced via TipTap + Hocuspocus (Y.Doc)
 *  - Invite link generation (owner only)
 *  - Publish button (owner only — converts draft to published blog)
 *  - Explicit save button
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import axios from 'axios';
import { NewAppShell } from '@/components/new-components';
import { CoAuthorPresenceBar } from '@/components/collab/CoAuthorPresenceBar';
import { useCollaboration } from '@/hooks/useCollaboration';
import { usePageCache } from '@/context/PageCacheContext';
import { ArrowLeft, Wifi, WifiOff, Loader2, BookOpen } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

/** Route: /collab/:blogId */
export function CollaborativeBlogForm() {
  const { blogId } = useParams<{ blogId: string }>();
  if (!blogId) return <div className="p-8 text-center text-red-500">Missing blog ID</div>;
  return <CollabEditor blogId={blogId} />;
}

/** Route: /collab/join/:token */
export function CollabJoinPage() {
  const { token } = useParams<{ token: string }>();
  const [blogId, setBlogId] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/collab/token/${token}`);
        setInfo(data);
        setBlogId(data.blogId);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <NewAppShell activePage="collaborate" hideRightPanel>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </NewAppShell>
    );
  }

  if (error) {
    return (
      <NewAppShell activePage="collaborate" hideRightPanel>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-red-500 font-medium">{error}</p>
          <button onClick={() => navigate('/collaborate')} className="text-sm text-indigo-500 hover:underline">
            Back to Collaborate
          </button>
        </div>
      </NewAppShell>
    );
  }

  if (!blogId) return null;
  return <CollabEditor blogId={blogId} inviteToken={token} joinInfo={info} />;
}

// ─── Editor Toolbar ──────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  icon: string;
  disabled?: boolean;
}

function ToolbarButton({ onClick, isActive, title, icon, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative p-1.5 rounded-lg transition-colors group/tb ${
        isActive
          ? 'bg-purple-100 text-[#702ae1]'
          : 'text-slate-500 hover:bg-purple-100/40 hover:text-[#702ae1]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className="material-symbols-outlined select-none"
        style={{ fontSize: 18, display: 'block', lineHeight: 1 }}
      >
        {icon}
      </span>
      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/tb:opacity-100 transition-opacity z-20">
        {title}
      </span>
    </button>
  );
}

function ToolbarDivider() {
  return <span className="inline-block mx-1 h-4 w-px bg-slate-200 self-center" />;
}

function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-t-xl border-b border-gray-200 dark:border-gray-800 p-1.5 flex items-center gap-0.5 flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
        icon="format_bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
        icon="format_italic"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
        icon="strikethrough_s"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
        icon="data_object"
      />

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
        icon="looks_one"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
        icon="looks_two"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
        icon="looks_3"
      />

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
        icon="format_list_bulleted"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
        icon="format_list_numbered"
      />

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
        icon="format_quote"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
        icon="code"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
        icon="horizontal_rule"
      />
    </div>
  );
}

// ─── Publish Skeleton Overlay ────────────────────────────────────────────────

function PublishingSkeleton() {
  return (
    <div className="absolute inset-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 rounded-xl animate-in fade-in duration-300">
      <Loader2 size={36} className="animate-spin text-[#702ae1]" />
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Publishing your blog…</p>
        <p className="text-xs text-gray-400 mt-1">Saving content and going live</p>
      </div>
      <div className="w-48 space-y-2 mt-2">
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#702ae1] rounded-full animate-pulse" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Collaborative Editor ───────────────────────────────────────────────

interface CollabEditorProps {
  blogId: string;
  inviteToken?: string;
  joinInfo?: any;
}

function CollabEditor({ blogId, inviteToken, joinInfo }: CollabEditorProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const cache = usePageCache();

  const [isOwner, setIsOwner] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishDone, setPublishDone] = useState(false);

  // ── Yjs-synced title — driven entirely by the Y.Doc observer below.
  // DO NOT seed Y.Text from HTTP data: the server seeds it in onLoadDocument
  // and the WS sync delivers it; inserting here races with that sync and
  // causes the text to be doubled ("My TitleMy Title").
  const [title, setTitle] = useState('');

  const {
    editor,
    ydoc,
    status,
    connectedUsers,
    isSaving,
    lastSavedAt,
    save,
    localUser,
  } = useCollaboration({ blogId, inviteToken });

  // Observe Yjs title text for changes from any client
  useEffect(() => {
    if (!ydoc) return;
    const yTitle = ydoc.getText('title');
    const handler = () => setTitle(yTitle.toJSON());
    yTitle.observe(handler);
    setTitle(yTitle.toJSON());
    return () => yTitle.unobserve(handler);
  }, [ydoc]);

  // Fetch blog metadata: determine ownership
  // NOTE: do NOT insert into Y.Text here; the server seeds the title in
  // onLoadDocument and delivers it via WebSocket sync. Inserting here races
  // with the WS sync and causes the title to be duplicated.
  useEffect(() => {
    if (!user) return;
    const cacheKey = `collab:meta:${blogId}`;
    const cached = cache.get(cacheKey, 60_000);
    if (cached) {
      const email = user.primaryEmailAddress?.emailAddress;
      setIsOwner(!!email && cached.authorEmail === email);
      return;
    }
    (async () => {
      try {
        const t = await getToken();
        const { data } = await axios.get(`${API_URL}/api/blogs/${blogId}`, {
          headers: { Authorization: `Bearer ${t}` },
          withCredentials: true,
        });
        // Cache lightweight metadata only
        cache.set(cacheKey, { authorEmail: data.author?.email });
        // isOwner: compare blog author email with current Clerk user email
        const email = user.primaryEmailAddress?.emailAddress;
        setIsOwner(!!email && data.author?.email === email);
      } catch (err) {
        console.error('Failed to load blog:', err);
      }
    })();
  }, [blogId, user?.id]);

  // Start session for the owner on mount
  useEffect(() => {
    if (!isOwner) return;
    (async () => {
      try {
        const t = await getToken();
        await axios.post(`${API_URL}/api/collab/${blogId}/start`, {}, {
          headers: { Authorization: `Bearer ${t}` },
          withCredentials: true,
        });
      } catch {}
    })();
  }, [isOwner, blogId]);

  /** Write title change to Yjs so all clients see it live */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ydoc) return;
    const yTitle = ydoc.getText('title');
    yTitle.delete(0, yTitle.length);
    yTitle.insert(0, e.target.value);
  };

  const generateInviteLink = useCallback(async () => {
    setGeneratingLink(true);
    try {
      const t = await getToken();
      const { data } = await axios.post(
        `${API_URL}/api/collab/${blogId}/invite`,
        { maxUses: 20, expiresInHours: 72 },
        { headers: { Authorization: `Bearer ${t}` }, withCredentials: true },
      );
      setInviteLink(data.link);
    } catch (err) {
      console.error('Failed to generate invite link:', err);
    } finally {
      setGeneratingLink(false);
    }
  }, [blogId, getToken]);

  const publishBlog = useCallback(async () => {
    setPublishing(true);
    try {
      const t = await getToken();
      // Flush latest Yjs state first
      await axios.post(`${API_URL}/api/collab/${blogId}/save`, {}, {
        headers: { Authorization: `Bearer ${t}` },
        withCredentials: true,
      });
      // Publish the blog (content was already saved by the /save call above)
      await axios.put(`${API_URL}/api/blogs/${blogId}`, {
        published: true,
      }, {
        headers: { Authorization: `Bearer ${t}` },
        withCredentials: true,
      });
      setPublishDone(true);
      setTimeout(() => navigate(`/blog/${blogId}`), 1200);
    } catch (err) {
      console.error('Failed to publish blog:', err);
      setPublishing(false);
    }
  }, [blogId, getToken, navigate, editor]);

  return (
    <NewAppShell activePage="collaborate" hideRightPanel hideFooter>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Top bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate('/collaborate')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {status === 'connected' ? (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Wifi size={13} /> Live
              </span>
            ) : status === 'connecting' ? (
              <span className="flex items-center gap-1 text-xs text-yellow-500">
                <Loader2 size={13} className="animate-spin" /> Connecting…
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <WifiOff size={13} /> Disconnected
              </span>
            )}

            {isOwner && !publishDone && (
              <button
                onClick={publishBlog}
                disabled={publishing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:opacity-80 active:scale-95 transition-all disabled:opacity-60"
              >
                {publishing ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
                {publishing ? 'Publishing…' : 'Publish Blog'}
              </button>
            )}
            {publishDone && (
              <span className="text-xs text-green-500 font-semibold">Published! Redirecting…</span>
            )}
          </div>
        </div>

        {/* ── Editable title ────────────────────────────────────── */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Give your blog a title…"
          className="w-full text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-700 mb-4"
        />

        {joinInfo?.creator && (
          <p className="text-sm text-gray-400 mb-4">
            Session by <span className="font-medium text-gray-600 dark:text-gray-300">{joinInfo.creator.name}</span>
          </p>
        )}

        {/* ── Presence bar ──────────────────────────────────────── */}
        <CoAuthorPresenceBar
          connectedUsers={connectedUsers}
          localUser={localUser}
          status={status}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          onSave={save}
          inviteLink={inviteLink}
          onGenerateLink={generateInviteLink}
          isOwner={isOwner}
          generatingLink={generatingLink}
        />

        {/* ── TipTap Editor ─────────────────────────────────────── */}
        <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
          {publishing && <PublishingSkeleton />}
          {editor && <EditorToolbar editor={editor} />}
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
        </div>

        {/* ── Cursor styles ─────────────────────────────────────── */}
        <style>{`
          .collaboration-cursor__caret {
            border-left: 2px solid;
            border-right: none;
            margin-left: -1px;
            pointer-events: none;
            position: relative;
            word-break: normal;
          }
          .collaboration-cursor__label {
            font-size: 10px;
            font-weight: 600;
            font-family: inherit;
            padding: 0.1rem 0.4rem;
            border-radius: 4px 4px 4px 0;
            position: absolute;
            top: -1.4em;
            left: -1px;
            white-space: nowrap;
            color: white;
            user-select: none;
            pointer-events: none;
          }
          .ProseMirror {
            min-height: 400px;
            padding: 1.25rem 1.5rem;
            outline: none;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: "Start writing together…";
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
        `}</style>

      </div>
    </NewAppShell>
  );
}

export default CollaborativeBlogForm;
