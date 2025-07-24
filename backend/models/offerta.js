import { getDb } from '../db/mariadb.js';

export async function createOfferta(data) {
  try {
    const sql = `INSERT INTO offerte (lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, tipo, valore, stato, cantera, data_accettazione, data_approvazione_admin, data_completamento)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
    return result.insertId;
  } catch (err) {
    console.error('createOfferta error:', err);
    throw err;
  }
}

export async function getOffertaById(id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM offerte WHERE id = ?', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('getOffertaById error:', err);
    throw err;
  }
}

export async function getOfferteByLega(lega_id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM offerte WHERE lega_id = ? ORDER BY data_creazione DESC', [lega_id]);
    return result.rows;
  } catch (err) {
    console.error('getOfferteByLega error:', err);
    throw err;
  }
}

export async function getOfferteBySquadra(squadra_id) {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM offerte WHERE squadra_mittente_id = ? OR squadra_destinatario_id = ? ORDER BY data_creazione DESC', [squadra_id, squadra_id]);
    return result.rows;
  } catch (err) {
    console.error('getOfferteBySquadra error:', err);
    throw err;
  }
}

export async function getAllOfferte() {
  try {
    const db = getDb();
    const result = await db.query('SELECT * FROM offerte ORDER BY data_creazione DESC');
    return result.rows;
  } catch (err) {
    console.error('getAllOfferte error:', err);
    throw err;
  }
}

export async function updateOfferta(id, data) {
  try {
    const sql = `UPDATE offerte SET lega_id=?, squadra_mittente_id=?, squadra_destinatario_id=?, giocatore_id=?, tipo=?, valore=?, stato=?, cantera=?, data_accettazione=?, data_approvazione_admin=?, data_completamento=? WHERE id=?`;
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
    await db.query('DELETE FROM offerte WHERE id = ?', [id]);
  } catch (err) {
    console.error('deleteOfferta error:', err);
    throw err;
  }
} 