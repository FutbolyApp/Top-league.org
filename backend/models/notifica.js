import { getDb } from '../db/config.js';
const db = getDb();

export function createNotifica(data, callback) {
  console.log('createNotifica called with data:', data);
  const sql = `INSERT INTO notifiche (lega_id, utente_id, titolo, messaggio, tipo, letto, data_lettura, archiviata, dati_aggiuntivi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    data.lega_id || null,
    data.utente_id || data.user_id || null,
    data.titolo || null,
    data.messaggio,
    data.tipo || 'generale',
    data.letto ? 1 : 0,
    data.data_lettura || null,
    data.archiviata ? 1 : 0,
    data.dati_aggiuntivi ? JSON.stringify(data.dati_aggiuntivi) : null
  ];
  console.log('createNotifica SQL params:', params);
  db.run(sql, params, function(err) {
    if (err) {
      console.error('createNotifica error:', err);
    } else {
      console.log('createNotifica success, lastID:', this ? this.lastID : null);
    }
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
  const sql = `UPDATE notifiche SET lega_id=?, utente_id=?, titolo=?, messaggio=?, tipo=?, letto=?, data_lettura=?, archiviata=?, dati_aggiuntivi=? WHERE id=?`;
  db.run(sql, [
    data.lega_id || null,
    data.utente_id || null,
    data.titolo || null,
    data.messaggio,
    data.tipo || 'generale',
    data.letto ? 1 : 0,
    data.data_lettura || null,
    data.archiviata ? 1 : 0,
    data.dati_aggiuntivi ? JSON.stringify(data.dati_aggiuntivi) : null,
    id
  ], callback);
}

export function deleteNotifica(id, callback) {
  db.run('DELETE FROM notifiche WHERE id = ?', [id], callback);
} 