// Inizializzazione variabili
const gameArea = document.getElementById('gameArea');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('gameOver');
const levelCompleteElement = document.getElementById('levelComplete');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const nextLevelButton = document.getElementById('nextLevelButton');
const temporaryMessageElement = document.getElementById('temporaryMessage');

let player, bullets, alienBullets, invaders, barriers, ufo;
let score = 0, lives = 3, level = 1, invaderDirection = 1, invaderSpeed = 1, lastAlienShootTime = 0, gameActive = true, powerup = 0, nextLifeScore = 5000, bulletsFrequency = 3;
let lastMessageScore = 0; // Aggiunta la variabile globale lastMessageScore

let touchStartX = 0;
let isShooting = false;
let isMovingLeft = false;
let isMovingRight = false;

const ufoScores = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100, 50];
let ufoScoreIndex = 0;
let shotsFired = 0;

let baseInvaderSpeed = 1;
let lastMoveTime = 0;
let alienMoveSound;
let alienSoundSequence = [0, 1, 2, 3]; // Sequenza di quattro toni leggermente diversi
let currentSequenceIndex = 0;
const alienSoundFrequencies = [55, 58, 62, 65]; // Frequenze in Hz per i 4 toni (molto più bassi)
let alienMoveInterval = 1000; // Intervallo iniziale tra i movimenti degli alieni (in ms)
let minAlienMoveInterval = 100; // Intervallo minimo tra i movimenti (in ms)

const alienTypes = ['👾', '👽', '👻'];
const alienPoints = [30, 20, 10];  // Punti per tipo di alieno, dall'alto verso il basso

// Configurazione dell'audio
let audioContext = null;
let audioContextStarted = false;

function initAudioContext() {
    if (!audioContextStarted) {
        audioContext = new (AudioContext || window.AudioContext)();
        audioContext.resume().then(() => {
            console.log('AudioContext started successfully');
            audioContextStarted = true;
        });
    }
}

// Aggiungi un listener per il primo gesto dell'utente
document.addEventListener('click', initAudioContext, { once: true });
document.addEventListener('touchstart', initAudioContext, { once: true });

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

// Funzione per creare il suono degli alieni
function createAlienMoveSound() {
    if (!audioContextStarted) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(alienSoundFrequencies[0], audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    return { oscillator, gainNode };
}

// Funzione per riprodurre il suono del movimento degli alieni
function playAlienMoveSound() {
    if (!audioContextStarted || !alienMoveSound) return;

    const soundDuration = 0.15;
    const currentTone = alienSoundSequence[currentSequenceIndex];
    
    alienMoveSound.oscillator.frequency.setValueAtTime(
        alienSoundFrequencies[currentTone], 
        audioContext.currentTime
    );
    
    alienMoveSound.gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    alienMoveSound.gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + soundDuration);
    
    currentSequenceIndex = (currentSequenceIndex + 1) % alienSoundSequence.length;
}

function shootSound() { playSound(880, 0.1, 'square'); }
function explosionSound() { playSound(110, 0.5, 'sawtooth'); }
function gameOverSound() { playSound(55, 2, 'triangle'); }
function alienShootSound() { playSound(440, 0.1, 'sine'); }
function ufoSound() { playSound(660, 0.1, 'sine'); }
function levelCompleteSound() { playSound(1320, 1, 'sine'); }
function powerupSound() { playSound(1320, 1, 'sine'); }
function lifeUpSound() { playSound(880, 1, 'triangle'); }

// Aggiungi questa funzione per mostrare messaggi temporanei
function showTemporaryMessage(message, duration = 2000) {
    console.log(`Showing message: ${message}`); // Debug
    temporaryMessageElement.textContent = message;
    temporaryMessageElement.style.display = 'block';
    
    // Forza un reflow del DOM
    void temporaryMessageElement.offsetWidth;
    
    setTimeout(() => {
        temporaryMessageElement.style.display = 'none';
        console.log("Message hidden"); // Debug
    }, duration);
}

function createElement(x, y, content, className = 'sprite') {
    const el = document.createElement('div');
    el.className = className;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = content;
    gameArea.appendChild(el);
    return el;
}

// Aggiungi questo script al tuo JavaScript
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
    window.addEventListener('error', function(e) {
        if (e.target.tagName === 'LINK' && e.target.rel === 'icon') {
            console.warn('Failed to load favicon. This is not critical for game functionality.');
            e.preventDefault(); // Previene la visualizzazione dell'errore nella console
        }
    }, true);
}

// Aggiungi questa funzione per creare i controlli touch
function createTouchControls() {
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
        }
        // Event listeners per i controlli touch
        const leftControl = document.getElementById('leftControl');
        const rightControl = document.getElementById('rightControl');
        const shootControl = document.getElementById('shootControl');
        
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
            shoot();
        });
    }
}

// Funzioni di movimento e sparo
function movePlayerLeft() {
    if (player.x > 10) {
        player.x -= 10;
        player.el.style.left = `${player.x}px`;
    }
}

function movePlayerRight() {
    if (player.x < 570) {
        player.x += 10;
        player.el.style.left = `${player.x}px`;
    }
}

function shoot() {
    if (bullets.length < bulletsFrequency) {
        bullets.push({
            x: player.x + 10,
            y: player.y - 20,
            el: createElement(player.x + 10, player.y - 20, '|', 'bullet sprite')
        });
        shootSound();
        shotsFired++;
        ufoScoreIndex = (shotsFired - 1) % 15; // Aggiorna l'indice del punteggio UFO
    }
}

function initGame() {
    // Rimuovi tutti gli elementi di gioco esistenti
    gameArea.innerHTML = '';
    
    // Ricrea gli elementi UI
    gameArea.appendChild(scoreElement);
    gameArea.appendChild(livesElement);
    gameArea.appendChild(levelElement);
    gameArea.appendChild(gameOverElement);
    gameArea.appendChild(levelCompleteElement);

    // Inizializzazione delle variabili di gioco
    player = { x: 300, y: 550, el: null };
    bullets = [];
    bulletsFrequency = 3;
    powerup = 0;
    nextLifeScore = 5000;
    alienBullets = [];
    invaders = [];
    barriers = [];
    ufo = { x: -30, y: 30, el: null, active: false };
    score = 0;
    lives = 3;
    level = 1;
    invaderDirection = 1;
    invaderSpeed = 1;
    lastMoveTime = 0;
    lastAlienShootTime = 0;
    gameActive = true;

    // Creazione elementi di gioco
    player.el = createElement(player.x, player.y, '🚀');
    createInvaders();
    createBarriers();
    createTouchControls();
    handleResize();
    resetShotsFired();

    // Aggiornamento UI
    updateUI();

    // Nascondi gli elementi di game over e level complete e i messaggi temporanei
    gameOverElement.style.display = 'none';
    levelCompleteElement.style.display = 'none';
    temporaryMessageElement.style.display = 'none';
}

function createInvaders() {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 11; j++) {
            const typeIndex = Math.floor(i / 2);
            const alienType = alienTypes[typeIndex];
            const points = alienPoints[typeIndex];
            invaders.push({
                x: j * 40 + 40,
                y: i * 40 + 40,
                type: alienType,
                points: points,
                el: createElement(j * 40 + 40, i * 40 + 40, alienType, 'alien sprite')
            });
        }
    }
}

function createBarriers() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 5; k++) {
                barriers.push(createElement(i * 150 + 75 + k * 10, 500 + j * 10, '▇', 'barrier'));
            }
        }
    }
}

function updateUI() {
    scoreElement.textContent = `Punteggio: ${score}`;
    livesElement.textContent = `Vite: ${lives}`;
    levelElement.textContent = `Livello: ${level}`;
}

let resizeTimeout;

function handleResize() {
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
    }, 250); // Aspetta 250ms prima di applicare il ridimensionamento
}

// Inizializza il gioco
initGame();

function moveInvaders() {
    const currentTime = Date.now();
    const invaderCount = invaders.length;

    // Calcola il nuovo intervallo di movimento basato sul numero di invasori rimasti
    alienMoveInterval = Math.max(
        minAlienMoveInterval,
        1000 - (55 - invaderCount) * 15
    );
    
    if (currentTime - lastMoveTime > alienMoveInterval) {
        playAlienMoveSound(); // Riproduci il suono ad ogni movimento
        
        let shouldChangeDirection = false;
        invaders.forEach(invader => {
            invader.x += invaderDirection * 10;
            if (invader.x < 10 || invader.x > 560) {
                shouldChangeDirection = true;
            }
            invader.el.style.left = `${invader.x}px`;
        });

        if (shouldChangeDirection) {
            invaderDirection *= -1;
            invaders.forEach(invader => {
                invader.y += 20;
                invader.el.style.top = `${invader.y}px`;
            });
        }

        lastMoveTime = currentTime;
    }
}

function alienShoot() {
    const currentTime = Date.now();
    if (currentTime - lastAlienShootTime > 1000 / (1 + level * 0.1) && invaders.length > 0) {
        const shooter = invaders[Math.floor(Math.random() * invaders.length)];
        alienBullets.push({
            x: shooter.x + 10,
            y: shooter.y + 20,
            el: createElement(shooter.x + 10, shooter.y + 20, '|', 'alien-bullet sprite')
        });
        alienShootSound();
        lastAlienShootTime = currentTime;
    }
}

function moveUfo() {
    if (!ufo.active && Math.random() < 0.002) {
        ufo.active = true;
        ufo.x = -30;
        ufo.el = createElement(ufo.x, ufo.y, '🛸', 'sprite');
        ufo.el.id = 'ufo';
    }

    if (ufo.active) {
        ufo.x += 2 + level * 0.5;
        ufo.el.style.left = `${ufo.x}px`;
        ufoSound();

        if (ufo.x > 600) {
            gameArea.removeChild(ufo.el);
            ufo.active = false;
        }
    }
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= 5;
        if (bullet.y < 0) {
            gameArea.removeChild(bullet.el);
            bullets.splice(index, 1);
        } else {
            bullet.el.style.top = `${bullet.y}px`;
        }
    });

    alienBullets.forEach((bullet, index) => {
        bullet.y += 5 + level;
        if (bullet.y > 600) {
            gameArea.removeChild(bullet.el);
            alienBullets.splice(index, 1);
        } else {
            bullet.el.style.top = `${bullet.y}px`;
        }
    });
}

function resetShotsFired() {
    shotsFired = 0;
    ufoScoreIndex = 0;
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        // Collisione con gli invasori
        invaders.forEach((invader, invaderIndex) => {
            if (Math.abs(bullet.x - invader.x) < 20 && Math.abs(bullet.y - invader.y) < 20) {
                gameArea.removeChild(invader.el);
                gameArea.removeChild(bullet.el);
                invaders.splice(invaderIndex, 1);
                bullets.splice(bulletIndex, 1);
                score += invader.points * level;
                updateUI();
                explosionSound();
            }
        });

        // Collisione con UFO
        if (ufo.active && Math.abs(bullet.x - ufo.x) < 20 && Math.abs(bullet.y - ufo.y) < 20) {
            gameArea.removeChild(ufo.el);
            gameArea.removeChild(bullet.el);
            bullets.splice(bulletIndex, 1);
            ufo.active = false;
            let ufoScore = ufoScores[ufoScoreIndex];
            score += ufoScore;
            updateUI();
            explosionSound();
            showTemporaryMessage(`UFO colpito! +${ufoScore} punti`);
        }

        // Collisione con barriere
        barriers.forEach((barrier, barrierIndex) => {
            const barrierRect = barrier.getBoundingClientRect();
            const bulletRect = bullet.el.getBoundingClientRect();
            if (bulletRect.left < barrierRect.right &&
                bulletRect.right > barrierRect.left &&
                bulletRect.top < barrierRect.bottom &&
                bulletRect.bottom > barrierRect.top) {
                gameArea.removeChild(bullet.el);
                bullets.splice(bulletIndex, 1);
                barrier.style.opacity = parseFloat(barrier.style.opacity || 1) - 0.25;
                if (parseFloat(barrier.style.opacity) <= 0) {
                    gameArea.removeChild(barrier);
                    barriers.splice(barrierIndex, 1);
                }
            }
        });
    });

    // Collisione proiettili alieni con giocatore e barriere
    alienBullets.forEach((bullet, bulletIndex) => {
        // Collisione con giocatore
        if (Math.abs(bullet.x - player.x) < 20 && Math.abs(bullet.y - player.y) < 20) {
            gameArea.removeChild(bullet.el);
            alienBullets.splice(bulletIndex, 1);
            lives--;
            updateUI();
            if (lives <= 0) {
                gameOver();
            }
        }

        // Collisione con barriere
        barriers.forEach((barrier, barrierIndex) => {
            const barrierRect = barrier.getBoundingClientRect();
            const bulletRect = bullet.el.getBoundingClientRect();
            if (bulletRect.left < barrierRect.right &&
                bulletRect.right > barrierRect.left &&
                bulletRect.top < barrierRect.bottom &&
                bulletRect.bottom > barrierRect.top) {
                gameArea.removeChild(bullet.el);
                alienBullets.splice(bulletIndex, 1);
                barrier.style.opacity = parseFloat(barrier.style.opacity || 1) - 0.25;
                if (parseFloat(barrier.style.opacity) <= 0) {
                    gameArea.removeChild(barrier);
                    barriers.splice(barrierIndex, 1);
                }
            }
        });
    });

    // Controllo se gli invasori hanno raggiunto il fondo
    invaders.forEach(invader => {
        if (invader.y > 530) {
            gameOver();
        }
    });

    // Controllo se tutti gli invasori sono stati eliminati
    if (invaders.length === 0) {
        levelComplete();
    }
}

function updatePlayerPosition() {
    const moveSpeed = 5;
    if (isMovingLeft && player.x > 10) {
        player.x -= moveSpeed;
    }
    if (isMovingRight && player.x < 570) {
        player.x += moveSpeed;
    }
    player.el.style.left = `${player.x}px`;
}


let gameLoopId;

function gameLoop() {
    if (gameActive) {
        updatePlayerPosition();
        moveInvaders();
        alienShoot();
        moveUfo();
        updateBullets();
        checkCollisions();
        checkScore();
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function startGame() {
    gameActive = true;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    gameLoop();
}

function stopGame() {
    gameActive = false;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
}

// Funzione per incrementare la frequenza di sparo e gestire il power-up
function checkScore() {
    console.log(`Checking score: ${score}`); // Debug
    // Mostra il messaggio solo se il punteggio è un multiplo di 500 e differente dall'ultimo punteggio per cui il messaggio è stato mostrato
    if (score % 500 === 0 && score > 0 && score !== lastMessageScore) {
        showTemporaryMessage(`Test message at ${score} points!`);
        lastMessageScore = score; // Aggiorna il punteggio dell'ultimo messaggio mostrato
    }
    if (score >= 1000 * (powerup + 1)) { // Incremento ogni 1000 punti
        bulletsFrequency += 1 * level;
        powerup += 1;
        powerupSound();
        showTemporaryMessage(`Power-up! Frequenza di sparo aumentata!`);
    }
    if (score >= nextLifeScore) { // Guadagna una vita ogni 5000 punti
        lives += 1;
        updateUI(); // Aggiorna la UI per mostrare la nuova vita
        nextLifeScore += 5000; // Imposta il prossimo punteggio per guadagnare una vita
        lifeUpSound(); // Suono per il guadagno di una vita
        showTemporaryMessage(`Vita extra guadagnata!`);
    }
}

document.addEventListener('keydown', (e) => {
    if (gameActive) {
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

function gameOver() {
    console.log("Game over!"); // Debug
    gameActive = false;
    gameOverSound();
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

function levelComplete() {
    console.log("Level complete!"); // Debug
    gameActive = false;
    levelCompleteSound();
    level++;
    levelCompleteElement.style.display = 'block';
}

function startNextLevel() {
    console.log("Inizio startNextLevel, livello:", level);

    const touchControlsContainer = document.getElementById('touchControlsContainer');

    // Pulizia e reinizializzazione
    cleanupGameArea(touchControlsContainer);
    resetGameVariables();

    // Creazione nuovi elementi di gioco
    createGameElements(touchControlsContainer);

    // Aggiornamento UI e avvio del gioco
    updateUIElements();
    startGameLoop();

    console.log("Fine startNextLevel, livello:", level);
}

function cleanupGameArea(touchControlsContainer) {
    console.log("Pulizia area di gioco");
    const elementsToKeep = [touchControlsContainer, scoreElement, livesElement, levelElement].filter(Boolean);
    Array.from(gameArea.children).forEach(child => {
        if (!elementsToKeep.includes(child)) {
            gameArea.removeChild(child);
        }
    });
    levelCompleteElement.style.display = 'none';
}

function resetGameVariables() {
    console.log("Reset variabili di gioco");
    bullets = [];
    alienBullets = [];
    invaders = [];
    barriers = [];
    ufo = { x: -30, y: 30, el: null, active: false };
    invaderDirection = 1;
    invaderSpeed = 1 + (level - 1) * 0.2;
    lastMoveTime = 0;
    lastAlienShootTime = 0;
    baseInvaderSpeed = 1 + (level - 1) * 0.2;
    resetShotsFired();
}

function createGameElements(touchControlsContainer) {
    console.log("Creazione elementi di gioco");
    player = { x: 300, y: 550, el: createElement(300, 550, '🚀') };
    gameArea.appendChild(player.el);
    
    console.log("Creazione invasori");
    createInvaders();
    
    console.log("Creazione barriere");
    createBarriers();
    
    console.log("Creazione controlli touch");
    createTouchControls();

    if (touchControlsContainer && !gameArea.contains(touchControlsContainer)) {
        gameArea.appendChild(touchControlsContainer);
    }
}

function updateUIElements() {
    console.log("Aggiornamento elementi UI");
    [scoreElement, livesElement, levelElement].forEach(el => {
        gameArea.appendChild(el);
        el.style.display = 'block';
    });
    updateUI();
}

function startGameLoop() {
    console.log("Avvio loop di gioco");
    gameActive = true;
    requestAnimationFrame(gameLoop);
}

nextLevelButton.addEventListener('click', () => {
    console.log("Pulsante Prossimo Livello cliccato");
    startNextLevel();
    console.log("Fine startNextLevel, livello:", level);
  });

restartButton.addEventListener('click', () => {
    gameOverElement.style.display = 'none';
    initGame();
    gameLoop();
});

// Funzione per gestire il ridimensionamento della finestra
window.addEventListener('resize', () => requestAnimationFrame(handleResize));
window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));

handleResize();
startGame(); // Assicurati che il gioco inizi automaticamente
