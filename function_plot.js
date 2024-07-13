function plotFunction() {
    const functionString = document.getElementById('function').value;
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const canvas = document.getElementById('functionPlot');
    const ctx = canvas.getContext('2d');
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disegna gli assi
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    // Funzione per valutare l'espressione
    function evaluateFunction(x) {
        return eval(functionString.replace(/x/g, `(${x})`));
    }
    
    // Traccia la funzione
    ctx.beginPath();
    for (let px = 0; px < canvas.width; px++) {
        const x = xMin + (xMax - xMin) * px / canvas.width;
        let y;
        try {
            y = evaluateFunction(x);
        } catch (e) {
            console.error('Errore nella valutazione della funzione:', e);
            continue;
        }
        const py = canvas.height - (y - xMin) / (xMax - xMin) * canvas.height;
        if (px === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.strokeStyle = '#f00';
    ctx.stroke();
}

document.getElementById('plotButton').addEventListener('click', plotFunction);