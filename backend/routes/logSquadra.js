import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getLogSquadra, getLogSquadraFiltrati, createLogSquadra, CATEGORIE_EVENTI, TIPI_EVENTI } from '../models/logSquadra.js';
import { getDb } from '../db/postgres.js';

const router = express.Router();
const db = getDb();

// Ottieni log di una squadra
router.get('/:squadraId', requireAuth, (req, res) => {
  const { squadraId } = req.params;
  const { categoria, tipo_evento, data_inizio, data_fine, limit } = req.query;
  
  // Verifica che l'utente sia proprietario della squadra
  db.get('SELECT proprietario_id FROM squadre WHERE id = ?', [squadraId], (err, squadra) => {
    if (err) {
      return res.status(500).json({ error: 'Errore DB' });
    }
    
    if (!squadra) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    if (squadra.proprietario_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    const filtri = {
      categoria,
      tipo_evento,
      data_inizio,
      data_fine,
      limit: limit ? parseInt(limit) : null
    };
    
    getLogSquadraFiltrati(squadraId, filtri, (err, logs) => {
      if (err) {
        return res.status(500).json({ error: 'Errore recupero log' });
      }
      
      res.json({ logs });
    });
  });
});

// Ottieni categorie e tipi di eventi disponibili
router.get('/categorie/eventi', requireAuth, (req, res) => {
  res.json({
    categorie: CATEGORIE_EVENTI,
    tipi: TIPI_EVENTI
  });
});

// Crea un nuovo log (per uso interno)
router.post('/', requireAuth, (req, res) => {
  const {
    squadra_id,
    lega_id,
    tipo_evento,
    categoria,
    titolo,
    descrizione,
    dati_aggiuntivi,
    giocatore_id
  } = req.body;
  
  if (!squadra_id || !lega_id || !tipo_evento || !categoria || !titolo) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  
  // Verifica che l'utente sia proprietario della squadra
  db.get('SELECT proprietario_id FROM squadre WHERE id = ?', [squadra_id], (err, squadra) => {
    if (err) {
      return res.status(500).json({ error: 'Errore DB' });
    }
    
    if (!squadra) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    if (squadra.proprietario_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    createLogSquadra({
      squadra_id,
      lega_id,
      tipo_evento,
      categoria,
      titolo,
      descrizione,
      dati_aggiuntivi,
      utente_id: req.user.id,
      giocatore_id
    }, (err, logId) => {
      if (err) {
        return res.status(500).json({ error: 'Errore creazione log' });
      }
      
      res.json({ success: true, log_id: logId });
    });
  });
});

export default router; 