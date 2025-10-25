/**
 * Main Game Module
 * Coordina tutti i moduli e gestisce il game loop principale
 */

import * as GameState from './game-state.js';
import * as Audio from './audio.js';
import * as Entities from './entities.js';
import * as UI from './ui.js';
import * as Controls from './controls.js';

// Riferimento all'area di gioco
const gameArea = document.getElementById('gameArea');

/**
 * Inizializza il gioco
 */
function initGame() {
    // Pulisci il gameArea mantenendo alcuni elementi speciali
    while (gameArea.firstChild) {
        if (gameArea.firstChild.id !== 'uiContainer' &&
            gameArea.firstChild.id !== 'gameOver' &&
            gameArea.firstChild.id !== 'levelComplete' &&
            gameArea.firstChild.id !== 'temporaryMessage') {
            gameArea.removeChild(gameArea.firstChild);
        } else if (gameArea.firstChild.id === 'gameOver' ||
                  gameArea.firstChild.id === 'levelComplete') {
            gameArea.firstChild.style.display = 'none';
        } else {
            gameArea.firstChild = gameArea.firstChild.nextSibling;
        }
    }

    // Inizializzazione delle variabili di gioco
    GameState.setScore(0);
    GameState.setLives(3);
    GameState.setLevel(1);
    GameState.setInvaderDirection(1);
    GameState.setInvaderSpeed(1);
    GameState.setLastMoveTime(0);
    GameState.setLastAlienShootTime(0);
    GameState.setGameActive(true);
    GameState.setBulletsFrequency(3);
    GameState.setPowerup(0);
    GameState.setNextLifeScore(5000);

    // Assicurati che uiContainer esista
    let uiContainer = document.getElementById('uiContainer');
    if (!uiContainer) {
        uiContainer = document.createElement('div');
        uiContainer.id = 'uiContainer';
        gameArea.appendChild(uiContainer);
    }

    UI.initUI();

    Entities.createPlayer();
    Entities.createInvaders();
    Entities.createBarriers();
    Controls.createTouchControls();

    // Inizializza l'audio
    Audio.initAudioContext();

    // Crea il suono degli alieni
    if (Audio.audioContextStarted && Audio.audioContext) {
        if (Audio.alienMoveSound && Audio.alienMoveSound.oscillator) {
            try {
                Audio.alienMoveSound.oscillator.stop();
            } catch (e) {
                console.warn("Impossibile fermare l'oscillator precedente:", e);
            }
        }

        try {
            Audio.recreateAlienMoveSound();
        } catch (e) {
            console.error("Errore nella creazione del suono degli alieni:", e);
        }
    }

    UI.handleResize();
    GameState.resetShotsFired();
    GameState.setGameState('playing');
}

/**
 * Loop principale del gioco
 */
function gameLoop() {
    if (GameState.gameActive) {
        Controls.updatePlayerPosition();
        Entities.moveInvaders();
        Entities.alienShoot();
        Entities.moveUfo();
        Entities.updateBullets();

        const collisionResult = Entities.checkCollisions();

        if (collisionResult.gameOver) {
            gameOver();
            return;
        }

        if (collisionResult.levelComplete) {
            levelComplete();
            return;
        }

        checkScore();
    }

    if (GameState.gameActive) {
        GameState.setGameLoopId(requestAnimationFrame(gameLoop));
    } else {
        cancelAnimationFrame(GameState.gameLoopId);
    }
}

/**
 * Avvia il gioco
 */
function startGame() {
    GameState.setGameActive(true);
    if (GameState.gameLoopId) {
        cancelAnimationFrame(GameState.gameLoopId);
        GameState.setGameLoopId(null);
    }

    Audio.initAudioContext();

    if (!Audio.alienMoveSound && Audio.audioContextStarted && Audio.audioContext) {
        Audio.recreateAlienMoveSound();
    }

    gameLoop();
}

/**
 * Ferma il gioco
 */
function stopGame() {
    GameState.setGameActive(false);
    if (GameState.gameLoopId) {
        cancelAnimationFrame(GameState.gameLoopId);
    }
}

/**
 * Verifica punteggio per power-up e vite extra
 */
function checkScore() {
    if (GameState.score >= 1000 * (GameState.powerup + 1)) {
        GameState.setBulletsFrequency(GameState.bulletsFrequency + 1 * GameState.level);
        GameState.setPowerup(GameState.powerup + 1);
        Audio.powerupSound();
        UI.showTemporaryMessage(`Power-up! Frequenza di sparo aumentata!`, 3000);
    }

    if (GameState.score >= GameState.nextLifeScore) {
        GameState.setLives(GameState.lives + 1);
        UI.updateUI();
        GameState.setNextLifeScore(GameState.nextLifeScore + 5000);
        Audio.lifeUpSound();
        UI.showTemporaryMessage(`Vita extra guadagnata! Vite attuali: ${GameState.lives}`, 3000);
    }
}

/**
 * Game over
 */
function gameOver() {
    GameState.setGameActive(false);
    cancelAnimationFrame(GameState.gameLoopId);

    try {
        Audio.gameOverSound();
    } catch (error) {
        console.error("Errore durante la riproduzione del suono di game over:", error);
    }

    GameState.updateHiScore();

    Audio.stopAlienMoveSound();

    UI.showGameOver(GameState.score, () => {
        if (GameState.checkHighScore(GameState.score)) {
            UI.promptForName(GameState.score, () => {
                UI.showHighScores(() => showIntroScreen());
            });
        } else {
            UI.showHighScores(() => showIntroScreen());
        }
    });
}

/**
 * Livello completato
 */
function levelComplete() {
    GameState.setGameActive(false);
    cancelAnimationFrame(GameState.gameLoopId);

    try {
        Audio.levelCompleteSound();
    } catch (error) {
        console.error("Errore durante la riproduzione del suono di livello completato:", error);
    }

    GameState.setLevel(GameState.level + 1);
    UI.showLevelComplete(startNextLevel);

    Audio.stopAlienMoveSound();
}

/**
 * Inizia il prossimo livello
 */
function startNextLevel() {
    const levelCompleteElement = document.getElementById('levelComplete');
    if (levelCompleteElement) {
        levelCompleteElement.style.display = 'none';
    }

    const uiContainer = document.getElementById('uiContainer');
    const touchControlsContainer = document.getElementById('touchControlsContainer');

    cleanupGameArea(uiContainer, touchControlsContainer);

    GameState.resetGameVariables();
    Entities.cleanupEntities();

    Entities.createPlayer();
    Entities.createInvaders();
    Entities.createBarriers();
    Controls.createTouchControls();

    if (touchControlsContainer && !gameArea.contains(touchControlsContainer)) {
        gameArea.appendChild(touchControlsContainer);
    }

    UI.updateUI();

    if (Audio.audioContextStarted) {
        Audio.recreateAlienMoveSound();
    }

    if (!Audio.audioContextStarted) {
        Audio.initAudioContext();
    }

    GameState.setGameActive(true);
    gameLoop();
}

/**
 * Pulisce l'area di gioco
 */
function cleanupGameArea(uiContainer, touchControlsContainer) {
    const elementsToKeep = [uiContainer, touchControlsContainer].filter(Boolean);

    Array.from(gameArea.children).forEach(child => {
        if (!elementsToKeep.includes(child) &&
            child.id !== 'gameOver' &&
            child.id !== 'levelComplete' &&
            child.id !== 'temporaryMessage' &&
            child.id !== 'uiContainer') {
            gameArea.removeChild(child);
        }
    });
}

/**
 * Mostra la schermata introduttiva
 */
function showIntroScreen() {
    UI.showIntroScreen(startGameFromIntro, () => {
        UI.showHighScores(() => showIntroScreen());
    });
}

/**
 * Avvia il gioco dalla intro
 */
function startGameFromIntro() {
    GameState.setGameState('playing');
    initGame();
    startGame();

    Audio.initAudioContext();

    if (Audio.audioContextStarted && Audio.audioContext) {
        if (Audio.alienMoveSound && Audio.alienMoveSound.oscillator) {
            try {
                Audio.alienMoveSound.oscillator.stop();
            } catch (e) {
                console.warn("Errore nel fermare l'oscillator precedente:", e);
            }
        }
        Audio.recreateAlienMoveSound();
    }
}

/**
 * Cambia lo stato del gioco
 */
function changeGameState(newState) {
    if (GameState.gameState === newState) return;
    GameState.setGameState(newState);
    switch (newState) {
        case 'intro':
            showIntroScreen();
            break;
        case 'playing':
            startGame();
            break;
        case 'gameOver':
            UI.showGameOver(GameState.score, () => {
                if (GameState.checkHighScore(GameState.score)) {
                    UI.promptForName(GameState.score, () => {
                        UI.showHighScores(() => showIntroScreen());
                    });
                } else {
                    UI.showHighScores(() => showIntroScreen());
                }
            });
            break;
        case 'levelComplete':
            UI.showLevelComplete(startNextLevel);
            break;
    }
}

/**
 * Registra il Service Worker
 */
if ('serviceWorker' in navigator) {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    // Service Worker registrato con successo
                })
                .catch(error => {
                    console.error('Registrazione Service Worker fallita:', error);
                });
        });
    }

    window.addEventListener('error', function(e) {
        if (e.target.tagName === 'LINK' && e.target.rel === 'icon') {
            console.warn('Failed to load favicon. This is not critical for game functionality.');
            e.preventDefault();
        }
    }, true);
}

/**
 * Inizializzazione al caricamento della pagina
 */
window.addEventListener('load', () => {
    // Inizializza i riferimenti all'area di gioco per tutti i moduli
    Entities.initGameArea(gameArea);
    UI.initGameArea(gameArea);
    Controls.initGameArea(gameArea);

    // Carica gli high scores
    GameState.loadHighScores();
    if (GameState.highScores && GameState.highScores.length > 0) {
        const maxScore = Math.max(...GameState.highScores.map(score => score.score));
        GameState.updateHiScore();
    }

    GameState.setGameState('intro');

    // Configura event listeners
    Audio.setupAudioEventListeners();
    Controls.setupKeyboardControls();

    UI.handleResize();

    setTimeout(() => {
        showIntroScreen();
    }, 100);
});

// Event listeners per ridimensionamento
window.addEventListener('resize', () => requestAnimationFrame(UI.handleResize));
window.addEventListener('orientationchange', () => setTimeout(UI.handleResize, 100));
