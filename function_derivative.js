// Funzione che calcola la derivata della funzione inserita
function deriveFunction() {
    const functionString = document.getElementById('function').value;
    
    try {
      // Valida l'input per assicurarsi che contenga solo caratteri sicuri per espressioni matematiche
      if (!/^[a-zA-Z0-9\s\+\-\*\/\^\(\)\.\,\_\[\]]*$/.test(functionString)) {
        throw new Error('Input non valido. Sono permessi solo caratteri per espressioni matematiche.');
      }
      
      // Crea un ambiente math.js sicuro con funzioni limitate
      const limitedEval = math.create();
      limitedEval.import({
        // Importa solo operatori matematici sicuri
        'import': function () { throw new Error('Function import is disabled'); },
        'createUnit': function () { throw new Error('Function createUnit is disabled'); },
        'evaluate': function () { throw new Error('Function evaluate is disabled'); },
        'parse': math.parse,
        'simplify': function () { throw new Error('Function simplify is disabled'); },
        'derivative': math.derivative
      }, { override: true });
      
      // Prima parsa l'espressione in un nodo di espressione
      const expr = limitedEval.parse(functionString);
      // Parsa anche la variabile 'x' come simbolo
      const x = limitedEval.parse('x');
      
      // Calcola la derivata simbolica rispetto a 'x' utilizzando l'ambiente limitato
      const derivative = math.derivative(expr, x);
      
      // Converte il risultato in una stringa leggibile
      const derivativeString = derivative.toString();
      
      document.getElementById('derivativeResult').textContent = `La derivata è: ${derivativeString}`;
    } catch (error) {
      document.getElementById('derivativeResult').textContent = 'Errore nel calcolo della derivata: ' + error;
    }
  }
  
  // Associa l'evento click del bottone alla funzione di derivazione
  document.getElementById('deriveButton').addEventListener('click', deriveFunction);