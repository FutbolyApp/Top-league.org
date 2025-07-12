import { getDb } from '../db/postgres.js';

export async function createOfferta(data) {
  try {
    const sql = `INSERT INTO offerte (lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, tipo, valore, stato, cantera, data_accettazione, data_approvazione_admin, data_completamento)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;
    const db = getDb();
    const result = await db.query(sql, [
      data.lega_id,
      data.squadra_mittente_id,
      data.squadra_destinatario_id,
      data.giocatore_id,
      data.tipo,
      data.valore,
      data.stato,
      data.cantera ? true : false,
      data.data_accettazione || null,
      data.data_approvazione_admin || null,
      data.data_completamento || null
    ]);
    return result.rows[0].id;
  } catch (err) {
    console.error('createOfferta error:', err);
    throw err;
  }
}

export async function getOffertaById(id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM offerte WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('getOffertaById error:', err);
    throw err;
  }
}

export async function getOfferteByLega(lega_id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM offerte WHERE lega_id = $1 ORDER BY created_at DESC', [lega_id]);
    return result.rows;
  } catch (err) {
    console.error('getOfferteByLega error:', err);
    throw err;
  }
}

export async function getOfferteBySquadra(squadra_id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM offerte WHERE squadra_mittente_id = $1 OR squadra_destinatario_id = $1 ORDER BY created_at DESC', [squadra_id]);
    return result.rows;
  } catch (err) {
    console.error('getOfferteBySquadra error:', err);
    throw err;
  }
}

export async function getAllOfferte() {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM offerte ORDER BY created_at DESC');
    return result.rows;
  } catch (err) {
    console.error('getAllOfferte error:', err);
    throw err;
  }
}

export async function updateOfferta(id, data) {
  try {
    const sql = `UPDATE offerte SET lega_id=$1, squadra_mittente_id=$2, squadra_destinatario_id=$3, giocatore_id=$4, tipo=$5, valore=$6, stato=$7, cantera=$8, data_accettazione=$9, data_approvazione_admin=$10, data_completamento=$11 WHERE id=$12`;
    const db = getDb();
    await db.query(sql, [
      data.lega_id,
      data.squadra_mittente_id,
      data.squadra_destinatario_id,
      data.giocatore_id,
      data.tipo,
      data.valore,
      data.stato,
      data.cantera ? true : false,
      data.data_accettazione || null,
      data.data_approvazione_admin || null,
      data.data_completamento || null,
      id
    ]);
  } catch (err) {
    console.error('updateOfferta error:', err);
    throw err;
  }
}

export async function deleteOfferta(id) {
  try {
    const db = getDb();
    await db.query('DELETE FROM offerte WHERE id = $1', [id]);
  } catch (err) {
    console.error('deleteOfferta error:', err);
    throw err;
  }
} 