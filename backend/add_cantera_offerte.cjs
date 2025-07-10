const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Percorso del database
const dbPath = path.join(__dirname, 'db', 'topleague.db');

// Connessione al database
const db = new sqlite3.Database(dbPath);

console.log('Aggiunta colonna cantera alla tabella offerte...');

// Aggiungi la colonna cantera (BOOLEAN, default FALSE)
db.run(`
  ALTER TABLE offerte 
  ADD COLUMN cantera BOOLEAN DEFAULT 0
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Colonna cantera già esistente nella tabella offerte');
    } else {
      console.error('Errore nell\'aggiunta della colonna cantera:', err.message);
    }
  } else {
    console.log('Colonna cantera aggiunta con successo alla tabella offerte');
  }
  
  // Chiudi la connessione
  db.close((err) => {
    if (err) {
      console.error('Errore nella chiusura del database:', err.message);
    } else {
      console.log('Database chiuso correttamente');
    }
  });
}); 