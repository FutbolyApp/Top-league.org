import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getGiocatoreById, updateGiocatore, updateGiocatorePartial, createGiocatore, deleteGiocatore } from '../models/giocatore.js';
import { getLegaById } from '../models/lega.js';
import { getDb } from '../db/postgres.js';

const router = express.Router();

// Ottieni i dettagli di un giocatore
router.get('/:giocatoreId', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    
    const giocatoreId = req.params.giocatoreId;
    const result = await db.query(`
      SELECT g.*, 
             g.quotazione_attuale,
             s.nome as squadra_nome,
             l.nome as lega_nome,
             CASE 
               WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
               ELSE u.nome 
             END as proprietario_nome
      FROM giocatori g 
      LEFT JOIN squadre s ON g.squadra_id = s.id
      LEFT JOIN leghe l ON s.lega_id = l.id
      LEFT JOIN users u ON s.proprietario_id = u.id
      WHERE g.id = $1
    `, [giocatoreId]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Giocatore non trovato' });
    res.json({ giocatore: result.rows[0] });
  } catch (err) {
    console.error('Errore DB:', err);
    res.status(500).json({ error: 'Errore DB', details: err.message });
  }
});

// Ottieni giocatori di una squadra
router.get('/squadra/:squadraId', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    
    const squadraId = req.params.squadraId;
    const result = await db.query(`
      SELECT g.*, 
             g.quotazione_attuale,
             sp.nome as squadra_prestito_nome
      FROM giocatori g 
      LEFT JOIN squadre sp ON g.squadra_prestito_id = sp.id
      WHERE g.squadra_id = $1
    `, [squadraId]);
    res.json({ giocatori: result.rows });
  } catch (err) {
    console.error('Errore DB:', err);
    res.status(500).json({ error: 'Errore DB', details: err.message });
  }
});

// Rinnovo contratto per uno o più giocatori
router.post('/rinnovo-contratto', requireAuth, (req, res) => {
  const { rinnovi } = req.body; // [{ giocatore_id, anni_contratto, nuovo_salario }]
  if (!Array.isArray(rinnovi) || rinnovi.length === 0) return res.status(400).json({ error: 'Nessun rinnovo fornito' });
  let completati = 0;
  let errori = [];
  rinnovi.forEach(r => {
    updateGiocatore(r.giocatore_id, {
      anni_contratto: r.anni_contratto,
      salario: r.nuovo_salario || undefined
    }, err => {
      if (err) errori.push({ giocatore_id: r.giocatore_id, error: err.message });
      completati++;
      if (completati === rinnovi.length) {
        if (errori.length > 0) return res.status(500).json({ error: 'Alcuni rinnovi falliti', dettagli: errori });
        res.json({ success: true });
      }
    });
  });
});

// Aggiorna triggers di un giocatore
router.post('/update-triggers', requireAuth, (req, res) => {
  const { giocatore_id, triggers } = req.body;
  if (!giocatore_id) return res.status(400).json({ error: 'ID giocatore mancante' });
  updateGiocatore(giocatore_id, { triggers: typeof triggers === 'object' ? JSON.stringify(triggers) : triggers }, err => {
    if (err) return res.status(500).json({ error: 'Errore aggiornamento triggers', details: err.message });
    res.json({ success: true });
  });
});

// Ottieni più giocatori per ID (batch)
router.post('/batch', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Nessun ID fornito' });
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const result = await db.query(`
      SELECT *, 
             quotazione_attuale
      FROM giocatori WHERE id IN (${placeholders})
    `, ids);
    res.json({ giocatori: result.rows });
  } catch (err) {
    console.error('Errore DB:', err);
    res.status(500).json({ error: 'Errore DB', details: err.message });
  }
});

// Ottieni tutti i giocatori di una lega
router.get('/lega/:legaId', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    const legaId = req.params.legaId;
    const result = await db.query(`
      SELECT g.*, 
             g.quotazione_attuale,
             sp.nome as squadra_prestito_nome
      FROM giocatori g 
      LEFT JOIN squadre sp ON g.squadra_prestito_id = sp.id
      JOIN squadre s ON g.squadra_id = s.id
      WHERE s.lega_id = $1
    `, [legaId]);
    res.json({ giocatori: result.rows });
  } catch (err) {
    console.error('Errore DB:', err);
    res.status(500).json({ error: 'Errore DB', details: err.message });
  }
});

// Crea nuovo giocatore (solo trinità: superadmin, admin della lega, subadmin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    const utenteId = req.user.id;
    const userRole = req.user.ruolo;
    const giocatoreData = req.body;

    // Verifica permessi
    const canCreate = async () => {
      // Superadmin può creare tutto (gestisce entrambi i casi)
      if (userRole === 'superadmin' || userRole === 'SuperAdmin') return true;
      
      // Subadmin può creare
      if (userRole === 'subadmin') return true;
      
      // Admin può creare solo nella sua lega (gestisce entrambi i casi)
      if (userRole === 'admin' || userRole === 'Admin') {
        const legaResult = await db.query('SELECT admin_id FROM leghe WHERE id = $1', [giocatoreData.lega_id]);
        const lega = legaResult.rows[0];
        return lega && lega.admin_id === utenteId;
      }
      
      return false;
    };

    const hasPermission = await canCreate();
    if (!hasPermission) {
      return res.status(403).json({ error: 'Non hai i permessi per creare giocatori' });
    }
    
    // Validazioni
    if (!giocatoreData.nome || !giocatoreData.ruolo) {
      return res.status(400).json({ error: 'Nome e ruolo sono obbligatori' });
    }
    
    // Crea il giocatore
    const giocatoreId = await createGiocatore(giocatoreData);
    res.json({ success: true, message: 'Giocatore creato con successo', giocatoreId });
  } catch (err) {
    console.error('Errore creazione giocatore:', err);
    res.status(500).json({ error: 'Errore creazione giocatore', details: err.message });
  }
});

// Aggiorna giocatore (solo trinità: superadmin, admin della lega, subadmin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    const giocatoreId = req.params.id;
    const utenteId = req.user.id;
    const userRole = req.user.ruolo;
    const updateData = req.body;

    // Verifica permessi
    const canEdit = async () => {
      console.log('canEdit - userRole:', userRole);
      console.log('canEdit - utenteId:', utenteId);
      console.log('canEdit - giocatoreId:', giocatoreId);
      
      // Superadmin può modificare tutto (gestisce entrambi i casi)
      if (userRole === 'superadmin' || userRole === 'SuperAdmin') {
        console.log('canEdit - Superadmin access granted');
        return true;
      }
      
      // Subadmin può modificare
      if (userRole === 'subadmin') {
        console.log('canEdit - Subadmin access granted');
        return true;
      }
      
      // Admin può modificare solo i giocatori della sua lega (gestisce entrambi i casi)
      if (userRole === 'admin' || userRole === 'Admin') {
        console.log('canEdit - Checking admin permissions for player:', giocatoreId);
        
        const result = await db.query(
          'SELECT s.lega_id, l.admin_id FROM giocatori g JOIN squadre s ON g.squadra_id = s.id LEFT JOIN leghe l ON s.lega_id = l.id WHERE g.id = $1',
          [giocatoreId]
        );
        const giocatore = result.rows[0];
        
        if (!giocatore) {
          console.log('canEdit - Player not found');
          return false;
        }
        
        const hasPermission = giocatore.admin_id === utenteId;
        console.log('canEdit - Admin permission check:', hasPermission);
        return hasPermission;
      }
      
      return false;
    };

    const hasPermission = await canEdit();
    if (!hasPermission) {
      return res.status(403).json({ error: 'Non hai i permessi per modificare questo giocatore' });
    }
    
    // Aggiorna il giocatore
    await updateGiocatore(giocatoreId, updateData);
    res.json({ success: true, message: 'Giocatore aggiornato con successo' });
  } catch (err) {
    console.error('Errore aggiornamento giocatore:', err);
    res.status(500).json({ error: 'Errore aggiornamento giocatore', details: err.message });
  }
});

// Elimina giocatore (solo trinità: superadmin, admin della lega, subadmin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    const giocatoreId = req.params.id;
    const utenteId = req.user.id;
    const userRole = req.user.ruolo;

    // Verifica permessi
    const canDelete = async () => {
      // Superadmin può eliminare tutto (gestisce entrambi i casi)
      if (userRole === 'superadmin' || userRole === 'SuperAdmin') return true;
      
      // Subadmin può eliminare
      if (userRole === 'subadmin') return true;
      
      // Admin può eliminare solo i giocatori della sua lega (gestisce entrambi i casi)
      if (userRole === 'admin' || userRole === 'Admin') {
        const result = await db.query(
          'SELECT s.lega_id, l.admin_id FROM giocatori g JOIN squadre s ON g.squadra_id = s.id LEFT JOIN leghe l ON s.lega_id = l.id WHERE g.id = $1',
          [giocatoreId]
        );
        const giocatore = result.rows[0];
        return giocatore && giocatore.admin_id === utenteId;
      }
      
      return false;
    };

    const hasPermission = await canDelete();
    if (!hasPermission) {
      return res.status(403).json({ error: 'Non hai i permessi per eliminare questo giocatore' });
    }
    
    // Elimina il giocatore
    await deleteGiocatore(giocatoreId);
    res.json({ success: true, message: 'Giocatore eliminato con successo' });
  } catch (err) {
    console.error('Errore eliminazione giocatore:', err);
    res.status(500).json({ error: 'Errore eliminazione giocatore', details: err.message });
  }
});

// Trasferisci giocatore (solo trinità: superadmin, admin della lega, subadmin)
router.post('/:id/transfer', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    const giocatoreId = req.params.id;
    const utenteId = req.user.id;
    const userRole = req.user.ruolo;
    const { squadra_destinazione_id, costo, ingaggio, anni_contratto } = req.body;

    // Validazioni
    if (!squadra_destinazione_id) {
      return res.status(400).json({ error: 'ID squadra destinazione mancante' });
    }

    if (costo === undefined || costo < 0) {
      return res.status(400).json({ error: 'Costo deve essere un numero positivo' });
    }

    if (ingaggio === undefined || ingaggio < 0) {
      return res.status(400).json({ error: 'Ingaggio deve essere un numero positivo' });
    }

    if (anni_contratto === undefined || anni_contratto < 1) {
      return res.status(400).json({ error: 'Durata contratto deve essere almeno 1 anno' });
    }

    // Verifica permessi
    const canTransfer = async () => {
      // Superadmin può trasferire tutto (gestisce entrambi i casi)
      if (userRole === 'superadmin' || userRole === 'SuperAdmin') return true;
      
      // Subadmin può trasferire
      if (userRole === 'subadmin') return true;
      
      // Admin può trasferire solo nella sua lega (gestisce entrambi i casi)
      if (userRole === 'admin' || userRole === 'Admin') {
        const result = await db.query(
          'SELECT s.lega_id, l.admin_id FROM giocatori g JOIN squadre s ON g.squadra_id = s.id LEFT JOIN leghe l ON s.lega_id = l.id WHERE g.id = $1',
          [giocatoreId]
        );
        const giocatore = result.rows[0];
        return giocatore && giocatore.admin_id === utenteId;
      }
      
      return false;
    };

    const hasPermission = await canTransfer();
    if (!hasPermission) {
      return res.status(403).json({ error: 'Non hai i permessi per trasferire questo giocatore' });
    }
    
    // Verifica che la squadra destinazione esista e sia nella stessa lega
    const squadraDestResult = await db.query('SELECT * FROM squadre WHERE id = $1', [squadra_destinazione_id]);
    const squadraDest = squadraDestResult.rows[0];
    if (!squadraDest) {
      return res.status(404).json({ error: 'Squadra destinazione non trovata' });
    }
    
    // Verifica che la squadra destinazione abbia fondi sufficienti
    if (squadraDest.casse_societarie < costo) {
      return res.status(400).json({ error: 'Squadra destinazione non ha fondi sufficienti' });
    }
    
    // Ottieni il giocatore
    const giocatore = await getGiocatoreById(giocatoreId);
    if (!giocatore) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }
    
    // Verifica che le squadre siano nella stessa lega
    if (giocatore.lega_id !== squadraDest.lega_id) {
      return res.status(400).json({ error: 'Le squadre devono essere nella stessa lega' });
    }
    
    // Verifica che la squadra destinazione abbia slot disponibili
    const giocatoriCountResult = await db.query('SELECT COUNT(*) as count FROM giocatori WHERE squadra_id = $1', [squadra_destinazione_id]);
    const currentPlayers = parseInt(giocatoriCountResult.rows[0].count);
    
    const legaResult = await db.query('SELECT max_giocatori FROM leghe WHERE id = $1', [giocatore.lega_id]);
    const lega = legaResult.rows[0];
    
    const maxGiocatori = lega ? lega.max_giocatori : 30;
    
    if (currentPlayers >= maxGiocatori) {
      return res.status(400).json({ 
        error: `Numero massimo di giocatori raggiunto (${maxGiocatori}). Impossibile aggiungere nuovi calciatori.` 
      });
    }
    
    // Esegui il trasferimento in una transazione
    await db.query('BEGIN');
    try {
      // Aggiorna il giocatore
      await db.query(
        'UPDATE giocatori SET squadra_id = $1, costo_attuale = $2, salario = $3, anni_contratto = $4 WHERE id = $5',
        [squadra_destinazione_id, costo, ingaggio, anni_contratto, giocatoreId]
      );
      
      // Sottrai il costo dalle casse della squadra destinazione
      await db.query(
        'UPDATE squadre SET casse_societarie = casse_societarie - $1 WHERE id = $2',
        [costo, squadra_destinazione_id]
      );
      
      await db.query('COMMIT');
      res.json({ 
        success: true, 
        message: 'Giocatore trasferito con successo',
        giocatoreId,
        squadraDestinazioneId: squadra_destinazione_id,
        costo,
        ingaggio,
        anniContratto: anni_contratto
      });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Errore trasferimento giocatore:', err);
    res.status(500).json({ error: 'Errore trasferimento giocatore', details: err.message });
  }
});

// Ottieni cronologia QA di un giocatore
router.get('/:id/qa-history', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }
    const giocatoreId = req.params.id;
    
    const result = await db.query(`
      SELECT qa_value, data_registrazione, fonte 
      FROM qa_history 
      WHERE giocatore_id = $1 
      ORDER BY data_registrazione DESC 
      LIMIT 50
    `, [giocatoreId]);
    
    // Formatta le date per il frontend
    const history = result.rows.map(row => ({
      qa_value: row.qa_value,
      data_registrazione: row.data_registrazione,
      fonte: row.fonte
    }));
    
    res.json({ history });
  } catch (err) {
    console.error('Errore DB:', err);
    res.status(500).json({ error: 'Errore DB', details: err.message });
  }
});

export default router; 