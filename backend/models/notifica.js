import { getDb } from '../db/postgres.js';

export async function createNotifica(data) {
  console.log('createNotifica called with data:', data);
  const sql = `INSERT INTO notifiche (lega_id, utente_id, titolo, messaggio, tipo, letta, data_lettura, archiviata, dati_aggiuntivi)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;
  const params = [
    data.lega_id || null,
    data.utente_id || data.user_id || null,
    data.titolo || null,
    data.messaggio,
    data.tipo || 'generale',
    data.letta ? true : false,
    data.data_lettura || null,
    data.archiviata ? true : false,
    data.dati_aggiuntivi ? JSON.stringify(data.dati_aggiuntivi) : null
  ];
  console.log('createNotifica SQL params:', params);
  
  try {
    const db = getDb();
    const result = await db.query(sql, params);
    console.log('createNotifica success, id:', result.rows[0].id);
    return result.rows[0].id;
  } catch (err) {
    console.error('createNotifica error:', err);
    throw err;
  }
}

export async function getNotificaById(id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM notifiche WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('getNotificaById error:', err);
    throw err;
  }
}

export async function getNotificheByUtente(utente_id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM notifiche WHERE utente_id = $1 ORDER BY data_creazione DESC', [utente_id]);
    return result.rows;
  } catch (err) {
    console.error('getNotificheByUtente error:', err);
    throw err;
  }
}

export async function getNotificheByLega(lega_id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM notifiche WHERE lega_id = $1 ORDER BY data_creazione DESC', [lega_id]);
    return result.rows;
  } catch (err) {
    console.error('getNotificheByLega error:', err);
    throw err;
  }
}

export async function getAllNotifiche() {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM notifiche ORDER BY data_creazione DESC');
    return result.rows;
  } catch (err) {
    console.error('getAllNotifiche error:', err);
    throw err;
  }
}

export async function updateNotifica(id, data) {
  try {
    const sql = `UPDATE notifiche SET lega_id=$1, utente_id=$2, titolo=$3, messaggio=$4, tipo=$5, letta=$6, data_lettura=$7, archiviata=$8, dati_aggiuntivi=$9 WHERE id=$10`;
    const db = getDb();
    await db.query(sql, [
      data.lega_id || null,
      data.utente_id || null,
      data.titolo || null,
      data.messaggio,
      data.tipo || 'generale',
      data.letta ? true : false,
      data.data_lettura || null,
      data.archiviata ? true : false,
      data.dati_aggiuntivi ? JSON.stringify(data.dati_aggiuntivi) : null,
      id
    ]);
  } catch (err) {
    console.error('updateNotifica error:', err);
    throw err;
  }
}

export async function deleteNotifica(id) {
  try {
    const db = getDb();
    await db.query('DELETE FROM notifiche WHERE id = $1', [id]);
  } catch (err) {
    console.error('deleteNotifica error:', err);
    throw err;
  }
} 