import { getDb } from '../db/mariadb.js';

export async function createGiocatore(data) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    // Verifica che squadra_id sia fornito
    if (!data.squadra_id) {
      throw new Error('È richiesto squadra_id per creare un giocatore');
    }
    
    const sql = `INSERT INTO giocatori (squadra_id, nome, cognome, ruolo, quotazione, fv_mp, qi, qa, site_id, nazione_campionato, fvm, media_voto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      data.squadra_id,
      data?.nome || 'Nome',
      data?.cognome || null, // Permette NULL
      data?.ruolo || 'Ruolo',
      data.quotazione || null,
      data.fv_mp || null,
      data.qi || null,
      data.qa || null,
      data.site_id || null,
      data.nazione_campionato || null,
      data.fvm || null,
      data.media_voto || null
    ];
    
    console.log(`🔄 SQL: ${sql}`);
    console.log(`🔄 Parametri:`, JSON.stringify(params, null, 2));
    
    const result = await db.query(sql, params);
    const giocatoreId = result.insertId;
    
    console.log(`✅ Giocatore creato con successo. ID: ${giocatoreId}`);
    return giocatoreId;
  } catch (error) {
    console.error(`❌ Errore creazione giocatore ${data?.nome || 'Nome'}:`, error.message);
    console.error(`❌ Stack trace:`, error.stack);
    console.error(`❌ Dati giocatore:`, JSON.stringify(data, null, 2));
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

export async function updateGiocatore(id, data) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const sql = `UPDATE giocatori SET squadra_id=?, nome=?, cognome=?, ruolo=?, quotazione=?, fv_mp=?, qi=?, qa=?, site_id=?, nazione_campionato=?, fvm=?, media_voto=? WHERE id=?`;
    
    const params = [
      data.squadra_id,
      data?.nome || 'Nome',
      data?.cognome || null,
      data?.ruolo || 'Ruolo',
      data.quotazione || null,
      data.fv_mp || null,
      data.qi || null,
      data.qa || null,
      data.site_id || null,
      data.nazione_campionato || null,
      data.fvm || null,
      data.media_voto || null,
      id
    ];
    
    console.log(`🔄 SQL: ${sql}`);
    console.log(`🔄 Parametri:`, JSON.stringify(params, null, 2));
    
    await db.query(sql, params);
    
    console.log(`✅ Giocatore aggiornato con successo. ID: ${id}`);
  } catch (error) {
    console.error(`❌ Errore aggiornamento giocatore ${id}:`, error.message);
    console.error(`❌ Stack trace:`, error.stack);
    console.error(`❌ Dati giocatore:`, JSON.stringify(data, null, 2));
    throw error;
  }
}

export async function updateGiocatorePartial(id, data) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const sql = `UPDATE giocatori SET squadra_id=?, nome=?, cognome=?, ruolo=?, quotazione=?, fv_mp=?, qi=?, qa=?, site_id=?, nazione_campionato=?, fvm=?, media_voto=? WHERE id=?`;
    
    const params = [
      data.squadra_id,
      data?.nome || 'Nome',
      data?.cognome || null,
      data?.ruolo || 'Ruolo',
      data.quotazione || null,
      data.fv_mp || null,
      data.qi || null,
      data.qa || null,
      data.site_id || null,
      data.nazione_campionato || null,
      data.fvm || null,
      data.media_voto || null,
      id
    ];
    
    console.log(`🔄 SQL: ${sql}`);
    console.log(`🔄 Parametri:`, JSON.stringify(params, null, 2));
    
    await db.query(sql, params);
    
    console.log(`✅ Giocatore aggiornato con successo. ID: ${id}`);
  } catch (error) {
    console.error(`❌ Errore aggiornamento giocatore ${id}:`, error.message);
    console.error(`❌ Stack trace:`, error.stack);
    console.error(`❌ Dati giocatore:`, JSON.stringify(data, null, 2));
    throw error;
  }
}

export async function deleteGiocatore(id) {
  const db = getDb();
  await db.query('DELETE FROM giocatori WHERE id = ?', [id]);
} 