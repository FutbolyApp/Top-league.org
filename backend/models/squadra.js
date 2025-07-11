import { getDb } from '../db/postgres.js';
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
  db.get(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome 
           END as proprietario_nome,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN ''
             ELSE u.cognome 
           END as proprietario_cognome
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    WHERE s.id = ?
  `, [id], callback);
}

export function getSquadreByLega(lega_id, callback) {
  db.all(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome 
           END as proprietario_nome,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN ''
             ELSE u.cognome 
           END as proprietario_cognome,
           GROUP_CONCAT(t.nome) as tornei_nomi,
           GROUP_CONCAT(t.id) as tornei_ids,
           COALESCE((
             SELECT SUM(COALESCE(g.qa, g.quotazione_attuale, 0))
             FROM giocatori g
             WHERE g.squadra_id = s.id
           ), 0) as valore_attuale_qa
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    LEFT JOIN tornei_squadre ts ON s.id = ts.squadra_id
    LEFT JOIN tornei t ON ts.torneo_id = t.id
    WHERE s.lega_id = ?
    GROUP BY s.id
  `, [lega_id], callback);
}

export function getAllSquadre(callback) {
  db.all(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome 
           END as proprietario_nome,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN ''
             ELSE u.cognome 
           END as proprietario_cognome
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
  `, [], callback);
}

export function updateSquadra(id, data, callback) {
  const sql = `UPDATE squadre SET lega_id=?, nome=?, proprietario_id=?, club_level=?, casse_societarie=?, costo_salariale_totale=?, costo_salariale_annuale=?, valore_squadra=?, is_orfana=?, logo_url=? WHERE id=?`;
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
    data.logo_url || null,
    id
  ], callback);
}

export function updateSquadraPartial(id, updates, callback) {
  // First get the current squad data
  getSquadraById(id, (err, squadra) => {
    if (err) {
      return callback(err);
    }
    if (!squadra) {
      return callback(new Error('Squadra non trovata'));
    }

    // Merge current data with updates
    const updatedData = {
      lega_id: squadra.lega_id,
      nome: squadra.nome,
      proprietario_id: squadra.proprietario_id,
      club_level: squadra.club_level,
      casse_societarie: squadra.casse_societarie,
      costo_salariale_totale: squadra.costo_salariale_totale,
      costo_salariale_annuale: squadra.costo_salariale_annuale,
      valore_squadra: squadra.valore_squadra,
      is_orfana: squadra.is_orfana,
      logo_url: squadra.logo_url,
      ...updates // Override with provided updates
    };

    // Use the existing updateSquadra function
    updateSquadra(id, updatedData, callback);
  });
}

export function deleteSquadra(id, callback) {
  db.run('DELETE FROM squadre WHERE id = ?', [id], callback);
} 