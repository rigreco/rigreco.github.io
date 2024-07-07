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
console.log("temporaryMessageElement:", temporaryMessageElement);

let player, bullets, alienBullets, invaders, barriers, ufo;
let score, lives, level, invaderDirection, invaderSpeed, lastMoveTime, lastAlienShootTime, gameActive, powerup, nextLifeScore, bulletsFrequency;

let touchStartX = 0;
let isShooting = false;

let isMovingLeft = false;
let isMovingRight = false;

const alienTypes = ['👾', '👽', '👻'];
const alienPoints = [10, 20, 30];

// Configurazione dell'audio
const audioContext = new (AudioContext || window.AudioContext)();

let audioContextStarted = false;

document.addEventListener('click', function() {
    if (!audioContextStarted) {
        audioContext.resume().then(() => {
            console.log('AudioContext started successfully');
            audioContextStarted = true;
        });
    }
}, { once: true });

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

function shootSound() { playSound(880, 0.1, 'square'); }
function explosionSound() { playSound(110, 0.5, 'sawtooth'); }
function gameOverSound() { playSound(55, 2, 'triangle'); }
function alienShootSound() { playSound(440, 0.1, 'sine'); }
function ufoSound() { playSound(660, 0.1, 'sine'); }
function levelCompleteSound() { playSound(1320, 1, 'sine'); }
function powerupSound() { playSound(1320, 1, 'sine'); }
function lifeUpSound() { playSound(880, 1, 'tr'); }

// Aggiungi questa funzione per mostrare messaggi temporanei
function showTemporaryMessage(message, duration = 2000) {
    console.log("Showing message:", message);
    temporaryMessageElement.textContent = message;
    temporaryMessageElement.style.display = 'block';
    
    // Forza un reflow del DOM
    void temporaryMessageElement.offsetWidth;
    
    console.log("Message element:", temporaryMessageElement);
    setTimeout(() => {
        temporaryMessageElement.style.display = 'none';
        console.log("Message hidden");
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
            const alienType = alienTypes[Math.floor(i / 2)];
            invaders.push({
                x: j * 40 + 40,
                y: i * 40 + 40,
                type: alienType,
                points: alienPoints[Math.floor(i / 2)],
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

// Inizializza il gioco
initGame();

function moveInvaders() {
    const currentTime = Date.now();
    if (currentTime - lastMoveTime > 500 / (invaderSpeed + level - 1)) {
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
            invaderSpeed += 0.1;
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
            score += 100 * level;
            updateUI();
            explosionSound();
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
    requestAnimationFrame(gameLoop);
}

// Funzione per incrementare la frequenza di sparo e gestire il power-up
function checkScore() {
    console.log("Checking score:", score); // Aggiunto per debug

    // Mostra il messaggio ogni 500 punti invece di ogni 100
    if (score % 500 === 0 && score > 0) {
        showTemporaryMessage(`Test message at ${score} points!`);
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

// Avvia il loop di gioco
gameLoop();

document.addEventListener('keydown', (e) => {
    if (gameActive) {
        if (e.key === 'ArrowLeft') {
            movePlayerLeft();
        }
        if (e.key === 'ArrowRight') {
            movePlayerRight();
        }
        if (e.key === ' ' && bullets.length < bulletsFrequency) {
            shoot();
        }
    }
});

function gameOver() {
    gameActive = false;
    gameOverSound();
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

function levelComplete() {
    gameActive = false;
    levelCompleteSound();
    level++;
    levelCompleteElement.style.display = 'block';
}

function startNextLevel() {
    // Salva il contenitore dei controlli touch
    const touchControlsContainer = document.getElementById('touchControlsContainer');

        // Rimuovi tutti gli elementi di gioco esistenti, tranne i controlli touch
        Array.from(gameArea.children).forEach(child => {
        if (child.id !== 'touchControlsContainer') {
            gameArea.removeChild(child);
        }
    });

    // Resetta le variabili di gioco
    bullets = [];
    alienBullets = [];
    invaders = [];
    barriers = [];
    ufo = { x: -30, y: 30, el: null, active: false };
    invaderDirection = 1;
    invaderSpeed = 1 + (level - 1) * 0.2;
    lastMoveTime = 0;
    lastAlienShootTime = 0;

    // Ricrea gli elementi di gioco
    player.el = createElement(player.x, player.y, '🚀');
    createInvaders();
    createBarriers();

    // Se i controlli touch erano presenti, assicurati che siano ancora nel gameArea
    if (touchControlsContainer && !gameArea.contains(touchControlsContainer)) {
        gameArea.appendChild(touchControlsContainer);
    }


    // Aggiorna l'UI
    updateUI();

    // Nascondi il messaggio di completamento livello
    levelCompleteElement.style.display = 'none';

    // Riattiva il gioco
    gameActive = true;
    gameLoop();
    createTouchControls();
    handleResize();
}

restartButton.addEventListener('click', () => {
    gameOverElement.style.display = 'none';
    initGame();
    gameLoop();
});

nextLevelButton.addEventListener('click', () => {
    startNextLevel();
});

// Funzione per gestire il ridimensionamento della finestra
function handleResize() {
    const gameAreaRect = gameArea.getBoundingClientRect();
    const scale = Math.min(
        window.innerWidth / gameAreaRect.width,
        window.innerHeight / gameAreaRect.height
    );
    gameArea.style.transform = `scale(${scale})`;

    // Mostra/nascondi i controlli touch basandoti sulla presenza del touch, non sulla larghezza dello schermo
    const touchControlsContainer = document.getElementById('touchControlsContainer');
    if (touchControlsContainer) {
        touchControlsContainer.style.display = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'flex' : 'none';
    }

}

// Aggiungi l'event listener per il ridimensionamento
window.addEventListener('resize', () => requestAnimationFrame(handleResize));
window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));

// Chiamala una volta all'inizio per impostare la scala corretta
handleResize();