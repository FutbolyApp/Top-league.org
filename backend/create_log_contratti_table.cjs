const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Percorso del database
const dbPath = path.join(__dirname, 'db', 'topleague.db');

// Connessione al database
const db = new sqlite3.Database(dbPath);

console.log('Creazione tabella log_contratti...');

// Crea la tabella log_contratti
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS log_contratti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giocatore_id INTEGER NOT NULL,
    squadra_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    valore_prima REAL,
    valore_dopo REAL,
    importo REAL,
    note TEXT,
    data_operazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (giocatore_id) REFERENCES giocatori (id),
    FOREIGN KEY (squadra_id) REFERENCES squadre (id)
  )
`;

db.run(createTableSQL, (err) => {
  if (err) {
    console.error('Errore nella creazione della tabella log_contratti:', err.message);
  } else {
    console.log('Tabella log_contratti creata con successo');
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