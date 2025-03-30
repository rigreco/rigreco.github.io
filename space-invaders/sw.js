// sw.js

const CACHE_NAME = 'cosmic-invaders-v4';  // Incrementato numero versione
// Utilizzo path relativi invece di assoluti per maggiore portabilità
const urlsToCache = [
  './',
  './index.html',
  './space-invaders.js',
  './icon.png',
  './favicon.ico',
  './manifest.json'
  // Aggiungi qui altri file che vuoi mettere in cache
];

self.addEventListener('install', (event) => {
  // Forza l'attivazione immediata del service worker
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
  // Reclama il controllo immediatamente su tutte le pagine
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
              })
              .catch(err => {
                console.warn('Impossibile aggiungere richiesta alla cache:', err);
              });

            return response;
          })
          .catch(error => {
            console.error('Errore fetch:', error);
            // Gestisci i fallimenti per vari tipi di file
            const url = event.request.url;
            if (url.match(/\.(html|htm)$/i)) {
              return caches.match('./index.html');
            } else if (url.match(/\.(js)$/i)) {
              return caches.match('./space-invaders.js');
            } else if (url.match(/\.(png|jpg|jpeg|gif|ico)$/i)) {
              // Ritorna una placeholder image o un'immagine dalla cache
              return caches.match('./icon.png');
            }
            // Altrimenti ritorna un errore
            return new Response('Risorsa non disponibile offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});