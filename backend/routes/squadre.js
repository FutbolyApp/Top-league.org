import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSquadraById, updateSquadra, deleteSquadra } from '../models/squadra.js';
import { getLegaById } from '../models/lega.js';
import { getGiocatoriBySquadra } from '../models/giocatore.js';
import { getDb } from '../db/config.js';

const router = express.Router();
const db = getDb();

// Unisciti a una squadra specifica tramite ID
router.post('/:id/join', requireAuth, (req, res) => {
  const squadra_id = req.params.id;
  const utente_id = req.user.id;
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    updateSquadra(squadra_id, { ...squadra, proprietario_id: utente_id, is_orfana: 0 }, (err2) => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento', details: err2.message });
      res.json({ success: true, squadra_id });
    });
  });
});

// Unisciti a una squadra (join squadra in una lega)
router.post('/join', requireAuth, (req, res) => {
  const { squadra_id } = req.body;
  const utente_id = req.user.id;
  if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    updateSquadra(squadra_id, { ...squadra, proprietario_id: utente_id, is_orfana: 0 }, (err2) => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento', details: err2.message });
      res.json({ success: true, squadra_id });
    });
  });
});

// Cambio proprietario squadra (solo admin della lega)
router.post('/change-owner', requireAuth, (req, res) => {
  const { squadra_id, nuovo_utente_id } = req.body;
  const richiedente_id = req.user.id;
  if (!squadra_id || !nuovo_utente_id) return res.status(400).json({ error: 'Parametri mancanti' });
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    getLegaById(squadra.lega_id, (err2, lega) => {
      if (err2) return res.status(500).json({ error: 'Errore DB', details: err2.message });
      if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
      if (lega.admin_id !== richiedente_id) return res.status(403).json({ error: 'Solo l\'admin della lega può cambiare il proprietario' });
      updateSquadra(squadra_id, { ...squadra, proprietario_id: nuovo_utente_id, is_orfana: 0 }, (err3) => {
        if (err3) return res.status(500).json({ error: 'Errore aggiornamento', details: err3.message });
        res.json({ success: true, squadra_id, nuovo_utente_id });
      });
    });
  });
});

// Lascia una squadra (torna orfana)
router.post('/leave', requireAuth, (req, res) => {
  const { squadra_id } = req.body;
  const utente_id = req.user.id;
  if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id !== utente_id) return res.status(403).json({ error: 'Non sei il proprietario di questa squadra' });
    updateSquadra(squadra_id, { ...squadra, proprietario_id: null, is_orfana: 1 }, (err2) => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento', details: err2.message });
      res.json({ success: true, squadra_id });
    });
  });
});

// Richiedi upgrade club level
router.post('/upgrade-club-level', requireAuth, (req, res) => {
  const { squadra_id } = req.body;
  if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    // Calcolo costo upgrade (es: livello * 100FM)
    const nuovo_livello = (squadra.club_level || 1) + 1;
    if (nuovo_livello > 10) return res.status(400).json({ error: 'Club Level massimo raggiunto' });
    const costo = nuovo_livello * 100;
    if ((squadra.casse_societarie || 0) < costo) return res.status(400).json({ error: 'Fondi insufficienti' });
    updateSquadra(squadra_id, {
      ...squadra,
      club_level: nuovo_livello,
      casse_societarie: squadra.casse_societarie - costo
    }, err2 => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento', details: err2.message });
      res.json({ success: true, nuovo_livello, costo });
    });
  });
});

// Ottieni tutte le squadre dell'utente loggato
router.get('/utente', requireAuth, (req, res) => {
  const utente_id = req.user.id;
  db.all(`
    SELECT s.*, 
           l.nome as lega_nome,
           l.modalita as lega_modalita,
           l.is_pubblica as lega_is_pubblica,
           l.max_squadre as lega_numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre WHERE lega_id = l.id AND proprietario_id IS NOT NULL) as lega_squadre_assegnate
    FROM squadre s
    LEFT JOIN leghe l ON s.lega_id = l.id
    WHERE s.proprietario_id = ?
    ORDER BY s.nome
  `, [utente_id], (err, rows) => {
    if (err) {
      console.error('Errore SQL:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    res.json({ squadre: rows });
  });
});

// Ottieni dettagli squadra e giocatori
router.get('/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  getSquadraById(id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    getGiocatoriBySquadra(id, (err2, giocatori) => {
      if (err2) return res.status(500).json({ error: 'Errore DB', details: err2.message });
      res.json({ squadra: { ...squadra, giocatori } });
    });
  });
});

// Ottieni più squadre per ID (batch)
router.post('/batch', requireAuth, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Nessun ID fornito' });
  const placeholders = ids.map(() => '?').join(',');
  db.all(`SELECT * FROM squadre WHERE id IN (${placeholders})`, ids, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ squadre: rows });
  });
});

// Ottieni tutte le squadre di una lega
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  db.all(`
    SELECT s.*, 
           COUNT(g.id) as num_giocatori
    FROM squadre s
    LEFT JOIN giocatori g ON s.id = g.squadra_id
    WHERE s.lega_id = ?
    GROUP BY s.id
    ORDER BY s.nome
  `, [legaId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ squadre: rows });
  });
});

// Aggiorna squadra (solo trinità: superadmin, admin della lega, subadmin)
router.put('/:id', requireAuth, (req, res) => {
  const squadraId = req.params.id;
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;
  const updateData = req.body;

  // Verifica permessi
  const canEdit = async () => {
    // Superadmin può modificare tutto
    if (userRole === 'superadmin') return true;
    
    // Subadmin può modificare
    if (userRole === 'subadmin') return true;
    
    // Admin può modificare solo le squadre della sua lega
    if (userRole === 'admin') {
      const squadra = await new Promise((resolve, reject) => {
        getSquadraById(squadraId, (err, squadra) => {
          if (err) reject(err);
          else resolve(squadra);
        });
      });
      
      if (!squadra) return false;
      
      const lega = await new Promise((resolve, reject) => {
        getLegaById(squadra.lega_id, (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });
      
      return lega && lega.admin_id === utenteId;
    }
    
    return false;
  };

  canEdit()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Non hai i permessi per modificare questa squadra' });
      }
      
      // Aggiorna la squadra
      updateSquadra(squadraId, updateData, (err) => {
        if (err) return res.status(500).json({ error: 'Errore aggiornamento squadra', details: err.message });
        res.json({ success: true, message: 'Squadra aggiornata con successo' });
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore verifica permessi', details: err.message });
    });
});

// Aggiungi la nuova route per la cancellazione di una squadra
router.delete('/:id', requireAuth, (req, res) => {
  const squadraId = req.params.id;
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;

  // Verifica permessi
  const canDelete = async () => {
    // Superadmin può cancellare tutto
    if (userRole === 'superadmin') return true;
    
    // Subadmin può cancellare
    if (userRole === 'subadmin') return true;
    
    // Admin può cancellare solo le squadre della sua lega
    if (userRole === 'admin') {
      const squadra = await new Promise((resolve, reject) => {
        getSquadraById(squadraId, (err, squadra) => {
          if (err) reject(err);
          else resolve(squadra);
        });
      });
      
      if (!squadra) return false;
      
      const lega = await new Promise((resolve, reject) => {
        getLegaById(squadra.lega_id, (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });
      
      return lega && lega.admin_id === utenteId;
    }
    
    return false;
  };

  canDelete()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Non hai i permessi per cancellare questa squadra' });
      }
      
      // Cancella la squadra
      deleteSquadra(squadraId, (err) => {
        if (err) return res.status(500).json({ error: 'Errore cancellazione squadra', details: err.message });
        res.json({ success: true, message: 'Squadra cancellata con successo' });
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore verifica permessi', details: err.message });
    });
});

// Assegna squadra direttamente (solo per admin della lega)
router.post('/:id/assign', requireAuth, (req, res) => {
  const squadra_id = req.params.id;
  const utente_id = req.user.id;
  
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    
    // Verifica che l'utente sia admin della lega
    getLegaById(squadra.lega_id, (err2, lega) => {
      if (err2) return res.status(500).json({ error: 'Errore DB', details: err2.message });
      if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
      if (lega.admin_id !== utente_id) return res.status(403).json({ error: 'Solo l\'admin della lega può assegnare squadre direttamente' });
      
      updateSquadra(squadra_id, { ...squadra, proprietario_id: utente_id, is_orfana: 0 }, (err3) => {
        if (err3) return res.status(500).json({ error: 'Errore aggiornamento', details: err3.message });
        res.json({ success: true, squadra_id, message: 'Squadra assegnata con successo' });
      });
    });
  });
});

export default router; 