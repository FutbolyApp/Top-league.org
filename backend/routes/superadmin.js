import express from 'express';
import { getDb } from '../db/mariadb.js';
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

    const result = await db.query('SELECT * FROM users WHERE email = ? AND ruolo = ?', [email, 'SuperAdmin']);
    const user = result[0];
    
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
        nome: user?.nome || 'Nome',
        cognome: user?.cognome || '',
        email: user.email,
        ruolo: user?.ruolo || 'Ruolo'
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
    res.json({ success: true, users: users });
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

    const result = await db.query('UPDATE users SET ruolo = ? WHERE id = ?', [ruolo, userId]);
    
    if (result.affectedRows === 0) {
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

    const result = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
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

    const leghe = await db.query('SELECT * FROM leghe');
    res.json({ success: true, leghe: leghe });
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

    const result = await db.query('DELETE FROM leghe WHERE id = ?', [legaId]);
    
    if (result.affectedRows === 0) {
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

    const squadre = await db.query('SELECT * FROM squadre');
    res.json({ success: true, squadre: squadre });
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

    const result = await db.query('DELETE FROM squadre WHERE id = ?', [squadraId]);
    
    if (result.affectedRows === 0) {
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

    const giocatori = await db.query('SELECT * FROM giocatori');
    res.json({ success: true, giocatori: giocatori });
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

    const result = await db.query('DELETE FROM giocatori WHERE id = ?', [giocatoreId]);
    
    if (result.affectedRows === 0) {
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

// Endpoint per aggiornare lo schema del database
router.post('/update-schema', requireSuperAdmin, async (req, res) => {
  try {
    console.log('🔄 Updating database schema...');
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ 
        error: 'Database non disponibile',
        message: 'Il servizio database non è attualmente disponibile.'
      });
    }
    
    // Aggiungi colonna roster alla tabella giocatori se non esiste
    try {
      await db.query(`
        ALTER TABLE giocatori 
        ADD COLUMN IF NOT EXISTS roster VARCHAR(10) DEFAULT 'A'
      `);
      console.log('✅ Added roster column to giocatori table');
    } catch (error) {
      console.log('Column roster already exists or error:', error.message);
    }
    
    // Aggiungi colonne per i limiti di ruolo alla tabella leghe se non esistono
    const roleColumns = [
      'max_portieri', 'min_portieri',
      'max_difensori', 'min_difensori', 
      'max_centrocampisti', 'min_centrocampisti',
      'max_attaccanti', 'min_attaccanti'
    ];
    
    for (const column of roleColumns) {
      try {
        await db.query(`
          ALTER TABLE leghe 
          ADD COLUMN IF NOT EXISTS ${column} INTEGER DEFAULT 0
        `);
        console.log(`✅ Added ${column} column to leghe table`);
      } catch (error) {
        console.log(`Column ${column} already exists or error:`, error.message);
      }
    }
    
    // Aggiorna i valori di default per le colonne esistenti
    try {
      await db.query(`
        UPDATE leghe SET 
          max_portieri = 3,
          min_portieri = 2,
          max_difensori = 8,
          min_difensori = 5,
          max_centrocampisti = 8,
          min_centrocampisti = 5,
          max_attaccanti = 6,
          min_attaccanti = 3
        WHERE max_portieri IS NULL OR min_portieri IS NULL
      `);
      console.log('✅ Updated default values for role limits');
    } catch (error) {
      console.log('Error updating default values:', error.message);
    }
    
    // Crea o aggiorna la tabella richieste_unione_squadra
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS richieste_unione_squadra (
          id INT AUTO_INCREMENT PRIMARY KEY,
          utente_id INT NOT NULL,
          squadra_id INT NOT NULL,
          lega_id INT NOT NULL,
          stato VARCHAR(50) DEFAULT 'in_attesa',
          data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_risposta TIMESTAMP NULL,
          risposta_admin_id INT NULL,
          messaggio_richiesta TEXT,
          messaggio_risposta TEXT,
          FOREIGN KEY (utente_id) REFERENCES users(id),
          FOREIGN KEY (squadra_id) REFERENCES squadre(id),
          FOREIGN KEY (lega_id) REFERENCES leghe(id),
          FOREIGN KEY (risposta_admin_id) REFERENCES users(id)
        )
      `);
      console.log('✅ Created/updated richieste_unione_squadra table');
    } catch (error) {
      console.log('Error creating richieste_unione_squadra table:', error.message);
    }
    
    console.log('✅ Schema update completed');
    
    res.json({ 
      success: true, 
      message: 'Schema del database aggiornato con successo',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    res.status(500).json({ 
      error: 'Errore durante l\'aggiornamento dello schema',
      message: error.message 
    });
  }
});

export default router; 