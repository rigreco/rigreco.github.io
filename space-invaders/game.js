// game.js

import * as entities from './entities.js';
import * as ui from './ui.js';

// Game state
let player, bullets, alienBullets, invaders, barriers, ufo;
let score = 0, lives = 3, level = 1, invaderDirection = 1, invaderSpeed = 1, lastAlienShootTime = 0, gameActive = true, powerup = 0, nextLifeScore = 5000, bulletsFrequency = 3;
let lastMessageScore = 0;

let baseInvaderSpeed = 1;
let lastMoveTime = 0;
let alienMoveSound;
let alienSoundSequence = [0, 1, 2, 3];
let currentSequenceIndex = 0;
const alienSoundFrequencies = [55, 58, 62, 65];
let alienMoveInterval = 1000;
let minAlienMoveInterval = 100;

const alienTypes = ['👾', '👽', '👻'];
const alienPoints = [30, 20, 10];

const ufoScores = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100, 50];
let ufoScoreIndex = 0;
let shotsFired = 0;

export function initGame() {
    ui.gameArea.innerHTML = '';
    ui.gameArea.appendChild(ui.scoreElement);
    ui.gameArea.appendChild(ui.livesElement);
    ui.gameArea.appendChild(ui.levelElement);
    ui.gameArea.appendChild(ui.gameOverElement);
    ui.gameArea.appendChild(ui.levelCompleteElement);

    player = entities.createPlayer(300, 550);
    bullets = [];
    bulletsFrequency = 3;
    powerup = 0;
    nextLifeScore = 5000;
    alienBullets = [];
    invaders = [];
    barriers = [];
    ufo = entities.createUFO(-30, 30);
    score = 0;
    lives = 3;
    level = 1;
    invaderDirection = 1;
    invaderSpeed = 1;
    lastMoveTime = 0;
    lastAlienShootTime = 0;
    gameActive = true;

    createInvaders();
    createBarriers();
    ui.createTouchControls(shoot);  // Passa la funzione shoot come callback
    ui.handleResize();
    resetShotsFired();

    ui.updateUI(score, lives, level);

    ui.hideGameOver();
    ui.hideLevelComplete();
    ui.temporaryMessageElement.style.display = 'none';
}

function createInvaders() {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 11; j++) {
            const typeIndex = Math.floor(i / 2);
            const alienType = alienTypes[typeIndex];
            const points = alienPoints[typeIndex];
            invaders.push(entities.createInvader(j * 40 + 40, i * 40 + 40, alienType, points));
        }
    }
}

function createBarriers() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 5; k++) {
                barriers.push(entities.createBarrier(i * 150 + 75 + k * 10, 500 + j * 10));
            }
        }
    }
}

function resetShotsFired() {
    shotsFired = 0;
    ufoScoreIndex = 0;
}

export function gameLoop() {
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

function updatePlayerPosition() {
    const moveSpeed = 5;
    if (ui.isMovingLeft && player.x > 10) {
        player.x -= moveSpeed;
    }
    if (ui.isMovingRight && player.x < 570) {
        player.x += moveSpeed;
    }
    player.el.style.left = `${player.x}px`;
}

function moveInvaders() {
    const currentTime = Date.now();
    const invaderCount = invaders.length;

    alienMoveInterval = Math.max(
        minAlienMoveInterval,
        1000 - (55 - invaderCount) * 15
    );
    
    if (currentTime - lastMoveTime > alienMoveInterval) {
        playAlienMoveSound();
        
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
        alienBullets.push(entities.createBullet(shooter.x + 10, shooter.y + 20, true));
        ui.alienShootSound();
        lastAlienShootTime = currentTime;
    }
}

function moveUfo() {
    if (!ufo.active && Math.random() < 0.002) {
        ufo.active = true;
        ufo.x = -30;
        ufo.el = entities.createUFO(ufo.x, ufo.y).el;
        ui.gameArea.appendChild(ufo.el);
    }

    if (ufo.active) {
        ufo.x += 2 + level * 0.5;
        ufo.el.style.left = `${ufo.x}px`;
        ui.ufoSound();

        if (ufo.x > 600) {
            ui.gameArea.removeChild(ufo.el);
            ufo.active = false;
        }
    }
}

function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= 5;
        if (bullet.y < 0) {
            ui.gameArea.removeChild(bullet.el);
            bullets.splice(index, 1);
        } else {
            bullet.el.style.top = `${bullet.y}px`;
        }
    });

    alienBullets.forEach((bullet, index) => {
        bullet.y += 5 + level;
        if (bullet.y > 600) {
            ui.gameArea.removeChild(bullet.el);
            alienBullets.splice(index, 1);
        } else {
            bullet.el.style.top = `${bullet.y}px`;
        }
    });
}

function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        invaders.forEach((invader, invaderIndex) => {
            if (Math.abs(bullet.x - invader.x) < 20 && Math.abs(bullet.y - invader.y) < 20) {
                ui.gameArea.removeChild(invader.el);
                ui.gameArea.removeChild(bullet.el);
                invaders.splice(invaderIndex, 1);
                bullets.splice(bulletIndex, 1);
                score += invader.points * level;
                ui.updateUI(score, lives, level);
                ui.explosionSound();
            }
        });

        if (ufo.active && Math.abs(bullet.x - ufo.x) < 20 && Math.abs(bullet.y - ufo.y) < 20) {
            ui.gameArea.removeChild(ufo.el);
            ui.gameArea.removeChild(bullet.el);
            bullets.splice(bulletIndex, 1);
            ufo.active = false;
            let ufoScore = ufoScores[ufoScoreIndex];
            score += ufoScore;
            ui.updateUI(score, lives, level);
            ui.explosionSound();
            ui.showTemporaryMessage(`UFO colpito! +${ufoScore} punti`);
        }

        barriers.forEach((barrier, barrierIndex) => {
            const barrierRect = barrier.getBoundingClientRect();
            const bulletRect = bullet.el.getBoundingClientRect();
            if (bulletRect.left < barrierRect.right &&
                bulletRect.right > barrierRect.left &&
                bulletRect.top < barrierRect.bottom &&
                bulletRect.bottom > barrierRect.top) {
                ui.gameArea.removeChild(bullet.el);
                bullets.splice(bulletIndex, 1);
                barrier.style.opacity = parseFloat(barrier.style.opacity || 1) - 0.25;
                if (parseFloat(barrier.style.opacity) <= 0) {
                    ui.gameArea.removeChild(barrier);
                    barriers.splice(barrierIndex, 1);
                }
            }
        });
    });

    alienBullets.forEach((bullet, bulletIndex) => {
        if (Math.abs(bullet.x - player.x) < 20 && Math.abs(bullet.y - player.y) < 20) {
            ui.gameArea.removeChild(bullet.el);
            alienBullets.splice(bulletIndex, 1);
            lives--;
            ui.updateUI(score, lives, level);
            if (lives <= 0) {
                gameOver();
            }
        }

        barriers.forEach((barrier, barrierIndex) => {
            const barrierRect = barrier.getBoundingClientRect();
            const bulletRect = bullet.el.getBoundingClientRect();
            if (bulletRect.left < barrierRect.right &&
                bulletRect.right > barrierRect.left &&
                bulletRect.top < barrierRect.bottom &&
                bulletRect.bottom > barrierRect.top) {
                ui.gameArea.removeChild(bullet.el);
                alienBullets.splice(bulletIndex, 1);
                barrier.style.opacity = parseFloat(barrier.style.opacity || 1) - 0.25;
                if (parseFloat(barrier.style.opacity) <= 0) {
                    ui.gameArea.removeChild(barrier);
                    barriers.splice(barrierIndex, 1);
                }
            }
        });
    });

    invaders.forEach(invader => {
        if (invader.y > 530) {
            gameOver();
        }
    });

    if (invaders.length === 0) {
        levelComplete();
    }
}

function checkScore() {
    if (score % 500 === 0 && score > 0 && score !== lastMessageScore) {
        ui.showTemporaryMessage(`Test message at ${score} points!`);
        lastMessageScore = score;
    }
    if (score >= 1000 * (powerup + 1)) {
        bulletsFrequency += 1 * level;
        powerup += 1;
        ui.powerupSound();
        ui.showTemporaryMessage(`Power-up! Frequenza di sparo aumentata!`);
    }
    if (score >= nextLifeScore) {
        lives += 1;
        ui.updateUI(score, lives, level);
        nextLifeScore += 5000;
        ui.lifeUpSound();
        ui.showTemporaryMessage(`Vita extra guadagnata!`);
    }
}

export function shoot() {
    if (bullets.length < bulletsFrequency) {
        bullets.push(entities.createBullet(player.x + 10, player.y - 20));
        ui.shootSound();
        shotsFired++;
        ufoScoreIndex = (shotsFired - 1) % 15;
    }
}

function gameOver() {
    gameActive = false;
    ui.gameOverSound();
    ui.showGameOver(score);
}

function levelComplete() {
    gameActive = false;
    ui.levelCompleteSound();
    level++;
    ui.showLevelComplete();
}

export function startNextLevel() {
    ui.gameArea.innerHTML = '';
    ui.hideLevelComplete();

    bullets = [];
    alienBullets = [];
    invaders = [];
    barriers = [];
    ufo = entities.createUFO(-30, 30);

    invaderDirection = 1;
    invaderSpeed = 1 + (level - 1) * 0.2;
    lastMoveTime = 0;
    lastAlienShootTime = 0;

    baseInvaderSpeed = 1 + (level - 1) * 0.2;

    ui.gameArea.appendChild(ui.scoreElement);
    ui.gameArea.appendChild(ui.livesElement);
    ui.gameArea.appendChild(ui.levelElement);

    player = entities.createPlayer(300, 550);
    createInvaders();
    createBarriers();
    ui.createTouchControls();
    resetShotsFired();

    ui.updateUI(score, lives, level);
    gameActive = true;
    gameLoop();
}

function playAlienMoveSound() {
    if (!ui.audioContextStarted || !alienMoveSound) return;

    const soundDuration = 0.15;
    const currentTone = alienSoundSequence[currentSequenceIndex];
    
    alienMoveSound.oscillator.frequency.setValueAtTime(
        alienSoundFrequencies[currentTone], 
        ui.audioContext.currentTime
    );
    
    alienMoveSound.gainNode.gain.setValueAtTime(0.2, ui.audioContext.currentTime);
    alienMoveSound.gainNode.gain.exponentialRampToValueAtTime(0.01, ui.audioContext.currentTime + soundDuration);
    
    currentSequenceIndex = (currentSequenceIndex + 1) % alienSoundSequence.length;
}

export function setupGame() {
    initGame();
    ui.setupInputListeners(shoot);
    ui.handleResize();
    gameLoop();
}