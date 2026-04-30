/**
 * Client-side fetch helper for admin API routes.
 * Injects JWT from localStorage, caches GET responses in sessionStorage.
 * Replaces the old config.js fetchAdmin function.
 */

const API_BASE = "/api/admin";
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchAdmin(path: string, options: RequestInit = {}) {
  const method = options.method || "GET";
  const cacheKey = `admin_cache_${path}`;

  // 1. Return from cache if valid GET request
  if (method === "GET" && typeof window !== "undefined") {
    const cachedItem = sessionStorage.getItem(cacheKey);
    if (cachedItem) {
      try {
        const { timestamp, data } = JSON.parse(cachedItem);
        if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
          return data;
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
  }

  // 2. Clear cache for mutating requests
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase())) {
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
  }

  // 3. Fetch with token
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const fetchedData = await res.json();

  // 4. Save to cache
  if (method === "GET" && typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ timestamp: Date.now(), data: fetchedData })
      );
    } catch {
      // sessionStorage full or unavailable
    }
  }

  return fetchedData;
}
