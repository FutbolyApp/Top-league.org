import { getDb } from '../db/config.js';
const db = getDb();

export function createLega(data, callback) {
  const sql = `INSERT INTO leghe (nome, modalita, admin_id, is_pubblica, password, max_squadre, min_giocatori, max_giocatori, roster_ab, cantera, contratti, triggers, regolamento_pdf, excel_originale, excel_modificato, fantacalcio_url, fantacalcio_username, fantacalcio_password, scraping_automatico)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    data.nome,
    data.modalita,
    data.admin_id,
    data.is_pubblica ? 1 : 0,
    data.password || null,
    data.max_squadre,
    data.min_giocatori,
    data.max_giocatori,
    data.roster_ab ? 1 : 0,
    data.cantera ? 1 : 0,
    data.contratti ? 1 : 0,
    data.triggers ? 1 : 0,
    data.regolamento_pdf || null,
    data.excel_originale || null,
    data.excel_modificato || null,
    data.fantacalcio_url || null,
    data.fantacalcio_username || null,
    data.fantacalcio_password || null,
    data.scraping_automatico ? 1 : 0
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getLegaById(id, callback) {
  db.get('SELECT * FROM leghe WHERE id = ?', [id], callback);
}

export function getAllLeghe(callback) {
  db.all('SELECT * FROM leghe', [], callback);
}

export function updateLega(id, data, callback) {
  const sql = `UPDATE leghe SET nome=?, modalita=?, admin_id=?, is_pubblica=?, password=?, max_squadre=?, min_giocatori=?, max_giocatori=?, roster_ab=?, cantera=?, contratti=?, triggers=?, regolamento_pdf=?, excel_originale=?, excel_modificato=?, fantacalcio_url=?, fantacalcio_username=?, fantacalcio_password=?, scraping_automatico=? WHERE id=?`;
  db.run(sql, [
    data.nome,
    data.modalita,
    data.admin_id,
    data.is_pubblica ? 1 : 0,
    data.password || null,
    data.max_squadre,
    data.min_giocatori,
    data.max_giocatori,
    data.roster_ab ? 1 : 0,
    data.cantera ? 1 : 0,
    data.contratti ? 1 : 0,
    data.triggers ? 1 : 0,
    data.regolamento_pdf || null,
    data.excel_originale || null,
    data.excel_modificato || null,
    data.fantacalcio_url || null,
    data.fantacalcio_username || null,
    data.fantacalcio_password || null,
    data.scraping_automatico ? 1 : 0,
    id
  ], callback);
}

export function deleteLega(id, callback) {
  db.run('DELETE FROM leghe WHERE id = ?', [id], callback);
} 