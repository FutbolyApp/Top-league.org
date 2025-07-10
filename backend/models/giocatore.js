import { getDb } from '../db/config.js';
const db = getDb();

export function createGiocatore(data, callback) {
  const sql = `INSERT INTO giocatori (lega_id, squadra_id, nome, cognome, ruolo, squadra_reale, quotazione_attuale, salario, costo_attuale, costo_precedente, prestito, anni_contratto, cantera, triggers, valore_prestito, valore_trasferimento, roster)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [
    data.lega_id,
    data.squadra_id,
    data.nome,
    data.cognome || null,
    data.ruolo,
    data.squadra_reale || null,
    data.quotazione_attuale || null,
    data.salario || null,
    data.costo_attuale || null,
    data.costo_precedente || null,
    data.prestito ? 1 : 0,
    data.anni_contratto || null,
    data.cantera ? 1 : 0,
    data.triggers || null,
    data.valore_prestito || 0,
    data.valore_trasferimento || 0,
    data.roster || 'A'
  ], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

export function getGiocatoreById(id, callback) {
  db.get(`
    SELECT *, 
           COALESCE(qa, quotazione_attuale) as quotazione_attuale,
           qi
    FROM giocatori WHERE id = ?
  `, [id], callback);
}

export function getGiocatoriBySquadra(squadra_id, callback) {
  db.all(`
    SELECT *, 
           COALESCE(qa, quotazione_attuale) as quotazione_attuale,
           fvm as fv_mp,
           qi
    FROM giocatori WHERE squadra_id = ?
  `, [squadra_id], callback);
}

export function getGiocatoriByLega(lega_id, callback) {
  db.all(`
    SELECT *, 
           COALESCE(qa, quotazione_attuale) as quotazione_attuale,
           qi
    FROM giocatori WHERE lega_id = ?
  `, [lega_id], callback);
}

export function getAllGiocatori(callback) {
  db.all(`
    SELECT *, 
           COALESCE(qa, quotazione_attuale) as quotazione_attuale,
           qi
    FROM giocatori
  `, [], callback);
}

export function updateGiocatore(id, data, callback) {
  // Aggiornamento completo con tutti i campi
  const sql = `UPDATE giocatori SET lega_id=?, squadra_id=?, nome=?, cognome=?, ruolo=?, squadra_reale=?, quotazione_attuale=?, salario=?, costo_attuale=?, costo_precedente=?, prestito=?, anni_contratto=?, cantera=?, triggers=?, valore_prestito=?, valore_trasferimento=?, roster=? WHERE id=?`;
  db.run(sql, [
    data.lega_id,
    data.squadra_id,
    data.nome,
    data.cognome || null,
    data.ruolo,
    data.squadra_reale || null,
    data.quotazione_attuale || null,
    data.salario || null,
    data.costo_attuale || null,
    data.costo_precedente || null,
    data.prestito ? 1 : 0,
    data.anni_contratto || null,
    data.cantera ? 1 : 0,
    data.triggers || null,
    data.valore_prestito || 0,
    data.valore_trasferimento || 0,
    data.roster || 'A',
    id
  ], callback);
}

export function updateGiocatorePartial(id, data, callback) {
  console.log('=== DEBUG UPDATE GIOCATORE PARTIAL ===');
  console.log('Giocatore ID:', id);
  console.log('Dati da aggiornare:', JSON.stringify(data, null, 2));
  
  // Prima ottieni i dati attuali del giocatore
  getGiocatoreById(id, (err, giocatore) => {
    if (err) {
      console.error('Errore recupero giocatore:', err);
      return callback(err);
    }
    
    if (!giocatore) {
      console.error('Giocatore non trovato con ID:', id);
      return callback(new Error('Giocatore non trovato'));
    }
    
    console.log('Giocatore trovato:', JSON.stringify(giocatore, null, 2));
    
    // Mappa i nomi dei campi dal frontend al database
    const fieldMapping = {
      'quotazione_attuale': 'qa',
      'fanta_valore_mercato': 'fvm',
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
    
    // Esegui l'aggiornamento completo
    const sql = `UPDATE giocatori SET lega_id=?, squadra_id=?, nome=?, cognome=?, ruolo=?, squadra_reale=?, quotazione_attuale=?, salario=?, costo_attuale=?, costo_precedente=?, prestito=?, anni_contratto=?, cantera=?, triggers=?, valore_prestito=?, valore_trasferimento=?, roster=? WHERE id=?`;
    
    const params = [
      updateData.lega_id,
      updateData.squadra_id,
      updateData.nome,
      updateData.cognome || null,
      updateData.ruolo,
      updateData.squadra_reale || null,
      updateData.quotazione_attuale || null,
      updateData.salario || null,
      updateData.costo_attuale || null,
      updateData.costo_precedente || null,
      updateData.prestito ? 1 : 0,
      updateData.anni_contratto || null,
      updateData.cantera ? 1 : 0,
      updateData.triggers || null,
      updateData.valore_prestito || 0,
      updateData.valore_trasferimento || 0,
      updateData.roster || 'A',
      id
    ];
    
    console.log('SQL Query:', sql);
    console.log('Parametri:', JSON.stringify(params, null, 2));
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Errore esecuzione query UPDATE:', err);
        return callback(err);
      }
      
      console.log(`Query eseguita con successo. Righe modificate: ${this.changes}`);
      callback(null, this.changes);
    });
  });
}

export function deleteGiocatore(id, callback) {
  db.run('DELETE FROM giocatori WHERE id = ?', [id], callback);
} 