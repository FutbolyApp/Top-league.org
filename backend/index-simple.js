import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
const envFile = process.env.NODE_ENV === 'production' ? './env.ionos' : './env.local';
console.log(`🔍 Loading environment from: ${envFile} (NODE_ENV: ${process.env.NODE_ENV})`);
dotenv.config({ path: envFile });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware per CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://top-league.org', 'https://www.top-league.org'],
  credentials: true
}));

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
    cb(null, path.join(__dirname, 'uploads'));
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

// Test endpoint per FormData
app.post('/api/leghe/create', (req, res, next) => {
  console.log('🔍 Test endpoint chiamato');
  console.log('🔍 Content-Type:', req.headers['content-type']);
  console.log('🔍 Content-Length:', req.headers['content-length']);
  
  // Usa upload.fields per gestire più file
  const uploadFields = upload.fields([
    { name: 'excel', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]);
  
  uploadFields(req, res, (err) => {
    if (err) {
      console.error('🚨 Multer error:', err);
      return res.status(400).json({
        error: 'Errore upload file',
        details: err.message,
        type: 'multer_error'
      });
    }
    
    console.log('✅ Upload files completato');
    console.log('🔍 Files ricevuti:', req.files);
    console.log('🔍 Body ricevuto:', req.body);
    
    // Simula autenticazione
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token mancante' });
    }
    
    const token = authHeader.substring(7);
    if (token === 'fake_token') {
      return res.status(401).json({ error: 'Token non valido' });
    }
    
    // Simula creazione lega
    res.status(201).json({
      success: true,
      message: 'Lega creata con successo (test)',
      legaId: Math.floor(Math.random() * 1000),
      filesReceived: req.files ? Object.keys(req.files).length : 0,
      bodyData: req.body
    });
  });
});

// Endpoint per verifica utente
app.get('/api/auth/verify-user', (req, res) => {
  console.log('🔍 Verify user endpoint chiamato');
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }
  
  const token = authHeader.substring(7);
  console.log('🔍 Token ricevuto:', token.substring(0, 20) + '...');
  
  // Simula verifica token
  if (token === 'fake_token') {
    return res.status(401).json({ error: 'Token non valido' });
  }
  
  // Simula utente valido
  const mockUser = {
    id: 1,
    email: 'admin@top-league.org',
    nome: 'Admin',
    cognome: 'User',
    ruolo: 'SuperAdmin',
    is_active: true
  };
  
  console.log('✅ User verificato:', mockUser);
  res.json({
    user: mockUser
  });
});

// Handler per route non trovate
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`🗄️ Database: Disabled for testing`);
});

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
}); 