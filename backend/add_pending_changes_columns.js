import { getDb } from './db/config.js';

const db = getDb();

console.log('Aggiungendo colonne alla tabella pending_changes...');

// Aggiungi colonna description se non esiste
db.all("PRAGMA table_info(pending_changes)", (err, columns) => {
  if (err) {
    console.error('Errore nel controllo struttura tabella pending_changes:', err);
    return;
  }
  
  if (!columns || columns.length === 0) {
    console.error('Nessuna colonna trovata nella tabella pending_changes');
    return;
  }
  
  const columnNames = columns.map(col => col.name);
  console.log('Colonne esistenti:', columnNames);
  
  if (!columnNames.includes('description')) {
    console.log('Aggiungendo colonna description...');
    db.run('ALTER TABLE pending_changes ADD COLUMN description TEXT', (err) => {
      if (err) {
        console.error('Errore aggiunta colonna description:', err);
      } else {
        console.log('Colonna description aggiunta con successo');
      }
    });
  } else {
    console.log('Colonna description già esistente');
  }
  
  if (!columnNames.includes('details')) {
    console.log('Aggiungendo colonna details...');
    db.run('ALTER TABLE pending_changes ADD COLUMN details TEXT', (err) => {
      if (err) {
        console.error('Errore aggiunta colonna details:', err);
      } else {
        console.log('Colonna details aggiunta con successo');
      }
    });
  } else {
    console.log('Colonna details già esistente');
  }
});

console.log('Script completato. Controlla i log sopra per i risultati.'); 