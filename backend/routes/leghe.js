import express from 'express';
import multer from 'multer';
import path from 'path';
import { parseSquadreFromExcel } from '../utils/excelParser.js';
import { createLega, getAllLeghe, getLegaById, updateLega } from '../models/lega.js';
import { createSquadra, getSquadreByLega } from '../models/squadra.js';
import { createGiocatore, getGiocatoriBySquadra } from '../models/giocatore.js';
import { requireAuth, requireSuperAdmin, requireLegaAdminOrSuperAdmin } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';
import { getLeagueConfig } from '../utils/leagueConfig.js';
import fs from 'fs';

const router = express.Router();
const db = getDb();
const upload = multer({ 
  dest: './backend/uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB limit for fields
  }
});

const uploadExcel = upload.single('excel');
const uploadPdf = upload.single('pdf');

// Middleware per gestire CORS preflight per tutte le route
router.use((req, res, next) => {
  const origin = req.headers.origin;
  
  const allowedOrigins = [
    'http://localhost:3000',
    'https://topleaguem-frontend.onrender.com',
    'https://topleague-frontend-new.onrender.com',
    'https://topleaguem.onrender.com',
    'https://topleague-frontend.onrender.com',
    'https://topleague-frontend-new.onrender.com'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Content-Length');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log(`Leghe route: ${req.method} ${req.url} - Origin: ${origin} - Content-Type: ${req.headers['content-type']}`);
  
  if (req.method === 'OPTIONS') {
    console.log('Leghe OPTIONS preflight request');
    res.sendStatus(200);
  } else {
    next();
  }
});

// Crea una lega con upload Excel e popolamento squadre/giocatori
router.post('/create', requireAuth, (req, res, next) => {
  // Gestione completa degli errori multer
  uploadExcel(req, res, (err) => {
    if (err) {
      console.log('Multer error:', err);
      return res.status(400).json({ 
        error: 'File upload error', 
        details: err.message,
        type: 'multer_error'
      });
    }
    
    // Verifica che la richiesta sia valida
    if (!req.body) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        type: 'invalid_request'
      });
    }
    
    console.log('Multer processing completed successfully');
    next();
  });
}, async (req, res) => {
  try {
    console.log('Creazione lega - Headers:', req.headers);
    console.log('Creazione lega - Body:', req.body);
    console.log('Creazione lega - File:', req.file);
    console.log('User ID:', req.user.id);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    
    const {
      nome, modalita, is_pubblica, password, max_squadre, min_giocatori, max_giocatori,
      roster_ab, cantera, contratti, triggers, regolamento_pdf,
      fantacalcio_url, fantacalcio_username, fantacalcio_password, scraping_automatico
    } = req.body;
    
    // Validazione dei dati richiesti
    if (!nome || !modalita) {
      return res.status(400).json({ 
        error: 'Dati mancanti', 
        details: 'Nome e modalità sono obbligatori' 
      });
    }
    
    // Validazione e pulizia dei valori integer
    const cleanData = {
      nome: nome.trim(),
      modalita: modalita.trim(),
      is_pubblica: is_pubblica === 'true' || is_pubblica === true,
      password: password || null,
      max_squadre: max_squadre || '0',
      min_giocatori: min_giocatori || '0',
      max_giocatori: max_giocatori || '0',
      roster_ab: roster_ab === 'true' || roster_ab === true,
      cantera: cantera === 'true' || cantera === true,
      contratti: contratti === 'true' || contratti === true,
      triggers: triggers === 'true' || triggers === true,
      regolamento_pdf: regolamento_pdf || null,
      fantacalcio_url: fantacalcio_url || null,
      fantacalcio_username: fantacalcio_username || null,
      fantacalcio_password: fantacalcio_password || null,
      scraping_automatico: scraping_automatico === 'true' || scraping_automatico === true
    };
    
    if (!req.file) {
      console.log('Errore: File Excel mancante');
      return res.status(400).json({ error: 'File Excel mancante' });
    }

    console.log('File Excel ricevuto:', req.file.originalname, 'Path:', req.file.path);

    // 1. Crea la lega - admin_id è automaticamente l'utente corrente
    try {
      const legaId = await createLega({
        ...cleanData,
        admin_id: req.user.id, // Imposta automaticamente l'admin_id all'utente corrente
        excel_originale: req.file.path,
        excel_modificato: null
      });
      
      console.log('Lega creata con ID:', legaId, 'Admin ID:', req.user.id);
      
      // 2. Parsing Excel con parametri di validazione
      const validationParams = {
        numeroSquadre: parseInt(cleanData.max_squadre) || 0,
        minGiocatori: parseInt(cleanData.min_giocatori) || 0,
        maxGiocatori: parseInt(cleanData.max_giocatori) || 0
      };
      
      console.log('Parametri di validazione per il parser:', validationParams);
      const squadre = parseSquadreFromExcel(req.file.path, validationParams);
      console.log('Squadre parseate:', squadre.length);
      
      // NUOVO: Controlla se il numero di squadre corrisponde a quello atteso
      const expectedTeams = parseInt(cleanData.max_squadre) || 0;
      const foundTeams = squadre.length;
      let warnings = [];
      
      if (expectedTeams > 0 && foundTeams !== expectedTeams) {
        warnings.push(`⚠️ Attenzione: trovate ${foundTeams} squadre, ma ne erano attese ${expectedTeams}`);
      }
      
      // 3. Popola squadre e giocatori
      let squadreInserite = 0;
      let giocatoriInseriti = 0;
      let erroriSquadre = [];
      let erroriGiocatori = [];
      
      for (const sq of squadre) {
        try {
          console.log(`🔄 Creando squadra: ${sq.nome} con ${sq.giocatori?.length || 0} giocatori`);
          
          const squadraId = await createSquadra({
            lega_id: legaId,
            nome: sq.nome,
            casse_societarie: sq.casseSocietarie || 0,
            valore_squadra: sq.valoreRosa || 0,
            is_orfana: 1
          });
          
          console.log('✅ Squadra creata:', sq.nome, 'ID:', squadraId, 'Casse:', sq.casseSocietarie, 'Valore:', sq.valoreRosa);
          
          // Inserisci giocatori
          if (sq.giocatori && sq.giocatori.length > 0) {
            console.log(`🔄 Inserendo ${sq.giocatori.length} giocatori per la squadra ${sq.nome}`);
            for (const g of sq.giocatori) {
              try {
                const giocatoreId = await createGiocatore({
                  lega_id: legaId,
                  squadra_id: squadraId,
                  nome: g.nome,
                  ruolo: g.ruolo,
                  squadra_reale: g.squadra,
                  costo_attuale: g.costo
                });
                console.log(`✅ Giocatore creato: ${g.nome} (ID: ${giocatoreId}) per squadra: ${sq.nome}`);
                giocatoriInseriti++;
              } catch (err) {
                console.error(`❌ Errore creazione giocatore ${g.nome}:`, err.message);
                console.error(`❌ Dati giocatore:`, JSON.stringify(g, null, 2));
                erroriGiocatori.push({
                  squadra: sq.nome,
                  giocatore: g.nome,
                  errore: err.message,
                  dati: g
                });
              }
            }
          } else {
            console.log('⚠️ Nessun giocatore trovato per la squadra:', sq.nome);
          }
          
          squadreInserite++;
        } catch (err) {
          console.error(`❌ Errore creazione squadra ${sq.nome}:`, err.message);
          console.error(`❌ Dati squadra:`, JSON.stringify(sq, null, 2));
          erroriSquadre.push({
            squadra: sq.nome,
            errore: err.message,
            dati: sq
          });
        }
      }
      
      console.log(`📊 Riepilogo inserimento:`);
      console.log(`- Squadre create: ${squadreInserite}/${squadre.length}`);
      console.log(`- Giocatori inseriti: ${giocatoriInseriti}`);
      console.log(`- Errori squadre: ${erroriSquadre.length}`);
      console.log(`- Errori giocatori: ${erroriGiocatori.length}`);
      
      if (erroriSquadre.length > 0) {
        console.error(`❌ Errori creazione squadre:`, erroriSquadre);
      }
      if (erroriGiocatori.length > 0) {
        console.error(`❌ Errori creazione giocatori:`, erroriGiocatori);
      }
      
      return res.json({ 
        success: true, 
        legaId, 
        squadre: squadre.length, 
        squadreInserite,
        giocatoriInseriti,
        erroriSquadre,
        erroriGiocatori,
        warnings 
      });
      
    } catch (parseError) {
      console.log('Errore parsing Excel:', parseError);
      return res.status(500).json({ error: 'Errore parsing file Excel', details: parseError.message });
    }
  } catch (e) {
    console.log('Errore generale:', e);
    
    // Gestione specifica per nome duplicato
    if (e.message === 'Esiste già una lega con questo nome') {
      return res.status(400).json({ 
        error: 'Nome lega duplicato', 
        details: 'Esiste già una lega con questo nome. Scegli un nome diverso.' 
      });
    }
    
    res.status(500).json({ error: 'Errore interno', details: e.message });
  }
});

// Ottieni tutte le leghe (protetto)
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT l.*, 
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome || ' ' || u.cognome 
           END as admin_nome,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = false) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) as squadre_disponibili,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei,
           CASE 
             WHEN (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) > 0 
             THEN true 
             ELSE false 
           END as ha_squadre_disponibili
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      WHERE l.admin_id = $1 OR l.is_pubblica = true
      ORDER BY l.nome
    `, [userId]);
    
    res.json({ leghe: result.rows });
  } catch (err) {
    console.error('Errore query tutte le leghe:', err);
    res.status(500).json({ error: 'Errore DB', details: err.message });
  }
});

// Ottieni solo le leghe a cui l'utente partecipa
router.get('/user-leagues', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  console.log('GET /api/leghe/user-leagues - User ID:', userId);
  
  try {
    const db = getDb();
    console.log('Database connection obtained');
    
    const query = `
      SELECT l.*, 
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome || ' ' || u.cognome 
           END as admin_nome,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = false) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) as squadre_disponibili,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      WHERE l.admin_id = $1
      ORDER BY l.nome
    `;
    
    console.log('Executing query with userId:', userId);
    const result = await db.query(query, [userId]);
    console.log('Query executed successfully, rows found:', result.rows.length);
    
    res.json({ leghe: result.rows });
  } catch (err) {
    console.error('Errore query user-leagues:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Errore DB', details: err.message });
  }
});

// Ottieni leghe amministrate dall'utente (DEVE ESSERE PRIMA DELLE ROUTE CON PARAMETRI)
router.get('/admin', requireAuth, async (req, res) => {
  const adminId = req.user.id;
  console.log('GET /api/leghe/admin - User ID:', adminId);
  
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT l.*, 
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = false) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) as squadre_non_assegnate,
           (SELECT COUNT(*) FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = l.id) as numero_giocatori,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei,
           TO_CHAR(l.created_at, 'DD/MM/YYYY') as data_creazione_formattata
      FROM leghe l
      WHERE l.admin_id = $1
      ORDER BY l.created_at DESC
    `, [adminId]);
    
    console.log('Leghe admin trovate:', result.rows.length);
    res.json({ leghe: result.rows });
  } catch (err) {
    console.error('Errore query admin leghe:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Ottieni tutte le leghe (solo SuperAdmin)
router.get('/all', requireSuperAdmin, async (req, res) => {
  console.log('GET /api/leghe/all - SuperAdmin request');
  
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT l.*, 
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome || ' ' || u.cognome 
           END as admin_nome,
           u.email as admin_email,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.proprietario_id IS NOT NULL) as squadre_con_proprietario,
           (SELECT COUNT(*) FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = l.id) as numero_giocatori,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      ORDER BY l.created_at DESC
    `);
    
    console.log('Tutte le leghe trovate:', result.rows.length);
    res.json({ leghe: result.rows });
  } catch (err) {
    console.error('Errore query tutte le leghe:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Ottieni tutte le squadre e i giocatori di una lega
router.get('/:legaId/squadre', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const squadre = await getSquadreByLega(legaId);
    
    // Processa le informazioni sui tornei per ogni squadra
    for (const squadra of squadre) {
      // Converti le stringhe concatenate in array
      if (squadra.tornei_nomi) {
        squadra.tornei = squadra.tornei_nomi.split(',').map((nome, index) => ({
          id: squadra.tornei_ids ? squadra.tornei_ids.split(',')[index] : null,
          nome: nome.trim()
        }));
      } else {
        squadra.tornei = [];
      }
      
      // Rimuovi i campi concatenati
      delete squadra.tornei_nomi;
      delete squadra.tornei_ids;
      
      // Aggiungi i giocatori per questa squadra
      try {
        const giocatori = await getGiocatoriBySquadra(squadra.id);
        squadra.giocatori = giocatori || [];
      } catch (error) {
        console.log(`⚠️ Error getting players for team ${squadra.id}: ${error.message}`);
        squadra.giocatori = [];
      }
    }
    
    res.json({ squadre });
  } catch (error) {
    console.error('Errore recupero squadre:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Ottieni i dettagli di una singola lega
router.get('/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const lega = await getLegaById(legaId);
    
    if (!lega) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    res.json({ lega });
  } catch (error) {
    console.error('Errore recupero lega:', error);
    res.status(500).json({ error: 'Errore DB', details: error.message });
  }
});

// Upload regolamento PDF per una lega
router.post('/:legaId/upload-regolamento', requireAuth, uploadPdf, (req, res) => {
  const legaId = req.params.legaId;
  if (!req.file) return res.status(400).json({ error: 'File PDF mancante' });
  // Aggiorna il path del PDF nella lega
  getLegaById(legaId, (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    // Elimina il vecchio PDF se esiste
    if (lega.regolamento_pdf && fs.existsSync(lega.regolamento_pdf)) {
      fs.unlinkSync(lega.regolamento_pdf);
    }
    updateLega(legaId, { ...lega, regolamento_pdf: req.file.path }, (err2) => {
      if (err2) return res.status(500).json({ error: 'Errore aggiornamento', details: err2.message });
      res.json({ success: true, path: req.file.path });
    });
  });
});

// Download regolamento PDF
router.get('/:legaId/regolamento', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  getLegaById(legaId, (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!lega || !lega.regolamento_pdf) return res.status(404).json({ error: 'Regolamento non trovato' });
    res.download(lega.regolamento_pdf);
  });
});

// Unisciti a una lega
router.post('/:legaId/join', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const userId = req.user.id;
    
    console.log(`POST /api/leghe/${legaId}/join - User ID: ${userId}`);
    
    // Verifica che la lega esista
    const lega = await getLegaById(legaId);
    if (!lega) {
      console.log('Lega non trovata');
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    console.log('Lega trovata:', { id: lega.id, nome: lega.nome, admin_id: lega.admin_id });
    
    // Verifica che l'utente non sia già admin di questa lega
    if (lega.admin_id === userId) {
      return res.status(400).json({ error: 'Sei già l\'admin di questa lega' });
    }
    
    // Verifica che l'utente non abbia già una squadra in questa lega
    const squadraResult = await db.query('SELECT id FROM squadre WHERE lega_id = $1 AND proprietario_id = $2', [legaId, userId]);
    if (squadraResult.rows.length > 0) {
      return res.status(400).json({ error: 'Hai già una squadra in questa lega' });
    }
    
    // Trova una squadra orfana disponibile
    const squadraOrfanaResult = await db.query('SELECT id, nome FROM squadre WHERE lega_id = $1 AND is_orfana = 1 LIMIT 1', [legaId]);
    if (squadraOrfanaResult.rows.length === 0) {
      return res.status(400).json({ error: 'Nessuna squadra disponibile in questa lega' });
    }
    
    const squadraOrfana = squadraOrfanaResult.rows[0];
    
    // Assegna la squadra orfana all'utente
    await db.query('UPDATE squadre SET proprietario_id = $1, is_orfana = 0 WHERE id = $2', [userId, squadraOrfana.id]);
    
    console.log(`Squadra ${squadraOrfana.nome} assegnata all'utente ${userId}`);
    res.json({ 
      success: true, 
      message: `Unito con successo alla lega ${lega.nome}`,
      squadra: {
        id: squadraOrfana.id,
        nome: squadraOrfana.nome
      }
    });
  } catch (err) {
    console.error('Errore unione lega:', err);
    res.status(500).json({ error: 'Errore interno del server', details: err.message });
  }
});

// Cancella una lega (solo admin della lega o superadmin)
router.delete('/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const userId = req.user.id;
    const db = getDb();
    
    console.log(`DELETE /api/leghe/${legaId} - User ID: ${userId}, Role: ${req.user.ruolo}`);
    
    // Verifica che il database sia disponibile
    if (!db) {
      console.error('Database non disponibile');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    // Verifica che l'utente sia admin della lega o superadmin
    const lega = await getLegaById(legaId);
    if (!lega) {
      console.log('Lega non trovata');
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    console.log('Lega trovata:', { id: lega.id, nome: lega.nome, admin_id: lega.admin_id });
    
    // Verifica autorizzazione
    if (lega.admin_id !== userId && req.user.ruolo !== 'SuperAdmin') {
      console.log('Non autorizzato - admin_id:', lega.admin_id, 'user_id:', userId, 'ruolo:', req.user.ruolo);
      return res.status(403).json({ error: 'Non autorizzato a cancellare questa lega' });
    }
    
    console.log('Autorizzazione OK, inizio transazione');
    
    // Elimina la lega e tutti i dati correlati
    await db.query('BEGIN');
    try {
      console.log('Transazione iniziata, elimino giocatori');
      
      // Elimina giocatori
      await db.query('DELETE FROM giocatori WHERE squadra_id IN (SELECT id FROM squadre WHERE lega_id = $1)', [legaId]);
      console.log('Giocatori eliminati, elimino squadre');
      
      // Elimina squadre
      await db.query('DELETE FROM squadre WHERE lega_id = $1', [legaId]);
      console.log('Squadre eliminate, elimino notifiche');
      
      // Elimina notifiche
      await db.query('DELETE FROM notifiche WHERE lega_id = $1', [legaId]);
      console.log('Notifiche eliminate, elimino offerte');
      
      // Elimina offerte
      await db.query('DELETE FROM offerte WHERE lega_id = $1', [legaId]);
      console.log('Offerte eliminate, elimino log');
      
      // Elimina log (rimuovo questa query perché la tabella log non ha lega_id)
      // await db.query('DELETE FROM log WHERE lega_id = $1', [legaId]);
      console.log('Log eliminati, elimino lega');
      
      // Elimina la lega
      await db.query('DELETE FROM leghe WHERE id = $1', [legaId]);
      console.log('Lega eliminata, faccio commit');
      
      await db.query('COMMIT');
      console.log('Transazione completata con successo');
      res.json({ success: true, message: 'Lega eliminata con successo' });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Errore eliminazione lega:', err);
    res.status(500).json({ error: 'Errore interno del server', details: err.message });
  }
});

// Aggiorna una lega (solo SuperAdmin)
router.put('/:legaId', requireSuperAdmin, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  const updateData = req.body;
  
  console.log(`PUT /api/leghe/${legaId} - SuperAdmin User ID: ${userId}`);
  console.log('Update data:', updateData);
  
  // Verifica che la lega esista
  getLegaById(legaId, (err, lega) => {
    if (err) {
      console.error('Errore nel getLegaById:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    if (!lega) {
      console.log('Lega non trovata');
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    console.log('Lega trovata:', { id: lega.id, nome: lega.nome });
    
    // Validazioni
    if (!updateData.nome || updateData.nome.trim() === '') {
      return res.status(400).json({ error: 'Il nome della lega è obbligatorio' });
    }
    
    if (updateData.max_squadre && updateData.max_squadre < 1) {
      return res.status(400).json({ error: 'Il numero massimo di squadre deve essere almeno 1' });
    }
    
    if (updateData.min_giocatori && updateData.min_giocatori < 1) {
      return res.status(400).json({ error: 'Il numero minimo di giocatori deve essere almeno 1' });
    }
    
    if (updateData.max_giocatori && updateData.min_giocatori && 
        updateData.max_giocatori < updateData.min_giocatori) {
      return res.status(400).json({ error: 'Il numero massimo di giocatori deve essere maggiore o uguale al minimo' });
    }
    
    // Prepara i dati per l'aggiornamento
    const updatedLega = {
      nome: updateData.nome.trim(),
      modalita: updateData.modalita || (lega?.modalita || 'Classic Serie A'),
      is_pubblica: updateData.is_pubblica === 'true' || updateData.is_pubblica === true,
      password: updateData.is_pubblica ? null : (updateData.password || lega.password),
      max_squadre: updateData.max_squadre || lega.max_squadre,
      min_giocatori: updateData.min_giocatori || lega.min_giocatori,
      max_giocatori: updateData.max_giocatori || lega.max_giocatori,
      roster_ab: updateData.roster_ab === 'true' || updateData.roster_ab === true,
      cantera: updateData.cantera === 'true' || updateData.cantera === true,
      contratti: updateData.contratti === 'true' || updateData.contratti === true,
      triggers: updateData.triggers === 'true' || updateData.triggers === true,
      fantacalcio_url: updateData.fantacalcio_url || lega.fantacalcio_url,
      fantacalcio_username: updateData.fantacalcio_username || lega.fantacalcio_username,
      fantacalcio_password: updateData.fantacalcio_password || lega.fantacalcio_password,
      scraping_automatico: updateData.scraping_automatico === 'true' || updateData.scraping_automatico === true
    };
    
    // Aggiorna la lega
    updateLega(legaId, updatedLega, (err) => {
      if (err) {
        console.error('Errore aggiornamento lega:', err);
        
        // Gestione specifica per nome duplicato
        if (err.message === 'Esiste già una lega con questo nome') {
          return res.status(400).json({ 
            error: 'Nome lega duplicato', 
            details: 'Esiste già una lega con questo nome. Scegli un nome diverso.' 
          });
        }
        
        return res.status(500).json({ error: 'Errore aggiornamento lega', details: err.message });
      }
      
      console.log(`Lega ${legaId} aggiornata con successo`);
      res.json({ 
        success: true, 
        message: 'Lega aggiornata con successo',
        lega: { id: legaId, ...updatedLega }
      });
    });
  });
});

// Aggiorna una lega (Admin della lega o SuperAdmin)
router.put('/:legaId/admin', requireLegaAdminOrSuperAdmin, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  const updateData = req.body;
  
  console.log(`PUT /api/leghe/${legaId}/admin - User ID: ${userId}, Ruolo: ${req.user.ruolo}`);
  console.log('Update data:', updateData);
  
  // Verifica che la lega esista
  getLegaById(legaId, (err, lega) => {
    if (err) {
      console.error('Errore nel getLegaById:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    if (!lega) {
      console.log('Lega non trovata');
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    console.log('Lega trovata:', { id: lega.id, nome: lega.nome, admin_id: lega.admin_id });
    
    // Validazioni
    if (!updateData.nome || updateData.nome.trim() === '') {
      return res.status(400).json({ error: 'Il nome della lega è obbligatorio' });
    }
    
    if (updateData.max_squadre && updateData.max_squadre < 1) {
      return res.status(400).json({ error: 'Il numero massimo di squadre deve essere almeno 1' });
    }
    
    if (updateData.min_giocatori && updateData.min_giocatori < 1) {
      return res.status(400).json({ error: 'Il numero minimo di giocatori deve essere almeno 1' });
    }
    
    if (updateData.max_giocatori && updateData.min_giocatori && 
        updateData.max_giocatori < updateData.min_giocatori) {
      return res.status(400).json({ error: 'Il numero massimo di giocatori deve essere maggiore o uguale al minimo' });
    }
    
    // Prepara i dati per l'aggiornamento
    const updatedLega = {
      nome: updateData.nome.trim(),
      modalita: updateData.modalita || (lega?.modalita || 'Classic Serie A'),
      is_pubblica: updateData.is_pubblica === 'true' || updateData.is_pubblica === true,
      password: updateData.is_pubblica ? null : (updateData.password || lega.password),
      max_squadre: updateData.max_squadre || lega.max_squadre,
      min_giocatori: updateData.min_giocatori || lega.min_giocatori,
      max_giocatori: updateData.max_giocatori || lega.max_giocatori,
      roster_ab: updateData.roster_ab === 'true' || updateData.roster_ab === true,
      cantera: updateData.cantera === 'true' || updateData.cantera === true,
      contratti: updateData.contratti === 'true' || updateData.contratti === true,
      triggers: updateData.triggers === 'true' || updateData.triggers === true,
      fantacalcio_url: updateData.fantacalcio_url || lega.fantacalcio_url,
      fantacalcio_username: updateData.fantacalcio_username || lega.fantacalcio_username,
      fantacalcio_password: updateData.fantacalcio_password || lega.fantacalcio_password,
      scraping_automatico: updateData.scraping_automatico === 'true' || updateData.scraping_automatico === true
    };
    
    // Aggiorna la lega
    updateLega(legaId, updatedLega, (err) => {
      if (err) {
        console.error('Errore aggiornamento lega:', err);
        
        // Gestione specifica per nome duplicato
        if (err.message === 'Esiste già una lega con questo nome') {
          return res.status(400).json({ 
            error: 'Nome lega duplicato', 
            details: 'Esiste già una lega con questo nome. Scegli un nome diverso.' 
          });
        }
        
        return res.status(500).json({ error: 'Errore aggiornamento lega', details: err.message });
      }
      
      console.log(`Lega ${legaId} aggiornata con successo da ${req.user.ruolo} ${userId}`);
      res.json({ 
        success: true, 
        message: 'Lega aggiornata con successo',
        lega: { id: legaId, ...updatedLega }
      });
    });
  });
});

// Ottieni squadre disponibili per una lega (per richieste di ingresso)
router.get('/:legaId/squadre-disponibili', requireAuth, async (req, res) => {
  const legaId = req.params.legaId;
  
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT s.id, s.nome, s.is_orfana
      FROM squadre s
      WHERE s.lega_id = $1
      ORDER BY s.nome
    `, [legaId]);
    
    // Filtra solo squadre non assegnate per la richiesta
    const squadreDisponibili = result.rows.filter(s => s.is_orfana === true);
    const squadreAssegnate = result.rows.filter(s => s.is_orfana === false);
    
    res.json({ 
      squadre_disponibili: squadreDisponibili,
      squadre_assegnate: squadreAssegnate,
      totale_squadre: result.rows.length
    });
  } catch (err) {
    console.error('Errore query squadre disponibili:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Invia richiesta di ingresso a una lega
router.post('/:legaId/richiedi-ingresso', requireAuth, async (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  const { squadra_id, password, messaggio } = req.body;
  
  console.log(`POST /api/leghe/${legaId}/richiedi-ingresso - User ID: ${userId}`);
  
  try {
    const db = getDb();
    
    // Verifica che la lega esista
    const legaResult = await db.query('SELECT * FROM leghe WHERE id = $1', [legaId]);
    if (legaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    const lega = legaResult.rows[0];
    
    // Verifica che l'utente non sia già admin di questa lega
    if (lega.admin_id === userId) {
      return res.status(400).json({ error: 'Sei già l\'admin di questa lega' });
    }
    
    // Verifica che l'utente non sia già proprietario di una squadra in questa lega
    const squadraPossedutaResult = await db.query('SELECT id FROM squadre WHERE lega_id = $1 AND proprietario_id = $2', [legaId, userId]);
    if (squadraPossedutaResult.rows.length > 0) {
      return res.status(400).json({ error: 'Hai già una squadra in questa lega' });
    }

    // Verifica che l'utente non abbia già una richiesta (in attesa, accettata o rifiutata) per questa lega
    const richiestaEsistenteResult = await db.query('SELECT id FROM richieste_ingresso WHERE utente_id = $1 AND lega_id = $2', [userId, legaId]);
    if (richiestaEsistenteResult.rows.length > 0) {
      return res.status(400).json({ error: 'Hai già inviato una richiesta per questa lega' });
    }

    // Verifica che la squadra esista e sia disponibile
    const squadraResult = await db.query('SELECT id, nome, is_orfana FROM squadre WHERE id = $1 AND lega_id = $2', [squadra_id, legaId]);
    if (squadraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    const squadra = squadraResult.rows[0];

    if (squadra.is_orfana !== true) {
      return res.status(400).json({ error: 'Squadra non disponibile' });
    }

    // Se la lega non è pubblica, verifica la password
    if (!lega.is_pubblica) {
      if (!password) {
        return res.status(400).json({ error: 'Password richiesta per unirsi a questa lega' });
      }
      if (lega.password !== password) {
        return res.status(400).json({ error: 'Password non corretta' });
      }
    }

    // Inserisci la richiesta
    const richiestaInsertResult = await db.query(`
      INSERT INTO richieste_ingresso 
      (utente_id, lega_id, squadra_id, password_fornita, messaggio_richiesta)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [userId, legaId, squadra_id, password || null, messaggio || null]);
    
    const richiestaId = richiestaInsertResult.rows[0].id;

    // Crea notifica per l'admin
    await db.query(`
      INSERT INTO notifiche (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [legaId, lega.admin_id, 'richiesta_ingresso', 'Nuova richiesta di ingresso', `Nuova richiesta di ingresso per la squadra ${squadra.nome} da ${req.user.nome || req.user.username}`]);

    // Crea notifiche per i subadmin con permesso gestione_richieste
    try {
      const subadminsResult = await db.query(`
        SELECT s.utente_id, s.permessi
        FROM subadmin s
        WHERE s.lega_id = $1 AND s.attivo = true
      `, [legaId]);
      
      for (const subadmin of subadminsResult.rows) {
        try {
          const permessi = JSON.parse(subadmin.permessi || '{}');
          if (permessi.gestione_richieste) {
            await db.query(`
              INSERT INTO notifiche (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
              VALUES ($1, $2, $3, $4, $5, NOW())
            `, [legaId, subadmin.utente_id, 'Nuova richiesta di ingresso', `Nuova richiesta di ingresso per la squadra ${squadra.nome} da ${req.user.nome || req.user.username}`]);
            console.log(`Notifica creata per subadmin ${subadmin.utente_id}`);
          }
        } catch (e) {
          console.error('Errore parsing permessi subadmin:', e);
        }
      }
    } catch (err) {
      console.error('Errore recupero subadmin per notifiche:', err);
    }

    console.log('Richiesta di ingresso creata:', richiestaId);
    res.json({ 
      success: true, 
      richiesta_id: richiestaId,
      message: 'Richiesta inviata con successo. L\'admin della lega riceverà una notifica.'
    });
  } catch (err) {
    console.error('Errore richiesta di ingresso:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Ottieni richieste di ingresso per un utente
router.get('/richieste/utente', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const db = getDb();
    const result = await db.query(`
      SELECT ri.*, l.nome as lega_nome, s.nome as squadra_nome, 
             CASE 
               WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
               ELSE u.nome || ' ' || u.cognome 
             END as admin_nome
      FROM richieste_ingresso ri
      JOIN leghe l ON ri.lega_id = l.id
      JOIN squadre s ON ri.squadra_id = s.id
      LEFT JOIN users u ON ri.risposta_admin_id = u.id
      WHERE ri.utente_id = $1
      ORDER BY ri.data_richiesta DESC
    `, [userId]);
    
    res.json({ richieste: result.rows });
  } catch (err) {
    console.error('Errore query richieste utente:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Ottieni richieste di ingresso per admin di lega
router.get('/richieste/admin', requireAuth, async (req, res) => {
  const adminId = req.user.id;
  
  console.log('GET /api/leghe/richieste/admin - Admin ID:', adminId);
  
  try {
    const db = getDb();
    console.log('Database connection obtained for richieste/admin');
    
    // Prima ottieni le richieste di ingresso normali
    console.log('Executing richieste ingresso query...');
    const richiesteIngressoResult = await db.query(`
      SELECT ri.*, l.nome as lega_nome, l.id as lega_id, s.nome as squadra_nome, 
             u.nome || ' ' || u.cognome as utente_nome, u.email as utente_email,
             'user' as tipo_richiesta, ri.messaggio_richiesta as tipo_richiesta_richiesta
      FROM richieste_ingresso ri
      JOIN leghe l ON ri.lega_id = l.id
      JOIN squadre s ON ri.squadra_id = s.id
      JOIN users u ON ri.utente_id = u.id
      WHERE l.admin_id = $1 AND ri.stato = 'in_attesa'
    `, [adminId]);
    console.log('Richieste ingresso found:', richiesteIngressoResult.rows.length);

    // Poi ottieni le richieste admin
    console.log('Executing richieste admin query...');
    const richiesteAdminResult = await db.query(`
      SELECT ra.*, l.nome as lega_nome, l.id as lega_id, s.nome as squadra_nome,
             COALESCE(u.nome || ' ' || u.cognome, 'N/A') as utente_nome, 
             COALESCE(u.email, 'N/A') as utente_email,
             'admin' as tipo_richiesta, ra.tipo_richiesta as tipo_richiesta_richiesta
      FROM richieste_admin ra
      JOIN squadre s ON ra.squadra_id = s.id
      JOIN leghe l ON s.lega_id = l.id
      LEFT JOIN users u ON s.proprietario_id = u.id
      WHERE l.admin_id = $1 AND ra.stato = 'pending'
    `, [adminId]);
    console.log('Richieste admin found:', richiesteAdminResult.rows.length);

    // Per le richieste Cantera, aggiungi i dettagli del giocatore se non sono già presenti
    for (let richiesta of richiesteAdminResult.rows) {
      if (richiesta.tipo_richiesta === 'cantera' && richiesta.dati_richiesta) {
        try {
          const datiRichiesta = typeof richiesta.dati_richiesta === 'string' 
            ? JSON.parse(richiesta.dati_richiesta) 
            : richiesta.dati_richiesta;
          
          // Se non ci sono dettagli_giocatori, li recuperiamo dal database
          if (!datiRichiesta.dettagli_giocatori && datiRichiesta.giocatori_selezionati) {
            console.log('Recupero dettagli giocatori per richiesta:', richiesta.id);
            console.log('Dati richiesta:', JSON.stringify(datiRichiesta, null, 2));
            
            const giocatoriIds = Array.isArray(datiRichiesta.giocatori_selezionati) 
              ? datiRichiesta.giocatori_selezionati 
              : [datiRichiesta.giocatori_selezionati];
            
            console.log('Giocatori IDs da recuperare:', giocatoriIds);
            
            if (giocatoriIds.length > 0) {
              const giocatoriResult = await db.query(`
                SELECT id, nome, cognome, ruolo, squadra_reale, qi, qa, quotazione_attuale, costo_attuale
                FROM giocatori 
                WHERE id = ANY($1)
              `, [giocatoriIds]);
              
              console.log('Giocatori trovati nel DB:', giocatoriResult.rows.length);
              console.log('Giocatori trovati:', giocatoriResult.rows);
              
              const dettagliGiocatori = {};
              giocatoriResult.rows.forEach(giocatore => {
                dettagliGiocatori[giocatore.id] = {
                  nome: giocatore.nome,
                  cognome: giocatore.cognome,
                  ruolo: giocatore.ruolo,
                  squadra_reale: giocatore.squadra_reale,
                  qi: giocatore.qi,
                  qa: giocatore.qa || giocatore.quotazione_attuale,
                  costo_attuale: giocatore.costo_attuale,
                  costo_dimezzato: Math.floor(giocatore.costo_attuale / 2)
                };
              });
              
              console.log('Dettagli giocatori creati:', dettagliGiocatori);
              
              // Aggiorna i dati della richiesta con i dettagli del giocatore
              datiRichiesta.dettagli_giocatori = dettagliGiocatori;
              richiesta.dati_richiesta = JSON.stringify(datiRichiesta);
              
              console.log('Dati richiesta aggiornati:', richiesta.dati_richiesta);
              
              // Salva i dettagli aggiornati nel database
              try {
                await db.query(`
                  UPDATE richieste_admin 
                  SET dati_richiesta = $1 
                  WHERE id = $2
                `, [richiesta.dati_richiesta, richiesta.id]);
                console.log('Dettagli giocatori salvati nel database per richiesta:', richiesta.id);
              } catch (updateError) {
                console.error('Errore nel salvataggio dettagli nel database:', updateError);
              }
            }
          } else {
            console.log('Richiesta già ha dettagli giocatori o non ha giocatori selezionati');
            console.log('Dati richiesta attuali:', JSON.stringify(datiRichiesta, null, 2));
          }
        } catch (error) {
          console.error('Errore nel recupero dettagli giocatori per richiesta:', richiesta.id, error);
        }
      }
    }

    console.log('Richieste admin trovate:', richiesteAdminResult.rows.length);

    // Combina le due liste
    const tutteRichieste = [
      ...richiesteIngressoResult.rows.map(r => ({ ...r, id: `ingresso_${r.id}` })),
      ...richiesteAdminResult.rows.map(r => ({ ...r, id: `admin_${r.id}` }))
    ];

    console.log('Richieste totali trovate:', tutteRichieste.length);
    res.json({ richieste: tutteRichieste });
  } catch (err) {
    console.error('Errore query richieste admin:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Ottieni richieste di ingresso per subadmin di lega
router.get('/richieste/subadmin', requireAuth, async (req, res) => {
  const subadminId = req.user.id;
  
  console.log('GET /api/leghe/richieste/subadmin - Subadmin ID:', subadminId);
  
  try {
    const db = getDb();
    
    // Verifica che l'utente sia subadmin con permesso gestione_richieste
    const subadminResult = await db.query(`
      SELECT s.*, l.nome as lega_nome
      FROM subadmin s
      JOIN leghe l ON s.lega_id = l.id
      WHERE s.utente_id = $1 AND s.attivo = true
    `, [subadminId]);
    
    if (subadminResult.rows.length === 0) {
      return res.status(403).json({ error: 'Non sei subadmin di nessuna lega' });
    }
    
    const subadmin = subadminResult.rows[0];
    
    try {
      const permessi = JSON.parse(subadmin.permessi || '{}');
      if (!permessi.gestione_richieste) {
        return res.status(403).json({ error: 'Non hai il permesso di gestire le richieste' });
      }
    } catch (e) {
      console.error('Errore parsing permessi:', e);
      return res.status(500).json({ error: 'Errore permessi' });
    }
    
    // Ottieni le richieste per tutte le leghe dove l'utente è subadmin con permesso gestione_richieste
    const richiesteResult = await db.query(`
      SELECT ri.*, l.nome as lega_nome, s.nome as squadra_nome, 
             u.nome || ' ' || u.cognome as utente_nome, u.email as utente_email
      FROM richieste_ingresso ri
      JOIN leghe l ON ri.lega_id = l.id
      JOIN squadre s ON ri.squadra_id = s.id
      JOIN users u ON ri.utente_id = u.id
      JOIN subadmin sub ON sub.lega_id = l.id
      WHERE sub.utente_id = $1 AND sub.attivo = true AND ri.stato = 'in_attesa'
      ORDER BY ri.data_richiesta ASC
    `, [subadminId]);
    
    console.log('Richieste subadmin trovate:', richiesteResult.rows.length);
    res.json({ richieste: richiesteResult.rows });
  } catch (err) {
    console.error('Errore query richieste subadmin:', err);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Rispondi a una richiesta di ingresso (accetta/rifiuta)
router.post('/richieste/:richiestaId/rispondi', requireAuth, async (req, res) => {
  try {
    const richiestaId = req.params.richiestaId;
    const adminId = req.user.id;
    const { risposta, messaggio } = req.body; // risposta: 'accetta' o 'rifiuta'
    
    console.log(`POST /api/leghe/richieste/${richiestaId}/rispondi - Admin ID: ${adminId}`);
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica che la richiesta esista e che l'utente sia admin della lega
    const richiestaResult = await db.query(`
      SELECT ri.*, l.admin_id, l.nome as lega_nome, s.nome as squadra_nome, u.email as utente_email
      FROM richieste_ingresso ri
      JOIN leghe l ON ri.lega_id = l.id
      JOIN squadre s ON ri.squadra_id = s.id
      JOIN users u ON ri.utente_id = u.id
      WHERE ri.id = $1 AND ri.stato = 'in_attesa'
    `, [richiestaId]);
    
    const richiesta = richiestaResult.rows[0];
    
    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata o già processata' });
    }
    
    // Funzione per aggiornare la richiesta
    const updateRequest = async () => {
      const nuovoStato = risposta === 'accetta' ? 'accettata' : 'rifiutata';
      const dataRisposta = new Date().toISOString();
      
      // Aggiorna la richiesta
      await db.query(`
        UPDATE richieste_ingresso 
        SET stato = $1, data_risposta = $2, risposta_admin_id = $3, messaggio_risposta = $4
        WHERE id = $5
      `, [nuovoStato, dataRisposta, adminId, messaggio || null, richiestaId]);
      
      if (risposta === 'accetta') {
        // Assegna la squadra all'utente
        await db.query(`
          UPDATE squadre 
          SET proprietario_id = $1, is_orfana = false
          WHERE id = $2
        `, [richiesta.utente_id, richiesta.squadra_id]);
      }
      
      // Crea notifica per l'utente
      const messaggioNotifica = risposta === 'accetta' 
        ? `La tua richiesta per la squadra ${richiesta.squadra_nome} nella lega ${richiesta.lega_nome} è stata accettata!`
        : `La tua richiesta per la squadra ${richiesta.squadra_nome} nella lega ${richiesta.lega_nome} è stata rifiutata.`;
      
      const titoloNotifica = risposta === 'accetta' 
        ? 'Richiesta accettata! 🎉'
        : 'Richiesta rifiutata';
      
      await db.query(`
        INSERT INTO notifiche (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [richiesta.lega_id, richiesta.utente_id, 'risposta_richiesta', titoloNotifica, messaggioNotifica]);
      
      console.log('Risposta alla richiesta processata:', richiestaId);
      res.json({ 
        success: true, 
        message: `Richiesta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo.`
      });
    };

    // Verifica che l'utente sia admin della lega O subadmin con permesso gestione_richieste
    if (richiesta.admin_id === adminId) {
      // L'utente è admin della lega, può procedere
      await updateRequest();
    } else {
      // Verifica se è subadmin con permesso gestione_richieste
      const subadminResult = await db.query(`
        SELECT s.permessi
        FROM subadmin s
        WHERE s.utente_id = $1 AND s.lega_id = $2 AND s.attivo = true
      `, [adminId, richiesta.lega_id]);
      
      const subadmin = subadminResult.rows[0];
      
      if (!subadmin) {
        return res.status(403).json({ error: 'Non autorizzato a rispondere a questa richiesta' });
      }
      
      try {
        const permessi = JSON.parse(subadmin.permessi || '{}');
        if (!permessi.gestione_richieste) {
          return res.status(403).json({ error: 'Non hai il permesso di gestire le richieste' });
        }
      } catch (e) {
        console.error('Errore parsing permessi subadmin:', e);
        return res.status(500).json({ error: 'Errore permessi' });
      }
      
      // Se arriviamo qui, il subadmin è autorizzato, continua con l'aggiornamento
      await updateRequest();
    }
  } catch (error) {
    console.error('Errore in risposta richiesta:', error);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Cancella una richiesta di ingresso (solo utente che l'ha creata)
router.delete('/richieste/:richiestaId', requireAuth, async (req, res) => {
  try {
    const richiestaId = req.params.richiestaId;
    const userId = req.user.id;
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    const result = await db.query(`
      DELETE FROM richieste_ingresso 
      WHERE id = $1 AND utente_id = $2 AND stato = 'in_attesa'
    `, [richiestaId, userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Richiesta non trovata o non cancellabile' });
    }
    
    res.json({ success: true, message: 'Richiesta cancellata con successo.' });
  } catch (error) {
    console.error('Errore cancellazione richiesta:', error);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Aggiorna credenziali scraping di una lega (admin della lega o superadmin)
router.put('/:legaId/scraping-credentials', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  const { fantacalcio_username, fantacalcio_password } = req.body;
  
  console.log(`PUT /api/leghe/${legaId}/scraping-credentials - User ID: ${userId}`);
  console.log('Update scraping credentials data:', { fantacalcio_username, fantacalcio_password: '***' });
  
  // Verifica che la lega esista
  getLegaById(legaId, (err, lega) => {
    if (err) {
      console.error('Errore nel getLegaById:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    if (!lega) {
      console.log('Lega non trovata');
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    console.log('Lega trovata:', { id: lega.id, nome: lega.nome, admin_id: lega.admin_id });
    
    // Verifica che l'utente sia admin della lega o superadmin
    if (lega.admin_id !== userId && req.user.role !== 'superadmin') {
      console.log('Utente non autorizzato:', { userId, legaAdminId: lega.admin_id, userRole: req.user.role });
      return res.status(403).json({ error: 'Non hai i permessi per modificare questa lega' });
    }
    
    // Validazioni
    if (!fantacalcio_username || fantacalcio_username.trim() === '') {
      return res.status(400).json({ error: 'Username Fantacalcio è obbligatorio' });
    }
    
    if (!fantacalcio_password || fantacalcio_password.trim() === '') {
      return res.status(400).json({ error: 'Password Fantacalcio è obbligatoria' });
    }
    
    // Prepara i dati per l'aggiornamento (solo credenziali scraping)
    const updatedLega = {
      nome: lega.nome, // Mantieni il nome esistente
      modalita: lega?.modalita || 'Classic Serie A',
      admin_id: lega.admin_id,
      is_pubblica: lega.is_pubblica,
      password: lega.password,
      max_squadre: lega.max_squadre,
      min_giocatori: lega.min_giocatori,
      max_giocatori: lega.max_giocatori,
      roster_ab: lega.roster_ab,
      cantera: lega.cantera,
      contratti: lega.contratti,
      triggers: lega.triggers,
      regolamento_pdf: lega.regolamento_pdf,
      excel_originale: lega.excel_originale,
      excel_modificato: lega.excel_modificato,
      fantacalcio_url: lega.fantacalcio_url,
      fantacalcio_username: fantacalcio_username.trim(),
      fantacalcio_password: fantacalcio_password.trim(),
      scraping_automatico: lega.scraping_automatico
    };
    
    // Aggiorna la lega
    updateLega(legaId, updatedLega, (err) => {
      if (err) {
        console.error('Errore aggiornamento credenziali scraping:', err);
        return res.status(500).json({ error: 'Errore aggiornamento credenziali', details: err.message });
      }
      
      console.log(`Credenziali scraping lega ${legaId} aggiornate con successo`);
      res.json({ 
        success: true, 
        message: 'Credenziali scraping aggiornate con successo',
        lega: { 
          id: legaId, 
          nome: lega.nome,
          fantacalcio_username: fantacalcio_username.trim(),
          fantacalcio_password: '***' // Non inviare la password in chiaro
        }
      });
    });
  });
});

// Debug endpoint per vedere le credenziali di una lega (solo per sviluppo)
router.get('/:legaId/debug-credentials', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  
  console.log(`GET /api/leghe/${legaId}/debug-credentials - User ID: ${userId}`);
  
  // Verifica che la lega esista
  getLegaById(legaId, (err, lega) => {
    if (err) {
      console.error('Errore nel getLegaById:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    if (!lega) {
      console.log('Lega non trovata');
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    console.log('Lega trovata:', { id: lega.id, nome: lega.nome, admin_id: lega.admin_id });
    
    // Verifica che l'utente sia admin della lega o superadmin
    if (lega.admin_id !== userId && req.user.role !== 'superadmin') {
      console.log('Utente non autorizzato:', { userId, legaAdminId: lega.admin_id, userRole: req.user.role });
      return res.status(403).json({ error: 'Non hai i permessi per visualizzare questa lega' });
    }
    
    // Restituisci le credenziali (solo per debug)
    res.json({ 
      success: true, 
      lega: { 
        id: lega.id, 
        nome: lega.nome,
        fantacalcio_url: lega.fantacalcio_url,
        fantacalcio_username: lega.fantacalcio_username,
        fantacalcio_password: lega.fantacalcio_password, // ATTENZIONE: solo per debug!
        scraping_automatico: lega.scraping_automatico
      }
    });
  });
});

// Aggiorna configurazioni lega (solo admin della lega)
router.put('/:id/config', requireAuth, async (req, res) => {
  const legaId = req.params.id;
  const utenteId = req.user.id;
  const userRole = req.user.ruolo;
  const {
    roster_ab, cantera, contratti, triggers,
    max_portieri, min_portieri,
    max_difensori, min_difensori,
    max_centrocampisti, min_centrocampisti,
    max_attaccanti, min_attaccanti
  } = req.body;

  try {
    // Verifica permessi
    const lega = await new Promise((resolve, reject) => {
      getLegaById(legaId, (err, lega) => {
        if (err) reject(err);
        else resolve(lega);
      });
    });

    if (!lega) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }

    // Solo admin della lega, superadmin o subadmin possono modificare
    if (userRole !== 'SuperAdmin' && userRole !== 'subadmin' && lega.admin_id !== utenteId) {
      return res.status(403).json({ error: 'Non hai i permessi per modificare questa lega' });
    }

    // Validazione limiti di ruolo per leghe Classic
    if ((lega?.modalita || '') === 'Classic Serie A' || (lega?.modalita || '') === 'Classic Euroleghe') {
      const errori = [];
      
      if (max_portieri < min_portieri) {
        errori.push('Max portieri non può essere minore di min portieri');
      }
      if (max_difensori < min_difensori) {
        errori.push('Max difensori non può essere minore di min difensori');
      }
      if (max_centrocampisti < min_centrocampisti) {
        errori.push('Max centrocampisti non può essere minore di min centrocampisti');
      }
      if (max_attaccanti < min_attaccanti) {
        errori.push('Max attaccanti non può essere minore di min attaccanti');
      }

      if (errori.length > 0) {
        return res.status(400).json({ error: errori.join(', ') });
      }
    }

    // Aggiorna configurazioni
    const updateQuery = `
      UPDATE leghe SET 
        roster_ab = $1, cantera = $2, contratti = $3, triggers = $4,
        max_portieri = $5, min_portieri = $6,
        max_difensori = $7, min_difensori = $8,
        max_centrocampisti = $9, min_centrocampisti = $10,
        max_attaccanti = $11, min_attaccanti = $12
      WHERE id = $13
    `;

    await new Promise((resolve, reject) => {
      db.query(updateQuery, [
        roster_ab ? 1 : 0, cantera ? 1 : 0, contratti ? 1 : 0, triggers ? 1 : 0,
        max_portieri || 3, min_portieri || 2,
        max_difensori || 8, min_difensori || 5,
        max_centrocampisti || 8, min_centrocampisti || 5,
        max_attaccanti || 6, min_attaccanti || 3,
        legaId
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ 
      success: true, 
      message: 'Configurazioni aggiornate con successo',
      config: {
        roster_ab: roster_ab === 1,
        cantera: cantera === 1,
        contratti: contratti === 1,
        triggers: triggers === 1,
        is_classic: (lega?.modalita || '') === 'Classic Serie A' || (lega?.modalita || '') === 'Classic Euroleghe',
        max_portieri: max_portieri || 3,
        min_portieri: min_portieri || 2,
        max_difensori: max_difensori || 8,
        min_difensori: min_difensori || 5,
        max_centrocampisti: max_centrocampisti || 8,
        min_centrocampisti: min_centrocampisti || 5,
        max_attaccanti: max_attaccanti || 6,
        min_attaccanti: min_attaccanti || 3
      }
    });

  } catch (error) {
    console.error('Errore aggiornamento configurazioni:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni configurazioni lega
router.get('/:id/config', requireAuth, async (req, res) => {
  const legaId = req.params.id;

  try {
    const config = await getLeagueConfig(legaId);
    
    if (!config) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }

    res.json({
      config: {
        roster_ab: config.roster_ab === 1,
        cantera: config.cantera === 1,
        contratti: config.contratti === 1,
        triggers: config.triggers === 1,
        is_classic: (config?.modalita || '') === 'Classic Serie A' || (config?.modalita || '') === 'Classic Euroleghe',
        max_portieri: config.max_portieri || 3,
        min_portieri: config.min_portieri || 2,
        max_difensori: config.max_difensori || 8,
        min_difensori: config.min_difensori || 5,
        max_centrocampisti: config.max_centrocampisti || 8,
        min_centrocampisti: config.min_centrocampisti || 5,
        max_attaccanti: config.max_attaccanti || 6,
        min_attaccanti: config.min_attaccanti || 3
      }
    });

  } catch (error) {
    console.error('Errore recupero configurazioni:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router; 