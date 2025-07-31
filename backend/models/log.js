import { getDb } from '../db/mariadb.js';

export async function createLog(data) {
  try {
    const sql = `INSERT INTO log (user_id, azione, dettagli)
      VALUES ($1, $2, $3) RETURNING id`;
    const db = getDb();
    const result = await db.query(sql, [
      data.utente_id || null,
      data.azione,
      data.dettagli || null
    ]);
    return result.rows[0].id;
  } catch (err) {
    console.error('createLog error:', err);
    throw err;
  }
}

export async function getLogById(id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM log WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('getLogById error:', err);
    throw err;
  }
}

export async function getLogByLega(lega_id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM log WHERE lega_id = $1 ORDER BY created_at DESC', [lega_id]);
    return result.rows;
  } catch (err) {
    console.error('getLogByLega error:', err);
    throw err;
  }
}

export async function getAllLog() {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM log ORDER BY created_at DESC');
    return result.rows;
  } catch (err) {
    console.error('getAllLog error:', err);
    throw err;
  }
}

export async function deleteLog(id) {
  try {
    const db = getDb();
    await db.query('DELETE FROM log WHERE id = $1', [id]);
  } catch (err) {
    console.error('deleteLog error:', err);
    throw err;
  }
} 