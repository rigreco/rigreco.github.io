// Elementi UI
let scoreElement;
let livesElement;
let levelElement;
let hiScoreElement;
const gameArea = document.getElementById('gameArea');
const gameOverElement = document.getElementById('gameOver');
const levelCompleteElement = document.getElementById('levelComplete');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const nextLevelButton = document.getElementById('nextLevelButton');
let temporaryMessageElement = document.getElementById('temporaryMessage');

// Elementi di gioco
let player, bullets, alienBullets, invaders, barriers, ufo;

// Stato del gioco
let score = 0, lives = 3, level = 1, gameActive = true;
let gameState = 'intro';
let hiScore = 0;
let gameLoopId;

// Configurazione del gioco
let invaderDirection = 1, invaderSpeed = 1;
let powerup = 0, nextLifeScore = 5000, bulletsFrequency = 3;
let baseInvaderSpeed = 1;
let alienMoveInterval = 1000;
let minAlienMoveInterval = 100;

// Tempistiche e controlli
let lastAlienShootTime = 0;
let lastMoveTime = 0;
let lastMessageScore = 0;
let touchStartX = 0;
let isShooting = false;
let isMovingLeft = false;
let isMovingRight = false;

// Punteggi e statistiche
const ufoScores = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100, 50];
let ufoScoreIndex = 0;
let shotsFired = 0;
let highScores = [
    { name: 'AAA', score: 0 },
    { name: 'BBB', score: 0 },
    { name: 'CCC', score: 0 }
];

// Tipi di alieni e punti
const alienTypes = ['👾', '👽', '👻'];
const alienPoints = [30, 20, 10];

// Audio
let audioContext = null;
let audioContextStarted = false;
let alienMoveSound;
let alienSoundSequence = [0, 1, 2, 3];
let currentSequenceIndex = 0;
const alienSoundFrequencies = [55, 58, 62, 65];

// Gestione del ridimensionamento
let resizeTimeout;

// Inizializza il gioco
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
    // 0.2, 0.01 sono i valori di inizio e fine del volume, valori di prima
    alienMoveSound.gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    alienMoveSound.gainNode.gain.exponentialRampToValueAtTime(0.04, audioContext.currentTime + soundDuration);
    
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
function playerExplosionSound() { playSound(220, 0.5, 'triangle'); }

// Aggiungi questa funzione per mostrare messaggi temporanei
function showTemporaryMessage(message, duration = 2000) {
    console.log(`Showing message: ${message}`); // Debug
    
    if (!temporaryMessageElement) {
        temporaryMessageElement = document.createElement('div');
        temporaryMessageElement.id = 'temporaryMessage';
        temporaryMessageElement.style.position = 'absolute';
        temporaryMessageElement.style.top = '10%';
        temporaryMessageElement.style.left = '50%';
        temporaryMessageElement.style.transform = 'translateX(-50%)';
        temporaryMessageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        temporaryMessageElement.style.color = 'white';
        temporaryMessageElement.style.padding = '10px';
        temporaryMessageElement.style.borderRadius = '5px';
        temporaryMessageElement.style.zIndex = '9999';
        temporaryMessageElement.style.transition = 'opacity 0.3s';
        gameArea.appendChild(temporaryMessageElement);
    }

    temporaryMessageElement.textContent = message;
    temporaryMessageElement.style.display = 'block';
    temporaryMessageElement.style.opacity = '1';

    clearTimeout(temporaryMessageElement.hideTimer);
    temporaryMessageElement.hideTimer = setTimeout(() => {
        temporaryMessageElement.style.opacity = '0';
        setTimeout(() => {
            temporaryMessageElement.style.display = 'none';
        }, 300);
    }, duration);
}

//*************************** */
function showIntroScreen() {
    console.log("Showing intro screen");
    gameState = 'intro'; // Assicurati che lo stato del gioco sia corretto
    gameArea.innerHTML = `
        <div id="introScreen" style="color: white; text-align: center; padding-top: 100px;">
            <h1>SPACE INVADERS</h1>
            <div id="introHiScore">HI-SCORE ${hiScore.toString().padStart(5, '0')}</div>
            <div>*SCORE ADVANCE TABLE*</div>
            <div>🛸 = ? MYSTERY</div>
            <div>👾 = 30 POINTS</div>
            <div>👽 = 20 POINTS</div>
            <div>👻 = 10 POINTS</div>
            <button id="startButton" style="margin-top: 20px;">PLAY</button>
            <button id="highScoresButton" style="margin-top: 20px;">HIGH SCORES</button>
        </div>
    `;
    document.getElementById('startButton').addEventListener('click', startGameFromIntro);
    document.getElementById('highScoresButton').addEventListener('click', showHighScores);
}



//function startGameFromIntro() {
//    gameState = 'playing';
//    initGame();
//    gameLoop();
//}

function startGameFromIntro() {
    console.log("Starting game from intro");
    initGame();
    changeGameState('playing');
}

function showHighScores() {
    console.log("Showing high scores");
    gameState = 'highScores';
    gameArea.innerHTML = `
        <div id="highScoreScreen" style="color: white; text-align: center; padding-top: 100px;">
            <h2>HIGH SCORES</h2>
            ${highScores.map((score, index) => `
                <div>${(index + 1).toString().padStart(2, '0')}. ${score.name.padEnd(3, ' ')} ${score.score.toString().padStart(5, '0')}</div>
            `).join('')}
            <button id="backToIntroButton" style="margin-top: 20px;">BACK</button>
        </div>
    `;
    document.getElementById('backToIntroButton').addEventListener('click', showIntroScreen);
}

function checkHighScore(score) {
    const lowestHighScore = highScores[highScores.length - 1].score;
    if (score > lowestHighScore) {
        return true;
    }
    return false;
}

function addHighScore(name, score) {
    // Assicuriamoci che il nome sia esattamente di 3 caratteri
    name = name.padEnd(3, ' ').substr(0, 3).toUpperCase();
    
    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 3);  // Mantieni solo i primi 3
}

// Modifica la funzione promptForName
function promptForName(score) {
    let name = prompt(`New high score: ${score}! Enter your initials (3 letters):`);
    
    name = name ? name.slice(0, 3).toUpperCase() : 'AAA';
    
    while (name.length < 3) {
        name += 'A';
    }
    
    addHighScore(name, score);
    showHighScores();
}

//********************************** */



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

/// ***------********* */
// Menu di gioco
function changeGameState(newState) {
    console.log(`Changing game state from ${gameState} to ${newState}`);
    if (gameState === newState) return;
    gameState = newState;
    switch (newState) {
        case 'intro':
            showIntroScreen();
            break;
        case 'playing':
            startGame();
            break;
        case 'gameOver':
            showGameOver(score);
            break;
        case 'levelComplete':
            showLevelComplete();
            break;
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


function initUI() {
    const uiContainer = document.getElementById('uiContainer');
    uiContainer.innerHTML = ''; // Pulisce l'UI esistente

    scoreElement = createUIElement('score', `SCORE ${score.toString().padStart(5, '0')}`);
    hiScoreElement = createUIElement('hi-score', `HI-SCORE ${hiScore.toString().padStart(5, '0')}`);
    livesElement = createUIElement('lives', `LIVES ${lives}`);
    levelElement = createUIElement('level', `LEVEL ${level}`);

    uiContainer.appendChild(scoreElement);
    uiContainer.appendChild(hiScoreElement);
    uiContainer.appendChild(livesElement);
    uiContainer.appendChild(levelElement);
}

function createUIElement(id, text) {
    const element = document.createElement('div');
    element.id = id;
    element.textContent = text;
    return element;
}

function initGame() {
    console.log("Inizializzazione del gioco");
    
    // Rimuovi tutti gli elementi di gioco esistenti, tranne quelli permanenti
    while (gameArea.firstChild) {
        if (gameArea.firstChild.id !== 'gameOver' && 
            gameArea.firstChild.id !== 'levelComplete' && 
            gameArea.firstChild.id !== 'temporaryMessage') {
            gameArea.removeChild(gameArea.firstChild);
        } else {
            gameArea.firstChild.style.display = 'none';
        }
    }

    // Inizializzazione delle variabili di gioco
    score = 0;
    lives = 3;
    level = 1;
    invaderDirection = 1;
    invaderSpeed = 1;
    lastMoveTime = 0;
    lastAlienShootTime = 0;
    gameActive = true;
    bulletsFrequency = 3;
    powerup = 0;
    nextLifeScore = 5000;

    // Creazione degli elementi UI
    scoreElement = createElement(10, 10, `SCORE ${score.toString().padStart(5, '0')}`);
    hiScoreElement = createElement(200, 10, `HI-SCORE ${hiScore.toString().padStart(5, '0')}`);
    livesElement = createElement(450, 10, `LIVES ${lives}`);
    levelElement = createElement(300, 10, `LEVEL ${level}`);
    
    gameArea.appendChild(scoreElement);
    gameArea.appendChild(hiScoreElement);
    gameArea.appendChild(livesElement);
    gameArea.appendChild(levelElement);

    // Creazione elementi di gioco
    player = { x: 300, y: 550, el: createElement(300, 550, '🚀') };
    bullets = [];
    alienBullets = [];
    invaders = [];
    barriers = [];
    ufo = { x: -30, y: 30, el: null, active: false };

    createInvaders();
    createBarriers();
    createTouchControls();

    // Inizializza l'audio context se non è già stato fatto
    if (!audioContextStarted) {
        initAudioContext();
    }

    // Crea il suono del movimento degli alieni
    if (audioContextStarted) {
        alienMoveSound = createAlienMoveSound();
    }

    handleResize();
    resetShotsFired();

    console.log("Inizializzazione del gioco completata");
    changeGameState('playing');
}

// Assicurati che queste funzioni siano definite altrove nel tuo codice
function createElement(x, y, content, className = 'sprite') {
    const el = document.createElement('div');
    el.className = className;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = content;
    gameArea.appendChild(el);
    return el;
}

function updateUI() {
    scoreElement.textContent = `SCORE ${score.toString().padStart(5, '0')}`;
    hiScoreElement.textContent = `HI-SCORE ${hiScore.toString().padStart(5, '0')}`;
    livesElement.textContent = `LIVES ${lives}`;
    levelElement.textContent = `LEVEL ${level}`;
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
    if (scoreElement) scoreElement.textContent = `SCORE ${score.toString().padStart(5, '0')}`;
    if (hiScoreElement) hiScoreElement.textContent = `HI-SCORE ${hiScore.toString().padStart(5, '0')}`;
    if (livesElement) livesElement.textContent = `LIVES ${lives}`;
    if (levelElement) levelElement.textContent = `LEVEL ${level}`;
}

// Aggiungi questa funzione
function updateHiScore() {
    if (score > hiScore) {
        hiScore = score;
        updateUI();
    }
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
    // Assicurati che temporaryMessageElement mantenga la sua posizione
    if (temporaryMessageElement) {
        temporaryMessageElement.style.top = '10%';
        temporaryMessageElement.style.left = '50%';
        temporaryMessageElement.style.transform = 'translateX(-50%)';
    }
}

// Inizializza il gioco
//initGame();

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
                
                // Aggiorna il punteggio basandosi sul tipo di invasore
                let points;
                switch(invader.type) {
                    case '👾': points = 30; break;
                    case '👽': points = 20; break;
                    case '👻': points = 10; break;
                    default: points = 10;
                }
                
                score += points * level;
                updateHiScore();
                updateUI();
                
                invaders.splice(invaderIndex, 1);
                bullets.splice(bulletIndex, 1);
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
            updateHiScore();
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
            playerExplosionSound();
            if (lives <= 0) {
                console.log("Vite esaurite, chiamata a gameOver");
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



function gameLoop() {
    if (gameActive) {
        updatePlayerPosition();
        moveInvaders();
        alienShoot();
        moveUfo();
        updateBullets();
        checkCollisions();
        checkScore();
    gameLoopId = requestAnimationFrame(gameLoop);
    } else {
        console.log("Game loop terminato");
        cancelAnimationFrame(gameLoopId);
    }
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
        showTemporaryMessage(`Test message at ${score} points!`, 3000);
        lastMessageScore = score; // Aggiorna il punteggio dell'ultimo messaggio mostrato
    }
    if (score >= 1000 * (powerup + 1)) { // Incremento ogni 1000 punti
        bulletsFrequency += 1 * level;
        powerup += 1;
        powerupSound();
        console.log("Powerup triggered"); // Debug
        showTemporaryMessage(`Power-up! Frequenza di sparo aumentata!`, 3000);  // Mostra per 3 secondi
    }
    if (score >= nextLifeScore) {
        lives += 1;
        updateUI();
        nextLifeScore += 5000;
        lifeUpSound();
        showTemporaryMessage(`Vita extra guadagnata! Vite attuali: ${lives}`, 3000);  // Mostra per 3 secondi
        flashLivesIndicator();  // Implementa questa funzione per far lampeggiare l'indicatore delle vite
    }
}

function flashLivesIndicator() {
    const originalColor = livesElement.style.color;
    livesElement.style.color = 'yellow';
    setTimeout(() => {
        livesElement.style.color = originalColor;
    }, 500);
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
    console.log("Inizio gameOver");
    gameActive = false;
    cancelAnimationFrame(gameLoopId);
    
    try {
        gameOverSound();
    } catch (error) {
        console.error("Errore durante la riproduzione del suono di game over:", error);
    }
    
    updateHiScore();

    if (alienMoveSound && alienMoveSound.oscillator) {
        alienMoveSound.oscillator.stop();
    }
    
    console.log("Fine gameOver");
    showGameOver(score);  // Chiamiamo direttamente showGameOver
}


function restartGame() {
    console.log("Riavvio del gioco");
    initGame();
    changeGameState('playing');
}

function showGameOver(finalScore) {
    console.log("Mostra schermata Game Over");
    let gameOverElement = document.getElementById('gameOver');
    if (!gameOverElement) {
        gameOverElement = document.createElement('div');
        gameOverElement.id = 'gameOver';
        gameOverElement.style.position = 'absolute';
        gameOverElement.style.top = '50%';
        gameOverElement.style.left = '50%';
        gameOverElement.style.transform = 'translate(-50%, -50%)';
        gameOverElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
        gameOverElement.style.padding = '20px';
        gameOverElement.style.borderRadius = '10px';
        gameOverElement.style.textAlign = 'center';
        gameOverElement.style.color = 'white';
        gameArea.appendChild(gameOverElement);
    }
    gameOverElement.innerHTML = `
        <h2>Game Over!</h2>
        <p>Punteggio Finale: ${finalScore}</p>
        <button id="continueButton">Continua</button>
    `;
    gameOverElement.style.display = 'block';
    
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.removeEventListener('click', onContinueClick);
        continueButton.addEventListener('click', onContinueClick);
    }

    function onContinueClick() {
        promptForName(finalScore);
    }

    console.log("Schermata Game Over visualizzata");
}


function levelComplete() {
    console.log(`Inizio levelComplete, livello attuale: ${level}`);
    gameActive = false;
    cancelAnimationFrame(gameLoopId);

    try {
        levelCompleteSound();
    } catch (error) {
        console.error("Errore durante la riproduzione del suono di livello completato:", error);
    }

    level++;
    console.log(`Passaggio al livello ${level}`);

    // Mostra la schermata di livello completato
    showLevelComplete();

    if (alienMoveSound && alienMoveSound.oscillator) {
        alienMoveSound.oscillator.stop();
    }

    console.log("Fine levelComplete");

    changeGameState('levelComplete');
}

function showLevelComplete() {
    console.log("Mostra schermata Livello Completato");
    let levelCompleteElement = document.getElementById('levelComplete');
    if (!levelCompleteElement) {
        levelCompleteElement = document.createElement('div');
        levelCompleteElement.id = 'levelComplete';
        levelCompleteElement.style.position = 'absolute';
        levelCompleteElement.style.top = '50%';
        levelCompleteElement.style.left = '50%';
        levelCompleteElement.style.transform = 'translate(-50%, -50%)';
        levelCompleteElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
        levelCompleteElement.style.padding = '20px';
        levelCompleteElement.style.borderRadius = '10px';
        levelCompleteElement.style.textAlign = 'center';
        gameArea.appendChild(levelCompleteElement);
    }
    levelCompleteElement.innerHTML = `
        Livello ${level - 1} Completato!<br>
        <button id="nextLevelButton">Prossimo Livello</button>
    `;
    levelCompleteElement.style.display = 'block';
    
    const nextLevelButton = document.getElementById('nextLevelButton');
    if (nextLevelButton) {
        nextLevelButton.removeEventListener('click', startNextLevel);
        nextLevelButton.addEventListener('click', startNextLevel);
    }
}

function startNextLevel() {
    console.log("Inizio startNextLevel, livello:", level);

    const touchControlsContainer = document.getElementById('touchControlsContainer');

    // Nascondi la schermata di livello completato
    const levelCompleteElement = document.getElementById('levelComplete');
    if (levelCompleteElement) {
        levelCompleteElement.style.display = 'none';
    }

    // Pulizia e reinizializzazione
    cleanupGameArea(touchControlsContainer);
    resetGameVariables();

    // Creazione nuovi elementi di gioco
    createGameElements(touchControlsContainer);

    // Aggiornamento UI e avvio del gioco
    updateUI();
    //updateUIElements();
    startGameLoop();

    // Assicurati che il gioco sia attivo
    gameActive = true;

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

// function updateUIElements() {
//     console.log("Aggiornamento elementi UI");
//     updateUI();
//     scoreElement.style.display = 'block';
//     livesElement.style.display = 'block';
//     levelElement.style.display = 'block';
// }

function startGameLoop() {
    console.log("Avvio loop di gioco");
    gameActive = true;
    requestAnimationFrame(gameLoop);
}

// restartButton.addEventListener('click', () => {
//     gameOverElement.style.display = 'none';
//     initGame();
//     gameLoop();
// });

restartButton.addEventListener('click', restartGame);

// Funzione per gestire il ridimensionamento della finestra
window.addEventListener('resize', () => requestAnimationFrame(handleResize));
window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));

//handleResize();
////startGame(); // Assicurati che il gioco inizi automaticamente
//showIntroScreen();

window.addEventListener('load', () => {
    console.log("Window loaded");
    handleResize();
    showIntroScreen(); // Chiamiamo direttamente showIntroScreen invece di changeGameState
});