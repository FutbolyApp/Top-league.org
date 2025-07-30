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
    
    // Get database connection
    const db = getDb();
    if (!db) {
      console.error('Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    let utente = null;
    
    try {
      // Prima prova a cercare per email
      utente = await getUtenteByEmail(email);
      
      // Se non trova per email, prova per username
      if (!utente) {
        console.log('User not found by email, trying username...');
        utente = await getUtenteByUsername(email);
      }
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return res.status(500).json({ error: 'Errore del database durante il login' });
    }
    
    if (!utente) {
      console.log('User not found');
      return res.status(400).json({ error: 'Utente non trovato. Verifica email/username o registrati.' });
    }
    
    // Verifica password
    if (!(await bcrypt.compare(password, utente.password_hash))) {
      console.log('Password incorrect');
      return res.status(400).json({ error: 'Password non corretta. Riprova.' });
    }
    
    console.log('User authenticated:', utente.username, 'ID:', utente.id);
    
    // Generate token
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
    } catch (error) {
      console.log('No admin leghe found or error:', error.message);
    }
    
    // Process login success
    await processLoginSuccess(utente, res, req, legheAdmin, token);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Funzione helper per processare il login di successo
async function processLoginSuccess(utente, res, req, legheAdmin, token) {
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
    console.log('User from middleware:', req.user);
    
    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    console.log('GET /all-users - Querying database');
    const users = await db.query('SELECT id, username, email, ruolo, created_at FROM users ORDER BY created_at DESC');
    
    // Handle MariaDB result format
    let userList = [];
    if (users && Array.isArray(users)) {
      userList = users;
    } else if (users && users.rows) {
      userList = users.rows;
    }
    
    console.log('GET /all-users - Found users:', userList.length);
    return res.json(userList);
    
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
    const JWT_SECRET = process.env.JWT_SECRET || 'topleague_secret';
    
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