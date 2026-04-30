/**
 * useCollaboration — TipTap + Yjs + Hocuspocus real-time co-authoring hook.
 *
 * Architecture (React-18 / Strict-Mode safe):
 *
 *  1. Y.Doc is created once in a ref (stable, never recreated).
 *  2. HocuspocusProvider is created in useEffect([blogId]) and stored in state.
 *  3. TipTap editor uses StarterKit (undoRedo disabled) + Collaboration.
 *     Collaboration ships its own Y.js undo manager, so StarterKit's must be off.
 *  4. Awareness tracks connected users (name/color) via Hocuspocus provider.
 *     CollaborationCursor is omitted — @tiptap/extension-collaboration-cursor
 *     has no v3 release yet and the v2 build crashes against TipTap v3 APIs.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import axios from 'axios';
// Note: @tiptap/extension-collaboration-cursor has no v3 release yet;
// cursors are disabled until a compatible version is published.

const API_URL = import.meta.env.VITE_API_URL;
const WS_BASE  = import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:3002';

function userColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${((hash % 360) + 360) % 360}, 70%, 50%)`;
}

export interface CollabUser {
  userId: string;
  name:   string;
  color:  string;
  avatar?: string;
}

export interface UseCollaborationOptions {
  blogId:        string;
  token?:        string;
  inviteToken?:  string;
}

export function useCollaboration({ blogId, token: externalToken, inviteToken }: UseCollaborationOptions) {
  const { getToken } = useAuth();
  const { user }     = useUser();

  const [status,         setStatus]         = useState<'connecting'|'connected'|'disconnected'|'error'>('connecting');
  const [isSaving,       setIsSaving]       = useState(false);
  const [lastSavedAt,    setLastSavedAt]    = useState<Date | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([]);
  const [provider,       setProvider]       = useState<HocuspocusProvider | null>(null);

  // ── Refs so closures inside useEffect always see fresh values ─────────────
  const getTokenRef      = useRef(getToken);
  const externalTokenRef = useRef(externalToken);
  const inviteTokenRef   = useRef(inviteToken);
  const userRef          = useRef(user);
  useEffect(() => { getTokenRef.current      = getToken;      }, [getToken]);
  useEffect(() => { externalTokenRef.current = externalToken; }, [externalToken]);
  useEffect(() => { inviteTokenRef.current   = inviteToken;   }, [inviteToken]);
  useEffect(() => { userRef.current          = user;          }, [user]);

  // ── Y.Doc — created once, stable for the lifetime of the hook ─────────────
  const ydocRef = useRef<Y.Doc | null>(null);
  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }
  const ydoc = ydocRef.current;

  // ── Provider lifecycle — fully inside useEffect ────────────────────────────
  useEffect(() => {
    const tokenFn = async (): Promise<string> => {
      if (inviteTokenRef.current)   return inviteTokenRef.current;
      if (externalTokenRef.current) return externalTokenRef.current;
      try { return (await getTokenRef.current()) ?? ''; } catch { return ''; }
    };

    const prov = new HocuspocusProvider({
      url:      WS_BASE,
      name:     blogId,
      document: ydoc,
      token:    tokenFn,
    });

    setProvider(prov);

    const onStatus = ({ status: s }: { status: string }) => {
      setStatus(
        s === 'connected'    ? 'connected'    :
        s === 'disconnected' ? 'disconnected' : 'connecting'
      );
    };

    const onAwareness = () => {
      const users: CollabUser[] = [];
      const seen = new Set<string>();
      prov.awareness?.getStates().forEach((state: any) => {
        const u = state.user;
        if (u?.userId && !seen.has(u.userId)) {
          seen.add(u.userId);
          users.push(u);
        }
      });
      setConnectedUsers(users);
    };

    prov.on('status',           onStatus);
    prov.on('awarenessUpdate',  onAwareness);

    // Set local awareness
    const u = userRef.current;
    if (u && prov.awareness) {
      prov.setAwarenessField('user', {
        userId: u.id,
        name:   u.fullName || u.primaryEmailAddress?.emailAddress || 'Anonymous',
        color:  userColor(u.id),
        avatar: u.imageUrl,
      });
    }

    return () => {
      prov.off('status',          onStatus);
      prov.off('awarenessUpdate', onAwareness);
      prov.destroy();
      setProvider(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  // ── TipTap editor — recreated when provider becomes available ─────────────
  const editor = useEditor(
    {
      extensions: [
        // undoRedo: false — TipTap v3 renamed history→undoRedo; Collaboration
        // ships its own Y.js undo manager so the built-in one must be disabled.
        StarterKit.configure({ undoRedo: false }),
        Collaboration.configure({ document: ydoc }),
      ],
      editorProps: {
        attributes: {
          class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3',
        },
      },
    },
    [], // editor is stable; ydoc is shared via ref so content is preserved
  );

  // ── Update awareness if user loads after provider connects ────────────────
  useEffect(() => {
    if (!user || !provider?.awareness) return;
    provider.setAwarenessField('user', {
      userId: user.id,
      name:   user.fullName || user.primaryEmailAddress?.emailAddress || 'Anonymous',
      color:  userColor(user.id),
      avatar: user.imageUrl,
    });
  }, [user?.id, provider]);

  // ── Explicit save ──────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const t = await getToken();
      const { data } = await axios.post(
        `${API_URL}/api/collab/${blogId}/save`,
        {},
        { headers: { Authorization: `Bearer ${t}` }, withCredentials: true },
      );
      setLastSavedAt(new Date(data.savedAt));
    } catch (err) {
      console.error('Collab save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [blogId, getToken, isSaving]);

  const localUser: CollabUser = {
    userId: user?.id || '',
    name:   user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Anonymous',
    color:  userColor(user?.id || 'anon'),
    avatar: user?.imageUrl,
  };

  return {
    editor,
    provider,
    ydoc,
    status,
    connectedUsers,
    isSaving,
    lastSavedAt,
    save,
    localUser,
  };
}
