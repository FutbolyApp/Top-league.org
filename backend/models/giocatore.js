import { getDb } from '../db/config.js';
const db = getDb();

export function createGiocatore(data, callback) {
  const sql = `INSERT INTO giocatori (lega_id, squadra_id, nome, cognome, ruolo, squadra_reale, eta, quotazione_attuale, salario, costo_attuale, costo_precedente, prestito, anni_contratto, cantera, triggers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    data.lega_id,
    data.squadra_id,
    data.nome,
    data.cognome || null,
    data.ruolo,
    data.squadra_reale || null,
    data.eta || null,
    data.quotazione_attuale || null,
    data.salario || null,
    data.costo_attuale || null,
    data.costo_precedente || null,
    data.prestito ? 1 : 0,
    data.anni_contratto || null,
    data.cantera ? 1 : 0,
    data.triggers || null
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getGiocatoreById(id, callback) {
  db.get('SELECT * FROM giocatori WHERE id = ?', [id], callback);
}

export function getGiocatoriBySquadra(squadra_id, callback) {
  db.all('SELECT * FROM giocatori WHERE squadra_id = ?', [squadra_id], callback);
}

export function getGiocatoriByLega(lega_id, callback) {
  db.all('SELECT * FROM giocatori WHERE lega_id = ?', [lega_id], callback);
}

export function getAllGiocatori(callback) {
  db.all('SELECT * FROM giocatori', [], callback);
}

export function updateGiocatore(id, data, callback) {
  const sql = `UPDATE giocatori SET lega_id=?, squadra_id=?, nome=?, cognome=?, ruolo=?, squadra_reale=?, eta=?, quotazione_attuale=?, salario=?, costo_attuale=?, costo_precedente=?, prestito=?, anni_contratto=?, cantera=?, triggers=? WHERE id=?`;
  db.run(sql, [
    data.lega_id,
    data.squadra_id,
    data.nome,
    data.cognome || null,
    data.ruolo,
    data.squadra_reale || null,
    data.eta || null,
    data.quotazione_attuale || null,
    data.salario || null,
    data.costo_attuale || null,
    data.costo_precedente || null,
    data.prestito ? 1 : 0,
    data.anni_contratto || null,
    data.cantera ? 1 : 0,
    data.triggers || null,
    id
  ], callback);
}

export function deleteGiocatore(id, callback) {
  db.run('DELETE FROM giocatori WHERE id = ?', [id], callback);
} 