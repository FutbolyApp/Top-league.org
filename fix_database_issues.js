async function checkAndFixDatabase() {
  try {
    const { getDb } = await import('./backend/db/postgres.js');
    const db = getDb();
    
    console.log('🔍 Checking database tables...');
    
    // Check if tables exist
    const tables = [
      'users', 'leghe', 'squadre', 'giocatori', 'tornei', 
      'tornei_squadre', 'notifiche', 'offerte', 'log'
    ];
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table ${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`❌ Table ${table} missing or error:`, error.message);
      }
    }
    
    // Check specific lega 6
    console.log('\n🔍 Checking lega 6...');
    const legaResult = await db.query('SELECT * FROM leghe WHERE id = 6');
    if (legaResult.rows.length > 0) {
      console.log('✅ Lega 6 found:', legaResult.rows[0]);
    } else {
      console.log('❌ Lega 6 not found');
    }
    
    // Check squadre for lega 6
    const squadreResult = await db.query('SELECT * FROM squadre WHERE lega_id = 6');
    console.log(`✅ Found ${squadreResult.rows.length} squadre for lega 6`);
    
    // Check if tornei_squadre table exists and has data
    try {
      const torneiSquadreResult = await db.query('SELECT COUNT(*) FROM tornei_squadre');
      console.log(`✅ tornei_squadre table: ${torneiSquadreResult.rows[0].count} rows`);
    } catch (error) {
      console.log('❌ tornei_squadre table missing:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkAndFixDatabase(); 