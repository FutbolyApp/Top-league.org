import { getDb } from '../db/config.js';
const db = getDb();

export function createLogContratto(data, callback) {
  const sql = `INSERT INTO log_contratti (giocatore_id, squadra_id, tipo, valore_prima, valore_dopo, importo, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    data.giocatore_id,
    data.squadra_id,
    data.tipo,
    data.valore_prima || null,
    data.valore_dopo || null,
    data.importo || null,
    data.note || null
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getLogContrattiBySquadra(squadra_id, callback) {
  const sql = `
    SELECT lc.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome
    FROM log_contratti lc
    JOIN giocatori g ON lc.giocatore_id = g.id
    WHERE lc.squadra_id = ?
    ORDER BY lc.data_operazione DESC
    LIMIT 50
  `;
  db.all(sql, [squadra_id], callback);
}

export function getLogContrattiByGiocatore(giocatore_id, callback) {
  const sql = `
    SELECT lc.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome
    FROM log_contratti lc
    JOIN giocatori g ON lc.giocatore_id = g.id
    WHERE lc.giocatore_id = ?
    ORDER BY lc.data_operazione DESC
    LIMIT 20
  `;
  db.all(sql, [giocatore_id], callback);
} 