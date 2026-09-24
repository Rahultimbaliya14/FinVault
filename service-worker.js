// Minimal service worker: caches the app shell so the PWA can install
// and still open if briefly offline. It does NOT cache API responses -
// your financial data always comes fresh from the network.
//
// v2: switched from cache-first to NETWORK-FIRST for navigation/HTML
// requests. Cache-first was serving a stale, old JS bundle indefinitely
// after every new deploy - this is what caused old routes/behavior to
// keep running even after the code was updated. Bumping the cache name
// also forces every existing browser to drop the old (broken) cache.

const CACHE_NAME = 'cash-ledger-shell-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  // Navigation requests (loading a page/route) and the HTML document
  // itself: ALWAYS try the network first, so a new deploy is picked up
  // immediately. Only fall back to the cached shell if truly offline.
  const isNavigationOrHTML =
    event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isNavigationOrHTML) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else (JS/CSS/images with content-hashed filenames from
  // Vite): cache-first is safe here, since a new build always produces
  // a NEW filename - there's no risk of serving a stale hashed asset.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});