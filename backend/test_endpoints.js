import { getDb, initializeDatabase } from './db/postgres.js';

async function testEndpoints() {
  console.log('🧪 Testing all endpoints...');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ Database not available');
      return;
    }
    
    console.log('✅ Database connected');
    
    // Test 1: Conta leghe
    const legheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    console.log('📊 Total leghe:', legheCount.rows[0].count);
    
    // Test 2: Conta squadre
    const squadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    console.log('📊 Total squadre:', squadreCount.rows[0].count);
    
    // Test 3: Conta giocatori
    const giocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    console.log('📊 Total giocatori:', giocatoriCount.rows[0].count);
    
    // Test 4: Conta utenti
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    console.log('📊 Total users:', usersCount.rows[0].count);
    
    // Test 5: Verifica statistiche per lega
    const legheStats = await db.query(`
      SELECT 
        l.id,
        l.nome,
        COUNT(s.id) as numero_squadre,
        COUNT(CASE WHEN s.proprietario_id IS NOT NULL THEN 1 END) as squadre_con_proprietario,
        COUNT(g.id) as numero_giocatori
      FROM leghe l
      LEFT JOIN squadre s ON l.id = s.lega_id
      LEFT JOIN giocatori g ON s.id = g.squadra_id
      GROUP BY l.id, l.nome
      ORDER BY l.id
    `);
    
    console.log('🔍 Leghe statistics:');
    legheStats.rows.forEach(row => {
      console.log(`  ${row.nome} (ID: ${row.id}): ${row.numero_squadre} squadre, ${row.squadre_con_proprietario} assegnate, ${row.numero_giocatori} giocatori`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEndpoints(); 