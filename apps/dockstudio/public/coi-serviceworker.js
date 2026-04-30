/**
 * Cross-Origin Isolation Service Worker
 * Injects COOP + COEP headers on every response so
 * `self.crossOriginIsolated` is true, enabling SharedArrayBuffer
 * (required by @webcontainer/api).
 *
 * Register this SW on project pages BEFORE anything else loads.
 * Source: https://github.com/nicolo-ribaudo/coi-serviceworker (simplified)
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Skip non-GET or opaque requests
  if (event.request.method !== "GET") return;
  if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Passthrough failures / opaque responses
        if (!response || response.status === 0 || response.type === "opaque") {
          return response;
        }

        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        newHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })
      .catch(() => fetch(event.request))
  );
});
