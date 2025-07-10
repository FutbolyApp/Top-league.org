import { getDb } from '../db/config.js';

export function addSubadmin(legaId, userId, permissions, callback) {
  const db = getDb();
  const permissionsJson = JSON.stringify(permissions);
  
  console.log('addSubadmin - Parametri:', { legaId, userId, permissions, permissionsJson });
  
  db.run(
    'INSERT OR REPLACE INTO subadmin (lega_id, utente_id, permessi, attivo, data_nomina) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
    [legaId, userId, permissionsJson],
    function(err) {
      if (err) {
        console.error('Errore aggiunta subadmin:', err);
        return callback(err);
      }
      console.log('Subadmin inserito nel DB, lastID:', this.lastID, 'changes:', this.changes);
      callback(null, this.lastID);
    }
  );
}

export function removeSubadmin(legaId, userId, callback) {
  const db = getDb();
  
  db.run(
    'UPDATE subadmin SET attivo = 0 WHERE lega_id = ? AND utente_id = ?',
    [legaId, userId],
    function(err) {
      if (err) {
        console.error('Errore rimozione subadmin:', err);
        return callback(err);
      }
      callback(null, this.changes);
    }
  );
}

export function getSubadminsByLega(legaId, callback) {
  const db = getDb();
  
  console.log('getSubadminsByLega - Cercando subadmin per lega:', legaId);
  
  db.all(`
    SELECT s.*, u.username, u.nome, u.cognome, u.email
    FROM subadmin s
    JOIN users u ON s.utente_id = u.id
    WHERE s.lega_id = ? AND s.attivo = 1
    ORDER BY s.data_nomina DESC
  `, [legaId], (err, subadmins) => {
    if (err) {
      console.error('Errore recupero subadmin:', err);
      return callback(err);
    }
    
    console.log('getSubadminsByLega - Subadmin trovati (raw):', subadmins);
    
    // Parsa i permessi JSON per ogni subadmin
    subadmins.forEach(subadmin => {
      try {
        subadmin.permessi = JSON.parse(subadmin.permessi || '{}');
      } catch (e) {
        subadmin.permessi = {};
      }
    });
    
    console.log('getSubadminsByLega - Subadmin trovati (parsed):', subadmins);
    callback(null, subadmins);
  });
}

export function isSubadmin(legaId, userId, callback) {
  const db = getDb();
  
  db.get(
    'SELECT * FROM subadmin WHERE lega_id = ? AND utente_id = ? AND attivo = 1',
    [legaId, userId],
    (err, subadmin) => {
      if (err) {
        console.error('Errore verifica subadmin:', err);
        return callback(err);
      }
      
      if (!subadmin) {
        return callback(null, false, null);
      }
      
      try {
        const permissions = JSON.parse(subadmin.permessi || '{}');
        callback(null, true, permissions);
      } catch (e) {
        callback(null, true, {});
      }
    }
  );
}

export function hasPermission(legaId, userId, permission, callback) {
  isSubadmin(legaId, userId, (err, isSub, permissions) => {
    if (err) return callback(err);
    if (!isSub) return callback(null, false);
    
    const hasPerm = permissions[permission] === true;
    callback(null, hasPerm);
  });
}

export function getAllSubadmins(callback) {
  const db = getDb();
  
  db.all(`
    SELECT s.*, u.username, u.nome, u.cognome, u.email, l.nome as lega_nome
    FROM subadmin s
    JOIN users u ON s.utente_id = u.id
    JOIN leghe l ON s.lega_id = l.id
    WHERE s.attivo = 1
    ORDER BY l.nome, s.data_nomina DESC
  `, [], (err, subadmins) => {
    if (err) {
      console.error('Errore recupero tutti subadmin:', err);
      return callback(err);
    }
    
    // Parsa i permessi JSON per ogni subadmin
    subadmins.forEach(subadmin => {
      try {
        subadmin.permessi = JSON.parse(subadmin.permessi || '{}');
      } catch (e) {
        subadmin.permessi = {};
      }
    });
    
    callback(null, subadmins);
  });
}

export function createSubAdmin(data, callback) {
  const sql = `INSERT INTO subadmin (lega_id, utente_id, attivo)
    VALUES (?, ?, ?)`;
  const db = getDb();
  db.run(sql, [
    data.lega_id,
    data.utente_id,
    data.attivo ? 1 : 0
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getSubAdminById(id, callback) {
  const db = getDb();
  db.get('SELECT * FROM subadmin WHERE id = ?', [id], callback);
}

export function getSubAdminByLega(lega_id, callback) {
  const db = getDb();
  db.all('SELECT * FROM subadmin WHERE lega_id = ?', [lega_id], callback);
}

export function getSubAdminByUtente(utente_id, callback) {
  const db = getDb();
  db.all('SELECT * FROM subadmin WHERE utente_id = ?', [utente_id], callback);
}

export function getAllSubAdmin(callback) {
  const db = getDb();
  db.all('SELECT * FROM subadmin', [], callback);
}

export function updateSubAdmin(id, data, callback) {
  const sql = `UPDATE subadmin SET lega_id=?, utente_id=?, attivo=? WHERE id=?`;
  const db = getDb();
  db.run(sql, [
    data.lega_id,
    data.utente_id,
    data.attivo ? 1 : 0,
    id
  ], callback);
}

export function deleteSubAdmin(id, callback) {
  const db = getDb();
  db.run('DELETE FROM subadmin WHERE id = ?', [id], callback);
} 

export function updateSubadminPermissions(legaId, userId, permissions, callback) {
  const db = getDb();
  const permissionsJson = JSON.stringify(permissions);
  
  console.log('updateSubadminPermissions - Parametri:', { legaId, userId, permissions, permissionsJson });
  
  db.run(
    'UPDATE subadmin SET permessi = ? WHERE lega_id = ? AND utente_id = ? AND attivo = 1',
    [permissionsJson, legaId, userId],
    function(err) {
      if (err) {
        console.error('Errore aggiornamento permessi subadmin:', err);
        return callback(err);
      }
      console.log('Permessi subadmin aggiornati nel DB, changes:', this.changes);
      callback(null, this.changes);
    }
  );
} 