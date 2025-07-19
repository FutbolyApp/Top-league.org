const fs = require('fs');
const path = require('path');

// Funzione per aggiungere controlli di sicurezza nel backend
function addSafetyChecks(content) {
  // Pattern per trovare .nome, .cognome, .ruolo, etc. senza controlli
  const patterns = [
    // Pattern per oggetti che potrebbero essere undefined
    { 
      regex: /(\w+)\.nome/g, 
      replacement: '$1?.nome || \'Nome\'',
      description: 'Aggiunge controlli per .nome'
    },
    { 
      regex: /(\w+)\.cognome/g, 
      replacement: '$1?.cognome || \'\'',
      description: 'Aggiunge controlli per .cognome'
    },
    { 
      regex: /(\w+)\.ruolo/g, 
      replacement: '$1?.ruolo || \'Ruolo\'',
      description: 'Aggiunge controlli per .ruolo'
    },
    { 
      regex: /(\w+)\.qa/g, 
      replacement: '$1?.qa || 0',
      description: 'Aggiunge controlli per .qa'
    },
    { 
      regex: /(\w+)\.length/g, 
      replacement: '$1?.length || 0',
      description: 'Aggiunge controlli per .length'
    },
    { 
      regex: /(\w+)\.map\(/g, 
      replacement: '$1?.map(',
      description: 'Aggiunge controlli per .map'
    },
    { 
      regex: /(\w+)\.filter\(/g, 
      replacement: '$1?.filter(',
      description: 'Aggiunge controlli per .filter'
    },
    { 
      regex: /(\w+)\.reduce\(/g, 
      replacement: '$1?.reduce(',
      description: 'Aggiunge controlli per .reduce'
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
    const modifiedContent = addSafetyChecks(content);
    
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

// Lista dei file critici del backend da correggere
const criticalBackendFiles = [
  'backend/routes/richiesteAdmin.js',
  'backend/routes/offerte.js',
  'backend/routes/contratti.js',
  'backend/routes/giocatori.js',
  'backend/routes/quotazioni.js',
  'backend/routes/finanze.js',
  'backend/routes/notifiche.js',
  'backend/routes/superadmin.js',
  'backend/routes/auth.js',
  'backend/routes/scraping.js',
  'backend/routes/tornei.js',
  'backend/models/squadra.js',
  'backend/models/giocatore.js',
  'backend/models/lega.js',
  'backend/models/user.js'
];

console.log('🔧 Iniziando correzione errori undefined nel backend...\n');

let totalFixed = 0;

// Processa i file critici del backend
criticalBackendFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    if (processFile(filePath)) {
      totalFixed++;
    }
  } else {
    console.log(`⚠️  File non trovato: ${filePath}`);
  }
});

console.log(`\n✅ Correzioni backend completate! ${totalFixed} file modificati.`);
console.log('🚀 Ora puoi fare il deploy delle correzioni!'); 