/**
 * Controls Module
 * Gestisce i controlli touch e tastiera
 */

import * as GameState from './game-state.js';
import * as Audio from './audio.js';
import { player, bullets, createElement } from './entities.js';
import { getLastAppliedScale } from './ui.js';

// Costanti per boundaries del giocatore
const PLAYER_MIN_X = 10;
const PLAYER_MAX_X = 570;

// Riferimento all'area di gioco
let gameArea = null;

// Controlli
let isMovingLeft = false;
let isMovingRight = false;
let shootInterval = null;

// Event listeners per cleanup
let resizeListener = null;
let orientationListener = null;

/**
 * Inizializza il riferimento all'area di gioco
 */
export function initGameArea(area) {
    gameArea = area;
}

/**
 * Ottieni lo stato del movimento
 */
export function getMovementState() {
    return { isMovingLeft, isMovingRight };
}

/**
 * Muove il giocatore a sinistra
 */
export function movePlayerLeft() {
    if (!player) return;

    if (player.x > PLAYER_MIN_X) {
        player.x -= 10;
        player.el.style.left = `${player.x}px`;
    }
}

/**
 * Muove il giocatore a destra
 */
export function movePlayerRight() {
    if (!player) return;

    if (player.x < PLAYER_MAX_X) {
        player.x += 10;
        player.el.style.left = `${player.x}px`;
    }
}

/**
 * Spara un proiettile
 */
export function shoot() {
    if (!player || !gameArea) {
        return; // Non sparare se il gioco non è inizializzato
    }

    if (bullets.length < GameState.bulletsFrequency) {
        bullets.push({
            x: player.x + 10,
            y: player.y - 20,
            el: createElement(player.x + 10, player.y - 20, '|', 'bullet sprite')
        });
        Audio.shootSound();
        GameState.setShotsFired(GameState.shotsFired + 1);
        GameState.setUfoScoreIndex((GameState.shotsFired - 1) % 15);
    }
}

/**
 * Aggiorna la posizione del giocatore basandosi sui controlli
 */
export function updatePlayerPosition() {
    if (!player) return;

    const moveSpeed = player.moveSpeed || 5;
    if (isMovingLeft && player.x > PLAYER_MIN_X) {
        player.x -= moveSpeed;
    }
    if (isMovingRight && player.x < PLAYER_MAX_X) {
        player.x += moveSpeed;
    }
    player.el.style.left = `${player.x}px`;
}

/**
 * Crea i controlli touch
 */
export function createTouchControls() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        const existingTouchControls = document.getElementById('touchControlsContainer');
        if (existingTouchControls) {
            existingTouchControls.remove();
        }

        const touchControlsContainer = document.createElement('div');
        touchControlsContainer.id = 'touchControlsContainer';

        touchControlsContainer.style.position = 'absolute';
        touchControlsContainer.style.bottom = '5px';
        touchControlsContainer.style.left = '0';
        touchControlsContainer.style.width = '100%';
        touchControlsContainer.style.display = 'flex';
        touchControlsContainer.style.justifyContent = 'space-between';
        touchControlsContainer.style.padding = '0 10px';
        touchControlsContainer.style.pointerEvents = 'none';
        touchControlsContainer.style.zIndex = '1000';
        touchControlsContainer.style.backgroundColor = 'transparent';
        touchControlsContainer.style.boxSizing = 'border-box';
        gameArea.appendChild(touchControlsContainer);

        // Joystick virtuale
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'joystickContainer';
        joystickContainer.style.width = '140px';
        joystickContainer.style.height = '140px';
        joystickContainer.style.borderRadius = '70px';
        joystickContainer.style.backgroundColor = 'rgba(100, 100, 100, 0.3)';
        joystickContainer.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        joystickContainer.style.position = 'relative';
        joystickContainer.style.pointerEvents = 'auto';

        const joystickStick = document.createElement('div');
        joystickStick.id = 'joystickStick';
        joystickStick.style.width = '60px';
        joystickStick.style.height = '60px';
        joystickStick.style.borderRadius = '30px';
        joystickStick.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        joystickStick.style.border = '2px solid white';
        joystickStick.style.position = 'absolute';
        joystickStick.style.top = '40px';
        joystickStick.style.left = '40px';
        joystickStick.style.transition = 'transform 0.05s linear';
        joystickStick.style.pointerEvents = 'none';

        joystickContainer.appendChild(joystickStick);

        // Pulsante di sparo
        const shootControlContainer = document.createElement('div');
        shootControlContainer.id = 'shootControlContainer';
        shootControlContainer.style.display = 'flex';
        shootControlContainer.style.justifyContent = 'flex-end';
        shootControlContainer.style.pointerEvents = 'none';

        const shootControl = document.createElement('div');
        shootControl.id = 'shootControl';
        shootControl.className = 'touch-control';
        shootControl.textContent = 'Spara';
        shootControl.style.backgroundColor = 'rgba(255, 50, 50, 0.7)';
        shootControl.style.border = '2px solid white';
        shootControl.style.width = '110px';
        shootControl.style.height = '110px';
        shootControl.style.borderRadius = '50%';
        shootControl.style.color = 'white';
        shootControl.style.fontSize = '20px';
        shootControl.style.display = 'flex';
        shootControl.style.justifyContent = 'center';
        shootControl.style.alignItems = 'center';
        shootControl.style.userSelect = 'none';
        shootControl.style.pointerEvents = 'auto';

        shootControlContainer.appendChild(shootControl);

        touchControlsContainer.appendChild(joystickContainer);
        touchControlsContainer.appendChild(shootControlContainer);

        // Logica joystick
        let joystickActive = false;
        let joystickCenterX = 70;
        let joystickMaxDistance = 45;

        function updateJoystickPosition(touchX) {
            if (!player) return; // Non aggiornare se player non esiste

            const joystickBounds = joystickContainer.getBoundingClientRect();
            const scale = getLastAppliedScale() || 1;
            const relativeX = (touchX - joystickBounds.left) / scale;

            const deltaX = relativeX - joystickCenterX;
            const limitedDeltaX = Math.max(-joystickMaxDistance, Math.min(joystickMaxDistance, deltaX));

            joystickStick.style.transform = `translateX(${limitedDeltaX}px)`;

            const movementRatio = limitedDeltaX / joystickMaxDistance;
            const exponentialResponse = Math.sign(movementRatio) * Math.pow(Math.abs(movementRatio), 0.8);

            if (exponentialResponse < -0.05) {
                isMovingLeft = true;
                isMovingRight = false;
                player.moveSpeed = Math.max(3, Math.abs(exponentialResponse) * 12);
            } else if (exponentialResponse > 0.05) {
                isMovingLeft = false;
                isMovingRight = true;
                player.moveSpeed = Math.max(3, Math.abs(exponentialResponse) * 12);
            } else {
                isMovingLeft = false;
                isMovingRight = false;
                player.moveSpeed = 5;
            }
        }

        joystickContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickActive = true;
            const touch = e.touches[0];
            updateJoystickPosition(touch.clientX);
        });

        joystickContainer.addEventListener('touchmove', (e) => {
            if (joystickActive) {
                e.preventDefault();
                const touch = e.touches[0];
                updateJoystickPosition(touch.clientX);
            }
        });

        const resetJoystick = () => {
            joystickActive = false;
            joystickStick.style.transform = 'translateX(0)';
            isMovingLeft = false;
            isMovingRight = false;
            if (player) {
                player.moveSpeed = 5;
            }
        };

        joystickContainer.addEventListener('touchend', resetJoystick);
        joystickContainer.addEventListener('touchcancel', resetJoystick);

        // Event listeners pulsante sparo
        shootControl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            shootControl.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';

            shoot();

            if (shootInterval) clearInterval(shootInterval);

            shootInterval = setInterval(() => {
                shoot();
            }, 250);
        });

        shootControl.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();

            shootControl.style.backgroundColor = 'rgba(255, 50, 50, 0.7)';

            if (shootInterval) {
                clearInterval(shootInterval);
                shootInterval = null;
            }
        });

        shootControl.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (shootInterval) {
                clearInterval(shootInterval);
                shootInterval = null;
            }
        });

        shootControl.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        // Ridimensionamento controlli
        const resizeControls = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const isLandscape = screenWidth > screenHeight;

            const joystickSize = isLandscape ?
                Math.min(screenHeight * 0.35, 160) :
                Math.min(screenWidth * 0.28, 160);

            joystickContainer.style.width = `${joystickSize}px`;
            joystickContainer.style.height = `${joystickSize}px`;
            joystickContainer.style.borderRadius = `${joystickSize/2}px`;

            const stickSize = joystickSize * 0.42;
            joystickStick.style.width = `${stickSize}px`;
            joystickStick.style.height = `${stickSize}px`;
            joystickStick.style.borderRadius = `${stickSize/2}px`;
            joystickStick.style.top = `${(joystickSize-stickSize)/2}px`;
            joystickStick.style.left = `${(joystickSize-stickSize)/2}px`;

            joystickCenterX = joystickSize / 2;
            joystickMaxDistance = joystickSize * 0.36;

            const shootSize = isLandscape ?
                Math.min(screenHeight * 0.38, 140) :
                Math.min(screenWidth * 0.32, 140);

            shootControl.style.width = `${shootSize}px`;
            shootControl.style.height = `${shootSize}px`;
            shootControl.style.fontSize = `${shootSize * 0.18}px`;
        };

        resizeControls();

        // Rimuovi vecchi event listeners se esistono
        if (resizeListener) {
            window.removeEventListener('resize', resizeListener);
        }
        if (orientationListener) {
            window.removeEventListener('orientationchange', orientationListener);
        }

        // Aggiungi nuovi event listeners
        resizeListener = resizeControls;
        orientationListener = () => setTimeout(resizeControls, 100);

        window.addEventListener('resize', resizeListener);
        window.addEventListener('orientationchange', orientationListener);

        return {
            container: touchControlsContainer,
            resize: resizeControls
        };
    }
    return null;
}

/**
 * Pulisce gli event listeners dei controlli touch
 */
export function cleanupTouchControls() {
    if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
        resizeListener = null;
    }
    if (orientationListener) {
        window.removeEventListener('orientationchange', orientationListener);
        orientationListener = null;
    }
    if (shootInterval) {
        clearInterval(shootInterval);
        shootInterval = null;
    }
}

/**
 * Configura gli event listeners per la tastiera
 */
export function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (GameState.gameActive) {
            if (e.key === 'ArrowLeft') {
                isMovingLeft = true;
            }
            if (e.key === 'ArrowRight') {
                isMovingRight = true;
            }
            if (e.key === ' ') {
                shoot();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') {
            isMovingLeft = false;
        }
        if (e.key === 'ArrowRight') {
            isMovingRight = false;
        }
    });
}
