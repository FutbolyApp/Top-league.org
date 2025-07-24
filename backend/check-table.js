import { getDb } from './db/mariadb.js';

async function checkTable() {
  try {
    const db = getDb();
    const result = await db.query('SHOW TABLES LIKE "richieste_ingresso"');
    console.log('Table check result:', result);
    
    if (result && result.length > 0) {
      console.log('✅ richieste_ingresso table exists');
      
      // Check table structure
      const structure = await db.query('DESCRIBE richieste_ingresso');
      console.log('Table structure:', structure);
    } else {
      console.log('❌ richieste_ingresso table does not exist');
    }
  } catch (error) {
    console.error('Error checking table:', error);
  }
}

checkTable(); 