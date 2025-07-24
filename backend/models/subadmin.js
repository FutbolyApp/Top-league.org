import { getDb } from '../db/mariadb.js';

export async function addSubadmin(legaId, userId, permissions) {
  const db = getDb();
  const permissionsJson = JSON.stringify(permissions);
  
  console.log('addSubadmin - Parametri:', { legaId, userId, permissions, permissionsJson });
  
  await db.query(
    'INSERT INTO subadmin (lega_id, utente_id, permessi, attivo, data_creazione) VALUES (?, ?, ?, true, NOW()) ON DUPLICATE KEY UPDATE permessi = VALUES(permessi), attivo = true, data_creazione = NOW()',
    [legaId, userId, permissionsJson]
  );
  
  // MariaDB doesn't support RETURNING, so we need to get the ID differently
  const result = await db.query('SELECT LAST_INSERT_ID() as id');
  // Handle MariaDB result format
  let id = null;
  if (result && typeof result === 'object' && result.rows) {
    id = result.rows[0].id;
  } else if (Array.isArray(result)) {
    id = result[0].id;
  }
  console.log('Subadmin inserito nel DB, ID:', id);
  return id;
}

export async function removeSubadmin(legaId, userId) {
  const db = getDb();
  
  const result = await db.query(
    'UPDATE subadmin SET attivo = false WHERE lega_id = ? AND utente_id = ?',
    [legaId, userId]
  );
  
  return result.affectedRows;
}

export async function getSubadminsByLega(legaId) {
  const db = getDb();
  
  console.log('getSubadminsByLega - Cercando subadmin per lega:', legaId);
  
  const result = await db.query(`
    SELECT s.*, u.username, u.nome, u.cognome, u.email
    FROM subadmin s
    JOIN users u ON s.utente_id = u.id
    WHERE s.lega_id = ? AND s.attivo = true
    ORDER BY s.data_creazione DESC
  `, [legaId]);
  
  console.log('getSubadminsByLega - Subadmin trovati (raw):', result);
  
  // Parsa i permessi JSON per ogni subadmin
  const subadmins = result.map(subadmin => {
    try {
      subadmin.permessi = JSON.parse(subadmin.permessi || '{}');
    } catch (e) {
      subadmin.permessi = {};
    }
    return subadmin;
  });
  
  console.log('getSubadminsByLega - Subadmin trovati (parsed):', subadmins);
  return subadmins;
}

export async function isSubadmin(legaId, userId) {
  const db = getDb();
  
  const result = await db.query(
    'SELECT * FROM subadmin WHERE lega_id = ? AND utente_id = ? AND attivo = true',
    [legaId, userId]
  );
  
  if (result.length === 0) {
    return false;
  }
  
  return true;
}

export async function hasPermission(legaId, userId, permission) {
  const isSub = await isSubadmin(legaId, userId);
  if (!isSub) return false;
  
  const db = getDb();
  const result = await db.query(
    'SELECT permessi FROM subadmin WHERE lega_id = ? AND utente_id = ? AND attivo = true',
    [legaId, userId]
  );
  
  // Handle MariaDB result format
  let permissionsData = null;
  if (result && typeof result === 'object' && result.rows) {
    permissionsData = result.rows[0];
  } else if (Array.isArray(result) && result.length > 0) {
    permissionsData = result[0];
  }
  
  if (!permissionsData) return false;
  
  try {
    const permissions = JSON.parse(permissionsData.permessi || '{}');
    return permissions[permission] === true;
  } catch (e) {
    return false;
  }
}

export async function getAllSubadmins() {
  const db = getDb();
  
  const result = await db.query(`
    SELECT s.*, u.username, u.nome, u.cognome, u.email, l.nome as lega_nome
    FROM subadmin s
    JOIN users u ON s.utente_id = u.id
    JOIN leghe l ON s.lega_id = l.id
    WHERE s.attivo = true
    ORDER BY l.nome, s.data_creazione DESC
  `);
  
  console.log('getAllSubadmins - Raw result:', result);
  console.log('getAllSubadmins - Result type:', typeof result);
  console.log('getAllSubadmins - Is array:', Array.isArray(result));
  
  // Handle MariaDB result format
  let rows = result;
  if (result && typeof result === 'object' && result.rows) {
    rows = result.rows;
  } else if (!Array.isArray(result)) {
    console.log('getAllSubadmins - Result is not an array, returning empty array');
    return [];
  }
  
  // Parsa i permessi JSON per ogni subadmin
  const subadmins = rows.map(subadmin => {
    try {
      subadmin.permessi = JSON.parse(subadmin.permessi || '{}');
    } catch (e) {
      subadmin.permessi = {};
    }
    return subadmin;
  });
  
  return subadmins;
}

export async function createSubAdmin(data) {
  const sql = `INSERT INTO subadmin (lega_id, utente_id, attivo)
    VALUES (?, ?, ?)`;
  const db = getDb();
  await db.query(sql, [
    data.lega_id,
    data.utente_id,
    data.attivo ? true : false
  ]);
  // MariaDB doesn't support RETURNING, so we need to get the ID differently
  const result = await db.query('SELECT LAST_INSERT_ID() as id');
  // Handle MariaDB result format
  let id = null;
  if (result && typeof result === 'object' && result.rows) {
    id = result.rows[0].id;
  } else if (Array.isArray(result)) {
    id = result[0].id;
  }
  return id;
}

export async function getSubAdminById(id) {
  const db = getDb();
  const result = await db.query('SELECT * FROM subadmin WHERE id = ?', [id]);
  // Handle MariaDB result format
  let subadmin = null;
  if (result && typeof result === 'object' && result.rows) {
    subadmin = result.rows[0];
  } else if (Array.isArray(result)) {
    subadmin = result[0];
  }
  return subadmin;
}

export async function getSubAdminByLega(lega_id) {
  const db = getDb();
  const result = await db.query('SELECT * FROM subadmin WHERE lega_id = ?', [lega_id]);
  return result;
}

export async function getSubAdminByUtente(utente_id) {
  const db = getDb();
  const result = await db.query('SELECT * FROM subadmin WHERE utente_id = ?', [utente_id]);
  return result;
}

export async function getAllSubAdmin() {
  const db = getDb();
  const result = await db.query('SELECT * FROM subadmin');
  return result;
}

export async function updateSubAdmin(id, data) {
  const sql = `UPDATE subadmin SET lega_id=?, utente_id=?, attivo=? WHERE id=?`;
  const db = getDb();
  await db.query(sql, [
    data.lega_id,
    data.utente_id,
    data.attivo ? true : false,
    id
  ]);
}

export async function deleteSubAdmin(id) {
  const db = getDb();
  await db.query('DELETE FROM subadmin WHERE id = ?', [id]);
}

export async function updateSubadminPermissions(legaId, userId, permissions) {
  const db = getDb();
  const permissionsJson = JSON.stringify(permissions);
  
  console.log('updateSubadminPermissions - Parametri:', { legaId, userId, permissions, permissionsJson });
  
  const result = await db.query(
    'UPDATE subadmin SET permessi = ? WHERE lega_id = ? AND utente_id = ? AND attivo = true',
    [permissionsJson, legaId, userId]
  );
  
  console.log('Permessi subadmin aggiornati nel DB, changes:', result.affectedRows);
  return result.affectedRows;
} 