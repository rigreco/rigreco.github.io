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

// Variabile per mantenere coerenza dello scaling
let lastAppliedScale = null;

// Funzione per gestire il ridimensionamento della finestra
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Per garantire la consistenza visiva, usiamo lo stesso scaling per tutti gli stati del gioco
        // Calcola il rapporto di aspetto del gioco e della finestra
        const gameAspectRatio = 600 / 600; // Usa dimensioni fisse per uniformità
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        
        let scale;
        
        // Adatta in base al rapporto di aspetto
        if (windowAspectRatio < gameAspectRatio) {
            // Se la finestra è più stretta, adatta alla larghezza
            scale = window.innerWidth / 600 * 0.95; // 95% della larghezza per un piccolo margine
        } else {
            // Se la finestra è più larga, adatta all'altezza
            scale = window.innerHeight / 600 * 0.95; // 95% dell'altezza per un piccolo margine
        }
        
        // Se abbiamo già applicato scaling, usa lo stesso scale a meno che non ci sia una differenza significativa
        if (lastAppliedScale !== null && Math.abs(lastAppliedScale - scale) < 0.1) {
            scale = lastAppliedScale;
        } else {
            lastAppliedScale = scale;
        }
        
        // Imposta la posizione iniziale e lo stile per centrare correttamente
        // Anche per la schermata intro/menu utilizziamo lo stesso posizionamento del gioco
        gameArea.style.position = 'absolute';
        gameArea.style.top = '50%';
        gameArea.style.left = '50%';
        gameArea.style.transform = `translate(-50%, -50%) scale(${scale})`;
        gameArea.style.transformOrigin = 'center center';
        gameArea.style.margin = '0'; // Resetta il margine per evitare influenze sul centramento
        
        console.log("Applicato scale:", scale, "Stato gioco:", gameState);
        
        // Gestione dei controlli touch
        const touchControlsContainer = document.getElementById('touchControlsContainer');
        if (touchControlsContainer) {
            touchControlsContainer.style.display = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'flex' : 'none';
            
            // Adatta la dimensione dei controlli touch in base allo schermo
            const controlSize = Math.min(window.innerWidth / 6, 80);
            const shootControlSize = Math.min(window.innerWidth / 5, 120);
            
            document.querySelectorAll('.touch-control').forEach(control => {
                if (control.id === 'shootControl') {
                    control.style.width = `${shootControlSize}px`;
                    control.style.height = `${controlSize}px`;
                } else {
                    control.style.width = `${controlSize}px`;
                    control.style.height = `${controlSize}px`;
                }
            });
        }
        
        // Assicurati che il messaggio temporaneo mantenga la sua posizione corretta
        if (temporaryMessageElement) {
            temporaryMessageElement.style.top = '10%';
            temporaryMessageElement.style.left = '50%';
            temporaryMessageElement.style.transform = 'translateX(-50%)';
        }
    }, 250); // Aspetta 250ms prima di applicare il ridimensionamento
}

// Inizializza l'AudioContext - modificato per una migliore affidabilità
function initAudioContext() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        audioContextStarted = true;
        console.log('AudioContext inizializzato con stato:', audioContext.state);
        
        // Crea il suono degli alieni subito per assicurarsi che sia disponibile
        if (!alienMoveSound) {
            alienMoveSound = createAlienMoveSound();
        }
    } catch (e) {
        console.error('Errore nell\'inizializzazione dell\'AudioContext:', e);
    }
}

// Eventi per attivare l'audio al primo input dell'utente
document.addEventListener('click', initAudioContext, { once: false });
document.addEventListener('touchstart', initAudioContext, { once: false });
document.addEventListener('keydown', initAudioContext, { once: false });

function playSound(frequency, duration, type = 'sine') {
    if (!audioContextStarted || !audioContext) {
        // Tenta di inizializzare l'audio se non è ancora stato fatto
        initAudioContext();
        // Se ancora non funziona, usciamo
        if (!audioContextStarted || !audioContext) return;
    }
    
    try {
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
    } catch (e) {
        console.error('Errore nella riproduzione del suono:', e);
    }
}

// Funzione per creare il suono degli alieni
function createAlienMoveSound() {
    if (!audioContextStarted || !audioContext) return null;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(alienSoundFrequencies[0], audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        
        return { oscillator, gainNode };
    } catch (e) {
        console.error('Errore nella creazione del suono degli alieni:', e);
        return null;
    }
}

// Funzione per riprodurre il suono del movimento degli alieni
function playAlienMoveSound() {
    if (!audioContextStarted || !audioContext || !alienMoveSound) {
        // Tenta di reinizializzare il suono se necessario
        if (audioContextStarted && audioContext) {
            alienMoveSound = createAlienMoveSound();
        }
        
        if (!alienMoveSound) return;
    }

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
        if (audioContextStarted && audioContext) {
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
function powerupSound() { playSound(880, 0.5, 'sine'); } // Cambiato per differenziarlo da levelCompleteSound
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
    
    // Inizializza l'AudioContext quando viene mostrata la schermata iniziale
    initAudioContext();
}

function startGameFromIntro() {
    console.log("Starting game from intro");
    gameState = 'playing';
    initGame();
    startGame();
    
    // Assicurati che l'audio sia inizializzato correttamente
    initAudioContext();
    
    // Forza la creazione del suono degli alieni
    if (audioContextStarted && audioContext) {
        if (alienMoveSound && alienMoveSound.oscillator) {
            try {
                alienMoveSound.oscillator.stop();
            } catch (e) {
                console.warn("Errore nel fermare l'oscillator precedente:", e);
            }
        }
        alienMoveSound = createAlienMoveSound();
    }
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
    // Se non ci sono high scores o la lista è vuota, qualsiasi punteggio è valido
    if (!highScores || highScores.length === 0) {
        return true;
    }
    
    // Se ci sono meno di 3 high scores, qualsiasi punteggio è valido
    if (highScores.length < 3) {
        return true;
    }
    
    // Altrimenti, verifica se il punteggio è maggiore del più basso nella lista
    const lowestHighScore = highScores[highScores.length - 1].score;
    return score > lowestHighScore;
}

function addHighScore(name, score) {
    // Assicuriamoci che il nome sia esattamente di 3 caratteri
    name = name.padEnd(3, ' ').substr(0, 3).toUpperCase();
    
    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 3);  // Mantieni solo i primi 3
    
    // Salva gli high score nel localStorage
    saveHighScores();
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
    // Verifica se stiamo eseguendo da HTTP/HTTPS
    if (window.location.protocol.includes('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registrato con successo:', registration);
                })
                .catch(error => {
                    console.log('Registrazione Service Worker fallita:', error);
                });
        });
    } else {
        console.log('Service Worker non registrato: il protocollo deve essere HTTP o HTTPS. Stai utilizzando ' + window.location.protocol);
    }
    
    window.addEventListener('error', function(e) {
        if (e.target.tagName === 'LINK' && e.target.rel === 'icon') {
            console.warn('Failed to load favicon. This is not critical for game functionality.');
            e.preventDefault(); // Previene la visualizzazione dell'errore nella console
        }
    }, true);
}

function createTouchControls() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        // Rimuoviamo i controlli touch esistenti
        const existingTouchControls = document.getElementById('touchControlsContainer');
        if (existingTouchControls) {
            existingTouchControls.remove();
        }
        
        // Creiamo il container principale per i controlli touch
        const touchControlsContainer = document.createElement('div');
        touchControlsContainer.id = 'touchControlsContainer';
        touchControlsContainer.style.position = 'absolute';
        touchControlsContainer.style.bottom = '20px';
        touchControlsContainer.style.left = '0';
        touchControlsContainer.style.width = '100%';
        touchControlsContainer.style.display = 'flex';
        touchControlsContainer.style.justifyContent = 'space-between';
        touchControlsContainer.style.padding = '0 20px';
        touchControlsContainer.style.pointerEvents = 'none'; // Per non interferire con il gioco
        touchControlsContainer.style.zIndex = '1000';
        gameArea.appendChild(touchControlsContainer);

        // Container per il joystick virtuale (a sinistra)
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'joystickContainer';
        joystickContainer.style.width = '120px';
        joystickContainer.style.height = '120px';
        joystickContainer.style.borderRadius = '60px';
        joystickContainer.style.backgroundColor = 'rgba(100, 100, 100, 0.3)';
        joystickContainer.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        joystickContainer.style.position = 'relative';
        joystickContainer.style.pointerEvents = 'auto'; // Questo elemento riceve eventi touch
        
        // Il "bastoncino" del joystick
        const joystickStick = document.createElement('div');
        joystickStick.id = 'joystickStick';
        joystickStick.style.width = '50px';
        joystickStick.style.height = '50px';
        joystickStick.style.borderRadius = '25px';
        joystickStick.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        joystickStick.style.position = 'absolute';
        joystickStick.style.top = '35px';  // Centrato verticalmente (120-50)/2
        joystickStick.style.left = '35px'; // Centrato orizzontalmente (120-50)/2
        joystickStick.style.transition = 'transform 0.1s ease-out';
        joystickStick.style.pointerEvents = 'none'; // Il bastoncino non riceve eventi touch
        
        joystickContainer.appendChild(joystickStick);
        
        // Container per il pulsante di sparo (a destra)
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
        shootControl.style.borderRadius = '50%';
        shootControl.style.color = 'white';
        shootControl.style.fontSize = '20px';
        shootControl.style.display = 'flex';
        shootControl.style.justifyContent = 'center';
        shootControl.style.alignItems = 'center';
        shootControl.style.width = '100px';
        shootControl.style.height = '100px';
        shootControl.style.userSelect = 'none';
        shootControl.style.pointerEvents = 'auto'; // Questo elemento riceve eventi touch
        
        shootControlContainer.appendChild(shootControl);
        
        // Aggiungi i container principali al container dei controlli touch
        touchControlsContainer.appendChild(joystickContainer);
        touchControlsContainer.appendChild(shootControlContainer);
        
        // Implementazione della logica del joystick
        let joystickActive = false;
        let joystickStartX = 0;
        let joystickCenterX = 60; // Centro del joystick (metà della larghezza)
        let joystickMaxDistance = 35; // Distanza massima dal centro
        
        // Funzione per aggiornare la posizione del bastoncino del joystick
        function updateJoystickPosition(x) {
            const deltaX = x - joystickStartX;
            // Limita lo spostamento alla distanza massima
            const limitedDeltaX = Math.max(-joystickMaxDistance, Math.min(joystickMaxDistance, deltaX));
            
            // Imposta la posizione del bastoncino
            joystickStick.style.transform = `translateX(${limitedDeltaX}px)`;
            
            // Imposta le variabili di movimento in base alla posizione del joystick
            if (limitedDeltaX < -10) {
                isMovingLeft = true;
                isMovingRight = false;
            } else if (limitedDeltaX > 10) {
                isMovingLeft = false;
                isMovingRight = true;
            } else {
                // Zona morta centrale per evitare micro-movimenti indesiderati
                isMovingLeft = false;
                isMovingRight = false;
            }
        }
        
        // Event listeners per il joystick
        joystickContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            joystickActive = true;
            joystickStartX = touch.clientX;
            
            // Aggiorna immediatamente la posizione per feedback immediato
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
        };
        
        joystickContainer.addEventListener('touchend', resetJoystick);
        joystickContainer.addEventListener('touchcancel', resetJoystick);
        
        // Event listener per il pulsante di sparo
        shootControl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            shoot();
        });
        
        // Adatta dimensioni dei controlli in base allo schermo
        const resizeControls = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const isLandscape = screenWidth > screenHeight;
            
            // Dimensioni del joystick basate sulla dimensione dello schermo
            const joystickSize = isLandscape ? 
                Math.min(screenHeight * 0.3, 120) : 
                Math.min(screenWidth * 0.25, 120);
            
            joystickContainer.style.width = `${joystickSize}px`;
            joystickContainer.style.height = `${joystickSize}px`;
            joystickContainer.style.borderRadius = `${joystickSize/2}px`;
            
            // Dimensioni del bastoncino
            const stickSize = joystickSize * 0.4;
            joystickStick.style.width = `${stickSize}px`;
            joystickStick.style.height = `${stickSize}px`;
            joystickStick.style.borderRadius = `${stickSize/2}px`;
            joystickStick.style.top = `${(joystickSize-stickSize)/2}px`;
            joystickStick.style.left = `${(joystickSize-stickSize)/2}px`;
            
            // Aggiorna il valore di riferimento per il joystick
            joystickCenterX = joystickSize / 2;
            joystickMaxDistance = joystickSize * 0.3;
            
            // Dimensioni del pulsante di sparo
            const shootSize = isLandscape ? 
                Math.min(screenHeight * 0.35, 130) : 
                Math.min(screenWidth * 0.3, 130);
            
            shootControl.style.width = `${shootSize}px`;
            shootControl.style.height = `${shootSize}px`;
            shootControl.style.fontSize = `${shootSize * 0.18}px`;
        };
        
        // Chiamata iniziale per impostare le dimensioni
        resizeControls();
        
        // Aggiungi event listener per il ridimensionamento
        window.addEventListener('resize', resizeControls);
        window.addEventListener('orientationchange', () => setTimeout(resizeControls, 100));
        
        return { 
            container: touchControlsContainer,
            resize: resizeControls
        };
    }
    return null;
}

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
    initAudioContext();

    // Crea il suono degli alieni
    if (audioContextStarted && audioContext) {
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
// La funzione createElement() è già definita in precedenza nel codice
// e verrà utilizzata da qui in avanti

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
    // Struttura più simile all'originale Cosmic Invaders, con forma distintiva
    const barrierPositions = [75, 225, 375, 525]; // Posizioni X dei 4 ripari
    
    for (let barrierIndex = 0; barrierIndex < 4; barrierIndex++) {
        const baseX = barrierPositions[barrierIndex];
        const baseY = 480;
        
        // Prima e seconda riga (rettangolo completo)
        for (let j = 0; j < 2; j++) {
            for (let i = 0; i < 5; i++) {
                barriers.push({
                    x: baseX + i * 10 - 20,
                    y: baseY + j * 10,
                    hp: 4,
                    el: createElement(baseX + i * 10 - 20, baseY + j * 10, '▇', 'barrier')
                });
            }
        }
        
        // Terza riga (inferiore con incavo centrale)
        for (let i = 0; i < 5; i++) {
            if (i !== 2) { // Salta la posizione centrale per creare l'incavo nella parte inferiore
                barriers.push({
                    x: baseX + i * 10 - 20,
                    y: baseY + 2 * 10,
                    hp: 4, 
                    el: createElement(baseX + i * 10 - 20, baseY + 2 * 10, '▇', 'barrier')
                });
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
        // Per garantire la consistenza visiva, usiamo lo stesso scaling per tutti gli stati del gioco
        // Calcola il rapporto di aspetto del gioco e della finestra
        const gameAspectRatio = 600 / 600; // Usa dimensioni fisse per uniformità
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        
        let scale;
        
        // Adatta in base al rapporto di aspetto
        if (windowAspectRatio < gameAspectRatio) {
            // Se la finestra è più stretta, adatta alla larghezza
            scale = window.innerWidth / 600 * 0.95; // 95% della larghezza per un piccolo margine
        } else {
            // Se la finestra è più larga, adatta all'altezza
            scale = window.innerHeight / 600 * 0.95; // 95% dell'altezza per un piccolo margine
        }
        
        // Se abbiamo già applicato scaling, usa lo stesso scale a meno che non ci sia una differenza significativa
        if (lastAppliedScale !== null && Math.abs(lastAppliedScale - scale) < 0.1) {
            scale = lastAppliedScale;
        } else {
            lastAppliedScale = scale;
        }
        
        // Imposta la posizione iniziale e lo stile per centrare correttamente
        // Anche per la schermata intro/menu utilizziamo lo stesso posizionamento del gioco
        gameArea.style.position = 'absolute';
        gameArea.style.top = '50%';
        gameArea.style.left = '50%';
        gameArea.style.transform = `translate(-50%, -50%) scale(${scale})`;
        gameArea.style.transformOrigin = 'center center';
        gameArea.style.margin = '0'; // Resetta il margine per evitare influenze sul centramento
        
        console.log("Applicato scale:", scale, "Stato gioco:", gameState);
        
        // Gestione dei controlli touch
        const touchControlsContainer = document.getElementById('touchControlsContainer');
        if (touchControlsContainer) {
            touchControlsContainer.style.display = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'flex' : 'none';
            
            // Adatta la dimensione dei controlli touch in base allo schermo
            const controlSize = Math.min(window.innerWidth / 6, 80);
            const shootControlSize = Math.min(window.innerWidth / 5, 120);
            
            document.querySelectorAll('.touch-control').forEach(control => {
                if (control.id === 'shootControl') {
                    control.style.width = `${shootControlSize}px`;
                    control.style.height = `${controlSize}px`;
                } else {
                    control.style.width = `${controlSize}px`;
                    control.style.height = `${controlSize}px`;
                }
            });
        }
        
        // Assicurati che il messaggio temporaneo mantenga la sua posizione corretta
        if (temporaryMessageElement) {
            temporaryMessageElement.style.top = '10%';
            temporaryMessageElement.style.left = '50%';
            temporaryMessageElement.style.transform = 'translateX(-50%)';
        }
    }, 250); // Aspetta 250ms prima di applicare il ridimensionamento
}

// Inizializza il gioco
//initGame();

function moveInvaders() {
    const currentTime = Date.now();
    const invaderCount = invaders.length;

    // Calcola il nuovo intervallo di movimento basato sul numero di invasori rimasti
    // Più realistico come nell'originale - la velocità aumenta drasticamente quando restano pochi alieni
    alienMoveInterval = Math.max(
        minAlienMoveInterval,
        1000 - (55 - invaderCount) * 20
    );
    
    if (currentTime - lastMoveTime > alienMoveInterval) {
        // Assicurati che l'audio sia disponibile prima di riprodurlo
        if (!alienMoveSound && audioContextStarted && audioContext) {
            alienMoveSound = createAlienMoveSound();
        }
        
        playAlienMoveSound(); // Riproduci il suono ad ogni movimento
        
        let shouldChangeDirection = false;
        let furthestDownInvader = 0;
        
        // Trova l'invasore più in basso
        invaders.forEach(invader => {
            if (invader.y > furthestDownInvader) {
                furthestDownInvader = invader.y;
            }
        });
        
        // Determina se gli alieni sono ai bordi
        invaders.forEach(invader => {
            if ((invaderDirection > 0 && invader.x > 560) || (invaderDirection < 0 && invader.x < 10)) {
                shouldChangeDirection = true;
            }
        });
        
        if (shouldChangeDirection) {
            // Cambia direzione e muovi verso il basso come nell'originale
            invaderDirection *= -1;
            
            // Aumenta la difficoltà in base al livello - più veloce e più in basso
            const downMoveAmount = Math.min(20 + level * 2, 40);
            
            invaders.forEach(invader => {
                invader.y += downMoveAmount;
                invader.el.style.top = `${invader.y}px`;
            });
        } else {
            // Movimento laterale standard
            const moveAmount = Math.min(5 + level, 15); // Movimento laterale più veloce nei livelli alti
            
            invaders.forEach(invader => {
                invader.x += invaderDirection * moveAmount;
                invader.el.style.left = `${invader.x}px`;
            });
        }

        // Aumenta la velocità quando gli alieni si avvicinano alla parte bassa dello schermo
        if (furthestDownInvader > 350) {
            alienMoveInterval = Math.max(alienMoveInterval - 100, minAlienMoveInterval);
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
    // Apparizione casuale dell'UFO - più rara nei livelli bassi, più frequente nei livelli alti
    const ufoAppearanceChance = 0.001 + (level * 0.0005);
    
    if (!ufo.active && Math.random() < ufoAppearanceChance) {
        ufo.active = true;
        // Imposta la direzione casuale: da sinistra a destra o viceversa
        ufo.direction = Math.random() < 0.5 ? 1 : -1;
        ufo.x = ufo.direction > 0 ? -30 : 630;
        ufo.el = createElement(ufo.x, ufo.y, '🛸', 'sprite ufo-sprite');
        ufo.el.id = 'ufo';
        
        // Assegna un punteggio casuale ma fisso per questa apparizione dell'UFO
        ufo.score = ufoScores[Math.floor(Math.random() * ufoScores.length)];
    }

    if (ufo.active) {
        // Velocità basata sul livello
        const ufoSpeed = 2 + Math.min(level * 0.5, 3);
        ufo.x += ufo.direction * ufoSpeed;
        ufo.el.style.left = `${ufo.x}px`;
        
        // Suono UFO con una minore frequenza per non saturare l'audio
        if (Math.random() < 0.2) {
            ufoSound();
        }

        // Rimuovi l'UFO quando esce dallo schermo
        if ((ufo.direction > 0 && ufo.x > 630) || (ufo.direction < 0 && ufo.x < -30)) {
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
        let bulletRemoved = false;
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
                bulletRemoved = true;
                // Interrompi il ciclo per questo proiettile dato che è stato rimosso
                break;
            }
        }
        
        // Se il proiettile è stato rimosso, passa al prossimo
        if (bulletRemoved) continue;

        // Collisione con UFO
        if (ufo.active && Math.abs(bullet.x - ufo.x) < 20 && Math.abs(bullet.y - ufo.y) < 20) {
            gameArea.removeChild(ufo.el);
            gameArea.removeChild(bullet.el);
            bullets.splice(bulletIndex, 1);
            ufo.active = false;
            // Usa il punteggio memorizzato per questo UFO specifico
            const ufoScore = ufo.score || 100; // Default 100 se non definito
            score += ufoScore;
            updateHiScore();
            updateUI();
            explosionSound();
            showTemporaryMessage(`UFO colpito! +${ufoScore} punti`);
            continue;
        }

        // Collisione con barriere - versione migliorata per colpire solo un blocchetto alla volta
        let barrierHit = false;
        for (let barrierIndex = barriers.length - 1; barrierIndex >= 0; barrierIndex--) {
            const barrier = barriers[barrierIndex];
            // Riduco la zona di collisione per renderla più precisa, solo 10px anziché 15px
            if (Math.abs(bullet.x - barrier.x) < 10 && Math.abs(bullet.y - barrier.y) < 10) {
                gameArea.removeChild(bullet.el);
                bullets.splice(bulletIndex, 1);
                
                // Danneggia la barriera
                barrier.hp -= 1;
                
                // Aggiorna l'aspetto della barriera in base ai punti vita rimanenti
                if (barrier.hp <= 0) {
                    gameArea.removeChild(barrier.el);
                    barriers.splice(barrierIndex, 1);
                } else {
                    // Cambia l'opacità in base ai punti vita
                    barrier.el.style.opacity = barrier.hp / 4;
                }
                barrierHit = true;
                break; // Esci immediatamente dopo aver colpito una barriera
            }
        }
        
        // Se abbiamo colpito una barriera, passiamo al prossimo proiettile
        if (barrierHit) continue;
    }

    // Collisione proiettili alieni con giocatore e barriere
    for (let bulletIndex = alienBullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        let bulletRemoved = false;
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
            bulletRemoved = true;
            continue;
        }

        // Se il proiettile è stato rimosso, passa al prossimo
        if (bulletRemoved) continue;
        
        // Collisione con barriere - versione migliorata per colpire solo un blocchetto alla volta
        let barrierHit = false;
        for (let barrierIndex = barriers.length - 1; barrierIndex >= 0; barrierIndex--) {
            const barrier = barriers[barrierIndex];
            // Riduco la zona di collisione per renderla più precisa, solo 10px anziché 15px
            if (Math.abs(bullet.x - barrier.x) < 10 && Math.abs(bullet.y - barrier.y) < 10) {
                gameArea.removeChild(bullet.el);
                alienBullets.splice(bulletIndex, 1);
                
                // Danneggia la barriera
                barrier.hp -= 1;
                
                if (barrier.hp <= 0) {
                    gameArea.removeChild(barrier.el);
                    barriers.splice(barrierIndex, 1);
                } else {
                    // Opacità proporzionale ai punti vita
                    barrier.el.style.opacity = barrier.hp / 4;
                }
                barrierHit = true;
                break; // Esci immediatamente dopo aver colpito una barriera
            }
        }
        
        // Se abbiamo colpito una barriera, passiamo al prossimo proiettile
        if (barrierHit) continue;
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
    } 
    
    if (gameActive) {
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
    
    // Assicurati che l'audio sia inizializzato
    initAudioContext();
    
    // Ricrea il suono degli alieni se non esiste
    if (!alienMoveSound && audioContextStarted && audioContext) {
        alienMoveSound = createAlienMoveSound();
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
    // Carica gli high score salvati
    loadHighScores();
    // Aggiorna l'high score corrente in base ai valori caricati
    if (highScores && highScores.length > 0) {
        hiScore = Math.max(...highScores.map(score => score.score));
    }
    
    handleResize();
    showIntroScreen(); // Chiamiamo direttamente showIntroScreen invece di changeGameState
});

// Carica gli high score dal localStorage all'avvio
function loadHighScores() {
    const savedScores = localStorage.getItem('spaceInvadersHighScores');
    if (savedScores) {
        try {
            highScores = JSON.parse(savedScores);
            console.log('High scores caricati:', highScores);
        } catch (e) {
            console.error('Errore nel parsing degli high scores:', e);
            // Mantieni i valori predefiniti in caso di errore
        }
    }
}

// Salva gli high score nel localStorage
function saveHighScores() {
    try {
        localStorage.setItem('spaceInvadersHighScores', JSON.stringify(highScores));
        console.log('High scores salvati');
    } catch (e) {
        console.error('Errore nel salvataggio degli high scores:', e);
    }
}