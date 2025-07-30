import { parseSquadreFromExcel } from './backend/utils/excelParser.js';
import { createGiocatore } from './backend/models/giocatore.js';
import { createSquadra } from './backend/models/squadra.js';
import { getDb } from './backend/db/mariadb.js';

// Configurazione per test locale
const testConfig = {
  host: 'localhost',
  user: 'root',
  password: '25QQj2Fh',
  database: 'topleague_prod'
};

async function testExcelImport() {
  try {
    console.log('🧪 Test import Excel...');
    
    // Test 1: Verifica connessione database
    console.log('1️⃣ Test connessione database...');
    const db = getDb();
    if (!db) {
      console.error('❌ Database non disponibile');
      return;
    }
    console.log('✅ Database connesso');
    
    // Test 2: Verifica tabelle
    console.log('2️⃣ Test tabelle database...');
    const tables = await db.query('SHOW TABLES');
    console.log('📋 Tabelle disponibili:', tables.rows.map(t => Object.values(t)[0]));
    
    // Test 3: Verifica giocatori esistenti
    console.log('3️⃣ Test giocatori esistenti...');
    const giocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    console.log('👥 Giocatori nel database:', giocatoriCount.rows[0].count);
    
    // Test 4: Verifica squadre esistenti
    console.log('4️⃣ Test squadre esistenti...');
    const squadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    console.log('⚽ Squadre nel database:', squadreCount.rows[0].count);
    
    // Test 5: Verifica leghe esistenti
    console.log('5️⃣ Test leghe esistenti...');
    const legheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    console.log('🏆 Leghe nel database:', legheCount.rows[0].count);
    
    // Test 6: Verifica struttura tabella giocatori
    console.log('6️⃣ Test struttura tabella giocatori...');
    const giocatoriStructure = await db.query('DESCRIBE giocatori');
    console.log('📊 Struttura tabella giocatori:');
    giocatoriStructure.rows.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('✅ Test completato!');
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  }
}

// Esegui il test
testExcelImport().then(() => {
  console.log('🎉 Test terminato');
  process.exit(0);
}).catch(error => {
  console.error('💥 Errore fatale:', error);
  process.exit(1);
}); 