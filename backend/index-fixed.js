import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb } from './db/mariadb.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware per logging delle richieste
app.use(requestLogger);

// Middleware per gestione CORS migliorata
app.use(corsHandler);

// Middleware per parsing del body - FIXED per gestire sia JSON che FormData
app.use(express.json({
  verify: (req, res, buf) => {
    // Solo per Content-Type: application/json
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      try {
        JSON.parse(buf);
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

// Configurazione multer per upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Servi file statici per uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  },
  fallthrough: false
}));

// Endpoint di health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Endpoint di versione API
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.13',
    backend: '1.0.13',
    timestamp: new Date().toISOString()
  });
});

// Monta i router
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

// Handler per route non trovate
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware per gestione errori (deve essere l'ultimo)
app.use(errorHandler);

// Funzione per inizializzare il database con retry
async function initializeDatabaseWithRetry(maxRetries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Database initialization attempt ${attempt}/${maxRetries}...`);
      
      // Test della connessione al database
      const db = getDb();
      await db.query('SELECT 1');
      
      console.log('✅ Database connection successful');
      
      // Fix delle colonne notifiche se necessario
      try {
        await fixNotificheColumns();
        console.log('✅ Notification columns fixed');
      } catch (error) {
        console.log('⚠️ Warning: Could not fix notification columns:', error.message);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Database initialization attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        console.error('❌ Database initialization failed after all retries');
        return false;
      }
    }
  }
}

// Funzione per avviare il server
async function startServer() {
  try {
    // Inizializza il database (ma non bloccare il server se fallisce)
    console.log('🔍 Attempting database initialization...');
    const dbInitialized = await initializeDatabaseWithRetry();
    
    if (!dbInitialized) {
      console.warn('⚠️ Database initialization failed, but server will continue without database functionality');
      console.warn('⚠️ Some endpoints may not work properly without database connection');
    }
    
    // Inizializza WebSocket
    try {
      await initializeWebSocket();
      console.log('✅ WebSocket initialized');
    } catch (error) {
      console.log('⚠️ Warning: WebSocket initialization failed:', error.message);
    }
    
    // Avvia il server SEMPRE, anche se il database non è disponibile
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      console.log(`🗄️ Database status: ${dbInitialized ? 'Connected' : 'Not available'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Gestione errori non catturati
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Non uscire immediatamente, lascia che il server continui
  console.log('🔄 Server will continue running despite uncaught exception');
});

// Avvia il server
startServer(); 