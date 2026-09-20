/**
 * SWASTHYA-SANKET Service Worker (Phase 0 Stub)
 *
 * Phase 0: Minimal install/activate lifecycle.
 * Phase 3: Full offline queue sync, cache-first strategies.
 */

const CACHE_VERSION = "ss-v0.1.0";
const CACHE_STATIC = `${CACHE_VERSION}-static`;

self.addEventListener("install", (event) => {
  console.log("[SW] Installing version:", CACHE_VERSION);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating:", CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC)
          .map((k) => {
            console.log("[SW] Deleting old cache:", k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Phase 0: Pass-through only. No caching yet.
  // Phase 3: Add cache-first for static assets, network-first for API.
});
