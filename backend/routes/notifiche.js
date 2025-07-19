import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';

const router = express.Router();

// Ottieni tutte le notifiche dell'utente loggato
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();
    const result = await db.query(`
      SELECT *, COALESCE(dati_aggiuntivi, '{}') as dati_aggiuntivi 
      FROM notifiche 
      WHERE utente_id = $1 AND (archiviata = false OR archiviata IS NULL) 
      ORDER BY data_creazione DESC
    `, [userId]);
    
    res.json({ notifiche: result.rows });
  } catch (error) {
    console.error('Errore recupero notifiche:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni tutte le notifiche dell'utente loggato (alias)
router.get('/utente', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();
    const result = await db.query(`
      SELECT *, COALESCE(dati_aggiuntivi, '{}') as dati_aggiuntivi 
      FROM notifiche 
      WHERE utente_id = $1 AND (archiviata = false OR archiviata IS NULL) 
      ORDER BY data_creazione DESC
    `, [userId]);
    
    res.json({ notifiche: result.rows });
  } catch (error) {
    console.error('Errore recupero notifiche utente:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni notifiche per admin di una lega
router.get('/admin/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const adminId = req.user.id;
    const db = getDb();
    
    // Verifica che l'utente sia admin della lega
    const legaResult = await db.query('SELECT id FROM leghe WHERE id = $1 AND admin_id = $2', [legaId, adminId]);
    
    if (legaResult.rows?.length || 0 === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    // Ottieni notifiche per admin di questa lega
    const notificheResult = await db.query(`
      SELECT n.*, COALESCE(u.nome, 'Nome') as utente_nome, u?.cognome || '' as utente_cognome
      FROM notifiche n
      JOIN users u ON n.utente_id = u.id
      WHERE n.lega_id = $1 AND n.tipo IN ('richiesta_trasferimento', 'richiesta_club', 'richiesta_rinnovo', 'richiesta_pagamento', 'richiesta_generale')
      ORDER BY n.data_creazione DESC
    `, [legaId]);
    
    res.json({ notifiche: notificheResult.rows });
  } catch (error) {
    console.error('Errore recupero notifiche admin:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Crea notifica per admin
router.post('/admin', requireAuth, async (req, res) => {
  try {
    const { lega_id, tipo, messaggio, giocatore_id, squadra_id } = req.body;
    const userId = req.user.id;
    const db = getDb();
    
    if (!lega_id || !tipo || !messaggio) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }
    
    // Ottieni admin della lega
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [lega_id]);
    
    if (legaResult.rows?.length || 0 === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = legaResult.rows[0];
    
    // Crea notifica per l'admin
    const notificaResult = await db.query(`
      INSERT INTO notifiche (utente_id, lega_id, tipo, messaggio, data_creazione)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `, [lega.admin_id, lega_id, tipo, messaggio]);
    
    res.json({ success: true, id: notificaResult.rows[0].id });
  } catch (error) {
    console.error('Errore creazione notifica admin:', error);
    res.status(500).json({ error: 'Errore creazione notifica', details: error.message });
  }
});

// Marca notifica come letta
router.put('/:notificaId/letta', requireAuth, async (req, res) => {
  try {
    const notificaId = req.params.notificaId;
    const userId = req.user.id;
    const db = getDb();
    
    const result = await db.query(
      'UPDATE notifiche SET letto = true, data_lettura = NOW() WHERE id = $1 AND utente_id = $2',
      [notificaId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notifica non trovata' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Errore aggiornamento notifica letta:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

// Marca notifica come letta (POST endpoint per compatibilità frontend)
router.post('/:notificaId/read', requireAuth, async (req, res) => {
  try {
    const notificaId = req.params.notificaId;
    const userId = req.user.id;
    const db = getDb();
    
    const result = await db.query(
      'UPDATE notifiche SET letto = true, data_lettura = NOW() WHERE id = $1 AND utente_id = $2',
      [notificaId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notifica non trovata' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Errore aggiornamento notifica letta:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

// Marca tutte le notifiche come lette
router.put('/tutte-lette', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();
    
    const result = await db.query(
      'UPDATE notifiche SET letto = true, data_lettura = NOW() WHERE utente_id = $1',
      [userId]
    );
    
    res.json({ success: true, aggiornate: result.rowCount });
  } catch (error) {
    console.error('Errore aggiornamento tutte notifiche lette:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

// Elimina notifica
router.delete('/:notificaId', requireAuth, async (req, res) => {
  try {
    const notificaId = req.params.notificaId;
    const userId = req.user.id;
    const db = getDb();
    
    const result = await db.query(
      'DELETE FROM notifiche WHERE id = $1 AND utente_id = $2',
      [notificaId, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notifica non trovata' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Errore eliminazione notifica:', error);
    res.status(500).json({ error: 'Errore eliminazione', details: error.message });
  }
});

// Archivia notifiche (aggiorna il campo archiviata)
router.put('/archivia', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifica_ids } = req.body;
    const db = getDb();
    
    if (!notifica_ids || !Array.isArray(notifica_ids) || notifica_ids?.length || 0 === 0) {
      return res.status(400).json({ error: 'Lista notifiche richiesta' });
    }
    
    const placeholders = notifica_ids?.map((_, index) => `$${index + 2}`).join(',');
    const params = [userId, ...notifica_ids];
    
    const result = await db.query(
      `UPDATE notifiche SET archiviata = true WHERE id IN (${placeholders}) AND utente_id = $1`,
      params
    );
    
    res.json({ success: true, archiviate: result.rowCount });
  } catch (error) {
    console.error('Errore archiviazione notifiche:', error);
    res.status(500).json({ error: 'Errore archiviazione', details: error.message });
  }
});

export default router; 