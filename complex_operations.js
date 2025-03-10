// Complex operations calculator and visualizer
document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const plotDiv = document.getElementById('complex-plot');
    const canvas = document.createElement('canvas');
    canvas.width = plotDiv.clientWidth;
    canvas.height = plotDiv.clientHeight;
    plotDiv.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // Input elements
    const real1Input = document.getElementById('real1');
    const imag1Input = document.getElementById('imag1');
    const real2Input = document.getElementById('real2');
    const imag2Input = document.getElementById('imag2');
    const polar1Span = document.getElementById('polar1');
    const polar2Span = document.getElementById('polar2');
    
    // Result elements
    const resultAlgebraic = document.getElementById('result-algebraic');
    const resultPolar = document.getElementById('result-polar');
    
    // Operation buttons
    const addButton = document.getElementById('add-button');
    const subtractButton = document.getElementById('subtract-button');
    const multiplyButton = document.getElementById('multiply-button');
    const divideButton = document.getElementById('divide-button');
    
    // Special operation buttons
    const multiplyJButton = document.getElementById('multiply-j');
    const multiplyNegJButton = document.getElementById('multiply-negative-j');
    const multiplyJSquaredButton = document.getElementById('multiply-j-squared');
    const multiplyNegJSquaredButton = document.getElementById('multiply-negative-j-squared');
    
    // Complex number class
    class Complex {
        constructor(real, imaginary) {
            this.real = parseFloat(real) || 0;
            this.imaginary = parseFloat(imaginary) || 0;
        }
        
        // Somma
        add(other) {
            return new Complex(
                this.real + other.real,
                this.imaginary + other.imaginary
            );
        }
        
        // Differenza
        subtract(other) {
            return new Complex(
                this.real - other.real,
                this.imaginary - other.imaginary
            );
        }
        
        // Prodotto
        multiply(other) {
            return new Complex(
                this.real * other.real - this.imaginary * other.imaginary,
                this.real * other.imaginary + this.imaginary * other.real
            );
        }
        
        // Divisione
        divide(other) {
            const denominator = other.real * other.real + other.imaginary * other.imaginary;
            return new Complex(
                (this.real * other.real + this.imaginary * other.imaginary) / denominator,
                (this.imaginary * other.real - this.real * other.imaginary) / denominator
            );
        }
        
        // Calcolo del modulo
        modulus() {
            return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
        }
        
        // Calcolo dell'argomento (in radianti)
        argument() {
            return Math.atan2(this.imaginary, this.real);
        }
        
        // Rappresentazione in forma algebrica
        toString() {
            if (this.imaginary === 0) return `${roundToDecimal(this.real, 3)}`;
            
            const sign = this.imaginary >= 0 ? '+' : '';
            return `${roundToDecimal(this.real, 3)} ${sign} ${roundToDecimal(this.imaginary, 3)}i`;
        }
        
        // Rappresentazione polare
        toPolarString() {
            const modulus = this.modulus();
            const argumentDeg = this.argument() * 180 / Math.PI;
            return `${roundToDecimal(modulus, 3)} ∠ ${roundToDecimal(argumentDeg, 1)}°`;
        }
    }
    
    // Arrotonda a un certo numero di decimali
    function roundToDecimal(number, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(number * factor) / factor;
    }
    
    // Aggiorna il grafico
    function updatePlot(z1, z2, result, operation) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calcoliamo il range massimo per adattare la scala
        const maxValue = Math.max(
            Math.abs(z1.real), Math.abs(z1.imaginary),
            Math.abs(z2.real), Math.abs(z2.imaginary),
            result ? Math.abs(result.real) : 0,
            result ? Math.abs(result.imaginary) : 0,
            1  // Assicuriamo un minimo range
        ) * 1.5;  // Aggiungiamo un po' di margine
        
        // Calcoliamo il centro e la scala
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = Math.min(centerX, centerY) / maxValue;
        
        // Disegniamo gli assi
        drawAxes(centerX, centerY, scale, maxValue);
        
        // Colori per i vettori
        const colors = {
            z1: '#2196F3',        // Blu
            z2: '#4CAF50',        // Verde
            result: '#F44336',    // Rosso
            intermediate: '#9C27B0'  // Viola (per operazioni intermedie)
        };
        
        // Disegniamo i vettori
        drawVector(z1, centerX, centerY, scale, colors.z1, 'z₁');
        
        // La seconda operazione non è mostrata nelle operazioni speciali su z1
        if (!operation.startsWith('special:')) {
            drawVector(z2, centerX, centerY, scale, colors.z2, 'z₂');
        }
        
        // Nel caso delle operazioni speciali su z1
        if (operation === 'special:multiply-j') {
            const intermediate = new Complex(-z1.imaginary, z1.real);
            drawVector(intermediate, centerX, centerY, scale, colors.result, 'j·z₁');
            drawRotationArc(z1, intermediate, centerX, centerY, scale, '90°');
        } 
        else if (operation === 'special:multiply-negative-j') {
            const intermediate = new Complex(z1.imaginary, -z1.real);
            drawVector(intermediate, centerX, centerY, scale, colors.result, '-j·z₁');
            drawRotationArc(z1, intermediate, centerX, centerY, scale, '-90°');
        }
        else if (operation === 'special:multiply-j-squared') {
            const intermediate = new Complex(-z1.real, -z1.imaginary);
            drawVector(intermediate, centerX, centerY, scale, colors.result, '-z₁');
            drawRotationArc(z1, intermediate, centerX, centerY, scale, '180°');
        }
        else if (operation === 'special:multiply-negative-j-squared') {
            // Questa è solo una riflessione sull'origine, quindi è lo stesso vettore
            drawVector(z1, centerX, centerY, scale, colors.result, 'z₁');
            // Non disegniamo arco di rotazione qui perché non c'è rotazione
        }
        // Per le operazioni standard mostriamo solo il risultato
        else if (result) {
            drawVector(result, centerX, centerY, scale, colors.result, 'Risultato');
        }
        
        // Nel caso dell'addizione, mostriamo anche il parallelogramma
        if (operation === 'add') {
            // Disegniamo una linea tratteggiata dal punto z1 al punto z1+z2
            drawDashedLine(
                centerX + z1.real * scale,
                centerY - z1.imaginary * scale,
                centerX + result.real * scale,
                centerY - result.imaginary * scale,
                colors.z2
            );
            
            // Disegniamo una linea tratteggiata dal punto z2 al punto z1+z2
            drawDashedLine(
                centerX + z2.real * scale,
                centerY - z2.imaginary * scale,
                centerX + result.real * scale,
                centerY - result.imaginary * scale,
                colors.z1
            );
        }
    }
    
    // Disegna gli assi cartesiani
    function drawAxes(centerX, centerY, scale, maxValue) {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Asse x
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        
        // Asse y
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);
        
        // Griglia
        const gridStep = maxValue / 4;
        
        // Linee orizzontali
        for (let i = -4; i <= 4; i++) {
            const y = centerY - i * gridStep * scale;
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            
            // Etichettiamo solo alcuni valori per evitare sovrapposizioni
            if (i !== 0 && i % 2 === 0) {
                ctx.fillStyle = '#888';
                ctx.font = '12px Arial';
                ctx.fillText(i * gridStep, centerX + 5, y - 5);
            }
        }
        
        // Linee verticali
        for (let i = -4; i <= 4; i++) {
            const x = centerX + i * gridStep * scale;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            
            // Etichettiamo solo alcuni valori per evitare sovrapposizioni
            if (i !== 0 && i % 2 === 0) {
                ctx.fillStyle = '#888';
                ctx.font = '12px Arial';
                ctx.fillText(i * gridStep, x + 5, centerY - 5);
            }
        }
        
        ctx.stroke();
        
        // Etichette assi
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.fillText('Re', canvas.width - 20, centerY - 10);
        ctx.fillText('Im', centerX + 10, 20);
        
        // Origine
        ctx.fillText('0', centerX + 4, centerY + 12);
    }
    
    // Disegna un vettore rappresentante un numero complesso
    function drawVector(complex, centerX, centerY, scale, color, label) {
        const startX = centerX;
        const startY = centerY;
        const endX = centerX + complex.real * scale;
        const endY = centerY - complex.imaginary * scale; // Invertiamo y perché le coordinate canvas crescono verso il basso
        
        // Disegna il segmento del vettore
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Disegna la punta della freccia
        const angle = Math.atan2(startY - endY, endX - startX);
        const arrowSize = 10;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY + arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY + arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        
        // Etichetta del vettore
        ctx.fillStyle = color;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(label, endX + 5, endY - 5);
        
        // Coordinate in forma algebrica
        ctx.font = '12px Arial';
        const coordText = `(${roundToDecimal(complex.real, 2)}, ${roundToDecimal(complex.imaginary, 2)}i)`;
        ctx.fillText(coordText, endX + 5, endY + 15);
    }
    
    // Disegna una linea tratteggiata tra due punti
    function drawDashedLine(fromX, fromY, toX, toY, color) {
        ctx.beginPath();
        ctx.setLineDash([5, 3]); // Imposta il pattern tratteggiato [lunghezza_linea, lunghezza_spazio]
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]); // Reimposta il pattern normale
    }
    
    // Disegna un arco che mostra la rotazione
    function drawRotationArc(start, end, centerX, centerY, scale, angleText) {
        // Calcoliamo gli angoli in radianti
        const startAngle = start.argument();
        const endAngle = end.argument();
        
        // Raggio dell'arco
        const radius = Math.min(start.modulus(), end.modulus()) * scale * 0.3;
        
        // Disegniamo l'arco
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -endAngle, -startAngle, endAngle > startAngle);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Calcoliamo il punto medio dell'arco per posizionare il testo
        const midAngle = (startAngle + endAngle) / 2;
        const midX = centerX + radius * 1.2 * Math.cos(-midAngle);
        const midY = centerY + radius * 1.2 * Math.sin(-midAngle);
        
        // Aggiungiamo il testo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(angleText, midX, midY);
    }
    
    // Aggiorna la visualizzazione polare dei numeri complessi
    function updatePolarDisplays() {
        const z1 = new Complex(real1Input.value, imag1Input.value);
        const z2 = new Complex(real2Input.value, imag2Input.value);
        
        polar1Span.textContent = z1.toPolarString();
        polar2Span.textContent = z2.toPolarString();
    }
    
    // Aggiungiamo gli event listeners per gli input
    real1Input.addEventListener('input', function() {
        updatePolarDisplays();
        updatePlot(
            new Complex(real1Input.value, imag1Input.value),
            new Complex(real2Input.value, imag2Input.value),
            null,
            ''
        );
    });
    
    imag1Input.addEventListener('input', function() {
        updatePolarDisplays();
        updatePlot(
            new Complex(real1Input.value, imag1Input.value),
            new Complex(real2Input.value, imag2Input.value),
            null,
            ''
        );
    });
    
    real2Input.addEventListener('input', function() {
        updatePolarDisplays();
        updatePlot(
            new Complex(real1Input.value, imag1Input.value),
            new Complex(real2Input.value, imag2Input.value),
            null,
            ''
        );
    });
    
    imag2Input.addEventListener('input', function() {
        updatePolarDisplays();
        updatePlot(
            new Complex(real1Input.value, imag1Input.value),
            new Complex(real2Input.value, imag2Input.value),
            null,
            ''
        );
    });
    
    // Function to handle operation buttons
    function handleOperation(operationType) {
        const z1 = new Complex(real1Input.value, imag1Input.value);
        const z2 = new Complex(real2Input.value, imag2Input.value);
        let result;
        let operationSymbol = '';
        
        switch (operationType) {
            case 'add':
                result = z1.add(z2);
                operationSymbol = '+';
                break;
            case 'subtract':
                result = z1.subtract(z2);
                operationSymbol = '-';
                break;
            case 'multiply':
                result = z1.multiply(z2);
                operationSymbol = '×';
                break;
            case 'divide':
                if (z2.real === 0 && z2.imaginary === 0) {
                    resultAlgebraic.textContent = 'Errore: Divisione per zero';
                    resultPolar.textContent = '';
                    return;
                }
                result = z1.divide(z2);
                operationSymbol = '÷';
                break;
            case 'special:multiply-j':
                result = z1.multiply(new Complex(0, 1));
                resultAlgebraic.textContent = `j · (${z1.toString()}) = ${result.toString()}i`;
                resultPolar.textContent = `Forma polare: ${result.toPolarString()} (Rotazione di 90°)`;
                updatePlot(z1, z2, result, operationType);
                return;
            case 'special:multiply-negative-j':
                result = z1.multiply(new Complex(0, -1));
                resultAlgebraic.textContent = `-j · (${z1.toString()}) = ${result.toString()}i`;
                resultPolar.textContent = `Forma polare: ${result.toPolarString()} (Rotazione di -90°)`;
                updatePlot(z1, z2, result, operationType);
                return;
            case 'special:multiply-j-squared':
                result = z1.multiply(new Complex(-1, 0));
                resultAlgebraic.textContent = `j² · (${z1.toString()}) = -1 · (${z1.toString()}) = ${result.toString()}`;
                resultPolar.textContent = `Forma polare: ${result.toPolarString()} (Rotazione di 180°)`;
                updatePlot(z1, z2, result, operationType);
                return;
            case 'special:multiply-negative-j-squared':
                result = z1.multiply(new Complex(1, 0));
                resultAlgebraic.textContent = `-j² · (${z1.toString()}) = 1 · (${z1.toString()}) = ${result.toString()}`;
                resultPolar.textContent = `Forma polare: ${result.toPolarString()} (Nessuna rotazione)`;
                updatePlot(z1, z2, result, operationType);
                return;
        }
        
        resultAlgebraic.textContent = `(${z1.toString()}) ${operationSymbol} (${z2.toString()}) = ${result.toString()}`;
        resultPolar.textContent = `Forma polare: ${result.toPolarString()}`;
        updatePlot(z1, z2, result, operationType);
    }
    
    // Aggiungiamo gli event listeners per i pulsanti
    addButton.addEventListener('click', function() {
        handleOperation('add');
    });
    
    subtractButton.addEventListener('click', function() {
        handleOperation('subtract');
    });
    
    multiplyButton.addEventListener('click', function() {
        handleOperation('multiply');
    });
    
    divideButton.addEventListener('click', function() {
        handleOperation('divide');
    });
    
    multiplyJButton.addEventListener('click', function() {
        handleOperation('special:multiply-j');
    });
    
    multiplyNegJButton.addEventListener('click', function() {
        handleOperation('special:multiply-negative-j');
    });
    
    multiplyJSquaredButton.addEventListener('click', function() {
        handleOperation('special:multiply-j-squared');
    });
    
    multiplyNegJSquaredButton.addEventListener('click', function() {
        handleOperation('special:multiply-negative-j-squared');
    });
    
    // Inizializziamo il grafico e gli elementi visuali
    updatePolarDisplays();
    updatePlot(
        new Complex(real1Input.value, imag1Input.value),
        new Complex(real2Input.value, imag2Input.value),
        null,
        ''
    );
    
    // Aggiorniamo il canvas quando la finestra viene ridimensionata
    window.addEventListener('resize', function() {
        canvas.width = plotDiv.clientWidth;
        canvas.height = plotDiv.clientHeight;
        
        updatePolarDisplays();
        updatePlot(
            new Complex(real1Input.value, imag1Input.value),
            new Complex(real2Input.value, imag2Input.value),
            null,
            ''
        );
    });
});