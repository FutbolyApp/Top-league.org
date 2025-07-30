import { getDb } from './backend/db/config.js';

const db = getDb();

// Test della funzione splitRoles
const splitRoles = (ruolo) => {
  if (!ruolo) return [];
  
  const ruoloUpper = ruolo.toUpperCase().trim();
  
  // Se il ruolo contiene separatori (;, spazio, virgola), dividi normalmente
  if (/[;\s,]/.test(ruoloUpper)) {
    return ruoloUpper.split(/[;\s,]+/).filter(r => r.length > 0);
  }
  
  // Per ruoli concatenati senza separatori (es. "DDC", "EC", "MTA")
  // Lista dei ruoli Euroleghe validi
  const eurolegheRoles = ['POR', 'DD', 'DC', 'DS', 'B', 'E', 'M', 'T', 'W', 'A', 'PC'];
  
  // Prova a dividere il ruolo concatenato
  const roles = [];
  let remaining = ruoloUpper;
  
  while (remaining.length > 0) {
    let found = false;
    
    // Prova prima con ruoli di 2 lettere
    for (const role of eurolegheRoles) {
      if (remaining.startsWith(role)) {
        roles.push(role);
        remaining = remaining.substring(role.length);
        found = true;
        break;
      }
    }
    
    // Se non trova ruoli di 2 lettere, prova con ruoli di 1 lettera
    if (!found) {
      for (const role of eurolegheRoles) {
        if (role.length === 1 && remaining.startsWith(role)) {
          roles.push(role);
          remaining = remaining.substring(1);
          found = true;
          break;
        }
      }
    }
    
    // Se non trova nulla, prendi il primo carattere
    if (!found) {
      roles.push(remaining[0]);
      remaining = remaining.substring(1);
    }
  }
  
  return roles.filter(r => r.length > 0);
};

console.log('🧪 Test funzione splitRoles:');
console.log('DDC ->', splitRoles('DDC'));
console.log('EC ->', splitRoles('EC'));
console.log('MTA ->', splitRoles('MTA'));
console.log('DD;DC ->', splitRoles('DD;DC'));
console.log('E,C ->', splitRoles('E,C'));
console.log('POR ->', splitRoles('POR'));
console.log('A ->', splitRoles('A'));

// Controlla i dati nel database
console.log('\n📊 Controllo dati nel database:');

db.all('SELECT DISTINCT ruolo FROM giocatori WHERE ruolo IS NOT NULL LIMIT 10', (err, rows) => {
  if (err) {
    console.error('❌ Errore query:', err);
    return;
  }
  
  console.log('Ruoli trovati nel database:');
  rows.forEach(row => {
    console.log(`  - "${row.ruolo}" -> [${splitRoles(row.ruolo).join(', ')}]`);
  });
  
  // Controlla anche i giocatori di scraping
  db.all('SELECT DISTINCT ruolo FROM giocatori_scraping WHERE ruolo IS NOT NULL LIMIT 10', (err, scrapingRows) => {
    if (err) {
      console.error('❌ Errore query scraping:', err);
      return;
    }
    
    console.log('\nRuoli trovati nella tabella scraping:');
    scrapingRows.forEach(row => {
      console.log(`  - "${row.ruolo}" -> [${splitRoles(row.ruolo).join(', ')}]`);
    });
    
    console.log('\n✅ Test completato!');
  });
}); 