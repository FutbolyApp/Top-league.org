import { getDb } from './backend/db/postgres.js';

async function fixPendingChangesTable() {
  console.log('🔧 Fixing pending_changes table...');
  
  try {
    const db = getDb();
    if (!db) {
      console.log('❌ Database not available');
      return;
    }
    
    // 1. Check if pending_changes table exists
    console.log('\n📋 Step 1: Checking pending_changes table...');
    
    try {
      const result = await db.query('SELECT COUNT(*) FROM pending_changes');
      console.log(`✅ pending_changes table exists: ${result.rows[0].count} rows`);
    } catch (error) {
      console.log(`❌ pending_changes table missing:`, error.message);
      
      // Create the table
      console.log('\n🔧 Creating pending_changes table...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS pending_changes (
          id SERIAL PRIMARY KEY,
          lega_id INTEGER NOT NULL,
          subadmin_id INTEGER NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          action_data TEXT NOT NULL,
          description TEXT,
          details TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          admin_response TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          reviewed_at TIMESTAMP,
          FOREIGN KEY (lega_id) REFERENCES leghe(id) ON DELETE CASCADE,
          FOREIGN KEY (subadmin_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ pending_changes table created successfully');
    }
    
    // 2. Check table structure
    console.log('\n📋 Step 2: Checking table structure...');
    
    try {
      const columns = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'pending_changes'
        ORDER BY ordinal_position
      `);
      
      console.log('Table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } catch (error) {
      console.log('❌ Error checking table structure:', error.message);
    }
    
    // 3. Test the getChangeHistory function
    console.log('\n📋 Step 3: Testing getChangeHistory function...');
    
    try {
      const result = await db.query(`
        SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome
        FROM pending_changes pc
        JOIN users u ON pc.subadmin_id = u.id
        JOIN leghe l ON pc.lega_id = l.id
        WHERE pc.lega_id = 6 AND pc.status IN ('approved', 'rejected')
        ORDER BY pc.reviewed_at DESC
      `);
      
      console.log(`✅ getChangeHistory test successful: ${result.rows.length} rows found`);
      
      if (result.rows.length > 0) {
        console.log('Sample data:');
        console.log(result.rows[0]);
      }
    } catch (error) {
      console.log('❌ getChangeHistory test failed:', error.message);
      
      // Try to identify the specific issue
      console.log('\n🔍 Debugging the issue...');
      
      // Check if users table exists
      try {
        const usersResult = await db.query('SELECT COUNT(*) FROM users');
        console.log(`✅ users table exists: ${usersResult.rows[0].count} rows`);
      } catch (error) {
        console.log('❌ users table issue:', error.message);
      }
      
      // Check if leghe table exists
      try {
        const legheResult = await db.query('SELECT COUNT(*) FROM leghe');
        console.log(`✅ leghe table exists: ${legheResult.rows[0].count} rows`);
      } catch (error) {
        console.log('❌ leghe table issue:', error.message);
      }
      
      // Check if lega 6 exists
      try {
        const legaResult = await db.query('SELECT * FROM leghe WHERE id = 6');
        console.log(`✅ lega 6 exists: ${legaResult.rows.length > 0 ? 'yes' : 'no'}`);
      } catch (error) {
        console.log('❌ lega 6 issue:', error.message);
      }
    }
    
    console.log('\n✅ Database fix completed');
    
  } catch (error) {
    console.error('❌ Error during database fix:', error);
  }
}

fixPendingChangesTable(); 