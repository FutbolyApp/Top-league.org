import express from 'express';
import { getDb } from '../db/postgres.js';
import { authenticateToken, generateToken, requireSuperAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { getAllUtenti, updateUtente, updateUtenteRole, deleteUtente } from '../models/utente.js';
import { getAllLeghe, deleteLega } from '../models/lega.js';
import { getAllSquadre, deleteSquadra } from '../models/squadra.js';
import { getAllGiocatori, deleteGiocatore } from '../models/giocatore.js';

const router = express.Router();

// Middleware per gestire CORS preflight per tutte le route
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Login SuperAdmin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1 AND ruolo = $2', [email, 'SuperAdmin']);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }
    
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    console.error('Errore in login SuperAdmin:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Dashboard SuperAdmin
router.get('/dashboard', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    // Statistiche generali
    const stats = {
      totalUsers: 0,
      totalLeagues: 0,
      totalTeams: 0,
      totalPlayers: 0,
      activeUsers: 0,
      recentActivity: []
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento dashboard', details: error.message });
  }
});

// Gestione Utenti
router.get('/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const users = await db.query('SELECT * FROM users');
    res.json({ success: true, users: users.rows });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Aggiorna ruolo utente
router.put('/users/:userId/role', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { ruolo } = req.body;
    
    if (!ruolo || !['Utente', 'Admin', 'SuperAdmin'].includes(ruolo)) {
      return res.status(400).json({ error: 'Ruolo non valido' });
    }
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const result = await db.query('UPDATE users SET ruolo = $1 WHERE id = $2', [ruolo, userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json({ success: true, message: 'Ruolo aggiornato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Elimina utente
router.delete('/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    res.json({ success: true, message: 'Utente eliminato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Gestione Leghe
router.get('/leagues', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const leghe = await db.query('SELECT * FROM lega');
    res.json({ success: true, leghe: leghe.rows });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Elimina lega
router.delete('/leagues/:legaId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { legaId } = req.params;
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const result = await db.query('DELETE FROM lega WHERE id = $1', [legaId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }

    res.json({ success: true, message: 'Lega eliminata con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Gestione Squadre
router.get('/teams', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const squadre = await db.query('SELECT * FROM squadra');
    res.json({ success: true, squadre: squadre.rows });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Elimina squadra
router.delete('/teams/:squadraId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { squadraId } = req.params;
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const result = await db.query('DELETE FROM squadra WHERE id = $1', [squadraId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }

    res.json({ success: true, message: 'Squadra eliminata con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Gestione Giocatori
router.get('/players', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const giocatori = await db.query('SELECT * FROM giocatore');
    res.json({ success: true, giocatori: giocatori.rows });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Elimina giocatore
router.delete('/players/:giocatoreId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { giocatoreId } = req.params;
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ message: 'Database non disponibile' });
    }

    const result = await db.query('DELETE FROM giocatore WHERE id = $1', [giocatoreId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    res.json({ success: true, message: 'Giocatore eliminato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Backup del database
router.post('/backup', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    // Implementa il backup del database
    res.json({ success: true, message: 'Backup creato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione backup', details: error.message });
  }
});

// Restore del database
router.post('/restore', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    // Implementa il restore del database
    res.json({ success: true, message: 'Restore completato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel restore', details: error.message });
  }
});

export default router; 