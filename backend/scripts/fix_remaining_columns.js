import { getDb } from '../db/mariadb.js';

export async function fixNotificheColumns() {
  try {
    console.log('🔧 Verificando colonne mancanti nella tabella notifiche...');
    const db = getDb();

    // Verifica se le colonne esistono già
    const checkResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifiche' AND column_name IN ('letto', 'data_lettura')
    `);
    
    const existingColumns = checkResult.rows.map(r => r.column_name);
    console.log('Colonne esistenti nella tabella notifiche:', existingColumns);

    // Aggiungi colonna letto se non esiste
    if (!existingColumns.includes('letto')) {
      console.log('➕ Aggiungendo colonna "letto"...');
      await db.query(`ALTER TABLE notifiche ADD COLUMN letto BOOLEAN DEFAULT false`);
      console.log('✅ Colonna "letto" aggiunta');
    } else {
      console.log('✅ Colonna "letto già presente');
    }

    // Aggiungi colonna data_lettura se non esiste
    if (!existingColumns.includes('data_lettura')) {
      console.log('➕ Aggiungendo colonnadata_lettura"...');
      await db.query(`ALTER TABLE notifiche ADD COLUMN data_lettura TIMESTAMP`);
      console.log('✅ Colonna "data_lettura" aggiunta');
    } else {
      console.log('✅ Colonna data_lettura già presente');
    }

    console.log('🎉 Tabella notifiche aggiornata con successo!');
    return true;
  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento della tabella notifiche:', error);
    return false;
  }
} 