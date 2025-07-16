import express from 'express';
import { getDb } from '../db/postgres.js';
import { initDb } from '../db/postgres.js';

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
    await initDb();
    
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

export default router; 