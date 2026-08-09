const CACHE_NAME = "sucheojakju-pwa-v4.5.4";
const ROOT = new URL("./", self.location.href);
const INDEX = new URL("index.html", ROOT).href;

const APP_SHELL = [
  new URL("./", ROOT).href,
  INDEX,
  new URL("404.html", ROOT).href,
  new URL("manifest.webmanifest", ROOT).href,
  new URL("icons/icon-192.png", ROOT).href,
  new URL("icons/icon-512.png", ROOT).href,
  new URL("icons/icon-maskable-512.png", ROOT).href
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response && response.ok) {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(INDEX, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
                 (await caches.match(INDEX)) ||
                 Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response && response.ok) {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
