// service-worker.js

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up any old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Fetch from network and fall back gracefully on error
  event.respondWith(
    fetch(event.request)
      .catch(error => {
        console.log('Fetch error:', error);
        // Return a simple empty response instead of failing
        return new Response('', {
          status: 200,
          headers: {'Content-Type': 'text/plain'}
        });
      })
  );
});
