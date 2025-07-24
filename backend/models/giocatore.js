import { getDb } from '../db/mariadb.js';

export async function createGiocatore(data) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    // Determina lega_id
    let lega_id = null;
    if (data.squadra_id) {
      const squadraResult = await db.query('SELECT lega_id FROM squadre WHERE id = ?', [data.squadra_id]);
      if (squadraResult.rows?.length || 0 > 0) {
        lega_id = squadraResult.rows[0].lega_id;
      } else {
        throw new Error(`Squadra con ID ${data.squadra_id} non trovata`);
      }
    } else if (data.lega_id) {
      lega_id = data.lega_id;
    } else {
      throw new Error('È richiesto squadra_id o lega_id per creare un giocatore');
    }
    
    const sql = `INSERT INTO giocatori (squadra_id, lega_id, nome, cognome, ruolo, squadra_reale, quotazione_attuale, salario, costo_attuale, costo_precedente, prestito, anni_contratto, cantera, triggers, valore_prestito, valore_trasferimento, roster)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      data.squadra_id,
      lega_id,
      data?.nome || 'Nome',
      data?.cognome || '' || null,
      data?.ruolo || 'Ruolo',
      data.squadra_reale || null,
      data.quotazione_attuale || null,
      data.salario || null,
      data.costo_attuale || null,
      data.costo_precedente || null,
      data.prestito ? true : false,
      data.anni_contratto || null,
      data.cantera ? true : false,
      data.triggers || null,
      data.valore_prestito || 0,
      data.valore_trasferimento || 0,
      data.roster || 'A'
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
             quotazione_attuale
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
           g.quotazione_attuale
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
           quotazione_attuale
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
    
    // Determina lega_id se necessario
    let lega_id = null;
    if (data.squadra_id) {
      const squadraResult = await db.query('SELECT lega_id FROM squadre WHERE id = ?', [data.squadra_id]);
      if (squadraResult.rows?.length || 0 > 0) {
        lega_id = squadraResult.rows[0].lega_id;
      } else {
        throw new Error(`Squadra con ID ${data.squadra_id} non trovata`);
      }
    }
    
    const sql = `UPDATE giocatori SET squadra_id=?, lega_id=?, nome=?, cognome=?, ruolo=?, squadra_reale=?, quotazione_attuale=?, salario=?, costo_attuale=?, costo_precedente=?, prestito=?, anni_contratto=?, cantera=?, triggers=?, valore_prestito=?, valore_trasferimento=?, roster=? WHERE id=?`;
    
    const params = [
      data.squadra_id,
      lega_id,
      data?.nome || 'Nome',
      data?.cognome || '' || null,
      data?.ruolo || 'Ruolo',
      data.squadra_reale || null,
      data.quotazione_attuale || null,
      data.salario || null,
      data.costo_attuale || null,
      data.costo_precedente || null,
      data.prestito ? true : false,
      data.anni_contratto || null,
      data.cantera ? true : false,
      data.triggers || null,
      data.valore_prestito || 0,
      data.valore_trasferimento || 0,
      data.roster || 'A',
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
    
    // Determina lega_id se necessario
    let lega_id = null;
    if (data.squadra_id) {
      const squadraResult = await db.query('SELECT lega_id FROM squadre WHERE id = ?', [data.squadra_id]);
      if (squadraResult.rows?.length || 0 > 0) {
        lega_id = squadraResult.rows[0].lega_id;
      } else {
        throw new Error(`Squadra con ID ${data.squadra_id} non trovata`);
      }
    }
    
    const sql = `UPDATE giocatori SET squadra_id=?, lega_id=?, nome=?, cognome=?, ruolo=?, squadra_reale=?, quotazione_attuale=?, salario=?, costo_attuale=?, costo_precedente=?, prestito=?, anni_contratto=?, cantera=?, triggers=?, valore_prestito=?, valore_trasferimento=?, roster=? WHERE id=?`;
    
    const params = [
      data.squadra_id,
      lega_id,
      data?.nome || 'Nome',
      data?.cognome || '' || null,
      data?.ruolo || 'Ruolo',
      data.squadra_reale || null,
      data.quotazione_attuale || null,
      data.salario || null,
      data.costo_attuale || null,
      data.costo_precedente || null,
      data.prestito ? true : false,
      data.anni_contratto || null,
      data.cantera ? true : false,
      data.triggers || null,
      data.valore_prestito || 0,
      data.valore_trasferimento || 0,
      data.roster || 'A',
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