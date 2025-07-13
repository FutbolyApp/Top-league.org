import { getDb } from './db/postgres.js';

async function addCanteraColumn() {
  console.log('Aggiunta colonna cantera alla tabella giocatori...');
  
  const db = getDb();
  if (!db) {
    console.error('❌ Database non disponibile');
    return;
  }

  try {
    // Aggiungi la colonna cantera (BOOLEAN, default FALSE)
    await db.query(`
      ALTER TABLE giocatori 
      ADD COLUMN cantera BOOLEAN DEFAULT FALSE
    `);
    console.log('Colonna cantera aggiunta con successo');
  } catch (error) {
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('Colonna cantera già esistente');
    } else {
      console.error('Errore nell\'aggiunta della colonna cantera:', error.message);
    }
  }
}

addCanteraColumn().then(() => {
  console.log('✅ Script completato');
  process.exit(0);
}).catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
}); 