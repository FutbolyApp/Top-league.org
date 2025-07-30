import { getDb, initializeDatabase } from './db/postgres.js';

async function debugDatabase() {
  console.log('🔍 Starting database debug...');
  
  try {
    // Inizializza il database
    await initializeDatabase();
    
    const db = getDb();
    if (!db) {
      console.error('❌ Database connection failed');
      return;
    }
    
    console.log('✅ Database connected');
    
    // Verifica tabelle esistenti
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tables.rows.map(r => r.table_name));
    
    // Conta record in ogni tabella
    for (const table of tables.rows) {
      try {
        const count = await db.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`📊 ${table.table_name}: ${count.rows[0].count} records`);
      } catch (err) {
        console.error(`❌ Error counting ${table.table_name}:`, err.message);
      }
    }
    
    // Verifica dati specifici
    console.log('\n🔍 Checking specific data...');
    
    // Users
    const users = await db.query('SELECT id, nome, cognome, email, ruolo FROM users LIMIT 5');
    console.log('👥 Users:', users.rows);
    
    // Leghe
    const leghe = await db.query('SELECT id, nome, admin_id, is_pubblica FROM leghe LIMIT 5');
    console.log('🏆 Leghe:', leghe.rows);
    
    // Squadre
    const squadre = await db.query('SELECT id, nome, lega_id, is_orfana FROM squadre LIMIT 5');
    console.log('⚽ Squadre:', squadre.rows);
    
    // Giocatori
    const giocatori = await db.query('SELECT id, nome, squadra_id, lega_id FROM giocatori LIMIT 5');
    console.log('👤 Giocatori:', giocatori.rows);
    
  } catch (error) {
    console.error('❌ Database debug failed:', error);
  }
}

debugDatabase(); 