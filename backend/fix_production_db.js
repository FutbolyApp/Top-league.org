import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config({ path: './env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixProductionDatabase() {
  try {
    console.log('🔄 Connecting to production database...');
    
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Connected to production database');
    
    // Check current table structure
    console.log('📋 Checking current richieste_admin table structure...');
    const structureResult = await pool.query(`
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
          await pool.query(`
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
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'richieste_admin'
      ORDER BY ordinal_position;
    `);
    
    console.log('Final columns:', finalStructure.rows.map(r => r.column_name));
    
    // Test the table with a sample query
    console.log('🧪 Testing table functionality...');
    try {
      const testResult = await pool.query(`
        SELECT COUNT(*) as count FROM richieste_admin
      `);
      console.log(`✅ Table test successful. Row count: ${testResult.rows[0].count}`);
    } catch (error) {
      console.log(`❌ Table test failed: ${error.message}`);
    }
    
    console.log('✅ Production database fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
  } finally {
    await pool.end();
  }
}

fixProductionDatabase(); 