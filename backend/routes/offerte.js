import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createOfferta, getOfferteByLega, updateOfferta } from '../models/offerta.js';
import { getDb } from '../db/config.js';

const router = express.Router();
const db = getDb();

// Crea una nuova offerta (trasferimento/prestito)
router.post('/create', requireAuth, (req, res) => {
  const { lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, tipo, valore } = req.body;
  if (!lega_id || !squadra_mittente_id || !squadra_destinatario_id || !giocatore_id || !tipo || !valore) {
    return res.status(400).json({ error: 'Parametri mancanti' });
  }
  createOfferta({
    lega_id,
    squadra_mittente_id,
    squadra_destinatario_id,
    giocatore_id,
    tipo,
    valore,
    stato: 'inviata'
  }, (err, offertaId) => {
    if (err) return res.status(500).json({ error: 'Errore creazione offerta', details: err.message });
    res.json({ success: true, offertaId });
  });
});

// Ottieni tutte le offerte di una lega
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  getOfferteByLega(legaId, (err, offerte) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ offerte });
  });
});

// Ottieni movimenti di mercato per una lega (offerte completate)
router.get('/movimenti/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  
  // Query per ottenere le offerte completate (accettate) con dettagli delle squadre e giocatori
  const query = `
    SELECT 
      o.id,
      o.tipo,
      o.valore,
      o.data_invio as data,
      g.nome as giocatore_nome,
      g.cognome as giocatore_cognome,
      sm.nome as squadra_mittente,
      sd.nome as squadra_destinataria,
      o.lega_id
    FROM offerte o
    JOIN giocatori g ON o.giocatore_id = g.id
    JOIN squadre sm ON o.squadra_mittente_id = sm.id
    JOIN squadre sd ON o.squadra_destinatario_id = sd.id
    WHERE o.lega_id = ? AND o.stato = 'accettata'
    ORDER BY o.data_invio DESC
    LIMIT 20
  `;
  
  db.all(query, [legaId], (err, rows) => {
    if (err) {
      console.error('Errore query movimenti:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    // Se non ci sono offerte, restituisci array vuoto
    if (!rows || rows.length === 0) {
      return res.json({ movimenti: [] });
    }
    
    // Formatta i dati per il frontend
    const movimenti = rows.map(row => ({
      id: row.id,
      tipo: row.tipo,
      valore: row.valore,
      data: row.data,
      giocatore_nome: `${row.giocatore_nome} ${row.giocatore_cognome}`,
      squadra_mittente: row.squadra_mittente,
      squadra_destinataria: row.squadra_destinataria,
      lega_id: row.lega_id
    }));
    
    res.json({ movimenti });
  });
});

export default router; 