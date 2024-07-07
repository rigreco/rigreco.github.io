// sw.js
self.addEventListener('install', (event) => {
    console.log('Service Worker installato');
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker attivato');
  });
  
  self.addEventListener('fetch', (event) => {
    console.log('Intercettata una richiesta fetch');
  });