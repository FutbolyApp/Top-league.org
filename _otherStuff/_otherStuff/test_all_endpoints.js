import { getDb, initializeDatabase } from './db/postgres.js';

async function testAllEndpoints() {
  console.log('🧪 TESTING ALL ENDPOINTS');
  console.log('========================');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ Database not available');
      return;
    }
    
    console.log('✅ Database connected');
    
    // Test 1: Endpoint /leghe
    console.log('\n🔍 Testing /leghe endpoint...');
    try {
      const legheResult = await db.query(`
        SELECT l.*, 
             CASE 
               WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
               ELSE u.nome || ' ' || u.cognome 
             END as admin_nome,
             (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
             (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = false) as squadre_assegnate,
             (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) as squadre_disponibili,
             (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei,
             CASE 
               WHEN (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) > 0 
               THEN true 
               ELSE false 
             END as ha_squadre_disponibili
        FROM leghe l
        LEFT JOIN users u ON l.admin_id = u.id
        WHERE l.admin_id = 1 OR l.is_pubblica = true
        ORDER BY l.nome
      `);
      console.log('✅ /leghe query executed successfully');
      console.log(`   Found ${legheResult.rows.length} leghe`);
    } catch (error) {
      console.error('❌ /leghe query failed:', error.message);
    }
    
    // Test 2: Endpoint /leghe/admin
    console.log('\n🔍 Testing /leghe/admin endpoint...');
    try {
      const adminResult = await db.query(`
        SELECT l.*, 
             (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
             (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = false) as squadre_assegnate,
             (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) as squadre_non_assegnate,
             (SELECT COUNT(*) FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = l.id) as numero_giocatori,
             (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei,
             TO_CHAR(l.created_at, 'DD/MM/YYYY') as data_creazione_formattata
        FROM leghe l
        WHERE l.admin_id = 1
        ORDER BY l.created_at DESC
      `);
      console.log('✅ /leghe/admin query executed successfully');
      console.log(`   Found ${adminResult.rows.length} admin leghe`);
    } catch (error) {
      console.error('❌ /leghe/admin query failed:', error.message);
    }
    
    // Test 3: Endpoint /leghe/all (SuperAdmin)
    console.log('\n🔍 Testing /leghe/all endpoint...');
    try {
      const allResult = await db.query(`
        SELECT l.*, 
             CASE 
               WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
               ELSE u.nome || ' ' || u.cognome 
             END as admin_nome,
             u.email as admin_email,
             COALESCE((SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id), 0) as numero_squadre,
             COALESCE((SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.proprietario_id IS NOT NULL), 0) as squadre_con_proprietario,
             COALESCE((SELECT COUNT(*) FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = l.id), 0) as numero_giocatori,
             COALESCE((SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id), 0) as numero_tornei
        FROM leghe l
        LEFT JOIN users u ON l.admin_id = u.id
        ORDER BY l.created_at DESC
      `);
      console.log('✅ /leghe/all query executed successfully');
      console.log(`   Found ${allResult.rows.length} total leghe`);
      
      // Log details for debugging
      allResult.rows.forEach((lega, index) => {
        console.log(`   Lega ${index + 1}: ${lega.nome} - ${lega.numero_squadre} squadre, ${lega.numero_giocatori} giocatori`);
      });
    } catch (error) {
      console.error('❌ /leghe/all query failed:', error.message);
    }
    
    // Test 4: Endpoint /leghe/:id/squadre
    console.log('\n🔍 Testing /leghe/:id/squadre endpoint...');
    try {
      const leghe = await db.query('SELECT id FROM leghe LIMIT 1');
      if (leghe.rows.length > 0) {
        const legaId = leghe.rows[0].id;
        const squadreResult = await db.query(`
          SELECT s.*, 
               u.username as proprietario_username,
               CASE 
                 WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN 'Futboly'
                 ELSE COALESCE(u.nome, 'Nome') 
               END as proprietario_nome,
               CASE 
                 WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN ''
                 ELSE COALESCE(u.cognome, '') 
               END as proprietario_cognome,
               COALESCE((
                 SELECT SUM(COALESCE(g.quotazione_attuale, 0))
                 FROM giocatori g
                 WHERE g.squadra_id = s.id
               ), 0) as valore_attuale_qa
          FROM squadre s
          LEFT JOIN users u ON s.proprietario_id = u.id
          WHERE s.lega_id = $1
          ORDER BY s.nome
        `, [legaId]);
        console.log('✅ /leghe/:id/squadre query executed successfully');
        console.log(`   Found ${squadreResult.rows.length} squadre for lega ${legaId}`);
      } else {
        console.log('⚠️ No leghe found to test squadre endpoint');
      }
    } catch (error) {
      console.error('❌ /leghe/:id/squadre query failed:', error.message);
    }
    
    // Test 5: Endpoint /squadre/utente
    console.log('\n🔍 Testing /squadre/utente endpoint...');
    try {
      const userSquadreResult = await db.query(`
        SELECT s.*, 
             l.nome as lega_nome,
             u.username as proprietario_username,
             CASE 
               WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN 'Futboly'
               ELSE COALESCE(u.nome, 'Nome') 
             END as proprietario_nome,
             CASE 
               WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN ''
               ELSE COALESCE(u.cognome, '') 
             END as proprietario_cognome
        FROM squadre s
        LEFT JOIN leghe l ON s.lega_id = l.id
        LEFT JOIN users u ON s.proprietario_id = u.id
        WHERE s.proprietario_id = 1
        ORDER BY l.nome, s.nome
      `);
      console.log('✅ /squadre/utente query executed successfully');
      console.log(`   Found ${userSquadreResult.rows.length} user squadre`);
    } catch (error) {
      console.error('❌ /squadre/utente query failed:', error.message);
    }
    
    // Test 6: Endpoint /notifiche
    console.log('\n🔍 Testing /notifiche endpoint...');
    try {
      const notificheResult = await db.query(`
        SELECT n.*, l.nome as lega_nome
        FROM notifiche n
        LEFT JOIN leghe l ON n.lega_id = l.id
        WHERE n.utente_id = 1
        ORDER BY n.data_creazione DESC
        LIMIT 10
      `);
      console.log('✅ /notifiche query executed successfully');
      console.log(`   Found ${notificheResult.rows.length} notifiche`);
    } catch (error) {
      console.error('❌ /notifiche query failed:', error.message);
    }
    
    console.log('\n✅ ALL ENDPOINTS TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ ENDPOINTS TEST FAILED:', error);
  }
}

testAllEndpoints(); 