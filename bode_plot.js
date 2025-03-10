// Global math object from window.math (loaded by script tag)
window.math = math;

function findRoots(coefficients) {
    if (coefficients.length <= 1) return [];
    
    try {
        // Converti coefficienti in formato per math.polynomialRoot
        const polyCoeffs = coefficients.reverse();
        
        // Calcola le radici usando math.polynomialRoot
        const roots = math.polynomialRoot(...polyCoeffs);
        
        // Formatta le radici
        return roots.map(root => {
            if (math.typeOf(root) === 'Complex') {
                const re = root.re.toFixed(2);
                const im = Math.abs(root.im).toFixed(2);
                const sign = root.im >= 0 ? '+' : '-';
                return `${re}${sign}${im}j`;
            }
            return root.toFixed(2);
        });
        
    } catch (error) {
        console.error("Error calculating roots:", error);
        return ["Error calculating roots"];
    }
}

function computeBode(num, den, w) {
    try {
        // Crea il numero complesso s = jw
        const s = math.complex(0, w);

        // Calcola H(s) = num(s)/den(s)
        let numVal = math.complex(0);
        let denVal = math.complex(0);

        // Valuta il numeratore
        for (let i = 0; i < num.length; i++) {
            const power = num.length - 1 - i;
            numVal = math.add(numVal, 
                math.multiply(num[i], math.pow(s, power))
            );
        }

        // Valuta il denominatore
        for (let i = 0; i < den.length; i++) {
            const power = den.length - 1 - i;
            denVal = math.add(denVal,
                math.multiply(den[i], math.pow(s, power))
            );
        }

        // Calcola H(s)
        const H = math.divide(numVal, denVal);

        // Calcola magnitude e phase
        const magnitude = math.abs(H);
        let phase = math.arg(H);

        // Normalizza la fase tra -π e π
        if (phase > Math.PI) phase -= 2 * Math.PI;
        else if (phase < -Math.PI) phase += 2 * Math.PI;

        return { magnitude, phase };
    } catch (error) {
        console.error("Error computing Bode:", error);
        return { magnitude: 0, phase: 0 };
    }
}

function formatPolynomial(coefficients) {
    return coefficients.map((coeff, i) => {
        const power = coefficients.length - 1 - i;
        if (power === 0) return coeff.toString();
        if (power === 1) return `${coeff}s`;
        return `${coeff}s^${power}`;
    }).join(' + ');
}

function downloadPlot(canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

window.calculateBode = function() {
    try {
        const numInput = document.getElementById('num').value.trim();
        const denInput = document.getElementById('den').value.trim();
        
        if (!numInput || !denInput) {
            throw new Error("I campi non possono essere vuoti");
        }
        
        // Validazione dell'input con regex per permettere solo numeri, virgole e spazi
        if (!/^[\d\.\,\s\-\+]+$/.test(numInput) || !/^[\d\.\,\s\-\+]+$/.test(denInput)) {
            throw new Error("I coefficienti devono contenere solo numeri, virgole, spazi e segni + o -");
        }
        
        let num = numInput.split(',').map(n => n.trim()).map(Number);
        let den = denInput.split(',').map(n => n.trim()).map(Number);
        
        if (!num.length || !den.length) {
            throw new Error("Inserire almeno un coefficiente per numeratore e denominatore");
        }
        
        if (num.some(isNaN) || den.some(isNaN)) {
            throw new Error("I coefficienti devono essere numeri validi");
        }
        
        if (den[0] === 0) {
            throw new Error("Il coefficiente di grado massimo del denominatore non può essere zero");
        }

        // Calcolo zeri e poli
        const zeros = findRoots(num);
        const poles = findRoots(den);
        
        // Visualizza i risultati in modo sicuro usando textContent invece di innerHTML
        const zerosElement = document.getElementById('zeros');
        const polesElement = document.getElementById('poles');
        
        if (zerosElement) zerosElement.textContent = 'Zeri: ' + zeros.join(', ');
        if (polesElement) polesElement.textContent = 'Poli: ' + poles.join(', ');
        
        // Visualizza la funzione di trasferimento in modo sicuro
        const functionNumElement = document.getElementById('function-num');
        const functionDenElement = document.getElementById('function-den');
        
        if (functionNumElement) functionNumElement.textContent = formatPolynomial(num);
        if (functionDenElement) functionDenElement.textContent = formatPolynomial(den);

        // Genera le frequenze
        let w = [];
        for (let i = -2; i <= 2; i += 0.01) {
            w.push(Math.pow(10, i));
        }

        let bode = w.map(wi => computeBode(num, den, wi));
        let magData = bode.map(b => 20 * Math.log10(b.magnitude));
        let phaseData = bode.map(b => b.phase * 180 / Math.PI);
        
        plotBode('magPlot', w, magData, 'Magnitude (dB)');
        plotBode('phasePlot', w, phaseData, 'Phase (degrees)');
        plotComplexPlane(zeros, poles);
    } catch (error) {
        alert("Errore: " + error.message);
        console.error("Errore completo:", error);
    }
};

function parseComplex(s) {
    // Validazione dell'input per la funzione parseComplex
    if (typeof s === 'number') return { real: s, imag: 0 };
    
    if (typeof s !== 'string') {
        console.error("parseComplex: input must be a string or number");
        return { real: 0, imag: 0 };
    }
    
    // Validazione più rigorosa dell'input con regex
    const complexPattern = /^([-+]?\d*\.?\d+)\s*([+-]\s*\d*\.?\d+)j$/;
    const realPattern = /^[-+]?\d*\.?\d+$/;
    
    if (complexPattern.test(s)) {
        const match = s.match(complexPattern);
        return {
            real: parseFloat(match[1]),
            imag: parseFloat(match[2].replace(/\s/g, ''))
        };
    } else if (realPattern.test(s)) {
        return { real: parseFloat(s), imag: 0 };
    } else {
        console.error("parseComplex: invalid complex number format:", s);
        return { real: 0, imag: 0 };
    }
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

function plotComplexPlane(zeros, poles) {
    const canvas = document.getElementById('complexPlane');
    const ctx = canvas.getContext('2d');
    const margin = 40;
    const width = canvas.width - 2 * margin;
    const height = canvas.height - 2 * margin;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find plot bounds
    let points = [...zeros.map(z => parseComplex(z)), ...poles.map(p => parseComplex(p))];
    let maxAbs = Math.max(...points.map(p => Math.sqrt(p.real * p.real + p.imag * p.imag))) || 1;
    let bound = Math.ceil(maxAbs * 1.2);
    
    // Draw axes
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical axis
    ctx.moveTo(canvas.width / 2, margin);
    ctx.lineTo(canvas.width / 2, height + margin);
    // Horizontal axis
    ctx.moveTo(margin, canvas.height / 2);
    ctx.lineTo(width + margin, canvas.height / 2);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = -bound; i <= bound; i++) {
        if (i === 0) continue;
        // Vertical grid lines
        let x = canvas.width / 2 + (i / bound) * width / 2;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, height + margin);
        ctx.stroke();
        // Horizontal grid lines
        let y = canvas.height / 2 + (i / bound) * height / 2;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width + margin, y);
        ctx.stroke();
    }
    
    // Plot zeros
    ctx.strokeStyle = '#2196f3';
    zeros.forEach(z => {
        let point = parseComplex(z);
        let x = canvas.width / 2 + (point.real / bound) * width / 2;
        let y = canvas.height / 2 - (point.imag / bound) * height / 2;
        
        // Draw X for zeros
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 5);
        ctx.lineTo(x + 5, y + 5);
        ctx.moveTo(x + 5, y - 5);
        ctx.lineTo(x - 5, y + 5);
        ctx.stroke();
    });
    
    // Plot poles
    ctx.strokeStyle = '#f44336';
    poles.forEach(p => {
        let point = parseComplex(p);
        let x = canvas.width / 2 + (point.real / bound) * width / 2;
        let y = canvas.height / 2 - (point.imag / bound) * height / 2;
        
        // Draw O for poles
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.stroke();
    });
    
    // Add labels
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.fillText('Re', width + margin - 20, canvas.height / 2 - 5);
    ctx.fillText('Im', canvas.width / 2 + 5, margin + 15);
}

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.calculateBode !== 'function') {
        console.error('calculateBode function not properly initialized');
    }
});