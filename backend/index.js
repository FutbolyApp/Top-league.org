import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeDatabase, getDb } from './db/postgres.js';
import { fixNotificheColumns } from './scripts/fix_remaining_columns.js';

// Carica le variabili d'ambiente dal file env.local
dotenv.config({ path: './env.local' });
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
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione CORS ottimizzata per risolvere problemi di accesso
app.use(cors({
  origin: [
    'https://topleague-frontend-new.onrender.com',
    'https://topleaguem-frontend.onrender.com',
    'https://topleague-frontend.onrender.com',
    'https://topleaguem.onrender.com',
    'http://localhost:3000'
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization','Cache-Control','Pragma','Expires','Origin','X-Requested-With','Accept'],
  credentials: true
}));

app.options('*', cors()); // abilita le richieste preflight

// Middleware specifico per gestire richieste OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', 'https://topleague-frontend-new.onrender.com');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  next();
});

// Middleware per gestire errori globali
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Se è un errore CORS, rispondi con headers appropriati
  if (err.message && err.message.includes('CORS')) {
    res.header('Access-Control-Allow-Origin', 'https://topleague-frontend-new.onrender.com');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    type: 'server_error'
  });
});

// Logging middleware per debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin} - Content-Type: ${req.headers['content-type']}`);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servi file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Rendi il database accessibile alle route
app.locals.db = getDb();

// Storage per upload file (Excel/PDF)
const upload = multer({ 
  dest: path.join(__dirname, 'uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB limit for fields
  }
});

// Route di test
app.get('/api/ping', (req, res) => {
  console.log('Ping received');
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check received');
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  console.log('CORS test received');
  res.json({ 
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Test CORS preflight endpoint
app.options('/api/test-cors-preflight', (req, res) => {
  console.log('CORS preflight test received');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.post('/api/test-cors-preflight', (req, res) => {
  console.log('CORS preflight POST test received');
  res.json({ 
    message: 'CORS preflight POST test successful',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Test authentication endpoint
app.get('/api/test-auth', (req, res) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth test received, headers:', req.headers);
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  res.json({ 
    message: 'Auth header present',
    hasToken: !!token,
    tokenLength: token.length
  });
});

// Test FormData endpoint
app.post('/api/test-formdata', upload.single('file'), (req, res) => {
  console.log('FormData test received');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file);
  
  res.json({ 
    message: 'FormData test successful',
    hasFile: !!req.file,
    bodyKeys: Object.keys(req.body),
    timestamp: new Date().toISOString()
  });
});

// Placeholder: upload file Excel
app.post('/api/upload/excel', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
  res.json({ filename: req.file.filename, originalname: req.file.originalname });
});

// Upload logo
app.post('/api/upload/logo', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun logo caricato' });
  
  // Verifica che sia un'immagine
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Formato file non supportato. Usa solo JPG, PNG o GIF' });
  }
  
  // Verifica dimensione file (max 5MB)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'File troppo grande. Massimo 5MB' });
  }
  
  res.json({ 
    filename: req.file.filename, 
    originalname: req.file.originalname,
    size: req.file.size 
  });
});

// API Routes

app.use('/api/leghe', legheRouter);
app.use('/api/auth', authRouter);
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Sistema automatico di pulizia profili browser
const cleanupBrowserProfiles = () => {
  const profilesDir = path.join(__dirname, 'playwright_profile');
  const puppeteerDir = path.join(__dirname, 'puppeteer_profile');
  
  try {
    // Pulisci profili Playwright
    if (fs.existsSync(profilesDir)) {
      const files = fs.readdirSync(profilesDir);
      files.forEach(file => {
        const filePath = path.join(profilesDir, file);
        const stats = fs.statSync(filePath);
        const daysOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        // Rimuovi profili più vecchi di 1 giorno
        if (daysOld > 1) {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          console.log(`Rimosso profilo browser: ${file}`);
        }
      });
    }
    
    // Pulisci profili Puppeteer
    if (fs.existsSync(puppeteerDir)) {
      const files = fs.readdirSync(puppeteerDir);
      files.forEach(file => {
        const filePath = path.join(puppeteerDir, file);
        const stats = fs.statSync(filePath);
        const daysOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        // Rimuovi profili più vecchi di 1 giorno
        if (daysOld > 1) {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          console.log(`Rimosso profilo browser: ${file}`);
        }
      });
    }
    
    console.log('Pulizia automatica profili browser completata');
  } catch (error) {
    console.error('Errore durante la pulizia automatica profili:', error);
  }
};

// Esegui pulizia ogni giorno alle 2:00
const scheduleCleanup = () => {
  const now = new Date();
  const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 2, 0, 0);
  const timeUntilNextRun = nextRun.getTime() - now.getTime();
  
  setTimeout(() => {
    cleanupBrowserProfiles();
    // Riprogramma per il giorno successivo
    setInterval(cleanupBrowserProfiles, 24 * 60 * 60 * 1000);
  }, timeUntilNextRun);
  
  console.log(`Pulizia automatica profili programmata per: ${nextRun.toLocaleString()}`);
};

// Avvia il sistema di pulizia automatica
scheduleCleanup();

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    
    // Try to initialize database
    if (process.env.DATABASE_URL) {
      try {
        console.log('Initializing database...');
        await initializeDatabase();
        // Fix colonne notifiche
        await fixNotificheColumns();
        console.log('Database initialization completed successfully');
      } catch (dbError) {
        console.error('Database initialization failed:', dbError.message);
        console.log('Server will start without database functionality');
      }
    } else {
      console.log('DATABASE_URL not set, skipping database initialization');
    }
    
    const server = app.listen(PORT, () => {
      console.log(`TopLeague backend listening on port ${PORT}`);
      console.log(`Test the server with: curl http://localhost:${PORT}/api/ping`);
    });

    // Initialize WebSocket server
    try {
      initializeWebSocket(server);
    } catch (wsError) {
      console.error('WebSocket initialization failed:', wsError.message);
    }

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

startServer();

// Conferma API
app.get('/', (req, res) => {
  res.send('✅ API TopLeague attiva!');
});
