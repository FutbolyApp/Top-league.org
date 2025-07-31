import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/mariadb.js';

const router = express.Router();

// FIXED: Helper function to handle MariaDB result format consistently
const getMariaDBResult = (result) => {
  if (result && Array.isArray(result)) {
    return result;
  } else if (result && result.rows) {
    return result.rows;
  } else if (result && result.rowCount !== undefined) {
    return result;
  }
  return [];
};

// Ottieni tutte le notifiche dell'utente loggato
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Get notifications request received for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.log('🔍 NOTIFICHE: No authenticated user');
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const userId = req.user.id;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    const result = await db.query(`
      SELECT * FROM notifiche 
      WHERE utente_id = ? 
      ORDER BY data_creazione DESC
    `, [userId]);
    
    const notifiche = getMariaDBResult(result);
    console.log('🔍 NOTIFICHE: Found notifications:', notifiche.length);
    
    res.json({ notifiche });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error retrieving notifications:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message
    });
  }
});

// Ottieni tutte le notifiche dell'utente loggato (alias)
router.get('/utente', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Get user notifications request received for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.log('🔍 NOTIFICHE: No authenticated user');
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const userId = req.user.id;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    const result = await db.query(`
      SELECT *, COALESCE(dati_aggiuntivi, '{}') as dati_aggiuntivi 
      FROM notifiche 
      WHERE utente_id = ? AND (archiviata = false OR archiviata IS NULL) 
      ORDER BY data_creazione DESC
    `, [userId]);
    
    const notifiche = getMariaDBResult(result);
    console.log('🔍 NOTIFICHE: Found user notifications:', notifiche.length);
    
    res.json({ notifiche });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error retrieving user notifications:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message
    });
  }
});

// Ottieni notifiche per admin di una lega
router.get('/admin/:legaId', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Get admin notifications request received for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.log('🔍 NOTIFICHE: No authenticated user');
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const legaId = req.params.legaId;
    const adminId = req.user.id;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    // Verifica che l'utente sia admin della lega
    const legaResult = await db.query('SELECT id FROM leghe WHERE id = ? AND admin_id = ?', [legaId, adminId]);
    const legheAdmin = getMariaDBResult(legaResult);
    
    if (legaResult && legaResult.rowCount !== undefined && legaResult.rowCount === 0) {
      console.log('🔍 NOTIFICHE: User not authorized for league:', legaId);
      return res.status(403).json({ error: 'Non autorizzato' });
    }
    
    // Ottieni notifiche per admin di questa lega
    const notificheResult = await db.query(`
      SELECT n.*, COALESCE(u.nome, 'Nome') as utente_nome, CONCAT(u.cognome, '') as utente_cognome
      FROM notifiche n
      JOIN users u ON n.utente_id = u.id
      WHERE n.lega_id = ? AND n.tipo IN ('richiesta_trasferimento', 'richiesta_club', 'richiesta_rinnovo', 'richiesta_pagamento', 'richiesta_generale')
      ORDER BY n.data_creazione DESC
    `, [legaId]);
    
    const notifiche = getMariaDBResult(notificheResult);
    console.log('🔍 NOTIFICHE: Found admin notifications:', notifiche.length);
    
    res.json({ notifiche });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error retrieving admin notifications:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message
    });
  }
});

// Crea notifica per admin
router.post('/admin', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Create admin notification request received');
    
    if (!req.user || !req.user.id) {
      console.log('🔍 NOTIFICHE: No authenticated user');
      return res.status(401).json({ error: 'Utente non autenticato' });
    }
    
    const { lega_id, tipo, messaggio, giocatore_id, squadra_id } = req.body;
    const userId = req.user.id;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    if (!lega_id || !tipo || !messaggio) {
      console.log('🔍 NOTIFICHE: Missing required fields');
      return res.status(400).json({ error: 'Dati mancanti' });
    }
    
    // Ottieni admin della lega
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = ?', [lega_id]);
    const leghe = getMariaDBResult(legaResult);
    
    if (legaResult && legaResult.rowCount !== undefined && legaResult.rowCount === 0) {
      console.log('🔍 NOTIFICHE: League not found:', lega_id);
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = leghe[0];
    
    // Crea notifica per l'admin
    const notificaResult = await db.query(`
      INSERT INTO notifiche (utente_id, lega_id, tipo, messaggio, data_creazione)
      VALUES (?, ?, ?, ?, NOW())
    `, [lega.admin_id, lega_id, tipo, messaggio]);
    
    console.log('🔍 NOTIFICHE: Admin notification created successfully');
    res.json({ success: true, id: notificaResult.insertId });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error creating admin notification:', error);
    res.status(500).json({ 
      error: 'Errore creazione notifica', 
      details: error.message 
    });
  }
});

// Marca notifica come letta
router.put('/:notificaId/letta', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Mark as read request received for notification:', req.params.notificaId);
    
    const notificaId = req.params.notificaId;
    const userId = req.user.id;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    const result = await db.query(
      'UPDATE notifiche SET letto = true, data_lettura = NOW() WHERE id = ? AND utente_id = ?',
      [notificaId, userId]
    );
    
    // FIXED: Handle MariaDB result format properly
    const affectedRows = result.affectedRows || result.rowCount || 0;
    
    if (affectedRows === 0) {
      console.log('🔍 NOTIFICHE: Notification not found or not owned by user');
      return res.status(404).json({ error: 'Notifica non trovata' });
    }
    
    console.log('🔍 NOTIFICHE: Notification marked as read successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error updating notification as read:', error);
    res.status(500).json({ 
      error: 'Errore aggiornamento', 
      details: error.message 
    });
  }
});

// Marca notifica come letta (POST endpoint per compatibilità frontend)
router.post('/:notificaId/read', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Mark as read (POST) request received for notification:', req.params.notificaId);
    
    const notificaId = req.params.notificaId;
    const userId = req.user.id;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    const result = await db.query(
      'UPDATE notifiche SET letto = true, data_lettura = NOW() WHERE id = ? AND utente_id = ?',
      [notificaId, userId]
    );
    
    // FIXED: Handle MariaDB result format properly
    const affectedRows = result.affectedRows || result.rowCount || 0;
    
    if (affectedRows === 0) {
      console.log('🔍 NOTIFICHE: Notification not found or not owned by user');
      return res.status(404).json({ error: 'Notifica non trovata' });
    }
    
    console.log('🔍 NOTIFICHE: Notification marked as read successfully (POST)');
    res.json({ success: true });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error updating notification as read (POST):', error);
    res.status(500).json({ 
      error: 'Errore aggiornamento', 
      details: error.message 
    });
  }
});

// Marca tutte le notifiche come lette
router.put('/tutte-lette', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Mark all as read request received for user:', req.user?.id);
    
    const userId = req.user.id;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    const result = await db.query(
      'UPDATE notifiche SET letto = true, data_lettura = NOW() WHERE utente_id = ?',
      [userId]
    );
    
    // FIXED: Handle MariaDB result format properly
    const affectedRows = result.affectedRows || result.rowCount || 0;
    
    console.log('🔍 NOTIFICHE: Marked notifications as read:', affectedRows);
    res.json({ success: true, aggiornate: affectedRows });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error updating all notifications as read:', error);
    res.status(500).json({ 
      error: 'Errore aggiornamento', 
      details: error.message 
    });
  }
});

// Elimina notifica
router.delete('/:notificaId', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Delete notification request received for notification:', req.params.notificaId);
    
    const notificaId = req.params.notificaId;
    const userId = req.user.id;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    const result = await db.query(
      'DELETE FROM notifiche WHERE id = ? AND utente_id = ?',
      [notificaId, userId]
    );
    
    // FIXED: Handle MariaDB result format properly
    const affectedRows = result.affectedRows || result.rowCount || 0;
    
    if (affectedRows === 0) {
      console.log('🔍 NOTIFICHE: Notification not found or not owned by user');
      return res.status(404).json({ error: 'Notifica non trovata' });
    }
    
    console.log('🔍 NOTIFICHE: Notification deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error deleting notification:', error);
    res.status(500).json({ 
      error: 'Errore eliminazione', 
      details: error.message 
    });
  }
});

// Archivia notifiche (aggiorna il campo archiviata)
router.put('/archivia', requireAuth, async (req, res) => {
  try {
    console.log('🔍 NOTIFICHE: Archive notifications request received');
    
    const userId = req.user.id;
    const { notifica_ids } = req.body;
    const db = getDb();
    
    if (!db) {
      console.error('🚨 NOTIFICHE: Database not available');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    if (!notifica_ids || !Array.isArray(notifica_ids) || (notifica_ids?.length || 0) === 0) {
      console.log('🔍 NOTIFICHE: Missing notification IDs');
      return res.status(400).json({ error: 'Lista notifiche richiesta' });
    }
    
    const placeholders = notifica_ids?.map((_, index) => `?`).join(',');
    const params = [userId, ...notifica_ids];
    
    const result = await db.query(
      `UPDATE notifiche SET archiviata = true WHERE id IN (${placeholders}) AND utente_id = ?`,
      params
    );
    
    // FIXED: Handle MariaDB result format properly
    const affectedRows = result.affectedRows || result.rowCount || 0;
    
    console.log('🔍 NOTIFICHE: Archived notifications:', affectedRows);
    res.json({ success: true, archiviate: affectedRows });
  } catch (error) {
    console.error('🚨 NOTIFICHE: Error archiving notifications:', error);
    res.status(500).json({ 
      error: 'Errore archiviazione', 
      details: error.message 
    });
  }
});

export default router; 