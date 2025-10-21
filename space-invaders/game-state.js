/**
 * Game State Module
 * Gestisce lo stato del gioco, punteggi e high scores
 */

// Stato del gioco
export let score = 0;
export let lives = 3;
export let level = 1;
export let gameActive = true;
export let gameState = 'intro';
export let hiScore = 0;
export let gameLoopId = null;

// Configurazione del gioco
export let invaderDirection = 1;
export let invaderSpeed = 1;
export let powerup = 0;
export let nextLifeScore = 5000;
export let bulletsFrequency = 3;
export let baseInvaderSpeed = 1;
export let alienMoveInterval = 1000;
export const minAlienMoveInterval = 100;

// Tempistiche
export let lastAlienShootTime = 0;
export let lastMoveTime = 0;
export let lastMessageScore = 0;

// Punteggi e statistiche
export const ufoScores = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100, 50];
export let ufoScoreIndex = 0;
export let shotsFired = 0;
export let highScores = [
    { name: 'AAA', score: 0 },
    { name: 'BBB', score: 0 },
    { name: 'CCC', score: 0 }
];

// Tipi di alieni e punti
export const alienTypes = ['👽','👾','👻'];
export const alienPoints = [30, 20, 10];

// Funzioni per modificare lo stato
export function setScore(newScore) {
    score = newScore;
}

export function setLives(newLives) {
    lives = newLives;
}

export function setLevel(newLevel) {
    level = newLevel;
}

export function setGameActive(active) {
    gameActive = active;
}

export function setGameState(state) {
    gameState = state;
}

export function setGameLoopId(id) {
    gameLoopId = id;
}

export function setInvaderDirection(direction) {
    invaderDirection = direction;
}

export function setInvaderSpeed(speed) {
    invaderSpeed = speed;
}

export function setBulletsFrequency(frequency) {
    bulletsFrequency = frequency;
}

export function setPowerup(value) {
    powerup = value;
}

export function setNextLifeScore(value) {
    nextLifeScore = value;
}

export function setLastAlienShootTime(time) {
    lastAlienShootTime = time;
}

export function setLastMoveTime(time) {
    lastMoveTime = time;
}

export function setAlienMoveInterval(interval) {
    alienMoveInterval = interval;
}

export function setShotsFired(count) {
    shotsFired = count;
}

export function setUfoScoreIndex(index) {
    ufoScoreIndex = index;
}

/**
 * Verifica se un punteggio è un high score
 */
export function checkHighScore(score) {
    if (!highScores || highScores.length === 0) {
        return true;
    }

    if (highScores.length < 3) {
        return true;
    }

    const lowestHighScore = highScores[highScores.length - 1].score;
    return score > lowestHighScore;
}

/**
 * Aggiunge un nuovo high score
 */
export function addHighScore(name, score) {
    name = name.padEnd(3, ' ').substr(0, 3).toUpperCase();

    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 3);

    saveHighScores();
}

/**
 * Carica gli high score dal localStorage
 */
export function loadHighScores() {
    const savedScores = localStorage.getItem('spaceInvadersHighScores');
    if (savedScores) {
        try {
            highScores = JSON.parse(savedScores);
        } catch (e) {
            console.error('Errore nel parsing degli high scores:', e);
        }
    }
}

/**
 * Salva gli high score nel localStorage
 */
export function saveHighScores() {
    try {
        localStorage.setItem('spaceInvadersHighScores', JSON.stringify(highScores));
    } catch (e) {
        console.error('Errore nel salvataggio degli high scores:', e);
    }
}

/**
 * Aggiorna l'high score corrente se necessario
 */
export function updateHiScore() {
    if (score > hiScore) {
        hiScore = score;
        return true;
    }
    return false;
}

/**
 * Resetta i colpi sparati
 */
export function resetShotsFired() {
    shotsFired = 0;
    ufoScoreIndex = 0;
}

/**
 * Resetta le variabili di gioco per un nuovo livello
 */
export function resetGameVariables() {
    invaderDirection = 1;
    invaderSpeed = 1 + (level - 1) * 0.2;
    lastMoveTime = 0;
    lastAlienShootTime = 0;
    baseInvaderSpeed = 1 + (level - 1) * 0.2;
}
