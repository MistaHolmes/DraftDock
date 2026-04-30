"use client";

import { useAuth } from "@clerk/nextjs";

const API = process.env.NEXT_PUBLIC_API_URL!;

export function useApi() {
  const { getToken } = useAuth();

  const request = async (
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ) => {
    const token = await getToken();
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return res.json();
  };

  return {
    get: (path: string, signal?: AbortSignal) => request("GET", path, undefined, signal),
    post: (path: string, body?: unknown, signal?: AbortSignal) => request("POST", path, body, signal),
    put: (path: string, body: unknown, signal?: AbortSignal) => request("PUT", path, body, signal),
    patch: (path: string, body: unknown, signal?: AbortSignal) => request("PATCH", path, body, signal),
    del: (path: string, signal?: AbortSignal) => request("DELETE", path, undefined, signal),
  };
}
