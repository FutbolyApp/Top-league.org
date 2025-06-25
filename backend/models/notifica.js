import { getDb } from '../db/config.js';
const db = getDb();

export function createNotifica(data, callback) {
  const sql = `INSERT INTO notifiche (lega_id, utente_id, tipo, messaggio, letto, data_lettura, archiviata)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    data.lega_id || null,
    data.utente_id || null,
    data.tipo,
    data.messaggio,
    data.letto ? 1 : 0,
    data.data_lettura || null,
    data.archiviata ? 1 : 0
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getNotificaById(id, callback) {
  db.get('SELECT * FROM notifiche WHERE id = ?', [id], callback);
}

export function getNotificheByUtente(utente_id, callback) {
  db.all('SELECT * FROM notifiche WHERE utente_id = ?', [utente_id], callback);
}

export function getNotificheByLega(lega_id, callback) {
  db.all('SELECT * FROM notifiche WHERE lega_id = ?', [lega_id], callback);
}

export function getAllNotifiche(callback) {
  db.all('SELECT * FROM notifiche', [], callback);
}

export function updateNotifica(id, data, callback) {
  const sql = `UPDATE notifiche SET lega_id=?, utente_id=?, tipo=?, messaggio=?, letto=?, data_lettura=?, archiviata=? WHERE id=?`;
  db.run(sql, [
    data.lega_id || null,
    data.utente_id || null,
    data.tipo,
    data.messaggio,
    data.letto ? 1 : 0,
    data.data_lettura || null,
    data.archiviata ? 1 : 0,
    id
  ], callback);
}

export function deleteNotifica(id, callback) {
  db.run('DELETE FROM notifiche WHERE id = ?', [id], callback);
} 