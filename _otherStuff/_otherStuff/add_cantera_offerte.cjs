const { getDb } = require('./db/postgres.js');

async function addCanteraOfferte() {
  console.log('Aggiunta colonna cantera alla tabella offerte...');
  
  const db = getDb();
  if (!db) {
    console.error('❌ Database non disponibile');
    return;
  }

  try {
    // Aggiungi la colonna cantera (BOOLEAN, default FALSE)
    await db.query(`
      ALTER TABLE offerte 
      ADD COLUMN cantera BOOLEAN DEFAULT FALSE
    `);
    console.log('Colonna cantera aggiunta con successo alla tabella offerte');
  } catch (error) {
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('Colonna cantera già esistente nella tabella offerte');
    } else {
      console.error('Errore nell\'aggiunta della colonna cantera:', error.message);
    }
  }
}

addCanteraOfferte().then(() => {
  console.log('✅ Script completato');
  process.exit(0);
}).catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
}); 