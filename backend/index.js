import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getDb } from './db/config.js';
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
app.use(cors());
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
  initDb();
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
  process.exit(1);
}

// Conferma API
app.get('/', (req, res) => {
  res.send('✅ API TopLeague attiva!');
});
