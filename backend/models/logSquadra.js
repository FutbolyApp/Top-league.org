import { getDb } from '../db/mariadb.js';

// Crea un nuovo log per una squadra
export async function createLogSquadra(logData) {
  try {
    const {
      squadra_id,
      lega_id,
      tipo_evento,
      categoria,
      titolo,
      descrizione,
      dati_aggiuntivi,
      utente_id,
      giocatore_id
    } = logData;

    const db = getDb();
    const result = await db.query(
      `INSERT INTO log_squadre 
       (squadra_id, lega_id, tipo_evento, categoria, titolo, descrizione, dati_aggiuntivi, utente_id, giocatore_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        squadra_id,
        lega_id,
        tipo_evento,
        categoria,
        titolo,
        descrizione,
        dati_aggiuntivi ? JSON.stringify(dati_aggiuntivi) : null,
        utente_id,
        giocatore_id
      ]
    );
    
    console.log('Log squadra creato con ID:', result.rows[0].id);
    return result.rows[0].id;
  } catch (err) {
    console.error('Errore creazione log squadra:', err);
    throw err;
  }
}

// Ottieni tutti i log di una squadra
export async function getLogSquadra(squadraId) {
  try {
    const db = getDb();
    const result = await db.query(
      `SELECT ls.*, 
              u.nome as utente_nome, u.cognome as utente_cognome,
              g.nome as giocatore_nome, g.cognome as giocatore_cognome,
              g.ruolo as giocatore_ruolo
       FROM log_squadre ls
       LEFT JOIN users u ON ls.utente_id = u.id
       LEFT JOIN giocatori g ON ls.giocatore_id = g.id
       WHERE ls.squadra_id = $1
       ORDER BY ls.data_evento DESC`,
      [squadraId]
    );
    
    // Parsa i dati_aggiuntivi se presenti
    const logs = result.rows.map(row => ({
      ...row,
      dati_aggiuntivi: row.dati_aggiuntivi ? JSON.parse(row.dati_aggiuntivi) : null
    }));
    
    return logs;
  } catch (err) {
    console.error('Errore recupero log squadra:', err);
    throw err;
  }
}

// Ottieni log di una squadra con filtri
export async function getLogSquadraFiltrati(squadraId, filtri) {
  try {
    let query = `
      SELECT ls.*, 
              u.nome as utente_nome, u.cognome as utente_cognome,
              g.nome as giocatore_nome, g.cognome as giocatore_cognome,
              g.ruolo as giocatore_ruolo
       FROM log_squadre ls
       LEFT JOIN users u ON ls.utente_id = u.id
       LEFT JOIN giocatori g ON ls.giocatore_id = g.id
       WHERE ls.squadra_id = $1
    `;
    
    const params = [squadraId];
    let paramIndex = 2;
    
    if (filtri.categoria) {
      query += ` AND ls.categoria = $${paramIndex}`;
      params.push(filtri.categoria);
      paramIndex++;
    }
    
    if (filtri.tipo_evento) {
      query += ` AND ls.tipo_evento = $${paramIndex}`;
      params.push(filtri.tipo_evento);
      paramIndex++;
    }
    
    if (filtri.data_inizio) {
      query += ` AND ls.data_evento >= $${paramIndex}`;
      params.push(filtri.data_inizio);
      paramIndex++;
    }
    
    if (filtri.data_fine) {
      query += ` AND ls.data_evento <= $${paramIndex}`;
      params.push(filtri.data_fine);
      paramIndex++;
    }
    
    query += ' ORDER BY ls.data_evento DESC';
    
    if (filtri.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filtri.limit);
    }
    
    const db = getDb();
    const result = await db.query(query, params);
    
    const logs = result.rows.map(row => ({
      ...row,
      dati_aggiuntivi: row.dati_aggiuntivi ? JSON.parse(row.dati_aggiuntivi) : null
    }));
    
    return logs;
  } catch (err) {
    console.error('Errore recupero log squadra filtrati:', err);
    throw err;
  }
}

// Categorie di eventi disponibili
export const CATEGORIE_EVENTI = {
  TRASFERIMENTO: 'trasferimento',
  CONTRATTO: 'contratto',
  OFFERTA: 'offerta',
  RICHIESTA_ADMIN: 'richiesta_admin',
  PAGAMENTO: 'pagamento',
  RINNOVO: 'rinnovo',
  SISTEMA: 'sistema',
  TORNEO: 'torneo',
  FINANZA: 'finanza'
};

// Tipi di eventi disponibili
export const TIPI_EVENTI = {
  // Trasferimenti
  GIOCATORE_ACQUISTATO: 'giocatore_acquistato',
  GIOCATORE_VENDUTO: 'giocatore_venduto',
  GIOCATORE_PRESTATO: 'giocatore_prestato',
  GIOCATORE_RESTITUITO: 'giocatore_restituito',
  
  // Offerte
  OFFERTA_RICEVUTA: 'offerta_ricevuta',
  OFFERTA_INVIATA: 'offerta_inviata',
  OFFERTA_ACCETTATA: 'offerta_accettata',
  OFFERTA_RIFIUTATA: 'offerta_rifiutata',
  
  // Contratti
  CONTRATTO_FIRMATO: 'contratto_firmato',
  CONTRATTO_RINNOVATO: 'contratto_rinnovato',
  CONTRATTO_SCADUTO: 'contratto_scaduto',
  
  // Pagamenti
  PAGAMENTO_EFFETTUATO: 'pagamento_effettuato',
  PAGAMENTO_RICEVUTO: 'pagamento_ricevuto',
  
  // Richieste admin
  RICHIESTA_ADMIN_INVIATA: 'richiesta_admin_inviata',
  RICHIESTA_ADMIN_APPROVATA: 'richiesta_admin_approvata',
  RICHIESTA_ADMIN_RIFIUTATA: 'richiesta_admin_rifiutata',
  
  // Sistema
  SQUADRA_CREATA: 'squadra_creata',
  SQUADRA_MODIFICATA: 'squadra_modificata',
  
  // Tornei
  ISCRIZIONE_TORNEO: 'iscrizione_torneo',
  VITTORIA_PARTITA: 'vittoria_partita',
  SCONFITTA_PARTITA: 'sconfitta_partita',
  PAREGGIO_PARTITA: 'pareggio_partita',
  
  // Finanza
  CASSE_AGGIORNATE: 'casse_aggiornate',
  BONUS_RICEVUTO: 'bonus_ricevuto',
  PENALE_PAGATA: 'penale_pagata'
}; 