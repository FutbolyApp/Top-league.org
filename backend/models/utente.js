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
  console.log('getUtenteByEmail called with email:', email);
  console.log('Database instance:', db ? 'available' : 'not available');
  
  // Prima controlliamo se la tabella users esiste e ha dati
  db.get('SELECT COUNT(*) as count FROM users', [], (err, countRow) => {
    console.log('Total users in database:', countRow ? countRow.count : 'error getting count');
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      console.log('getUtenteByEmail callback - err:', err, 'row:', row ? 'found' : 'not found');
      callback(err, row);
    });
  });
}

export function getUtenteByUsername(username, callback) {
  console.log('getUtenteByUsername called with username:', username);
  console.log('Database instance:', db ? 'available' : 'not available');
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    console.log('getUtenteByUsername callback - err:', err, 'row:', row ? 'found' : 'not found');
    callback(err, row);
  });
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

export function updateUtenteRole(id, ruolo, callback) {
  const sql = `UPDATE users SET ruolo=? WHERE id=?`;
  db.run(sql, [ruolo, id], callback);
}

export function deleteUtente(id, callback) {
  db.run('DELETE FROM users WHERE id = ?', [id], callback);
} 