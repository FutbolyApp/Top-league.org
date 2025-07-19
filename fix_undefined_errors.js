const fs = require('fs');
const path = require('path');

// Funzione per aggiungere controlli di sicurezza
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

// Funzione per processare ricorsivamente una directory
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalFixed = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      totalFixed += processDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      if (processFile(fullPath)) {
        totalFixed++;
      }
    }
  });
  
  return totalFixed;
}

// Lista dei file critici da correggere
const criticalFiles = [
  'frontend/src/pages/SuperAdminDashboard.js',
  'frontend/src/pages/AreaAdmin.js',
  'frontend/src/pages/RichiestaAdmin.js',
  'frontend/src/pages/GestioneRichiesteAdmin.js',
  'frontend/src/pages/NotifichePage.js',
  'frontend/src/pages/Home.js',
  'frontend/src/pages/DettaglioSquadra.js',
  'frontend/src/pages/GestioneSquadra.js',
  'frontend/src/pages/DettaglioLega.js',
  'frontend/src/pages/LeagueAdminArea.js',
  'frontend/src/pages/LeagueSubadminArea.js',
  'frontend/src/pages/ScrapingManager.js',
  'frontend/src/pages/GestioneTornei.js',
  'frontend/src/pages/PagaContratti.js',
  'frontend/src/pages/DashboardAvanzata.js',
  'frontend/src/pages/DettaglioTorneo.js',
  'frontend/src/pages/ModificaGiocatoreCompleta.js',
  'frontend/src/pages/ModificaSquadraCompleta.js',
  'frontend/src/pages/CreaGiocatore.js',
  'frontend/src/pages/GestioneCredenziali.js',
  'frontend/src/pages/GestioneRosterAdmin.js',
  'frontend/src/pages/ModificaLega.js',
  'frontend/src/pages/CreaLega.js',
  'frontend/src/pages/RequestSquadreModification.js'
];

console.log('🔧 Iniziando correzione errori undefined...\n');

let totalFixed = 0;

// Processa i file critici
criticalFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    if (processFile(filePath)) {
      totalFixed++;
    }
  } else {
    console.log(`⚠️  File non trovato: ${filePath}`);
  }
});

console.log(`\n✅ Correzioni completate! ${totalFixed} file modificati.`);
console.log('🚀 Ora puoi fare il deploy delle correzioni!'); 