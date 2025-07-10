import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createRichiestaAdmin, 
  getRichiesteBySquadra, 
  getRichiestePendingByLega,
  updateRichiestaStato,
  getRichiestaById,
  deleteRichiestaAdmin
} from '../models/richiestaAdmin.js';
import { getSquadraById, updateSquadraPartial } from '../models/squadra.js';
import { getGiocatoriBySquadra } from '../models/giocatore.js';
import { createNotifica } from '../models/notifica.js';
import { updateGiocatore } from '../models/giocatore.js';
import { getDb } from '../db/config.js';

const router = express.Router();

// Creare una nuova richiesta admin
router.post('/create', authenticateToken, (req, res) => {
  const { squadra_id, tipo_richiesta, dati_richiesta } = req.body;
  const user_id = req.user.id;

  // Verifica che l'utente sia proprietario della squadra
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    if (!squadra) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    if (squadra.proprietario_id !== user_id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Aggiungi informazioni "prima" ai dati della richiesta
    const dati_completi = {
      ...dati_richiesta,
      prima: {
        club_level: squadra.club_level,
        casse_societarie: squadra.casse_societarie,
        nome: squadra.nome,
        logo_url: squadra.logo_url
      }
    };

    createRichiestaAdmin(squadra_id, tipo_richiesta, dati_completi, (err, richiesta_id) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nella creazione della richiesta' });
      }

      // Ottieni l'admin della lega
      const db = getDb();
      console.log('Creating admin request - squadra_id:', squadra_id, 'lega_id:', squadra.lega_id);
      db.get('SELECT admin_id FROM leghe WHERE id = ?', [squadra.lega_id], (err, lega) => {
        if (err || !lega) {
          console.error('Errore nel recupero admin lega:', err, 'lega:', lega);
          return res.status(500).json({ error: 'Errore del server' });
        }

        console.log('Found league admin:', lega.admin_id);

        // Crea notifica per l'admin della lega
        const notifica_data = {
          tipo: 'richiesta_admin',
          messaggio: `Nuova richiesta ${tipo_richiesta} da ${squadra.nome}`,
          utente_id: lega.admin_id,
          dati_aggiuntivi: {
            richiesta_id: richiesta_id,
            squadra_id: squadra_id,
            tipo_richiesta: tipo_richiesta,
            lega_id: squadra.lega_id
          }
        };

        console.log('Creating notification with data:', notifica_data);

        createNotifica(notifica_data, (err) => {
          if (err) {
            console.error('Errore creazione notifica:', err);
          } else {
            console.log('Notification created successfully');
          }
        });

        res.json({ success: true, richiesta_id });
      });
    });
  });
});

// Ottenere richieste di una squadra
router.get('/squadra/:squadra_id', authenticateToken, (req, res) => {
  const { squadra_id } = req.params;
  const user_id = req.user.id;

  // Verifica che l'utente sia proprietario della squadra
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    if (!squadra) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    if (squadra.proprietario_id !== user_id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    getRichiesteBySquadra(squadra_id, (err, richieste) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero delle richieste' });
      }

      // Parsing dei dati JSON
      const richieste_parsed = richieste.map(r => ({
        ...r,
        dati_richiesta: JSON.parse(r.dati_richiesta || '{}')
      }));

      res.json({ richieste: richieste_parsed });
    });
  });
});

// Ottenere richieste pending per admin
router.get('/pending/:lega_id', authenticateToken, (req, res) => {
  const { lega_id } = req.params;
  const user_id = req.user.id;

  // Verifica che l'utente sia admin della lega
  // TODO: Implementare verifica admin lega

  getRichiestePendingByLega(lega_id, (err, richieste) => {
    if (err) {
      return res.status(500).json({ error: 'Errore nel recupero delle richieste' });
    }

    // Parsing dei dati JSON
    const richieste_parsed = richieste.map(r => ({
      ...r,
      dati_richiesta: JSON.parse(r.dati_richiesta || '{}')
    }));

    res.json({ richieste: richieste_parsed });
  });
});

// Gestire richiesta (accetta/rifiuta/revisione)
router.post('/:richiesta_id/gestisci', authenticateToken, (req, res) => {
  const { richiesta_id } = req.params;
  const { azione, note_admin, valore_costo } = req.body;
  const user_id = req.user.id;

  getRichiestaById(richiesta_id, (err, richiesta) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }

    // Verifica che l'utente sia admin della lega
    getSquadraById(richiesta.squadra_id, (err, squadra) => {
      if (err || !squadra) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      // Ottieni l'admin della lega
      const db = getDb();
      db.get('SELECT admin_id FROM leghe WHERE id = ?', [squadra.lega_id], (err, lega) => {
        if (err || !lega) {
          console.error('Errore nel recupero admin lega:', err);
          return res.status(500).json({ error: 'Errore del server' });
        }

        // Verifica che l'utente sia admin della lega
        if (lega.admin_id !== user_id) {
          return res.status(403).json({ error: 'Non autorizzato' });
        }

        let nuovo_stato = azione; // 'accepted', 'rejected', 'revision'
        let messaggio_notifica = '';

        updateRichiestaStato(richiesta_id, nuovo_stato, note_admin, (err) => {
          if (err) {
            return res.status(500).json({ error: 'Errore nell\'aggiornamento della richiesta' });
          }

          // Gestisci le azioni specifiche per tipo di richiesta
          if (azione === 'accepted') {
            handleAcceptedRequest(richiesta, valore_costo, (err) => {
              if (err) {
                console.error('Errore gestione richiesta accettata:', err);
              }
            });
            messaggio_notifica = `Richiesta ${richiesta.tipo_richiesta} accettata`;
          } else if (azione === 'rejected') {
            messaggio_notifica = `Richiesta ${richiesta.tipo_richiesta} rifiutata`;
          } else if (azione === 'revision') {
            messaggio_notifica = `Richiesta ${richiesta.tipo_richiesta} in revisione`;
          }

          // Crea notifica per il proprietario della squadra
          const notifica_utente = {
            tipo: 'risposta_richiesta_admin',
            messaggio: messaggio_notifica,
            utente_id: squadra.proprietario_id,
            dati_aggiuntivi: {
              richiesta_id: richiesta_id,
              squadra_id: richiesta.squadra_id,
              tipo_richiesta: richiesta.tipo_richiesta,
              stato: nuovo_stato,
              note_admin: note_admin
            }
          };

          createNotifica(notifica_utente, (err) => {
            if (err) {
              console.error('Errore creazione notifica utente:', err);
            }
          });

          // Crea notifica per l'admin della lega
          const notifica_admin = {
            tipo: 'richiesta_admin_gestita',
            messaggio: `Hai ${azione === 'accepted' ? 'accettato' : azione === 'rejected' ? 'rifiutato' : 'messo in revisione'} la richiesta ${richiesta.tipo_richiesta} di ${squadra.nome}`,
            utente_id: lega.admin_id,
            dati_aggiuntivi: {
              richiesta_id: richiesta_id,
              squadra_id: richiesta.squadra_id,
              squadra_nome: squadra.nome,
              tipo_richiesta: richiesta.tipo_richiesta,
              stato: nuovo_stato,
              note_admin: note_admin,
              valore_costo: valore_costo
            }
          };

          createNotifica(notifica_admin, (err) => {
            if (err) {
              console.error('Errore creazione notifica admin:', err);
            }
          });

          res.json({ success: true });
        });
      });
    });
  });
});

// Funzione per gestire le richieste accettate
function handleAcceptedRequest(richiesta, valore_costo, callback) {
  const dati = JSON.parse(richiesta.dati_richiesta || '{}');

  // Prima ottieni i dati attuali della squadra
  getSquadraById(richiesta.squadra_id, (err, squadra) => {
    if (err || !squadra) {
      return callback(err || new Error('Squadra non trovata'));
    }

    const casse_attuali = squadra.casse_societarie || 0;
    const casse_dopo = casse_attuali - (valore_costo || 0);

    switch (richiesta.tipo_richiesta) {
      case 'club_level':
        // Aggiorna club level e rimuovi dalle casse societarie
        updateSquadraPartial(richiesta.squadra_id, {
          club_level: dati.nuovo_club_level,
          casse_societarie: casse_dopo
        }, (err) => {
          if (!err) {
            // Aggiungi informazioni "dopo" ai dati della richiesta
            const dati_aggiornati = {
              ...dati,
              prima: {
                club_level: squadra.club_level,
                casse_societarie: casse_attuali
              },
              dopo: {
                club_level: dati.nuovo_club_level,
                casse_societarie: casse_dopo
              },
              costo_dedotto: valore_costo
            };
            
            // Aggiorna i dati della richiesta con le informazioni "dopo"
            const db = getDb();
            db.run(
              'UPDATE richieste_admin SET dati_richiesta = ? WHERE id = ?',
              [JSON.stringify(dati_aggiornati), richiesta.id],
              callback
            );
          } else {
            callback(err);
          }
        });
        break;

      case 'trigger':
        // Aggiungi alle casse societarie
        updateSquadraPartial(richiesta.squadra_id, {
          casse_societarie: casse_dopo
        }, (err) => {
          if (!err) {
            // Aggiungi informazioni "dopo" ai dati della richiesta
            const dati_aggiornati = {
              ...dati,
              prima: {
                casse_societarie: casse_attuali
              },
              dopo: {
                casse_societarie: casse_dopo
              },
              costo_dedotto: valore_costo
            };
            
            // Aggiorna i dati della richiesta con le informazioni "dopo"
            const db = getDb();
            db.run(
              'UPDATE richieste_admin SET dati_richiesta = ? WHERE id = ?',
              [JSON.stringify(dati_aggiornati), richiesta.id],
              callback
            );
          } else {
            callback(err);
          }
        });
        break;

      case 'cantera':
        // Aggiorna i giocatori selezionati
        if (dati.giocatori_selezionati && Array.isArray(dati.giocatori_selezionati)) {
          let completed = 0;
          dati.giocatori_selezionati.forEach(giocatore_id => {
            updateGiocatore(giocatore_id, {
              cantera: 1,
              costo_attuale: dati.costi_dimezzati[giocatore_id] || 0
            }, (err) => {
              completed++;
              if (completed === dati.giocatori_selezionati.length) {
                if (!err) {
                  // Aggiungi informazioni "dopo" ai dati della richiesta
                  const dati_aggiornati = {
                    ...dati,
                    dopo: {
                      giocatori_cantera: dati.giocatori_selezionati,
                      costi_dimezzati: dati.costi_dimezzati
                    }
                  };
                  
                  // Aggiorna i dati della richiesta con le informazioni "dopo"
                  const db = getDb();
                  db.run(
                    'UPDATE richieste_admin SET dati_richiesta = ? WHERE id = ?',
                    [JSON.stringify(dati_aggiornati), richiesta.id],
                    callback
                  );
                } else {
                  callback(err);
                }
              }
            });
          });
        } else {
          callback(null);
        }
        break;

      case 'cambio_nome':
        // Aggiorna nome squadra
        updateSquadraPartial(richiesta.squadra_id, {
          nome: dati.nuovo_nome
        }, (err) => {
          if (!err) {
            // Aggiungi informazioni "dopo" ai dati della richiesta
            const dati_aggiornati = {
              ...dati,
              dopo: {
                nome: dati.nuovo_nome
              }
            };
            
            // Aggiorna i dati della richiesta con le informazioni "dopo"
            const db = getDb();
            db.run(
              'UPDATE richieste_admin SET dati_richiesta = ? WHERE id = ?',
              [JSON.stringify(dati_aggiornati), richiesta.id],
              callback
            );
          } else {
            callback(err);
          }
        });
        break;

      case 'cambio_logo':
        // Aggiorna logo squadra
        updateSquadraPartial(richiesta.squadra_id, {
          logo_url: dati.logo_url
        }, (err) => {
          if (!err) {
            // Aggiungi informazioni "dopo" ai dati della richiesta
            const dati_aggiornati = {
              ...dati,
              dopo: {
                logo_url: dati.logo_url
              }
            };
            
            // Aggiorna i dati della richiesta con le informazioni "dopo"
            const db = getDb();
            db.run(
              'UPDATE richieste_admin SET dati_richiesta = ? WHERE id = ?',
              [JSON.stringify(dati_aggiornati), richiesta.id],
              callback
            );
          } else {
            callback(err);
          }
        });
        break;

      default:
        callback(null);
    }
  });
}

// Endpoint per annullare una richiesta admin
router.post('/:id/annulla', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verifica che la richiesta esista e appartenga all'utente
    const richiesta = await new Promise((resolve, reject) => {
      getRichiestaById(id, (err, richiesta) => {
        if (err) reject(err);
        else resolve(richiesta);
      });
    });

    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }

    // Verifica che la richiesta appartenga a una squadra dell'utente
    const squadra = await new Promise((resolve, reject) => {
      getSquadraById(richiesta.squadra_id, (err, squadra) => {
        if (err) reject(err);
        else resolve(squadra);
      });
    });

    if (!squadra || squadra.proprietario_id !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Verifica che la richiesta sia ancora in stato pending
    if (richiesta.stato !== 'pending') {
      return res.status(400).json({ error: 'Solo le richieste in attesa possono essere annullate' });
    }

    // Annulla la richiesta
    await new Promise((resolve, reject) => {
      deleteRichiestaAdmin(id, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: 'Richiesta annullata con successo' });
  } catch (error) {
    console.error('Errore annullamento richiesta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per annullare una richiesta admin accettata
router.post('/:richiesta_id/annulla', authenticateToken, (req, res) => {
  const { richiesta_id } = req.params;
  const user_id = req.user.id;

  getRichiestaById(richiesta_id, (err, richiesta) => {
    if (err) {
      return res.status(500).json({ error: 'Errore del server' });
    }
    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }

    // Verifica che la richiesta sia stata accettata
    if (richiesta.stato !== 'accepted') {
      return res.status(400).json({ error: 'Solo le richieste accettate possono essere annullate' });
    }

    // Verifica che l'utente sia admin della lega
    getSquadraById(richiesta.squadra_id, (err, squadra) => {
      if (err || !squadra) {
        return res.status(500).json({ error: 'Errore del server' });
      }

      // Ottieni l'admin della lega
      const db = getDb();
      db.get('SELECT admin_id FROM leghe WHERE id = ?', [squadra.lega_id], (err, lega) => {
        if (err || !lega) {
          console.error('Errore nel recupero admin lega:', err);
          return res.status(500).json({ error: 'Errore del server' });
        }

        // Verifica che l'utente sia admin della lega
        if (lega.admin_id !== user_id) {
          return res.status(403).json({ error: 'Non autorizzato' });
        }

        // Annulla la richiesta e ripristina i dati originali
        handleCancelledRequest(richiesta, (err) => {
          if (err) {
            console.error('Errore annullamento richiesta:', err);
            return res.status(500).json({ error: 'Errore nell\'annullamento della richiesta' });
          }

          // Aggiorna lo stato della richiesta a 'cancelled'
          updateRichiestaStato(richiesta_id, 'cancelled', 'Richiesta annullata dall\'admin', (err) => {
            if (err) {
              console.error('Errore aggiornamento stato richiesta:', err);
            }

            // Crea notifica per il proprietario della squadra
            const notifica_utente = {
              tipo: 'richiesta_admin_annullata',
              messaggio: `La richiesta ${richiesta.tipo_richiesta} è stata annullata dall'admin`,
              utente_id: squadra.proprietario_id,
              dati_aggiuntivi: {
                richiesta_id: richiesta_id,
                squadra_id: richiesta.squadra_id,
                tipo_richiesta: richiesta.tipo_richiesta,
                stato: 'cancelled'
              }
            };

            createNotifica(notifica_utente, (err) => {
              if (err) {
                console.error('Errore creazione notifica utente:', err);
              }
            });

            // Crea notifica per l'admin della lega
            const notifica_admin = {
              tipo: 'richiesta_admin_annullata',
              messaggio: `Hai annullato la richiesta ${richiesta.tipo_richiesta} di ${squadra.nome}`,
              utente_id: lega.admin_id,
              dati_aggiuntivi: {
                richiesta_id: richiesta_id,
                squadra_id: richiesta.squadra_id,
                squadra_nome: squadra.nome,
                tipo_richiesta: richiesta.tipo_richiesta,
                stato: 'cancelled'
              }
            };

            createNotifica(notifica_admin, (err) => {
              if (err) {
                console.error('Errore creazione notifica admin:', err);
              }
            });

            res.json({ success: true });
          });
        });
      });
    });
  });
});

// Funzione per gestire l'annullamento delle richieste accettate
function handleCancelledRequest(richiesta, callback) {
  const dati = JSON.parse(richiesta.dati_richiesta || '{}');

  switch (richiesta.tipo_richiesta) {
    case 'club_level':
      // Ripristina club level e casse societarie originali
      const dati_club = dati.prima || {};
      updateSquadraPartial(richiesta.squadra_id, {
        club_level: dati_club.club_level || 1,
        casse_societarie: dati_club.casse_societarie || 0
      }, callback);
      break;

    case 'trigger':
      // Ripristina casse societarie originali
      const dati_trigger = dati.prima || {};
      updateSquadraPartial(richiesta.squadra_id, {
        casse_societarie: dati_trigger.casse_societarie || 0
      }, callback);
      break;

    case 'cantera':
      // Ripristina i giocatori alla situazione originale
      if (dati.prima && dati.prima.giocatori_cantera) {
        let completed = 0;
        dati.prima.giocatori_cantera.forEach(giocatore_id => {
          updateGiocatore(giocatore_id, {
            cantera: 0,
            costo_attuale: dati.prima.costi_originali[giocatore_id] || 0
          }, (err) => {
            completed++;
            if (completed === dati.prima.giocatori_cantera.length) {
              callback(err);
            }
          });
        });
      } else {
        callback(null);
      }
      break;

    case 'cambio_nome':
      // Ripristina nome squadra originale
      const dati_nome = dati.prima || {};
      updateSquadraPartial(richiesta.squadra_id, {
        nome: dati_nome.nome || 'Squadra'
      }, callback);
      break;

    case 'cambio_logo':
      // Ripristina logo squadra originale
      const dati_logo = dati.prima || {};
      updateSquadraPartial(richiesta.squadra_id, {
        logo_url: dati_logo.logo_url || null
      }, callback);
      break;

    default:
      callback(null);
  }
}

export default router; 