import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getGiocatoreById, updateGiocatore, createGiocatore, deleteGiocatore } from '../models/giocatore.js';
import { getLegaById } from '../models/lega.js';
import { getDb } from '../db/config.js';

const router = express.Router();
const db = getDb();

// Ottieni i dettagli di un giocatore
router.get('/:giocatoreId', requireAuth, (req, res) => {
  const giocatoreId = req.params.giocatoreId;
  db.get(`
    SELECT g.*, 
           COALESCE(g.qa, 0) as qa_scraping,
           COALESCE(g.qi, 0) as qi_scraping
    FROM giocatori g 
    WHERE g.id = ?
  `, [giocatoreId], (err, giocatore) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!giocatore) return res.status(404).json({ error: 'Giocatore non trovato' });
    res.json({ giocatore });
  });
});

// Ottieni giocatori di una squadra
router.get('/squadra/:squadraId', requireAuth, (req, res) => {
  const squadraId = req.params.squadraId;
  db.all(`
    SELECT g.*, 
           COALESCE(g.qa, 0) as qa_scraping,
           COALESCE(g.qi, 0) as qi_scraping
    FROM giocatori g 
    WHERE g.squadra_id = ?
  `, [squadraId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ giocatori: rows });
  });
});

// Rinnovo contratto per uno o più giocatori
router.post('/rinnovo-contratto', requireAuth, (req, res) => {
  const { rinnovi } = req.body; // [{ giocatore_id, anni_contratto, nuovo_salario }]
  if (!Array.isArray(rinnovi) || rinnovi.length === 0) return res.status(400).json({ error: 'Nessun rinnovo fornito' });
  let completati = 0;
  let errori = [];
  rinnovi.forEach(r => {
    updateGiocatore(r.giocatore_id, {
      anni_contratto: r.anni_contratto,
      salario: r.nuovo_salario || undefined
    }, err => {
      if (err) errori.push({ giocatore_id: r.giocatore_id, error: err.message });
      completati++;
      if (completati === rinnovi.length) {
        if (errori.length > 0) return res.status(500).json({ error: 'Alcuni rinnovi falliti', dettagli: errori });
        res.json({ success: true });
      }
    });
  });
});

// Aggiorna triggers di un giocatore
router.post('/update-triggers', requireAuth, (req, res) => {
  const { giocatore_id, triggers } = req.body;
  if (!giocatore_id) return res.status(400).json({ error: 'ID giocatore mancante' });
  updateGiocatore(giocatore_id, { triggers: typeof triggers === 'object' ? JSON.stringify(triggers) : triggers }, err => {
    if (err) return res.status(500).json({ error: 'Errore aggiornamento triggers', details: err.message });
    res.json({ success: true });
  });
});

// Ottieni più giocatori per ID (batch)
router.post('/batch', requireAuth, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Nessun ID fornito' });
  const placeholders = ids.map(() => '?').join(',');
  db.all(`SELECT * FROM giocatori WHERE id IN (${placeholders})`, ids, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ giocatori: rows });
  });
});

// Ottieni tutti i giocatori di una lega
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  db.all(`
    SELECT g.*, 
           COALESCE(g.qa, 0) as qa_scraping,
           COALESCE(g.qi, 0) as qi_scraping
    FROM giocatori g 
    WHERE g.lega_id = ?
  `, [legaId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ giocatori: rows });
  });
});

// Crea nuovo giocatore (solo trinità: superadmin, admin della lega, subadmin)
router.post('/', requireAuth, (req, res) => {
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;
  const giocatoreData = req.body;

  // Verifica permessi
  const canCreate = async () => {
    // Superadmin può creare tutto
    if (userRole === 'superadmin') return true;
    
    // Subadmin può creare
    if (userRole === 'subadmin') return true;
    
    // Admin può creare solo nella sua lega
    if (userRole === 'admin') {
      const lega = await new Promise((resolve, reject) => {
        db.get('SELECT admin_id FROM leghe WHERE id = ?', [giocatoreData.lega_id], (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });
      
      return lega && lega.admin_id === utenteId;
    }
    
    return false;
  };

  canCreate()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Non hai i permessi per creare giocatori' });
      }
      
      // Validazioni
      if (!giocatoreData.nome || !giocatoreData.ruolo) {
        return res.status(400).json({ error: 'Nome e ruolo sono obbligatori' });
      }
      
      // Crea il giocatore
      createGiocatore(giocatoreData, (err, giocatoreId) => {
        if (err) return res.status(500).json({ error: 'Errore creazione giocatore', details: err.message });
        res.json({ success: true, message: 'Giocatore creato con successo', giocatoreId });
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore verifica permessi', details: err.message });
    });
});

// Aggiorna giocatore (solo trinità: superadmin, admin della lega, subadmin)
router.put('/:id', requireAuth, (req, res) => {
  const giocatoreId = req.params.id;
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;
  const updateData = req.body;

  // Verifica permessi
  const canEdit = async () => {
    // Superadmin può modificare tutto
    if (userRole === 'superadmin') return true;
    
    // Subadmin può modificare
    if (userRole === 'subadmin') return true;
    
    // Admin può modificare solo i giocatori della sua lega
    if (userRole === 'admin') {
      const giocatore = await new Promise((resolve, reject) => {
        getGiocatoreById(giocatoreId, (err, giocatore) => {
          if (err) reject(err);
          else resolve(giocatore);
        });
      });
      
      if (!giocatore) return false;
      
      // Verifica che l'admin sia admin della lega del giocatore
      const lega = await new Promise((resolve, reject) => {
        db.get('SELECT admin_id FROM leghe WHERE id = ?', [giocatore.lega_id], (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });
      
      return lega && lega.admin_id === utenteId;
    }
    
    return false;
  };

  canEdit()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Non hai i permessi per modificare questo giocatore' });
      }
      
      // Aggiorna il giocatore
      updateGiocatore(giocatoreId, updateData, (err) => {
        if (err) return res.status(500).json({ error: 'Errore aggiornamento giocatore', details: err.message });
        res.json({ success: true, message: 'Giocatore aggiornato con successo' });
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore verifica permessi', details: err.message });
    });
});

// Elimina giocatore (solo trinità: superadmin, admin della lega, subadmin)
router.delete('/:id', requireAuth, (req, res) => {
  const giocatoreId = req.params.id;
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;

  // Verifica permessi
  const canDelete = async () => {
    // Superadmin può eliminare tutto
    if (userRole === 'superadmin') return true;
    
    // Subadmin può eliminare
    if (userRole === 'subadmin') return true;
    
    // Admin può eliminare solo i giocatori della sua lega
    if (userRole === 'admin') {
      const giocatore = await new Promise((resolve, reject) => {
        getGiocatoreById(giocatoreId, (err, giocatore) => {
          if (err) reject(err);
          else resolve(giocatore);
        });
      });
      
      if (!giocatore) return false;
      
      // Verifica che l'admin sia admin della lega del giocatore
      const lega = await new Promise((resolve, reject) => {
        db.get('SELECT admin_id FROM leghe WHERE id = ?', [giocatore.lega_id], (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });
      
      return lega && lega.admin_id === utenteId;
    }
    
    return false;
  };

  canDelete()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Non hai i permessi per eliminare questo giocatore' });
      }
      
      // Elimina il giocatore
      deleteGiocatore(giocatoreId, (err) => {
        if (err) return res.status(500).json({ error: 'Errore eliminazione giocatore', details: err.message });
        res.json({ success: true, message: 'Giocatore eliminato con successo' });
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore verifica permessi', details: err.message });
    });
});

// Trasferisci giocatore (solo trinità: superadmin, admin della lega, subadmin)
router.post('/:id/transfer', requireAuth, (req, res) => {
  const giocatoreId = req.params.id;
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;
  const { squadra_destinazione_id, costo, ingaggio, anni_contratto } = req.body;

  // Validazioni
  if (!squadra_destinazione_id) {
    return res.status(400).json({ error: 'ID squadra destinazione mancante' });
  }

  if (costo === undefined || costo < 0) {
    return res.status(400).json({ error: 'Costo deve essere un numero positivo' });
  }

  if (ingaggio === undefined || ingaggio < 0) {
    return res.status(400).json({ error: 'Ingaggio deve essere un numero positivo' });
  }

  if (anni_contratto === undefined || anni_contratto < 1) {
    return res.status(400).json({ error: 'Durata contratto deve essere almeno 1 anno' });
  }

  // Verifica permessi
  const canTransfer = async () => {
    // Superadmin può trasferire tutto
    if (userRole === 'superadmin') return true;
    
    // Subadmin può trasferire
    if (userRole === 'subadmin') return true;
    
    // Admin può trasferire solo nella sua lega
    if (userRole === 'admin') {
      const giocatore = await new Promise((resolve, reject) => {
        getGiocatoreById(giocatoreId, (err, giocatore) => {
          if (err) reject(err);
          else resolve(giocatore);
        });
      });
      
      if (!giocatore) return false;
      
      // Verifica che l'admin sia admin della lega del giocatore
      const lega = await new Promise((resolve, reject) => {
        db.get('SELECT admin_id FROM leghe WHERE id = ?', [giocatore.lega_id], (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });
      
      return lega && lega.admin_id === utenteId;
    }
    
    return false;
  };

  canTransfer()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Non hai i permessi per trasferire questo giocatore' });
      }
      
      // Verifica che la squadra destinazione esista e sia nella stessa lega
      db.get('SELECT * FROM squadre WHERE id = ?', [squadra_destinazione_id], (err, squadraDest) => {
        if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
        if (!squadraDest) return res.status(404).json({ error: 'Squadra destinazione non trovata' });
        
        // Verifica che la squadra destinazione abbia fondi sufficienti
        if (squadraDest.casse_societarie < costo) {
          return res.status(400).json({ error: 'Squadra destinazione non ha fondi sufficienti' });
        }
        
        // Ottieni il giocatore
        getGiocatoreById(giocatoreId, (err, giocatore) => {
          if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
          if (!giocatore) return res.status(404).json({ error: 'Giocatore non trovato' });
          
          // Verifica che le squadre siano nella stessa lega
          if (giocatore.lega_id !== squadraDest.lega_id) {
            return res.status(400).json({ error: 'Le squadre devono essere nella stessa lega' });
          }
          
          // Verifica che la squadra destinazione abbia slot disponibili
          db.all('SELECT COUNT(*) as count FROM giocatori WHERE squadra_id = ?', [squadra_destinazione_id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
            
            const currentPlayers = result[0].count;
            const maxPlayers = 30; // Default, ma dovrebbe essere preso dalla lega
            
            // Ottieni il numero massimo di giocatori dalla lega
            db.get('SELECT max_giocatori FROM leghe WHERE id = ?', [giocatore.lega_id], (err, lega) => {
              if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
              
              const maxGiocatori = lega ? lega.max_giocatori : 30;
              
              if (currentPlayers >= maxGiocatori) {
                return res.status(400).json({ 
                  error: `Numero massimo di giocatori raggiunto (${maxGiocatori}). Impossibile aggiungere nuovi calciatori.` 
                });
              }
              
              // Esegui il trasferimento in una transazione
              db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // Aggiorna il giocatore
                db.run(
                  'UPDATE giocatori SET squadra_id = ?, costo_attuale = ?, salario = ?, anni_contratto = ? WHERE id = ?',
                  [squadra_destinazione_id, costo, ingaggio, anni_contratto, giocatoreId],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: 'Errore aggiornamento giocatore', details: err.message });
                    }
                    
                    // Sottrai il costo dalle casse della squadra destinazione
                    db.run(
                      'UPDATE squadre SET casse_societarie = casse_societarie - ? WHERE id = ?',
                      [costo, squadra_destinazione_id],
                      function(err) {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: 'Errore aggiornamento casse squadra', details: err.message });
                        }
                        
                        db.run('COMMIT');
                        res.json({ 
                          success: true, 
                          message: 'Giocatore trasferito con successo',
                          giocatoreId,
                          squadraDestinazioneId: squadra_destinazione_id,
                          costo,
                          ingaggio,
                          anniContratto: anni_contratto
                        });
                      }
                    );
                  }
                );
              });
            });
          });
        });
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore verifica permessi', details: err.message });
    });
});

// Ottieni cronologia QA di un giocatore
router.get('/:id/qa-history', requireAuth, (req, res) => {
  const giocatoreId = req.params.id;
  
  db.all(`
    SELECT qa_value, data_registrazione, fonte 
    FROM qa_history 
    WHERE giocatore_id = ? 
    ORDER BY data_registrazione DESC 
    LIMIT 50
  `, [giocatoreId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    // Formatta le date per il frontend
    const history = rows.map(row => ({
      qa_value: row.qa_value,
      data_registrazione: row.data_registrazione,
      fonte: row.fonte
    }));
    
    res.json({ history });
  });
});

export default router; 