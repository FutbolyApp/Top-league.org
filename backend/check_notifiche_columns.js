import { getDb } from './db/postgres.js';

async function checkNotificheColumns() {
  try {
    console.log('🔍 Verificando colonne della tabella notifiche...');
    
    const db = getDb();
    
    // Verifica tutte le colonne della tabella notifiche
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notifiche' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonne esistenti nella tabella notifiche:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Verifica specificamente le colonne letto e data_lettura
    const lettoResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifiche' AND column_name IN ('letto', 'data_lettura')
    `);
    
    console.log('\n🔍 Verifica colonne letto e data_lettura:');
    const foundColumns = lettoResult.rows.map(r => r.column_name);
    console.log(`Colonne trovate: ${foundColumns.join(',')}`);
    
    if (!foundColumns.includes('letto')) {
      console.log('❌ Colonna "letto" mancante!');
    } else {
      console.log('✅ Colonna "letto" presente');
    }
    
    if (!foundColumns.includes('data_lettura')) {
      console.log('❌ Colonna "data_lettura" mancante!');
    } else {
      console.log('✅ Colonna "data_lettura" presente');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
    process.exit(1);
  }
}

checkNotificheColumns(); 