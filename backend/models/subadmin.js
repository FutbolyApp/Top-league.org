import { getDb } from '../db/config.js';
const db = getDb();

export function createSubAdmin(data, callback) {
  const sql = `INSERT INTO subadmin (lega_id, utente_id, attivo)
    VALUES (?, ?, ?)`;
  db.run(sql, [
    data.lega_id,
    data.utente_id,
    data.attivo ? 1 : 0
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getSubAdminById(id, callback) {
  db.get('SELECT * FROM subadmin WHERE id = ?', [id], callback);
}

export function getSubAdminByLega(lega_id, callback) {
  db.all('SELECT * FROM subadmin WHERE lega_id = ?', [lega_id], callback);
}

export function getSubAdminByUtente(utente_id, callback) {
  db.all('SELECT * FROM subadmin WHERE utente_id = ?', [utente_id], callback);
}

export function getAllSubAdmin(callback) {
  db.all('SELECT * FROM subadmin', [], callback);
}

export function updateSubAdmin(id, data, callback) {
  const sql = `UPDATE subadmin SET lega_id=?, utente_id=?, attivo=? WHERE id=?`;
  db.run(sql, [
    data.lega_id,
    data.utente_id,
    data.attivo ? 1 : 0,
    id
  ], callback);
}

export function deleteSubAdmin(id, callback) {
  db.run('DELETE FROM subadmin WHERE id = ?', [id], callback);
} 