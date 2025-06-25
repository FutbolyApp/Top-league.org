import { getDb } from '../db/config.js';
const db = getDb();

export function createUtente(data, callback) {
  const sql = `INSERT INTO users (nome, cognome, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo, username)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    data.nome,
    data.cognome,
    data.provenienza || null,
    data.squadra_cuore || null,
    data.come_conosciuto || null,
    data.email,
    data.password_hash,
    data.ruolo,
    data.username || null
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getUtenteById(id, callback) {
  db.get('SELECT * FROM users WHERE id = ?', [id], callback);
}

export function getUtenteByEmail(email, callback) {
  db.get('SELECT * FROM users WHERE email = ?', [email], callback);
}

export function getUtenteByUsername(username, callback) {
  db.get('SELECT * FROM users WHERE username = ?', [username], callback);
}

export function getAllUtenti(callback) {
  db.all('SELECT * FROM users', [], callback);
}

export function updateUtente(id, data, callback) {
  const sql = `UPDATE users SET nome=?, cognome=?, provenienza=?, squadra_cuore=?, come_conosciuto=?, email=?, password_hash=?, ruolo=?, username=? WHERE id=?`;
  db.run(sql, [
    data.nome,
    data.cognome,
    data.provenienza || null,
    data.squadra_cuore || null,
    data.come_conosciuto || null,
    data.email,
    data.password_hash,
    data.ruolo,
    data.username || null,
    id
  ], callback);
}

export function deleteUtente(id, callback) {
  db.run('DELETE FROM users WHERE id = ?', [id], callback);
} 