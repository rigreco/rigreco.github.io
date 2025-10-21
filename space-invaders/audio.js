/**
 * Audio Module
 * Gestisce tutto il sistema audio del gioco
 */

// Audio context e variabili
export let audioContext = null;
export let audioContextStarted = false;
export let alienMoveSound = null;
let alienSoundSequence = [0, 1, 2, 3];
let currentSequenceIndex = 0;
const alienSoundFrequencies = [55, 58, 62, 65];

/**
 * Inizializza l'AudioContext
 */
export function initAudioContext() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        audioContextStarted = true;

        // Crea il suono degli alieni subito per assicurarsi che sia disponibile
        if (!alienMoveSound) {
            alienMoveSound = createAlienMoveSound();
        }
    } catch (e) {
        console.error('Errore nell\'inizializzazione dell\'AudioContext:', e);
    }
}

/**
 * Funzione generica per riprodurre un suono
 */
export function playSound(frequency, duration, type = 'sine') {
    if (!audioContextStarted || !audioContext) {
        initAudioContext();
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

/**
 * Crea il suono degli alieni
 */
export function createAlienMoveSound() {
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

/**
 * Riproduce il suono del movimento degli alieni
 */
export function playAlienMoveSound() {
    if (!audioContextStarted || !audioContext || !alienMoveSound) {
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
        alienMoveSound.gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
        alienMoveSound.gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + soundDuration);

        currentSequenceIndex = (currentSequenceIndex + 1) % alienSoundSequence.length;
    } catch (e) {
        console.warn("Errore nella riproduzione del suono degli alieni:", e);
        if (audioContextStarted && audioContext) {
            try {
                alienMoveSound = createAlienMoveSound();
            } catch (err) {
                console.error("Impossibile ricreare il suono degli alieni:", err);
            }
        }
    }
}

/**
 * Ferma il suono degli alieni
 */
export function stopAlienMoveSound() {
    if (alienMoveSound && alienMoveSound.oscillator) {
        try {
            alienMoveSound.oscillator.stop();
        } catch (e) {
            console.warn("Impossibile fermare l'oscillator:", e);
        }
    }
}

/**
 * Ricrea il suono degli alieni
 */
export function recreateAlienMoveSound() {
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

// Suoni specifici del gioco
export function shootSound() {
    playSound(880, 0.1, 'square');
}

export function explosionSound() {
    playSound(110, 0.5, 'sawtooth');
}

export function gameOverSound() {
    playSound(55, 2, 'triangle');
}

export function alienShootSound() {
    playSound(440, 0.1, 'sine');
}

export function ufoSound() {
    playSound(660, 0.1, 'sine');
}

export function levelCompleteSound() {
    playSound(1320, 1, 'sine');
}

export function powerupSound() {
    playSound(880, 0.5, 'sine');
}

export function lifeUpSound() {
    playSound(880, 1, 'triangle');
}

export function playerExplosionSound() {
    playSound(220, 0.5, 'triangle');
}

// Eventi per attivare l'audio al primo input dell'utente
export function setupAudioEventListeners() {
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });
    document.addEventListener('keydown', initAudioContext, { once: true });
}
