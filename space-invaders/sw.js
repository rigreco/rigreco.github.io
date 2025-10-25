// sw.js

const CACHE_NAME = 'cosmic-invaders-v6';  // Aggiornato per modularizzazione
// Utilizzo path relativi invece di assoluti per maggiore portabilità
const urlsToCache = [
  './',
  './index.html',
  './main.js',
  './game-state.js',
  './audio.js',
  './entities.js',
  './ui.js',
  './controls.js',
  './icon.png',
  './favicon.ico',
  './manifest.json'
  // File modulari dopo refactoring
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
  // Ignora richieste non-GET o richieste esterne
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

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

            // Aggiungi alla cache in modo sicuro
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
              return caches.match('./main.js');
            } else if (url.match(/\.(png|jpg|jpeg|gif|ico)$/i)) {
              return caches.match('./icon.png');
            }
            // Altrimenti ritorna un errore controllato
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
        // Fallback response
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