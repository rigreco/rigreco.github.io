// sw.js

const CACHE_NAME = 'cosmic-invaders-v12';
const urlsToCache = [
  './',
  './index.html',
  './sprites.js',
  './audio.js',
  './boss.js',
  './game.js',
  './icon.png',
  './favicon.ico',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Errore nella cache di pre-load:', error);
      })
  );
  console.log('Service Worker installato');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());

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
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.warn('Impossibile aggiungere richiesta alla cache:', err);
              });

            return response;
          })
          .catch(error => {
            console.error('Errore fetch:', error);
            const url = event.request.url;
            if (url.match(/\.(html|htm)$/i)) {
              return caches.match('./index.html');
            } else if (url.match(/\.(png|jpg|jpeg|gif|ico)$/i)) {
              return caches.match('./icon.png');
            }
            return new Response('Risorsa non disponibile offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
      .catch(error => {
        console.error('Errore nella gestione cache:', error);
        return new Response('Errore del Service Worker', {
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});
