function plotFunction() {
    const functionString = document.getElementById('function').value;
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const canvas = document.getElementById('functionPlot');
    const ctx = canvas.getContext('2d');
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Funzione per mappare i valori x e y alle coordinate del canvas
    const mapX = x => (x - xMin) / (xMax - xMin) * canvas.width;
    const mapY = y => canvas.height - (y - yMin) / (yMax - yMin) * canvas.height;
    
    // Funzione per valutare l'espressione
    function evaluateFunction(x) {
        return Function('x', `return ${functionString}`)(x);
    }
    
    // Trova yMin e yMax
    let yMin = Infinity, yMax = -Infinity;
    for (let x = xMin; x <= xMax; x += (xMax - xMin) / 1000) {
        try {
            const y = evaluateFunction(x);
            yMin = Math.min(yMin, y);
            yMax = Math.max(yMax, y);
        } catch (e) {
            console.error('Errore nella valutazione della funzione:', e);
        }
    }
    
    // Aggiungi un po' di margine a yMin e yMax
    const yMargin = (yMax - yMin) * 0.1;
    yMin -= yMargin;
    yMax += yMargin;
    
    // Disegna gli assi
    ctx.beginPath();
    ctx.moveTo(mapX(xMin), mapY(0));
    ctx.lineTo(mapX(xMax), mapY(0));
    ctx.moveTo(mapX(0), mapY(yMin));
    ctx.lineTo(mapX(0), mapY(yMax));
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    // Traccia la funzione
    ctx.beginPath();
    for (let x = xMin; x <= xMax; x += (xMax - xMin) / 1000) {
        try {
            const y = evaluateFunction(x);
            const px = mapX(x);
            const py = mapY(y);
            if (x === xMin) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        } catch (e) {
            console.error('Errore nella valutazione della funzione:', e);
        }
    }
    ctx.strokeStyle = '#f00';
    ctx.stroke();
}

document.getElementById('plotButton').addEventListener('click', plotFunction);