import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: ['https://top-league.org', 'http://localhost:3000'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test route directly in index.js
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route works!', timestamp: new Date().toISOString() });
});

// Test auth route directly in index.js
app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth test route works!', timestamp: new Date().toISOString() });
});

// Auth routes directly in index.js (bypassing import)
app.post('/api/auth/login', (req, res) => {
  console.log('🔍 Login attempt:', req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password sono richiesti' });
  }
  
  // Simple test login
  if (email === 'admin@topleague.com' && password === 'admin123') {
    const token = 'test-token-' + Date.now();
    res.json({
      token,
      user: {
        id: 1,
        email: 'admin@topleague.com',
        name: 'Admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Credenziali non valide' });
  }
});

app.post('/api/auth/register', (req, res) => {
  console.log('🔍 Register attempt:', req.body);
  res.json({ message: 'Register route works!', timestamp: new Date().toISOString() });
});

// Try to import auth router (with error handling)
try {
  console.log('🔍 Attempting to import auth router...');
  import('./routes/auth.js').then(authModule => {
    const authRouter = authModule.default;
    console.log('✅ Auth router imported successfully');
    app.use('/api/auth', authRouter);
  }).catch(err => {
    console.error('❌ Failed to import auth router:', err.message);
    console.log('ℹ️ Using direct routes instead');
  });
} catch (err) {
  console.error('❌ Error importing auth router:', err.message);
  console.log('ℹ️ Using direct routes instead');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve frontend - MUST COME AFTER API ROUTES
const frontendBuildPath = path.join(__dirname, 'public');
app.use(express.static(frontendBuildPath));

// Simple catch-all for frontend only
app.get('*', (req, res) => {
  console.log(`🔍 Frontend request for: ${req.path}`);
  const indexPath = path.join(frontendBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 