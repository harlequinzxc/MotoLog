/* MotoLog's compact, update-safe app-shell service worker. */
const CACHE_NAME = "motolog-shell-v4";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icons/motolog-180.png",
  "/icons/motolog-192.png",
  "/icons/motolog-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("motolog-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function offlineResponse() {
  return new Response(
    "<!doctype html><title>MotoLog is offline</title><main><h1>MotoLog is offline</h1><p>Reconnect and reload to continue.</p></main>",
    {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Always prefer the latest deployed document; the shell remains an offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        return (
          (await caches.match(request)) ||
          (await caches.match("/")) ||
          offlineResponse()
        );
      }),
    );
    return;
  }

  // Next.js assets are content-hashed, but network-first avoids a stale cached
  // bundle trapping an installed app after a deployment. Cached assets remain a
  // safe fallback when temporarily offline.
  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "image"
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            event.waitUntil(
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, responseCopy)),
            );
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || Response.error()),
    );
  }
});
