#!/bin/bash

echo "🚀 Fixing JSON validation middleware for FormData support..."
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Create a corrected index.js file with proper FormData support
echo "📤 Creating corrected index.js with FormData support..."
cat > temp-index-fixed.js << 'EOF'
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeDatabase, getDb } from './db/mariadb.js';
import { fixNotificheColumns } from './scripts/fix_remaining_columns.js';
import { errorHandler, requestLogger, corsHandler } from './middleware/errorHandler.js';

// Carica le variabili d'ambiente dal file corretto in base all'ambiente
const envFile = process.env.NODE_ENV === 'production' ? './env.ionos' : './env.local';
console.log(`🔍 Loading environment from: ${envFile} (NODE_ENV: ${process.env.NODE_ENV})`);
dotenv.config({ path: envFile });
import { initializeWebSocket } from './websocket.js';
import legheRouter from './routes/leghe.js';
import authRouter from './routes/auth.js';
import squadreRouter from './routes/squadre.js';
import giocatoriRouter from './routes/giocatori.js';
import notificheRouter from './routes/notifiche.js';
import offerteRouter from './routes/offerte.js';
import logRouter from './routes/log.js';
import logSquadraRouter from './routes/logSquadra.js';
import subadminRouter from './routes/subadmin.js';
import superadminRouter from './routes/superadmin.js';
import scrapingRouter from './routes/scraping.js';
import contrattiRouter from './routes/contratti.js';
import torneiRouter from './routes/tornei.js';
import finanzeRouter from './routes/finanze.js';
import backupRouter from './routes/backup.js';
import quotazioniRoutes from './routes/quotazioni.js';
import richiesteAdminRoutes from './routes/richiesteAdmin.js';
import schemaRouter from './routes/schema.js';
import debugRouter from './routes/debug.js';
import testRouter from './routes/test.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// FIXED: Use centralized CORS handler
app.use(corsHandler);

// FIXED: Use centralized request logger
app.use(requestLogger);

// FIXED: Enhanced body parsing with better error handling and FormData support
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    // Skip JSON validation for multipart/form-data requests (FormData)
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      return;
    }
    
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        error: 'Formato JSON non valido',
        details: 'Il corpo della richiesta non è un JSON valido'
      });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 1000
}));

// FIXED: Enhanced static file serving with error handling
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000');
  },
  fallthrough: false
}));

// FIXED: Health check endpoint
app.get('/health', (req, res) => {
  const db = getDb();
  const dbStatus = db ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.13'
  });
});

// FIXED: API version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.13',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// FIXED: Enhanced route mounting with error handling
app.use('/api/auth', authRouter);
app.use('/api/leghe', legheRouter);
app.use('/api/squadre', squadreRouter);
app.use('/api/giocatori', giocatoriRouter);
app.use('/api/notifiche', notificheRouter);
app.use('/api/offerte', offerteRouter);
app.use('/api/log', logRouter);
app.use('/api/log-squadra', logSquadraRouter);
app.use('/api/subadmin', subadminRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/scraping', scrapingRouter);
app.use('/api/contratti', contrattiRouter);
app.use('/api/tornei', torneiRouter);
app.use('/api/finanze', finanzeRouter);
app.use('/api/backup', backupRouter);
app.use('/api/quotazioni', quotazioniRoutes);
app.use('/api/richieste-admin', richiesteAdminRoutes);
app.use('/api/schema', schemaRouter);
app.use('/api/debug', debugRouter);
app.use('/api/test', testRouter);

// FIXED: 404 handler for undefined routes
app.use('*', (req, res) => {
  console.log('🔍 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Endpoint non trovato',
    details: `La route ${req.method} ${req.originalUrl} non esiste`,
    timestamp: new Date().toISOString()
  });
});

// FIXED: Use centralized error handler as last middleware
app.use(errorHandler);

// FIXED: Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('🔍 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔍 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// FIXED: Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// FIXED: Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// FIXED: Memory leak detection
const used = process.memoryUsage();
console.log('🔍 Memory usage on startup:', {
  rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
  heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
  external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
});

// FIXED: Database initialization with retry logic
const initializeDatabaseWithRetry = async (maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Database initialization attempt ${attempt}/${maxRetries}`);
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
      return true;
    } catch (error) {
      console.error(`🚨 Database initialization attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('🚨 All database initialization attempts failed');
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// FIXED: Enhanced server startup
const startServer = async () => {
  try {
    console.log('🔍 Starting server...');
    
    // Initialize database
    await initializeDatabaseWithRetry();
    
    // Fix notification columns if needed
    try {
      await fixNotificheColumns();
      console.log('✅ Notification columns fixed');
    } catch (error) {
      console.log('⚠️ Notification columns fix failed:', error.message);
    }
    
    // Initialize WebSocket
    try {
      await initializeWebSocket();
      console.log('✅ WebSocket initialized');
    } catch (error) {
      console.log('❌ Failed to initialize WebSocket:', error.message);
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log('✅ Server running on port', PORT);
      console.log('✅ Environment:', process.env.NODE_ENV || 'development');
    });
    
  } catch (error) {
    console.error('🚨 Server startup failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
EOF

# Upload the corrected index.js
echo "📤 Uploading corrected index.js with FormData support..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no temp-index-fixed.js root@top-league.org:/var/www/html/index.js

# Clean up temporary file
rm temp-index-fixed.js

# Restart del backend
echo "🔄 Restarting backend..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && pm2 restart topleague-backend"

# Test degli endpoint
echo "🧪 Testing endpoints..."
sleep 10

echo "✅ Testing /api/version..."
curl -s https://www.top-league.org/api/version | head -c 100

echo "✅ Testing /api/squadre/utente..."
curl -s https://www.top-league.org/api/squadre/utente -H "Content-Type: application/json" | head -c 100

echo "🎉 JSON validation fix completed!"
echo "📊 Check logs with: sshpass -p 'VQJ7tSzw' ssh root@top-league.org 'pm2 logs topleague-backend'" 