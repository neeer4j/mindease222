// service-worker.js

// Skip waiting and activate the new service worker immediately.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing and skipping waiting...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating and cleaning up old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete all caches.
      return Promise.all(
        cacheNames.map((cache) => {
          console.log('[Service Worker] Deleting cache:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => {
      // Claim clients so the service worker takes effect immediately.
      return self.clients.claim();
    })
  );
});

// Always fetch from the network; do not serve cached responses.
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetching from network:', event.request.url);
  event.respondWith(fetch(event.request));
});
