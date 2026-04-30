import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface PageCacheContextValue {
  /** Get cached data if it exists and hasn't expired. Returns undefined on miss. */
  get: (key: string, maxAgeMs?: number) => any | undefined;
  /** Store data under a key. */
  set: (key: string, data: any) => void;
  /** Delete specific cache keys. */
  invalidate: (...keys: string[]) => void;
  /** Delete all keys that start with the given prefix. */
  invalidatePrefix: (prefix: string) => void;
  /** Nuke everything. */
  invalidateAll: () => void;
}

const PageCacheContext = createContext<PageCacheContextValue | null>(null);

const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

// ── Per-page TTL constants — import these in page components ──────────────────
export const PAGE_TTL = {
  /** Dashboard analytics — relatively short; data changes often */
  dashboard: 2 * 60 * 1000,        // 2 min
  /** Explore / discovery feed */
  explore: 5 * 60 * 1000,          // 5 min
  /** User bookmarks */
  bookmarks: 3 * 60 * 1000,        // 3 min
  /** Reading history */
  history: 3 * 60 * 1000,          // 3 min
  /** Blog list / home */
  blogs: 5 * 60 * 1000,            // 5 min
  /** User profile */
  profile: 10 * 60 * 1000,         // 10 min
  /** Leaderboard */
  leaderboard: 5 * 60 * 1000,      // 5 min
  /** Default fallback */
  default: DEFAULT_MAX_AGE,
} as const;
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_STORAGE_KEY = "pg_cache_v1";

/** Hydrate in-memory store from sessionStorage (survives component unmount, not page reload from server) */
function loadFromSession(): Map<string, CacheEntry> {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return new Map();
    const obj: Record<string, CacheEntry> = JSON.parse(raw);
    const now = Date.now();
    const map = new Map<string, CacheEntry>();
    // Only restore entries that are still within the longest possible TTL (10 min)
    for (const [k, v] of Object.entries(obj)) {
      if (now - v.timestamp < 10 * 60 * 1000) map.set(k, v);
    }
    return map;
  } catch {
    return new Map();
  }
}

function persistToSession(store: Map<string, CacheEntry>) {
  try {
    const obj: Record<string, CacheEntry> = {};
    for (const [k, v] of store.entries()) obj[k] = v;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // quota exceeded or SSR — ignore
  }
}

// ── Provider ───────────────────────────────────────────────────────────────────

export const PageCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useRef<Map<string, CacheEntry>>(loadFromSession());

  const get = useCallback((key: string, maxAgeMs = DEFAULT_MAX_AGE): any | undefined => {
    const entry = store.current.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > maxAgeMs) {
      store.current.delete(key);
      persistToSession(store.current);
      return undefined;
    }
    return entry.data;
  }, []);

  const set = useCallback((key: string, data: any) => {
    store.current.set(key, { data, timestamp: Date.now() });
    persistToSession(store.current);
  }, []);

  const invalidate = useCallback((...keys: string[]) => {
    keys.forEach((k) => store.current.delete(k));
    persistToSession(store.current);
  }, []);

  const invalidatePrefix = useCallback((prefix: string) => {
    for (const key of Array.from(store.current.keys())) {
      if (key.startsWith(prefix)) store.current.delete(key);
    }
    persistToSession(store.current);
  }, []);

  const invalidateAll = useCallback(() => {
    store.current.clear();
    persistToSession(store.current);
  }, []);

  return (
    <PageCacheContext.Provider value={{ get, set, invalidate, invalidatePrefix, invalidateAll }}>
      {children}
    </PageCacheContext.Provider>
  );
};

// ── Low-level hook ─────────────────────────────────────────────────────────────

export function usePageCache(): PageCacheContextValue {
  const ctx = useContext(PageCacheContext);
  if (!ctx) throw new Error("usePageCache must be used within a PageCacheProvider");
  return ctx;
}

// ── Convenience hook: auto-fetch with cache ────────────────────────────────────

/**
 * Fetches data once per cache-key, returning cached results on revisit.
 *
 * @param key   Unique cache key (encode params in the key).  Pass `null` to skip.
 * @param fetcher  Async function that returns the data.
 * @param maxAge   How long (ms) cached data is considered fresh. Default 5 min.
 *
 * @returns `{ data, loading, refresh }` — call `refresh()` to force re-fetch.
 */
export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  maxAge: number = DEFAULT_MAX_AGE,
): { data: T | null; loading: boolean; refresh: () => Promise<void> } {
  const cache = usePageCache();

  // Initialise from cache synchronously (avoids flash-of-loading on back-nav)
  const [data, setData] = useState<T | null>(() => {
    if (!key) return null;
    return cache.get(key, maxAge) ?? null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!key) return false;
    return cache.get(key, maxAge) === undefined;
  });

  // Keep fetcher ref stable so effect doesn't re-run on inline closures
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const keyRef = useRef(key);
  keyRef.current = key;

  const refresh = useCallback(async () => {
    const k = keyRef.current;
    if (!k) return;
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      cache.set(k, result);
      setData(result);
    } catch (err) {
      console.error(`[PageCache] fetch error for "${k}":`, err);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    if (!key) {
      setData(null);
      setLoading(false);
      return;
    }

    const cached = cache.get(key, maxAge);
    if (cached !== undefined) {
      setData(cached);
      setLoading(false);
      return;
    }

    // Cache miss → fetch
    let cancelled = false;
    setLoading(true);
    fetcherRef.current()
      .then((result) => {
        if (cancelled) return;
        cache.set(key, result);
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[PageCache] fetch error for "${key}":`, err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [key, maxAge, cache]);

  return { data, loading, refresh };
}
