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
import { getDb } from '../db/postgres.js';

const router = express.Router();

// Creare richiesta admin
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { squadra_id, tipo_richiesta, dati_richiesta } = req.body;
    const user_id = req.user.id;

    console.log('🔍 Creating admin request:', { squadra_id, tipo_richiesta, user_id });

    // Verifica che l'utente sia proprietario della squadra
    const squadra = await getSquadraById(squadra_id);
    console.log('🔍 Squadra found:', squadra ? 'yes' : 'no');
    
    if (!squadra) {
      console.log('❌ Squadra non trovata');
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    console.log('🔍 Squadra proprietario_id:', squadra.proprietario_id, 'user_id:', user_id);
    
    if (squadra.proprietario_id !== user_id) {
      console.log('❌ Non autorizzato - proprietario_id:', squadra.proprietario_id, 'user_id:', user_id);
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Crea la richiesta
    console.log('🔍 Creating richiesta admin...');
    const richiesta_id = await createRichiestaAdmin(squadra_id, tipo_richiesta, dati_richiesta);
    console.log('✅ Richiesta created with ID:', richiesta_id);

    // Ottieni l'admin della lega
    const db = getDb();
    console.log('🔍 Getting league admin for squadra_id:', squadra_id, 'lega_id:', squadra.lega_id);
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [squadra.lega_id]);
    const lega = legaResult.rows[0];
    
    if (!lega) {
      console.error('❌ Errore nel recupero admin lega:', 'lega:', lega);
      return res.status(500).json({ error: 'Errore del server' });
    }

    console.log('✅ Found league admin:', lega.admin_id);

    // Crea notifica per l'admin della lega
    const notifica_data = {
      tipo: 'richiesta_admin',
      messaggio: `Nuova richiesta ${tipo_richiesta} da ${squadra.nome}`,
      utente_id: lega.admin_id,
      lega_id: squadra.lega_id,
      dati_aggiuntivi: {
        richiesta_id: richiesta_id,
        squadra_id: squadra_id,
        tipo_richiesta: tipo_richiesta,
        lega_id: squadra.lega_id
      }
    };

    console.log('🔍 Creating notification with data:', notifica_data);

    try {
      await createNotifica(notifica_data);
      console.log('✅ Notification created successfully');
    } catch (err) {
      console.error('❌ Errore creazione notifica:', err);
    }

    console.log('✅ Admin request created successfully');
    res.json({ success: true, richiesta_id });
  } catch (err) {
    console.error('❌ Errore creazione richiesta admin:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottenere richieste di una squadra
router.get('/squadra/:squadra_id', authenticateToken, async (req, res) => {
  try {
    const { squadra_id } = req.params;
    const user_id = req.user.id;

    console.log('🔍 RichiesteAdmin - squadra/:squadra_id called with:', { squadra_id, user_id });

    // Verifica che l'utente sia proprietario della squadra
    const squadra = await getSquadraById(squadra_id);
    console.log('🔍 Squadra found:', squadra ? 'yes' : 'no');
    
    if (!squadra) {
      console.log('❌ Squadra non trovata');
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    console.log('🔍 Squadra proprietario_id:', squadra.proprietario_id, 'user_id:', user_id);
    
    if (squadra.proprietario_id !== user_id) {
      console.log('❌ Non autorizzato - proprietario_id:', squadra.proprietario_id, 'user_id:', user_id);
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    console.log('🔍 Getting richieste for squadra_id:', squadra_id);
    const richieste = await getRichiesteBySquadra(squadra_id);
    console.log('🔍 Richieste found:', richieste.length);

    // Parsing dei dati JSON
    const richieste_parsed = richieste.map(r => ({
      ...r,
      dati_richiesta: JSON.parse(r.dati_richiesta || '{}')
    }));

    console.log('✅ Richieste retrieved successfully');
    res.json({ richieste: richieste_parsed });
  } catch (err) {
    console.error('❌ Errore recupero richieste squadra:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ error: 'Errore nel recupero delle richieste' });
  }
});

// Ottenere richieste pending per admin
router.get('/pending/:lega_id', authenticateToken, async (req, res) => {
  try {
    const { lega_id } = req.params;
    const user_id = req.user.id;

    // Verifica che l'utente sia admin della lega
    // TODO: Implementare verifica admin lega

    const richieste = await getRichiestePendingByLega(lega_id);

    // Parsing dei dati JSON
    const richieste_parsed = richieste.map(r => ({
      ...r,
      dati_richiesta: JSON.parse(r.dati_richiesta || '{}')
    }));

    res.json({ richieste: richieste_parsed });
  } catch (err) {
    console.error('Errore recupero richieste pending:', err);
    res.status(500).json({ error: 'Errore nel recupero delle richieste' });
  }
});

// Gestire richiesta (accetta/rifiuta/revisione)
router.post('/:richiesta_id/gestisci', authenticateToken, async (req, res) => {
  try {
    const { richiesta_id } = req.params;
    const { azione, note_admin, valore_costo } = req.body;
    const user_id = req.user.id;

    const richiesta = await getRichiestaById(richiesta_id);
    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }

    // Verifica che l'utente sia admin della lega
    const squadra = await getSquadraById(richiesta.squadra_id);
    if (!squadra) {
      return res.status(500).json({ error: 'Errore del server' });
    }

    // Ottieni l'admin della lega
    const db = getDb();
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [squadra.lega_id]);
    const lega = legaResult.rows[0];
    
    if (!lega) {
      console.error('Errore nel recupero admin lega');
      return res.status(500).json({ error: 'Errore del server' });
    }

    // Verifica che l'utente sia admin della lega
    if (lega.admin_id !== user_id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    let nuovo_stato = azione; // 'accepted', 'rejected', 'revision'
    let messaggio_notifica = '';

    await updateRichiestaStato(richiesta_id, nuovo_stato, note_admin);

    // Gestisci le azioni specifiche per tipo di richiesta
    if (azione === 'accepted') {
      try {
        await handleAcceptedRequest(richiesta, valore_costo);
      } catch (err) {
        console.error('Errore gestione richiesta accettata:', err);
      }
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
      lega_id: squadra.lega_id,
      dati_aggiuntivi: {
        richiesta_id: richiesta_id,
        squadra_id: richiesta.squadra_id,
        tipo_richiesta: richiesta.tipo_richiesta,
        stato: nuovo_stato,
        note_admin: note_admin
      }
    };

    try {
      await createNotifica(notifica_utente);
    } catch (err) {
      console.error('Errore creazione notifica utente:', err);
    }

    // Crea notifica per l'admin della lega
    const notifica_admin = {
      tipo: 'richiesta_admin_gestita',
      messaggio: `Hai ${azione === 'accepted' ? 'accettato' : azione === 'rejected' ? 'rifiutato' : 'messo in revisione'} la richiesta ${richiesta.tipo_richiesta} di ${squadra.nome}`,
      utente_id: lega.admin_id,
      lega_id: squadra.lega_id,
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

    try {
      await createNotifica(notifica_admin);
    } catch (err) {
      console.error('Errore creazione notifica admin:', err);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Errore gestione richiesta:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Funzione per gestire le richieste accettate
async function handleAcceptedRequest(richiesta, valore_costo) {
  const dati = JSON.parse(richiesta.dati_richiesta || '{}');

  // Prima ottieni i dati attuali della squadra
  const squadra = await getSquadraById(richiesta.squadra_id);
  if (!squadra) {
    throw new Error('Squadra non trovata');
  }

  const casse_attuali = squadra.casse_societarie || 0;
  const casse_dopo = casse_attuali - (valore_costo || 0);

  switch (richiesta.tipo_richiesta) {
    case 'club_level':
      // Aggiorna club level e rimuovi dalle casse societarie
      await updateSquadraPartial(richiesta.squadra_id, {
        club_level: dati.nuovo_club_level,
        casse_societarie: casse_dopo
      });
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
      await db.query(
        'UPDATE richieste_admin SET dati_richiesta = $1 WHERE id = $2',
        [JSON.stringify(dati_aggiornati), richiesta.id]
      );
      break;

    case 'trigger':
      // Aggiungi alle casse societarie
      await updateSquadraPartial(richiesta.squadra_id, {
        casse_societarie: casse_dopo
      });
      // Aggiungi informazioni "dopo" ai dati della richiesta
      const dati_trigger = {
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
      const db_trigger = getDb();
      await db_trigger.query(
        'UPDATE richieste_admin SET dati_richiesta = $1 WHERE id = $2',
        [JSON.stringify(dati_trigger), richiesta.id]
      );
      break;

    case 'cantera':
      // Aggiorna i giocatori selezionati
      if (dati.giocatori_selezionati && Array.isArray(dati.giocatori_selezionati)) {
        let completed = 0;
        for (const giocatore_id of dati.giocatori_selezionati) {
          await updateGiocatore(giocatore_id, {
            cantera: 1,
            costo_attuale: dati.costi_dimezzati[giocatore_id] || 0
          });
          completed++;
          if (completed === dati.giocatori_selezionati.length) {
            // Aggiungi informazioni "dopo" ai dati della richiesta
            const dati_aggiornati = {
              ...dati,
              dopo: {
                giocatori_cantera: dati.giocatori_selezionati,
                costi_dimezzati: dati.costi_dimezzati
              }
            };
            
            // Aggiorna i dati della richiesta con le informazioni "dopo"
            const db_cantera = getDb();
            await db_cantera.query(
              'UPDATE richieste_admin SET dati_richiesta = $1 WHERE id = $2',
              [JSON.stringify(dati_aggiornati), richiesta.id]
            );
          }
        }
      }
      break;

    case 'cambio_nome':
      // Aggiorna nome squadra
      await updateSquadraPartial(richiesta.squadra_id, {
        nome: dati.nuovo_nome
      });
      // Aggiungi informazioni "dopo" ai dati della richiesta
      const dati_nome = {
        ...dati,
        dopo: {
          nome: dati.nuovo_nome
        }
      };
      
      // Aggiorna i dati della richiesta con le informazioni "dopo"
      const db_nome = getDb();
      await db_nome.query(
        'UPDATE richieste_admin SET dati_richiesta = $1 WHERE id = $2',
        [JSON.stringify(dati_nome), richiesta.id]
      );
      break;

    case 'cambio_logo':
      // Aggiorna logo squadra
      await updateSquadraPartial(richiesta.squadra_id, {
        // logo_url column doesn't exist in PostgreSQL
      });
      // Aggiungi informazioni "dopo" ai dati della richiesta
      const dati_logo = {
        ...dati,
        dopo: {
          // logo_url column doesn't exist in PostgreSQL
        }
      };
      
      // Aggiorna i dati della richiesta con le informazioni "dopo"
      const db_logo = getDb();
      await db_logo.query(
        'UPDATE richieste_admin SET dati_richiesta = $1 WHERE id = $2',
        [JSON.stringify(dati_logo), richiesta.id]
      );
      break;

    default:
      break;
  }
}

// Endpoint per annullare una richiesta admin
router.post('/:id/annulla', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verifica che la richiesta esista e appartenga all'utente
    const richiesta = await getRichiestaById(id);

    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }

    // Verifica che la richiesta appartenga a una squadra dell'utente
    const squadra = await getSquadraById(richiesta.squadra_id);

    if (!squadra || squadra.proprietario_id !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Verifica che la richiesta sia ancora in stato pending
    if (richiesta.stato !== 'pending') {
      return res.status(400).json({ error: 'Solo le richieste in attesa possono essere annullate' });
    }

    // Annulla la richiesta
    await deleteRichiestaAdmin(id);

    res.json({ message: 'Richiesta annullata con successo' });
  } catch (error) {
    console.error('Errore annullamento richiesta:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per annullare una richiesta admin accettata
router.post('/:richiesta_id/annulla', authenticateToken, async (req, res) => {
  try {
    const { richiesta_id } = req.params;
    const user_id = req.user.id;

    const richiesta = await getRichiestaById(richiesta_id);
    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }

    // Verifica che la richiesta sia stata accettata
    if (richiesta.stato !== 'accepted') {
      return res.status(400).json({ error: 'Solo le richieste accettate possono essere annullate' });
    }

    // Verifica che l'utente sia admin della lega
    const squadra = await getSquadraById(richiesta.squadra_id);
    if (!squadra) {
      return res.status(500).json({ error: 'Errore del server' });
    }

    // Ottieni l'admin della lega
    const db = getDb();
    const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [squadra.lega_id]);
    const lega = legaResult.rows[0];
    
    if (!lega) {
      console.error('Errore nel recupero admin lega:', err);
      return res.status(500).json({ error: 'Errore del server' });
    }

    // Verifica che l'utente sia admin della lega
    if (lega.admin_id !== user_id) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Annulla la richiesta e ripristina i dati originali
    await handleCancelledRequest(richiesta);

    // Aggiorna lo stato della richiesta a 'cancelled'
    await updateRichiestaStato(richiesta_id, 'cancelled', 'Richiesta annullata dall\'admin');

    // Crea notifica per il proprietario della squadra
    const notifica_utente = {
      tipo: 'richiesta_admin_annullata',
      messaggio: `La richiesta ${richiesta.tipo_richiesta} è stata annullata dall'admin`,
      utente_id: squadra.proprietario_id,
      lega_id: squadra.lega_id,
      dati_aggiuntivi: {
        richiesta_id: richiesta_id,
        squadra_id: richiesta.squadra_id,
        tipo_richiesta: richiesta.tipo_richiesta,
        stato: 'cancelled'
      }
    };

    try {
      await createNotifica(notifica_utente);
    } catch (err) {
      console.error('Errore creazione notifica utente:', err);
    }

    // Crea notifica per l'admin della lega
    const notifica_admin = {
      tipo: 'richiesta_admin_annullata',
      messaggio: `Hai annullato la richiesta ${richiesta.tipo_richiesta} di ${squadra.nome}`,
      utente_id: lega.admin_id,
      lega_id: squadra.lega_id,
      dati_aggiuntivi: {
        richiesta_id: richiesta_id,
        squadra_id: richiesta.squadra_id,
        squadra_nome: squadra.nome,
        tipo_richiesta: richiesta.tipo_richiesta,
        stato: 'cancelled'
      }
    };

    try {
      await createNotifica(notifica_admin);
    } catch (err) {
      console.error('Errore creazione notifica admin:', err);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Errore annullamento richiesta:', err);
    res.status(500).json({ error: 'Errore nell\'annullamento della richiesta' });
  }
});

// Funzione per gestire l'annullamento delle richieste accettate
async function handleCancelledRequest(richiesta) {
  const dati = JSON.parse(richiesta.dati_richiesta || '{}');

  switch (richiesta.tipo_richiesta) {
    case 'club_level':
      // Ripristina club level e casse societarie originali
      const dati_club = dati.prima || {};
      await updateSquadraPartial(richiesta.squadra_id, {
        club_level: dati_club.club_level || 1,
        casse_societarie: dati_club.casse_societarie || 0
      });
      break;

    case 'trigger':
      // Ripristina casse societarie originali
      const dati_trigger = dati.prima || {};
      await updateSquadraPartial(richiesta.squadra_id, {
        casse_societarie: dati_trigger.casse_societarie || 0
      });
      break;

    case 'cantera':
      // Ripristina i giocatori alla situazione originale
      if (dati.prima && dati.prima.giocatori_cantera) {
        let completed = 0;
        for (const giocatore_id of dati.prima.giocatori_cantera) {
          await updateGiocatore(giocatore_id, {
            cantera: 0,
            costo_attuale: dati.prima.costi_originali[giocatore_id] || 0
          });
          completed++;
          if (completed === dati.prima.giocatori_cantera.length) {
            break; // Exit the loop after all players are restored
          }
        }
      }
      break;

    case 'cambio_nome':
      // Ripristina nome squadra originale
      const dati_nome = dati.prima || {};
      await updateSquadraPartial(richiesta.squadra_id, {
        nome: dati_nome.nome || 'Squadra'
      });
      break;

    case 'cambio_logo':
      // Ripristina logo squadra originale
      const dati_logo = dati.prima || {};
      await updateSquadraPartial(richiesta.squadra_id, {
        // logo_url column doesn't exist in PostgreSQL
      });
      break;

    default:
      break;
  }
}

export default router; 