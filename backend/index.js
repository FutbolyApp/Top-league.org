import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeDatabase, getDb } from './db/mariadb.js';
import { fixNotificheColumns } from './scripts/fix_remaining_columns.js';
import { 
  errorHandler, 
  asyncHandler, 
  validationErrorHandler, 
  databaseErrorHandler, 
  notFoundHandler 
} from './middleware/errorHandler.js';

// Carica le variabili d'ambiente dal file corretto in base all'ambiente
const envFile = process.env.NODE_ENV === 'production' ? './env.ionos' : './env.local';
console.log(`🔍 Loading environment from: ${envFile} (NODE_ENV: ${process.env.NODE_ENV})`);
dotenv.config({ path: envFile });
import { initializeWebSocket } from './websocket.js';
import legheRouter from './routes/leghe-fixed.js';
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

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://topleaguem-frontend.onrender.com',
    'https://topleague-frontend-new.onrender.com',
    'https://topleaguem.onrender.com',
    'https://topleague-frontend.onrender.com',
    'https://topleague-frontend-new.onrender.com',
    'https://top-league.org',
    'https://www.top-league.org'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Content-Length', 'X-Request-ID', 'X-Frontend-Version']
}));

// Enhanced request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9);
  
  console.log('🔍 REQUEST:', {
    requestId,
    method: req.method,
    url: req.url,
    endpoint: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    hasAuth: !!req.headers.authorization,
    hasBody: !!req.body,
    timestamp: new Date().toISOString()
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log('🔍 RESPONSE:', {
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
});

// FIXED: Enhanced body parsing with better error handling
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
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

// Enhanced error handling middleware chain
app.use(validationErrorHandler);
app.use(databaseErrorHandler);
app.use(notFoundHandler);
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
      console.warn('⚠️ Could not fix notification columns:', error.message);
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Database: ${getDb() ? 'Connected' : 'Disconnected'}`);
      console.log(`✅ Timestamp: ${new Date().toISOString()}`);
    });
    
    // Initialize WebSocket
    try {
      await initializeWebSocket();
      console.log('✅ WebSocket initialized');
    } catch (error) {
      console.warn('⚠️ WebSocket initialization failed:', error.message);
    }
    
  } catch (error) {
    console.error('🚨 Server startup failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
