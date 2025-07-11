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
router.get('/all', requireSuperAdmin, (req, res) => {
  getAllSubadmins((err, subadmins) => {
    if (err) {
      console.error('Errore recupero tutti subadmin:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    res.json({ subadmins });
  });
});

// Ottieni subadmin di una lega (admin della lega o SuperAdmin)
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  
  // Verifica che l'utente sia admin della lega o SuperAdmin
  const db = req.app.locals.db;
  db.get('SELECT admin_id FROM leghe WHERE id = ?', [legaId], (err, lega) => {
    if (err) {
      console.error('Errore verifica admin lega:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    if (!lega) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const isAdmin = lega.admin_id === userId;
    const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
    
    if (!isAdmin && !isSuperAdmin) {
      return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
    }
    
    getSubadminsByLega(legaId, (err, subadmins) => {
      if (err) {
        console.error('Errore recupero subadmin lega:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      res.json({ subadmins });
    });
  });
});

// Aggiungi subadmin (SuperAdmin o Admin della lega)
router.post('/add', requireAuth, (req, res) => {
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
    const db = req.app.locals.db;
    db.get('SELECT admin_id FROM leghe WHERE id = ?', [legaId], (err, lega) => {
      if (err) {
        console.error('Errore verifica admin lega:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      console.log('Lega trovata:', lega);
      
      if (!lega) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      if (lega.admin_id !== currentUserId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto SuperAdmin o Admin della lega' });
      }
      
      // Procedi con l'aggiunta del subadmin
      console.log('Procedo con aggiunta subadmin (Admin lega)');
      addSubadmin(legaId, userId, permissions, (err, subadminId) => {
        if (err) {
          console.error('Errore aggiunta subadmin:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        console.log('Subadmin aggiunto con successo, ID:', subadminId);
        res.json({ success: true, subadminId });
      });
    });
  } else {
    // Se è SuperAdmin, procedi direttamente
    console.log('Procedo con aggiunta subadmin (SuperAdmin)');
    addSubadmin(legaId, userId, permissions, (err, subadminId) => {
      if (err) {
        console.error('Errore aggiunta subadmin:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      console.log('Subadmin aggiunto con successo, ID:', subadminId);
      res.json({ success: true, subadminId });
    });
  }
});

// Rimuovi subadmin (SuperAdmin o Admin della lega)
router.delete('/remove', requireAuth, (req, res) => {
  const { legaId, userId } = req.body;
  const currentUserId = req.user.id;
  
  if (!legaId || !userId) {
    return res.status(400).json({ error: 'legaId e userId sono obbligatori' });
  }
  
  // Verifica che l'utente sia SuperAdmin o admin della lega
  const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
  
  if (!isSuperAdmin) {
    // Se non è SuperAdmin, verifica che sia admin della lega
    const db = req.app.locals.db;
    db.get('SELECT admin_id FROM leghe WHERE id = ?', [legaId], (err, lega) => {
      if (err) {
        console.error('Errore verifica admin lega:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      if (!lega) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      if (lega.admin_id !== currentUserId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto SuperAdmin o Admin della lega' });
      }
      
      // Procedi con la rimozione del subadmin
      removeSubadmin(legaId, userId, (err, changes) => {
        if (err) {
          console.error('Errore rimozione subadmin:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        res.json({ success: true, changes });
      });
    });
  } else {
    // Se è SuperAdmin, procedi direttamente
    removeSubadmin(legaId, userId, (err, changes) => {
      if (err) {
        console.error('Errore rimozione subadmin:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      res.json({ success: true, changes });
    });
  }
});

// Aggiorna permessi subadmin (SuperAdmin o Admin della lega)
router.put('/update-permissions', requireAuth, (req, res) => {
  const { legaId, userId, permissions } = req.body;
  const currentUserId = req.user.id;
  
  if (!legaId || !userId || !permissions) {
    return res.status(400).json({ error: 'legaId, userId e permissions sono obbligatori' });
  }
  
  // Verifica che l'utente sia SuperAdmin o admin della lega
  const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
  
  if (!isSuperAdmin) {
    // Se non è SuperAdmin, verifica che sia admin della lega
    const db = req.app.locals.db;
    db.get('SELECT admin_id FROM leghe WHERE id = ?', [legaId], (err, lega) => {
      if (err) {
        console.error('Errore verifica admin lega:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      if (!lega) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      if (lega.admin_id !== currentUserId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto SuperAdmin o Admin della lega' });
      }
      
      // Procedi con l'aggiornamento dei permessi
      updateSubadminPermissions(legaId, userId, permissions, (err, result) => {
        if (err) {
          console.error('Errore aggiornamento permessi subadmin:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        res.json({ success: true, result });
      });
    });
  } else {
    // Se è SuperAdmin, procedi direttamente
    updateSubadminPermissions(legaId, userId, permissions, (err, result) => {
      if (err) {
        console.error('Errore aggiornamento permessi subadmin:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      res.json({ success: true, result });
    });
  }
});

// Verifica se utente è subadmin di una lega
router.get('/check/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  
  isSubadmin(legaId, userId, (err, isSub, permissions) => {
    if (err) {
      console.error('Errore verifica subadmin:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    res.json({ isSubadmin: isSub, permissions });
  });
});

// Verifica permesso specifico
router.get('/permission/:legaId/:permission', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const permission = req.params.permission;
  const userId = req.user.id;
  
  hasPermission(legaId, userId, permission, (err, hasPerm) => {
    if (err) {
      console.error('Errore verifica permesso:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    res.json({ hasPermission: hasPerm });
  });
});

// Ottieni modifiche in attesa per un subadmin
router.get('/pending/subadmin', requireAuth, (req, res) => {
  const userId = req.user.id;
  
  getPendingChangesBySubadmin(userId, (err, changes) => {
    if (err) {
      console.error('Errore recupero modifiche subadmin:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    res.json({ changes });
  });
});

// Ottieni modifiche in attesa per una lega (admin della lega o SuperAdmin)
router.get('/pending/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  
  // Verifica che l'utente sia admin della lega o SuperAdmin
  const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
  
  if (!isSuperAdmin) {
    const db = req.app.locals.db;
    db.get('SELECT admin_id FROM leghe WHERE id = ?', [legaId], (err, lega) => {
      if (err) {
        console.error('Errore verifica admin lega:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      if (!lega) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      if (lega.admin_id !== userId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
      }
      
      getPendingChangesByLega(legaId, (err, changes) => {
        if (err) {
          console.error('Errore recupero modifiche in attesa:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        res.json({ changes });
      });
    });
  } else {
    // Se è SuperAdmin, procedi direttamente
    getPendingChangesByLega(legaId, (err, changes) => {
      if (err) {
        console.error('Errore recupero modifiche in attesa:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      res.json({ changes });
    });
  }
});

// Approva modifica (admin della lega o SuperAdmin)
router.post('/approve/:changeId', requireAuth, (req, res) => {
  const changeId = req.params.changeId;
  const { adminResponse } = req.body;
  const userId = req.user.id;
  
  // Verifica che l'utente sia SuperAdmin
  const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
  
  // Prima ottieni la modifica per verificare la lega
  getChangeById(changeId, (err, change) => {
    if (err) {
      console.error('Errore recupero modifica:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    if (!change) {
      return res.status(404).json({ error: 'Modifica non trovata' });
    }
    
    if (isSuperAdmin) {
      // Se è SuperAdmin, procedi direttamente
      approveChange(changeId, adminResponse || 'Approvato', (err, changes) => {
        if (err) {
          console.error('Errore approvazione modifica:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        res.json({ success: true, changes });
      });
    } else {
      // Verifica che l'utente sia admin della lega
      const db = req.app.locals.db;
      db.get('SELECT admin_id FROM leghe WHERE id = ?', [change.lega_id], (err, lega) => {
        if (err) {
          console.error('Errore verifica admin lega:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        
        if (lega.admin_id !== userId) {
          return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
        }
        
        approveChange(changeId, adminResponse || 'Approvato', (err, changes) => {
          if (err) {
            console.error('Errore approvazione modifica:', err);
            return res.status(500).json({ error: 'Errore DB', details: err.message });
          }
          res.json({ success: true, changes });
        });
      });
    }
  });
});

// Rifiuta modifica (admin della lega o SuperAdmin)
router.post('/reject/:changeId', requireAuth, (req, res) => {
  const changeId = req.params.changeId;
  const { adminResponse } = req.body;
  const userId = req.user.id;
  
  // Verifica che l'utente sia SuperAdmin
  const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
  
  // Prima ottieni la modifica per verificare la lega
  getChangeById(changeId, (err, change) => {
    if (err) {
      console.error('Errore recupero modifica:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    if (!change) {
      return res.status(404).json({ error: 'Modifica non trovata' });
    }
    
    if (isSuperAdmin) {
      // Se è SuperAdmin, procedi direttamente
      rejectChange(changeId, adminResponse || 'Rifiutato', (err, changes) => {
        if (err) {
          console.error('Errore rifiuto modifica:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        res.json({ success: true, changes });
      });
    } else {
      // Verifica che l'utente sia admin della lega
      const db = req.app.locals.db;
      db.get('SELECT admin_id FROM leghe WHERE id = ?', [change.lega_id], (err, lega) => {
        if (err) {
          console.error('Errore verifica admin lega:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        
        if (lega.admin_id !== userId) {
          return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
        }
        
        rejectChange(changeId, adminResponse || 'Rifiutato', (err, changes) => {
          if (err) {
            console.error('Errore rifiuto modifica:', err);
            return res.status(500).json({ error: 'Errore DB', details: err.message });
          }
          res.json({ success: true, changes });
        });
      });
    }
  });
});

// Ottieni storico modifiche di una lega (admin della lega o SuperAdmin)
router.get('/history/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  
  // Verifica che l'utente sia admin della lega o SuperAdmin
  const isSuperAdmin = req.user.ruolo === 'superadmin' || req.user.ruolo === 'SuperAdmin';
  
  if (!isSuperAdmin) {
    const db = req.app.locals.db;
    db.get('SELECT admin_id FROM leghe WHERE id = ?', [legaId], (err, lega) => {
      if (err) {
        console.error('Errore verifica admin lega:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      if (!lega) {
        return res.status(404).json({ error: 'Lega non trovata' });
      }
      
      if (lega.admin_id !== userId) {
        return res.status(403).json({ error: 'Accesso negato: richiesto Admin della lega o SuperAdmin' });
      }
      
      getChangeHistory(legaId, (err, changes) => {
        if (err) {
          console.error('Errore recupero storico modifiche:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        res.json({ changes });
      });
    });
  } else {
    // Se è SuperAdmin, procedi direttamente
    getChangeHistory(legaId, (err, changes) => {
      if (err) {
        console.error('Errore recupero storico modifiche:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      res.json({ changes });
    });
  }
});

// Ottieni storico modifiche di un subadmin
router.get('/history', requireAuth, (req, res) => {
  const userId = req.user.id;
  
  getChangeHistoryBySubadmin(userId, (err, changes) => {
    if (err) {
      console.error('Errore recupero storico modifiche subadmin:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    res.json({ changes });
  });
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
router.post('/request', requireAuth, (req, res) => {
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
  isSubadmin(legaId, userId, (err, isSub, permissions) => {
    if (err) {
      console.error('Errore verifica subadmin:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
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
    createPendingChange(legaId, userId, tipo, modifiche, descrizione, dettagli, (err, changeId) => {
      if (err) {
        console.error('Errore creazione richiesta modifica:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      console.log('Richiesta modifica creata con successo, ID:', changeId);
      res.json({ success: true, changeId });
    });
  });
});

// Annulla modifica in attesa (solo il subadmin che l'ha creata)
router.delete('/cancel/:changeId', requireAuth, (req, res) => {
  const changeId = req.params.changeId;
  const userId = req.user.id;
  
  console.log('=== DEBUG: Richiesta DELETE /api/subadmin/cancel/:changeId ===');
  console.log('User ID:', userId);
  console.log('Change ID:', changeId);
  
  // Prima ottieni la modifica per verificare che appartenga al subadmin
  getChangeById(changeId, (err, change) => {
    if (err) {
      console.error('Errore recupero modifica:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
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
    deletePendingChange(changeId, (err, changes) => {
      if (err) {
        console.error('Errore eliminazione modifica:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      console.log('Modifica annullata con successo');
      res.json({ success: true, message: 'Modifica annullata con successo' });
    });
  });
});

export default router; 