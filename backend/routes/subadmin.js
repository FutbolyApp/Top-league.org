import express from 'express';
import { getDb } from '../db/postgres.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { 
  addSubadmin, 
  removeSubadmin, 
  getSubadminsByLega, 
  isSubadmin, 
  hasPermission,
  getAllSubadmins,
  updateSubadminPermissions
} from '../models/subadmin.js';
import { 
  createPendingChange, 
  getPendingChangesByLega, 
  getPendingChangesBySubadmin,
  approveChange,
  rejectChange,
  getChangeById,
  getAllPendingChanges,
  getChangeHistory,
  getChangeHistoryBySubadmin,
  deletePendingChange
} from '../models/pendingChanges.js';

const router = express.Router();

// Ottieni tutti i subadmin (solo SuperAdmin)
router.get('/all', requireSuperAdmin, async (req, res) => {
  try {
    const subadmins = await getAllSubadmins();
    res.json({ subadmins });
  } catch (error) {
    console.error('Errore recupero tutti subadmin:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni subadmin di una lega (admin della lega o SuperAdmin)
router.get('/lega/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const userId = req.user.id;
    const db = getDb();
    
    // Verifica che l'utente sia admin della lega o SuperAdmin
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [legaId]);
    
    if (legaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = legaResult.rows[0];
    const isAdmin = lega.admin_id === userId;
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    
    if (!isAdmin && !isSuperAdmin) {
      return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
    }
    
    const subadmins = await getSubadminsByLega(legaId);
    res.json({ subadmins });
  } catch (error) {
    console.error('Errore recupero subadmin lega:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Aggiungi subadmin (SuperAdmin o Admin della lega)
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { legaId, userId, permissions } = req.body;
    const currentUserId = req.user.id;
    
    console.log('Aggiunta subadmin - Dati ricevuti:', { legaId, userId, permissions, currentUserId, userRole: req.user.ruolo });
    
    if (!legaId || !userId || !permissions) {
      console.log('Dati mancanti:', { legaId, userId, permissions });
      return res.status(400).json({ error: 'legaId, userId e permissions sono obbligatori' });
    }
    
    // Verifica che l'utente sia SuperAdmin o admin della lega
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    console.log('Is SuperAdmin:', isSuperAdmin);
    
    if (!isSuperAdmin) {
      // Se non è SuperAdmin, verifica che sia admin della lega
      const db = getDb();
      const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [legaId]);
      
      console.log('Lega trovata:', legaResult.rows[0]);
      
      if (legaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      const lega = legaResult.rows[0];
      if (lega.admin_id !== currentUserId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto SuperAdmin o Admin della lega' });
      }
      
      // Procedi con l'aggiunta del subadmin
      console.log('Procedo con aggiunta subadmin (Admin lega)');
      const subadminId = await addSubadmin(legaId, userId, permissions);
      console.log('Subadmin aggiunto con successo, ID:', subadminId);
      res.json({ success: true, subadminId });
    } else {
      // Se è SuperAdmin, procedi direttamente
      console.log('Procedo con aggiunta subadmin (SuperAdmin)');
      const subadminId = await addSubadmin(legaId, userId, permissions);
      console.log('Subadmin aggiunto con successo, ID:', subadminId);
      res.json({ success: true, subadminId });
    }
  } catch (error) {
    console.error('Errore aggiunta subadmin:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Rimuovi subadmin (SuperAdmin o Admin della lega)
router.delete('/remove', requireAuth, async (req, res) => {
  try {
    const { legaId, userId } = req.body;
    const currentUserId = req.user.id;
    
    if (!legaId || !userId) {
      return res.status(400).json({ error: 'legaId e userId sono obbligatori' });
    }
    
    // Verifica che l'utente sia SuperAdmin o admin della lega
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    
    if (!isSuperAdmin) {
      // Se non è SuperAdmin, verifica che sia admin della lega
      const db = getDb();
      const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [legaId]);
      
      if (legaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      const lega = legaResult.rows[0];
      if (lega.admin_id !== currentUserId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto SuperAdmin o Admin della lega' });
      }
      
      // Procedi con la rimozione del subadmin
      const changes = await removeSubadmin(legaId, userId);
      res.json({ success: true, changes });
    } else {
      // Se è SuperAdmin, procedi direttamente
      const changes = await removeSubadmin(legaId, userId);
      res.json({ success: true, changes });
    }
  } catch (error) {
    console.error('Errore rimozione subadmin:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Aggiorna permessi subadmin (SuperAdmin o Admin della lega)
router.put('/update-permissions', requireAuth, async (req, res) => {
  try {
    const { legaId, userId, permissions } = req.body;
    const currentUserId = req.user.id;
    
    if (!legaId || !userId || !permissions) {
      return res.status(400).json({ error: 'legaId, userId e permissions sono obbligatori' });
    }
    
    // Verifica che l'utente sia SuperAdmin o admin della lega
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    
    if (!isSuperAdmin) {
      // Se non è SuperAdmin, verifica che sia admin della lega
      const db = getDb();
      const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [legaId]);
      
      if (legaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      const lega = legaResult.rows[0];
      if (lega.admin_id !== currentUserId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto SuperAdmin o Admin della lega' });
      }
      
      // Procedi con l'aggiornamento dei permessi
      await updateSubadminPermissions(legaId, userId, permissions);
      res.json({ success: true, message: 'Permessi aggiornati con successo' });
    } else {
      // Se è SuperAdmin, procedi direttamente
      await updateSubadminPermissions(legaId, userId, permissions);
      res.json({ success: true, message: 'Permessi aggiornati con successo' });
    }
  } catch (error) {
    console.error('Errore aggiornamento permessi subadmin:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Verifica se utente è subadmin di una lega
router.get('/check/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const userId = req.user.id;
    
    const isSub = await isSubadmin(legaId, userId);
    const permissions = await hasPermission(legaId, userId, 'read'); // Placeholder, needs actual permissions
    
    res.json({ isSubadmin: isSub, permissions });
  } catch (error) {
    console.error('Errore verifica subadmin:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Verifica permesso specifico
router.get('/permission/:legaId/:permission', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const permission = req.params.permission;
    const userId = req.user.id;
    
    const hasPerm = await hasPermission(legaId, userId, permission);
    res.json({ hasPermission: hasPerm });
  } catch (error) {
    console.error('Errore verifica permesso:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni modifiche in attesa per un subadmin
router.get('/pending/subadmin', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const changes = await getPendingChangesBySubadmin(userId);
    res.json({ changes });
  } catch (error) {
    console.error('Errore recupero modifiche subadmin:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni modifiche in attesa per una lega (admin della lega o SuperAdmin)
router.get('/pending/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const userId = req.user.id;
    const db = getDb();
    
    // Verifica che l'utente sia admin della lega o SuperAdmin
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [legaId]);
    
    if (legaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = legaResult.rows[0];
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    
    if (!isSuperAdmin) {
      if (lega.admin_id !== userId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
      }
    }
    
    const changes = await getPendingChangesByLega(legaId);
    res.json({ changes });
  } catch (error) {
    console.error('Errore recupero modifiche in attesa:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Approva modifica (admin della lega o SuperAdmin)
router.post('/approve/:changeId', requireAuth, async (req, res) => {
  try {
    const changeId = req.params.changeId;
    const { adminResponse } = req.body;
    const userId = req.user.id;
    
    // Verifica che l'utente sia SuperAdmin
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    
    // Prima ottieni la modifica per verificare la lega
    const change = await getChangeById(changeId);
    
    if (!change) {
      return res.status(404).json({ error: 'Modifica non trovata' });
    }
    
    if (isSuperAdmin) {
      // Se è SuperAdmin, procedi direttamente
      await approveChange(changeId, adminResponse || 'Approvato');
      res.json({ success: true, message: 'Modifica approvata con successo' });
    } else {
      // Verifica che l'utente sia admin della lega
      const db = getDb();
      const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [change.lega_id]);
      
      if (legaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      const lega = legaResult.rows[0];
      if (lega.admin_id !== userId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
      }
      
      await approveChange(changeId, adminResponse || 'Approvato');
      res.json({ success: true, message: 'Modifica approvata con successo' });
    }
  } catch (error) {
    console.error('Errore approvazione modifica:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Rifiuta modifica (admin della lega o SuperAdmin)
router.post('/reject/:changeId', requireAuth, async (req, res) => {
  try {
    const changeId = req.params.changeId;
    const { adminResponse } = req.body;
    const userId = req.user.id;
    
    // Verifica che l'utente sia SuperAdmin
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    
    // Prima ottieni la modifica per verificare la lega
    const change = await getChangeById(changeId);
    
    if (!change) {
      return res.status(404).json({ error: 'Modifica non trovata' });
    }
    
    if (isSuperAdmin) {
      // Se è SuperAdmin, procedi direttamente
      await rejectChange(changeId, adminResponse || 'Rifiutato');
      res.json({ success: true, message: 'Modifica rifiutata con successo' });
    } else {
      // Verifica che l'utente sia admin della lega
      const db = getDb();
      const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [change.lega_id]);
      
      if (legaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      const lega = legaResult.rows[0];
      if (lega.admin_id !== userId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
      }
      
      await rejectChange(changeId, adminResponse || 'Rifiutato');
      res.json({ success: true, message: 'Modifica rifiutata con successo' });
    }
  } catch (error) {
    console.error('Errore rifiuto modifica:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni storico modifiche di una lega (admin della lega o SuperAdmin)
router.get('/history/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const userId = req.user.id;
    const db = getDb();
    
    // Verifica che l'utente sia admin della lega o SuperAdmin
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [legaId]);
    
    if (legaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = legaResult.rows[0];
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    
    if (!isSuperAdmin) {
      if (lega.admin_id !== userId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
      }
    }
    
    const changes = await getChangeHistory(legaId);
    res.json({ changes });
  } catch (error) {
    console.error('Errore recupero storico modifiche:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni storico modifiche di un subadmin
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const changes = await getChangeHistoryBySubadmin(userId);
    res.json({ changes });
  } catch (error) {
    console.error('Errore recupero storico modifiche subadmin:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Verifica se utente è subadmin di qualche lega
router.get('/check-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const db = getDb();
    const result = await db.query(`
      SELECT s.*, l.nome as lega_nome, l.id as lega_id
      FROM subadmin s
      JOIN leghe l ON s.lega_id = l.id
      WHERE s.utente_id = $1 AND s.attivo = true
    `, [userId]);
    
    const subadminLeagues = result.rows;
    const isSubadmin = subadminLeagues.length > 0;
    const leagues = subadminLeagues.map(sl => ({
      id: sl.lega_id,
      nome: sl.lega_nome,
      permessi: JSON.parse(sl.permessi || '{}')
    }));
    
    res.json({ 
      isSubadmin, 
      leagues 
    });
  } catch (error) {
    console.error('Errore verifica subadmin globale:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Crea una nuova richiesta di modifica (subadmin)
router.post('/request', requireAuth, async (req, res) => {
  console.log('=== DEBUG: Richiesta POST /api/subadmin/request ===');
  console.log('User ID:', req.user.id);
  console.log('User ruolo:', req.user.ruolo);
  console.log('Body:', req.body);
  
  const { legaId, tipo, modifiche, descrizione, dettagli } = req.body;
  const userId = req.user.id;
  
  if (!legaId || !tipo || !modifiche || !descrizione) {
    console.log('Errore: parametri mancanti');
    return res.status(400).json({ error: 'legaId, tipo, modifiche e descrizione sono obbligatori' });
  }
  
  console.log('Verificando se utente è subadmin della lega:', legaId);
  
  // Verifica che l'utente sia subadmin della lega
  const isSub = await isSubadmin(legaId, userId);
  const permissions = await hasPermission(legaId, userId, 'read'); // Placeholder, needs actual permissions
  
  console.log('Risultato verifica subadmin:', { isSub, permissions });
  
  if (!isSub) {
    console.log('Accesso negato: utente non è subadmin');
    return res.status(403).json({ error: 'Accesso negato: richiesto Subadmin della lega' });
  }
  
  // Verifica che il subadmin abbia il permesso per il tipo di modifica
  const hasPermission = permissions[tipo];
  console.log('Verifica permesso:', { tipo, hasPermission, permissions });
  
  if (!hasPermission) {
    console.log('Accesso negato: permesso non disponibile');
    return res.status(403).json({ error: `Accesso negato: permesso ${tipo} non disponibile` });
  }
  
  console.log('Creando richiesta di modifica...');
  
  // Crea la richiesta di modifica
  const changeId = await createPendingChange(legaId, userId, tipo, modifiche, descrizione, dettagli);
  
  console.log('Richiesta modifica creata con successo, ID:', changeId);
  res.json({ success: true, changeId });
});

// Annulla modifica in attesa (solo il subadmin che l'ha creata)
router.delete('/cancel/:changeId', requireAuth, async (req, res) => {
  const changeId = req.params.changeId;
  const userId = req.user.id;
  
  console.log('=== DEBUG: Richiesta DELETE /api/subadmin/cancel/:changeId ===');
  console.log('User ID:', userId);
  console.log('Change ID:', changeId);
  
  // Prima ottieni la modifica per verificare che appartenga al subadmin
  const change = await getChangeById(changeId);
  
  if (!change) {
    return res.status(404).json({ error: 'Modifica non trovata' });
  }
  
  // Verifica che la modifica sia in stato 'pending'
  if (change.status !== 'pending') {
    return res.status(400).json({ error: 'Solo le modifiche in attesa possono essere annullate' });
  }
  
  // Verifica che l'utente sia il subadmin che ha creato la modifica
  if (change.subadmin_id !== userId) {
    console.log('Accesso negato: modifica non appartiene al subadmin');
    console.log('Change subadmin_id:', change.subadmin_id);
    console.log('User ID:', userId);
    return res.status(403).json({ error: 'Accesso negato: puoi annullare solo le tue modifiche' });
  }
  
  console.log('Procedendo con l\'annullamento della modifica...');
  
  // Elimina la modifica
  await deletePendingChange(changeId);
  
  console.log('Modifica annullata con successo');
  res.json({ success: true, message: 'Modifica annullata con successo' });
});

export default router; // Force redeploy - Fri Jul 11 17:42:01 BST 2025
