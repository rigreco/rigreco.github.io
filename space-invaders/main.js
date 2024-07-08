// main.js

import { setupGame } from './game.js';
import { initAudioContext, handleResize } from './ui.js';

// Inizializzazione del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/space-invaders/sw.js')
            .then(registration => {
                console.log('Service Worker registrato con successo:', registration);
            })
            .catch(error => {
                console.log('Registrazione Service Worker fallita:', error);
            });
    });
}

// Gestione degli errori per il favicon
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'LINK' && e.target.rel === 'icon') {
        console.warn('Failed to load favicon. This is not critical for game functionality.');
        e.preventDefault();
    }
}, true);

// Inizializzazione dell'audio al primo gesto dell'utente
document.addEventListener('click', initAudioContext, { once: true });
document.addEventListener('touchstart', initAudioContext, { once: true });

// Avvio del gioco
document.addEventListener('DOMContentLoaded', () => {
    setupGame();
    handleResize();
});