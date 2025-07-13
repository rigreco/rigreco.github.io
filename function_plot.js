let currentXMin = -10;
let currentXMax = 10;
let currentYMin, currentYMax;

function plotFunction() {
    const functionInput = document.getElementById('function');
    if (!functionInput) {
        console.error("Elemento input 'function' non trovato");
        return;
    }
    const functionString = functionInput.value.trim();
    if (!functionString) {
        console.error("Nessuna funzione inserita");
        return;
    }

    const canvas = document.getElementById('functionPlot');
    if (!canvas) {
        console.error("Canvas 'functionPlot' non trovato");
        return;
    }
    const ctx = canvas.getContext('2d');
    
    // Aggiorna xMin e xMax dai valori correnti
    const xMinInput = document.getElementById('xMin');
    const xMaxInput = document.getElementById('xMax');
    if (xMinInput && xMaxInput) {
        xMinInput.value = currentXMin;
        xMaxInput.value = currentXMax;
    }

    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Trova yMin e yMax
    let yMin = Infinity, yMax = -Infinity;
    for (let x = currentXMin; x <= currentXMax; x += (currentXMax - currentXMin) / 1000) {
        try {
            const y = evaluateFunction(x, functionString);
            if (isFinite(y)) {
                yMin = Math.min(yMin, y);
                yMax = Math.max(yMax, y);
            }
        } catch (e) {
            console.error('Errore nella valutazione della funzione:', e);
        }
    }
    
    // Aggiungi un po' di margine a yMin e yMax
    const yMargin = (yMax - yMin) * 0.1;
    yMin -= yMargin;
    yMax += yMargin;

    // Salva yMin e yMax correnti
    currentYMin = yMin;
    currentYMax = yMax;

    // Funzioni per mappare i valori x e y alle coordinate del canvas
    const mapX = x => (x - currentXMin) / (currentXMax - currentXMin) * canvas.width;
    const mapY = y => canvas.height - (y - yMin) / (yMax - yMin) * canvas.height;

    // Disegna la griglia
    drawGrid(ctx, mapX, mapY);

    // Traccia la funzione
    ctx.beginPath();
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;

    let isDrawing = false;
    let lastY = null;
    const threshold = (yMax - yMin) / 10; // Soglia per discontinuità

    for (let i = 0; i <= 1000; i++) {
        const x = currentXMin + (i / 1000) * (currentXMax - currentXMin);
        const y = evaluateFunction(x, functionString);

        if (isFinite(y)) {
            const px = mapX(x);
            const py = mapY(y);

            if (!isDrawing || (lastY !== null && Math.abs(y - lastY) > threshold)) {
                ctx.moveTo(px, py);
                isDrawing = true;
            } else {
                ctx.lineTo(px, py);
            }

            lastY = y;
        } else {
            isDrawing = false;
            lastY = null;
        }
    }

    ctx.stroke();
}

function drawGrid(ctx, mapX, mapY) {
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    // Linee verticali e etichette x
    for (let x = Math.ceil(currentXMin); x <= Math.floor(currentXMax); x++) {
        const px = mapX(x);
        ctx.moveTo(px, 0);
        ctx.lineTo(px, ctx.canvas.height);
        ctx.fillText(x.toString(), px, mapY(0) + 15);
    }

    // Calcola l'intervallo appropriato per le etichette y
    const yRange = currentYMax - currentYMin;
    const yInterval = Math.pow(10, Math.floor(Math.log10(yRange))) / 2;

    // Linee orizzontali e etichette y
    for (let y = Math.ceil(currentYMin / yInterval) * yInterval; y <= currentYMax; y += yInterval) {
        const py = mapY(y);
        ctx.moveTo(0, py);
        ctx.lineTo(ctx.canvas.width, py);
        
        // Etichetta y
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(y.toFixed(1), mapX(0) - 5, py + 4);
    }

    ctx.stroke();
}

function evaluateFunction(x, functionString) {
    if (typeof functionString !== 'string' || functionString.trim() === '') {
        throw new Error('Funzione non valida');
    }

    // Validazione dell'input per permettere solo caratteri matematici sicuri
    if (!/^[a-zA-Z0-9\s\+\-\*\/\^\(\)\.\,\_\[\]]*$/.test(functionString)) {
        throw new Error('Input non valido. Sono permessi solo caratteri per espressioni matematiche.');
    }

    try {
        // Crea un ambiente math.js sicuro con funzioni limitate
        const limitedEval = math.create();
        limitedEval.import({
            // Importa solo funzioni matematiche sicure
            'number': math.number,
            'add': math.add,
            'subtract': math.subtract,
            'multiply': math.multiply,
            'divide': math.divide,
            'pow': math.pow,
            'sqrt': math.sqrt,
            'abs': math.abs,
            'exp': math.exp,
            'log': math.log,
            'log10': math.log10,
            'sin': math.sin,
            'cos': math.cos, 
            'tan': math.tan,
            'asin': math.asin,
            'acos': math.acos,
            'atan': math.atan,
            'sinh': math.sinh,
            'cosh': math.cosh,
            'tanh': math.tanh,
            'pi': math.pi,
            'e': math.e
        }, { override: true });

        // Preprocessa la stringa per gestire esponenti negativi
        let processedString = functionString;
        
        // Aggiungi parentesi attorno ai numeri negativi prima dell'esponente
        processedString = processedString.replace(/(-\d*\.?\d+)\s*\^/g, '($1)^');
        
        // Valuta l'espressione con l'ambiente limitato
        const scope = { x: x };
        return limitedEval.evaluate(processedString, scope);
    } catch (e) {
        console.error('Errore nella valutazione della funzione:', e);
        return NaN;
    }
}

function adjustZoom(zoomFactor) {
    const xCenter = (currentXMin + currentXMax) / 2;
    const xRange = currentXMax - currentXMin;
    let newXMin = xCenter - xRange * zoomFactor / 2;
    let newXMax = xCenter + xRange * zoomFactor / 2;

    // Evita di zoomare troppo vicino alla discontinuità
    const discontinuityPoint = findDiscontinuityPoint();
    if (discontinuityPoint !== null) {
        const minDistance = (newXMax - newXMin) / 100; // Distanza minima dalla discontinuità
        if (Math.abs(discontinuityPoint - newXMin) < minDistance) {
            newXMin = discontinuityPoint - minDistance;
        }
        if (Math.abs(discontinuityPoint - newXMax) < minDistance) {
            newXMax = discontinuityPoint + minDistance;
        }
    }

    currentXMin = newXMin;
    currentXMax = newXMax;
    plotFunction();
}

function findDiscontinuityPoint() {
    const functionString = document.getElementById('function').value.trim();
    // Cerca la discontinuità nell'intervallo corrente
    for (let x = currentXMin; x <= currentXMax; x += (currentXMax - currentXMin) / 1000) {
        if (!isFinite(evaluateFunction(x, functionString))) {
            return x;
        }
    }
    return null;
}

function zoomIn() {
    adjustZoom(0.8);
}

function zoomOut() {
    adjustZoom(1.2);
}

function resetZoom() {
    currentXMin = -10;
    currentXMax = 10;
    plotFunction();
}

// Aggiungi event listener per i pulsanti di zoom e il pulsante di tracciamento
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('zoomIn').addEventListener('click', zoomIn);
    document.getElementById('zoomOut').addEventListener('click', zoomOut);
    document.getElementById('resetZoom').addEventListener('click', resetZoom);
    document.getElementById('plotButton').addEventListener('click', plotFunction);

    // Inizializza il grafico al caricamento della pagina
    plotFunction();
});