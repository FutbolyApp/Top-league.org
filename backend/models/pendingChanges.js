import { getDb } from '../db/mariadb.js';
import { updateSquadra } from './squadra.js';
import { updateGiocatorePartial } from './giocatore.js';

export async function createPendingChange(legaId, subadminId, actionType, actionData, description, details) {
  const db = getDb();
  const actionDataJson = JSON.stringify(actionData);
  const detailsJson = details ? JSON.stringify(details) : null;
  
  console.log('Creazione pending change:', { legaId, subadminId, actionType, description });
  
  const result = await db.query(
    'INSERT INTO pending_changes (lega_id, subadmin_id, action_type, action_data, description, details, status) VALUES (?, ?, ?, ?, ?, ?, \'pending\')',
    [legaId, subadminId, actionType, actionDataJson, description, detailsJson]
  );
  
  const changeId = result.insertId;
  console.log('Pending change creata con ID:', changeId);
  
  // Crea notifica per l'admin della lega
  try {
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = ?', [legaId]);
    
    console.log('Admin lega trovato:', legaResult.rows[0]);
    
    if (legaResult.rows.length > 0 && legaResult.rows[0].admin_id) {
      const messaggio = `Nuova richiesta di modifica da subadmin: ${description}`;
      console.log('Creazione notifica per admin:', { adminId: legaResult.rows[0].admin_id, messaggio });
      
      const notificaResult = await db.query(`
        INSERT INTO notifiche (utente_id, lega_id, tipo, messaggio, data_creazione)
        VALUES (?, ?, ?, ?, NOW())
      `, [legaResult.rows[0].admin_id, legaId, 'subadmin_request', messaggio]);
      
      console.log('Notifica creata per admin, ID:', notificaResult.insertId);
    } else {
      console.log('Nessun admin trovato per la lega:', legaId);
    }
  } catch (error) {
    console.error('Errore creazione notifica per admin:', error);
    // Non bloccare il processo se la notifica fallisce
  }
  
  return changeId;
}

export async function getPendingChangesByLega(legaId) {
  const db = getDb();
  
  const result = await db.query(`
    SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome, l.id as lega_id
    FROM pending_changes pc
    JOIN users u ON pc.subadmin_id = u.id
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.lega_id = ? AND pc.status = 'pending'
    ORDER BY pc.created_at DESC
  `, [legaId]);
  
  // Parsa i dati dell'azione per ogni modifica
  const changes = result.rows.map(change => {
    try {
      change.action_data = JSON.parse(change.action_data || '{}');
    } catch (e) {
      change.action_data = {};
    }
    return change;
  });
  
  return changes;
}

export async function getPendingChangesBySubadmin(subadminId) {
  const db = getDb();
  
  const result = await db.query(`
    SELECT pc.*, l.nome as lega_nome, l.id as lega_id
    FROM pending_changes pc
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.subadmin_id = ? AND pc.status = 'pending'
    ORDER BY pc.created_at DESC
  `, [subadminId]);
  
  // Parsa i dati dell'azione per ogni modifica
  const changes = result.rows.map(change => {
    try {
      change.action_data = JSON.parse(change.action_data || '{}');
    } catch (e) {
      change.action_data = {};
    }
    return change;
  });
  
  return changes;
}

export async function approveChange(changeId, adminResponse) {
  const db = getDb();
  
  // Prima recupera i dati della modifica
  const changeResult = await db.query('SELECT * FROM pending_changes WHERE id = $1', [changeId]);
  
  if (changeResult.rows.length === 0) {
    throw new Error('Modifica non trovata');
  }
  
  const change = changeResult.rows[0];
  
  // Parsa i dati dell'azione
  let actionData;
  try {
    actionData = JSON.parse(change.action_data || '{}');
    console.log('=== DEBUG APPROVAZIONE - ACTION DATA PARSED ===');
    console.log('ActionData raw:', change.action_data);
    console.log('ActionData parsed:', JSON.stringify(actionData, null, 2));
  } catch (e) {
    console.error('Errore parsing action_data:', e);
    throw e;
  }
  
  console.log('=== DEBUG APPROVAZIONE - CONTROLLO CONDIZIONI ===');
  console.log('actionData.squadreModifiche:', actionData.squadreModifiche);
  console.log('actionData.modifiche:', actionData.modifiche);
  console.log('actionData.giocatoreId:', actionData.giocatoreId);
  
  // Applica le modifiche alle squadre se presenti
  if (actionData.squadreModifiche && Object.keys(actionData.squadreModifiche).length > 0) {
    const squadreToUpdate = Object.entries(actionData.squadreModifiche);
    let updateErrors = [];
    
    // Applica ogni modifica
    for (const [squadraId, modifiche] of squadreToUpdate) {
      try {
        // Prima recupera i dati attuali della squadra
        const squadraResult = await db.query('SELECT * FROM squadre WHERE id = $1', [squadraId]);
        
        if (squadraResult.rows.length === 0) {
          console.error(`Squadra ${squadraId} non trovata`);
          updateErrors.push(`Squadra ${squadraId} non trovata`);
          continue;
        }
        
        const squadra = squadraResult.rows[0];
        
        // Applica le modifiche
        const updatedSquadra = { ...squadra };
        Object.entries(modifiche).forEach(([campo, nuovoValore]) => {
          updatedSquadra[campo] = nuovoValore;
        });
        
        // Aggiorna la squadra
        await updateSquadra(squadraId, updatedSquadra);
        console.log(`Squadra ${squadraId} aggiornata con successo`);
      } catch (error) {
        console.error(`Errore aggiornamento squadra ${squadraId}:`, error);
        updateErrors.push(`Errore aggiornamento squadra ${squadraId}: ${error.message}`);
      }
    }
    
    if (updateErrors.length > 0) {
      console.error('Errori durante l\'aggiornamento delle squadre:', updateErrors);
      throw new Error(`Errori durante l'aggiornamento: ${updateErrors.join(', ')}`);
    }
  }
  
  // Applica modifiche ai giocatori se presenti
  if (actionData.giocatoreId && actionData.modifiche) {
    try {
      await updateGiocatorePartial(actionData.giocatoreId, actionData.modifiche);
      console.log(`Giocatore ${actionData.giocatoreId} aggiornato con successo`);
    } catch (error) {
      console.error(`Errore aggiornamento giocatore ${actionData.giocatoreId}:`, error);
      throw new Error(`Errore aggiornamento giocatore: ${error.message}`);
    }
  }
  
  // Aggiorna lo status della modifica
  await db.query(
    'UPDATE pending_changes SET status = \'approved\', admin_response = $1, reviewed_at = NOW() WHERE id = $2',
    [adminResponse, changeId]
  );
  
  console.log('Modifica approvata con successo, ID:', changeId);
  return changeId;
}

export async function rejectChange(changeId, adminResponse) {
  const db = getDb();
  
  await db.query(
    'UPDATE pending_changes SET status = \'rejected\', admin_response = $1, reviewed_at = NOW() WHERE id = $2',
    [adminResponse, changeId]
  );
  
  console.log('Modifica rifiutata con successo, ID:', changeId);
  return changeId;
}

export async function getChangeById(changeId) {
  const db = getDb();
  
  const result = await db.query(`
    SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome
    FROM pending_changes pc
    JOIN users u ON pc.subadmin_id = u.id
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.id = $1
  `, [changeId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const change = result.rows[0];
  
  // Parsa i dati dell'azione
  try {
    change.action_data = JSON.parse(change.action_data || '{}');
  } catch (e) {
    change.action_data = {};
  }
  
  return change;
}

export async function getAllPendingChanges() {
  const db = getDb();
  
  const result = await db.query(`
    SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome
    FROM pending_changes pc
    JOIN users u ON pc.subadmin_id = u.id
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.status = 'pending'
    ORDER BY pc.created_at DESC
  `);
  
  // Parsa i dati dell'azione per ogni modifica
  const changes = result.rows.map(change => {
    try {
      change.action_data = JSON.parse(change.action_data || '{}');
    } catch (e) {
      change.action_data = {};
    }
    return change;
  });
  
  return changes;
}

export async function getChangeHistory(legaId) {
  const db = getDb();
  
  const result = await db.query(`
    SELECT pc.*, u.username, u.nome, u.cognome, l.nome as lega_nome
    FROM pending_changes pc
    JOIN users u ON pc.subadmin_id = u.id
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.lega_id = $1 AND pc.status IN ('approved', 'rejected')
    ORDER BY pc.reviewed_at DESC
  `, [legaId]);
  
  // Parsa i dati dell'azione per ogni modifica
  const changes = result.rows.map(change => {
    try {
      change.action_data = JSON.parse(change.action_data || '{}');
    } catch (e) {
      change.action_data = {};
    }
    return change;
  });
  
  return changes;
}

export async function getChangeHistoryBySubadmin(subadminId) {
  const db = getDb();
  
  const result = await db.query(`
    SELECT pc.*, l.nome as lega_nome
    FROM pending_changes pc
    JOIN leghe l ON pc.lega_id = l.id
    WHERE pc.subadmin_id = $1 AND pc.status IN ('approved', 'rejected')
    ORDER BY pc.reviewed_at DESC
  `, [subadminId]);
  
  // Parsa i dati dell'azione per ogni modifica
  const changes = result.rows.map(change => {
    try {
      change.action_data = JSON.parse(change.action_data || '{}');
    } catch (e) {
      change.action_data = {};
    }
    return change;
  });
  
  return changes;
}

export async function deletePendingChange(changeId) {
  const db = getDb();
  
  await db.query('DELETE FROM pending_changes WHERE id = $1', [changeId]);
  
  console.log('Modifica eliminata con successo, ID:', changeId);
  return changeId;
}

export async function getPendingChangesCount(legaId) {
  const db = getDb();
  
  const result = await db.query(
    'SELECT COUNT(*) as count FROM pending_changes WHERE lega_id = $1 AND status = \'pending\'',
    [legaId]
  );
  
  return result.rows[0].count;
}

export async function getPendingChangesCountBySubadmin(subadminId) {
  const db = getDb();
  
  const result = await db.query(
    'SELECT COUNT(*) as count FROM pending_changes WHERE subadmin_id = $1 AND status = \'pending\'',
    [subadminId]
  );
  
  return result.rows[0].count;
} 