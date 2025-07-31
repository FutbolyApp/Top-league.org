import { getDb } from '../db/mariadb.js';

export async function createGiocatore(giocatoreData) {
    try {
        const db = getDb();
        if (!db) {
            throw new Error('Database non disponibile');
        }
        
        const { squadra_id, nome, cognome, ruolo, quotazione, fv_mp, qi, qa, site_id, nazione_campionato, fvm, media_voto } = giocatoreData;
        
        const query = `
            INSERT INTO giocatori 
            (squadra_id, nome, cognome, ruolo, quotazione, fv_mp, qi, qa, site_id, nazione_campionato, fvm, media_voto) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [squadra_id, nome, cognome || null, ruolo, quotazione || 0, fv_mp || 0, qi || 0, qa || 0, site_id || null, nazione_campionato || null, fvm || 0, media_voto || 0];
        
        const result = await db.query(query, params);
        console.log(`✅ Giocatore creato con ID: ${result.insertId}`);
        return result.insertId;
    } catch (error) {
        console.error('❌ Errore creazione giocatore:', error.message);
        throw error;
    }
}

export async function getGiocatoreById(id) {
  const db = getDb();
  const result = await db.query(`
    SELECT *, 
           quotazione_attuale
    FROM giocatori WHERE id = ?
  `, [id]);
  
  return result.rows[0] || null;
}

export async function getGiocatoriBySquadra(squadra_id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const result = await db.query(`
      SELECT *, 
             quotazione
      FROM giocatori WHERE squadra_id = ?
    `, [squadra_id]);
    
    return result.rows;
  } catch (error) {
    console.error('Errore in getGiocatoriBySquadra:', error);
    if (error.message === 'Database non disponibile') {
      throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
    }
    throw error;
  }
}

export async function getGiocatoriByLega(lega_id) {
  const db = getDb();
  const result = await db.query(`
    SELECT g.*, 
           g.quotazione
    FROM giocatori g
    JOIN squadre s ON g.squadra_id = s.id
    WHERE s.lega_id = ?
  `, [lega_id]);
  
  return result.rows;
}

export async function getAllGiocatori() {
  const db = getDb();
  const result = await db.query(`
    SELECT *, 
           quotazione
    FROM giocatori
  `);
  
  return result.rows;
}

export async function updateGiocatore(id, giocatoreData) {
    try {
        const db = getDb();
        if (!db) {
            throw new Error('Database non disponibile');
        }
        
        const { squadra_id, nome, cognome, ruolo, quotazione, fv_mp, qi, qa, site_id, nazione_campionato, fvm, media_voto } = giocatoreData;
        
        const query = `
            UPDATE giocatori 
            SET squadra_id = ?, nome = ?, cognome = ?, ruolo = ?, quotazione = ?, fv_mp = ?, qi = ?, qa = ?, site_id = ?, nazione_campionato = ?, fvm = ?, media_voto = ?
            WHERE id = ?
        `;
        
        const params = [squadra_id, nome, cognome || null, ruolo, quotazione || 0, fv_mp || 0, qi || 0, qa || 0, site_id || null, nazione_campionato || null, fvm || 0, media_voto || 0, id];
        
        const result = await db.query(query, params);
        console.log(`✅ Giocatore aggiornato: ${result.affectedRows} righe modificate`);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Errore aggiornamento giocatore:', error.message);
        throw error;
    }
}

export async function updateGiocatorePartial(id, updates) {
    try {
        const db = getDb();
        if (!db) {
            throw new Error('Database non disponibile');
        }
        
        const allowedFields = ['squadra_id', 'nome', 'cognome', 'ruolo', 'quotazione', 'fv_mp', 'qi', 'qa', 'site_id', 'nazione_campionato', 'fvm', 'media_voto'];
        const setParts = [];
        const params = [];
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                setParts.push(`${key} = ?`);
                // Gestisci cognome come NULL se vuoto
                if (key === 'cognome' && (value === '' || value === null || value === undefined)) {
                    params.push(null);
                } else {
                    params.push(value);
                }
            }
        }
        
        if (setParts.length === 0) {
            throw new Error('Nessun campo valido da aggiornare');
        }
        
        const query = `UPDATE giocatori SET ${setParts.join(', ')} WHERE id = ?`;
        params.push(id);
        
        const result = await db.query(query, params);
        console.log(`✅ Giocatore aggiornato parzialmente: ${result.affectedRows} righe modificate`);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Errore aggiornamento parziale giocatore:', error.message);
        throw error;
    }
}

export async function deleteGiocatore(id) {
  const db = getDb();
  await db.query('DELETE FROM giocatori WHERE id = ?', [id]);
} 