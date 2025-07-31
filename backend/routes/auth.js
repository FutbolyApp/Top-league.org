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
    console.log('🔍 AUTH: Register request received:', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'no body',
      contentType: req.headers['content-type']
    });
    
    const { nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password, ruolo } = req.body;
    
    // FIXED: Enhanced validation
    if (!nome || !cognome || !username || !email || !password) {
      console.log('🔍 AUTH: Missing required fields for registration');
      return res.status(400).json({ 
        error: 'Tutti i campi obbligatori devono essere compilati (nome, cognome, username, email, password)',
        details: 'Dati mancanti nella richiesta'
      });
    }
    
    // Verifica se email già esiste
    const existingUser = await getUtenteByEmail(email);
    if (existingUser) {
      console.log('🔍 AUTH: Email already exists:', email);
      return res.status(400).json({ error: 'Email già registrata. Usa un\'altra email o fai login.' });
    }
    
    // Verifica se username già esiste
    const existingUsername = await getUtenteByUsername(username);
    if (existingUsername) {
      console.log('🔍 AUTH: Username already exists:', username);
      return res.status(400).json({ error: 'Username già in uso. Scegline un altro.' });
    }
    
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
    
    console.log('🔍 AUTH: User registered successfully:', { userId, username, email });
    res.json({ success: true, userId });
  } catch (e) {
    console.error('🚨 AUTH: Registration error:', e);
    res.status(500).json({ 
      error: 'Errore interno del server', 
      details: e.message 
    });
  }
});

// Login utente - versione migliorata
router.post('/login', async (req, res) => {
  try {
    console.log('🔍 AUTH: Login request received:', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'no body',
      contentType: req.headers['content-type']
    });
    
    const { email, password } = req.body;
    console.log('🔍 AUTH: Extracted credentials:', { email, hasPassword: !!password });
    
    // FIXED: Enhanced validation
    if (!email || !password) {
      console.log('🔍 AUTH: Missing credentials');
      return res.status(400).json({ 
        error: 'Email/Username e password sono obbligatorie',
        details: 'Credenziali mancanti'
      });
    }
    
    console.log('🔍 AUTH: Login attempt for email/username:', email);
    
    // Get database connection
    const db = getDb();
    if (!db) {
      console.error('🚨 AUTH: Database not available');
      return res.status(500).json({ 
        error: 'Database non disponibile',
        details: 'Errore di connessione al database'
      });
    }
    
    let utente = null;
    
    try {
      // Prima prova a cercare per email
      utente = await getUtenteByEmail(email);
      
      // Se non trova per email, prova per username
      if (!utente) {
        console.log('🔍 AUTH: User not found by email, trying username...');
        utente = await getUtenteByUsername(email);
      }
    } catch (dbError) {
      console.error('🚨 AUTH: Database error during login:', dbError);
      return res.status(500).json({ 
        error: 'Errore del database durante il login',
        details: dbError.message
      });
    }
    
    if (!utente) {
      console.log('🔍 AUTH: User not found');
      return res.status(400).json({ 
        error: 'Utente non trovato. Verifica email/username o registrati.',
        details: 'Credenziali non valide'
      });
    }
    
    // Verifica password
    if (!(await bcrypt.compare(password, utente.password_hash))) {
      console.log('🔍 AUTH: Password incorrect');
      return res.status(400).json({ 
        error: 'Password non corretta. Riprova.',
        details: 'Credenziali non valide'
      });
    }
    
    console.log('🔍 AUTH: User authenticated:', utente.username, 'ID:', utente.id);
    
    // FIXED: Generate token and get admin leghe in one place
    const token = generateToken(utente);
    
    // Get admin leghe
    let legheAdmin = [];
    try {
      const legheResult = await db.query('SELECT id, nome FROM leghe WHERE admin_id = ?', [utente.id]);
      // Handle MariaDB result format
      if (legheResult && Array.isArray(legheResult)) {
        legheAdmin = legheResult;
      } else if (legheResult && legheResult.rows) {
        legheAdmin = legheResult.rows;
      }
      console.log('🔍 AUTH: Found admin leghe:', legheAdmin.length);
    } catch (error) {
      console.log('🔍 AUTH: No admin leghe found or error:', error.message);
    }
    
    // FIXED: Send response directly instead of calling separate function
    console.log('🔍 AUTH: Sending login response');
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
    console.log('🔍 AUTH: Login response sent successfully');
    
  } catch (error) {
    console.error('🚨 AUTH: Login error:', error);
    res.status(500).json({ 
      error: 'Errore interno del server', 
      details: error.message 
    });
  }
});

// FIXED: Removed duplicate processLoginSuccess function

// Verifica esistenza utente per username
router.post('/check-user', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username è obbligatorio' });
    }
    
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
    console.error('🚨 AUTH: Check user error:', e);
    res.status(500).json({ 
      error: 'Errore interno del server', 
      details: e.message 
    });
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
    console.error('🚨 AUTH: Search users error:', e);
    res.status(500).json({ 
      error: 'Errore interno del server', 
      details: e.message 
    });
  }
});

// Ottieni tutti gli utenti (solo SuperAdmin)
router.get('/all-users', requireSuperAdmin, async (req, res) => {
  try {
    console.log('🔍 AUTH: User from middleware:', req.user);
    
    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    console.log('🔍 AUTH: GET /all-users - Querying database');
    const users = await db.query('SELECT id, username, email, ruolo, created_at FROM users ORDER BY created_at DESC');
    
    // Handle MariaDB result format
    let userList = [];
    if (users && Array.isArray(users)) {
      userList = users;
    } else if (users && users.rows) {
      userList = users.rows;
    }
    
    console.log('🔍 AUTH: GET /all-users - Found users:', userList.length);
    return res.json(userList);
    
  } catch (e) {
    console.error('🚨 AUTH: GET /all-users - Error:', e);
    console.error('🚨 AUTH: GET /all-users - Error stack:', e.stack);
    res.status(500).json({ 
      error: 'Errore interno del server', 
      details: e.message 
    });
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
    console.error('🚨 AUTH: Check availability error:', e);
    res.status(500).json({ 
      error: 'Errore interno del server', 
      details: e.message 
    });
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
    const JWT_SECRET = process.env.JWT_SECRET || 'topleague_secret';
    
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
    console.error('🚨 AUTH: Is league admin error:', e);
    res.status(500).json({ 
      error: 'Errore interno del server', 
      details: e.message 
    });
  }
});

// Enhanced verify user endpoint with comprehensive logging and error handling
router.get('/verify-user', async (req, res) => {
  try {
    console.log('🔍 AUTH: Verify user request received:', {
      hasHeaders: !!req.headers,
      hasAuthHeader: !!req.headers['authorization'],
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']
    });
    
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      console.log('🔍 AUTH: Missing authorization header');
      return res.status(401).json({ error: 'Token mancante' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('🔍 AUTH: Token not provided in authorization header');
      return res.status(401).json({ error: 'Token non fornito' });
    }
    
    console.log('🔍 AUTH: Token extracted:', token.substring(0, 20) + '...');
    
    // Verifica token e ottieni user
    const JWT_SECRET = process.env.JWT_SECRET || 'topleague_secret';
    
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const userId = payload.id;
      
      console.log('🔍 AUTH: JWT verified successfully, userId:', userId);
      
      const db = getDb();
      if (!db) {
        console.error('🚨 AUTH: Database not available');
        return res.status(503).json({ error: 'Database non disponibile' });
      }
      
      const user = await getUtenteById(userId);
      if (!user) {
        console.log('🔍 AUTH: User not found for ID:', userId);
        return res.status(404).json({ error: 'Utente non trovato' });
      }
      
      console.log('🔍 AUTH: User found:', {
        id: user.id,
        username: user.username,
        email: user.email,
        ruolo: user.ruolo
      });
      
      const userResponse = {
        user: {
          id: user.id,
          nome: user.nome,
          cognome: user.cognome,
          username: user.username,
          email: user.email,
          ruolo: user.ruolo
        }
      };
      
      console.log('🔍 AUTH: Sending user response:', userResponse);
      res.json(userResponse);
      
    } catch (jwtError) {
      console.error('🚨 AUTH: JWT verification error:', {
        error: jwtError.message,
        name: jwtError.name,
        token: token.substring(0, 20) + '...'
      });
      return res.status(401).json({ error: 'Token non valido' });
    }
    
  } catch (error) {
    console.error('🚨 AUTH: Verify user error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message
    });
  }
});

export default router; 