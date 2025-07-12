import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getLogByLega } from '../models/log.js';

const router = express.Router();

// Ottieni il log delle azioni di una lega
router.get('/lega/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const log = await getLogByLega(legaId);
    res.json({ log });
  } catch (error) {
    console.error('Errore recupero log lega:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

export default router; 