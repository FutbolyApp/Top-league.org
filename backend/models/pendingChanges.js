import { getDb } from '../db/postgres.js';

export function createPendingChange(legaId, subadminId, actionType, actionData, description, details, callback) {
  const db = getDb();
  const actionDataJson = JSON.stringify(actionData);
  const detailsJson = details ? JSON.stringify(details) : null;
  
  console.log('Creazione pending change:', { legaId, subadminId, actionType, description });
  
  db.run(
    'INSERT INTO pending_changes (lega_id, subadmin_id, action_type, action_data, description, details, status) VALUES (?, ?, ?, ?, ?, ?, "pending")',
    [legaId, subadminId, actionType, actionDataJson, description, detailsJson],
    function(err) {
      if (err) {
        console.error('Errore creazione modifica in attesa:', err);
        return callback(err);
      }
      
      const changeId = this.lastID;
      console.log('Pending change creata con ID:', changeId);
      
      // Crea notifica per l'admin della lega
      db.get('SELECT admin_id FROM leghe WHERE id = ?', [legaId], (err, lega) => {
        if (err) {
          console.error('Errore recupero admin lega per notifica:', err);
          // Non bloccare il processo se la notifica fallisce
          return callback(null, changeId);
        }
        
        console.log('Admin lega trovato:', lega);
        
        if (lega && lega.admin_id) {
          const messaggio = `Nuova richiesta di modifica da subadmin: ${description}`;
          console.log('Creazione notifica per admin:', { adminId: lega.admin_id, messaggio });
          
          db.run(`
            INSERT INTO notifiche (utente_id, lega_id, tipo, messaggio, data_creazione)
            VALUES (?, ?, ?, ?, datetime('now'))
          `, [lega.admin_id, legaId, 'subadmin_request', messaggio], function(err) {
            if (err) {
              console.error('Errore creazione notifica per admin:', err);
            } else {
              console.log('Notifica creata per admin, ID:', this.lastID);
            }
            callback(null, changeId);
          });
        } else {
          console.log('Nessun admin trovato per la lega:', legaId);
          callback(null, changeId);
        }
      });
    }
  );
}

export function getPendingChangesByLega(legaId, callback) {
  const db = getDb();
  
  db.all(`
    SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome, l.id as lega_id
    FROM pending_changes pc
    JOIN users u ON pc.subadmin_id = u.id
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.lega_id = ? AND pc.status = 'pending'
    ORDER BY pc.created_at DESC
  `, [legaId], (err, changes) => {
    if (err) {
      console.error('Errore recupero modifiche in attesa:', err);
      return callback(err);
    }
    
    // Parsa i dati dell'azione per ogni modifica
    changes.forEach(change => {
      try {
        change.action_data = JSON.parse(change.action_data || '{}');
      } catch (e) {
        change.action_data = {};
      }
    });
    
    callback(null, changes);
  });
}

export function getPendingChangesBySubadmin(subadminId, callback) {
  const db = getDb();
  
  db.all(`
    SELECT pc.*, l.nome as lega_nome, l.id as lega_id
    FROM pending_changes pc
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.subadmin_id = ? AND pc.status = 'pending'
    ORDER BY pc.created_at DESC
  `, [subadminId], (err, changes) => {
    if (err) {
      console.error('Errore recupero modifiche subadmin:', err);
      return callback(err);
    }
    
    // Parsa i dati dell'azione per ogni modifica
    changes.forEach(change => {
      try {
        change.action_data = JSON.parse(change.action_data || '{}');
      } catch (e) {
        change.action_data = {};
      }
    });
    
    callback(null, changes);
  });
}

import { updateSquadra } from './squadra.js';
import { updateGiocatorePartial } from './giocatore.js';

export function approveChange(changeId, adminResponse, callback) {
  const db = getDb();
  
  // Prima recupera i dati della modifica
  db.get('SELECT * FROM pending_changes WHERE id = ?', [changeId], (err, change) => {
    if (err) {
      console.error('Errore recupero modifica per approvazione:', err);
      return callback(err);
    }
    
    if (!change) {
      return callback(new Error('Modifica non trovata'));
    }
    
    // Parsa i dati dell'azione
    let actionData;
    try {
      actionData = JSON.parse(change.action_data || '{}');
      console.log('=== DEBUG APPROVAZIONE - ACTION DATA PARSED ===');
      console.log('ActionData raw:', change.action_data);
      console.log('ActionData parsed:', JSON.stringify(actionData, null, 2));
    } catch (e) {
      console.error('Errore parsing action_data:', e);
      return callback(e);
    }
    
    console.log('=== DEBUG APPROVAZIONE - CONTROLLO CONDIZIONI ===');
    console.log('actionData.squadreModifiche:', actionData.squadreModifiche);
    console.log('actionData.modifiche:', actionData.modifiche);
    console.log('actionData.giocatoreId:', actionData.giocatoreId);
    
    // Applica le modifiche alle squadre se presenti
    if (actionData.squadreModifiche && Object.keys(actionData.squadreModifiche).length > 0) {
      const squadreToUpdate = Object.entries(actionData.squadreModifiche);
      let updateCount = 0;
      let updateErrors = [];
      
      // Applica ogni modifica
      squadreToUpdate.forEach(([squadraId, modifiche]) => {
        // Prima recupera i dati attuali della squadra
        db.get('SELECT * FROM squadre WHERE id = ?', [squadraId], (err, squadra) => {
          if (err) {
            console.error(`Errore recupero squadra ${squadraId}:`, err);
            updateErrors.push(`Errore recupero squadra ${squadraId}: ${err.message}`);
            return;
          }
          
          if (!squadra) {
            console.error(`Squadra ${squadraId} non trovata`);
            updateErrors.push(`Squadra ${squadraId} non trovata`);
            return;
          }
          
          // Applica le modifiche
          const updatedSquadra = { ...squadra };
          Object.entries(modifiche).forEach(([campo, nuovoValore]) => {
            updatedSquadra[campo] = nuovoValore;
          });
          
          // Aggiorna la squadra
          updateSquadra(squadraId, updatedSquadra, (err) => {
            if (err) {
              console.error(`Errore aggiornamento squadra ${squadraId}:`, err);
              updateErrors.push(`Errore aggiornamento squadra ${squadraId}: ${err.message}`);
            } else {
              console.log(`Squadra ${squadraId} aggiornata con successo`);
              updateCount++;
            }
            
            // Se tutte le modifiche sono state processate, aggiorna lo status
            if (updateCount + updateErrors.length === squadreToUpdate.length) {
              if (updateErrors.length > 0) {
                console.error('Errori durante l\'aggiornamento delle squadre:', updateErrors);
                return callback(new Error(`Errori durante l'aggiornamento: ${updateErrors.join(', ')}`));
              }
              
              // Aggiorna lo status della modifica
              db.run(
                'UPDATE pending_changes SET status = "approved", admin_response = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
                [adminResponse, changeId],
                function(err) {
                  if (err) {
                    console.error('Errore aggiornamento status modifica:', err);
                    return callback(err);
                  }
                  console.log(`Modifica ${changeId} approvata e applicata con successo`);
                  callback(null, this.changes);
                }
              );
            }
          });
        });
      });
    } else if (actionData.modifiche && actionData.modifiche.giocatoreId && actionData.modifiche.modifiche) {
      // Gestione modifiche giocatori (struttura nested)
      console.log('=== DEBUG APPROVAZIONE MODIFICA ===');
      console.log('ActionData completo:', JSON.stringify(actionData, null, 2));
      console.log('Giocatore ID:', actionData.modifiche.giocatoreId);
      console.log('Modifiche da applicare:', JSON.stringify(actionData.modifiche.modifiche, null, 2));
      console.log('Valori originali:', JSON.stringify(actionData.modifiche.valoriOriginali, null, 2));
      
      // Applica le modifiche al giocatore
      updateGiocatorePartial(actionData.modifiche.giocatoreId, actionData.modifiche.modifiche, (err) => {
        if (err) {
          console.error('Errore aggiornamento giocatore:', err);
          return callback(err);
        }
        
        console.log(`Giocatore ${actionData.modifiche.giocatoreId} aggiornato con successo`);
        
        // Aggiorna lo status della modifica
        db.run(
          'UPDATE pending_changes SET status = "approved", admin_response = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
          [adminResponse, changeId],
          function(err) {
            if (err) {
              console.error('Errore aggiornamento status modifica:', err);
              return callback(err);
            }
            console.log(`Modifica ${changeId} approvata e applicata con successo`);
            callback(null, this.changes);
          }
        );
      });
    } else if (actionData.giocatoreId && actionData.modifiche) {
      // Gestione modifiche giocatori (struttura flat - per compatibilità)
      console.log('Applicando modifiche al giocatore:', actionData.giocatoreId);
      
      // Applica le modifiche al giocatore
      updateGiocatorePartial(actionData.giocatoreId, actionData.modifiche, (err) => {
        if (err) {
          console.error('Errore aggiornamento giocatore:', err);
          return callback(err);
        }
        
        console.log(`Giocatore ${actionData.giocatoreId} aggiornato con successo`);
        
        // Aggiorna lo status della modifica
        db.run(
          'UPDATE pending_changes SET status = "approved", admin_response = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
          [adminResponse, changeId],
          function(err) {
            if (err) {
              console.error('Errore aggiornamento status modifica:', err);
              return callback(err);
            }
            console.log(`Modifica ${changeId} approvata e applicata con successo`);
            callback(null, this.changes);
          }
        );
      });
    } else {
      // Se non ci sono modifiche alle squadre o ai giocatori, aggiorna solo lo status
  db.run(
    'UPDATE pending_changes SET status = "approved", admin_response = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
    [adminResponse, changeId],
    function(err) {
      if (err) {
        console.error('Errore approvazione modifica:', err);
        return callback(err);
      }
      callback(null, this.changes);
    }
  );
    }
  });
}

export function rejectChange(changeId, adminResponse, callback) {
  const db = getDb();
  
  db.run(
    'UPDATE pending_changes SET status = "rejected", admin_response = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
    [adminResponse, changeId],
    function(err) {
      if (err) {
        console.error('Errore rifiuto modifica:', err);
        return callback(err);
      }
      callback(null, this.changes);
    }
  );
}

export function getChangeById(changeId, callback) {
  const db = getDb();
  
  db.get(`
    SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome, l.id as lega_id
    FROM pending_changes pc
    JOIN users u ON pc.subadmin_id = u.id
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.id = ?
  `, [changeId], (err, change) => {
    if (err) {
      console.error('Errore recupero modifica:', err);
      return callback(err);
    }
    
    if (change) {
      try {
        change.action_data = JSON.parse(change.action_data || '{}');
      } catch (e) {
        change.action_data = {};
      }
    }
    
    callback(null, change);
  });
}

export function getAllPendingChanges(callback) {
  const db = getDb();
  
  db.all(`
    SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome, l.id as lega_id
    FROM pending_changes pc
    JOIN users u ON pc.subadmin_id = u.id
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.status = 'pending'
    ORDER BY pc.created_at DESC
  `, [], (err, changes) => {
    if (err) {
      console.error('Errore recupero tutte modifiche:', err);
      return callback(err);
    }
    
    // Parsa i dati dell'azione per ogni modifica
    changes.forEach(change => {
      try {
        change.action_data = JSON.parse(change.action_data || '{}');
      } catch (e) {
        change.action_data = {};
      }
    });
    
    callback(null, changes);
  });
}

export function getChangeHistory(legaId, callback) {
  const db = getDb();
  
  db.all(`
    SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome, l.id as lega_id
    FROM pending_changes pc
    JOIN users u ON pc.subadmin_id = u.id
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.lega_id = ? AND pc.status IN ('approved', 'rejected')
    ORDER BY pc.reviewed_at DESC
  `, [legaId], (err, changes) => {
    if (err) {
      console.error('Errore recupero storico modifiche:', err);
      return callback(err);
    }
    
    // Parsa i dati dell'azione per ogni modifica
    changes.forEach(change => {
      try {
        change.action_data = JSON.parse(change.action_data || '{}');
      } catch (e) {
        change.action_data = {};
      }
    });
    
    callback(null, changes);
  });
}

export function getChangeHistoryBySubadmin(subadminId, callback) {
  const db = getDb();
  
  db.all(`
    SELECT pc.*, l.nome as lega_nome, l.id as lega_id, u.username, u.nome, u.cognome
    FROM pending_changes pc
    JOIN leghe l ON pc.lega_id = l.id
    JOIN users u ON pc.subadmin_id = u.id
    WHERE pc.subadmin_id = ? AND pc.status IN ('approved', 'rejected')
    ORDER BY pc.reviewed_at DESC
  `, [subadminId], (err, changes) => {
    if (err) {
      console.error('Errore recupero storico modifiche subadmin:', err);
      return callback(err);
    }
    
    // Parsa i dati dell'azione per ogni modifica
    changes.forEach(change => {
      try {
        change.action_data = JSON.parse(change.action_data || '{}');
      } catch (e) {
        change.action_data = {};
      }
    });
    
    callback(null, changes);
  });
}

export function deletePendingChange(changeId, callback) {
  const db = getDb();
  
  db.run('DELETE FROM pending_changes WHERE id = ?', [changeId], function(err) {
    if (err) {
      console.error('Errore eliminazione modifica:', err);
      return callback(err);
    }
    callback(null, this.changes);
  });
}

export function getPendingChangesCount(legaId, callback) {
  const db = getDb();
  
  db.get(
    'SELECT COUNT(*) as count FROM pending_changes WHERE lega_id = ? AND status = "pending"',
    [legaId],
    (err, result) => {
      if (err) {
        console.error('Errore conteggio modifiche in attesa:', err);
        return callback(err);
      }
      callback(null, result ? result.count : 0);
    }
  );
}

export function getPendingChangesCountBySubadmin(subadminId, callback) {
  const db = getDb();
  
  db.get(
    'SELECT COUNT(*) as count FROM pending_changes WHERE subadmin_id = ? AND status = "pending"',
    [subadminId],
    (err, result) => {
      if (err) {
        console.error('Errore conteggio modifiche subadmin:', err);
        return callback(err);
      }
      callback(null, result ? result.count : 0);
    }
  );
} 