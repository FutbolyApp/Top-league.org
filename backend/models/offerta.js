import { getDb } from '../db/config.js';
const db = getDb();

export function createOfferta(data, callback) {
  const sql = `INSERT INTO offerte (lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, tipo, valore, stato, data_accettazione, data_approvazione_admin, data_completamento)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    data.lega_id,
    data.squadra_mittente_id,
    data.squadra_destinatario_id,
    data.giocatore_id,
    data.tipo,
    data.valore,
    data.stato,
    data.data_accettazione || null,
    data.data_approvazione_admin || null,
    data.data_completamento || null
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getOffertaById(id, callback) {
  db.get('SELECT * FROM offerte WHERE id = ?', [id], callback);
}

export function getOfferteByLega(lega_id, callback) {
  db.all('SELECT * FROM offerte WHERE lega_id = ?', [lega_id], callback);
}

export function getOfferteBySquadra(squadra_id, callback) {
  db.all('SELECT * FROM offerte WHERE squadra_mittente_id = ? OR squadra_destinatario_id = ?', [squadra_id, squadra_id], callback);
}

export function getAllOfferte(callback) {
  db.all('SELECT * FROM offerte', [], callback);
}

export function updateOfferta(id, data, callback) {
  const sql = `UPDATE offerte SET lega_id=?, squadra_mittente_id=?, squadra_destinatario_id=?, giocatore_id=?, tipo=?, valore=?, stato=?, data_accettazione=?, data_approvazione_admin=?, data_completamento=? WHERE id=?`;
  db.run(sql, [
    data.lega_id,
    data.squadra_mittente_id,
    data.squadra_destinatario_id,
    data.giocatore_id,
    data.tipo,
    data.valore,
    data.stato,
    data.data_accettazione || null,
    data.data_approvazione_admin || null,
    data.data_completamento || null,
    id
  ], callback);
}

export function deleteOfferta(id, callback) {
  db.run('DELETE FROM offerte WHERE id = ?', [id], callback);
} 