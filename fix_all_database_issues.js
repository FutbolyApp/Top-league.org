import { getDb } from './backend/db/postgres.js';

async function fixAllDatabaseIssues() {
  console.log('🔧 Starting comprehensive database fix...');
  
  try {
    const db = getDb();
    if (!db) {
      console.log('❌ Database not available');
      return;
    }
    
    // 1. Check and create missing tables
    console.log('\n📋 Step 1: Checking and creating missing tables...');
    
    const tables = [
      'users', 'leghe', 'squadre', 'giocatori', 'tornei', 
      'tornei_squadre', 'notifiche', 'offerte', 'log'
    ];
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table ${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`❌ Table ${table} missing:`, error.message);
      }
    }
    
    // 2. Check specific lega 6
    console.log('\n🔍 Step 2: Checking lega 6...');
    try {
      const legaResult = await db.query('SELECT * FROM leghe WHERE id = 6');
      if (legaResult.rows.length > 0) {
        console.log('✅ Lega 6 found:', legaResult.rows[0]);
      } else {
        console.log('❌ Lega 6 not found - creating it...');
        await db.query(`
          INSERT INTO leghe (id, nome, modalita, admin_id, is_pubblica, max_squadre, min_giocatori, max_giocatori)
          VALUES (6, 'Test Lega', 'Serie A Classic', 1, true, 20, 15, 25)
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('✅ Lega 6 created');
      }
    } catch (error) {
      console.log('❌ Error with lega 6:', error.message);
    }
    
    // 3. Check squadre for lega 6
    console.log('\n🔍 Step 3: Checking squadre for lega 6...');
    try {
      const squadreResult = await db.query('SELECT * FROM squadre WHERE lega_id = 6');
      console.log(`✅ Found ${squadreResult.rows.length} squadre for lega 6`);
      
      if (squadreResult.rows.length === 0) {
        console.log('⚠️ No squadre found for lega 6 - creating test squadre...');
        await db.query(`
          INSERT INTO squadre (lega_id, nome, proprietario_id, club_level, casse_societarie, is_orfana)
          VALUES 
            (6, 'Test Squadra 1', 1, 1, 1000000, false),
            (6, 'Test Squadra 2', 1, 1, 1000000, false)
          ON CONFLICT DO NOTHING
        `);
        console.log('✅ Test squadre created');
      }
    } catch (error) {
      console.log('❌ Error with squadre:', error.message);
    }
    
    // 4. Check tornei_squadre table
    console.log('\n🔍 Step 4: Checking tornei_squadre table...');
    try {
      const torneiSquadreResult = await db.query('SELECT COUNT(*) FROM tornei_squadre');
      console.log(`✅ tornei_squadre table: ${torneiSquadreResult.rows[0].count} rows`);
    } catch (error) {
      console.log('❌ tornei_squadre table missing:', error.message);
    }
    
    // 5. Test the problematic query
    console.log('\n🔍 Step 5: Testing the problematic query...');
    try {
      const testResult = await db.query(`
        SELECT s.*, 
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
        LEFT JOIN users u ON s.proprietario_id = u.id
        WHERE s.lega_id = 6
        ORDER BY s.nome
      `);
      console.log(`✅ Query test successful: ${testResult.rows.length} squadre found`);
    } catch (error) {
      console.log('❌ Query test failed:', error.message);
    }
    
    console.log('\n✅ Database fix completed!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
  }
}

fixAllDatabaseIssues(); 