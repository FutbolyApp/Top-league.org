import { getDb, initializeDatabase } from './db/postgres.js';

async function checkSystemStatus() {
  console.log('🔍 SYSTEM STATUS CHECK');
  console.log('======================');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ DATABASE: Not available');
      return;
    }
    
    console.log('✅ DATABASE: Connected');
    
    // 1. Verifica tabelle
    console.log('\n📋 TABLES CHECK:');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const expectedTables = ['users', 'leghe', 'squadre', 'giocatori', 'notifiche', 'richieste_ingresso', 'subadmin', 'pending_changes', 'tornei', 'partite'];
    
    for (const expectedTable of expectedTables) {
      const exists = tables.rows.some(row => row.table_name === expectedTable);
      console.log(`${exists ? '✅' : '❌'} ${expectedTable}`);
    }
    
    // 2. Conta record
    console.log('\n📊 RECORDS COUNT:');
    const counts = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM leghe'),
      db.query('SELECT COUNT(*) as count FROM squadre'),
      db.query('SELECT COUNT(*) as count FROM giocatori'),
      db.query('SELECT COUNT(*) as count FROM notifiche'),
      db.query('SELECT COUNT(*) as count FROM richieste_ingresso'),
      db.query('SELECT COUNT(*) as count FROM subadmin'),
      db.query('SELECT COUNT(*) as count FROM pending_changes'),
      db.query('SELECT COUNT(*) as count FROM tornei'),
      db.query('SELECT COUNT(*) as count FROM partite')
    ]);
    
    const tableNames = ['users', 'leghe', 'squadre', 'giocatori', 'notifiche', 'richieste_ingresso', 'subadmin', 'pending_changes', 'tornei', 'partite'];
    
    counts.forEach((result, index) => {
      console.log(`${tableNames[index]}: ${result.rows[0].count}`);
    });
    
    // 3. Verifica dati specifici
    console.log('\n🔍 SPECIFIC DATA CHECK:');
    
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
    
    // 4. Verifica relazioni
    console.log('\n🔗 RELATIONSHIPS CHECK:');
    
    // Squadre senza lega
    const orphanSquadre = await db.query('SELECT COUNT(*) as count FROM squadre s LEFT JOIN leghe l ON s.lega_id = l.id WHERE l.id IS NULL');
    console.log(`Squadre senza lega: ${orphanSquadre.rows[0].count}`);
    
    // Giocatori senza squadra
    const orphanGiocatori = await db.query('SELECT COUNT(*) as count FROM giocatori g LEFT JOIN squadre s ON g.squadra_id = s.id WHERE s.id IS NULL');
    console.log(`Giocatori senza squadra: ${orphanGiocatori.rows[0].count}`);
    
    // Squadre senza proprietario
    const orphanSquadreNoOwner = await db.query('SELECT COUNT(*) as count FROM squadre WHERE proprietario_id IS NULL');
    console.log(`Squadre senza proprietario: ${orphanSquadreNoOwner.rows[0].count}`);
    
    // 5. Verifica statistiche
    console.log('\n📈 STATISTICS CHECK:');
    
    if (leghe.rows.length > 0) {
      const legaId = leghe.rows[0].id;
      
      const squadreCount = await db.query('SELECT COUNT(*) as count FROM squadre WHERE lega_id = $1', [legaId]);
      const giocatoriCount = await db.query(`
        SELECT COUNT(*) as count 
        FROM giocatori g 
        JOIN squadre s ON g.squadra_id = s.id 
        WHERE s.lega_id = $1
      `, [legaId]);
      
      console.log(`Lega ${legaId}: ${squadreCount.rows[0].count} squadre, ${giocatoriCount.rows[0].count} giocatori`);
    }
    
    console.log('\n✅ SYSTEM STATUS CHECK COMPLETED');
    
  } catch (error) {
    console.error('❌ SYSTEM STATUS CHECK FAILED:', error);
  }
}

checkSystemStatus(); 