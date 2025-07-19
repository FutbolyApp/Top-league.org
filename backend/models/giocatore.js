import { getDb } from '../db/postgres.js';

export async function createGiocatore(data) {
  try {
    console.log(`🔄 Creando giocatore nel database:`, JSON.stringify(data, null, 2));
    
    const db = getDb();
    
    // Prima ottieni il lega_id dalla squadra_id
    let lega_id = null;
    if (data.squadra_id) {
      const squadraResult = await db.query('SELECT lega_id FROM squadre WHERE id = $1', [data.squadra_id]);
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`;
    
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
    const giocatoreId = result.rows[0].id;
    
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
    FROM giocatori WHERE id = $1
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
      FROM giocatori WHERE squadra_id = $1
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
    WHERE s.lega_id = $1
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
  const db = getDb();
  
  // Ottieni il lega_id dalla squadra_id se non è fornito direttamente
  let lega_id = data.lega_id;
  if (!lega_id && data.squadra_id) {
    const squadraResult = await db.query('SELECT lega_id FROM squadre WHERE id = $1', [data.squadra_id]);
    if (squadraResult.rows?.length || 0 > 0) {
      lega_id = squadraResult.rows[0].lega_id;
    }
  }
  
  // Aggiornamento completo con tutti i campi
  const sql = `UPDATE giocatori SET squadra_id=$1, lega_id=$2, nome=$3, cognome=$4, ruolo=$5, squadra_reale=$6, quotazione_attuale=$7, salario=$8, costo_attuale=$9, costo_precedente=$10, prestito=$11, anni_contratto=$12, cantera=$13, triggers=$14, valore_prestito=$15, valore_trasferimento=$16, roster=$17 WHERE id=$18`;
  await db.query(sql, [
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
  ]);
}

export async function updateGiocatorePartial(id, data) {
  console.log('=== DEBUG UPDATE GIOCATORE PARTIAL ===');
  console.log('Giocatore ID:', id);
  console.log('Dati da aggiornare:', JSON.stringify(data, null, 2));
  
  // Prima ottieni i dati attuali del giocatore
  const giocatore = await getGiocatoreById(id);
  
  if (!giocatore) {
    console.error('Giocatore non trovato con ID:', id);
    throw new Error('Giocatore non trovato');
  }
  
  console.log('Giocatore trovato:', JSON.stringify(giocatore, null, 2));
  
  // Mappa i nomi dei campi dal frontend al database
  const fieldMapping = {
    'quotazione_attuale': 'quotazione_attuale',
    'media_voto': 'media_voto',
    'fantamedia_voto': 'fantamedia_voto',
    'costo_attuale': 'costo_attuale',
    'quotazione_iniziale': 'qi',
    'anni_contratto': 'anni_contratto',
    'prestito': 'prestito',
    'triggers': 'triggers',
    'nome': 'nome',
    'cognome': 'cognome',
    'ruolo': 'ruolo',
    'squadra_reale': 'squadra_reale',
    'cantera': 'cantera',
    'valore_prestito': 'valore_prestito',
    'valore_trasferimento': 'valore_trasferimento',
    'ingaggio': 'costo_attuale',
    'roster': 'roster'
  };
  
  // Prepara i dati per l'aggiornamento
  const updateData = { ...giocatore };
  
  console.log('Dati originali giocatore:', JSON.stringify(giocatore, null, 2));
  
  Object.entries(data).forEach(([key, value]) => {
    const dbField = fieldMapping[key] || key;
    updateData[dbField] = value;
    console.log(`Aggiornamento campo: ${key} -> ${dbField} = ${value}`);
  });
  
  console.log('Dati finali per aggiornamento:', JSON.stringify(updateData, null, 2));
  
  // Ottieni il lega_id dalla squadra_id se non è già presente
  let lega_id = updateData.lega_id;
  if (!lega_id && updateData.squadra_id) {
    const squadraResult = await db.query('SELECT lega_id FROM squadre WHERE id = $1', [updateData.squadra_id]);
    if (squadraResult.rows?.length || 0 > 0) {
      lega_id = squadraResult.rows[0].lega_id;
    }
  }
  
  // Esegui l'aggiornamento completo
  const sql = `UPDATE giocatori SET squadra_id=$1, lega_id=$2, nome=$3, cognome=$4, ruolo=$5, squadra_reale=$6, quotazione_attuale=$7, salario=$8, costo_attuale=$9, costo_precedente=$10, prestito=$11, anni_contratto=$12, cantera=$13, triggers=$14, valore_prestito=$15, valore_trasferimento=$16, roster=$17 WHERE id=$18`;
  
  const params = [
    updateData.squadra_id,
    lega_id,
    updateData?.nome || 'Nome',
    updateData?.cognome || '' || null,
    updateData?.ruolo || 'Ruolo',
    updateData.squadra_reale || null,
    updateData.quotazione_attuale || null,
    updateData.salario || null,
    updateData.costo_attuale || null,
    updateData.costo_precedente || null,
    updateData.prestito ? true : false,
    updateData.anni_contratto || null,
    updateData.cantera ? true : false,
    updateData.triggers || null,
    updateData.valore_prestito || 0,
    updateData.valore_trasferimento || 0,
    updateData.roster || 'A',
    id
  ];
  
  console.log('SQL Query:', sql);
  console.log('Parametri:', JSON.stringify(params, null, 2));
  
  const result = await db.query(sql, params);
  console.log(`Query eseguita con successo. Righe modificate: ${result.rowCount}`);
  
  return result.rowCount;
}

export async function deleteGiocatore(id) {
  const db = getDb();
  await db.query('DELETE FROM giocatori WHERE id = $1', [id]);
} 