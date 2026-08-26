/* MotoLog's intentionally small app-shell service worker. */
const CACHE_NAME = "motolog-shell-v3";
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Use the cached shell if a navigation is attempted without a connection.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        return (await caches.match(request)) || (await caches.match("/"));
      }),
    );
    return;
  }

  // Keep the assets that make up the application shell available offline.
  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => {
              void cache.put(request, responseCopy);
            });
          }
          return response;
        });
      }),
    );
  }
});
