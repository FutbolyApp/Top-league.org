import express from 'express';
import { getDb } from '../db/mariadb.js';

const router = express.Router();

// Test database connection
router.get('/db-test', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database connection not available' });
    }
    
    const result = await db.query('SELECT COUNT(*) as total FROM leghe');
    res.json({ 
      success: true, 
      total_leghe: result.rows[0].total,
      message: 'Database connection working'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      error: 'Database error', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Test simple query
router.get('/simple-query', async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database connection not available' });
    }
    
    const result = await db.query('SELECT id, nome FROM leghe LIMIT 1');
    res.json({ 
      success: true, 
      data: result.rows,
      message: 'Simple query working'
    });
  } catch (error) {
    console.error('Simple query error:', error);
    res.status(500).json({ 
      error: 'Query error', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Test endpoint per verificare che l'applicazione funzioni
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'not configured for testing'
  });
});

// Test endpoint per simulare login senza database
router.post('/auth/test-login', (req, res) => {
  const { email, password } = req.body;
  
  // Simula autenticazione per test
  if (email === 'admin@topleague.com' && password === 'admin') {
    res.json({
      success: true,
      message: 'Login di test riuscito',
      user: {
        id: 1,
        email: 'admin@topleague.com',
        username: 'admin',
        role: 'admin'
      },
      token: 'test-token-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenziali di test: admin@topleague.com / admin'
    });
  }
});

// Test endpoint per verificare che l'API funzioni
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API TopLeague funzionante',
    timestamp: new Date().toISOString(),
    features: [
      'Frontend React servito correttamente',
      'API endpoints funzionanti',
      'CORS configurato',
      'Routing SPA attivo',
      'File statici serviti'
    ]
  });
});

export default router; 