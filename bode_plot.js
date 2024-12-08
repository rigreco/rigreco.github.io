function computeBode(num, den, w) {
    let numReal = 0;
    let numImag = 0;
    let denReal = 0;
    let denImag = 0;
    
    for (let i = 0; i < num.length; i++) {
        let power = num.length - 1 - i;
        let term = num[i] * Math.pow(w, power);
        numReal += term * Math.cos(power * Math.PI / 2);
        numImag += term * Math.sin(power * Math.PI / 2);
    }
    
    for (let i = 0; i < den.length; i++) {
        let power = den.length - 1 - i;
        let term = den[i] * Math.pow(w, power);
        denReal += term * Math.cos(power * Math.PI / 2);
        denImag += term * Math.sin(power * Math.PI / 2);
    }
    
    let magnitude = Math.sqrt(Math.pow(numReal, 2) + Math.pow(numImag, 2)) / 
                    Math.sqrt(Math.pow(denReal, 2) + Math.pow(denImag, 2));
    let phase = Math.atan2(numImag, numReal) - Math.atan2(denImag, denReal);
    
    return { magnitude, phase };
}

function calculateBode() {
    let num = document.getElementById('num').value.split(',').map(Number);
    let den = document.getElementById('den').value.split(',').map(Number);
    let w = [];
    for (let i = -2; i <= 2; i += 0.01) {
        w.push(Math.pow(10, i));
    }
    let bode = w.map(wi => computeBode(num, den, wi));
    let magData = bode.map(b => 20 * Math.log10(b.magnitude));
    let phaseData = bode.map(b => b.phase * 180 / Math.PI);
    plotBode('magPlot', w, magData, 'Magnitude (dB)');
    plotBode('phasePlot', w, phaseData, 'Phase (degrees)');
}

function plotBode(canvasId, w, data, yLabel) {
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');
    
    let margin = 60;
    let width = canvas.width - 2 * margin;
    let height = canvas.height - 2 * margin;
    
    let xMin = Math.min(...w);
    let xMax = Math.max(...w);
    let yMin = Math.floor(Math.min(...data) / 20) * 20;
    let yMax = Math.ceil(Math.max(...data) / 20) * 20;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) {
        let x = margin + (i - (-2)) / 4 * width;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, height + margin);
        ctx.stroke();
        ctx.fillStyle = "#000000";
        ctx.fillText("10^" + i, x - 10, height + margin + 20);
    }
    for (let i = yMin; i <= yMax; i += 20) {
        let y = height + margin - (i - yMin) / (yMax - yMin) * height;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width + margin, y);
        ctx.stroke();
        ctx.fillStyle = "#000000";
        ctx.fillText(i, margin - 30, y + 5);
    }
    
    // Draw axes
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height + margin);
    ctx.lineTo(width + margin, height + margin);
    ctx.stroke();
    
    ctx.font = '12px Arial';
    ctx.fillStyle = "#000000";
    ctx.fillText(yLabel, margin / 2, margin / 2);
    ctx.fillText('Frequency (rad/s)', width / 2 + margin, height + margin + 40);
    
    // Plot data
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
        let x = margin + (Math.log10(w[i]) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin)) * width;
        let y = height + margin - (d - yMin) / (yMax - yMin) * height;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
}