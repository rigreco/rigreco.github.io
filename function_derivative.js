function deriveFunction() {
    const functionString = document.getElementById('function').value;
    let derivative = '';

    // Funzione per derivare un termine
    function deriveTerm(coefficient, variable, power) {
        if (power === 0) return '';
        if (power === 1) return coefficient;
        return `${coefficient * power}${variable}^${power - 1}`;
    }

    // Dividi la funzione in termini
    const terms = functionString.split(/([+-])/);
    
    for (let i = 0; i < terms.length; i++) {
        const term = terms[i].trim();
        if (term === '+' || term === '-') {
            derivative += term;
        } else if (term) {
            const match = term.match(/^(\d*)x?(\^(\d+))?$/);
            if (match) {
                let [, coefficient, , power] = match;
                coefficient = coefficient || '1';
                power = power || (term.includes('x') ? '1' : '0');
                derivative += deriveTerm(parseInt(coefficient), 'x', parseInt(power));
            } else {
                derivative += 'ERROR';
                break;
            }
        }
    }

    document.getElementById('derivativeResult').textContent = `La derivata è: ${derivative || '0'}`;
}

document.getElementById('deriveButton').addEventListener('click', deriveFunction);