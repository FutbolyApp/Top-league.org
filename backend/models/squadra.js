import { getDb } from '../db/config.js';
const db = getDb();

export function createSquadra(data, callback) {
  const sql = `INSERT INTO squadre (lega_id, nome, proprietario_id, club_level, casse_societarie, costo_salariale_totale, costo_salariale_annuale, valore_squadra, is_orfana)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    data.lega_id,
    data.nome,
    data.proprietario_id || null,
    data.club_level || 1,
    data.casse_societarie || 0,
    data.costo_salariale_totale || 0,
    data.costo_salariale_annuale || 0,
    data.valore_squadra || 0,
    data.is_orfana ? 1 : 0
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getSquadraById(id, callback) {
  db.get('SELECT * FROM squadre WHERE id = ?', [id], callback);
}

export function getSquadreByLega(lega_id, callback) {
  db.all('SELECT * FROM squadre WHERE lega_id = ?', [lega_id], callback);
}

export function getAllSquadre(callback) {
  db.all('SELECT * FROM squadre', [], callback);
}

export function updateSquadra(id, data, callback) {
  const sql = `UPDATE squadre SET lega_id=?, nome=?, proprietario_id=?, club_level=?, casse_societarie=?, costo_salariale_totale=?, costo_salariale_annuale=?, valore_squadra=?, is_orfana=? WHERE id=?`;
  db.run(sql, [
    data.lega_id,
    data.nome,
    data.proprietario_id || null,
    data.club_level || 1,
    data.casse_societarie || 0,
    data.costo_salariale_totale || 0,
    data.costo_salariale_annuale || 0,
    data.valore_squadra || 0,
    data.is_orfana ? 1 : 0,
    id
  ], callback);
}

export function deleteSquadra(id, callback) {
  db.run('DELETE FROM squadre WHERE id = ?', [id], callback);
} 