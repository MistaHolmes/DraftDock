import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL;

interface LikeState {
  likes: number;
  liked: boolean;
}

interface LikeContextValue {
  /** Get current like state for a blog (returns optimistic local state if present) */
  getLikeState: (blogId: string) => LikeState | undefined;
  /** Set initial like state fetched from backend (won't overwrite optimistic state) */
  seedLikeState: (blogId: string, likes: number, liked: boolean) => void;
  /** Toggle like — optimistic, queued */
  toggleLike: (blogId: string) => void;
  /** Fetch like state from API for a blog */
  fetchLikeState: (blogId: string) => Promise<void>;
  /** Subscribe to state changes for a blog */
  subscribe: (blogId: string, cb: () => void) => () => void;
}

const LikeContext = createContext<LikeContextValue | null>(null);

// How long to wait before flushing the queue (ms)
const FLUSH_DELAY = 1200;

export const LikeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();

  // Canonical like states keyed by blogId
  const stateRef = useRef<Map<string, LikeState>>(new Map());
  // Pending toggles — count of net toggles not yet flushed.
  // If a user toggles twice before flush, they cancel out.
  const pendingRef = useRef<Map<string, number>>(new Map());
  // Flush timer per blogId
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Subscribers per blogId
  const subsRef = useRef<Map<string, Set<() => void>>>(new Map());
  // In-flight request flags per blogId to prevent concurrent flushes
  const inflightRef = useRef<Set<string>>(new Set());

  const notify = useCallback((blogId: string) => {
    subsRef.current.get(blogId)?.forEach((cb) => cb());
  }, []);

  const subscribe = useCallback((blogId: string, cb: () => void) => {
    if (!subsRef.current.has(blogId)) subsRef.current.set(blogId, new Set());
    subsRef.current.get(blogId)!.add(cb);
    return () => { subsRef.current.get(blogId)?.delete(cb); };
  }, []);

  const getLikeState = useCallback((blogId: string) => {
    return stateRef.current.get(blogId);
  }, []);

  const seedLikeState = useCallback((blogId: string, likes: number, liked: boolean) => {
    // Only seed if we don't already have state (don't overwrite optimistic)
    if (!stateRef.current.has(blogId)) {
      stateRef.current.set(blogId, { likes, liked });
      notify(blogId);
    }
  }, [notify]);

  const fetchLikeState = useCallback(async (blogId: string) => {
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/likes/${blogId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        // Don't overwrite state while there are pending optimistic toggles
        if ((pendingRef.current.get(blogId) ?? 0) === 0 && !inflightRef.current.has(blogId)) {
          stateRef.current.set(blogId, { likes: data.likes ?? 0, liked: data.liked ?? false });
          notify(blogId);
        }
      }
    } catch {
      // silently fail
    }
  }, [getToken, notify]);

  const flushBlog = useCallback(async (blogId: string) => {
    const pending = pendingRef.current.get(blogId) ?? 0;
    pendingRef.current.delete(blogId);
    if (pending === 0) return; // toggles cancelled out

    // Only send one request regardless of how many times they toggled
    if (inflightRef.current.has(blogId)) return;
    inflightRef.current.add(blogId);
    try {
      const token = await getToken();
      if (!token) {
        // Revert optimistic state
        const cur = stateRef.current.get(blogId);
        if (cur) {
          // Undo the net direction of pending toggles
          stateRef.current.set(blogId, {
            likes: Math.max(0, cur.likes + (pending > 0 ? -1 : 1)),
            liked: !cur.liked,
          });
          notify(blogId);
        }
        return;
      }

      const res = await fetch(`${API_URL}/api/likes/${blogId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        stateRef.current.set(blogId, { likes: data.likes, liked: data.liked });
        notify(blogId);
      }
    } catch {
      // Network error — just refetch to reconcile
      await fetchLikeState(blogId);
    } finally {
      inflightRef.current.delete(blogId);
      // If more toggles accumulated while we were in-flight, flush again
      if ((pendingRef.current.get(blogId) ?? 0) !== 0) {
        flushBlog(blogId);
      }
    }
  }, [getToken, fetchLikeState, notify]);

  const toggleLike = useCallback((blogId: string) => {
    const current = stateRef.current.get(blogId);
    if (!current) return;

    // Optimistic update
    const newLiked = !current.liked;
    stateRef.current.set(blogId, {
      likes: Math.max(0, current.likes + (newLiked ? 1 : -1)),
      liked: newLiked,
    });
    notify(blogId);

    // Track net pending toggle direction.
    // Each toggle flips direction: +1 means "net = liked", 0 means "cancelled out"
    const prev = pendingRef.current.get(blogId) ?? 0;
    const next = prev === 0 ? 1 : 0;
    pendingRef.current.set(blogId, next);

    // Reset flush timer
    const existing = timerRef.current.get(blogId);
    if (existing) clearTimeout(existing);
    timerRef.current.set(
      blogId,
      setTimeout(() => {
        timerRef.current.delete(blogId);
        flushBlog(blogId);
      }, FLUSH_DELAY)
    );
  }, [flushBlog, notify]);

  const value: LikeContextValue = { getLikeState, seedLikeState, toggleLike, fetchLikeState, subscribe };

  return <LikeContext.Provider value={value}>{children}</LikeContext.Provider>;
};

/**
 * Hook to use like state for a specific blog.
 * Returns { likes, liked, toggle } with optimistic + queued behavior.
 */
export function useLike(blogId: string) {
  const ctx = useContext(LikeContext);
  if (!ctx) throw new Error("useLike must be used within LikeProvider");

  const { isLoaded, isSignedIn } = useAuth();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return ctx.subscribe(blogId, () => forceUpdate((n) => n + 1));
  }, [blogId, ctx]);

  // Fetch on first mount if not already seeded
  useEffect(() => {
    if (!ctx.getLikeState(blogId)) {
      ctx.fetchLikeState(blogId);
    }
  }, [blogId, ctx]);

  // Re-fetch once Clerk finishes loading so we get the correct `liked` status.
  // The initial fetch above can fire before Clerk has a token, causing the backend
  // to return liked:false even for a user who already liked the blog.
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      ctx.fetchLikeState(blogId);
    }
  }, [blogId, ctx, isLoaded, isSignedIn]);

  const state = ctx.getLikeState(blogId);

  return {
    likes: state?.likes ?? 0,
    liked: state?.liked ?? false,
    toggle: () => ctx.toggleLike(blogId),
    seed: (likes: number, liked: boolean) => ctx.seedLikeState(blogId, likes, liked),
  };
}

export { LikeContext };
