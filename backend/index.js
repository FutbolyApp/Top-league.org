import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getDb } from './db/postgres.js';
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
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://topleaguem-frontend.onrender.com',
      'https://topleague-frontend-new.onrender.com',
      'https://topleaguem.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Origin', 
    'Accept', 
    'Cache-Control',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: [
    'Content-Length', 
    'X-Requested-With', 
    'Authorization',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Middleware aggiuntivo per CORS preflight - MIGLIORATO
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins
  const allowedOrigins = [
    'http://localhost:3000',
    'https://topleaguem-frontend.onrender.com',
    'https://topleague-frontend-new.onrender.com',
    'https://topleaguem.onrender.com'
  ];
  
  // Always set CORS headers for debugging
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Content-Length');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Log all requests for debugging
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${origin}`);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

// Servi file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rendi il database accessibile alle route
app.locals.db = getDb();

// Storage per upload file (Excel/PDF)
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Route di test
app.get('/api/ping', (req, res) => {
  console.log('Ping received');
  res.json({ message: 'pong' });
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
// Middleware per gestire OPTIONS su tutte le route API
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('API OPTIONS request for:', req.url);
    const origin = req.headers.origin;
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://topleaguem-frontend.onrender.com',
      'https://topleague-frontend-new.onrender.com',
      'https://topleaguem.onrender.com'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    return res.sendStatus(200);
  }
  next();
});

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
try {
  console.log('Starting database initialization...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  await initDb();
  console.log('Database initialization completed successfully');
  
  const server = app.listen(PORT, () => {
    console.log(`TopLeague backend listening on port ${PORT}`);
    console.log(`Test the server with: curl http://localhost:${PORT}/api/ping`);
  });

  // Initialize WebSocket server
  initializeWebSocket(server);

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

// Conferma API
app.get('/', (req, res) => {
  res.send('✅ API TopLeague attiva!');
});
