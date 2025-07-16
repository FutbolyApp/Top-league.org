import { getDb } from './db/postgres.js';

async function updateDatabaseSchema() {
  try {
    console.log('🔄 Connecting to database...');
    const db = getDb();
    
    if (!db) {
      console.error('❌ Database not available');
      return;
    }
    
    // Test connection
    const client = await db.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Connected to database');
    
    // Check current table structure
    console.log('📋 Checking current richieste_admin table structure...');
    const structureResult = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'richieste_admin'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns:', structureResult.rows.map(r => r.column_name));
    
    // Add missing columns if they don't exist
    const columnsToAdd = [
      {
        name: 'dati_richiesta',
        type: 'TEXT',
        nullable: true,
        default: null
      },
      {
        name: 'data_creazione',
        type: 'TIMESTAMP',
        nullable: true,
        default: 'CURRENT_TIMESTAMP'
      }
    ];
    
    for (const column of columnsToAdd) {
      const columnExists = structureResult.rows.some(r => r.column_name === column.name);
      
      if (!columnExists) {
        console.log(`📄 Adding column: ${column.name}`);
        try {
          await db.query(`
            ALTER TABLE richieste_admin 
            ADD COLUMN ${column.name} ${column.type} ${column.default ? `DEFAULT ${column.default}` : ''}
          `);
          console.log(`✅ Column ${column.name} added successfully`);
        } catch (error) {
          console.log(`⚠️ Warning adding column ${column.name}: ${error.message}`);
        }
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }
    
    // Verify the fix
    console.log('🔍 Verifying table structure after fix...');
    const finalStructure = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'richieste_admin'
      ORDER BY ordinal_position;
    `);
    
    console.log('Final columns:', finalStructure.rows.map(r => r.column_name));
    
    // Test the table with a sample query
    console.log('🧪 Testing table functionality...');
    try {
      const testResult = await db.query(`
        SELECT COUNT(*) as count FROM richieste_admin
      `);
      console.log(`✅ Table test successful. Row count: ${testResult.rows[0].count}`);
    } catch (error) {
      console.log(`❌ Table test failed: ${error.message}`);
    }
    
    console.log('✅ Database schema update completed!');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
  }
}

// Run the update
updateDatabaseSchema(); 