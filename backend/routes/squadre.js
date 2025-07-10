import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSquadraById, updateSquadra, deleteSquadra } from '../models/squadra.js';
import { getLegaById } from '../models/lega.js';
import { getGiocatoriBySquadra } from '../models/giocatore.js';
import { getDb } from '../db/config.js';
import { getLeagueConfig, filterDataByConfig } from '../utils/leagueConfig.js';

const router = express.Router();
const db = getDb();

// Unisciti a una squadra specifica tramite ID (crea richiesta)
router.post('/:id/join', requireAuth, (req, res) => {
  const squadra_id = req.params.id;
  const utente_id = req.user.id;
  
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    
    // Verifica che l'utente non abbia già una richiesta per questa squadra
    db.get('SELECT id FROM richieste_unione_squadra WHERE utente_id = ? AND squadra_id = ?', [utente_id, squadra_id], (err2, richiestaEsistente) => {
      if (err2) {
        console.error('Errore verifica richiesta esistente:', err2);
        return res.status(500).json({ error: 'Errore DB', details: err2.message });
      }
      
      if (richiestaEsistente) {
        return res.status(400).json({ error: 'Hai già inviato una richiesta per questa squadra' });
      }
      
      // Ottieni l'admin della lega
      getLegaById(squadra.lega_id, (err3, lega) => {
        if (err3) return res.status(500).json({ error: 'Errore DB', details: err3.message });
        if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
        
        // Inserisci la richiesta
        db.run(`
          INSERT INTO richieste_unione_squadra 
          (utente_id, squadra_id, lega_id, messaggio_richiesta)
          VALUES (?, ?, ?, ?)
        `, [utente_id, squadra_id, squadra.lega_id, req.body.messaggio || 'Richiesta di unione alla squadra'], function(err4) {
          if (err4) {
            console.error('Errore inserimento richiesta:', err4);
            return res.status(500).json({ error: 'Errore DB', details: err4.message });
          }
          
          const richiestaId = this.lastID;
          
          // Crea notifica per l'admin della lega
          db.run(`
            INSERT INTO notifiche 
            (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
            VALUES (?, ?, 'richiesta_unione_squadra', ?, ?, datetime('now'))
          `, [squadra.lega_id, lega.admin_id, 'Richiesta Unione Squadra', `Nuova richiesta di unione alla squadra ${squadra.nome} da ${req.user.nome || req.user.username}`], (err5) => {
            if (err5) {
              console.error('Errore creazione notifica:', err5);
            }
            
            console.log('Richiesta di unione squadra creata:', richiestaId);
            res.json({
              success: true,
              richiesta_id: richiestaId,
              message: 'Richiesta inviata con successo. L\'admin della lega riceverà una notifica.'
            });
          });
        });
      });
    });
  });
});

// Unisciti a una squadra (join squadra in una lega)
router.post('/join', requireAuth, (req, res) => {
  const { squadra_id } = req.body;
  const utente_id = req.user.id;
  if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    updateSquadra(squadra_id, { ...squadra, proprietario_id: utente_id, is_orfana: 0 }, (err2) => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento', details: err2.message });
      res.json({ success: true, squadra_id });
    });
  });
});

// Cambio proprietario squadra (solo admin della lega)
router.post('/change-owner', requireAuth, (req, res) => {
  const { squadra_id, nuovo_utente_id } = req.body;
  const richiedente_id = req.user.id;
  if (!squadra_id || !nuovo_utente_id) return res.status(400).json({ error: 'Parametri mancanti' });
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    getLegaById(squadra.lega_id, (err2, lega) => {
      if (err2) return res.status(500).json({ error: 'Errore DB', details: err2.message });
      if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
      if (lega.admin_id !== richiedente_id) return res.status(403).json({ error: 'Solo l\'admin della lega può cambiare il proprietario' });
      updateSquadra(squadra_id, { ...squadra, proprietario_id: nuovo_utente_id, is_orfana: 0 }, (err3) => {
        if (err3) return res.status(500).json({ error: 'Errore aggiornamento', details: err3.message });
        res.json({ success: true, squadra_id, nuovo_utente_id });
      });
    });
  });
});

// Lascia una squadra (torna orfana)
router.post('/leave', requireAuth, (req, res) => {
  const { squadra_id } = req.body;
  const utente_id = req.user.id;
  if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id !== utente_id) return res.status(403).json({ error: 'Non sei il proprietario di questa squadra' });
    updateSquadra(squadra_id, { ...squadra, proprietario_id: null, is_orfana: 1 }, (err2) => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento', details: err2.message });
      res.json({ success: true, squadra_id });
    });
  });
});

// Richiedi upgrade club level
router.post('/upgrade-club-level', requireAuth, (req, res) => {
  const { squadra_id } = req.body;
  if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    // Calcolo costo upgrade (es: livello * 100FM)
    const nuovo_livello = (squadra.club_level || 1) + 1;
    if (nuovo_livello > 10) return res.status(400).json({ error: 'Club Level massimo raggiunto' });
    const costo = nuovo_livello * 100;
    if ((squadra.casse_societarie || 0) < costo) return res.status(400).json({ error: 'Fondi insufficienti' });
    updateSquadra(squadra_id, {
      ...squadra,
      club_level: nuovo_livello,
      casse_societarie: squadra.casse_societarie - costo
    }, err2 => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento', details: err2.message });
      res.json({ success: true, nuovo_livello, costo });
    });
  });
});

// Ottieni tutte le squadre dell'utente loggato
router.get('/utente', requireAuth, (req, res) => {
  const utente_id = req.user.id;
  db.all(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome 
           END as proprietario_nome,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN ''
             ELSE u.cognome 
           END as proprietario_cognome,
           l.nome as lega_nome,
           l.modalita as lega_modalita,
           l.is_pubblica as lega_is_pubblica,
           l.max_squadre as lega_numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre WHERE lega_id = l.id AND proprietario_id IS NOT NULL) as lega_squadre_assegnate
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    LEFT JOIN leghe l ON s.lega_id = l.id
    WHERE s.proprietario_id = ?
    ORDER BY s.nome
  `, [utente_id], async (err, rows) => {
    if (err) {
      console.error('Errore SQL:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    // Per ogni squadra, ottieni i giocatori
    const squadreConGiocatori = await Promise.all(rows.map(async (squadra) => {
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT g.*, COALESCE(g.qa, g.quotazione_attuale) as quotazione_attuale, g.fvm as fv_mp, g.qi
          FROM giocatori g
          WHERE g.squadra_id = ?
          ORDER BY g.nome
        `, [squadra.id], (err, giocatori) => {
          if (err) {
            reject(err);
          } else {
            resolve({ ...squadra, giocatori: giocatori || [] });
          }
        });
      });
    }));
    
    res.json({ squadre: squadreConGiocatori });
  });
});

// Ottieni la squadra dell'utente con giocatori
router.get('/my-team', requireAuth, (req, res) => {
  const userId = req.user.id;
  db.get(
    `SELECT s.*, l.nome as lega_nome, 
            CASE 
              WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
              ELSE COALESCE(u.nome || ' ' || u.cognome, u.username)
            END as proprietario_nome
     FROM squadre s
     JOIN leghe l ON s.lega_id = l.id
     LEFT JOIN users u ON s.proprietario_id = u.id
     WHERE s.proprietario_id = ?`,
    [userId],
    (err, squadra) => {
      if (err) return res.status(500).json({ error: 'Errore nel recupero squadra' });
      if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });

      db.all(
        `SELECT g.*, COALESCE(g.qa, g.quotazione_attuale) as quotazione_attuale, g.fvm as fv_mp, g.qi,
                sp.nome as squadra_prestito_nome
         FROM giocatori g
         LEFT JOIN squadre sp ON g.squadra_prestito_id = sp.id
         WHERE g.squadra_id = ?
         ORDER BY g.nome`,
        [squadra.id],
        (err, giocatori) => {
          if (err) return res.status(500).json({ error: 'Errore nel recupero giocatori' });
          res.json({ squadra: { ...squadra, giocatori: giocatori || [] } });
        }
      );
    }
  );
});

// Ottieni la squadra dell'utente per una lega specifica con giocatori
router.get('/my-team/:legaId', requireAuth, (req, res) => {
  const userId = req.user.id;
  const legaId = req.params.legaId;
  
  db.get(
    `SELECT s.*, l.nome as lega_nome, 
            CASE 
              WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
              ELSE COALESCE(u.nome || ' ' || u.cognome, u.username)
            END as proprietario_nome
     FROM squadre s
     JOIN leghe l ON s.lega_id = l.id
     LEFT JOIN users u ON s.proprietario_id = u.id
     WHERE s.proprietario_id = ? AND s.lega_id = ?`,
    [userId, legaId],
    async (err, squadra) => {
      if (err) return res.status(500).json({ error: 'Errore nel recupero squadra' });
      if (!squadra) return res.status(404).json({ error: 'Squadra non trovata per questa lega' });

      try {
        // Ottieni configurazioni della lega
        const config = await getLeagueConfig(legaId);

      db.all(
          `SELECT g.*, COALESCE(g.qa, g.quotazione_attuale) as quotazione_attuale, g.fvm as fv_mp, g.qi,
                  sp.nome as squadra_prestito_nome
         FROM giocatori g
           LEFT JOIN squadre sp ON g.squadra_prestito_id = sp.id
         WHERE g.squadra_id = ? OR g.squadra_prestito_id = ?
         ORDER BY g.nome`,
        [squadra.id, squadra.id],
        (err, giocatori) => {
          if (err) return res.status(500).json({ error: 'Errore nel recupero giocatori' });
          
          // Debug: log dei giocatori trovati
          console.log(`Squadra ${squadra.id}: trovati ${giocatori?.length || 0} giocatori`);
          if (giocatori) {
            giocatori.forEach(g => {
              if (g.nome && g.nome.includes('Bellanova')) {
                console.log('Bellanova trovato:', {
                  id: g.id,
                  nome: g.nome,
                  squadra_id: g.squadra_id,
                  squadra_prestito_id: g.squadra_prestito_id,
                  squadra_prestito_nome: g.squadra_prestito_nome
                });
              }
            });
          }
            
            // Filtra i dati in base alle configurazioni
            const squadraFiltrata = filterDataByConfig({ ...squadra, giocatori: giocatori || [] }, config);
            
            res.json({ 
              squadra: squadraFiltrata,
              config: {
                roster_ab: config.roster_ab === 1,
                cantera: config.cantera === 1,
                contratti: config.contratti === 1,
                triggers: config.triggers === 1,
                is_classic: config.modalita === 'Classic Serie A' || config.modalita === 'Classic Euroleghe'
              }
            });
        }
      );
      } catch (error) {
        console.error('Errore nel recupero configurazioni:', error);
        res.status(500).json({ error: 'Errore nel recupero configurazioni' });
      }
    }
  );
});

// Ottieni dettagli squadra e giocatori
router.get('/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  
  // Query per ottenere squadra con informazioni del proprietario
  db.get(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome 
           END as proprietario_nome,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN ''
             ELSE u.cognome 
           END as proprietario_cognome
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    WHERE s.id = ?
  `, [id], (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    
    getGiocatoriBySquadra(id, (err2, giocatori) => {
      if (err2) return res.status(500).json({ error: 'Errore DB', details: err2.message });
      res.json({ squadra: { ...squadra, giocatori } });
    });
  });
});

// Ottieni dati originali delle squadre per confronto modifiche
router.post('/original-data', requireAuth, (req, res) => {
  const { squadraIds } = req.body;
  
  if (!squadraIds || !Array.isArray(squadraIds)) {
    return res.status(400).json({ error: 'Array di ID squadre richiesto' });
  }
  
  const placeholders = squadraIds.map(() => '?').join(',');
  
  db.all(`
    SELECT id, nome, casse_societarie, club_level, proprietario_id, proprietario_username
    FROM squadre 
    WHERE id IN (${placeholders})
  `, squadraIds, (err, squadre) => {
    if (err) {
      console.error('Errore recupero dati originali squadre:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    // Converti in oggetto con ID come chiave
    const squadreMap = {};
    squadre.forEach(squadra => {
      squadreMap[squadra.id] = squadra;
    });
    
    res.json({ squadre: squadreMap });
  });
});

// Ottieni più squadre per ID (batch)
router.post('/batch', requireAuth, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Nessun ID fornito' });
  const placeholders = ids.map(() => '?').join(',');
  db.all(`
    SELECT s.*, 
           u.username as proprietario_username,
           u.nome as proprietario_nome,
           u.cognome as proprietario_cognome
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    WHERE s.id IN (${placeholders})
  `, ids, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ squadre: rows });
  });
});

// Ottieni tutte le squadre di una lega
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  db.all(`
    SELECT s.*, 
           u.username as proprietario_username,
           u.nome as proprietario_nome,
           u.cognome as proprietario_cognome,
           COUNT(g.id) as num_giocatori
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    LEFT JOIN giocatori g ON s.id = g.squadra_id
    WHERE s.lega_id = ?
    GROUP BY s.id
    ORDER BY s.nome
  `, [legaId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ squadre: rows });
  });
});

// Aggiorna squadra (solo trinità: superadmin, admin della lega, subadmin)
router.put('/:id', requireAuth, (req, res) => {
  const squadraId = req.params.id;
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;
  const updateData = req.body;

  // Verifica permessi
  const canEdit = async () => {
    // Superadmin può modificare tutto
    if (userRole === 'superadmin') return true;
    
    // Subadmin può modificare
    if (userRole === 'subadmin') return true;
    
    // Admin può modificare solo le squadre della sua lega
    if (userRole === 'admin') {
      const squadra = await new Promise((resolve, reject) => {
        getSquadraById(squadraId, (err, squadra) => {
          if (err) reject(err);
          else resolve(squadra);
        });
      });
      
      if (!squadra) return false;
      
      const lega = await new Promise((resolve, reject) => {
        getLegaById(squadra.lega_id, (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });
      
      return lega && lega.admin_id === utenteId;
    }
    
    return false;
  };

  canEdit()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Non hai i permessi per modificare questa squadra' });
      }
      
      // Aggiorna la squadra
      updateSquadra(squadraId, updateData, (err) => {
        if (err) return res.status(500).json({ error: 'Errore aggiornamento squadra', details: err.message });
        res.json({ success: true, message: 'Squadra aggiornata con successo' });
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore verifica permessi', details: err.message });
    });
});

// Aggiungi la nuova route per la cancellazione di una squadra
router.delete('/:id', requireAuth, (req, res) => {
  const squadraId = req.params.id;
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;

  // Verifica permessi
  const canDelete = async () => {
    // Superadmin può cancellare tutto
    if (userRole === 'superadmin') return true;
    
    // Subadmin può cancellare
    if (userRole === 'subadmin') return true;
    
    // Admin può cancellare solo le squadre della sua lega
    if (userRole === 'admin') {
      const squadra = await new Promise((resolve, reject) => {
        getSquadraById(squadraId, (err, squadra) => {
          if (err) reject(err);
          else resolve(squadra);
        });
      });
      
      if (!squadra) return false;
      
      const lega = await new Promise((resolve, reject) => {
        getLegaById(squadra.lega_id, (err, lega) => {
          if (err) reject(err);
          else resolve(lega);
        });
      });
      
      return lega && lega.admin_id === utenteId;
    }
    
    return false;
  };

  canDelete()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Non hai i permessi per cancellare questa squadra' });
      }
      
      // Cancella la squadra
      deleteSquadra(squadraId, (err) => {
        if (err) return res.status(500).json({ error: 'Errore cancellazione squadra', details: err.message });
        res.json({ success: true, message: 'Squadra cancellata con successo' });
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore verifica permessi', details: err.message });
    });
});

// Assegna squadra direttamente (solo per admin della lega)
router.post('/:id/assign', requireAuth, (req, res) => {
  const squadra_id = req.params.id;
  const utente_id = req.user.id;
  
  getSquadraById(squadra_id, (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    
    // Verifica che l'utente sia admin della lega
    getLegaById(squadra.lega_id, (err2, lega) => {
      if (err2) return res.status(500).json({ error: 'Errore DB', details: err2.message });
      if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
      if (lega.admin_id !== utente_id) return res.status(403).json({ error: 'Solo l\'admin della lega può assegnare squadre direttamente' });
      
      updateSquadra(squadra_id, { ...squadra, proprietario_id: utente_id, is_orfana: 0 }, (err3) => {
        if (err3) return res.status(500).json({ error: 'Errore aggiornamento', details: err3.message });
        res.json({ success: true, squadra_id, message: 'Squadra assegnata con successo' });
      });
    });
  });
});

// Ottieni richieste di unione squadra per una lega (solo admin)
router.get('/richieste-unione/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const adminId = req.user.id;
  
  // Verifica che l'utente sia admin della lega
  getLegaById(legaId, (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    if (lega.admin_id !== adminId) return res.status(403).json({ error: 'Non autorizzato' });
    
    db.all(`
      SELECT rus.*, 
             u.username as utente_username,
             u.nome as utente_nome,
             u.cognome as utente_cognome,
             s.nome as squadra_nome,
             l.nome as lega_nome
      FROM richieste_unione_squadra rus
      JOIN users u ON rus.utente_id = u.id
      JOIN squadre s ON rus.squadra_id = s.id
      JOIN leghe l ON rus.lega_id = l.id
      WHERE rus.lega_id = ?
      ORDER BY rus.data_richiesta DESC
    `, [legaId], (err2, richieste) => {
      if (err2) return res.status(500).json({ error: 'Errore DB', details: err2.message });
      res.json({ richieste });
    });
  });
});

// Rispondi a una richiesta di unione squadra (accetta/rifiuta)
router.post('/richieste-unione/:richiestaId/rispondi', requireAuth, (req, res) => {
  const richiestaId = req.params.richiestaId;
  const { risposta, messaggio } = req.body; // risposta: 'accetta' o 'rifiuta'
  const adminId = req.user.id;
  
  if (!risposta || !['accetta', 'rifiuta'].includes(risposta)) {
    return res.status(400).json({ error: 'Risposta non valida' });
  }
  
  // Verifica che la richiesta esista e che l'utente sia admin della lega
  db.get(`
    SELECT rus.*, s.nome as squadra_nome, l.nome as lega_nome, l.admin_id
    FROM richieste_unione_squadra rus
    JOIN squadre s ON rus.squadra_id = s.id
    JOIN leghe l ON rus.lega_id = l.id
    WHERE rus.id = ? AND rus.stato = 'in_attesa'
  `, [richiestaId], (err, richiesta) => {
    if (err) {
      console.error('Errore query richiesta:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata o già processata' });
    }
    
    if (richiesta.admin_id !== adminId) {
      return res.status(403).json({ error: 'Non autorizzato a rispondere a questa richiesta' });
    }
    
    const nuovoStato = risposta === 'accetta' ? 'accettata' : 'rifiutata';
    const dataRisposta = new Date().toISOString();
    
    // Aggiorna la richiesta
    db.run(`
      UPDATE richieste_unione_squadra 
      SET stato = ?, data_risposta = ?, risposta_admin_id = ?, messaggio_risposta = ?
      WHERE id = ?
    `, [nuovoStato, dataRisposta, adminId, messaggio || null, richiestaId], (err2) => {
      if (err2) {
        console.error('Errore aggiornamento richiesta:', err2);
        return res.status(500).json({ error: 'Errore DB', details: err2.message });
      }
      
      if (risposta === 'accetta') {
        // Assegna la squadra all'utente
        updateSquadra(richiesta.squadra_id, { 
          proprietario_id: richiesta.utente_id, 
          is_orfana: 0 
        }, (err3) => {
          if (err3) {
            console.error('Errore assegnazione squadra:', err3);
            return res.status(500).json({ error: 'Errore assegnazione squadra', details: err3.message });
          }
          
          // Crea notifica per l'utente
          const titoloNotifica = 'Richiesta accettata! 🎉';
          const messaggioNotifica = `La tua richiesta per la squadra ${richiesta.squadra_nome} nella lega ${richiesta.lega_nome} è stata accettata!`;
          
          db.run(`
            INSERT INTO notifiche 
            (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
            VALUES (?, ?, 'risposta_richiesta_unione', ?, ?, datetime('now'))
          `, [richiesta.lega_id, richiesta.utente_id, titoloNotifica, messaggioNotifica], (err4) => {
            if (err4) console.error('Errore creazione notifica:', err4);
            
            console.log('Risposta alla richiesta processata:', richiestaId);
            res.json({
              success: true,
              message: `Richiesta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo.`
            });
          });
        });
      } else {
        // Crea notifica per l'utente (rifiuto)
        const titoloNotifica = 'Richiesta rifiutata';
        const messaggioNotifica = `La tua richiesta per la squadra ${richiesta.squadra_nome} nella lega ${richiesta.lega_nome} è stata rifiutata.`;
        
        db.run(`
          INSERT INTO notifiche 
          (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
          VALUES (?, ?, 'risposta_richiesta_unione', ?, ?, datetime('now'))
        `, [richiesta.lega_id, richiesta.utente_id, titoloNotifica, messaggioNotifica], (err4) => {
          if (err4) console.error('Errore creazione notifica:', err4);
          
          console.log('Risposta alla richiesta processata:', richiestaId);
          res.json({
            success: true,
            message: `Richiesta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo.`
          });
        });
      }
    });
  });
});

// Cancella una richiesta di unione squadra (solo utente che l'ha creata)
router.delete('/richieste-unione/:richiestaId', requireAuth, (req, res) => {
  const richiestaId = req.params.richiestaId;
  const userId = req.user.id;
  
  db.run(`
    DELETE FROM richieste_unione_squadra 
    WHERE id = ? AND utente_id = ? AND stato = 'in_attesa'
  `, [richiestaId, userId], function(err) {
    if (err) {
      console.error('Errore cancellazione richiesta:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Richiesta non trovata o non cancellabile' });
    }
    
    res.json({ success: true, message: 'Richiesta cancellata con successo.' });
  });
});

// Concludi prestito di un giocatore
router.post('/end-loan/:giocatoreId', requireAuth, (req, res) => {
  const giocatoreId = req.params.giocatoreId;
  const utenteId = req.user.id;
  
  // Verifica che il giocatore esista e sia in prestito
  db.get(`
    SELECT g.*, s.nome as squadra_nome, s.proprietario_id as squadra_proprietario_id,
           s_prestito.nome as squadra_prestito_nome, s_prestito.id as squadra_prestito_id
    FROM giocatori g
    JOIN squadre s ON g.squadra_id = s.id
    JOIN squadre s_prestito ON g.squadra_prestito_id = s_prestito.id
    WHERE g.id = ? AND g.squadra_prestito_id IS NOT NULL
  `, [giocatoreId], (err, giocatore) => {
    if (err) {
      console.error('Errore query giocatore:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    
    if (!giocatore) {
      return res.status(404).json({ error: 'Giocatore non trovato o non in prestito' });
    }
    
    // Verifica che l'utente sia il proprietario della squadra che ha il giocatore in prestito
    if (giocatore.squadra_proprietario_id !== utenteId) {
      return res.status(403).json({ error: 'Non sei il proprietario della squadra che ha questo giocatore in prestito' });
    }
    
    // Conta quanti giocatori ha la squadra di appartenenza
    db.get(`
      SELECT COUNT(*) as num_giocatori
      FROM giocatori
      WHERE squadra_id = ? AND squadra_prestito_id IS NULL
    `, [giocatore.squadra_prestito_id], (err2, result) => {
      if (err2) {
        console.error('Errore conteggio giocatori:', err2);
        return res.status(500).json({ error: 'Errore DB', details: err2.message });
      }
      
      const numGiocatori = result.num_giocatori;
      const maxGiocatori = 25; // Assumiamo un massimo di 25 giocatori per squadra
      
      // Determina il roster di destinazione
      let nuovoRoster = 'A';
      if (numGiocatori >= maxGiocatori) {
        nuovoRoster = 'B';
      }
      
      // Aggiorna il giocatore: rimuovi il prestito e spostalo nella squadra di appartenenza
      db.run(`
        UPDATE giocatori 
        SET squadra_id = ?, squadra_prestito_id = NULL, roster = ?
        WHERE id = ?
      `, [giocatore.squadra_prestito_id, nuovoRoster, giocatoreId], (err3) => {
        if (err3) {
          console.error('Errore aggiornamento giocatore:', err3);
          return res.status(500).json({ error: 'Errore DB', details: err3.message });
        }
        
        console.log('Prestito concluso per giocatore:', giocatoreId);
        res.json({
          success: true,
          message: `Prestito concluso con successo. Il giocatore è tornato alla squadra di appartenenza${numGiocatori >= maxGiocatori ? ' ed è stato spostato nel Roster B' : ''}.`,
          roster_destinazione: nuovoRoster
        });
      });
    });
  });
});

export default router; 