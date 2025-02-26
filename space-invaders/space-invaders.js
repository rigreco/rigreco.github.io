// Elementi UI
let scoreElement;
let livesElement;
let levelElement;
let hiScoreElement;
const gameArea = document.getElementById('gameArea');
const temporaryMessageElement = document.getElementById('temporaryMessage');

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
    if (!audioContextStarted || !audioContext) return;
    
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
    
    try {
        alienMoveSound.oscillator.frequency.setValueAtTime(
            alienSoundFrequencies[currentTone], 
            audioContext.currentTime
        );
        // Volume più alto e decadimento più lungo per migliore percezione
        alienMoveSound.gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
        alienMoveSound.gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + soundDuration);
        
        currentSequenceIndex = (currentSequenceIndex + 1) % alienSoundSequence.length;
    } catch (e) {
        console.warn("Errore nella riproduzione del suono degli alieni:", e);
        // Ricrea il suono se c'è stato un errore
        if (audioContextStarted) {
            try {
                alienMoveSound = createAlienMoveSound();
            } catch (err) {
                console.error("Impossibile ricreare il suono degli alieni:", err);
            }
        }
    }
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

// Funzione migliorata per mostrare messaggi temporanei
function showTemporaryMessage(message, duration = 2000) {
    // Se l'elemento esiste già, lo rimuoviamo per crearne uno nuovo
    const existingMsg = document.getElementById('temporaryMessage');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Creiamo un nuovo elemento per il messaggio
    const messageElement = document.createElement('div');
    messageElement.id = 'temporaryMessage';
    messageElement.className = 'message';
    messageElement.textContent = message;
    
    // Aggiungiamo stile inline per garantire la visibilità
    messageElement.style.position = 'absolute';
    messageElement.style.top = '200px';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translateX(-50%)';
    messageElement.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    messageElement.style.color = 'white';
    messageElement.style.padding = '15px 30px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.fontSize = '24px';
    messageElement.style.textAlign = 'center';
    messageElement.style.zIndex = '10000';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.border = '2px solid white';
    messageElement.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    
    // Aggiungiamo l'elemento al gameArea
    gameArea.appendChild(messageElement);
    
    // Impostiamo un timer per rimuovere il messaggio
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, duration);
    
    return messageElement;
}

//*************************** */
function showIntroScreen() {
    console.log("Showing intro screen");
    gameState = 'intro'; // Assicurati che lo stato del gioco sia corretto
    gameArea.innerHTML = `
        <div id="introScreen" style="color: white; text-align: center; padding-top: 100px;">
            <h1>COSMIC INVADERS</h1>
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
    startGame();
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
    
    // Trova gli elementi esistenti o creane di nuovi se non esistono
    scoreElement = uiContainer.querySelector('#score') || createUIElement('score', `SCORE ${score.toString().padStart(5, '0')}`);
    hiScoreElement = uiContainer.querySelector('#hi-score') || createUIElement('hi-score', `HI-SCORE ${hiScore.toString().padStart(5, '0')}`);
    livesElement = uiContainer.querySelector('#lives') || createUIElement('lives', `LIVES ${lives}`);
    levelElement = uiContainer.querySelector('#level') || createUIElement('level', `LEVEL ${level}`);
    
    // Se gli elementi sono nuovi, aggiungili al container
    if (!scoreElement.parentNode) uiContainer.appendChild(scoreElement);
    if (!hiScoreElement.parentNode) uiContainer.appendChild(hiScoreElement);
    if (!livesElement.parentNode) uiContainer.appendChild(livesElement);
    if (!levelElement.parentNode) uiContainer.appendChild(levelElement);
    
    // Aggiorna il contenuto degli elementi
    updateUI();
}

function createUIElement(id, text) {
    const element = document.createElement('div');
    element.id = id;
    element.textContent = text;
    return element;
}

// Modifica funzione initGame per utilizzare l'uiContainer
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

    // Assicurati che uiContainer esista, altrimenti crealo
    let uiContainer = document.getElementById('uiContainer');
    if (!uiContainer) {
        uiContainer = document.createElement('div');
        uiContainer.id = 'uiContainer';
        gameArea.appendChild(uiContainer);
    }
    
    // Aggiorna o crea gli elementi UI nel container
    initUI();
    
    player = { x: 300, y: 550, el: createElement(300, 550, '🚀') };
    bullets = [];
    alienBullets = [];
    invaders = [];
    barriers = [];
    ufo = { x: -30, y: 30, el: null, active: false };

    createInvaders();
    createBarriers();
    createTouchControls();

    // Inizializza l'audio o ricrealo se necessario
    if (!audioContextStarted) {
        initAudioContext();
    } else if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(error => {
            console.error("Errore durante la ripresa dell'audio context:", error);
        });
    }

    // Crea il suono degli alieni
    if (audioContextStarted) {
        // Assicurati che non ci siano suoni in riproduzione
        if (alienMoveSound && alienMoveSound.oscillator) {
            try {
                alienMoveSound.oscillator.stop();
            } catch (e) {
                console.warn("Impossibile fermare l'oscillator precedente:", e);
            }
        }
        
        try {
            alienMoveSound = createAlienMoveSound();
        } catch (e) {
            console.error("Errore nella creazione del suono degli alieni:", e);
        }
    }

    handleResize();
    resetShotsFired();
    gameState = 'playing';  // Imposta direttamente lo stato del gioco
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
    // Aggiornamento proiettili giocatore
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= 5;
        
        // Rimuovi proiettile se fuori schermo
        if (bullet.y < 0) {
            if (bullet.el && bullet.el.parentNode) {
                gameArea.removeChild(bullet.el);
            }
            bullets.splice(i, 1);
        } else {
            bullet.el.style.top = `${bullet.y}px`;
        }
    }

    // Aggiornamento proiettili alieni
    for (let i = alienBullets.length - 1; i >= 0; i--) {
        const bullet = alienBullets[i];
        bullet.y += 5 + level;
        
        // Rimuovi proiettile se fuori schermo
        if (bullet.y > 600) {
            if (bullet.el && bullet.el.parentNode) {
                gameArea.removeChild(bullet.el);
            }
            alienBullets.splice(i, 1);
        } else {
            bullet.el.style.top = `${bullet.y}px`;
        }
    }
}

function resetShotsFired() {
    shotsFired = 0;
    ufoScoreIndex = 0;
}

function checkCollisions() {
    // Fix collisioni con proiettili giocatore
    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = bullets[bulletIndex];
        
        // Collisione con gli invasori
        for (let invaderIndex = invaders.length - 1; invaderIndex >= 0; invaderIndex--) {
            const invader = invaders[invaderIndex];
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
                // Interrompi il ciclo per questo proiettile dato che è stato rimosso
                break;
            }
        }
        
        // Se il proiettile è stato rimosso, passa al prossimo
        if (bulletIndex >= bullets.length) continue;
        const bullet2 = bullets[bulletIndex];

        // Collisione con UFO
        if (ufo.active && Math.abs(bullet2.x - ufo.x) < 20 && Math.abs(bullet2.y - ufo.y) < 20) {
            gameArea.removeChild(ufo.el);
            gameArea.removeChild(bullet2.el);
            bullets.splice(bulletIndex, 1);
            ufo.active = false;
            let ufoScore = ufoScores[ufoScoreIndex];
            score += ufoScore;
            updateHiScore();
            updateUI();
            explosionSound();
            showTemporaryMessage(`UFO colpito! +${ufoScore} punti`);
            continue;
        }

        // Se il proiettile è stato rimosso, passa al prossimo
        if (bulletIndex >= bullets.length) continue;
        const bullet3 = bullets[bulletIndex];

        // Collisione con barriere
        for (let barrierIndex = barriers.length - 1; barrierIndex >= 0; barrierIndex--) {
            const barrier = barriers[barrierIndex];
            const barrierRect = barrier.getBoundingClientRect();
            const bulletRect = bullet3.el.getBoundingClientRect();
            if (bulletRect.left < barrierRect.right &&
                bulletRect.right > barrierRect.left &&
                bulletRect.top < barrierRect.bottom &&
                bulletRect.bottom > barrierRect.top) {
                gameArea.removeChild(bullet3.el);
                bullets.splice(bulletIndex, 1);
                barrier.style.opacity = parseFloat(barrier.style.opacity || 1) - 0.25;
                if (parseFloat(barrier.style.opacity) <= 0) {
                    gameArea.removeChild(barrier);
                    barriers.splice(barrierIndex, 1);
                }
                // Interrompi il ciclo per questo proiettile dato che è stato rimosso
                break;
            }
        }
    }

    // Collisione proiettili alieni con giocatore e barriere
    for (let bulletIndex = alienBullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        const bullet = alienBullets[bulletIndex];
        
        // Collisione con giocatore
        if (Math.abs(bullet.x - player.x) < 20 && Math.abs(bullet.y - player.y) < 20) {
            gameArea.removeChild(bullet.el);
            alienBullets.splice(bulletIndex, 1);
            lives--;
            updateUI();
            playerExplosionSound();
            if (lives <= 0) {
                gameOver();
            }
            continue;
        }

        // Se il proiettile è stato rimosso, passa al prossimo
        if (bulletIndex >= alienBullets.length) continue;
        
        // Collisione con barriere
        for (let barrierIndex = barriers.length - 1; barrierIndex >= 0; barrierIndex--) {
            const barrier = barriers[barrierIndex];
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
                break;
            }
        }
    }

    // Controllo se gli invasori hanno raggiunto il fondo
    for (let i = 0; i < invaders.length; i++) {
        const invader = invaders[i];
        if (invader.y > 530) {
            gameOver();
            return;
        }
    }

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
    if (score >= 1000 * (powerup + 1)) {
        bulletsFrequency += 1 * level;
        powerup += 1;
        powerupSound();
        showTemporaryMessage(`Power-up! Frequenza di sparo aumentata!`, 3000);
    }
    
    if (score >= nextLifeScore) {
        lives += 1;
        updateUI();
        nextLifeScore += 5000;
        lifeUpSound();
        showTemporaryMessage(`Vita extra guadagnata! Vite attuali: ${lives}`, 3000);
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
    
    showGameOver(score);
}


function restartGame() {
    initGame();
    changeGameState('playing');
}

function showGameOver(finalScore) {
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
}


function levelComplete() {
    gameActive = false;
    cancelAnimationFrame(gameLoopId);

    try {
        levelCompleteSound();
    } catch (error) {
        console.error("Errore durante la riproduzione del suono di livello completato:", error);
    }

    level++;
    showLevelComplete();

    if (alienMoveSound && alienMoveSound.oscillator) {
        alienMoveSound.oscillator.stop();
    }

    changeGameState('levelComplete');
}

function showLevelComplete() {
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
    const levelCompleteElement = document.getElementById('levelComplete');
    if (levelCompleteElement) {
        levelCompleteElement.style.display = 'none';
    }

    // Preserva il container dell'UI
    const uiContainer = document.getElementById('uiContainer');
    
    // Mantieni riferimento ai controlli touch
    const touchControlsContainer = document.getElementById('touchControlsContainer');

    // Pulisci l'area di gioco preservando gli elementi chiave
    cleanupGameArea(uiContainer, touchControlsContainer);
    
    // Ripristina le variabili di gioco per il nuovo livello
    resetGameVariables();
    
    // Ricrea gli elementi di gioco
    createGameElements(touchControlsContainer);
    
    // Aggiorna l'UI per il nuovo livello
    updateUI();
    
    // Avvia suono degli alieni
    if (audioContextStarted) {
        alienMoveSound = createAlienMoveSound();
    }
    
    // Aggiorna l'audio context se necessario
    if (!audioContextStarted) {
        initAudioContext();
    }
    
    // Inizia il gioco
    gameActive = true;
    gameLoop();
}

function cleanupGameArea(uiContainer, touchControlsContainer) {
    // Include il container UI e gli elementi UI tra quelli da mantenere
    const elementsToKeep = [uiContainer, touchControlsContainer].filter(Boolean);
    
    // Rimuovi tutti gli elementi tranne quelli da mantenere
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

function resetGameVariables() {
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
    player = { x: 300, y: 550, el: createElement(300, 550, '🚀') };
    gameArea.appendChild(player.el);
    
    createInvaders();
    createBarriers();
    createTouchControls();

    if (touchControlsContainer && !gameArea.contains(touchControlsContainer)) {
        gameArea.appendChild(touchControlsContainer);
    }
}

function startGameLoop() {
    gameActive = true;
    requestAnimationFrame(gameLoop);
}

function attachRestartButton() {
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
    }
}

// Funzione per gestire il ridimensionamento della finestra
window.addEventListener('resize', () => requestAnimationFrame(handleResize));
window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));

//handleResize();
////startGame(); // Assicurati che il gioco inizi automaticamente
//showIntroScreen();

window.addEventListener('load', () => {
    handleResize();
    showIntroScreen(); // Chiamiamo direttamente showIntroScreen invece di changeGameState
});