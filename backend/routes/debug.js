import express from 'express';
import { getDb } from '../db/mariadb.js';

const router = express.Router();

// Debug endpoint to check user context
router.get('/debug-user', (req, res) => {
  console.log('🔍 DEBUG USER ENDPOINT CALLED');
  console.log('🔍 Request headers:', req.headers);
  console.log('🔍 Request user:', req.user);
  console.log('🔍 Request body:', req.body);
    
    res.json({ 
    message: 'Debug endpoint called',
    timestamp: new Date().toISOString(),
    user: req.user || 'No user found',
    headers: req.headers,
    environment: process.env.NODE_ENV
  });
});

// Debug endpoint to test database connection
router.get('/debug-db', async (req, res) => {
  try {
    console.log('🔍 DEBUG DB ENDPOINT CALLED');
    const db = getDb();
    console.log('🔍 Database object:', db);
    
    if (db && db.query) {
      const result = await db.query('SELECT 1 as test');
      console.log('🔍 Database query result:', result);
    res.json({
        message: 'Database connection successful',
        result: result,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('🔍 Database not available');
    res.json({ 
        message: 'Database not available',
        db: db,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('🔍 Database debug error:', error);
    res.status(500).json({ 
      message: 'Database debug error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check auth middleware
router.get('/debug-auth', (req, res) => {
  console.log('🔍 DEBUG AUTH ENDPOINT CALLED');
  console.log('🔍 Auth check - user:', req.user);
  console.log('🔍 Auth check - headers:', req.headers.authorization);
    
    res.json({ 
    message: 'Auth debug endpoint',
    user: req.user || 'No user',
    hasAuthHeader: !!req.headers.authorization,
    timestamp: new Date().toISOString()
  });
});

export default router; 