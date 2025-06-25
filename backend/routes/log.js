import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getLogByLega } from '../models/log.js';

const router = express.Router();

// Ottieni il log delle azioni di una lega
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  getLogByLega(legaId, (err, log) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ log });
  });
});

export default router; 