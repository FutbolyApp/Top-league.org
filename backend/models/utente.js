import { getDb } from '../db/postgres.js';

export async function createUtente(data) {
  const client = await getDb().connect();
  try {
    const result = await client.query(`
      INSERT INTO users (nome, cognome, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo, username)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [
      data.nome,
      data.cognome,
      data.provenienza || null,
      data.squadra_cuore || null,
      data.come_conosciuto || null,
      data.email,
      data.password_hash,
      data.ruolo,
      data.username || null
    ]);
    return result.rows[0].id;
  } finally {
    client.release();
  }
}

export async function getUtenteById(id) {
  const client = await getDb().connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getUtenteByEmail(email) {
  const client = await getDb().connect();
  try {
    console.log('getUtenteByEmail called with email:', email);
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('getUtenteByEmail result:', result.rows[0] ? 'found' : 'not found');
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getUtenteByUsername(username) {
  const client = await getDb().connect();
  try {
    console.log('getUtenteByUsername called with username:', username);
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log('getUtenteByUsername result:', result.rows[0] ? 'found' : 'not found');
    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getAllUtenti() {
  const client = await getDb().connect();
  try {
    const result = await client.query('SELECT * FROM users');
    return result.rows;
  } finally {
    client.release();
  }
}

export async function updateUtente(id, data) {
  const client = await getDb().connect();
  try {
    await client.query(`
      UPDATE users SET nome=$1, cognome=$2, provenienza=$3, squadra_cuore=$4, come_conosciuto=$5, email=$6, password_hash=$7, ruolo=$8, username=$9 WHERE id=$10
    `, [
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
    ]);
  } finally {
    client.release();
  }
}

export async function updateUtenteRole(id, ruolo) {
  const client = await getDb().connect();
  try {
    await client.query('UPDATE users SET ruolo=$1 WHERE id=$2', [ruolo, id]);
  } finally {
    client.release();
  }
}

export async function deleteUtente(id) {
  const client = await getDb().connect();
  try {
    await client.query('DELETE FROM users WHERE id = $1', [id]);
  } finally {
    client.release();
  }
} 