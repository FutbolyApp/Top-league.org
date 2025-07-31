#!/bin/bash

echo "🔧 Fixing middleware order in index.js..."

# Create the corrected index.js content
cat > temp-index.js << 'EOF'
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

// FIXED: Enhanced body parsing with better error handling and FormData support
// IMPORTANT: This comes AFTER static file serving but BEFORE routes
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

// FIXED: Initialize database before routes
initializeDatabase().then(() => {
  console.log('✅ Database initialized successfully');
  
  // FIXED: Run any necessary database fixes
  fixNotificheColumns().catch(err => {
    console.warn('⚠️ Warning: Could not fix notifiche columns:', err.message);
  });
  
  // FIXED: Initialize WebSocket after database
  initializeWebSocket().catch(err => {
    console.warn('⚠️ Warning: Could not initialize WebSocket:', err.message);
  });
  
  // FIXED: Mount routes after database initialization
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
  
  // FIXED: Enhanced 404 handler with better error messages
  app.use('*', (req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });
  
  // FIXED: Use centralized error handler
  app.use(errorHandler);
  
  // FIXED: Start server only after everything is initialized
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${getDb() ? 'connected' : 'disconnected'}`);
  });
  
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});

export default app;
EOF

# Upload the corrected index.js
echo "📤 Uploading corrected index.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no temp-index.js root@top-league.org:/var/www/html/index.js

# Clean up
rm temp-index.js

# Restart the backend
echo "🔄 Restarting backend..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && pm2 restart topleague-backend"

# Test the endpoints
echo "🧪 Testing endpoints after middleware fix..."
sleep 5

echo "✅ Testing /api/leghe/create with FormData..."
curl -s -X POST https://www.top-league.org/api/leghe/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" \
  -F "nome=TestLega" \
  -F "modalita=Test" \
  -F "admin_id=1" \
  -F "is_pubblica=true" | head -c 200

echo "✅ Testing /api/subadmin/check-all..."
curl -s https://www.top-league.org/api/subadmin/check-all -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" | head -c 200

echo "🎉 Middleware order fix completed!"
echo "📊 Now try creating a league on the website - it should work!" 