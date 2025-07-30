import express from 'express';
import { getDb, initializeDatabase } from '../db/mariadb.js';

const router = express.Router();

// Endpoint per aggiornare lo schema del database
router.post('/update', async (req, res) => {
  try {
    console.log('🔄 Schema update requested...');
    
    const db = getDb();
    if (!db) {
      return res.status(500).json({ 
        error: 'Database not available',
        message: 'DATABASE_URL not configured'
      });
    }

    // Inizializza il database con tutte le tabelle
    await initializeDatabase();
    
    console.log('✅ Schema update completed successfully');
    
    res.json({ 
      success: true, 
      message: 'Database schema updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    res.status(500).json({ 
      error: 'Schema update failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint per verificare lo stato del database
router.get('/status', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(500).json({ 
        error: 'Database not available',
        message: 'DATABASE_URL not configured'
      });
    }

    // Test connection
    const client = await db.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database status check failed:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint per testare la tabella richieste_admin
router.get('/test-richieste-admin', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(500).json({ 
        error: 'Database not available',
        message: 'DATABASE_URL not configured'
      });
    }

    // Test connection
    const client = await db.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    // Check if richieste_admin table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'richieste_admin'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      return res.json({ 
        error: 'Table does not exist',
        tableExists: false
      });
    }
    
    // Get table structure
    const structure = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'richieste_admin'
      ORDER BY ordinal_position;
    `);
    
    // Count rows
    const count = await db.query('SELECT COUNT(*) as count FROM richieste_admin');
    
    res.json({ 
      success: true,
      tableExists: true,
      structure: structure.rows,
      rowCount: parseInt(count.rows[0].count)
    });
    
  } catch (error) {
    console.error('❌ Test richieste_admin failed:', error);
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 