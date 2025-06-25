import { getDb } from '../db/config.js';
const db = getDb();

export function createLog(data, callback) {
  const sql = `INSERT INTO log (lega_id, azione, dettagli, utente_id)
    VALUES (?, ?, ?, ?)`;
  db.run(sql, [
    data.lega_id || null,
    data.azione,
    data.dettagli || null,
    data.utente_id || null
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getLogById(id, callback) {
  db.get('SELECT * FROM log WHERE id = ?', [id], callback);
}

export function getLogByLega(lega_id, callback) {
  db.all('SELECT * FROM log WHERE lega_id = ?', [lega_id], callback);
}

export function getAllLog(callback) {
  db.all('SELECT * FROM log', [], callback);
}

export function deleteLog(id, callback) {
  db.run('DELETE FROM log WHERE id = ?', [id], callback);
} 