import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getLogSquadra, getLogSquadraFiltrati, createLogSquadra, CATEGORIE_EVENTI, TIPI_EVENTI } from '../models/logSquadra.js';
import { getDb } from '../db/postgres.js';

const router = express.Router();

// Ottieni log di una squadra
router.get('/:squadraId', requireAuth, async (req, res) => {
  try {
    const { squadraId } = req.params;
    const { categoria, tipo_evento, data_inizio, data_fine, limit } = req.query;
    const db = getDb();
    
    // Verifica che l'utente sia proprietario della squadra
    const squadraResult = await db.query('SELECT proprietario_id FROM squadre WHERE id = $1', [squadraId]);
    
    if (squadraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    const squadra = squadraResult.rows[0];
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
    
    const logs = await getLogSquadraFiltrati(squadraId, filtri);
    res.json({ logs });
  } catch (error) {
    console.error('Errore recupero log squadra:', error);
    res.status(500).json({ error: 'Errore recupero log' });
  }
});

// Ottieni categorie e tipi di eventi disponibili
router.get('/categorie/eventi', requireAuth, (req, res) => {
  res.json({
    categorie: CATEGORIE_EVENTI,
    tipi: TIPI_EVENTI
  });
});

// Crea un nuovo log (per uso interno)
router.post('/', requireAuth, async (req, res) => {
  try {
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
    
    const db = getDb();
    
    // Verifica che l'utente sia proprietario della squadra
    const squadraResult = await db.query('SELECT proprietario_id FROM squadre WHERE id = $1', [squadra_id]);
    
    if (squadraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    const squadra = squadraResult.rows[0];
    if (squadra.proprietario_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    const logId = await createLogSquadra({
      squadra_id,
      lega_id,
      tipo_evento,
      categoria,
      titolo,
      descrizione,
      dati_aggiuntivi,
      utente_id: req.user.id,
      giocatore_id
    });
    
    res.json({ success: true, log_id: logId });
  } catch (error) {
    console.error('Errore creazione log squadra:', error);
    res.status(500).json({ error: 'Errore creazione log' });
  }
});

export default router; 