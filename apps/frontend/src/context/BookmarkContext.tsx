import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

const API_URL = import.meta.env.VITE_API_URL;

interface BookmarkContextValue {
  /** Set of bookmarked blog IDs */
  bookmarkedIds: Set<string>;
  /** Whether initial fetch is done */
  loaded: boolean;
  /** Check if a blog is bookmarked */
  isBookmarked: (blogId: string) => boolean;
  /** Toggle bookmark for a blog (add/remove) */
  toggleBookmark: (blogId: string) => Promise<void>;
  /** Refresh bookmark IDs from API */
  refresh: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export const BookmarkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const inflightRef = useRef<Set<string>>(new Set());

  const fetchIds = useCallback(async () => {
    if (!isSignedIn) {
      setIds(new Set());
      setLoaded(true);
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/user/bookmarks/ids`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: string[] = await res.json();
        setIds(new Set(data));
      }
    } catch {
      // silent
    } finally {
      setLoaded(true);
    }
  }, [getToken, isSignedIn]);

  // Fetch bookmark IDs when user signs in
  useEffect(() => {
    fetchIds();
  }, [fetchIds]);

  const isBookmarked = useCallback((blogId: string) => ids.has(blogId), [ids]);

  const toggleBookmark = useCallback(async (blogId: string) => {
    if (inflightRef.current.has(blogId)) return;
    inflightRef.current.add(blogId);

    const wasBookmarked = ids.has(blogId);

    // Optimistic update
    setIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(blogId);
      else next.add(blogId);
      return next;
    });

    try {
      const token = await getToken();
      if (!token) {
        // Revert
        setIds((prev) => {
          const next = new Set(prev);
          if (wasBookmarked) next.add(blogId);
          else next.delete(blogId);
          return next;
        });
        return;
      }

      if (wasBookmarked) {
        const res = await fetch(`${API_URL}/api/user/bookmarks/${blogId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("delete failed");
      } else {
        const res = await fetch(`${API_URL}/api/user/bookmarks`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ blogId }),
        });
        if (!res.ok) throw new Error("create failed");
      }
    } catch {
      // Revert optimistic update on failure
      setIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(blogId);
        else next.delete(blogId);
        return next;
      });
    } finally {
      inflightRef.current.delete(blogId);
    }
  }, [ids, getToken]);

  const value: BookmarkContextValue = {
    bookmarkedIds: ids,
    loaded,
    isBookmarked,
    toggleBookmark,
    refresh: fetchIds,
  };

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
};

/**
 * Hook to access bookmark functionality.
 */
export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarkProvider");
  return ctx;
}

export { BookmarkContext };
