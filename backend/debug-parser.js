import { parseSquadreFromExcel } from './utils/excelParser.js';

// Test specifico per capire cosa sta passando la validazione
function debugValidation() {
  console.log("🔍 DEBUG: Test validazione nomi squadra");
  
  const excludeWords = [
    'ruolo', 'calciatore', 'squadra', 'costo', 'crediti', 'residui', 'rose', 'lega', 
    'fantaleague', 'https', 'calciatori', 'download'
  ];
  
  const roleWords = ['p', 'por', 'd', 'dd', 'dc', 'ds', 'e', 'c', 'm', 't', 'w', 'a', 'pc', 'b'];
  
  function isValidSquadraName(nome, excludeWords, roleWords) {
    if (!nome || nome.length < 3) return false;

    const nomeLower = nome.toLowerCase().trim();

    // Escludi parole di servizio
    if (excludeWords.some(word => nomeLower.includes(word.toLowerCase()))) return false;

    // Escludi se è un singolo ruolo
    if (roleWords.includes(nomeLower)) return false;

    // Escludi se è una combinazione di ruoli separati da ;
    if (nomeLower.includes(';')) {
      const parts = nomeLower.split(';').map(part => part.trim());
      if (parts.length > 1 && parts.every(part => roleWords.includes(part))) {
        return false;
      }
    }

    // Escludi se è una combinazione di ruoli separati da spazi
    if (nomeLower.includes(' ')) {
      const parts = nomeLower.split(' ').map(part => part.trim());
      if (parts.length > 1 && parts.every(part => roleWords.includes(part))) {
        return false;
      }
    }

    // Escludi se contiene solo lettere maiuscole e ; (pattern tipico dei ruoli)
    if (/^[A-Z;]+$/.test(nome)) return false;

    // Escludi se è solo una sequenza di ruoli senza spazi o caratteri speciali
    const allParts = nomeLower.split(/[;\s]+/).map(part => part.trim()).filter(part => part.length > 0);
    if (allParts.length > 1 && allParts.every(part => roleWords.includes(part))) {
      return false;
    }

    return true;
  }

  // Test con esempi specifici dai log
  const testNames = [
    "Sonar", "Shooters", "Kingston", "Polar", "Gladiators", "Hounds",
    "Dd;Ds;E", "M;C", "B;Dd;E", "Por", "C;T", "W;A", "B;Ds;E", "B;Dd;Ds",
    "Frontier Soldiers", "Surfers", "Wasps", "Dd;E", "Ds;E", "M;T", "W;T"
  ];

  console.log("\n📋 Test validazione:");
  testNames.forEach(name => {
    const isValid = isValidSquadraName(name, excludeWords, roleWords);
    console.log(`${isValid ? '✅' : '❌'} "${name}" -> ${isValid ? 'VALIDO' : 'INVALIDO'}`);
  });
}

debugValidation(); 