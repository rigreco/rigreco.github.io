// sw.js

const CACHE_NAME = 'cosmic-invaders-v2';
const urlsToCache = [
  '/space-invaders/',
  '/space-invaders/index.html',
  '/space-invaders/space-invaders.js',
  '/space-invaders/space-invaders-original.js',
  '/space-invaders/icon.png',
  '/space-invaders/favicon.ico',
  '/space-invaders/manifest.json'
  // Aggiungi qui altri file che vuoi mettere in cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
  console.log('Service Worker installato');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: cancellazione cache vecchia', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  console.log('Service Worker attivato');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone della richiesta
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Verifica che la risposta sia valida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone della risposta
            const responseToCache = response.clone();

            // Aggiungi alla cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      }).catch(() => {
        // Fallback per richieste offline
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match('/space-invaders/index.html');
        }
      })
  );
});