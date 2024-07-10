// sw.js

const CACHE_NAME = 'cosmic-invaders-v1';
const urlsToCache = [
  '/space-invaders/',
  '/space-invaders/index.html',
  '/space-invaders/space-invaders.js',
  '/space-invaders/icon.png'
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
  console.log('Service Worker attivato');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
  console.log('Intercettata una richiesta fetch');
});