// ui.js

// UI Elements
export const gameArea = document.getElementById('gameArea');
export const scoreElement = document.getElementById('score');
export const livesElement = document.getElementById('lives');
export const levelElement = document.getElementById('level');
export const gameOverElement = document.getElementById('gameOver');
export const levelCompleteElement = document.getElementById('levelComplete');
export const finalScoreElement = document.getElementById('finalScore');
export const restartButton = document.getElementById('restartButton');
export const nextLevelButton = document.getElementById('nextLevelButton');
export const temporaryMessageElement = document.getElementById('temporaryMessage');

// Input state
export let isMovingLeft = false;
export let isMovingRight = false;

// Audio context
let audioContext = null;
let audioContextStarted = false;

// UI update functions
export function updateUI(score, lives, level) {
    scoreElement.textContent = `Punteggio: ${score}`;
    livesElement.textContent = `Vite: ${lives}`;
    levelElement.textContent = `Livello: ${level}`;
}

export function showGameOver(score) {
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

export function showLevelComplete() {
    levelCompleteElement.style.display = 'block';
}

export function hideGameOver() {
    gameOverElement.style.display = 'none';
}

export function hideLevelComplete() {
    levelCompleteElement.style.display = 'none';
}

export function showTemporaryMessage(message, duration = 2000) {
    temporaryMessageElement.textContent = message;
    temporaryMessageElement.style.display = 'block';
    setTimeout(() => {
        temporaryMessageElement.style.display = 'none';
    }, duration);
}

// Input handling
export function setupInputListeners(shootCallback) {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') isMovingLeft = true;
        if (e.key === 'ArrowRight') isMovingRight = true;
        if (e.key === ' ') shootCallback();
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') isMovingLeft = false;
        if (e.key === 'ArrowRight') isMovingRight = false;
    });

    // Touch controls setup (simplified version)
    createTouchControls(shootCallback);
}

export function createTouchControls(shootCallback) {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        if (!document.getElementById('touchControlsContainer')) {
            const touchControlsContainer = document.createElement('div');
            touchControlsContainer.id = 'touchControlsContainer';
            touchControlsContainer.style.position = 'absolute';
            touchControlsContainer.style.bottom = '20px';
            touchControlsContainer.style.left = '0';
            touchControlsContainer.style.width = '100%';
            touchControlsContainer.style.display = 'flex';
            touchControlsContainer.style.justifyContent = 'space-between';
            touchControlsContainer.style.padding = '0 20px';

            const leftControl = document.createElement('div');
            leftControl.id = 'leftControl';
            leftControl.className = 'touch-control';
            leftControl.textContent = '←';

            const rightControl = document.createElement('div');
            rightControl.id = 'rightControl';
            rightControl.className = 'touch-control';
            rightControl.textContent = '→';

            const shootControl = document.createElement('div');
            shootControl.id = 'shootControl';
            shootControl.className = 'touch-control';
            shootControl.textContent = 'Spara';

            touchControlsContainer.appendChild(leftControl);
            touchControlsContainer.appendChild(shootControl);
            touchControlsContainer.appendChild(rightControl);

            gameArea.appendChild(touchControlsContainer);

            // Aggiungi gli event listener per i controlli touch
            leftControl.addEventListener('touchstart', (e) => {
                e.preventDefault();
                isMovingLeft = true;
            });
            leftControl.addEventListener('touchend', (e) => {
                e.preventDefault();
                isMovingLeft = false;
            });
            
            rightControl.addEventListener('touchstart', (e) => {
                e.preventDefault();
                isMovingRight = true;
            });
            rightControl.addEventListener('touchend', (e) => {
                e.preventDefault();
                isMovingRight = false;
            });
            
            shootControl.addEventListener('touchstart', (e) => {
                e.preventDefault();
                shootCallback();
            });
        }
    }
}

// Audio functions
export function initAudioContext() {
    if (!audioContextStarted) {
        audioContext = new (AudioContext || window.AudioContext)();
        audioContext.resume().then(() => {
            audioContextStarted = true;
        });
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (!audioContextStarted) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

export const shootSound = () => playSound(880, 0.1, 'square');
export const explosionSound = () => playSound(110, 0.5, 'sawtooth');
export const gameOverSound = () => playSound(55, 2, 'triangle');
export const alienShootSound = () => playSound(440, 0.1, 'sine');
export const ufoSound = () => playSound(660, 0.1, 'sine');
export const levelCompleteSound = () => playSound(1320, 1, 'sine');
export const powerupSound = () => playSound(1320, 1, 'sine');
export const lifeUpSound = () => playSound(880, 1, 'triangle');

// Resize handling
let resizeTimeout;
export function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const gameAreaRect = gameArea.getBoundingClientRect();
        const scale = Math.min(
            window.innerWidth / gameAreaRect.width,
            window.innerHeight / gameAreaRect.height
        );
        gameArea.style.transform = `scale(${scale})`;

        const touchControlsContainer = document.getElementById('touchControlsContainer');
        if (touchControlsContainer) {
            touchControlsContainer.style.display = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'flex' : 'none';
        }
    }, 250);
}

// Event listeners for resize
window.addEventListener('resize', () => requestAnimationFrame(handleResize));
window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));