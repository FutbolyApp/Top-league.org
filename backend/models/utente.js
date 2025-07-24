import { getDb } from '../db/mariadb.js';

export async function createUtente(data) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const result = await db.query(`
      INSERT INTO users (nome, cognome, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo, username)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    return result.insertId;
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
    
    const result = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    
    // Handle MariaDB result format
    let user = null;
    if (result && typeof result === 'object' && result.rows) {
      user = result.rows[0];
    } else if (Array.isArray(result)) {
      user = result[0];
    }
    
    return user;
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
    const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('getUtenteByEmail RAW RESULT:', result, 'Type:', typeof result, 'IsArray:', Array.isArray(result));
    
    // Handle MariaDB result format
    let user = null;
    if (result && typeof result === 'object' && result.rows) {
      user = result.rows[0];
    } else if (Array.isArray(result)) {
      user = result[0];
    }
    
    console.log('getUtenteByEmail result:', user ? 'found' : 'not found');
    return user;
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
    const result = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    
    // Handle MariaDB result format
    let user = null;
    if (result && typeof result === 'object' && result.rows) {
      user = result.rows[0];
    } else if (Array.isArray(result)) {
      user = result[0];
    }
    
    console.log('getUtenteByUsername result:', user ? 'found' : 'not found');
    return user;
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
    return result;
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
    
    const result = await db.query(`
      UPDATE users 
      SET nome = ?, cognome = ?, provenienza = ?, squadra_cuore = ?, come_conosciuto = ?, email = ?, ruolo = ?, username = ?
      WHERE id = ?
    `, [
      data.nome,
      data.cognome,
      data.provenienza || null,
      data.squadra_cuore || null,
      data.come_conosciuto || null,
      data.email,
      data.ruolo,
      data.username || null,
      id
    ]);
    
    return result.affectedRows > 0;
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
    
    const result = await db.query('UPDATE users SET ruolo = ? WHERE id = ?', [ruolo, id]);
    return result.affectedRows > 0;
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
    
    const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Errore in deleteUtente:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
} 