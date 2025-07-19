const fs = require('fs');
const path = require('path');

// Funzione per correggere errori di sintassi
function fixSyntaxErrors(content) {
  // Correggi errori di precedenza degli operatori
  const patterns = [
    // Correggi || 0 === 0 -> (|| 0) === 0
    { 
      regex: /(\w+\?\.\w+\|\| 0 === 0)/g, 
      replacement: '($1)',
      description: 'Corregge precedenza operatori per length === 0'
    },
    // Correggi || 0 > 0 -> (|| 0) > 0
    { 
      regex: /(\w+\?\.\w+\|\| 0 > 0)/g, 
      replacement: '($1)',
      description: 'Corregge precedenza operatori per length > 0'
    },
    // Correggi || 0 === 0 -> (|| 0) === 0 (senza ?.)
    { 
      regex: /(\w+\.\w+\|\| 0 === 0)/g, 
      replacement: '($1)',
      description: 'Corregge precedenza operatori per length === 0 (senza ?.)'
    },
    // Correggi || 0 > 0 -> (|| 0) > 0 (senza ?.)
    { 
      regex: /(\w+\.\w+\|\| 0 > 0)/g, 
      replacement: '($1)',
      description: 'Corregge precedenza operatori per length > 0 (senza ?.)'
    }
  ];

  let modifiedContent = content;
  
  patterns.forEach(pattern => {
    modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
  });

  return modifiedContent;
}

// Funzione per processare un file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modifiedContent = fixSyntaxErrors(content);
    
    if (content !== modifiedContent) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`✅ Corretto: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  Nessuna modifica necessaria: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Errore nel processare ${filePath}:`, error.message);
    return false;
  }
}

// Lista dei file da correggere
const filesToFix = [
  'frontend/src/pages/PagaContratti.js',
  'frontend/src/pages/ModificaGiocatoreCompleta.js',
  'frontend/src/pages/NotifichePage.js',
  'frontend/src/pages/AreaAdmin.js',
  'frontend/src/pages/RichiestaAdmin.js',
  'frontend/src/pages/CreaGiocatore.js',
  'frontend/src/pages/GestioneTornei.js',
  'frontend/src/pages/ScrapingManager.js',
  'frontend/src/pages/ModificaSquadraCompleta.js',
  'frontend/src/pages/GestioneSquadra.js',
  'frontend/src/pages/GestioneRichiesteAdmin.js',
  'frontend/src/pages/GestioneRosterAdmin.js',
  'frontend/src/pages/DettaglioSquadra.js',
  'frontend/src/pages/Home.js',
  'frontend/src/pages/DettaglioLega.js'
];

console.log('🔧 Iniziando correzione errori di sintassi...\n');

let totalFixed = 0;

// Processa i file
filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    if (processFile(filePath)) {
      totalFixed++;
    }
  } else {
    console.log(`⚠️  File non trovato: ${filePath}`);
  }
});

console.log(`\n✅ Correzioni di sintassi completate! ${totalFixed} file modificati.`);
console.log('🚀 Ora puoi fare il deploy delle correzioni!'); 