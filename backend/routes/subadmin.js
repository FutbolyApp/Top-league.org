import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createSubAdmin, updateSubAdmin, getSubAdminByLega } from '../models/subadmin.js';
import { getLegaById } from '../models/lega.js';

const router = express.Router();

// Aggiungi un subadmin (solo admin della lega)
router.post('/add', requireAuth, (req, res) => {
  const { lega_id, utente_id } = req.body;
  const richiedente_id = req.user.id;
  if (!lega_id || !utente_id) return res.status(400).json({ error: 'Parametri mancanti' });
  getLegaById(lega_id, (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    if (lega.admin_id !== richiedente_id) return res.status(403).json({ error: 'Solo l\'admin della lega può aggiungere subadmin' });
    createSubAdmin({ lega_id, utente_id, attivo: 1 }, (err2, subadminId) => {
      if (err2) return res.status(500).json({ error: 'Errore creazione subadmin', details: err2.message });
      res.json({ success: true, subadminId });
    });
  });
});

// Rimuovi un subadmin (solo admin della lega)
router.post('/remove', requireAuth, (req, res) => {
  const { lega_id, utente_id } = req.body;
  const richiedente_id = req.user.id;
  if (!lega_id || !utente_id) return res.status(400).json({ error: 'Parametri mancanti' });
  getLegaById(lega_id, (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    if (lega.admin_id !== richiedente_id) return res.status(403).json({ error: 'Solo l\'admin della lega può rimuovere subadmin' });
    updateSubAdmin(utente_id, { lega_id, utente_id, attivo: 0 }, (err2) => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento subadmin', details: err2.message });
      res.json({ success: true, utente_id });
    });
  });
});

// Ottieni tutti i subadmin di una lega
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  getSubAdminByLega(legaId, (err, subadmins) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ subadmins });
  });
});

export default router; 