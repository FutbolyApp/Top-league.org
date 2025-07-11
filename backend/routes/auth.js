import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/postgres.js';
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
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email/Username e password sono obbligatorie' });
    
    console.log('Login attempt for email/username:', email);
    
    // Prima prova a cercare per email
    let utente = await getUtenteByEmail(email);
    
    // Se non trova per email, prova per username
    if (!utente) {
      console.log('User not found by email, trying username...');
      utente = await getUtenteByUsername(email);
    }
    
    if (!utente) {
      console.log('User not found by username either');
      return res.status(400).json({ error: 'Utente non trovato. Verifica email/username o registrati.' });
    }
    
    // Verifica password
    if (!bcrypt.compareSync(password, utente.password_hash)) {
      console.log('Password incorrect');
      return res.status(400).json({ error: 'Password non corretta. Riprova.' });
    }
    
    console.log('User authenticated:', utente.username, 'ID:', utente.id);
    
    // Ottieni le leghe di cui l'utente è admin
    const db = getDb();
    const legheResult = await db.query('SELECT id, nome FROM leghe WHERE admin_id = $1', [utente.id]);
    const legheAdmin = legheResult.rows;
    
    const token = generateToken(utente);
    console.log('Login successful for:', utente.username, 'Leghe admin:', legheAdmin.length);
    
    res.json({ 
      token, 
      user: { 
        id: utente.id, 
        nome: utente.nome, 
        cognome: utente.cognome, 
        username: utente.username,
        email: utente.email, 
        ruolo: utente.ruolo,
        leghe_admin: legheAdmin
      } 
    });
    
  } catch (e) {
    console.error('Unexpected error in login:', e);
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Funzione helper per processare il login di successo
async function processLoginSuccess(utente, res, req) {
  try {
    console.log('processLoginSuccess started for user:', utente.username);
    
    // Ottieni le leghe di cui l'utente è admin
    const db = req.app.locals.db;
    if (!db) {
      console.error('Database not available in app.locals');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    console.log('Querying leghe admin for user ID:', utente.id);
    const legheAdmin = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, nome FROM leghe WHERE admin_id = ?',
        [utente.id],
        (err, rows) => {
          if (err) {
            console.error('Error querying leghe admin:', err);
            reject(err);
          } else {
            console.log('Found leghe admin for user:', rows?.length || 0);
            resolve(rows || []);
          }
        }
      );
    });
    
    console.log('Generating token for user:', utente.username);
    const token = generateToken(utente);
    console.log('Login successful for:', utente.username, 'Leghe admin:', legheAdmin.length);
    
    console.log('Sending response to client');
    res.json({ 
      token, 
      user: { 
        id: utente.id, 
        nome: utente.nome, 
        cognome: utente.cognome, 
        username: utente.username,
        email: utente.email, 
        ruolo: utente.ruolo,
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
        nome: utente.nome,
        cognome: utente.cognome,
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
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const db = req.app.locals.db;
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
    
    db.all(searchQuery, [searchTerm, searchTerm, searchTerm], async (err, users) => {
      if (err) {
        console.error('Errore ricerca utenti:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      // Se è specificata una lega, filtra gli utenti che sono già in quella lega
      if (legaId) {
        const filteredUsers = [];
        
        for (const user of users) {
          const hasTeamInLeague = await new Promise((resolve) => {
            db.get(
              'SELECT id FROM squadre WHERE lega_id = ? AND proprietario_id = ?',
              [legaId, user.id],
              (err, squadra) => {
                resolve(!!squadra); // true se l'utente ha già una squadra
              }
            );
          });
          
          if (!hasTeamInLeague) {
            filteredUsers.push(user);
          }
        }
        
        res.json(filteredUsers);
      } else {
        res.json(users);
      }
    });
  } catch (e) {
    console.error('Errore ricerca utenti:', e);
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

// Ottieni tutti gli utenti (solo SuperAdmin)
router.get('/all-users', requireSuperAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    const query = `
      SELECT id, username, email, ruolo, created_at
      FROM users 
      ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, users) => {
      if (err) {
        console.error('Errore caricamento utenti:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      res.json(users);
    });
  } catch (e) {
    console.error('Errore caricamento utenti:', e);
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
      getUtenteByEmail(email, (err, utente) => {
        if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
        results.email = { available: !utente, message: utente ? 'Email già in uso' : 'Email disponibile' };
        
        // Se abbiamo anche username da verificare
        if (username) {
          getUtenteByUsername(username, (err, utenteUsername) => {
            if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
            results.username = { available: !utenteUsername, message: utenteUsername ? 'Username già in uso' : 'Username disponibile' };
            res.json(results);
          });
        } else {
          res.json(results);
        }
      });
    } else {
      // Verifica solo username
      getUtenteByUsername(username, (err, utente) => {
        if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
        results.username = { available: !utente, message: utente ? 'Username già in uso' : 'Username disponibile' };
        res.json(results);
      });
    }
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
      
      const db = req.app.locals.db;
      db.get(
        'SELECT id FROM leghe WHERE id = ? AND admin_id = ?',
        [legaId, userId],
        (err, row) => {
          if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
          
          const isAdmin = !!row;
          res.json({ isAdmin });
        }
      );
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
      
      // Ottieni i dati aggiornati dell'utente
      getUtenteById(userId, async (err, utente) => {
        if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
        if (!utente) return res.status(404).json({ error: 'Utente non trovato' });
        
        // Ottieni le leghe di cui l'utente è admin
        const db = req.app.locals.db;
        if (!db) {
          console.error('Database not available in app.locals');
          return res.status(500).json({ error: 'Database non disponibile' });
        }
        
        const legheAdmin = await new Promise((resolve, reject) => {
          db.all(
            'SELECT id, nome FROM leghe WHERE admin_id = ?',
            [utente.id],
            (err, rows) => {
              if (err) {
                console.error('Error querying leghe admin:', err);
                reject(err);
              } else {
                console.log('Found leghe admin for user:', rows?.length || 0);
                resolve(rows || []);
              }
            }
          );
        });
        
        res.json({ 
          user: { 
            id: utente.id, 
            nome: utente.nome, 
            cognome: utente.cognome, 
            username: utente.username,
            email: utente.email, 
            ruolo: utente.ruolo,
            leghe_admin: legheAdmin
          } 
        });
      });
    } catch (e) {
      return res.status(401).json({ error: 'Token non valido' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Errore interno del server', details: e.message });
  }
});

export default router; 