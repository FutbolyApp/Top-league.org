import { getDb } from '../db/postgres.js';

async function updateSchema() {
  try {
    console.log('🔄 Updating database schema...');
    
    const db = getDb();
    if (!db) {
      console.log('❌ Database not available');
      return;
    }
    
    // Aggiungi colonna roster alla tabella giocatori se non esiste
    try {
      await db.query(`
        ALTER TABLE giocatori 
        ADD COLUMN IF NOT EXISTS roster VARCHAR(10) DEFAULT 'A'
      `);
      console.log('✅ Added roster column to giocatori table');
    } catch (error) {
      console.log('Column roster already exists or error:', error.message);
    }
    
    // Aggiungi colonne per i limiti di ruolo alla tabella leghe se non esistono
    const roleColumns = [
      'max_portieri', 'min_portieri',
      'max_difensori', 'min_difensori', 
      'max_centrocampisti', 'min_centrocampisti',
      'max_attaccanti', 'min_attaccanti'
    ];
    
    for (const column of roleColumns) {
      try {
        await db.query(`
          ALTER TABLE leghe 
          ADD COLUMN IF NOT EXISTS ${column} INTEGER DEFAULT 0
        `);
        console.log(`✅ Added ${column} column to leghe table`);
      } catch (error) {
        console.log(`Column ${column} already exists or error:`, error.message);
      }
    }
    
    // Aggiorna i valori di default per le colonne esistenti
    try {
      await db.query(`
        UPDATE leghe SET 
          max_portieri = 3,
          min_portieri = 2,
          max_difensori = 8,
          min_difensori = 5,
          max_centrocampisti = 8,
          min_centrocampisti = 5,
          max_attaccanti = 6,
          min_attaccanti = 3
        WHERE max_portieri IS NULL OR min_portieri IS NULL
      `);
      console.log('✅ Updated default values for role limits');
    } catch (error) {
      console.log('Error updating default values:', error.message);
    }
    
    console.log('✅ Schema update completed');
  } catch (error) {
    console.error('❌ Error updating schema:', error);
  }
}

// Esegui lo script
updateSchema().then(() => {
  console.log('🎉 Schema update finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 