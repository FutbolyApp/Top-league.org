import { getDb } from './db/config.js';

const db = getDb();

const columns = [
  'r REAL',
  'fr REAL', 
  'presenze INTEGER',
  'goalfatti INTEGER',
  'goalsubiti INTEGER',
  'rigoriparati INTEGER',
  'rigoricalciati INTEGER',
  'rigorisegnati INTEGER',
  'rigorisbagliati INTEGER',
  'assist INTEGER',
  'ammonizioni INTEGER',
  'espulsioni INTEGER',
  'autogol INTEGER'
];

console.log('🔄 Aggiungendo colonne statistiche alla tabella giocatori...');

columns.forEach((columnDef, index) => {
  const columnName = columnDef.split(' ')[0];
  
  try {
    db.run(`ALTER TABLE giocatori ADD COLUMN ${columnDef}`);
    console.log(`✅ Aggiunta colonna: ${columnName}`);
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log(`⚠️  Colonna ${columnName} già esistente`);
    } else {
      console.log(`❌ Errore aggiungendo ${columnName}:`, error.message);
    }
  }
});

console.log('✅ Aggiornamento tabella completato!');

// Crea tabelle di log per quotazioni e statistiche
console.log('🔄 Creando tabelle di log...');

// Tabella log quotazioni
db.run(`
  CREATE TABLE IF NOT EXISTS caricalogquot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lega_id INTEGER NOT NULL,
    utente_id INTEGER NOT NULL,
    utente_nome TEXT NOT NULL,
    file_nome TEXT NOT NULL,
    giocatori_aggiornati INTEGER DEFAULT 0,
    errori INTEGER DEFAULT 0,
    data_caricamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (utente_id) REFERENCES utenti(id)
  )
`, (err) => {
  if (err) {
    console.error('❌ Errore creazione tabella caricalogquot:', err.message);
  } else {
    console.log('✅ Tabella caricalogquot creata/verificata');
  }
});

// Tabella log statistiche
db.run(`
  CREATE TABLE IF NOT EXISTS caricalogstat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lega_id INTEGER NOT NULL,
    utente_id INTEGER NOT NULL,
    utente_nome TEXT NOT NULL,
    file_nome TEXT NOT NULL,
    giocatori_aggiornati INTEGER DEFAULT 0,
    errori INTEGER DEFAULT 0,
    data_caricamento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (utente_id) REFERENCES utenti(id)
  )
`, (err) => {
  if (err) {
    console.error('❌ Errore creazione tabella caricalogstat:', err.message);
  } else {
    console.log('✅ Tabella caricalogstat creata/verificata');
  }
});

console.log('✅ Creazione tabelle di log completata!');
process.exit(0); 