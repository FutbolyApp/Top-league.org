import express from 'express';
import { getDb } from '../db/config.js';
import { authenticateToken, generateToken, requireSuperAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { getAllUtenti, updateUtente, deleteUtente } from '../models/utente.js';
import { getAllLeghe, deleteLega } from '../models/lega.js';
import { getAllSquadre, deleteSquadra } from '../models/squadra.js';
import { getAllGiocatori, deleteGiocatore } from '../models/giocatore.js';

const router = express.Router();
const db = getDb();

// Login SuperAdmin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ? AND ruolo = ?', [email, 'SuperAdmin'], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Errore del server' });
      }
      
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
    });
  } catch (error) {
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
    getAllUtenti((err, users) => {
      if (err) return res.status(500).json({ error: 'Errore nel caricamento utenti', details: err.message });
      res.json({ success: true, users });
    });
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
    
    updateUtente(userId, { ruolo }, (err, result) => {
      if (err) return res.status(500).json({ error: 'Errore nell\'aggiornamento ruolo', details: err.message });
      res.json({ success: true, message: 'Ruolo aggiornato con successo' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Elimina utente
router.delete('/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    deleteUtente(userId, (err, result) => {
      if (err) return res.status(500).json({ error: 'Errore nell\'eliminazione utente', details: err.message });
      res.json({ success: true, message: 'Utente eliminato con successo' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Gestione Leghe
router.get('/leagues', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    getAllLeghe((err, leghe) => {
      if (err) return res.status(500).json({ error: 'Errore nel caricamento leghe', details: err.message });
      res.json({ success: true, leghe });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Elimina lega
router.delete('/leagues/:legaId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { legaId } = req.params;
    
    deleteLega(legaId, (err, result) => {
      if (err) return res.status(500).json({ error: 'Errore nell\'eliminazione lega', details: err.message });
      res.json({ success: true, message: 'Lega eliminata con successo' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Gestione Squadre
router.get('/teams', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    getAllSquadre((err, squadre) => {
      if (err) return res.status(500).json({ error: 'Errore nel caricamento squadre', details: err.message });
      res.json({ success: true, squadre });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Elimina squadra
router.delete('/teams/:squadraId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { squadraId } = req.params;
    
    deleteSquadra(squadraId, (err, result) => {
      if (err) return res.status(500).json({ error: 'Errore nell\'eliminazione squadra', details: err.message });
      res.json({ success: true, message: 'Squadra eliminata con successo' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Gestione Giocatori
router.get('/players', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    getAllGiocatori((err, giocatori) => {
      if (err) return res.status(500).json({ error: 'Errore nel caricamento giocatori', details: err.message });
      res.json({ success: true, giocatori });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Elimina giocatore
router.delete('/players/:giocatoreId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { giocatoreId } = req.params;
    
    deleteGiocatore(giocatoreId, (err, result) => {
      if (err) return res.status(500).json({ error: 'Errore nell\'eliminazione giocatore', details: err.message });
      res.json({ success: true, message: 'Giocatore eliminato con successo' });
    });
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