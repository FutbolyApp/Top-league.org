import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';
import { createLogContratto, getLogContrattiBySquadra } from '../models/logContratto.js';

const router = express.Router();
const db = getDb();

// Paga contratto giocatore
router.post('/paga/:giocatoreId', requireAuth, (req, res) => {
  const { giocatoreId } = req.params;
  const { token } = req.body;

  try {
    db.serialize(() => {
      // 1. Ottieni informazioni giocatore e squadra
      db.get(
        `SELECT g.*, s.casse_societarie, s.id as squadra_id 
         FROM giocatori g 
         JOIN squadre s ON g.squadra_id = s.id 
         WHERE g.id = ?`,
        [giocatoreId],
        (err, giocatore) => {
          if (err) {
            return res.status(500).json({ error: 'Errore nel recupero giocatore' });
          }
          if (!giocatore) {
            return res.status(404).json({ error: 'Giocatore non trovato' });
          }

          // 2. Verifica che il giocatore non sia in Roster B (non può essere modificato)
          if (giocatore.roster === 'B') {
            return res.status(400).json({ error: 'Non puoi pagare contratti per giocatori in Roster B' });
          }

          // 3. Verifica se ci sono abbastanza fondi
          if (giocatore.casse_societarie < giocatore.costo_attuale) {
            return res.status(400).json({ error: 'Fondi insufficienti per pagare il contratto' });
          }

          // 3. Aggiorna casse societarie
          const nuoveCasse = giocatore.casse_societarie - giocatore.costo_attuale;
          db.run(
            'UPDATE squadre SET casse_societarie = ? WHERE id = ?',
            [nuoveCasse, giocatore.squadra_id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Errore nell\'aggiornamento casse' });
              }

              // 4. Aggiorna timestamp ultimo pagamento e diminuisci anni contratto
              db.run(
                `UPDATE giocatori 
                 SET ultimo_pagamento_contratto = datetime('now'),
                     anni_contratto = CASE 
                       WHEN anni_contratto > 0 THEN anni_contratto - 1 
                       ELSE 0 
                     END
                 WHERE id = ?`,
                [giocatoreId],
                function(err) {
                  if (err) {
                    console.log('Errore aggiornamento timestamp e anni contratto:', err);
                  }
                }
              );

              // 5. Registra il pagamento nel log
              createLogContratto({
                giocatore_id: giocatoreId,
                squadra_id: giocatore.squadra_id,
                tipo: 'pagamento_contratto',
                valore_prima: giocatore.casse_societarie,
                valore_dopo: nuoveCasse,
                importo: giocatore.costo_attuale,
                note: `Pagamento contratto ${giocatore.nome}`
              }, function(err) {
                if (err) {
                  console.log('Errore registrazione log:', err);
                }
              });

              // 6. Crea notifica
              db.run(
                `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
                 VALUES (?, 'pagamento_contratto', ?, datetime('now'))`,
                [giocatore.proprietario_id, `Contratto pagato per ${giocatore.nome} - FM ${giocatore.costo_attuale}`],
                function(err) {
                  if (err) {
                    console.log('Errore creazione notifica:', err);
                  }
                  
                  res.json({ 
                    success: true, 
                    message: 'Contratto pagato con successo',
                    nuoveCasse: nuoveCasse,
                    timestamp: new Date().toISOString()
                  });
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Paga contratti multipli
router.post('/paga-multipli', requireAuth, (req, res) => {
  const { giocatoriIds } = req.body;
  const userId = req.user.id;

  if (!giocatoriIds || !Array.isArray(giocatoriIds) || giocatoriIds.length === 0) {
    return res.status(400).json({ error: 'Lista giocatori non valida' });
  }

  db.serialize(() => {
    // 1. Ottieni tutte le squadre dell'utente
    db.all(
      `SELECT s.id as squadra_id, s.casse_societarie, s.proprietario_id, s.nome
       FROM squadre s 
       WHERE s.proprietario_id = ?`,
      [userId],
      (err, squadre) => {
        if (err) {
          return res.status(500).json({ error: 'Errore nel recupero squadre' });
        }
        if (!squadre || squadre.length === 0) {
          return res.status(404).json({ error: 'Nessuna squadra trovata' });
        }

        // 2. Ottieni tutti i giocatori e calcola il totale
        const placeholders = giocatoriIds.map(() => '?').join(',');
        const squadraIds = squadre.map(s => s.id);
        const squadraPlaceholders = squadraIds.map(() => '?').join(',');
        
        db.all(
          `SELECT g.*, s.casse_societarie, s.nome as squadra_nome 
           FROM giocatori g 
           JOIN squadre s ON g.squadra_id = s.id
           WHERE g.id IN (${placeholders}) AND g.squadra_id IN (${squadraPlaceholders})`,
          [...giocatoriIds, ...squadraIds],
          (err, giocatori) => {
            if (err) {
              return res.status(500).json({ error: 'Errore nel recupero giocatori' });
            }
            if (giocatori.length !== giocatoriIds.length) {
              return res.status(400).json({ error: 'Alcuni giocatori non appartengono alla tua squadra' });
            }

            // 3. Verifica che nessun giocatore sia in Roster B
            const giocatoriInRosterB = giocatori.filter(g => g.roster === 'B');
            if (giocatoriInRosterB.length > 0) {
              const nomiGiocatori = giocatoriInRosterB.map(g => `${g.nome} ${g.cognome || ''}`).join(', ');
              return res.status(400).json({ 
                error: `Non puoi pagare contratti per giocatori in Roster B: ${nomiGiocatori}` 
              });
            }

            // 4. Calcola il totale da pagare per ogni squadra
            const pagamentiPerSquadra = {};
            giocatori.forEach(g => {
              if (!pagamentiPerSquadra[g.squadra_id]) {
                pagamentiPerSquadra[g.squadra_id] = {
                  squadra_id: g.squadra_id,
                  squadra_nome: g.squadra_nome,
                  casse_societarie: g.casse_societarie,
                  totale: 0,
                  giocatori: []
                };
              }
              pagamentiPerSquadra[g.squadra_id].totale += (g.costo_attuale || 0);
              pagamentiPerSquadra[g.squadra_id].giocatori.push(g);
            });

            // 4. Verifica fondi per ogni squadra
            for (const squadraId in pagamentiPerSquadra) {
              const squadra = pagamentiPerSquadra[squadraId];
              if (squadra.casse_societarie < squadra.totale) {
                return res.status(400).json({ 
                  error: `Fondi insufficienti per la squadra ${squadra.squadra_nome}` 
                });
              }
            }

            // 5. Aggiorna casse societarie per ogni squadra
            const updatePromises = Object.values(pagamentiPerSquadra).map(squadra => {
              return new Promise((resolve, reject) => {
                const nuoveCasse = squadra.casse_societarie - squadra.totale;
                db.run(
                  'UPDATE squadre SET casse_societarie = ? WHERE id = ?',
                  [nuoveCasse, squadra.squadra_id],
                  function(err) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve();
                    }
                  }
                );
              });
            });

            Promise.all(updatePromises).then(() => {

                // 5. Aggiorna timestamp e diminuisci anni contratto per tutti i giocatori
                const timestampPromises = giocatori.map(giocatore => {
                  return new Promise((resolve, reject) => {
                    db.run(
                      `UPDATE giocatori 
                       SET ultimo_pagamento_contratto = datetime('now'),
                           anni_contratto = CASE 
                             WHEN anni_contratto > 0 THEN anni_contratto - 1 
                             ELSE 0 
                           END
                       WHERE id = ?`,
                      [giocatore.id],
                      (err) => {
                        if (err) {
                          console.log(`Errore aggiornamento timestamp e anni contratto giocatore ${giocatore.id}:`, err);
                        }
                        resolve();
                      }
                    );
                  });
                });

                // 6. Registra i log per tutti i giocatori
                giocatori.forEach(giocatore => {
                  const squadra = pagamentiPerSquadra[giocatore.squadra_id];
                  const nuoveCasse = squadra.casse_societarie - squadra.totale;
                  
                  createLogContratto({
                    giocatore_id: giocatore.id,
                    squadra_id: giocatore.squadra_id,
                    tipo: 'pagamento_contratto',
                    valore_prima: squadra.casse_societarie,
                    valore_dopo: nuoveCasse,
                    importo: giocatore.costo_attuale,
                    note: `Pagamento contratto multiplo - ${giocatore.nome}`
                  }, function(err) {
                    if (err) {
                      console.log('Errore registrazione log:', err);
                    }
                  });
                });

                const totalePagato = giocatori.reduce((sum, g) => sum + (g.costo_attuale || 0), 0);
                res.json({ 
                  success: true, 
                  message: `Pagati ${giocatori.length} contratti con successo`,
                  totalePagato: totalePagato,
                  pagamentiPerSquadra: Object.values(pagamentiPerSquadra).map(s => ({
                    squadra_nome: s.squadra_nome,
                    totale: s.totale,
                    nuoveCasse: s.casse_societarie - s.totale
                  })),
                  timestamp: new Date().toISOString()
                });
              }).catch(err => {
                console.log('Errore aggiornamento casse:', err);
                res.status(500).json({ error: 'Errore nell\'aggiornamento casse' });
              });
            });
          }
        );
      }
    );
  });

// Rinnova contratto giocatore
router.post('/rinnova/:giocatoreId', requireAuth, (req, res) => {
  const { giocatoreId } = req.params;
  const { anniRinnovo } = req.body;

  if (!anniRinnovo || anniRinnovo < 1 || anniRinnovo > 4) {
    return res.status(400).json({ error: 'Anni di rinnovo non validi (1-4)' });
  }

  try {
    db.serialize(() => {
      // 1. Ottieni informazioni giocatore e squadra
      db.get(
        `SELECT g.*, s.casse_societarie, s.id as squadra_id 
         FROM giocatori g 
         JOIN squadre s ON g.squadra_id = s.id 
         WHERE g.id = ?`,
        [giocatoreId],
        (err, giocatore) => {
          if (err) {
            return res.status(500).json({ error: 'Errore nel recupero giocatore' });
          }
          if (!giocatore) {
            return res.status(404).json({ error: 'Giocatore non trovato' });
          }

          // 2. Verifica che il giocatore non sia in Roster B (non può essere modificato)
          if (giocatore.roster === 'B') {
            return res.status(400).json({ error: 'Non puoi rinnovare contratti per giocatori in Roster B' });
          }

          // 3. Verifica se ci sono abbastanza fondi
          if (giocatore.casse_societarie < giocatore.quotazione_attuale) {
            return res.status(400).json({ error: 'Fondi insufficienti per il rinnovo' });
          }

          // 3. Calcola nuovi anni contratto
          const nuoviAnniContratto = (giocatore.anni_contratto || 0) + anniRinnovo;

          // 4. Aggiorna casse societarie
          const nuoveCasse = giocatore.casse_societarie - giocatore.quotazione_attuale;
          db.run(
            'UPDATE squadre SET casse_societarie = ? WHERE id = ?',
            [nuoveCasse, giocatore.squadra_id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Errore nell\'aggiornamento casse' });
              }

              // 5. Aggiorna anni contratto e timestamp
              db.run(
                `UPDATE giocatori 
                 SET anni_contratto = ?, ultimo_rinnovo_contratto = datetime('now')
                 WHERE id = ?`,
                [nuoviAnniContratto, giocatoreId],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Errore nel rinnovo contratto' });
                  }

                  // 6. Registra il rinnovo nel log
                  createLogContratto({
                    giocatore_id: giocatoreId,
                    squadra_id: giocatore.squadra_id,
                    tipo: 'rinnovo_contratto',
                    valore_prima: giocatore.casse_societarie,
                    valore_dopo: nuoveCasse,
                    importo: giocatore.quotazione_attuale,
                    note: `Rinnovo contratto ${giocatore.nome} per ${anniRinnovo} anni`
                  }, function(err) {
                    if (err) {
                      console.log('Errore registrazione log:', err);
                    }
                  });

                  // 7. Crea notifica per il rinnovo
                  db.run(
                    `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
                     VALUES (?, 'rinnovo_contratto', ?, datetime('now'))`,
                    [giocatore.proprietario_id, `Contratto rinnovato per ${giocatore.nome} - ${anniRinnovo} anni - FM ${giocatore.quotazione_attuale}`],
                    function(err) {
                      if (err) {
                        console.log('Errore creazione notifica rinnovo:', err);
                      }
                      
                      res.json({ 
                        success: true, 
                        message: 'Contratto rinnovato con successo',
                        nuoviAnniContratto: nuoviAnniContratto,
                        nuoveCasse: nuoveCasse,
                        timestamp: new Date().toISOString()
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiorna impostazioni trasferimento/prestito
router.post('/impostazioni/:giocatoreId', requireAuth, (req, res) => {
  const { giocatoreId } = req.params;
  const { prestito, valorePrestito, trasferimento, valoreTrasferimento } = req.body;
  const userId = req.user.id;

  try {
    db.serialize(() => {
      // 1. Verifica che il giocatore appartenga alla squadra dell'utente
      db.get(
        `SELECT g.*, s.proprietario_id 
         FROM giocatori g 
         JOIN squadre s ON g.squadra_id = s.id 
         WHERE g.id = ? AND s.proprietario_id = ?`,
        [giocatoreId, userId],
        (err, giocatore) => {
          if (err) {
            return res.status(500).json({ error: 'Errore nel recupero giocatore' });
          }
          if (!giocatore) {
            return res.status(404).json({ error: 'Giocatore non trovato o non autorizzato' });
          }

          // 2. Verifica che il giocatore non sia in Roster B (non può essere modificato)
          if (giocatore.roster === 'B') {
            return res.status(400).json({ error: 'Non puoi modificare impostazioni per giocatori in Roster B' });
          }

          // 3. Aggiorna le impostazioni
          const updateData = {};
          if (prestito !== undefined) {
            updateData.prestito = prestito ? 1 : 0;
            updateData.valore_prestito = valorePrestito || 0;
          }
          if (trasferimento !== undefined) {
            updateData.trasferimento = trasferimento ? 1 : 0;
            updateData.valore_trasferimento = valoreTrasferimento || 0;
          }

          const updateFields = Object.keys(updateData).map(field => `${field} = ?`).join(', ');
          const updateValues = Object.values(updateData);

          db.run(
            `UPDATE giocatori SET ${updateFields} WHERE id = ?`,
            [...updateValues, giocatoreId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Errore nell\'aggiornamento impostazioni' });
              }

              res.json({ 
                success: true, 
                message: 'Impostazioni aggiornate con successo'
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni log contratti per squadra
router.get('/log/:squadraId', requireAuth, (req, res) => {
  const { squadraId } = req.params;
  
  try {
    getLogContrattiBySquadra(squadraId, (err, log) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero log' });
      }
      
      res.json({ log });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni log rinnovi contratto per un giocatore
router.get('/log-giocatore/:giocatoreId', requireAuth, (req, res) => {
  const { giocatoreId } = req.params;
  try {
    const sql = `
      SELECT *
      FROM log_contratti
      WHERE giocatore_id = ? AND tipo = 'rinnovo_contratto'
      ORDER BY data_operazione DESC
      LIMIT 20
    `;
    db.all(sql, [giocatoreId], (err, log) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero log rinnovi' });
      }
      res.json({ log });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

export default router; 