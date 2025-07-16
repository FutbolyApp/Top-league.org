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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    // Verifica le tabelle principali
    const tables = ['users', 'leghe', 'squadre', 'giocatori', 'notifiche', 'richieste_admin'];
    const tableStatus = {};

    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        tableStatus[table] = {
          exists: true,
          count: parseInt(result.rows[0].count)
        };
      } catch (error) {
        tableStatus[table] = {
          exists: false,
          error: error.message
        };
      }
    }

    res.json({ 
      database: 'available',
      tables: tableStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database status check failed:', error);
    res.status(500).json({ 
      error: 'Database status check failed',
      message: error.message
    });
  }
});

export default router; 