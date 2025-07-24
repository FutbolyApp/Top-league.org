import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/mariadb.js';
import { createUtente, getUtenteByEmail, getUtenteByUsername, getUtenteById } from '../models/utente.js';
import { generateToken, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// Test endpoint senza database
router.get('/test-no-db', (req, res) => {
  console.log('Test endpoint without database called');
  res.json({ 
    message: 'Test successful - no database involved',
    timestamp: new Date().toISOString()
  });
});

// Registrazione utente
router.post('/register', async (req, res) => {
  try {
    const { nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password, ruolo } = req.body;
    if (!nome || !cognome || !username || !email || !password) {
      return res.status(400).json({ error: 'Tutti i campi obbligatori devono essere compilati (nome, cognome, username, email, password)' });
    }
    
    // Verifica se email già esiste
    const existingUser = await getUtenteByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'Email già registrata. Usa un\'altra email o fai login.' });
    
    // Verifica se username già esiste
    const existingUsername = await getUtenteByUsername(username);
    if (existingUsername) return res.status(400).json({ error: 'Username già in uso. Scegline un altro.' });
    
    const password_hash = bcrypt.hashSync(password, 10);
    const userRole = ruolo || 'Utente'; // Default a Utente se non specificato
    
    const userId = await createUtente({ 
      nome, 
      cognome, 
      username, 
      provenienza, 
      squadra_cuore, 
      come_conosciuto, 
      email, 
      password_hash, 
      ruolo: userRole 
    });
    
    res.json({ success: true, userId });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Test user for local development
const TEST_USER = {
  id: 1,
  username: 'admin',
  email: 'admin@topleague.com',
  password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
  nome: 'Admin',
  cognome: 'Test',
  ruolo: 'admin'
};

// Login utente - versione PostgreSQL
router.post('/login', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Request body received:', req.body);
    console.log('🔍 DEBUG: Content-Type:', req.headers['content-type']);
    
    const { email, password } = req.body;
    console.log('🔍 DEBUG: Extracted email:', email);
    console.log('🔍 DEBUG: Extracted password:', password ? '***' : 'undefined');
    
    if (!email || !password) return res.status(400).json({ error: 'Email/Username e password sono obbligatorie' });
    
    console.log('Login attempt for email/username:', email);
    
    // Check if database is available
    let db = getDb();
    let utente = null;
    
    if (db) {
      // Database available - try normal login
      try {
        // Prima prova a cercare per email
        utente = await getUtenteByEmail(email);
        
        // Se non trova per email, prova per username
        if (!utente) {
          console.log('User not found by email, trying username...');
          utente = await getUtenteByUsername(email);
        }
      } catch (dbError) {
        console.log('Database error, using test user for local development');
        db = null;
      }
    }
    
    // If no database or database error, use test user for local development
    if (!db || !utente) {
      console.log('Using test user for local development');
      
      // Check if it's the test user
      if (email === 'admin@topleague.com' && password === 'password') {
        utente = TEST_USER;
        console.log('Test user authenticated:', utente.username);
      } else {
        console.log('❌ Test user check failed. Email:', email, 'Password:', password);
        return res.status(400).json({ error: 'Utente non trovato. Usa admin@topleague.com / password per test locale.' });
      }
    }
    
    if (!utente) {
      console.log('User not found');
      return res.status(400).json({ error: 'Utente non trovato. Verifica email/username o registrati.' });
    }
    
    // Verifica password (skip for test user)
    if (utente !== TEST_USER && !(await bcrypt.compare(password, utente.password_hash))) {
      console.log('Password incorrect');
      return res.status(400).json({ error: 'Password non corretta. Riprova.' });
    }
    
    console.log('User authenticated:', utente.username, 'ID:', utente.id);
    
    // Generate token
    const token = generateToken(utente);
    
    // Get admin leghe if database available
    let legheAdmin = [];
    if (db && utente !== TEST_USER) {
      try {
        const legheResult = await db.query('SELECT id, nome FROM leghe WHERE admin_id = ?', [utente.id]);
        // Handle MariaDB result format
        if (legheResult && typeof legheResult === 'object' && legheResult.rows) {
          legheAdmin = legheResult.rows;
        } else if (Array.isArray(legheResult)) {
          legheAdmin = legheResult;
        }
      } catch (dbError) {
        console.log('Error getting admin leghe, using empty array');
      }
    }
    
    console.log('Login successful for:', utente.username, 'Leghe admin:', legheAdmin?.length || 0);
    
    res.json({ 
      token, 
      user: { 
        id: utente.id, 
        nome: utente?.nome || 'Nome', 
        cognome: utente?.cognome || '', 
        username: utente.username,
        email: utente.email, 
        ruolo: utente?.ruolo || 'Ruolo',
        leghe_admin: legheAdmin
      } 
    });
    
  } catch (e) {
    console.error('Unexpected error in login:', e);
    if (e.message && e.message.includes('Database non disponibile')) {
      return res.status(503).json({ 
        error: 'Servizio temporaneamente non disponibile',
        message: 'Il servizio database non è attualmente disponibile. Riprova più tardi.'
      });
    }
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Funzione helper per processare il login di successo
async function processLoginSuccess(utente, res, req) {
  try {
    console.log('processLoginSuccess started for user:', utente.username);
    
    // Ottieni le leghe di cui l'utente è admin
    const db = getDb();
    if (!db) {
      console.error('Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    console.log('Querying leghe admin for user ID:', utente.id);
    const legheResult = await db.query('SELECT id, nome FROM leghe WHERE admin_id = ?', [utente.id]);
    // Handle MariaDB result format
    let legheAdmin = [];
    if (legheResult && typeof legheResult === 'object' && legheResult.rows) {
      legheAdmin = legheResult.rows;
    } else if (Array.isArray(legheResult)) {
      legheAdmin = legheResult;
    }
    
    console.log('Generating token for user:', utente.username);
    const token = generateToken(utente);
    console.log('Login successful for:', utente.username, 'Leghe admin:', legheAdmin?.length || 0);
    
    console.log('Sending response to client');
    res.json({ 
      token, 
      user: { 
        id: utente.id, 
        nome: utente?.nome || 'Nome', 
        cognome: utente?.cognome || '', 
        username: utente.username,
        email: utente.email, 
        ruolo: utente?.ruolo || 'Ruolo',
        leghe_admin: legheAdmin
      } 
    });
    console.log('Response sent successfully');
  } catch (dbError) {
    console.error('Database error in login:', dbError);
    res.status(500).json({ error: 'Errore nel database durante il login', details: dbError.message });
  }
}

// Verifica esistenza utente per username
router.post('/check-user', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username è obbligatorio' });
    
    const utente = await getUtenteByUsername(username);
    
    if (!utente) {
      return res.json({ exists: false, message: 'Utente non trovato' });
    }
    
    res.json({ 
      exists: true, 
      user: {
        id: utente.id,
        nome: utente?.nome || 'Nome',
        cognome: utente?.cognome || '',
        username: utente.username,
        email: utente.email
      }
    });
  } catch (e) {
    console.error('Check user error:', e);
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Ricerca utenti per autocomplete (solo SuperAdmin)
router.get('/search-users', requireSuperAdmin, async (req, res) => {
  try {
    const { query, legaId } = req.query;
    if (!query || query?.length || 0 < 2) {
      return res.json([]);
    }
    
    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    // Cerca utenti per username, nome o cognome
    const searchQuery = `
      SELECT id, username, nome, cognome, email, ruolo, created_at
      FROM users 
      WHERE (username LIKE ? OR nome LIKE ? OR cognome LIKE ?)
      ORDER BY username ASC
      LIMIT 50
    `;
    
    const searchTerm = `%${query}%`;
    
    const result = await db.query(searchQuery, [searchTerm, searchTerm, searchTerm]);
    const users = result;
    
    // Se è specificata una lega, filtra gli utenti che sono già in quella lega
    if (legaId) {
      const filteredUsers = [];
      
      for (const user of users) {
        const squadraResult = await db.query(
          'SELECT id FROM squadre WHERE lega_id = ? AND proprietario_id = ?',
          [legaId, user.id]
        );
        const hasTeamInLeague = squadraResult?.length || 0 > 0;
        
        if (!hasTeamInLeague) {
          filteredUsers.push(user);
        }
      }
      
      res.json(filteredUsers);
    } else {
      res.json(users);
    }
  } catch (e) {
    console.error('Errore ricerca utenti:', e);
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Ottieni tutti gli utenti (solo SuperAdmin)
router.get('/all-users', requireSuperAdmin, async (req, res) => {
  try {
    console.log('GET /all-users - Starting request');
    console.log('User from middleware:', req.user);
    
    const db = getDb();
    if (!db) {
      console.error('GET /all-users - Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    console.log('GET /all-users - Database connection available');
    
    const query = `
      SELECT id, username, email, ruolo, created_at
      FROM users 
      ORDER BY created_at DESC
    `;
    
    console.log('GET /all-users - Executing query:', query);
    
    const result = await db.query(query);
    console.log('GET /all-users - Query result rows:', result?.length || 0);
    
    // Handle MariaDB result format
    let users = [];
    if (result && typeof result === 'object' && result.rows) {
      users = result.rows;
    } else if (Array.isArray(result)) {
      users = result;
    }
    
    res.json(users);
  } catch (e) {
    console.error('GET /all-users - Error:', e);
    console.error('GET /all-users - Error stack:', e.stack);
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Verifica se email o username sono già in uso
router.post('/check-availability', async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email && !username) {
      return res.status(400).json({ error: 'Fornisci almeno email o username' });
    }
    
    const results = {};
    
    // Verifica email se fornita
    if (email) {
      try {
        const utente = await getUtenteByEmail(email);
        results.email = { available: !utente, message: utente ? 'Email già in uso' : 'Email disponibile' };
      } catch (err) {
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
    }
    
    // Verifica username se fornito
    if (username) {
      try {
        const utenteUsername = await getUtenteByUsername(username);
        results.username = { available: !utenteUsername, message: utenteUsername ? 'Username già in uso' : 'Username disponibile' };
      } catch (err) {
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
    }
    
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Verifica se un utente è admin di una lega specifica
router.get('/is-league-admin/:legaId', async (req, res) => {
  try {
    const { legaId } = req.params;
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token non fornito' });
    
    // Verifica token e ottieni user
    const JWT_SECRET = 'topleague_secret';
    
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const userId = payload.id;
      
      const db = getDb();
      const result = await db.query(
        'SELECT id FROM leghe WHERE id = ? AND admin_id = ?',
        [legaId, userId]
      );
      
      const isAdmin = result?.length || 0 > 0;
      res.json({ isAdmin });
    } catch (e) {
      return res.status(401).json({ error: 'Token non valido' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Verifica e aggiorna i dati utente (senza richiedere password)
router.get('/verify-user', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token non fornito' });
    
    // Verifica token e ottieni user
    const JWT_SECRET = 'topleague_secret';
    
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const userId = payload.id;
      
      const db = getDb();
      if (!db) {
        return res.status(503).json({ error: 'Database non disponibile' });
      }
      
      const user = await getUtenteById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }
      
      res.json({
        user: {
          id: user.id,
          nome: user.nome,
          cognome: user.cognome,
          username: user.username,
          email: user.email,
          ruolo: user.ruolo
        }
      });
      
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ error: 'Token non valido' });
    }
    
  } catch (error) {
    console.error('Errore in verify-user:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router; 