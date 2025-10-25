/**
 * UI Module
 * Gestisce tutte le schermate e l'interfaccia utente
 */

import * as GameState from './game-state.js';
import * as Audio from './audio.js';

// Elementi UI
let scoreElement;
let livesElement;
let levelElement;
let hiScoreElement;
let gameArea = null;
let temporaryMessageElement = null;
let lastAppliedScale = null;
let resizeTimeout;

/**
 * Inizializza il riferimento all'area di gioco
 */
export function initGameArea(area) {
    gameArea = area;
    temporaryMessageElement = document.getElementById('temporaryMessage');
}

/**
 * Ottieni lastAppliedScale
 */
export function getLastAppliedScale() {
    return lastAppliedScale;
}

/**
 * Mostra un messaggio temporaneo
 */
export function showTemporaryMessage(message, duration = 2000) {
    if (!temporaryMessageElement || !temporaryMessageElement.parentNode) {
        temporaryMessageElement = document.createElement('div');
        temporaryMessageElement.id = 'temporaryMessage';
        temporaryMessageElement.className = 'message';

        // Stili di base
        temporaryMessageElement.style.position = 'absolute';
        temporaryMessageElement.style.top = '200px';
        temporaryMessageElement.style.left = '50%';
        temporaryMessageElement.style.transform = 'translateX(-50%)';
        temporaryMessageElement.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        temporaryMessageElement.style.color = 'white';
        temporaryMessageElement.style.padding = '15px 30px';
        temporaryMessageElement.style.borderRadius = '5px';
        temporaryMessageElement.style.fontSize = '24px';
        temporaryMessageElement.style.textAlign = 'center';
        temporaryMessageElement.style.zIndex = '10000';
        temporaryMessageElement.style.fontWeight = 'bold';
        temporaryMessageElement.style.border = '2px solid white';
        temporaryMessageElement.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        gameArea.appendChild(temporaryMessageElement);
    }

    temporaryMessageElement.textContent = message;
    temporaryMessageElement.style.display = 'block';

    if (temporaryMessageElement.timeoutId) {
        clearTimeout(temporaryMessageElement.timeoutId);
    }

    temporaryMessageElement.timeoutId = setTimeout(() => {
        if (temporaryMessageElement) {
            temporaryMessageElement.style.display = 'none';
        }
    }, duration);

    return temporaryMessageElement;
}

/**
 * Gestisce il ridimensionamento della finestra
 */
export function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const gameAspectRatio = 600 / 600;
        const windowAspectRatio = window.innerWidth / window.innerHeight;

        let scale;

        if (windowAspectRatio < gameAspectRatio) {
            scale = window.innerWidth / 600 * 0.95;
        } else {
            scale = window.innerHeight / 600 * 0.95;
        }

        if (lastAppliedScale !== null && Math.abs(lastAppliedScale - scale) < 0.1) {
            scale = lastAppliedScale;
        } else {
            lastAppliedScale = scale;
        }

        gameArea.style.position = 'absolute';
        gameArea.style.top = '50%';
        gameArea.style.left = '50%';
        gameArea.style.transform = `translate(-50%, -50%) scale(${scale})`;
        gameArea.style.transformOrigin = 'center center';
        gameArea.style.margin = '0';

        const touchControlsContainer = document.getElementById('touchControlsContainer');
        if (touchControlsContainer) {
            touchControlsContainer.style.display = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'flex' : 'none';

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

        if (temporaryMessageElement && temporaryMessageElement.parentNode) {
            temporaryMessageElement.style.top = '10%';
            temporaryMessageElement.style.left = '50%';
            temporaryMessageElement.style.transform = 'translateX(-50%)';
        }
    }, 250);
}

/**
 * Inizializza gli elementi UI
 */
export function initUI() {
    const uiContainer = document.getElementById('uiContainer');

    scoreElement = uiContainer.querySelector('#score') || createUIElement('score', `SCORE ${GameState.score.toString().padStart(5, '0')}`);
    hiScoreElement = uiContainer.querySelector('#hi-score') || createUIElement('hi-score', `HI-SCORE ${GameState.hiScore.toString().padStart(5, '0')}`);
    livesElement = uiContainer.querySelector('#lives') || createUIElement('lives', `LIVES ${GameState.lives}`);
    levelElement = uiContainer.querySelector('#level') || createUIElement('level', `LEVEL ${GameState.level}`);

    if (!scoreElement.parentNode) uiContainer.appendChild(scoreElement);
    if (!hiScoreElement.parentNode) uiContainer.appendChild(hiScoreElement);
    if (!livesElement.parentNode) uiContainer.appendChild(livesElement);
    if (!levelElement.parentNode) uiContainer.appendChild(levelElement);

    updateUI();
}

/**
 * Crea un elemento UI
 */
function createUIElement(id, text) {
    const element = document.createElement('div');
    element.id = id;
    element.textContent = text;
    return element;
}

/**
 * Aggiorna l'UI
 */
export function updateUI() {
    if (scoreElement) scoreElement.textContent = `SCORE ${GameState.score.toString().padStart(5, '0')}`;
    if (hiScoreElement) hiScoreElement.textContent = `HI-SCORE ${GameState.hiScore.toString().padStart(5, '0')}`;
    if (livesElement) livesElement.textContent = `LIVES ${GameState.lives}`;
    if (levelElement) levelElement.textContent = `LEVEL ${GameState.level}`;
}

/**
 * Mostra la schermata introduttiva
 */
export function showIntroScreen(startGameCallback, showHighScoresCallback) {
    GameState.setGameState('intro');

    const isReturningFromHighScore = document.getElementById('highScoreScreen') !== null;
    const fontStyle = "'PrintChar21', monospace";

    if (!document.querySelector('link[href*="PrintChar21"]')) {
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = '../webfonts/PrintChar21/stylesheet40.css';
        document.head.appendChild(fontLink);
    }

    gameArea.innerHTML = `
        <div id="introScreen" style="color: white; text-align: center; padding-top: 30px;">
            <div id="introHiScore" style="position: absolute; top: 10px; left: 0; right: 0; text-align: center; font-family: ${fontStyle};">HI-SCORE ${GameState.hiScore.toString().padStart(5, '0')}</div>
            <div id="playText" style="margin: 30px 0 15px; cursor: pointer; display: inline-block; padding: 8px 30px; font-family: ${fontStyle};">
                <span id="pla-text">PLA</span><span id="y-letter" style="display: inline-block; transform: ${isReturningFromHighScore ? 'scaleY(1)' : 'scaleY(-1)'};">Y</span>
            </div>
            <h1 style="font-family: ${fontStyle};">COSMIC INVADERS</h1>
            <div id="scoreTable" style="display: flex; flex-direction: column; align-items: center; margin-top: 10px; font-family: ${fontStyle};"></div>
            <div id="buttons" style="margin-top: 20px; visibility: ${isReturningFromHighScore ? 'visible' : 'hidden'};">
                <button id="highScoresButton" class="arcade-button" style="margin-top: 15px; margin-bottom: 20px; font-family: ${fontStyle};">HIGH SCORES</button>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .arcade-button {
            font-family: 'PrintChar21', monospace;
            background-color: #000;
            color: #fff;
            border: 2px solid #fff;
            padding: 8px 20px;
            font-size: 16px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 5px;
            transition: all 0.2s;
        }
        .arcade-button:hover {
            background-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 10px white;
        }
    `;
    document.head.appendChild(style);

    const scoreTexts = [
        { icon: "🛸", points: "? MYSTERY" },
        { icon: "👽", points: "30 POINTS" },
        { icon: "👾", points: "20 POINTS" },
        { icon: "👻", points: "10 POINTS" }
    ];

    const scoreTable = document.getElementById('scoreTable');

    const titleLine = document.createElement('div');
    titleLine.textContent = "*SCORE ADVANCE TABLE*";
    titleLine.style.marginBottom = "10px";
    titleLine.style.fontWeight = "bold";
    scoreTable.appendChild(titleLine);

    scoreTexts.forEach((score, index) => {
        const textLine = document.createElement('div');
        textLine.id = `score-line-${index}`;
        textLine.style.width = "200px";
        textLine.style.display = "flex";
        textLine.style.alignItems = "center";
        textLine.style.justifyContent = "flex-start";
        textLine.style.height = '1.5em';
        textLine.style.margin = "3px 0";

        const iconContainer = document.createElement('span');
        iconContainer.style.display = "inline-block";
        iconContainer.style.width = "25px";
        iconContainer.style.textAlign = "right";
        iconContainer.style.paddingRight = "5px";
        iconContainer.innerHTML = `${score.icon}`;

        const equalContainer = document.createElement('span');
        equalContainer.id = `equal-text-${index}`;
        equalContainer.style.width = "15px";
        equalContainer.style.textAlign = "center";

        if (isReturningFromHighScore) {
            equalContainer.textContent = "=";
        }

        const pointsContainer = document.createElement('span');
        pointsContainer.id = `points-text-${index}`;
        pointsContainer.style.textAlign = "left";
        pointsContainer.style.paddingLeft = "5px";

        if (isReturningFromHighScore) {
            pointsContainer.textContent = score.points;
        }

        textLine.appendChild(iconContainer);
        textLine.appendChild(equalContainer);
        textLine.appendChild(pointsContainer);

        scoreTable.appendChild(textLine);
    });

    if (isReturningFromHighScore) {
        const playText = document.getElementById('playText');
        playText.style.border = '2px solid white';
        playText.style.backgroundColor = 'rgba(50, 50, 50, 0.5)';
        playText.style.textShadow = '0 0 10px white';
        playText.classList.add('arcade-button');
        playText.addEventListener('click', startGameCallback);
        document.getElementById('highScoresButton').addEventListener('click', showHighScoresCallback);
        return;
    }

    // Animazione (versione semplificata per brevità - nel codice completo includerebbe tutta l'animazione)
    let lineIndex = 0;
    let isTypingEqual = true;

    function typeText() {
        if (lineIndex < scoreTexts.length) {
            if (isTypingEqual) {
                const equalSpan = document.getElementById(`equal-text-${lineIndex}`);
                equalSpan.textContent = "=";
                isTypingEqual = false;
                setTimeout(typeText, 150);
            } else {
                const pointsSpan = document.getElementById(`points-text-${lineIndex}`);
                const pointsText = scoreTexts[lineIndex].points;

                if (!pointsSpan.textContent) {
                    pointsSpan.textContent = pointsText.charAt(0);
                    setTimeout(typeText, 150);
                } else if (pointsSpan.textContent.length < pointsText.length) {
                    pointsSpan.textContent = pointsText.substring(0, pointsSpan.textContent.length + 1);
                    setTimeout(typeText, 150);
                } else {
                    lineIndex++;
                    isTypingEqual = true;
                    setTimeout(typeText, 400);
                }
            }
        } else {
            startAlienYAnimation();
        }
    }

    function startAlienYAnimation() {
        const playText = document.getElementById('playText');
        const yLetter = document.getElementById('y-letter');

        const alien = document.createElement('div');
        alien.style.position = 'absolute';
        alien.style.fontSize = '28px';
        alien.style.transition = 'left 2.5s ease-in-out, top 2s ease-in-out';
        alien.style.display = 'flex';
        alien.style.alignItems = 'center';
        alien.style.whiteSpace = 'nowrap';
        alien.style.zIndex = '1000';

        alien.innerHTML = '👾';
        alien.style.left = '600px';
        alien.style.top = '145px';
        gameArea.appendChild(alien);

        setTimeout(() => {
            alien.style.left = '315px';
        }, 1500);

        setTimeout(() => {
            yLetter.style.visibility = 'hidden';
            alien.style.flexDirection = 'row-reverse';
            alien.innerHTML = '👾<span style="display: inline-block; transform: scaleY(-1); font-family: \'PrintChar21\', monospace; margin-right: 5px; font-size: 1em;">Y</span>';

            setTimeout(() => {
                alien.style.left = '600px';
            }, 800);
        }, 4000);

        setTimeout(() => {
            alien.style.left = '600px';
            alien.style.flexDirection = 'row-reverse';
            alien.innerHTML = '👾<span style="display: inline-block; font-family: \'PrintChar21\', monospace; margin-right: 5px; font-size: 1em;">Y</span>';
            alien.style.visibility = 'visible';

            setTimeout(() => {
                alien.style.left = '315px';
            }, 800);
        }, 8000);

        setTimeout(() => {
            yLetter.style.transform = 'scaleY(1)';
            yLetter.style.visibility = 'visible';

            alien.style.visibility = 'hidden';

            playText.style.border = '2px solid white';
            playText.style.backgroundColor = 'rgba(50, 50, 50, 0.5)';
            playText.style.textShadow = '0 0 10px white';

            document.getElementById('buttons').style.visibility = 'visible';

            playText.addEventListener('click', startGameCallback);
            document.getElementById('highScoresButton').addEventListener('click', showHighScoresCallback);
        }, 12000);
    }

    typeText();
    Audio.initAudioContext();
}

/**
 * Mostra la schermata degli high scores
 */
export function showHighScores(backCallback) {
    GameState.setGameState('highScores');

    const fontStyle = "'PrintChar21', monospace";

    gameArea.innerHTML = `
        <div id="highScoreScreen" style="color: white; text-align: center; padding-top: 100px; font-family: ${fontStyle};">
            <h2>HIGH SCORES</h2>
            ${GameState.highScores.map((score, index) => `
                <div>${(index + 1).toString().padStart(2, '0')}. ${score.name.padEnd(3, ' ')} ${score.score.toString().padStart(5, '0')}</div>
            `).join('')}
            <button id="backToIntroButton" class="arcade-button" style="margin-top: 20px; font-family: ${fontStyle};">BACK</button>
        </div>
    `;
    document.getElementById('backToIntroButton').addEventListener('click', backCallback);
}

/**
 * Mostra la schermata di game over
 */
export function showGameOver(finalScore, continueCallback) {
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
        continueButton.removeEventListener('click', continueCallback);
        continueButton.addEventListener('click', continueCallback);
    }
}

/**
 * Mostra la schermata di livello completato
 */
export function showLevelComplete(nextLevelCallback) {
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
        levelCompleteElement.style.color = 'white';
        gameArea.appendChild(levelCompleteElement);
    }
    levelCompleteElement.innerHTML = `
        Livello ${GameState.level - 1} Completato!<br>
        <button id="nextLevelButton">Prossimo Livello</button>
    `;
    levelCompleteElement.style.display = 'block';

    const nextLevelButton = document.getElementById('nextLevelButton');
    if (nextLevelButton) {
        nextLevelButton.removeEventListener('click', nextLevelCallback);
        nextLevelButton.addEventListener('click', nextLevelCallback);
    }
}

/**
 * Richiede il nome per l'high score
 */
export function promptForName(score, submitCallback) {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '2000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    const promptBox = document.createElement('div');
    promptBox.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    promptBox.style.border = '2px solid white';
    promptBox.style.padding = '20px';
    promptBox.style.borderRadius = '10px';
    promptBox.style.textAlign = 'center';
    promptBox.style.color = 'white';
    promptBox.style.fontFamily = "'PrintChar21', monospace";
    promptBox.style.maxWidth = '80%';

    promptBox.innerHTML = `
        <h2>NEW HIGH SCORE: ${score}!</h2>
        <p>Enter your initials (3 letters):</p>
        <div id="name-input" style="display: flex; justify-content: center; margin: 20px 0;">
            <input type="text" id="initial1" maxlength="1" style="width: 40px; height: 40px; font-size: 24px; text-align: center; margin: 0 5px; background: black; color: white; border: 1px solid white; text-transform: uppercase;" />
            <input type="text" id="initial2" maxlength="1" style="width: 40px; height: 40px; font-size: 24px; text-align: center; margin: 0 5px; background: black; color: white; border: 1px solid white; text-transform: uppercase;" />
            <input type="text" id="initial3" maxlength="1" style="width: 40px; height: 40px; font-size: 24px; text-align: center; margin: 0 5px; background: black; color: white; border: 1px solid white; text-transform: uppercase;" />
        </div>
        <button id="submit-name" class="arcade-button" style="margin-top: 20px;">SUBMIT</button>
    `;

    overlay.appendChild(promptBox);
    gameArea.appendChild(overlay);

    const input1 = document.getElementById('initial1');
    const input2 = document.getElementById('initial2');
    const input3 = document.getElementById('initial3');
    const submitButton = document.getElementById('submit-name');

    setTimeout(() => input1.focus(), 100);

    input1.addEventListener('input', () => {
        if (input1.value.length === 1) input2.focus();
    });

    input2.addEventListener('input', () => {
        if (input2.value.length === 1) input3.focus();
    });

    function processName() {
        const initial1 = (input1.value || 'A').toUpperCase();
        const initial2 = (input2.value || 'A').toUpperCase();
        const initial3 = (input3.value || 'A').toUpperCase();
        const name = initial1 + initial2 + initial3;

        gameArea.removeChild(overlay);

        GameState.addHighScore(name, score);
        submitCallback();
    }

    submitButton.addEventListener('click', processName);

    input3.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processName();
    });
}
