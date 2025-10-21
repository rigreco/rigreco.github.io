/**
 * Entities Module
 * Gestisce tutte le entità del gioco: player, invaders, bullets, barriers, UFO
 */

import * as GameState from './game-state.js';
import * as Audio from './audio.js';
import { updateUI, showTemporaryMessage } from './ui.js';

// Riferimento all'area di gioco
let gameArea = null;

// Entità del gioco
export let player = null;
export let bullets = [];
export let alienBullets = [];
export let invaders = [];
export let barriers = [];
export let ufo = { x: -30, y: 30, el: null, active: false };

/**
 * Inizializza il riferimento all'area di gioco
 */
export function initGameArea(area) {
    gameArea = area;
}

/**
 * Crea un elemento DOM per le entità
 */
export function createElement(x, y, content, className = 'sprite') {
    const el = document.createElement('div');
    el.className = className;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.textContent = content;
    gameArea.appendChild(el);
    return el;
}

/**
 * Crea il giocatore
 */
export function createPlayer() {
    player = { x: 300, y: 550, el: createElement(300, 550, '🚀'), moveSpeed: 5 };
    return player;
}

/**
 * Crea gli invasori
 */
export function createInvaders() {
    invaders = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 11; j++) {
            let typeIndex;
            if (i < 1) {
                typeIndex = 0; // Prima riga: alieni da 30 punti
            } else if (i < 3) {
                typeIndex = 1; // Seconda e terza riga: alieni da 20 punti
            } else {
                typeIndex = 2; // Quarta e quinta riga: alieni da 10 punti
            }
            const alienType = GameState.alienTypes[typeIndex];
            const points = GameState.alienPoints[typeIndex];
            invaders.push({
                x: j * 40 + 40,
                y: i * 40 + 80,
                type: alienType,
                points: points,
                el: createElement(j * 40 + 40, i * 40 + 80, alienType, 'alien sprite')
            });
        }
    }
}

/**
 * Crea le barriere
 */
export function createBarriers() {
    barriers = [];
    const barrierPositions = [75, 225, 375, 525];

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
            if (i !== 2) {
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

/**
 * Muove gli invasori
 */
export function moveInvaders() {
    const currentTime = Date.now();
    const invaderCount = invaders.length;

    // Calcola il nuovo intervallo di movimento
    GameState.setAlienMoveInterval(Math.max(
        GameState.minAlienMoveInterval,
        1000 - (55 - invaderCount) * 20
    ));

    if (currentTime - GameState.lastMoveTime > GameState.alienMoveInterval) {
        if (!Audio.alienMoveSound && Audio.audioContextStarted && Audio.audioContext) {
            Audio.recreateAlienMoveSound();
        }

        Audio.playAlienMoveSound();

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
            if ((GameState.invaderDirection > 0 && invader.x > 560) ||
                (GameState.invaderDirection < 0 && invader.x < 10)) {
                shouldChangeDirection = true;
            }
        });

        if (shouldChangeDirection) {
            GameState.setInvaderDirection(GameState.invaderDirection * -1);
            const downMoveAmount = Math.min(20 + GameState.level * 2, 40);

            invaders.forEach(invader => {
                invader.y += downMoveAmount;
                invader.el.style.top = `${invader.y}px`;
            });
        } else {
            const moveAmount = Math.min(5 + GameState.level, 15);

            invaders.forEach(invader => {
                invader.x += GameState.invaderDirection * moveAmount;
                invader.el.style.left = `${invader.x}px`;
            });
        }

        if (furthestDownInvader > 350) {
            GameState.setAlienMoveInterval(
                Math.max(GameState.alienMoveInterval - 100, GameState.minAlienMoveInterval)
            );
        }

        GameState.setLastMoveTime(currentTime);
    }
}

/**
 * Gli alieni sparano
 */
export function alienShoot() {
    const currentTime = Date.now();
    if (currentTime - GameState.lastAlienShootTime > 1000 / (1 + GameState.level * 0.1) &&
        invaders.length > 0) {
        const shooter = invaders[Math.floor(Math.random() * invaders.length)];
        alienBullets.push({
            x: shooter.x + 10,
            y: shooter.y + 20,
            el: createElement(shooter.x + 10, shooter.y + 20, '|', 'alien-bullet sprite')
        });
        Audio.alienShootSound();
        GameState.setLastAlienShootTime(currentTime);
    }
}

/**
 * Muove l'UFO
 */
export function moveUfo() {
    const ufoAppearanceChance = 0.001 + (GameState.level * 0.0005);

    if (!ufo.active && Math.random() < ufoAppearanceChance) {
        ufo.active = true;
        ufo.direction = Math.random() < 0.5 ? 1 : -1;
        ufo.x = ufo.direction > 0 ? -30 : 630;
        ufo.el = createElement(ufo.x, ufo.y, '🛸', 'sprite ufo-sprite');
        ufo.el.id = 'ufo';
        ufo.score = GameState.ufoScores[Math.floor(Math.random() * GameState.ufoScores.length)];
    }

    if (ufo.active) {
        const ufoSpeed = 2 + Math.min(GameState.level * 0.5, 3);
        ufo.x += ufo.direction * ufoSpeed;
        ufo.el.style.left = `${ufo.x}px`;

        if (Math.random() < 0.2) {
            Audio.ufoSound();
        }

        if ((ufo.direction > 0 && ufo.x > 630) || (ufo.direction < 0 && ufo.x < -30)) {
            gameArea.removeChild(ufo.el);
            ufo.active = false;
        }
    }
}

/**
 * Aggiorna i proiettili
 */
export function updateBullets() {
    // Proiettili giocatore
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= 5;

        if (bullet.y < 0) {
            if (bullet.el && bullet.el.parentNode) {
                gameArea.removeChild(bullet.el);
            }
            bullets.splice(i, 1);
        } else {
            bullet.el.style.top = `${bullet.y}px`;
        }
    }

    // Proiettili alieni
    for (let i = alienBullets.length - 1; i >= 0; i--) {
        const bullet = alienBullets[i];
        bullet.y += 5 + GameState.level;

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

/**
 * Verifica le collisioni
 * Ritorna: { gameOver: boolean, levelComplete: boolean, livesLost: number }
 */
export function checkCollisions() {
    let result = { gameOver: false, levelComplete: false, livesLost: 0 };

    // Collisioni proiettili giocatore
    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        let bulletRemoved = false;
        const bullet = bullets[bulletIndex];

        // Collisione con invasori
        for (let invaderIndex = invaders.length - 1; invaderIndex >= 0; invaderIndex--) {
            const invader = invaders[invaderIndex];
            if (Math.abs(bullet.x - invader.x) < 20 && Math.abs(bullet.y - invader.y) < 20) {
                gameArea.removeChild(invader.el);
                gameArea.removeChild(bullet.el);

                let points;
                switch(invader.type) {
                    case '👽': points = 30; break;
                    case '👾': points = 20; break;
                    case '👻': points = 10; break;
                    default: points = 10;
                }

                GameState.setScore(GameState.score + points * GameState.level);
                GameState.updateHiScore();
                updateUI();

                invaders.splice(invaderIndex, 1);
                bullets.splice(bulletIndex, 1);
                Audio.explosionSound();
                bulletRemoved = true;
                break;
            }
        }

        if (bulletRemoved) continue;

        // Collisione con UFO
        if (ufo.active && Math.abs(bullet.x - ufo.x) < 20 && Math.abs(bullet.y - ufo.y) < 20) {
            gameArea.removeChild(ufo.el);
            gameArea.removeChild(bullet.el);
            bullets.splice(bulletIndex, 1);
            ufo.active = false;
            const ufoScore = ufo.score || 100;
            GameState.setScore(GameState.score + ufoScore);
            GameState.updateHiScore();
            updateUI();
            Audio.explosionSound();
            showTemporaryMessage(`UFO colpito! +${ufoScore} punti`);
            continue;
        }

        // Collisione con barriere
        let barrierHit = false;
        for (let barrierIndex = barriers.length - 1; barrierIndex >= 0; barrierIndex--) {
            const barrier = barriers[barrierIndex];
            if (Math.abs(bullet.x - barrier.x) < 10 && Math.abs(bullet.y - barrier.y) < 10) {
                gameArea.removeChild(bullet.el);
                bullets.splice(bulletIndex, 1);

                barrier.hp -= 1;

                if (barrier.hp <= 0) {
                    gameArea.removeChild(barrier.el);
                    barriers.splice(barrierIndex, 1);
                } else {
                    barrier.el.style.opacity = barrier.hp / 4;
                }
                barrierHit = true;
                break;
            }
        }

        if (barrierHit) continue;
    }

    // Collisioni proiettili alieni
    for (let bulletIndex = alienBullets.length - 1; bulletIndex >= 0; bulletIndex--) {
        let bulletRemoved = false;
        const bullet = alienBullets[bulletIndex];

        // Collisione con giocatore
        if (Math.abs(bullet.x - player.x) < 20 && Math.abs(bullet.y - player.y) < 20) {
            gameArea.removeChild(bullet.el);
            alienBullets.splice(bulletIndex, 1);
            GameState.setLives(GameState.lives - 1);
            updateUI();
            Audio.playerExplosionSound();
            result.livesLost++;
            if (GameState.lives <= 0) {
                result.gameOver = true;
            }
            bulletRemoved = true;
            continue;
        }

        if (bulletRemoved) continue;

        // Collisione con barriere
        let barrierHit = false;
        for (let barrierIndex = barriers.length - 1; barrierIndex >= 0; barrierIndex--) {
            const barrier = barriers[barrierIndex];
            if (Math.abs(bullet.x - barrier.x) < 10 && Math.abs(bullet.y - barrier.y) < 10) {
                gameArea.removeChild(bullet.el);
                alienBullets.splice(bulletIndex, 1);

                barrier.hp -= 1;

                if (barrier.hp <= 0) {
                    gameArea.removeChild(barrier.el);
                    barriers.splice(barrierIndex, 1);
                } else {
                    barrier.el.style.opacity = barrier.hp / 4;
                }
                barrierHit = true;
                break;
            }
        }

        if (barrierHit) continue;
    }

    // Controllo se gli invasori hanno raggiunto il fondo
    for (let i = 0; i < invaders.length; i++) {
        const invader = invaders[i];
        if (invader.y > 530) {
            result.gameOver = true;
            return result;
        }
    }

    // Controllo se tutti gli invasori sono stati eliminati
    if (invaders.length === 0) {
        result.levelComplete = true;
    }

    return result;
}

/**
 * Pulisce tutte le entità
 */
export function cleanupEntities() {
    bullets = [];
    alienBullets = [];
    invaders = [];
    barriers = [];
    ufo = { x: -30, y: 30, el: null, active: false };
}
