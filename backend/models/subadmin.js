import { getDb } from '../db/postgres.js';

export async function addSubadmin(legaId, userId, permissions) {
  const db = getDb();
  const permissionsJson = JSON.stringify(permissions);
  
  console.log('addSubadmin - Parametri:', { legaId, userId, permissions, permissionsJson });
  
  const result = await db.query(
    'INSERT INTO subadmin (lega_id, utente_id, permessi, attivo, data_nomina) VALUES ($1, $2, $3, true, NOW()) ON CONFLICT (lega_id, utente_id) DO UPDATE SET permessi = $3, attivo = true, data_nomina = NOW() RETURNING id',
    [legaId, userId, permissionsJson]
  );
  
  console.log('Subadmin inserito nel DB, ID:', result.rows[0].id);
  return result.rows[0].id;
}

export async function removeSubadmin(legaId, userId) {
  const db = getDb();
  
  const result = await db.query(
    'UPDATE subadmin SET attivo = false WHERE lega_id = $1 AND utente_id = $2',
    [legaId, userId]
  );
  
  return result.rowCount;
}

export async function getSubadminsByLega(legaId) {
  const db = getDb();
  
  console.log('getSubadminsByLega - Cercando subadmin per lega:', legaId);
  
  const result = await db.query(`
    SELECT s.*, u.username, u.nome, u.cognome, u.email
    FROM subadmin s
    JOIN users u ON s.utente_id = u.id
    WHERE s.lega_id = $1 AND s.attivo = true
    ORDER BY s.data_nomina DESC
  `, [legaId]);
  
  console.log('getSubadminsByLega - Subadmin trovati (raw):', result.rows);
  
  // Parsa i permessi JSON per ogni subadmin
  const subadmins = result.rows.map(subadmin => {
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
    'SELECT * FROM subadmin WHERE lega_id = $1 AND utente_id = $2 AND attivo = true',
    [legaId, userId]
  );
  
  if (result.rows.length === 0) {
    return false;
  }
  
  return true;
}

export async function hasPermission(legaId, userId, permission) {
  const isSub = await isSubadmin(legaId, userId);
  if (!isSub) return false;
  
  const db = getDb();
  const result = await db.query(
    'SELECT permessi FROM subadmin WHERE lega_id = $1 AND utente_id = $2 AND attivo = true',
    [legaId, userId]
  );
  
  if (result.rows.length === 0) return false;
  
  try {
    const permissions = JSON.parse(result.rows[0].permessi || '{}');
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
    ORDER BY l.nome, s.data_nomina DESC
  `);
  
  // Parsa i permessi JSON per ogni subadmin
  const subadmins = result.rows.map(subadmin => {
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
    VALUES ($1, $2, $3) RETURNING id`;
  const db = getDb();
  const result = await db.query(sql, [
    data.lega_id,
    data.utente_id,
    data.attivo ? true : false
  ]);
  return result.rows[0].id;
}

export async function getSubAdminById(id) {
  const db = getDb();
  const result = await db.query('SELECT * FROM subadmin WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getSubAdminByLega(lega_id) {
  const db = getDb();
  const result = await db.query('SELECT * FROM subadmin WHERE lega_id = $1', [lega_id]);
  return result.rows;
}

export async function getSubAdminByUtente(utente_id) {
  const db = getDb();
  const result = await db.query('SELECT * FROM subadmin WHERE utente_id = $1', [utente_id]);
  return result.rows;
}

export async function getAllSubAdmin() {
  const db = getDb();
  const result = await db.query('SELECT * FROM subadmin');
  return result.rows;
}

export async function updateSubAdmin(id, data) {
  const sql = `UPDATE subadmin SET lega_id=$1, utente_id=$2, attivo=$3 WHERE id=$4`;
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
  await db.query('DELETE FROM subadmin WHERE id = $1', [id]);
}

export async function updateSubadminPermissions(legaId, userId, permissions) {
  const db = getDb();
  const permissionsJson = JSON.stringify(permissions);
  
  console.log('updateSubadminPermissions - Parametri:', { legaId, userId, permissions, permissionsJson });
  
  const result = await db.query(
    'UPDATE subadmin SET permessi = $1 WHERE lega_id = $2 AND utente_id = $3 AND attivo = true',
    [permissionsJson, legaId, userId]
  );
  
  console.log('Permessi subadmin aggiornati nel DB, changes:', result.rowCount);
  return result.rowCount;
} 