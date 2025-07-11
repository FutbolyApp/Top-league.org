import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getSquadraById, updateSquadra, deleteSquadra } from '../models/squadra.js';
import { getLegaById } from '../models/lega.js';
import { getGiocatoriBySquadra } from '../models/giocatore.js';
import { getDb } from '../db/postgres.js';
import { getLeagueConfig, filterDataByConfig } from '../utils/leagueConfig.js';

const router = express.Router();

// Unisciti a una squadra specifica tramite ID (crea richiesta)
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const squadra_id = req.params.id;
    const utente_id = req.user.id;
    
    const squadra = await getSquadraById(squadra_id);
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    
    const db = getDb();
    
    // Verifica che l'utente non abbia già una richiesta per questa squadra
    const richiestaEsistente = await db.query(
      'SELECT id FROM richieste_unione_squadra WHERE utente_id = $1 AND squadra_id = $2',
      [utente_id, squadra_id]
    );
    
    if (richiestaEsistente.rows.length > 0) {
      return res.status(400).json({ error: 'Hai già inviato una richiesta per questa squadra' });
    }
    
    // Ottieni l'admin della lega
    const lega = await getLegaById(squadra.lega_id);
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    
    // Inserisci la richiesta
    const richiestaResult = await db.query(`
      INSERT INTO richieste_unione_squadra 
      (utente_id, squadra_id, lega_id, messaggio_richiesta)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [utente_id, squadra_id, squadra.lega_id, req.body.messaggio || 'Richiesta di unione alla squadra']);
    
    const richiestaId = richiestaResult.rows[0].id;
    
    // Crea notifica per l'admin della lega
    await db.query(`
      INSERT INTO notifiche 
      (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
      VALUES ($1, $2, 'richiesta_unione_squadra', $3, $4, NOW())
    `, [squadra.lega_id, lega.admin_id, 'Richiesta Unione Squadra', `Nuova richiesta di unione alla squadra ${squadra.nome} da ${req.user.nome || req.user.username}`]);
    
    console.log('Richiesta di unione squadra creata:', richiestaId);
    res.json({
      success: true,
      richiesta_id: richiestaId,
      message: 'Richiesta inviata con successo. L\'admin della lega riceverà una notifica.'
    });
  } catch (error) {
    console.error('Errore in join squadra:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Unisciti a una squadra (join squadra in una lega)
router.post('/join', requireAuth, async (req, res) => {
  try {
    const { squadra_id } = req.body;
    const utente_id = req.user.id;
    if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
    
    const squadra = await getSquadraById(squadra_id);
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    
    await updateSquadra(squadra_id, { ...squadra, proprietario_id: utente_id, is_orfana: 0 });
    res.json({ success: true, squadra_id });
  } catch (error) {
    console.error('Errore in join squadra:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

// Cambio proprietario squadra (solo admin della lega)
router.post('/change-owner', requireAuth, async (req, res) => {
  try {
    const { squadra_id, nuovo_utente_id } = req.body;
    const richiedente_id = req.user.id;
    if (!squadra_id || !nuovo_utente_id) return res.status(400).json({ error: 'Parametri mancanti' });
    
    const squadra = await getSquadraById(squadra_id);
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    
    const lega = await getLegaById(squadra.lega_id);
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    if (lega.admin_id !== richiedente_id) return res.status(403).json({ error: 'Solo l\'admin della lega può cambiare il proprietario' });
    
    await updateSquadra(squadra_id, { ...squadra, proprietario_id: nuovo_utente_id, is_orfana: 0 });
    res.json({ success: true, squadra_id, nuovo_utente_id });
  } catch (error) {
    console.error('Errore in change owner:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

// Lascia una squadra (torna orfana)
router.post('/leave', requireAuth, async (req, res) => {
  try {
    const { squadra_id } = req.body;
    const utente_id = req.user.id;
    if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
    
    const squadra = await getSquadraById(squadra_id);
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id !== utente_id) return res.status(403).json({ error: 'Non sei il proprietario di questa squadra' });
    
    await updateSquadra(squadra_id, { ...squadra, proprietario_id: null, is_orfana: 1 });
    res.json({ success: true, squadra_id });
  } catch (error) {
    console.error('Errore in leave squadra:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

// Richiedi upgrade club level
router.post('/upgrade-club-level', requireAuth, async (req, res) => {
  try {
    const { squadra_id } = req.body;
    if (!squadra_id) return res.status(400).json({ error: 'ID squadra mancante' });
    
    const squadra = await getSquadraById(squadra_id);
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    
    // Calcolo costo upgrade (es: livello * 100FM)
    const nuovo_livello = (squadra.club_level || 1) + 1;
    if (nuovo_livello > 10) return res.status(400).json({ error: 'Club Level massimo raggiunto' });
    const costo = nuovo_livello * 100;
    if ((squadra.casse_societarie || 0) < costo) return res.status(400).json({ error: 'Fondi insufficienti' });
    
    await updateSquadra(squadra_id, {
      ...squadra,
      club_level: nuovo_livello,
      casse_societarie: squadra.casse_societarie - costo
    });
    
    res.json({ success: true, nuovo_livello, costo });
  } catch (error) {
    console.error('Errore in upgrade club level:', error);
    res.status(500).json({ error: 'Errore aggiornamento', details: error.message });
  }
});

// Ottieni tutte le squadre dell'utente loggato
router.get('/utente', requireAuth, async (req, res) => {
  try {
    const utente_id = req.user.id;
    const db = getDb();
    
    const squadreResult = await db.query(`
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
      WHERE s.proprietario_id = $1
      ORDER BY s.nome
    `, [utente_id]);
    
    // Per ogni squadra, ottieni i giocatori
    const squadreConGiocatori = await Promise.all(squadreResult.rows.map(async (squadra) => {
      const giocatoriResult = await db.query(`
        SELECT g.*, COALESCE(g.qa, g.quotazione_attuale) as quotazione_attuale, g.fvm as fv_mp, g.qi
        FROM giocatori g
        WHERE g.squadra_id = $1
        ORDER BY g.nome
      `, [squadra.id]);
      
      return { ...squadra, giocatori: giocatoriResult.rows || [] };
    }));
    
    res.json({ squadre: squadreConGiocatori });
  } catch (error) {
    console.error('Errore SQL:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni la squadra dell'utente con giocatori
router.get('/my-team', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();
    
    const squadraResult = await db.query(
      `SELECT s.*, l.nome as lega_nome, 
              CASE 
                WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
                ELSE COALESCE(u.nome || ' ' || u.cognome, u.username)
              END as proprietario_nome
       FROM squadre s
       JOIN leghe l ON s.lega_id = l.id
       LEFT JOIN users u ON s.proprietario_id = u.id
       WHERE s.proprietario_id = $1`,
      [userId]
    );
    
    if (squadraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    const squadra = squadraResult.rows[0];
    
    const giocatoriResult = await db.query(
      `SELECT g.*, COALESCE(g.qa, g.quotazione_attuale) as quotazione_attuale, g.fvm as fv_mp, g.qi,
              sp.nome as squadra_prestito_nome
       FROM giocatori g
       LEFT JOIN squadre sp ON g.squadra_prestito_id = sp.id
       WHERE g.squadra_id = $1
       ORDER BY g.nome`,
      [squadra.id]
    );
    
    res.json({ squadra: { ...squadra, giocatori: giocatoriResult.rows || [] } });
  } catch (error) {
    console.error('Errore nel recupero squadra:', error);
    res.status(500).json({ error: 'Errore nel recupero squadra' });
  }
});

// Ottieni la squadra dell'utente per una lega specifica con giocatori
router.get('/my-team/:legaId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const legaId = req.params.legaId;
    const db = getDb();
    
    const squadraResult = await db.query(
      `SELECT s.*, l.nome as lega_nome, 
              CASE 
                WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
                ELSE COALESCE(u.nome || ' ' || u.cognome, u.username)
              END as proprietario_nome
       FROM squadre s
       JOIN leghe l ON s.lega_id = l.id
       LEFT JOIN users u ON s.proprietario_id = u.id
       WHERE s.proprietario_id = $1 AND s.lega_id = $2`,
      [userId, legaId]
    );
    
    if (squadraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squadra non trovata per questa lega' });
    }
    
    const squadra = squadraResult.rows[0];
    
    // Ottieni configurazioni della lega
    const config = await getLeagueConfig(legaId);
    
    const giocatoriResult = await db.query(
      `SELECT g.*, COALESCE(g.qa, g.quotazione_attuale) as quotazione_attuale, g.fvm as fv_mp, g.qi,
              sp.nome as squadra_prestito_nome
       FROM giocatori g
       LEFT JOIN squadre sp ON g.squadra_prestito_id = sp.id
       WHERE g.squadra_id = $1 OR g.squadra_prestito_id = $1
       ORDER BY g.nome`,
      [squadra.id]
    );
    
    const giocatori = giocatoriResult.rows || [];
    
    // Debug: log dei giocatori trovati
    console.log(`Squadra ${squadra.id}: trovati ${giocatori.length} giocatori`);
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
    
    // Filtra i dati in base alle configurazioni
    const squadraFiltrata = filterDataByConfig({ ...squadra, giocatori }, config);
    
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
  } catch (error) {
    console.error('Errore nel recupero squadra per lega:', error);
    res.status(500).json({ error: 'Errore nel recupero squadra' });
  }
});

// Ottieni dettagli squadra e giocatori
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const db = getDb();
    
    // Query per ottenere squadra con informazioni del proprietario
    const squadraResult = await db.query(`
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
      WHERE s.id = $1
    `, [id]);
    
    if (squadraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    const squadra = squadraResult.rows[0];
    const giocatori = await getGiocatoriBySquadra(id);
    
    res.json({ squadra: { ...squadra, giocatori } });
  } catch (error) {
    console.error('Errore nel recupero dettagli squadra:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni dati originali delle squadre per confronto modifiche
router.post('/original-data', requireAuth, async (req, res) => {
  try {
    const { squadraIds } = req.body;
    
    if (!squadraIds || !Array.isArray(squadraIds)) {
      return res.status(400).json({ error: 'Array di ID squadre richiesto' });
    }
    
    const placeholders = squadraIds.map(() => '?').join(',');
    const db = getDb();
    
    const squadreResult = await db.query(`
      SELECT id, nome, casse_societarie, club_level, proprietario_id, proprietario_username
      FROM squadre 
      WHERE id IN (${placeholders})
    `, squadraIds);
    
    // Converti in oggetto con ID come chiave
    const squadreMap = {};
    squadreResult.rows.forEach(squadra => {
      squadreMap[squadra.id] = squadra;
    });
    
    res.json({ squadre: squadreMap });
  } catch (error) {
    console.error('Errore recupero dati originali squadre:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni più squadre per ID (batch)
router.post('/batch', requireAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Nessun ID fornito' });
    const placeholders = ids.map(() => '?').join(',');
    const db = getDb();
    
    const squadreResult = await db.query(`
      SELECT s.*, 
             u.username as proprietario_username,
             u.nome as proprietario_nome,
             u.cognome as proprietario_cognome
      FROM squadre s
      LEFT JOIN users u ON s.proprietario_id = u.id
      WHERE s.id IN (${placeholders})
    `, ids);
    
    res.json({ squadre: squadreResult.rows });
  } catch (error) {
    console.error('Errore DB', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni tutte le squadre di una lega
router.get('/lega/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const db = getDb();
    
    const squadreResult = await db.query(`
      SELECT s.*, 
             u.username as proprietario_username,
             u.nome as proprietario_nome,
             u.cognome as proprietario_cognome,
             COUNT(g.id) as num_giocatori
      FROM squadre s
      LEFT JOIN users u ON s.proprietario_id = u.id
      LEFT JOIN giocatori g ON s.id = g.squadra_id
      WHERE s.lega_id = $1
      GROUP BY s.id
      ORDER BY s.nome
    `, [legaId]);
    
    res.json({ squadre: squadreResult.rows });
  } catch (error) {
    console.error('Errore DB', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Aggiorna squadra (solo trinità: superadmin, admin della lega, subadmin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
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
        const squadra = await getSquadraById(squadraId);
        
        if (!squadra) return false;
        
        const lega = await getLegaById(squadra.lega_id);
        
        return lega && lega.admin_id === utenteId;
      }
      
      return false;
    };

    const hasPermission = await canEdit();

    if (!hasPermission) {
      return res.status(403).json({ error: 'Non hai i permessi per modificare questa squadra' });
    }
    
    // Aggiorna la squadra
    await updateSquadra(squadraId, updateData);
    res.json({ success: true, message: 'Squadra aggiornata con successo' });
  } catch (error) {
    console.error('Errore in update squadra:', error);
    res.status(500).json({ error: 'Errore aggiornamento squadra', details: error.message });
  }
});

// Aggiungi la nuova route per la cancellazione di una squadra
router.delete('/:id', requireAuth, async (req, res) => {
  try {
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
        const squadra = await getSquadraById(squadraId);
        
        if (!squadra) return false;
        
        const lega = await getLegaById(squadra.lega_id);
        
        return lega && lega.admin_id === utenteId;
      }
      
      return false;
    };

    const hasPermission = await canDelete();

    if (!hasPermission) {
      return res.status(403).json({ error: 'Non hai i permessi per cancellare questa squadra' });
    }
    
    // Cancella la squadra
    await deleteSquadra(squadraId);
    res.json({ success: true, message: 'Squadra cancellata con successo' });
  } catch (error) {
    console.error('Errore in delete squadra:', error);
    res.status(500).json({ error: 'Errore cancellazione squadra', details: error.message });
  }
});

// Assegna squadra direttamente (solo per admin della lega)
router.post('/:id/assign', requireAuth, async (req, res) => {
  try {
    const squadra_id = req.params.id;
    const utente_id = req.user.id;
    
    const squadra = await getSquadraById(squadra_id);
    if (!squadra) return res.status(404).json({ error: 'Squadra non trovata' });
    if (squadra.proprietario_id) return res.status(400).json({ error: 'Squadra già assegnata' });
    
    // Verifica che l'utente sia admin della lega
    const lega = await getLegaById(squadra.lega_id);
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    if (lega.admin_id !== utente_id) return res.status(403).json({ error: 'Solo l\'admin della lega può assegnare squadre direttamente' });
    
    await updateSquadra(squadra_id, { ...squadra, proprietario_id: utente_id, is_orfana: 0 });
    res.json({ success: true, squadra_id, message: 'Squadra assegnata con successo' });
  } catch (error) {
    console.error('Errore in assign squadra:', error);
    res.status(500).json({ error: 'Errore assegnazione squadra', details: error.message });
  }
});

// Ottieni richieste di unione squadra per una lega (solo admin)
router.get('/richieste-unione/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const adminId = req.user.id;
    
    // Verifica che l'utente sia admin della lega
    const lega = await getLegaById(legaId);
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    if (lega.admin_id !== adminId) return res.status(403).json({ error: 'Non autorizzato' });
    
    const db = getDb();
    const richiesteResult = await db.query(`
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
      WHERE rus.lega_id = $1
      ORDER BY rus.data_richiesta DESC
    `, [legaId]);
    
    res.json({ richieste: richiesteResult.rows });
  } catch (error) {
    console.error('Errore in get richieste unione:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Rispondi a una richiesta di unione squadra (accetta/rifiuta)
router.post('/richieste-unione/:richiestaId/rispondi', requireAuth, async (req, res) => {
  try {
    const richiestaId = req.params.richiestaId;
    const { risposta, messaggio } = req.body; // risposta: 'accetta' o 'rifiuta'
    const adminId = req.user.id;
    
    if (!risposta || !['accetta', 'rifiuta'].includes(risposta)) {
      return res.status(400).json({ error: 'Risposta non valida' });
    }
    
    const db = getDb();
    // Verifica che la richiesta esista e che l'utente sia admin della lega
    const richiesta = await db.query(
      `SELECT rus.*, s.nome as squadra_nome, l.nome as lega_nome, l.admin_id
       FROM richieste_unione_squadra rus
       JOIN squadre s ON rus.squadra_id = s.id
       JOIN leghe l ON rus.lega_id = l.id
       WHERE rus.id = $1 AND rus.stato = 'in_attesa'
    `, [richiestaId]);
    
    if (richiesta.rows.length === 0) {
      return res.status(404).json({ error: 'Richiesta non trovata o già processata' });
    }
    
    if (richiesta.rows[0].admin_id !== adminId) {
      return res.status(403).json({ error: 'Non autorizzato a rispondere a questa richiesta' });
    }
    
    const nuovoStato = risposta === 'accetta' ? 'accettata' : 'rifiutata';
    const dataRisposta = new Date().toISOString();
    
    // Aggiorna la richiesta
    await db.query(`
      UPDATE richieste_unione_squadra 
      SET stato = $1, data_risposta = $2, risposta_admin_id = $3, messaggio_risposta = $4
      WHERE id = $5
    `, [nuovoStato, dataRisposta, adminId, messaggio || null, richiestaId]);
    
    if (risposta === 'accetta') {
      // Assegna la squadra all'utente
      await updateSquadra(richiesta.rows[0].squadra_id, { 
        proprietario_id: richiesta.rows[0].utente_id, 
        is_orfana: 0 
      });
      
      // Crea notifica per l'utente
      const titoloNotifica = 'Richiesta accettata! 🎉';
      const messaggioNotifica = `La tua richiesta per la squadra ${richiesta.rows[0].squadra_nome} nella lega ${richiesta.rows[0].lega_nome} è stata accettata!`;
      
      await db.query(`
        INSERT INTO notifiche 
        (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
        VALUES ($1, $2, 'risposta_richiesta_unione', $3, $4, NOW())
      `, [richiesta.rows[0].lega_id, richiesta.rows[0].utente_id, titoloNotifica, messaggioNotifica]);
    } else {
      // Crea notifica per l'utente (rifiuto)
      const titoloNotifica = 'Richiesta rifiutata';
      const messaggioNotifica = `La tua richiesta per la squadra ${richiesta.rows[0].squadra_nome} nella lega ${richiesta.rows[0].lega_nome} è stata rifiutata.`;
      
      await db.query(`
        INSERT INTO notifiche 
        (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
        VALUES ($1, $2, 'risposta_richiesta_unione', $3, $4, NOW())
      `, [richiesta.rows[0].lega_id, richiesta.rows[0].utente_id, titoloNotifica, messaggioNotifica]);
    }
    
    res.json({
      success: true,
      message: `Richiesta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo.`
    });
  } catch (error) {
    console.error('Errore in rispondere richiesta unione:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Cancella una richiesta di unione squadra (solo utente che l'ha creata)
router.delete('/richieste-unione/:richiestaId', requireAuth, async (req, res) => {
  try {
    const richiestaId = req.params.richiestaId;
    const userId = req.user.id;
    const db = getDb();
    
    await db.query(
      `DELETE FROM richieste_unione_squadra 
      WHERE id = $1 AND utente_id = $2 AND stato = 'in_attesa'`,
      [richiestaId, userId]
    );
    
    res.json({ success: true, message: 'Richiesta cancellata con successo.' });
  } catch (error) {
    console.error('Errore in delete richiesta unione:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Concludi prestito di un giocatore
router.post('/end-loan/:giocatoreId', requireAuth, async (req, res) => {
  try {
    const giocatoreId = req.params.giocatoreId;
    const utenteId = req.user.id;
    const db = getDb();
    
    // Verifica che il giocatore esista e sia in prestito
    const giocatore = await db.query(
      `SELECT g.*, s.nome as squadra_nome, s.proprietario_id as squadra_proprietario_id,
             s_prestito.nome as squadra_prestito_nome, s_prestito.id as squadra_prestito_id
      FROM giocatori g
      JOIN squadre s ON g.squadra_id = s.id
      JOIN squadre s_prestito ON g.squadra_prestito_id = s_prestito.id
      WHERE g.id = $1 AND g.squadra_prestito_id IS NOT NULL
    `, [giocatoreId]);
    
    if (giocatore.rows.length === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato o non in prestito' });
    }
    
    // Verifica che l'utente sia il proprietario della squadra che ha il giocatore in prestito
    if (giocatore.rows[0].squadra_proprietario_id !== utenteId) {
      return res.status(403).json({ error: 'Non sei il proprietario della squadra che ha questo giocatore in prestito' });
    }
    
    // Conta quanti giocatori ha la squadra di appartenenza
    const result = await db.query(
      `SELECT COUNT(*) as num_giocatori
      FROM giocatori
      WHERE squadra_id = $1 AND squadra_prestito_id IS NULL
    `, [giocatore.rows[0].squadra_prestito_id]);
    
    const numGiocatori = result.rows[0].num_giocatori;
    const maxGiocatori = 25; // Assumiamo un massimo di 25 giocatori per squadra
    
    // Determina il roster di destinazione
    let nuovoRoster = 'A';
    if (numGiocatori >= maxGiocatori) {
      nuovoRoster = 'B';
    }
    
    // Aggiorna il giocatore: rimuovi il prestito e spostalo nella squadra di appartenenza
    await db.query(`
      UPDATE giocatori 
      SET squadra_id = $1, squadra_prestito_id = NULL, roster = $2
      WHERE id = $3
    `, [giocatore.rows[0].squadra_prestito_id, nuovoRoster, giocatoreId]);
    
    console.log('Prestito concluso per giocatore:', giocatoreId);
    res.json({
      success: true,
      message: `Prestito concluso con successo. Il giocatore è tornato alla squadra di appartenenza${numGiocatori >= maxGiocatori ? ' ed è stato spostato nel Roster B' : ''}.`,
      roster_destinazione: nuovoRoster
    });
  } catch (error) {
    console.error('Errore in end loan:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

export default router; 