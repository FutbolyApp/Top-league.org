const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Percorso del database
const dbPath = path.join(__dirname, 'db', 'topleague.db');

// Connessione al database
const db = new sqlite3.Database(dbPath);

console.log('Aggiunta colonne per contratti e trasferimenti alla tabella giocatori...');

// Aggiungi le colonne per prestito e trasferimento
const columns = [
  'valore_prestito REAL DEFAULT 0',
  'valore_trasferimento REAL DEFAULT 0',
  'ultimo_pagamento_contratto DATETIME',
  'ultimo_rinnovo_contratto DATETIME'
];

columns.forEach((column, index) => {
  const columnName = column.split(' ')[0];
  db.run(`ALTER TABLE giocatori ADD COLUMN ${column}`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`Colonna ${columnName} già esistente`);
      } else {
        console.error(`Errore nell'aggiunta della colonna ${columnName}:`, err.message);
      }
    } else {
      console.log(`Colonna ${columnName} aggiunta con successo`);
    }
    
    // Se è l'ultima colonna, chiudi la connessione
    if (index === columns.length - 1) {
      db.close((err) => {
        if (err) {
          console.error('Errore nella chiusura del database:', err.message);
        } else {
          console.log('Database chiuso correttamente');
        }
      });
    }
  });
}); 