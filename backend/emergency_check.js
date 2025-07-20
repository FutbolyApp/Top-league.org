import { getDb, initializeDatabase } from './db/postgres.js';

async function emergencyCheck() {
  console.log('🚨 EMERGENCY DATABASE CHECK');
  console.log('==========================');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ DATABASE: Not available');
      return;
    }
    
    console.log('✅ DATABASE: Connected');
    
    // 1. Controlla tutte le tabelle
    console.log('\n📋 ALL TABLES:');
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 2. Conta record in ogni tabella
    console.log('\n📊 RECORDS COUNT:');
    for (const table of tables.rows) {
      try {
        const count = await db.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`  ${table.table_name}: ${count.rows[0].count}`);
      } catch (error) {
        console.log(`  ${table.table_name}: ERROR - ${error.message}`);
      }
    }
    
    // 3. Controlla users
    console.log('\n👥 USERS:');
    const users = await db.query('SELECT id, nome, cognome, email, ruolo FROM users LIMIT 10');
    users.rows.forEach(user => {
      console.log(`  - ${user.nome} ${user.cognome} (${user.email}) - ${user.ruolo}`);
    });
    
    // 4. Controlla leghe
    console.log('\n🏆 LEGHE:');
    const leghe = await db.query('SELECT id, nome, admin_id, is_pubblica FROM leghe LIMIT 10');
    leghe.rows.forEach(lega => {
      console.log(`  - ${lega.nome} (ID: ${lega.id}) - Admin: ${lega.admin_id} - Pubblica: ${lega.is_pubblica}`);
    });
    
    // 5. Controlla squadre
    console.log('\n⚽ SQUADRE:');
    const squadre = await db.query('SELECT id, nome, lega_id, proprietario_id, is_orfana FROM squadre LIMIT 10');
    squadre.rows.forEach(squadra => {
      console.log(`  - ${squadra.nome} (ID: ${squadra.id}) - Lega: ${squadra.lega_id} - Proprietario: ${squadra.proprietario_id} - Orfana: ${squadra.is_orfana}`);
    });
    
    // 6. Controlla giocatori
    console.log('\n👤 GIOCATORI:');
    const giocatori = await db.query('SELECT id, nome, squadra_id, lega_id FROM giocatori LIMIT 10');
    giocatori.rows.forEach(giocatore => {
      console.log(`  - ${giocatore.nome} (ID: ${giocatore.id}) - Squadra: ${giocatore.squadra_id} - Lega: ${giocatore.lega_id}`);
    });
    
    // 7. Problemi specifici
    console.log('\n🔍 SPECIFIC PROBLEMS:');
    
    // Squadre senza proprietario
    const orphanSquadre = await db.query('SELECT COUNT(*) as count FROM squadre WHERE proprietario_id IS NULL');
    console.log(`  Squadre senza proprietario: ${orphanSquadre.rows[0].count}`);
    
    // Giocatori senza squadra
    const orphanGiocatori = await db.query('SELECT COUNT(*) as count FROM giocatori WHERE squadra_id IS NULL');
    console.log(`  Giocatori senza squadra: ${orphanGiocatori.rows[0].count}`);
    
    // Squadre orfane
    const orfaneSquadre = await db.query('SELECT COUNT(*) as count FROM squadre WHERE is_orfana = true');
    console.log(`  Squadre orfane: ${orfaneSquadre.rows[0].count}`);
    
    // Leghe senza admin
    const legheNoAdmin = await db.query('SELECT COUNT(*) as count FROM leghe WHERE admin_id IS NULL');
    console.log(`  Leghe senza admin: ${legheNoAdmin.rows[0].count}`);
    
    console.log('\n✅ EMERGENCY CHECK COMPLETED');
    
  } catch (error) {
    console.error('❌ EMERGENCY CHECK FAILED:', error);
  }
}

emergencyCheck(); 