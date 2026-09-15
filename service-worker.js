// Minimal service worker: caches the app shell so the PWA can install
// and still open (even if briefly offline or on a flaky connection).
// It does NOT cache API responses - your financial data always comes
// fresh from the network, this only makes the app ITSELF load instantly.

const CACHE_NAME = 'finvault-shell-v2';

// BASE_URL is injected by Vite at build time (matches vite.config.js's
// `base` setting) so this works correctly whether deployed at the
// domain root or under a GitHub Pages subpath like /finvault/.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old cache versions from previous deployments
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests - never intercept POST/PUT/DELETE (those
  // are your actual API calls and must always hit the real server)
  if (event.request.method !== 'GET') return;

  // Never cache API calls - financial data must always be live
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful same-origin responses for next time
          if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline and not cached - for navigation requests, fall back
          // to the cached app shell so the SPA still loads
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});