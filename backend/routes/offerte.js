import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createOfferta, getOfferteByLega, updateOfferta } from '../models/offerta.js';
import { getDb } from '../db/postgres.js';
import { authenticateToken } from '../middleware/auth.js';
import { createRosterManager, handleLoanAcceptance } from '../models/rosterManager.js';
import { createLogSquadra, CATEGORIE_EVENTI, TIPI_EVENTI } from '../models/logSquadra.js';
import { validateRoleLimits, isClassicLeague } from '../utils/leagueConfig.js';
import { getLegaById } from '../models/lega.js';

const router = express.Router();

// Crea una nuova offerta (trasferimento/prestito)
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, tipo, valore } = req.body;
    if (!lega_id || !squadra_mittente_id || !squadra_destinatario_id || !giocatore_id || !tipo || !valore) {
      return res.status(400).json({ error: 'Parametri mancanti' });
    }
    
    // Calcola il salario
    let salario = valore;
    
    const offertaId = await createOfferta({
      lega_id,
      squadra_mittente_id,
      squadra_destinatario_id,
      giocatore_id,
      tipo,
      valore,
      stato: 'inviata'
    });
    
    res.json({ success: true, offertaId, salario });
  } catch (error) {
    console.error('Errore creazione offerta:', error);
    res.status(500).json({ error: 'Errore creazione offerta', details: error.message });
  }
});

// Ottieni tutte le offerte di una lega
router.get('/lega/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const offerte = await getOfferteByLega(legaId);
    res.json({ offerte });
  } catch (error) {
    console.error('Errore recupero offerte:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni movimenti di mercato per una lega (offerte completate)
router.get('/movimenti/:legaId', authenticateToken, async (req, res) => {
  try {
    const { legaId } = req.params;
    const db = getDb();
    
    const query = `
      SELECT o.id, o.tipo, o.valore, o.created_at as data,
             g.nome as giocatore_nome, g.cognome as giocatore_cognome,
             sm.nome as squadra_mittente, sd.nome as squadra_destinataria,
             o.lega_id
      FROM offerte o
      JOIN giocatori g ON o.giocatore_id = g.id
      JOIN squadre sm ON o.squadra_mittente_id = sm.id
      JOIN squadre sd ON o.squadra_destinatario_id = sd.id
      WHERE o.lega_id = $1 AND o.stato = 'accettata'
      ORDER BY o.created_at DESC
      LIMIT 20
    `;
    
    const result = await db.query(query, [legaId]);
    const rows = result.rows;
    
    // Se non ci sono offerte, restituisci array vuoto
    if (!rows || rows.length === 0) {
      return res.json({ movimenti: [] });
    }
    
    // Formatta i dati per il frontend
    const movimenti = rows.map(row => ({
      id: row.id,
      tipo: row.tipo,
      valore: row.valore,
      data: row.data,
      giocatore_nome: `${row.giocatore_nome} ${row.giocatore_cognome}`,
      squadra_mittente: row.squadra_mittente,
      squadra_destinataria: row.squadra_destinataria,
      lega_id: row.lega_id
    }));
    
    res.json({ movimenti });
  } catch (err) {
    console.error('Errore query movimenti:', err);
    res.status(500).json({ error: 'Errore DB', details: err.message });
  }
});

// Ottieni statistiche roster per una squadra
router.get('/roster/stats/:squadraId', authenticateToken, async (req, res) => {
  try {
    const { squadraId } = req.params;
    const { id: userId, ruolo } = req.user;
    const db = getDb();

    // Verifica che l'utente sia proprietario della squadra O sia admin
    let squadra;
    
    if (ruolo === 'admin' || ruolo === 'superadmin' || ruolo === 'subadmin' || 
        ruolo === 'Admin' || ruolo === 'SuperAdmin' || ruolo === 'SubAdmin') {
      // Admin può vedere tutte le squadre
      const result = await db.query('SELECT * FROM squadre WHERE id = $1', [squadraId]);
      squadra = result.rows[0];
    } else {
      // Utente normale deve essere proprietario
      const result = await db.query('SELECT * FROM squadre WHERE id = $1 AND proprietario_id = $2', [squadraId, userId]);
      squadra = result.rows[0];
    }

    if (!squadra) {
      return res.status(404).json({ error: 'Squadra non trovata o non autorizzato' });
    }

    const rosterManager = createRosterManager(squadra.lega_id);
    const stats = await rosterManager.getRosterStats(squadraId);

    res.json(stats);
  } catch (error) {
    console.error('Errore recupero statistiche roster:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni giocatori divisi per roster
router.get('/roster/:squadraId', authenticateToken, async (req, res) => {
  try {
    const { squadraId } = req.params;
    const { id: userId, ruolo } = req.user;
    const db = getDb();

    // Verifica che l'utente sia proprietario della squadra O sia admin
    let squadra;
    
    if (ruolo === 'admin' || ruolo === 'superadmin' || ruolo === 'subadmin' || 
        ruolo === 'Admin' || ruolo === 'SuperAdmin' || ruolo === 'SubAdmin') {
      // Admin può vedere tutte le squadre
      const result = await db.query('SELECT * FROM squadre WHERE id = $1', [squadraId]);
      squadra = result.rows[0];
    } else {
      // Utente normale deve essere proprietario
      const result = await db.query('SELECT * FROM squadre WHERE id = $1 AND proprietario_id = $2', [squadraId, userId]);
      squadra = result.rows[0];
    }

    if (!squadra) {
      return res.status(404).json({ error: 'Squadra non trovata o non autorizzato' });
    }

    const rosterManager = createRosterManager(squadra.lega_id);
    const giocatori = await rosterManager.getGiocatoriByRoster(squadraId);

    res.json(giocatori);
  } catch (error) {
    console.error('Errore recupero giocatori roster:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Gestisci ritorno prestito
router.post('/roster/loan-return', authenticateToken, async (req, res) => {
  try {
    const { giocatoreId } = req.body;
    const { id: userId } = req.user;
    const db = getDb();

    // Verifica che il giocatore appartenga a una squadra dell'utente
    const result = await db.query(
      `SELECT g.*, s.proprietario_id, s.lega_id, s.id as squadra_id
       FROM giocatori g 
       JOIN squadre s ON g.squadra_id = s.id 
       WHERE g.id = $1 AND s.proprietario_id = $2`,
      [giocatoreId, userId]
    );
    const giocatore = result.rows[0];

    if (!giocatore) {
      return res.status(404).json({ error: 'Giocatore non trovato o non autorizzato' });
    }

    const rosterManager = createRosterManager(giocatore.lega_id);
    const result2 = await rosterManager.handleLoanReturn(giocatore.squadra_id, giocatoreId);

    res.json(result2);
  } catch (error) {
    console.error('Errore gestione ritorno prestito:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Termina prestito e riporta giocatore alla squadra originale
router.post('/termina-prestito/:giocatoreId', authenticateToken, async (req, res) => {
  try {
    const { giocatoreId } = req.params;
    const { id: userId } = req.user;
    const db = getDb();

    // Verifica che il giocatore sia in prestito e appartenga a una squadra dell'utente
    const result = await db.query(
      `SELECT g.*, s.proprietario_id, s.lega_id, s.id as squadra_id, s.nome as squadra_nome
       FROM giocatori g 
       JOIN squadre s ON g.squadra_id = s.id 
       WHERE g.id = $1 AND s.proprietario_id = $2 AND g.prestito = 1`,
      [giocatoreId, userId]
    );
    const giocatore = result.rows[0];

    if (!giocatore) {
      return res.status(404).json({ error: 'Giocatore in prestito non trovato o non autorizzato' });
    }

    // Imposta prestito = 0 e sposta in Roster A se possibile
    await db.query('UPDATE giocatori SET prestito = 0 WHERE id = $1', [giocatoreId]);
    
    res.json({ 
      success: true, 
      message: `Prestito terminato per ${giocatore.nome} ${giocatore.cognome}` 
    });
  } catch (error) {
    console.error('Errore terminazione prestito:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni log contratti
router.get('/log/:squadraId', requireAuth, async (req, res) => {
  try {
    const { squadraId } = req.params;
    const db = getDb();
    
    const sql = `
      SELECT lc.*, g.nome as giocatore_nome
      FROM log_contratti lc
      JOIN giocatori g ON lc.giocatore_id = g.id
      WHERE lc.squadra_id = $1
      ORDER BY lc.data_pagamento DESC
      LIMIT 50
    `;
    
    const result = await db.query(sql, [squadraId]);
    res.json({ log: result.rows });
  } catch (error) {
    console.error('Errore nel recupero log:', error);
    res.status(500).json({ error: 'Errore nel recupero log' });
  }
});

// Endpoint specifici per accettare/rifiutare offerte (devono essere prima dell'endpoint generico)
// Accetta offerta
router.post('/accetta/:offerta_id', authenticateToken, async (req, res) => {
  const { offerta_id } = req.params;
  const { id: giocatore_id } = req.user;
  const db = getDb();

  try {
    // Ottieni l'offerta
    const offerta = await db.query(
      `SELECT o.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome,
                gs.nome as giocatore_scambio_nome, gs.cognome as giocatore_scambio_cognome,
                sm.nome as squadra_mittente_nome, sd.nome as squadra_destinatario_nome
         FROM offerte o
         JOIN giocatori g ON o.giocatore_id = g.id
         LEFT JOIN giocatori gs ON o.giocatore_scambio_id = gs.id
         JOIN squadre sm ON o.squadra_mittente_id = sm.id
         JOIN squadre sd ON o.squadra_destinatario_id = sd.id
         WHERE o.id = $1 AND sd.proprietario_id = $2`,
      [offerta_id, giocatore_id]
    );

    if (offerta.rows.length === 0) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }

    const offertaData = offerta.rows[0];

    if (offertaData.stato !== 'in_attesa') {
      return res.status(400).json({ error: 'Offerta già processata' });
    }

    // Gestisci il sistema Roster A/B se attivato
    const rosterManager = createRosterManager(offertaData.lega_id);
    const isRosterABEnabled = await rosterManager.isRosterABEnabled();

    // Verifica spazio nel roster prima di accettare
    if (isRosterABEnabled) {
      // Conta giocatori attuali nella squadra destinataria
      const giocatoriAttuali = await db.query('SELECT COUNT(*) as count FROM giocatori WHERE squadra_id = $1', [offertaData.squadra_mittente_id]);
      const giocatoriAttualiCount = giocatoriAttuali.rows[0].count;

      // Ottieni limite massimo dalla lega
      const lega = await getLegaById(offertaData.lega_id);
      const maxGiocatori = lega.max_giocatori || 30;
      
      if (giocatoriAttualiCount >= maxGiocatori) {
        return res.status(400).json({ 
          error: `Impossibile accettare l'offerta. La squadra ha già raggiunto il limite massimo di ${maxGiocatori} giocatori.` 
        });
      }
    }

    // Validazione limiti di ruolo per leghe Classic
    const isClassic = await isClassicLeague(offertaData.lega_id);
    if (isClassic) {
      // Ottieni i dati del giocatore che viene trasferito
      const giocatoreIn = await db.query('SELECT * FROM giocatori WHERE id = $1', [offertaData.giocatore_id]);
      const giocatoreInData = giocatoreIn.rows[0];

      // Ottieni i dati del giocatore scambio se presente
      let giocatoreOut = null;
      if (offertaData.tipo === 'scambio' && offertaData.giocatore_scambio_id) {
        giocatoreOut = await db.query('SELECT * FROM giocatori WHERE id = $1', [offertaData.giocatore_scambio_id]);
        giocatoreOut = giocatoreOut.rows[0];
      }

      // Valida i limiti di ruolo per la squadra destinataria
      const validazioneDestinataria = await validateRoleLimits(
        offertaData.lega_id, 
        offertaData.squadra_mittente_id, 
        giocatoreInData, 
        giocatoreOut
      );

      if (!validazioneDestinataria.valid) {
        return res.status(400).json({ 
          error: `Impossibile accettare l'offerta. Violazione limiti di ruolo: ${validazioneDestinataria.errors.join(', ')}` 
        });
      }

      // Se è uno scambio, valida anche per la squadra mittente
      if (offertaData.tipo === 'scambio' && giocatoreOut) {
        const validazioneMittente = await validateRoleLimits(
          offertaData.lega_id, 
          offertaData.squadra_destinatario_id, 
          giocatoreOut, 
          giocatoreInData
        );

        if (!validazioneMittente.valid) {
          return res.status(400).json({ 
            error: `Impossibile accettare l'offerta. Violazione limiti di ruolo per la squadra mittente: ${validazioneMittente.errors.join(', ')}` 
          });
        }
      }
    }

    // Inizia transazione
    await db.query('BEGIN TRANSACTION');

    try {
      // Aggiorna stato offerta
      await db.query('UPDATE offerte SET stato = $1, data_accettazione = $2 WHERE id = $3', 
        ['accettata', new Date().toISOString(), offerta_id]);

      // Sposta il giocatore target
      console.log(`Spostamento giocatore ${offertaData.giocatore_id} da squadra ${offertaData.squadra_destinatario_id} a squadra ${offertaData.squadra_mittente_id}`);
      
      // Se è un prestito, imposta il campo prestito = 1 e gestisci i roster
      if (offertaData.tipo === 'prestito') {
        console.log(`Impostazione prestito = 1 per giocatore ${offertaData.giocatore_id}`);
        await db.query('UPDATE giocatori SET squadra_id = $1, prestito = 1, squadra_prestito_id = $2 WHERE id = $3', 
          [offertaData.squadra_mittente_id, offertaData.squadra_destinatario_id, offertaData.giocatore_id]);
        
        // Se il sistema Roster A/B è attivato:
        if (isRosterABEnabled) {
          // Il giocatore va in Roster A della squadra che lo riceve (può giocare)
          console.log(`Spostamento giocatore ${offertaData.giocatore_id} in Roster A della squadra ricevente (prestito)`);
          await db.query('UPDATE giocatori SET roster = $1 WHERE id = $2', ['A', offertaData.giocatore_id]);
        }
      } else {
        // Per trasferimenti normali, non impostare prestito = 1
        await db.query('UPDATE giocatori SET squadra_id = $1 WHERE id = $2', 
          [offertaData.squadra_mittente_id, offertaData.giocatore_id]);
      }

      // Se è uno scambio, sposta anche il giocatore scambio
      if (offertaData.tipo === 'scambio' && offertaData.giocatore_scambio_id) {
        console.log(`Spostamento giocatore scambio ${offertaData.giocatore_scambio_id} da squadra ${offertaData.squadra_mittente_id} a squadra ${offertaData.squadra_destinatario_id}`);
        await db.query('UPDATE giocatori SET squadra_id = $1 WHERE id = $2', 
          [offertaData.squadra_destinatario_id, offertaData.giocatore_scambio_id]);
      }

      // Aggiorna casse societarie
      if (offertaData.valore_offerta > 0) {
        console.log(`Aggiornamento casse: +${offertaData.valore_offerta} per squadra ${offertaData.squadra_destinatario_id}, -${offertaData.valore_offerta} per squadra ${offertaData.squadra_mittente_id}`);
        await db.query('UPDATE squadre SET casse_societarie = casse_societarie + $1 WHERE id = $2', 
          [offertaData.valore_offerta, offertaData.squadra_destinatario_id]);
        await db.query('UPDATE squadre SET casse_societarie = casse_societarie - $1 WHERE id = $2', 
          [offertaData.valore_offerta, offertaData.squadra_mittente_id]);
      }

      // Log operazioni
      const dettagliTarget = `${offertaData.giocatore_nome} ${offertaData.giocatore_cognome} trasferito da ${offertaData.squadra_destinatario_nome} a ${offertaData.squadra_mittente_nome}`;
      await db.query(
        'INSERT INTO log_operazioni_giocatori (giocatore_id, lega_id, tipo_operazione, squadra_mittente_id, squadra_destinatario_id, valore, dettagli, utente_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [offertaData.giocatore_id, offertaData.lega_id, offertaData.tipo, offertaData.squadra_destinatario_id, offertaData.squadra_mittente_id, offertaData.valore_offerta, dettagliTarget, giocatore_id]
      );

      if (offertaData.tipo === 'scambio' && offertaData.giocatore_scambio_id) {
        const dettagliScambio = `${offertaData.giocatore_scambio_nome} ${offertaData.giocatore_scambio_cognome} trasferito da ${offertaData.squadra_mittente_nome} a ${offertaData.squadra_destinatario_nome}`;
        await db.query(
          'INSERT INTO log_operazioni_giocatori (giocatore_id, lega_id, tipo_operazione, squadra_mittente_id, squadra_destinatario_id, valore, dettagli, utente_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [offertaData.giocatore_scambio_id, offertaData.lega_id, offertaData.tipo, offertaData.squadra_mittente_id, offertaData.squadra_destinatario_id, offertaData.valore_offerta, dettagliScambio, giocatore_id]
        );
      }

      // Ottieni l'ID dell'utente proprietario della squadra mittente
      const proprietarioMittente = await db.query('SELECT proprietario_id FROM squadre WHERE id = $1', [offertaData.squadra_mittente_id]);
      const proprietarioMittenteId = proprietarioMittente.rows[0].proprietario_id;

      // Recupera i dati_aggiuntivi dalle notifiche originali
      const notificaOriginal = await db.query(
        'SELECT dati_aggiuntivi FROM notifiche WHERE dati_aggiuntivi LIKE $1 LIMIT 1',
        [`%"offerta_id":${offerta_id}%`]
      );
      const datiAggiuntivi = notificaOriginal.rows[0] ? notificaOriginal.rows[0].dati_aggiuntivi : null;

      // Notifica al mittente
      const messaggioNotifica = `La tua offerta per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome || ''} è stata accettata!`;
      await db.query(
            'INSERT INTO notifiche (lega_id, utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES ($1, $2, $3, $4, $5, $6)',
            [offertaData.lega_id, proprietarioMittenteId, 'Offerta Accettata', messaggioNotifica, offertaData.tipo, datiAggiuntivi]
      );

      // Notifica anche al destinatario (squadra che ha accettato)
      const messaggioNotificaDestinatario = `Hai accettato l'offerta per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome || ''}`;
      await db.query(
            'INSERT INTO notifiche (lega_id, utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES ($1, $2, $3, $4, $5, $6)',
            [offertaData.lega_id, giocatore_id, 'Offerta Accettata', messaggioNotificaDestinatario, offertaData.tipo, datiAggiuntivi]
          );

      // Aggiorna la notifica originale per indicare che è stata accettata
      // Mantieni i dati_aggiuntivi per preservare le informazioni del popup
      await db.query(
        'UPDATE notifiche SET messaggio = messaggio || " - ACCETTATA" WHERE dati_aggiuntivi LIKE $1 ',
        [`%"offerta_id":${offerta_id}%`]
      );

      await db.query('COMMIT');
      res.json({ success: true });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Errore accettazione offerta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Rifiuta offerta
router.post('/rifiuta/:offerta_id', authenticateToken, async (req, res) => {
  const { offerta_id } = req.params;
  const { id: giocatore_id } = req.user;
  const db = getDb();

  try {
    const offerta = await db.query(
      `SELECT o.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome
         FROM offerte o
         JOIN giocatori g ON o.giocatore_id = g.id
         JOIN squadre sd ON o.squadra_destinatario_id = sd.id
         WHERE o.id = $1 AND sd.proprietario_id = $2`,
      [offerta_id, giocatore_id]
    );

    if (offerta.rows.length === 0) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }

    const offertaData = offerta.rows[0];

    if (offertaData.stato !== 'in_attesa') {
      return res.status(400).json({ error: 'Offerta già processata' });
    }

    // Aggiorna stato offerta
    await db.query('UPDATE offerte SET stato = $1 WHERE id = $2', ['rifiutata', offerta_id]);

    // Ottieni l'ID dell'utente proprietario della squadra mittente
    const proprietarioMittente = await db.query('SELECT proprietario_id FROM squadre WHERE id = $1', [offertaData.squadra_mittente_id]);
    const proprietarioMittenteId = proprietarioMittente.rows[0].proprietario_id;

    // Recupera i dati_aggiuntivi dalle notifiche originali
    const notificaOriginal = await db.query(
      'SELECT dati_aggiuntivi FROM notifiche WHERE dati_aggiuntivi LIKE $1 LIMIT 1',
      [`%"offerta_id":${offerta_id}%`]
    );
    const datiAggiuntivi = notificaOriginal.rows[0] ? notificaOriginal.rows[0].dati_aggiuntivi : null;

    // Notifica al mittente
    const messaggioNotifica = `La tua offerta per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome || ''} è stata rifiutata.`;
    await db.query(
            'INSERT INTO notifiche (lega_id, utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES ($1, $2, $3, $4, $5, $6)',
            [offertaData.lega_id, proprietarioMittenteId, 'Offerta Rifiutata', messaggioNotifica, offertaData.tipo, datiAggiuntivi],
        );

    // Aggiorna la notifica originale per indicare che è stata rifiutata
    await db.query(
      'UPDATE notifiche SET messaggio = messaggio || \' - RIFIUTATA\' WHERE dati_aggiuntivi LIKE $1',
      [`%"offerta_id":${offerta_id}%`]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Errore rifiuto offerta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Accetta o rifiuta un'offerta (endpoint generico - deve essere dopo quelli specifici)
router.post('/:offertaId/risposta', requireAuth, async (req, res) => {
  const { offertaId } = req.params;
  const { risposta } = req.body; // 'accetta' o 'rifiuta'
  const db = getDb();
  
  if (!risposta || !['accetta', 'rifiuta'].includes(risposta)) {
    return res.status(400).json({ error: 'Risposta non valida' });
  }
  
  try {
    // Prima ottieni i dettagli dell'offerta
    const offerta = await db.query(
      `SELECT o.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome, g.quotazione_attuale
         FROM offerte o
         JOIN giocatori g ON o.giocatore_id = g.id
         WHERE o.id = $1`,
      [offertaId]
    );

    if (offerta.rows.length === 0) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }
    const offertaData = offerta.rows[0];
    
    const nuovoStato = risposta === 'accetta' ? 'accettata' : 'rifiutata';
    const dataAccettazione = risposta === 'accetta' ? new Date().toISOString() : null;
    
    // Calcola il salario in base al campo cantera
    let salario = offertaData.valore;
    if (offertaData.cantera) {
      salario = Math.floor(offertaData.valore / 2); // Arrotondamento per difetto
    }
    
    // Aggiorna lo stato dell'offerta
    await db.query(
      `UPDATE offerte 
             SET stato = $1, data_accettazione = $2
             WHERE id = $3`,
      [nuovoStato, dataAccettazione, offertaId]
    );
    
    if (risposta === 'accetta') {
      // Se l'offerta è accettata, trasferisci il giocatore
      await db.query(
        `UPDATE giocatori 
                   SET squadra_id = $1, salario = $2
                   WHERE id = $3`,
        [offertaData.squadra_destinatario_id, salario, offertaData.giocatore_id]
      );

      // Crea notifica per il mittente
      const messaggioNotifica = `La tua offerta per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome} è stata accettata!`;
      await db.query(
        `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
         VALUES ($1, 'offerta_accettata', $2, datetime('now'))`,
        [offertaData.squadra_mittente_id, messaggioNotifica]
      );

      // Crea log per la squadra mittente
      await createLogSquadra({
        squadra_id: offertaData.squadra_mittente_id,
        lega_id: offertaData.lega_id,
        tipo_evento: TIPI_EVENTI.OFFERTA_ACCETTATA,
        categoria: CATEGORIE_EVENTI.OFFERTA,
        titolo: 'Offerta accettata',
        descrizione: `Offerta accettata da ${offertaData.squadra_destinatario_nome} per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome} - Valore: ${offertaData.valore_offerta} FM`,
        dati_aggiuntivi: {
          offerta_id: offertaId,
          giocatore_id: offertaData.giocatore_id,
          squadra_destinatario_id: offertaData.squadra_destinatario_id,
          valore: offertaData.valore_offerta
        },
        utente_id: offertaData.squadra_mittente_proprietario_id,
        giocatore_id: offertaData.giocatore_id
      });

      // Crea log per la squadra destinataria
      await createLogSquadra({
        squadra_id: offertaData.squadra_destinatario_id,
        lega_id: offertaData.lega_id,
        tipo_evento: TIPI_EVENTI.OFFERTA_ACCETTATA,
        categoria: CATEGORIE_EVENTI.OFFERTA,
        titolo: 'Offerta accettata',
        descrizione: `Hai accettato l'offerta da ${offertaData.squadra_mittente_nome} per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome} - Valore: ${offertaData.valore_offerta} FM`,
        dati_aggiuntivi: {
          offerta_id: offertaId,
          giocatore_id: offertaData.giocatore_id,
          squadra_mittente_id: offertaData.squadra_mittente_id,
          valore: offertaData.valore_offerta
        },
        utente_id: req.user.id,
        giocatore_id: offertaData.giocatore_id
      });
      
      res.json({ 
        success: true, 
        message: `Offerta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo`,
        salario: risposta === 'accetta' ? salario : null
      });
    } else {
      // Se l'offerta è rifiutata, crea solo la notifica
      const messaggioNotifica = `La tua offerta per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome} è stata rifiutata.`;
      await db.query(
        `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
         VALUES ($1, 'offerta_rifiutata', $2, datetime('now'))`,
        [offertaData.squadra_mittente_id, messaggioNotifica]
      );

      // Crea log per la squadra mittente
      await createLogSquadra({
        squadra_id: offertaData.squadra_mittente_id,
        lega_id: offertaData.lega_id,
        tipo_evento: TIPI_EVENTI.OFFERTA_RIFIUTATA,
        categoria: CATEGORIE_EVENTI.OFFERTA,
        titolo: 'Offerta rifiutata',
        descrizione: `Offerta rifiutata da ${offertaData.squadra_destinatario_nome} per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome} - Valore: ${offertaData.valore_offerta} FM`,
        dati_aggiuntivi: {
          offerta_id: offertaId,
          giocatore_id: offertaData.giocatore_id,
          squadra_destinatario_id: offertaData.squadra_destinatario_id,
          valore: offertaData.valore_offerta
        },
        utente_id: offertaData.squadra_mittente_proprietario_id,
        giocatore_id: offertaData.giocatore_id
      });

      // Crea log per la squadra destinataria
      await createLogSquadra({
        squadra_id: offertaData.squadra_destinatario_id,
        lega_id: offertaData.lega_id,
        tipo_evento: TIPI_EVENTI.OFFERTA_RIFIUTATA,
        categoria: CATEGORIE_EVENTI.OFFERTA,
        titolo: 'Offerta rifiutata',
        descrizione: `Hai rifiutato l'offerta da ${offertaData.squadra_mittente_nome} per ${offertaData.giocatore_nome} ${offertaData.giocatore_cognome} - Valore: ${offertaData.valore_offerta} FM`,
        dati_aggiuntivi: {
          offerta_id: offertaId,
          giocatore_id: offertaData.giocatore_id,
          squadra_mittente_id: offertaData.squadra_mittente_id,
          valore: offertaData.valore_offerta
        },
        utente_id: req.user.id,
        giocatore_id: offertaData.giocatore_id
      });
      
      res.json({ 
        success: true, 
        message: `Offerta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo`
      });
    }
  } catch (error) {
    console.error('Errore risposta offerta:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Crea una nuova offerta
router.post('/crea', authenticateToken, async (req, res) => {
  const { giocatore_id, tipo, valore_offerta, richiesta_fm, giocatore_scambio_id } = req.body;
  const utente_id = req.user.id;
  const db = getDb();

  try {
    // Ottieni la squadra dell'utente
    const squadraUtente = await db.query(
      'SELECT s.* FROM squadre s JOIN leghe l ON s.lega_id = l.id JOIN giocatori g ON g.lega_id = l.id WHERE g.id = $1 AND s.proprietario_id = $2',
      [giocatore_id, utente_id]
    );

    if (squadraUtente.rows.length === 0) {
      return res.status(400).json({ error: 'Squadra non trovata o giocatore non nella tua lega' });
    }
    const squadraUtenteData = squadraUtente.rows[0];

    // Ottieni informazioni sul giocatore target
    const giocatoreTarget = await db.query(
      'SELECT g.*, s.proprietario_id, s.nome as squadra_nome FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE g.id = $1',
      [giocatore_id]
    );

    if (giocatoreTarget.rows.length === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }
    const giocatoreTargetData = giocatoreTarget.rows[0];

    // Verifica che il giocatore non sia in prestito (non può essere offerto)
    if (giocatoreTargetData.prestito) {
      return res.status(400).json({ error: 'Non puoi fare offerte per un giocatore che è in prestito' });
    }

    // Verifica che il giocatore non sia già nella squadra dell'utente
    if (giocatoreTargetData.squadra_id === squadraUtenteData.id) {
      return res.status(400).json({ error: 'Non puoi fare offerte per un giocatore della tua squadra' });
    }

    // Verifica che i valori delle offerte siano numeri interi
    if (valore_offerta && !Number.isInteger(Number(valore_offerta))) {
      return res.status(400).json({ error: 'Il valore dell\'offerta deve essere un numero intero' });
    }
    
    if (richiesta_fm && !Number.isInteger(Number(richiesta_fm))) {
      return res.status(400).json({ error: 'Il valore richiesto deve essere un numero intero' });
    }

    // Se è uno scambio, verifica che il giocatore scambio sia nella squadra dell'utente
    if (tipo === 'scambio' && giocatore_scambio_id) {
      const giocatoreScambio = await db.query(
        'SELECT * FROM giocatori WHERE id = $1 AND squadra_id = $2',
        [giocatore_scambio_id, squadraUtenteData.id]
      );

      if (giocatoreScambio.rows.length === 0) {
        return res.status(400).json({ error: 'Giocatore scambio non trovato nella tua squadra' });
      }
    }

    // Crea l'offerta
    const offertaId = await db.query(
      `INSERT INTO offerte (lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, giocatore_scambio_id, tipo, valore_offerta, richiesta_fm, stato) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'in_attesa')`,
      [giocatoreTargetData.lega_id, squadraUtenteData.id, giocatoreTargetData.squadra_id, giocatore_id, giocatore_scambio_id || null, tipo, valore_offerta, richiesta_fm]
    );

    // Ottieni le casse societarie attuali delle squadre
    const casseMittente = await db.query('SELECT casse_societarie, proprietario_id, nome FROM squadre WHERE id = $1', [squadraUtenteData.id]);
    const casseMittenteData = casseMittente.rows[0];

    const casseDestinatario = await db.query('SELECT casse_societarie, proprietario_id, nome FROM squadre WHERE id = $1', [giocatoreTargetData.squadra_id]);
    const casseDestinatarioData = casseDestinatario.rows[0];

    // Prendi info proprietario mittente
    const proprietarioMittente = await db.query('SELECT nome, cognome FROM users WHERE id = $1', [casseMittenteData.proprietario_id]);
    const proprietarioMittenteData = proprietarioMittente.rows[0] || { nome: '', cognome: '' };

    // Prendi info proprietario destinatario
    const proprietarioDestinatario = await db.query('SELECT nome, cognome FROM users WHERE id = $1', [casseDestinatarioData.proprietario_id]);
    const proprietarioDestinatarioData = proprietarioDestinatario.rows[0] || { nome: '', cognome: '' };

    // Prendi info giocatore in scambio (se presente)
    let giocatoreScambio = { nome: '', cognome: '' };
    if (giocatore_scambio_id) {
      giocatoreScambio = await db.query('SELECT nome, cognome FROM giocatori WHERE id = $1', [giocatore_scambio_id]);
      giocatoreScambio = giocatoreScambio.rows[0] || { nome: '', cognome: '' };
    }

    // Calcola l'impatto sulle casse societarie
    const valoreOfferta = valore_offerta || 0;
    const richiestaFM = richiesta_fm || 0;
    const casseMittenteDopo = (casseMittenteData.casse_societarie || 0) - valoreOfferta + richiestaFM;
    const casseDestinatarioDopo = (casseDestinatarioData.casse_societarie || 0) + valoreOfferta - richiestaFM;

    // Crea messaggio dettagliato
    const messaggioNotifica = tipo === 'scambio'
      ? `Offerta di scambio ricevuta per ${giocatoreTargetData.nome}${giocatoreTargetData.cognome ? ` ${giocatoreTargetData.cognome}` : ''} da ${casseMittenteData.nome} (${proprietarioMittenteData.nome} ${proprietarioMittenteData.cognome}). In scambio: ${giocatoreScambio.nome}${giocatoreScambio.cognome ? ` ${giocatoreScambio.cognome}` : ''}`
      : `Offerta di ${tipo} ricevuta per ${giocatoreTargetData.nome}${giocatoreTargetData.cognome ? ` ${giocatoreTargetData.cognome}` : ''} da ${casseMittenteData.nome} (${proprietarioMittenteData.nome} ${proprietarioMittenteData.cognome}) - Valore: ${valoreOfferta} FM`;

    // Crea messaggio di conferma per il mittente
    const messaggioConfermaMittente = tipo === 'scambio'
      ? `Hai inviato un'offerta di scambio per ${giocatoreTargetData.nome}${giocatoreTargetData.cognome ? ` ${giocatoreTargetData.cognome}` : ''} a ${casseDestinatarioData.nome}. In scambio: ${giocatoreScambio.nome}${giocatoreScambio.cognome ? ` ${giocatoreScambio.cognome}` : ''}`
      : `Hai inviato un'offerta di ${tipo} per ${giocatoreTargetData.nome}${giocatoreTargetData.cognome ? ` ${giocatoreTargetData.cognome}` : ''} a ${casseDestinatarioData.nome} - Valore: ${valoreOfferta} FM${richiestaFM > 0 ? ` - Richiesta: ${richiestaFM} FM` : ''}`;

    console.log('Creazione notifica offerta:');
    console.log('- Lega ID:', giocatoreTargetData.lega_id);
    console.log('- Utente destinatario ID:', casseDestinatarioData.proprietario_id);
    console.log('- Messaggio:', messaggioNotifica);
    console.log('- Tipo:', tipo);

    // Crea notifica per il destinatario
    await db.query(
      'INSERT INTO notifiche (utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES ($1, $2, $3, $4, $5)',
      [
        casseDestinatarioData.proprietario_id,
        `Offerta ricevuta per ${giocatoreTargetData.nome}${giocatoreTargetData.cognome ? ` ${giocatoreTargetData.cognome}` : ''}`,
        messaggioNotifica,
        'offerta_ricevuta',
        JSON.stringify({
          offerta_id: offertaId.rows[0].id,
          giocatore_id: giocatoreTargetData.id,
          squadra_mittente_id: casseMittenteData.id,
          squadra_destinatario_id: casseDestinatarioData.id,
          tipo_offerta: tipo,
          valore: valoreOfferta,
          richiesta_fm: richiestaFM,
          giocatore_scambio_id: giocatore_scambio_id,
          giocatore_scambio_nome: giocatoreScambio.nome,
          giocatore_scambio_cognome: giocatoreScambio.cognome,
          proprietario_destinatario: `${proprietarioDestinatarioData.nome} ${proprietarioDestinatarioData.cognome}`,
          squadra_destinatario: casseDestinatarioData.nome,
          proprietario_mittente: `${proprietarioMittenteData.nome} ${proprietarioMittenteData.cognome}`,
          squadra_mittente: casseMittenteData.nome,
          giocatore_nome: giocatoreTargetData.nome,
          giocatore_cognome: giocatoreTargetData.cognome,
          casse_mittente_prima: casseMittenteData.casse_societarie,
          casse_mittente_dopo: casseMittenteDopo,
          casse_destinatario_prima: casseDestinatarioData.casse_societarie,
          casse_destinatario_dopo: casseDestinatarioDopo
        })
      ]
    );
    // Crea notifica di conferma per il mittente
    await db.query(
      'INSERT INTO notifiche (utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES ($1, $2, $3, $4, $5)',
      [
        casseMittenteData.proprietario_id,
        `Offerta inviata per ${giocatoreTargetData.nome} ${giocatoreTargetData.cognome}`,
        messaggioConfermaMittente,
        'offerta_inviata',
        JSON.stringify({
          offerta_id: offertaId.rows[0].id,
          giocatore_id: giocatoreTargetData.id,
          squadra_mittente_id: casseMittenteData.id,
          squadra_destinatario_id: casseDestinatarioData.id,
          tipo_offerta: tipo,
          valore: valoreOfferta,
          richiesta_fm: richiestaFM,
          giocatore_scambio_id: giocatore_scambio_id,
          giocatore_scambio_nome: giocatoreScambio.nome,
          giocatore_scambio_cognome: giocatoreScambio.cognome,
          proprietario_destinatario: `${proprietarioDestinatarioData.nome} ${proprietarioDestinatarioData.cognome}`,
          squadra_destinatario: casseDestinatarioData.nome,
          proprietario_mittente: `${proprietarioMittenteData.nome} ${proprietarioMittenteData.cognome}`,
          squadra_mittente: casseMittenteData.nome,
          giocatore_nome: giocatoreTargetData.nome,
          giocatore_cognome: giocatoreTargetData.cognome,
          casse_mittente_prima: casseMittenteData.casse_societarie,
          casse_mittente_dopo: casseMittenteDopo,
          casse_destinatario_prima: casseDestinatarioData.casse_societarie,
          casse_destinatario_dopo: casseDestinatarioDopo
        })
      ]
    );

    // Crea log per la squadra mittente
    await createLogSquadra({
      squadra_id: casseMittenteData.id,
      lega_id: giocatoreTargetData.lega_id,
      tipo_evento: TIPI_EVENTI.OFFERTA_INVIATA,
      categoria: CATEGORIE_EVENTI.OFFERTA,
      titolo: `Offerta inviata per ${giocatoreTargetData.nome} ${giocatoreTargetData.cognome}`,
      descrizione: `Offerta di ${tipo} inviata a ${casseDestinatarioData.nome} per ${giocatoreTargetData.nome} ${giocatoreTargetData.cognome} - Valore: ${valoreOfferta} FM`,
      dati_aggiuntivi: {
        offerta_id: offertaId.rows[0].id,
        giocatore_id: giocatoreTargetData.id,
        squadra_destinatario_id: casseDestinatarioData.id,
        tipo_offerta: tipo,
        valore: valoreOfferta
      },
      utente_id: req.user.id,
      giocatore_id: giocatoreTargetData.id
    });

    // Crea log per la squadra destinataria
    await createLogSquadra({
      squadra_id: casseDestinatarioData.id,
      lega_id: giocatoreTargetData.lega_id,
      tipo_evento: TIPI_EVENTI.OFFERTA_RICEVUTA,
      categoria: CATEGORIE_EVENTI.OFFERTA,
      titolo: `Offerta ricevuta per ${giocatoreTargetData.nome} ${giocatoreTargetData.cognome}`,
      descrizione: `Offerta di ${tipo} ricevuta da ${casseMittenteData.nome} per ${giocatoreTargetData.nome} ${giocatoreTargetData.cognome} - Valore: ${valoreOfferta} FM`,
      dati_aggiuntivi: {
        offerta_id: offertaId.rows[0].id,
        giocatore_id: giocatoreTargetData.id,
        squadra_mittente_id: casseMittenteData.id,
        tipo_offerta: tipo,
        valore: valoreOfferta
      },
      utente_id: casseDestinatarioData.proprietario_id,
      giocatore_id: giocatoreTargetData.id
    });

    // Notifica già creata sopra, non serve duplicarla

    res.json({ success: true, offerta_id: offertaId.rows[0].id });
  } catch (error) {
    console.error('Errore creazione offerta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni offerte ricevute dall'utente
router.get('/ricevute', authenticateToken, async (req, res) => {
  const { giocatore_id } = req.user;
  const db = getDb();

  try {
    const offerte = await db.query(
      `SELECT o.*, 
                g.nome as giocatore_nome, g.cognome as giocatore_cognome, g.ruolo as giocatore_ruolo,
                gs.nome as giocatore_scambio_nome, gs.cognome as giocatore_scambio_cognome, gs.ruolo as giocatore_scambio_ruolo,
                sm.nome as squadra_mittente_nome,
                sd.nome as squadra_destinatario_nome
         FROM offerte o
         JOIN giocatori g ON o.giocatore_id = g.id
         LEFT JOIN giocatori gs ON o.giocatore_scambio_id = gs.id
         JOIN squadre sm ON o.squadra_mittente_id = sm.id
         JOIN squadre sd ON o.squadra_destinatario_id = sd.id
         WHERE sd.proprietario_id = $1 AND o.stato = 'in_attesa'
         ORDER BY o.created_at DESC`,
      [giocatore_id]
    );

    res.json(offerte.rows);
  } catch (error) {
    console.error('Errore recupero offerte:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni log operazioni per un giocatore
router.get('/log-giocatore/:giocatore_id', authenticateToken, async (req, res) => {
  const { giocatore_id } = req.params;
  const db = getDb();

  try {
    const log = await db.query(
      `SELECT l.*, 
                sm.nome as squadra_mittente_nome,
                sd.nome as squadra_destinatario_nome,
                u.nome as utente_nome, u.cognome as utente_cognome
         FROM log_operazioni_giocatori l
         LEFT JOIN squadre sm ON l.squadra_mittente_id = sm.id
         LEFT JOIN squadre sd ON l.squadra_destinatario_id = sd.id
         LEFT JOIN utenti u ON l.utente_id = u.id
         WHERE l.giocatore_id = $1
         ORDER BY l.data_operazione DESC`,
      [giocatore_id]
    );

    res.json(log.rows);
  } catch (error) {
    console.error('Errore recupero log:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per spostare giocatori tra roster A/B (solo admin/superadmin/subadmin)
router.post('/roster/move-player', authenticateToken, async (req, res) => {
  const { giocatoreId, targetRoster, squadraId, legaId } = req.body;
  const { id: userId, ruolo } = req.user;
  const db = getDb();

  try {
    // Verifica che l'utente sia admin, superadmin o subadmin
    const ruoliAutorizzati = ['admin', 'superadmin', 'subadmin', 'Admin', 'SuperAdmin', 'SubAdmin'];
    if (!ruoliAutorizzati.includes(ruolo)) {
      return res.status(403).json({ error: 'Accesso negato. Solo admin, superadmin e subadmin possono gestire i roster.' });
    }

    // Verifica che il giocatore esista e appartenga alla squadra specificata
    const giocatore = await db.query(
      `SELECT g.*, s.proprietario_id, s.lega_id, s.id as squadra_id
         FROM giocatori g 
         JOIN squadre s ON g.squadra_id = s.id 
         WHERE g.id = $1 AND g.squadra_id = $2`,
      [giocatoreId, squadraId]
    );

    if (giocatore.rows.length === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato nella squadra specificata' });
    }

    // Verifica che la lega sia corretta
    console.log('Comparing lega_id:', giocatore.rows[0].lega_id, 'with legaId:', legaId);
    if (parseInt(giocatore.rows[0].lega_id) !== parseInt(legaId)) {
      return res.status(400).json({ error: 'Lega non corrispondente' });
    }

    // Verifica che il target roster sia valido
    if (!['A', 'B'].includes(targetRoster)) {
      return res.status(400).json({ error: 'Roster non valido. Deve essere A o B.' });
    }

    // Se si sta spostando in Roster A, verifica che ci sia spazio
    if (targetRoster === 'A') {
      const rosterManager = createRosterManager(legaId);
      const isRosterABEnabled = await rosterManager.isRosterABEnabled();
      
      if (isRosterABEnabled) {
        // Ottieni il numero massimo di giocatori dalla lega
        const lega = await getLegaById(legaId);
        const maxGiocatori = lega.max_giocatori || 30;
        const giocatori = await rosterManager.getGiocatoriByRoster(squadraId);
        
        if (giocatori.rosterA && giocatori.rosterA.length >= maxGiocatori) {
          return res.status(400).json({ 
            error: `Impossibile spostare in Roster A. La squadra ha già raggiunto il limite massimo di ${maxGiocatori} giocatori.` 
          });
        }
      }
    }

    // Sposta il giocatore nel roster specificato
    await db.query(
      'UPDATE giocatori SET roster = $1 WHERE id = $2',
      [targetRoster, giocatoreId]
    );

    console.log(`Giocatore ${giocatoreId} spostato in Roster ${targetRoster} da ${ruolo} ${userId}`);

    res.json({ 
      success: true, 
      message: `Giocatore spostato con successo in Roster ${targetRoster}`,
      giocatoreId,
      targetRoster
    });

  } catch (error) {
    console.error('Errore spostamento giocatore:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router; 