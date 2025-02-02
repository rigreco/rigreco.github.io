// Funzione che calcola la derivata della funzione inserita
function deriveFunction() {
    const functionString = document.getElementById('function').value;
    
    try {
      // Calcola la derivata simbolica rispetto a 'x'
      const derivative = math.derivative(functionString, 'x');
      // Converte il risultato in una stringa leggibile
      const derivativeString = derivative.toString();
      
      document.getElementById('derivativeResult').textContent = `La derivata è: ${derivativeString}`;
    } catch (error) {
      document.getElementById('derivativeResult').textContent = 'Errore nel calcolo della derivata: ' + error;
    }
  }
  
  // Associa l'evento click del bottone alla funzione di derivazione
  document.getElementById('deriveButton').addEventListener('click', deriveFunction);  