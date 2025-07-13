import { getDb } from './db/postgres.js';

async function addPendingChangesColumns() {
  console.log('Aggiungendo colonne alla tabella pending_changes...');
  
  const db = getDb();
  if (!db) {
    console.error('❌ Database non disponibile');
    return;
  }

  try {
    // Controlla la struttura della tabella pending_changes
    const columnsResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pending_changes'
    `);
    
    if (!columnsResult.rows || columnsResult.rows.length === 0) {
      console.error('Nessuna colonna trovata nella tabella pending_changes');
      return;
    }
    
    const columnNames = columnsResult.rows.map(col => col.column_name);
    console.log('Colonne esistenti:', columnNames);
    
    if (!columnNames.includes('description')) {
      console.log('Aggiungendo colonna description...');
      try {
        await db.query('ALTER TABLE pending_changes ADD COLUMN description TEXT');
        console.log('Colonna description aggiunta con successo');
      } catch (error) {
        console.error('Errore aggiunta colonna description:', error.message);
      }
    } else {
      console.log('Colonna description già esistente');
    }
    
    if (!columnNames.includes('details')) {
      console.log('Aggiungendo colonna details...');
      try {
        await db.query('ALTER TABLE pending_changes ADD COLUMN details TEXT');
        console.log('Colonna details aggiunta con successo');
      } catch (error) {
        console.error('Errore aggiunta colonna details:', error.message);
      }
    } else {
      console.log('Colonna details già esistente');
    }
    
  } catch (error) {
    console.error('Errore nel controllo struttura tabella pending_changes:', error);
  }
}

addPendingChangesColumns().then(() => {
  console.log('Script completato. Controlla i log sopra per i risultati.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
}); 