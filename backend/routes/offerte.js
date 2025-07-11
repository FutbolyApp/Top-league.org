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
const db = getDb();

// Crea una nuova offerta (trasferimento/prestito)
router.post('/create', requireAuth, (req, res) => {
  const { lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, tipo, valore, cantera } = req.body;
  if (!lega_id || !squadra_mittente_id || !squadra_destinatario_id || !giocatore_id || !tipo || !valore) {
    return res.status(400).json({ error: 'Parametri mancanti' });
  }
  
  // Calcola il salario in base al campo cantera
  let salario = valore;
  if (cantera) {
    salario = Math.floor(valore / 2); // Arrotondamento per difetto
  }
  
  createOfferta({
    lega_id,
    squadra_mittente_id,
    squadra_destinatario_id,
    giocatore_id,
    tipo,
    valore,
    cantera: cantera || false,
    stato: 'inviata'
  }, (err, offertaId) => {
    if (err) return res.status(500).json({ error: 'Errore creazione offerta', details: err.message });
    res.json({ success: true, offertaId, salario });
  });
});

// Ottieni tutte le offerte di una lega
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  getOfferteByLega(legaId, (err, offerte) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ offerte });
  });
});

// Ottieni movimenti di mercato per una lega (offerte completate)
router.get('/movimenti/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  
  // Query per ottenere le offerte completate (accettate) con dettagli delle squadre e giocatori
  const query = `
    SELECT 
      o.id,
      o.tipo,
      o.valore,
      o.cantera,
      o.data_invio as data,
      g.nome as giocatore_nome,
      g.cognome as giocatore_cognome,
      sm.nome as squadra_mittente,
      sd.nome as squadra_destinataria,
      o.lega_id
    FROM offerte o
    JOIN giocatori g ON o.giocatore_id = g.id
    JOIN squadre sm ON o.squadra_mittente_id = sm.id
    JOIN squadre sd ON o.squadra_destinatario_id = sd.id
    WHERE o.lega_id = ? AND o.stato = 'accettata'
    ORDER BY o.data_invio DESC
    LIMIT 20
  `;
  
  db.all(query, [legaId], (err, rows) => {
    if (err) {
      console.error('Errore query movimenti:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    // Se non ci sono offerte, restituisci array vuoto
    if (!rows || rows.length === 0) {
      return res.json({ movimenti: [] });
    }
    
    // Formatta i dati per il frontend
    const movimenti = rows.map(row => ({
      id: row.id,
      tipo: row.tipo,
      valore: row.valore,
      cantera: row.cantera,
      data: row.data,
      giocatore_nome: `${row.giocatore_nome} ${row.giocatore_cognome}`,
      squadra_mittente: row.squadra_mittente,
      squadra_destinataria: row.squadra_destinataria,
      lega_id: row.lega_id
    }));
    
    res.json({ movimenti });
  });
});

// Ottieni statistiche roster per una squadra
router.get('/roster/stats/:squadraId', authenticateToken, async (req, res) => {
  const { squadraId } = req.params;
  const { id: userId, ruolo } = req.user;

  try {
    // Verifica che l'utente sia proprietario della squadra O sia admin
    let squadra;
    
    if (ruolo === 'admin' || ruolo === 'superadmin' || ruolo === 'subadmin' || 
        ruolo === 'Admin' || ruolo === 'SuperAdmin' || ruolo === 'SubAdmin') {
      // Admin può vedere tutte le squadre
      squadra = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM squadre WHERE id = ?',
          [squadraId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    } else {
      // Utente normale deve essere proprietario
      squadra = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM squadre WHERE id = ? AND proprietario_id = ?',
          [squadraId, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
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
  const { squadraId } = req.params;
  const { id: userId, ruolo } = req.user;

  try {
    // Verifica che l'utente sia proprietario della squadra O sia admin
    let squadra;
    
    if (ruolo === 'admin' || ruolo === 'superadmin' || ruolo === 'subadmin' || 
        ruolo === 'Admin' || ruolo === 'SuperAdmin' || ruolo === 'SubAdmin') {
      // Admin può vedere tutte le squadre
      squadra = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM squadre WHERE id = ?',
          [squadraId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    } else {
      // Utente normale deve essere proprietario
      squadra = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM squadre WHERE id = ? AND proprietario_id = ?',
          [squadraId, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
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
  const { giocatoreId } = req.body;
  const { id: userId } = req.user;

  try {
    // Verifica che il giocatore appartenga a una squadra dell'utente
    const giocatore = await new Promise((resolve, reject) => {
      db.get(
        `SELECT g.*, s.proprietario_id, s.lega_id, s.id as squadra_id
         FROM giocatori g 
         JOIN squadre s ON g.squadra_id = s.id 
         WHERE g.id = ? AND s.proprietario_id = ?`,
        [giocatoreId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!giocatore) {
      return res.status(404).json({ error: 'Giocatore non trovato o non autorizzato' });
    }

    const rosterManager = createRosterManager(giocatore.lega_id);
    const result = await rosterManager.handleLoanReturn(giocatore.squadra_id, giocatoreId);

    res.json(result);
  } catch (error) {
    console.error('Errore gestione ritorno prestito:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Termina prestito e riporta giocatore alla squadra originale
router.post('/termina-prestito/:giocatoreId', authenticateToken, async (req, res) => {
  const { giocatoreId } = req.params;
  const { id: userId } = req.user;

  try {
    // Verifica che il giocatore sia in prestito e appartenga a una squadra dell'utente
    const giocatore = await new Promise((resolve, reject) => {
      db.get(
        `SELECT g.*, s.proprietario_id, s.lega_id, s.id as squadra_id, s.nome as squadra_nome
         FROM giocatori g 
         JOIN squadre s ON g.squadra_id = s.id 
         WHERE g.id = ? AND s.proprietario_id = ? AND g.prestito = 1`,
        [giocatoreId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!giocatore) {
      return res.status(404).json({ error: 'Giocatore in prestito non trovato o non autorizzato' });
    }

    // Trova la squadra originale del giocatore (la squadra che lo ha dato in prestito)
    // Per ora, assumiamo che la squadra originale sia quella che ha il giocatore
    // In un sistema più complesso, dovremmo tracciare la squadra originale
    
    // Imposta prestito = 0 e sposta in Roster A se possibile
    const rosterManager = createRosterManager(giocatore.lega_id);
    
    // Prima imposta prestito = 0
    await new Promise((resolve, reject) => {
      db.run('UPDATE giocatori SET prestito = 0 WHERE id = ?', [giocatoreId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    // Poi gestisci il roster
    const result = await rosterManager.handleLoanReturn(giocatore.squadra_id, giocatoreId);

    res.json({
      success: true,
      message: `Prestito terminato per ${giocatore.nome} ${giocatore.cognome}. ${result.message}`,
      ...result
    });
  } catch (error) {
    console.error('Errore terminazione prestito:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni log contratti
router.get('/log/:squadraId', requireAuth, (req, res) => {
  const { squadraId } = req.params;
  
  try {
    const sql = `
      SELECT lc.*, g.nome as giocatore_nome
      FROM log_contratti lc
      JOIN giocatori g ON lc.giocatore_id = g.id
      WHERE lc.squadra_id = ?
      ORDER BY lc.data_pagamento DESC
      LIMIT 50
    `;
    
    db.all(sql, [squadraId], (err, log) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero log' });
      }
      
      res.json({ log });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Endpoint specifici per accettare/rifiutare offerte (devono essere prima dell'endpoint generico)
// Accetta offerta
router.post('/accetta/:offerta_id', authenticateToken, async (req, res) => {
  const { offerta_id } = req.params;
  const { id: giocatore_id } = req.user;

  try {
    // Ottieni l'offerta
    const offerta = await new Promise((resolve, reject) => {
      db.get(
        `SELECT o.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome,
                gs.nome as giocatore_scambio_nome, gs.cognome as giocatore_scambio_cognome,
                sm.nome as squadra_mittente_nome, sd.nome as squadra_destinatario_nome
         FROM offerte o
         JOIN giocatori g ON o.giocatore_id = g.id
         LEFT JOIN giocatori gs ON o.giocatore_scambio_id = gs.id
         JOIN squadre sm ON o.squadra_mittente_id = sm.id
         JOIN squadre sd ON o.squadra_destinatario_id = sd.id
         WHERE o.id = ? AND sd.proprietario_id = ?`,
        [offerta_id, giocatore_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!offerta) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }

    if (offerta.stato !== 'in_attesa') {
      return res.status(400).json({ error: 'Offerta già processata' });
    }

    // Gestisci il sistema Roster A/B se attivato
    const rosterManager = createRosterManager(offerta.lega_id);
    const isRosterABEnabled = await rosterManager.isRosterABEnabled();

    // Verifica spazio nel roster prima di accettare
    if (isRosterABEnabled) {
      // Conta giocatori attuali nella squadra destinataria
      const giocatoriAttuali = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM giocatori WHERE squadra_id = ?', [offerta.squadra_mittente_id], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      // Ottieni limite massimo dalla lega
      const lega = await new Promise((resolve, reject) => {
        getLegaById(offerta.lega_id, (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });

      const maxGiocatori = lega.max_giocatori || 30;
      
      if (giocatoriAttuali >= maxGiocatori) {
        return res.status(400).json({ 
          error: `Impossibile accettare l'offerta. La squadra ha già raggiunto il limite massimo di ${maxGiocatori} giocatori.` 
        });
      }
    }

    // Validazione limiti di ruolo per leghe Classic
    const isClassic = await isClassicLeague(offerta.lega_id);
    if (isClassic) {
      // Ottieni i dati del giocatore che viene trasferito
      const giocatoreIn = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM giocatori WHERE id = ?', [offerta.giocatore_id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      // Ottieni i dati del giocatore scambio se presente
      let giocatoreOut = null;
      if (offerta.tipo === 'scambio' && offerta.giocatore_scambio_id) {
        giocatoreOut = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM giocatori WHERE id = ?', [offerta.giocatore_scambio_id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      }

      // Valida i limiti di ruolo per la squadra destinataria
      const validazioneDestinataria = await validateRoleLimits(
        offerta.lega_id, 
        offerta.squadra_mittente_id, 
        giocatoreIn, 
        giocatoreOut
      );

      if (!validazioneDestinataria.valid) {
        return res.status(400).json({ 
          error: `Impossibile accettare l'offerta. Violazione limiti di ruolo: ${validazioneDestinataria.errors.join(', ')}` 
        });
      }

      // Se è uno scambio, valida anche per la squadra mittente
      if (offerta.tipo === 'scambio' && giocatoreOut) {
        const validazioneMittente = await validateRoleLimits(
          offerta.lega_id, 
          offerta.squadra_destinatario_id, 
          giocatoreOut, 
          giocatoreIn
        );

        if (!validazioneMittente.valid) {
          return res.status(400).json({ 
            error: `Impossibile accettare l'offerta. Violazione limiti di ruolo per la squadra mittente: ${validazioneMittente.errors.join(', ')}` 
          });
        }
      }
    }

    // Inizia transazione
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      try {
        // Aggiorna stato offerta
        db.run('UPDATE offerte SET stato = ?, data_accettazione = ? WHERE id = ?', 
          ['accettata', new Date().toISOString(), offerta_id]);

        // Sposta il giocatore target
        console.log(`Spostamento giocatore ${offerta.giocatore_id} da squadra ${offerta.squadra_destinatario_id} a squadra ${offerta.squadra_mittente_id}`);
        
        // Se è un prestito, imposta il campo prestito = 1 e gestisci i roster
        if (offerta.tipo === 'prestito') {
          console.log(`Impostazione prestito = 1 per giocatore ${offerta.giocatore_id}`);
          db.run('UPDATE giocatori SET squadra_id = ?, prestito = 1, squadra_prestito_id = ? WHERE id = ?', 
            [offerta.squadra_mittente_id, offerta.squadra_destinatario_id, offerta.giocatore_id]);
          
          // Se il sistema Roster A/B è attivato:
          if (isRosterABEnabled) {
            // Il giocatore va in Roster A della squadra che lo riceve (può giocare)
            console.log(`Spostamento giocatore ${offerta.giocatore_id} in Roster A della squadra ricevente (prestito)`);
            db.run('UPDATE giocatori SET roster = ? WHERE id = ?', ['A', offerta.giocatore_id]);
          }
        } else {
          // Per trasferimenti normali, non impostare prestito = 1
        db.run('UPDATE giocatori SET squadra_id = ? WHERE id = ?', 
          [offerta.squadra_mittente_id, offerta.giocatore_id]);
        }

        // Se è uno scambio, sposta anche il giocatore scambio
        if (offerta.tipo === 'scambio' && offerta.giocatore_scambio_id) {
          console.log(`Spostamento giocatore scambio ${offerta.giocatore_scambio_id} da squadra ${offerta.squadra_mittente_id} a squadra ${offerta.squadra_destinatario_id}`);
          db.run('UPDATE giocatori SET squadra_id = ? WHERE id = ?', 
            [offerta.squadra_destinatario_id, offerta.giocatore_scambio_id]);
        }

        // Aggiorna casse societarie
        if (offerta.valore_offerta > 0) {
          console.log(`Aggiornamento casse: +${offerta.valore_offerta} per squadra ${offerta.squadra_destinatario_id}, -${offerta.valore_offerta} per squadra ${offerta.squadra_mittente_id}`);
          db.run('UPDATE squadre SET casse_societarie = casse_societarie + ? WHERE id = ?', 
            [offerta.valore_offerta, offerta.squadra_destinatario_id]);
          db.run('UPDATE squadre SET casse_societarie = casse_societarie - ? WHERE id = ?', 
            [offerta.valore_offerta, offerta.squadra_mittente_id]);
        }

        // Log operazioni
        const dettagliTarget = `${offerta.giocatore_nome} ${offerta.giocatore_cognome} trasferito da ${offerta.squadra_destinatario_nome} a ${offerta.squadra_mittente_nome}`;
        db.run(
          'INSERT INTO log_operazioni_giocatori (giocatore_id, lega_id, tipo_operazione, squadra_mittente_id, squadra_destinatario_id, valore, dettagli, utente_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [offerta.giocatore_id, offerta.lega_id, offerta.tipo, offerta.squadra_destinatario_id, offerta.squadra_mittente_id, offerta.valore_offerta, dettagliTarget, giocatore_id]
        );

        if (offerta.tipo === 'scambio' && offerta.giocatore_scambio_id) {
          const dettagliScambio = `${offerta.giocatore_scambio_nome} ${offerta.giocatore_scambio_cognome} trasferito da ${offerta.squadra_mittente_nome} a ${offerta.squadra_destinatario_nome}`;
          db.run(
            'INSERT INTO log_operazioni_giocatori (giocatore_id, lega_id, tipo_operazione, squadra_mittente_id, squadra_destinatario_id, valore, dettagli, utente_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [offerta.giocatore_scambio_id, offerta.lega_id, offerta.tipo, offerta.squadra_mittente_id, offerta.squadra_destinatario_id, offerta.valore_offerta, dettagliScambio, giocatore_id]
          );
        }

        // Ottieni l'ID dell'utente proprietario della squadra mittente
        db.get('SELECT proprietario_id FROM squadre WHERE id = ?', [offerta.squadra_mittente_id], (err, row) => {
          if (err || !row) {
            console.error('Errore nel recupero proprietario squadra mittente:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Errore interno del server' });
          }
          const proprietarioMittenteId = row.proprietario_id;

          // Recupera i dati_aggiuntivi dalle notifiche originali
          db.get(
            'SELECT dati_aggiuntivi FROM notifiche WHERE dati_aggiuntivi LIKE ? LIMIT 1',
            [`%"offerta_id":${offerta_id}%`],
            (err, row) => {
              if (err) {
                console.error('Errore recupero dati aggiuntivi:', err);
              }
              
              const datiAggiuntivi = row ? row.dati_aggiuntivi : null;

          // Notifica al mittente
          const messaggioNotifica = `La tua offerta per ${offerta.giocatore_nome} ${offerta.giocatore_cognome || ''} è stata accettata!`;
          db.run(
                'INSERT INTO notifiche (lega_id, utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES (?, ?, ?, ?, ?, ?)',
                [offerta.lega_id, proprietarioMittenteId, 'Offerta Accettata', messaggioNotifica, offerta.tipo, datiAggiuntivi]
          );

          // Notifica anche al destinatario (squadra che ha accettato)
          const messaggioNotificaDestinatario = `Hai accettato l'offerta per ${offerta.giocatore_nome} ${offerta.giocatore_cognome || ''}`;
          db.run(
                'INSERT INTO notifiche (lega_id, utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES (?, ?, ?, ?, ?, ?)',
                [offerta.lega_id, giocatore_id, 'Offerta Accettata', messaggioNotificaDestinatario, offerta.tipo, datiAggiuntivi]
              );
            }
          );

          // Aggiorna la notifica originale per indicare che è stata accettata
          // Mantieni i dati_aggiuntivi per preservare le informazioni del popup
          db.run(
            'UPDATE notifiche SET messaggio = messaggio || " - ACCETTATA" WHERE dati_aggiuntivi LIKE ? ',
            [`%"offerta_id":${offerta_id}%`],
            function(err) {
              if (err) {
                console.error('Errore aggiornamento notifica accettata:', err);
              } else {
                console.log('Notifica originale aggiornata (accettata), righe modificate:', this.changes);
                
                // NON rimuovere le notifiche originali per mantenere i dati_aggiuntivi
                // Le notifiche con " - ACCETTATA" manterranno i dati per il popup
              }
            }
          );

          db.run('COMMIT');
          res.json({ success: true });
        });
      } catch (error) {
        db.run('ROLLBACK');
        throw error;
      }
    });
  } catch (error) {
    console.error('Errore accettazione offerta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Rifiuta offerta
router.post('/rifiuta/:offerta_id', authenticateToken, async (req, res) => {
  const { offerta_id } = req.params;
  const { id: giocatore_id } = req.user;

  try {
    const offerta = await new Promise((resolve, reject) => {
      db.get(
        `SELECT o.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome
         FROM offerte o
         JOIN giocatori g ON o.giocatore_id = g.id
         JOIN squadre sd ON o.squadra_destinatario_id = sd.id
         WHERE o.id = ? AND sd.proprietario_id = ?`,
        [offerta_id, giocatore_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!offerta) {
      return res.status(404).json({ error: 'Offerta non trovata' });
    }

    if (offerta.stato !== 'in_attesa') {
      return res.status(400).json({ error: 'Offerta già processata' });
    }

    // Aggiorna stato offerta
    await new Promise((resolve, reject) => {
      db.run('UPDATE offerte SET stato = ? WHERE id = ?', ['rifiutata', offerta_id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Ottieni l'ID dell'utente proprietario della squadra mittente
    db.get('SELECT proprietario_id FROM squadre WHERE id = ?', [offerta.squadra_mittente_id], (err, row) => {
      if (err || !row) {
        console.error('Errore nel recupero proprietario squadra mittente:', err);
        return res.status(500).json({ error: 'Errore interno del server' });
      }
      const proprietarioMittenteId = row.proprietario_id;

      // Recupera i dati_aggiuntivi dalle notifiche originali
      db.get(
        'SELECT dati_aggiuntivi FROM notifiche WHERE dati_aggiuntivi LIKE ? LIMIT 1',
        [`%"offerta_id":${offerta_id}%`],
        (err, row) => {
          if (err) {
            console.error('Errore recupero dati aggiuntivi:', err);
          }
          
          const datiAggiuntivi = row ? row.dati_aggiuntivi : null;

      // Notifica al mittente
      const messaggioNotifica = `La tua offerta per ${offerta.giocatore_nome} ${offerta.giocatore_cognome || ''} è stata rifiutata.`;
      db.run(
            'INSERT INTO notifiche (lega_id, utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES (?, ?, ?, ?, ?, ?)',
            [offerta.lega_id, proprietarioMittenteId, 'Offerta Rifiutata', messaggioNotifica, offerta.tipo, datiAggiuntivi],
        (err) => {
          if (err) {
            console.error('Errore creazione notifica:', err);
            return res.status(500).json({ error: 'Errore interno del server' });
          }
          res.json({ 
            success: true, 
            message: `Offerta rifiutata con successo`
          });
            }
          );
        }
      );
    });

    // Aggiorna la notifica originale per indicare che è stata rifiutata
    await new Promise((resolve, reject) => {
      console.log('Aggiornamento notifica originale per offerta:', offerta_id);
      db.run(
        'UPDATE notifiche SET messaggio = messaggio || \' - RIFIUTATA\' WHERE dati_aggiuntivi LIKE \'%"offerta_id":\' || ? || \'%\'',
        [offerta_id],
        function(err) {
          if (err) {
            console.error('Errore aggiornamento notifica:', err);
            reject(err);
          } else {
            console.log('Notifica originale aggiornata, righe modificate:', this.changes);
            
            // NON rimuovere le notifiche originali per mantenere i dati_aggiuntivi
            // Le notifiche con " - RIFIUTATA" manterranno i dati per il popup
            resolve();
          }
        }
      );
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Errore rifiuto offerta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Accetta o rifiuta un'offerta (endpoint generico - deve essere dopo quelli specifici)
router.post('/:offertaId/risposta', requireAuth, (req, res) => {
  const { offertaId } = req.params;
  const { risposta } = req.body; // 'accetta' o 'rifiuta'
  
  if (!risposta || !['accetta', 'rifiuta'].includes(risposta)) {
    return res.status(400).json({ error: 'Risposta non valida' });
  }
  
  try {
    db.serialize(() => {
      // Prima ottieni i dettagli dell'offerta
      db.get(
        `SELECT o.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome, g.quotazione_attuale
         FROM offerte o
         JOIN giocatori g ON o.giocatore_id = g.id
         WHERE o.id = ?`,
        [offertaId],
        (err, offerta) => {
          if (err) {
            return res.status(500).json({ error: 'Errore nel recupero offerta' });
          }
          if (!offerta) {
            return res.status(404).json({ error: 'Offerta non trovata' });
          }
          
          const nuovoStato = risposta === 'accetta' ? 'accettata' : 'rifiutata';
          const dataAccettazione = risposta === 'accetta' ? new Date().toISOString() : null;
          
          // Calcola il salario in base al campo cantera
          let salario = offerta.valore;
          if (offerta.cantera) {
            salario = Math.floor(offerta.valore / 2); // Arrotondamento per difetto
          }
          
          // Aggiorna lo stato dell'offerta
          db.run(
            `UPDATE offerte 
             SET stato = ?, data_accettazione = ?
             WHERE id = ?`,
            [nuovoStato, dataAccettazione, offertaId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Errore nell\'aggiornamento offerta' });
              }
              
              if (risposta === 'accetta') {
                // Se l'offerta è accettata, trasferisci il giocatore
                db.run(
                  `UPDATE giocatori 
                   SET squadra_id = ?, salario = ?, cantera = ?
                   WHERE id = ?`,
                  [offerta.squadra_destinatario_id, salario, offerta.cantera ? 1 : 0, offerta.giocatore_id],
                  function(err) {
                    if (err) {
                      return res.status(500).json({ error: 'Errore nel trasferimento giocatore' });
                    }
                    
                    // Crea notifica per il mittente
                    const messaggioNotifica = `La tua offerta per ${offerta.giocatore_nome} ${offerta.giocatore_cognome} è stata accettata!`;
                    db.run(
                      `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
                       VALUES (?, 'offerta_accettata', ?, datetime('now'))`,
                      [offerta.squadra_mittente_id, messaggioNotifica],
                      function(err) {
                        if (err) {
                          console.log('Errore creazione notifica:', err);
                        }
                        
                        // Crea log per la squadra mittente
                        createLogSquadra({
                          squadra_id: offerta.squadra_mittente_id,
                          lega_id: offerta.lega_id,
                          tipo_evento: TIPI_EVENTI.OFFERTA_ACCETTATA,
                          categoria: CATEGORIE_EVENTI.OFFERTA,
                          titolo: 'Offerta accettata',
                          descrizione: `Offerta accettata da ${offerta.squadra_destinatario_nome} per ${offerta.giocatore_nome} ${offerta.giocatore_cognome} - Valore: ${offerta.valore_offerta} FM`,
                          dati_aggiuntivi: {
                            offerta_id: offertaId,
                            giocatore_id: offerta.giocatore_id,
                            squadra_destinatario_id: offerta.squadra_destinatario_id,
                            valore: offerta.valore_offerta
                          },
                          utente_id: offerta.squadra_mittente_proprietario_id,
                          giocatore_id: offerta.giocatore_id
                        }, (err, logId) => {
                          if (err) {
                            console.error('Errore creazione log offerta accettata:', err);
                          } else {
                            console.log('Log offerta accettata creato con ID:', logId);
                          }
                        });

                        // Crea log per la squadra destinataria
                        createLogSquadra({
                          squadra_id: offerta.squadra_destinatario_id,
                          lega_id: offerta.lega_id,
                          tipo_evento: TIPI_EVENTI.OFFERTA_ACCETTATA,
                          categoria: CATEGORIE_EVENTI.OFFERTA,
                          titolo: 'Offerta accettata',
                          descrizione: `Hai accettato l'offerta da ${offerta.squadra_mittente_nome} per ${offerta.giocatore_nome} ${offerta.giocatore_cognome} - Valore: ${offerta.valore_offerta} FM`,
                          dati_aggiuntivi: {
                            offerta_id: offertaId,
                            giocatore_id: offerta.giocatore_id,
                            squadra_mittente_id: offerta.squadra_mittente_id,
                            valore: offerta.valore_offerta
                          },
                          utente_id: req.user.id,
                          giocatore_id: offerta.giocatore_id
                        }, (err, logId) => {
                          if (err) {
                            console.error('Errore creazione log offerta accettata destinatario:', err);
                          } else {
                            console.log('Log offerta accettata destinatario creato con ID:', logId);
                          }
                        });
                        
                        res.json({ 
                          success: true, 
                          message: `Offerta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo`,
                          salario: risposta === 'accetta' ? salario : null
                        });
                      }
                    );
                  }
                );
              } else {
                // Se l'offerta è rifiutata, crea solo la notifica
                const messaggioNotifica = `La tua offerta per ${offerta.giocatore_nome} ${offerta.giocatore_cognome} è stata rifiutata.`;
                db.run(
                  `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
                   VALUES (?, 'offerta_rifiutata', ?, datetime('now'))`,
                  [offerta.squadra_mittente_id, messaggioNotifica],
                  function(err) {
                    if (err) {
                      console.log('Errore creazione notifica:', err);
                    }
                    
                    // Crea log per la squadra mittente
                    createLogSquadra({
                      squadra_id: offerta.squadra_mittente_id,
                      lega_id: offerta.lega_id,
                      tipo_evento: TIPI_EVENTI.OFFERTA_RIFIUTATA,
                      categoria: CATEGORIE_EVENTI.OFFERTA,
                      titolo: 'Offerta rifiutata',
                      descrizione: `Offerta rifiutata da ${offerta.squadra_destinatario_nome} per ${offerta.giocatore_nome} ${offerta.giocatore_cognome} - Valore: ${offerta.valore_offerta} FM`,
                      dati_aggiuntivi: {
                        offerta_id: offertaId,
                        giocatore_id: offerta.giocatore_id,
                        squadra_destinatario_id: offerta.squadra_destinatario_id,
                        valore: offerta.valore_offerta
                      },
                      utente_id: offerta.squadra_mittente_proprietario_id,
                      giocatore_id: offerta.giocatore_id
                    }, (err, logId) => {
                      if (err) {
                        console.error('Errore creazione log offerta rifiutata:', err);
                      } else {
                        console.log('Log offerta rifiutata creato con ID:', logId);
                      }
                    });

                    // Crea log per la squadra destinataria
                    createLogSquadra({
                      squadra_id: offerta.squadra_destinatario_id,
                      lega_id: offerta.lega_id,
                      tipo_evento: TIPI_EVENTI.OFFERTA_RIFIUTATA,
                      categoria: CATEGORIE_EVENTI.OFFERTA,
                      titolo: 'Offerta rifiutata',
                      descrizione: `Hai rifiutato l'offerta da ${offerta.squadra_mittente_nome} per ${offerta.giocatore_nome} ${offerta.giocatore_cognome} - Valore: ${offerta.valore_offerta} FM`,
                      dati_aggiuntivi: {
                        offerta_id: offertaId,
                        giocatore_id: offerta.giocatore_id,
                        squadra_mittente_id: offerta.squadra_mittente_id,
                        valore: offerta.valore_offerta
                      },
                      utente_id: req.user.id,
                      giocatore_id: offerta.giocatore_id
                    }, (err, logId) => {
                      if (err) {
                        console.error('Errore creazione log offerta rifiutata destinatario:', err);
                      } else {
                        console.log('Log offerta rifiutata destinatario creato con ID:', logId);
                      }
                    });
                    
                    res.json({ 
                      success: true, 
                      message: `Offerta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo`
                    });
                  }
                );
              }
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Crea una nuova offerta
router.post('/crea', authenticateToken, async (req, res) => {
  const { giocatore_id, tipo, valore_offerta, richiesta_fm, giocatore_scambio_id } = req.body;
  const utente_id = req.user.id;

  try {
    // Ottieni la squadra dell'utente
    const squadraUtente = await new Promise((resolve, reject) => {
      db.get(
        'SELECT s.* FROM squadre s JOIN leghe l ON s.lega_id = l.id JOIN giocatori g ON g.lega_id = l.id WHERE g.id = ? AND s.proprietario_id = ?',
        [giocatore_id, utente_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!squadraUtente) {
      return res.status(400).json({ error: 'Squadra non trovata o giocatore non nella tua lega' });
    }

    // Ottieni informazioni sul giocatore target
    const giocatoreTarget = await new Promise((resolve, reject) => {
      db.get(
        'SELECT g.*, s.proprietario_id, s.nome as squadra_nome FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE g.id = ?',
        [giocatore_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!giocatoreTarget) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    // Verifica che il giocatore non sia in prestito (non può essere offerto)
    if (giocatoreTarget.prestito) {
      return res.status(400).json({ error: 'Non puoi fare offerte per un giocatore che è in prestito' });
    }

    // Verifica che il giocatore non sia già nella squadra dell'utente
    if (giocatoreTarget.squadra_id === squadraUtente.id) {
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
      const giocatoreScambio = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM giocatori WHERE id = ? AND squadra_id = ?',
          [giocatore_scambio_id, squadraUtente.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!giocatoreScambio) {
        return res.status(400).json({ error: 'Giocatore scambio non trovato nella tua squadra' });
      }
    }

    // Crea l'offerta
    const offertaId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO offerte (lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, giocatore_scambio_id, tipo, valore_offerta, richiesta_fm, stato) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_attesa')`,
        [giocatoreTarget.lega_id, squadraUtente.id, giocatoreTarget.squadra_id, giocatore_id, giocatore_scambio_id || null, tipo, valore_offerta, richiesta_fm],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Ottieni le casse societarie attuali delle squadre
    const casseMittente = await new Promise((resolve, reject) => {
      db.get('SELECT casse_societarie, proprietario_id, nome FROM squadre WHERE id = ?', [squadraUtente.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const casseDestinatario = await new Promise((resolve, reject) => {
      db.get('SELECT casse_societarie, proprietario_id, nome FROM squadre WHERE id = ?', [giocatoreTarget.squadra_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Prendi info proprietario mittente
    const proprietarioMittente = await new Promise((resolve, reject) => {
      db.get('SELECT nome, cognome FROM users WHERE id = ?', [casseMittente.proprietario_id], (err, row) => {
        if (err) resolve({ nome: '', cognome: '' });
        else resolve(row || { nome: '', cognome: '' });
      });
    });

    // Prendi info proprietario destinatario
    const proprietarioDestinatario = await new Promise((resolve, reject) => {
      db.get('SELECT nome, cognome FROM users WHERE id = ?', [casseDestinatario.proprietario_id], (err, row) => {
        if (err) resolve({ nome: '', cognome: '' });
        else resolve(row || { nome: '', cognome: '' });
      });
    });

    // Prendi info giocatore in scambio (se presente)
    let giocatoreScambio = { nome: '', cognome: '' };
    if (giocatore_scambio_id) {
      giocatoreScambio = await new Promise((resolve, reject) => {
        db.get('SELECT nome, cognome FROM giocatori WHERE id = ?', [giocatore_scambio_id], (err, row) => {
          if (err) resolve({ nome: '', cognome: '' });
          else resolve(row || { nome: '', cognome: '' });
        });
      });
    }

    // Calcola l'impatto sulle casse societarie
    const valoreOfferta = valore_offerta || 0;
    const richiestaFM = richiesta_fm || 0;
    const casseMittenteDopo = (casseMittente.casse_societarie || 0) - valoreOfferta + richiestaFM;
    const casseDestinatarioDopo = (casseDestinatario.casse_societarie || 0) + valoreOfferta - richiestaFM;

    // Crea messaggio dettagliato
    const messaggioNotifica = tipo === 'scambio'
      ? `Offerta di scambio ricevuta per ${giocatoreTarget.nome}${giocatoreTarget.cognome ? ` ${giocatoreTarget.cognome}` : ''} da ${casseMittente.nome} (${proprietarioMittente.nome} ${proprietarioMittente.cognome}). In scambio: ${giocatoreScambio.nome}${giocatoreScambio.cognome ? ` ${giocatoreScambio.cognome}` : ''}`
      : `Offerta di ${tipo} ricevuta per ${giocatoreTarget.nome}${giocatoreTarget.cognome ? ` ${giocatoreTarget.cognome}` : ''} da ${casseMittente.nome} (${proprietarioMittente.nome} ${proprietarioMittente.cognome}) - Valore: ${valoreOfferta} FM`;

    // Crea messaggio di conferma per il mittente
    const messaggioConfermaMittente = tipo === 'scambio'
      ? `Hai inviato un'offerta di scambio per ${giocatoreTarget.nome}${giocatoreTarget.cognome ? ` ${giocatoreTarget.cognome}` : ''} a ${casseDestinatario.nome}. In scambio: ${giocatoreScambio.nome}${giocatoreScambio.cognome ? ` ${giocatoreScambio.cognome}` : ''}`
      : `Hai inviato un'offerta di ${tipo} per ${giocatoreTarget.nome}${giocatoreTarget.cognome ? ` ${giocatoreTarget.cognome}` : ''} a ${casseDestinatario.nome} - Valore: ${valoreOfferta} FM${richiestaFM > 0 ? ` - Richiesta: ${richiestaFM} FM` : ''}`;

    console.log('Creazione notifica offerta:');
    console.log('- Lega ID:', giocatoreTarget.lega_id);
    console.log('- Utente destinatario ID:', casseDestinatario.proprietario_id);
    console.log('- Messaggio:', messaggioNotifica);
    console.log('- Tipo:', tipo);

    // Crea notifica per il destinatario
      db.run(
      'INSERT INTO notifiche (utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES (?, ?, ?, ?, ?)',
        [
          casseDestinatario.proprietario_id,
        `Offerta ricevuta per ${giocatoreTarget.nome}${giocatoreTarget.cognome ? ` ${giocatoreTarget.cognome}` : ''}`,
          messaggioNotifica,
        'offerta_ricevuta',
          JSON.stringify({
          offerta_id: offertaId,
          giocatore_id: giocatoreTarget.id,
          squadra_mittente_id: casseMittente.id,
          squadra_destinatario_id: casseDestinatario.id,
          tipo_offerta: tipo,
          valore: valoreOfferta,
          richiesta_fm: richiestaFM,
          giocatore_scambio_id: giocatore_scambio_id,
            giocatore_scambio_nome: giocatoreScambio.nome,
            giocatore_scambio_cognome: giocatoreScambio.cognome,
          proprietario_destinatario: `${proprietarioDestinatario.nome} ${proprietarioDestinatario.cognome}`,
            squadra_destinatario: casseDestinatario.nome,
            proprietario_mittente: `${proprietarioMittente.nome} ${proprietarioMittente.cognome}`,
          squadra_mittente: casseMittente.nome,
          giocatore_nome: giocatoreTarget.nome,
          giocatore_cognome: giocatoreTarget.cognome,
          casse_mittente_prima: casseMittente.casse_societarie,
          casse_mittente_dopo: casseMittenteDopo,
          casse_destinatario_prima: casseDestinatario.casse_societarie,
          casse_destinatario_dopo: casseDestinatarioDopo
        })
      ],
      function(err) {
        if (err) {
          console.error('Errore creazione notifica:', err);
        } else {
          console.log('Notifica creata con ID:', this.lastID);
        }
      }
    );

    // Crea notifica di conferma per il mittente
    db.run(
      'INSERT INTO notifiche (utente_id, titolo, messaggio, tipo, dati_aggiuntivi) VALUES (?, ?, ?, ?, ?)',
      [
        casseMittente.proprietario_id,
        `Offerta inviata per ${giocatoreTarget.nome} ${giocatoreTarget.cognome}`,
        messaggioConfermaMittente,
        'offerta_inviata',
        JSON.stringify({
          offerta_id: offertaId,
          giocatore_id: giocatoreTarget.id,
          squadra_mittente_id: casseMittente.id,
          squadra_destinatario_id: casseDestinatario.id,
          tipo_offerta: tipo,
          valore: valoreOfferta,
            richiesta_fm: richiestaFM,
            giocatore_scambio_id: giocatore_scambio_id,
          giocatore_scambio_nome: giocatoreScambio.nome,
          giocatore_scambio_cognome: giocatoreScambio.cognome,
          proprietario_destinatario: `${proprietarioDestinatario.nome} ${proprietarioDestinatario.cognome}`, // ID del proprietario destinatario
          squadra_destinatario: casseDestinatario.nome,
          proprietario_mittente: `${proprietarioMittente.nome} ${proprietarioMittente.cognome}`,
          squadra_mittente: casseMittente.nome,
          giocatore_nome: giocatoreTarget.nome,
          giocatore_cognome: giocatoreTarget.cognome,
          casse_mittente_prima: casseMittente.casse_societarie,
            casse_mittente_dopo: casseMittenteDopo,
          casse_destinatario_prima: casseDestinatario.casse_societarie,
            casse_destinatario_dopo: casseDestinatarioDopo
          })
        ],
      function(err) {
        if (err) {
          console.error('Errore creazione notifica conferma mittente:', err);
        } else {
          console.log('Notifica conferma mittente creata con ID:', this.lastID);
        }
      }
    );

    // Crea log per la squadra mittente
    createLogSquadra({
      squadra_id: casseMittente.id,
      lega_id: giocatoreTarget.lega_id,
      tipo_evento: TIPI_EVENTI.OFFERTA_INVIATA,
      categoria: CATEGORIE_EVENTI.OFFERTA,
      titolo: `Offerta inviata per ${giocatoreTarget.nome} ${giocatoreTarget.cognome}`,
      descrizione: `Offerta di ${tipo} inviata a ${casseDestinatario.nome} per ${giocatoreTarget.nome} ${giocatoreTarget.cognome} - Valore: ${valoreOfferta} FM`,
      dati_aggiuntivi: {
        offerta_id: offertaId,
        giocatore_id: giocatoreTarget.id,
        squadra_destinatario_id: casseDestinatario.id,
        tipo_offerta: tipo,
        valore: valoreOfferta
      },
      utente_id: req.user.id,
      giocatore_id: giocatoreTarget.id
    }, (err, logId) => {
      if (err) {
        console.error('Errore creazione log offerta inviata:', err);
      } else {
        console.log('Log offerta inviata creato con ID:', logId);
      }
    });

    // Crea log per la squadra destinataria
    createLogSquadra({
      squadra_id: casseDestinatario.id,
      lega_id: giocatoreTarget.lega_id,
      tipo_evento: TIPI_EVENTI.OFFERTA_RICEVUTA,
      categoria: CATEGORIE_EVENTI.OFFERTA,
      titolo: `Offerta ricevuta per ${giocatoreTarget.nome} ${giocatoreTarget.cognome}`,
      descrizione: `Offerta di ${tipo} ricevuta da ${casseMittente.nome} per ${giocatoreTarget.nome} ${giocatoreTarget.cognome} - Valore: ${valoreOfferta} FM`,
      dati_aggiuntivi: {
        offerta_id: offertaId,
        giocatore_id: giocatoreTarget.id,
        squadra_mittente_id: casseMittente.id,
        tipo_offerta: tipo,
        valore: valoreOfferta
      },
      utente_id: casseDestinatario.proprietario_id,
      giocatore_id: giocatoreTarget.id
    }, (err, logId) => {
      if (err) {
        console.error('Errore creazione log offerta ricevuta:', err);
      } else {
        console.log('Log offerta ricevuta creato con ID:', logId);
      }
    });

    // Notifica già creata sopra, non serve duplicarla

    res.json({ success: true, offerta_id: offertaId });
  } catch (error) {
    console.error('Errore creazione offerta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni offerte ricevute dall'utente
router.get('/ricevute', authenticateToken, async (req, res) => {
  const { giocatore_id } = req.user;

  try {
    const offerte = await new Promise((resolve, reject) => {
      db.all(
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
         WHERE sd.proprietario_id = ? AND o.stato = 'in_attesa'
         ORDER BY o.data_invio DESC`,
        [giocatore_id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json(offerte);
  } catch (error) {
    console.error('Errore recupero offerte:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni log operazioni per un giocatore
router.get('/log-giocatore/:giocatore_id', authenticateToken, async (req, res) => {
  const { giocatore_id } = req.params;

  try {
    const log = await new Promise((resolve, reject) => {
      db.all(
        `SELECT l.*, 
                sm.nome as squadra_mittente_nome,
                sd.nome as squadra_destinatario_nome,
                u.nome as utente_nome, u.cognome as utente_cognome
         FROM log_operazioni_giocatori l
         LEFT JOIN squadre sm ON l.squadra_mittente_id = sm.id
         LEFT JOIN squadre sd ON l.squadra_destinatario_id = sd.id
         LEFT JOIN utenti u ON l.utente_id = u.id
         WHERE l.giocatore_id = ?
         ORDER BY l.data_operazione DESC`,
        [giocatore_id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json(log);
  } catch (error) {
    console.error('Errore recupero log:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per spostare giocatori tra roster A/B (solo admin/superadmin/subadmin)
router.post('/roster/move-player', authenticateToken, async (req, res) => {
  const { giocatoreId, targetRoster, squadraId, legaId } = req.body;
  const { id: userId, ruolo } = req.user;

  try {
    // Verifica che l'utente sia admin, superadmin o subadmin
    const ruoliAutorizzati = ['admin', 'superadmin', 'subadmin', 'Admin', 'SuperAdmin', 'SubAdmin'];
    if (!ruoliAutorizzati.includes(ruolo)) {
      return res.status(403).json({ error: 'Accesso negato. Solo admin, superadmin e subadmin possono gestire i roster.' });
    }

    // Verifica che il giocatore esista e appartenga alla squadra specificata
    const giocatore = await new Promise((resolve, reject) => {
      db.get(
        `SELECT g.*, s.proprietario_id, s.lega_id, s.id as squadra_id
         FROM giocatori g 
         JOIN squadre s ON g.squadra_id = s.id 
         WHERE g.id = ? AND g.squadra_id = ?`,
        [giocatoreId, squadraId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!giocatore) {
      return res.status(404).json({ error: 'Giocatore non trovato nella squadra specificata' });
    }

    // Verifica che la lega sia corretta
    console.log('Comparing lega_id:', giocatore.lega_id, 'with legaId:', legaId);
    if (parseInt(giocatore.lega_id) !== parseInt(legaId)) {
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
        const lega = await new Promise((resolve, reject) => {
          getLegaById(legaId, (err, lega) => {
            if (err) reject(err);
            else resolve(lega);
          });
        });

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
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE giocatori SET roster = ? WHERE id = ?',
        [targetRoster, giocatoreId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

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