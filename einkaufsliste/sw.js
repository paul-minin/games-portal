const CACHE_NAME = 'einkaufsliste-v1';
const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'icon-192.svg',
  'icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;
      return fetch(event.request).then(res => {
        return caches.open(CACHE_NAME).then(cache => {
          try {
            if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, res.clone());
            }
          } catch(e) {}
          return res;
        });
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});