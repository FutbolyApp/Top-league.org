import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';

const router = express.Router();
const db = getDb();

// Ottieni tutte le notifiche dell'utente loggato
router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT *, COALESCE(dati_aggiuntivi, "{}") as dati_aggiuntivi FROM notifiche WHERE utente_id = ? AND (archiviata = 0 OR archiviata IS NULL) ORDER BY data_creazione DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    res.json({ notifiche: rows });
  });
});

// Ottieni tutte le notifiche dell'utente loggato (alias)
router.get('/utente', requireAuth, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT *, COALESCE(dati_aggiuntivi, "{}") as dati_aggiuntivi FROM notifiche WHERE utente_id = ? AND (archiviata = 0 OR archiviata IS NULL) ORDER BY data_creazione DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    res.json({ notifiche: rows });
  });
});

// Ottieni notifiche per admin di una lega
router.get('/admin/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const adminId = req.user.id;
  
  // Verifica che l'utente sia admin della lega
  db.get('SELECT id FROM leghe WHERE id = ? AND admin_id = ?', [legaId, adminId], (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!lega) return res.status(403).json({ error: 'Non autorizzato' });
    
    // Ottieni notifiche per admin di questa lega
    db.all(`
      SELECT n.*, u.nome as utente_nome, u.cognome as utente_cognome
      FROM notifiche n
      JOIN utenti u ON n.utente_id = u.id
      WHERE n.lega_id = ? AND n.tipo IN ('richiesta_trasferimento', 'richiesta_club', 'richiesta_rinnovo', 'richiesta_pagamento', 'richiesta_generale')
      ORDER BY n.data_creazione DESC
    `, [legaId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Errore DB' });
      res.json({ notifiche: rows });
    });
  });
});

// Crea notifica per admin
router.post('/admin', requireAuth, (req, res) => {
  const { lega_id, tipo, messaggio, giocatore_id, squadra_id } = req.body;
  const userId = req.user.id;
  
  if (!lega_id || !tipo || !messaggio) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }
  
  // Ottieni admin della lega
  db.get('SELECT admin_id FROM leghe WHERE id = ?', [lega_id], (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    
    // Crea notifica per l'admin
    db.run(`
      INSERT INTO notifiche (utente_id, lega_id, tipo, messaggio, data_creazione)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [lega.admin_id, lega_id, tipo, messaggio], function(err) {
      if (err) return res.status(500).json({ error: 'Errore creazione notifica' });
      res.json({ success: true, id: this.lastID });
    });
  });
});

// Marca notifica come letta
router.put('/:notificaId/letta', requireAuth, (req, res) => {
  const notificaId = req.params.notificaId;
  const userId = req.user.id;
  
  db.run('UPDATE notifiche SET letto = 1, data_lettura = datetime("now") WHERE id = ? AND utente_id = ?', [notificaId, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Errore aggiornamento' });
    if (this.changes === 0) return res.status(404).json({ error: 'Notifica non trovata' });
    res.json({ success: true });
  });
});

// Marca notifica come letta (POST endpoint per compatibilità frontend)
router.post('/:notificaId/read', requireAuth, (req, res) => {
  const notificaId = req.params.notificaId;
  const userId = req.user.id;
  
  db.run('UPDATE notifiche SET letto = 1, data_lettura = datetime("now") WHERE id = ? AND utente_id = ?', [notificaId, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Errore aggiornamento' });
    if (this.changes === 0) return res.status(404).json({ error: 'Notifica non trovata' });
    res.json({ success: true });
  });
});

// Marca tutte le notifiche come lette
router.put('/tutte-lette', requireAuth, (req, res) => {
  const userId = req.user.id;
  
  db.run('UPDATE notifiche SET letto = 1, data_lettura = datetime("now") WHERE utente_id = ?', [userId], function(err) {
    if (err) return res.status(500).json({ error: 'Errore aggiornamento' });
    res.json({ success: true, aggiornate: this.changes });
  });
});

// Elimina notifica
router.delete('/:notificaId', requireAuth, (req, res) => {
  const notificaId = req.params.notificaId;
  const userId = req.user.id;
  
  db.run('DELETE FROM notifiche WHERE id = ? AND utente_id = ?', [notificaId, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Errore eliminazione' });
    if (this.changes === 0) return res.status(404).json({ error: 'Notifica non trovata' });
    res.json({ success: true });
  });
});

// Archivia notifiche (aggiorna il campo archiviata)
router.put('/archivia', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { notifica_ids } = req.body;
  
  if (!notifica_ids || !Array.isArray(notifica_ids) || notifica_ids.length === 0) {
    return res.status(400).json({ error: 'Lista notifiche richiesta' });
  }
  
  const placeholders = notifica_ids.map(() => '?').join(',');
  const params = [...notifica_ids, userId];
  
  db.run(
    `UPDATE notifiche SET archiviata = 1 WHERE id IN (${placeholders}) AND utente_id = ?`,
    params,
    function(err) {
      if (err) return res.status(500).json({ error: 'Errore archiviazione' });
      res.json({ success: true, archiviate: this.changes });
    }
  );
});

export default router; 