import { getDb } from '../db/postgres.js';

export async function createUtente(data) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const result = await db.query(`
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
  } catch (error) {
    console.error('Errore in createUtente:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
}

export async function getUtenteById(id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Errore in getUtenteById:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
}

export async function getUtenteByEmail(email) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    console.log('getUtenteByEmail called with email:', email);
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('getUtenteByEmail result:', result.rows[0] ? 'found' : 'not found');
    return result.rows[0];
  } catch (error) {
    console.error('Errore in getUtenteByEmail:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
}

export async function getUtenteByUsername(username) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    console.log('getUtenteByUsername called with username:', username);
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log('getUtenteByUsername result:', result.rows[0] ? 'found' : 'not found');
    return result.rows[0];
  } catch (error) {
    console.error('Errore in getUtenteByUsername:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
}

export async function getAllUtenti() {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const result = await db.query('SELECT * FROM users');
    return result.rows;
  } catch (error) {
    console.error('Errore in getAllUtenti:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
}

export async function updateUtente(id, data) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    await db.query(`
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
  } catch (error) {
    console.error('Errore in updateUtente:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
}

export async function updateUtenteRole(id, ruolo) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    await db.query('UPDATE users SET ruolo=$1 WHERE id=$2', [ruolo, id]);
  } catch (error) {
    console.error('Errore in updateUtenteRole:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
}

export async function deleteUtente(id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  } catch (error) {
    console.error('Errore in deleteUtente:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
} 