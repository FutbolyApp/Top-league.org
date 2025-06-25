import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getDb } from './db/config.js';
import legheRouter from './routes/leghe.js';
import authRouter from './routes/auth.js';
import squadreRouter from './routes/squadre.js';
import giocatoriRouter from './routes/giocatori.js';
import notificheRouter from './routes/notifiche.js';
import offerteRouter from './routes/offerte.js';
import logRouter from './routes/log.js';
import subadminRouter from './routes/subadmin.js';
import superadminRouter from './routes/superadmin.js';
import scrapingRouter from './routes/scraping.js';
import contrattiRouter from './routes/contratti.js';
import torneiRouter from './routes/tornei.js';
import finanzeRouter from './routes/finanze.js';
import backupRouter from './routes/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// API Routes
app.use('/api/leghe', legheRouter);
app.use('/api/auth', authRouter);
app.use('/api/squadre', squadreRouter);
app.use('/api/giocatori', giocatoriRouter);
app.use('/api/notifiche', notificheRouter);
app.use('/api/offerte', offerteRouter);
app.use('/api/log', logRouter);
app.use('/api/subadmin', subadminRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/scraping', scrapingRouter);
app.use('/api/contratti', contrattiRouter);
app.use('/api/tornei', torneiRouter);
app.use('/api/finanze', finanzeRouter);
app.use('/api/backup', backupRouter);

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

// Initialize database and start server
try {
  initDb();
  const server = app.listen(PORT, () => {
    console.log(`TopLeague backend listening on port ${PORT}`);
    console.log(`Test the server with: curl http://localhost:${PORT}/api/ping`);
  });

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
