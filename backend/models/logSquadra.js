import { getDb } from '../db/postgres.js';

const db = getDb();

// Crea un nuovo log per una squadra
export function createLogSquadra(logData, callback) {
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

  db.run(
    `INSERT INTO log_squadre 
     (squadra_id, lega_id, tipo_evento, categoria, titolo, descrizione, dati_aggiuntivi, utente_id, giocatore_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ],
    function(err) {
      if (err) {
        console.error('Errore creazione log squadra:', err);
        callback(err);
      } else {
        console.log('Log squadra creato con ID:', this.lastID);
        callback(null, this.lastID);
      }
    }
  );
}

// Ottieni tutti i log di una squadra
export function getLogSquadra(squadraId, callback) {
  db.all(
    `SELECT ls.*, 
            u.nome as utente_nome, u.cognome as utente_cognome,
            g.nome as giocatore_nome, g.cognome as giocatore_cognome,
            g.ruolo as giocatore_ruolo
     FROM log_squadre ls
     LEFT JOIN users u ON ls.utente_id = u.id
     LEFT JOIN giocatori g ON ls.giocatore_id = g.id
     WHERE ls.squadra_id = ?
     ORDER BY ls.data_evento DESC`,
    [squadraId],
    (err, rows) => {
      if (err) {
        console.error('Errore recupero log squadra:', err);
        callback(err);
      } else {
        // Parsa i dati_aggiuntivi se presenti
        const logs = rows.map(row => ({
          ...row,
          dati_aggiuntivi: row.dati_aggiuntivi ? JSON.parse(row.dati_aggiuntivi) : null
        }));
        callback(null, logs);
      }
    }
  );
}

// Ottieni log di una squadra con filtri
export function getLogSquadraFiltrati(squadraId, filtri, callback) {
  let query = `
    SELECT ls.*, 
            u.nome as utente_nome, u.cognome as utente_cognome,
            g.nome as giocatore_nome, g.cognome as giocatore_cognome,
            g.ruolo as giocatore_ruolo
     FROM log_squadre ls
     LEFT JOIN users u ON ls.utente_id = u.id
     LEFT JOIN giocatori g ON ls.giocatore_id = g.id
     WHERE ls.squadra_id = ?
  `;
  
  const params = [squadraId];
  
  if (filtri.categoria) {
    query += ' AND ls.categoria = ?';
    params.push(filtri.categoria);
  }
  
  if (filtri.tipo_evento) {
    query += ' AND ls.tipo_evento = ?';
    params.push(filtri.tipo_evento);
  }
  
  if (filtri.data_inizio) {
    query += ' AND ls.data_evento >= ?';
    params.push(filtri.data_inizio);
  }
  
  if (filtri.data_fine) {
    query += ' AND ls.data_evento <= ?';
    params.push(filtri.data_fine);
  }
  
  query += ' ORDER BY ls.data_evento DESC';
  
  if (filtri.limit) {
    query += ' LIMIT ?';
    params.push(filtri.limit);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Errore recupero log squadra filtrati:', err);
      callback(err);
    } else {
      const logs = rows.map(row => ({
        ...row,
        dati_aggiuntivi: row.dati_aggiuntivi ? JSON.parse(row.dati_aggiuntivi) : null
      }));
      callback(null, logs);
    }
  });
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