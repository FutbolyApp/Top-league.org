import { getDb } from '../db/postgres.js';

export function createRichiestaAdmin(squadra_id, tipo_richiesta, dati_richiesta, callback) {
  const db = getDb();
  const dati_json = JSON.stringify(dati_richiesta);
  db.run(
    'INSERT INTO richieste_admin (squadra_id, tipo_richiesta, dati_richiesta) VALUES (?, ?, ?)',
    [squadra_id, tipo_richiesta, dati_json],
    function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null, this.lastID);
      }
    }
  );
}

export function getRichiesteBySquadra(squadra_id, callback) {
  const db = getDb();
  db.all(
    'SELECT * FROM richieste_admin WHERE squadra_id = ? ORDER BY data_creazione DESC',
    [squadra_id],
    callback
  );
}

export function getRichiestePendingByLega(lega_id, callback) {
  const db = getDb();
  db.all(`
    SELECT ra.*, s.nome as squadra_nome, s.proprietario_id, u.username as proprietario_username
    FROM richieste_admin ra
    JOIN squadre s ON ra.squadra_id = s.id
    JOIN users u ON s.proprietario_id = u.id
    WHERE s.lega_id = ? AND ra.stato = 'pending'
    ORDER BY ra.data_creazione DESC
  `, [lega_id], callback);
}

export function updateRichiestaStato(richiesta_id, stato, note_admin, callback) {
  const db = getDb();
  const data_risposta = new Date().toISOString();
  db.run(
    'UPDATE richieste_admin SET stato = ?, data_risposta = ?, note_admin = ? WHERE id = ?',
    [stato, data_risposta, note_admin, richiesta_id],
    callback
  );
}

export function getRichiestaById(richiesta_id, callback) {
  const db = getDb();
  db.get(
    'SELECT * FROM richieste_admin WHERE id = ?',
    [richiesta_id],
    callback
  );
}

export function deleteRichiestaAdmin(id, callback) {
  const db = getDb();
  db.run('DELETE FROM richieste_admin WHERE id = ?', [id], function(err) {
    if (err) {
      callback(err);
    } else {
      callback(null, { id: this.lastID });
    }
  });
}

 