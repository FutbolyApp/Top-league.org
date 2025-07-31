import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSquadreFromExcel } from '../utils/excelParser.js';
import { createLega, getAllLeghe, getLegaById, updateLega } from '../models/lega.js';
import { createSquadra, getSquadreByLega } from '../models/squadra.js';
import { createGiocatore, getGiocatoriBySquadra } from '../models/giocatore.js';
import { requireAuth, requireSuperAdmin, requireLegaAdminOrSuperAdmin } from '../middleware/auth.js';
import { getDb } from '../db/mariadb.js';
import { getLeagueConfig } from '../utils/leagueConfig.js';
import fs from 'fs';

console.log('🔍 LEGHE-FIXED.JS caricato correttamente!');

const router = express.Router();
const db = getDb();

// Configurazione multer migliorata per gestire più file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './backend/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB limit for fields
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer fileFilter - File:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.fieldname === 'excel') {
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls')) {
        cb(null, true);
      } else {
        cb(new Error('File Excel non valido. Accetta solo .xlsx e .xls'));
      }
    } else if (file.fieldname === 'pdf') {
      if (file.mimetype === 'application/pdf' ||
          file.originalname.endsWith('.pdf')) {
        cb(null, true);
      } else {
        cb(new Error('File PDF non valido. Accetta solo .pdf'));
      }
    } else {
      cb(new Error(`Campo file non supportato: ${file.fieldname}`));
    }
  }
});

// Middleware per gestire CORS preflight per tutte le route
router.use((req, res, next) => {
  const origin = req.headers.origin;
  
  const allowedOrigins = [
    'http://localhost:3000',
    'https://topleaguem-frontend.onrender.com',
    'https://topleague-frontend-new.onrender.com',
    'https://topleaguem.onrender.com',
    'https://topleague-frontend.onrender.com',
    'https://topleague-frontend-new.onrender.com',
    'https://top-league.org'
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

// Crea una lega semplice (senza file Excel)
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('🔍 Creazione lega semplice - User ID:', req.user.id);
    console.log('🔍 Creazione lega semplice - Body:', req.body);
    
    const {
      nome, descrizione, modalita, max_squadre, regole
    } = req.body;
    
    // Validazione dei dati richiesti
    if (!nome || !modalita) {
      return res.status(400).json({ 
        error: 'Dati mancanti', 
        details: 'Nome e modalità sono obbligatori' 
      });
    }
    
    // Validazione e pulizia dei valori
    const cleanData = {
      nome: nome.trim(),
      descrizione: descrizione || '',
      modalita: modalita.trim(),
      max_squadre: max_squadre || 20,
      regole: regole || null
    };
    
    // Crea la lega
    const legaId = await createLega({
      ...cleanData,
      admin_id: req.user.id
    });
    
    console.log('✅ Lega semplice creata con ID:', legaId);
    
    res.status(201).json({
      success: true,
      message: 'Lega creata con successo',
      legaId: legaId
    });
    
  } catch (error) {
    console.error('🚨 Errore nella creazione lega semplice:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// Crea una lega con upload Excel e popolamento squadre/giocatori
router.post('/create', requireAuth, (req, res, next) => {
  console.log('🔍 Inizio upload file per creazione lega');
  console.log('🔍 Content-Type:', req.headers['content-type']);
  console.log('🔍 Content-Length:', req.headers['content-length']);
  
  // Usa upload.fields per gestire più file
  const uploadFields = upload.fields([
    { name: 'excel', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]);
  
  uploadFields(req, res, (err) => {
    if (err) {
      console.error('🚨 Multer error:', err);
      return res.status(400).json({
        error: 'Errore upload file',
        details: err.message,
        type: 'multer_error'
      });
    }
    
    console.log('✅ Upload files completato');
    console.log('🔍 Files ricevuti:', req.files);
    console.log('🔍 Body ricevuto:', req.body);
    
    if (!req.body) {
      return res.status(400).json({
        error: 'Richiesta non valida',
        type: 'invalid_request'
      });
    }
    
    next();
  });
}, async (req, res) => {
  try {
    console.log('🔍 Creazione lega - Headers:', req.headers);
    console.log('🔍 Creazione lega - Body:', req.body);
    console.log('🔍 Creazione lega - Files:', req.files);
    console.log('🔍 User ID:', req.user.id);
    
    // Estrai i dati dal body
    const {
      nome, modalita, is_pubblica, password, max_squadre, min_giocatori, max_giocatori,
      roster_ab, cantera, contratti, triggers, fantacalcio_url, fantacalcio_username,
      fantacalcio_password, scraping_automatico, admin_id
    } = req.body;
    
    // Validazione dei dati richiesti
    if (!nome || !modalita) {
      return res.status(400).json({ 
        error: 'Dati mancanti', 
        details: 'Nome e modalità sono obbligatori' 
      });
    }
    
    // Validazione e pulizia dei valori
    const cleanData = {
      nome: nome.trim(),
      modalita: modalita.trim(),
      is_pubblica: is_pubblica === 'true' || is_pubblica === true,
      password: password || '',
      max_squadre: parseInt(max_squadre) || 20,
      min_giocatori: parseInt(min_giocatori) || 0,
      max_giocatori: parseInt(max_giocatori) || 0,
      roster_ab: roster_ab === 'true' || roster_ab === true,
      cantera: cantera === 'true' || cantera === true,
      contratti: contratti === 'true' || contratti === true,
      triggers: triggers === 'true' || triggers === true,
      fantacalcio_url: fantacalcio_url || '',
      fantacalcio_username: fantacalcio_username || '',
      fantacalcio_password: fantacalcio_password || '',
      scraping_automatico: scraping_automatico === 'true' || scraping_automatico === true
    };
    
    // Verifica se è presente un file Excel
    const excelFile = req.files?.excel?.[0];
    if (!excelFile) {
      console.log('🚨 Errore: File Excel mancante');
      return res.status(400).json({ 
        error: 'File Excel mancante',
        details: 'È necessario caricare un file Excel con le squadre'
      });
    }
    
    console.log('✅ File Excel ricevuto:', excelFile.originalname, 'Path:', excelFile.path);
    
    // 1. Crea la lega
    try {
      const legaId = await createLega({
        ...cleanData,
        admin_id: req.user.id // Imposta automaticamente l'admin_id all'utente corrente
      });
      
      console.log('✅ Lega creata con ID:', legaId, 'Admin ID:', req.user.id);
      
      // 2. Parsing Excel con parametri di validazione
      const validationParams = {
        numeroSquadre: cleanData.max_squadre,
        minGiocatori: cleanData.min_giocatori,
        maxGiocatori: cleanData.max_giocatori
      };
      
      console.log('🔍 Parametri di validazione per il parser:', validationParams);
      console.log('🔄 Inizio parsing file Excel:', excelFile.path);
      
      try {
        const squadre = await parseSquadreFromExcel(excelFile.path, validationParams);
        console.log('✅ Parsing Excel completato');
        console.log('📊 Squadre parseate:', squadre.length);
        
        // 3. Crea le squadre nel database
        for (const squadra of squadre) {
          try {
            const squadraId = await createSquadra({
              nome: squadra.nome,
              lega_id: legaId,
              casse_societarie: squadra.casseSocietarie,
              valore_rosa: squadra.valoreRosa
            });
            
            console.log('✅ Squadra creata:', squadra.nome, 'ID:', squadraId);
            
            // 4. Crea i giocatori per questa squadra
            if (squadra.giocatori && squadra.giocatori.length > 0) {
              for (const giocatore of squadra.giocatori) {
                try {
                  await createGiocatore({
                    nome: giocatore.nome,
                    ruolo: giocatore.ruolo,
                    squadra_id: squadraId,
                    quotazione: giocatore.costo
                  });
                } catch (giocatoreError) {
                  console.error('❌ Errore creazione giocatore:', giocatore.nome, giocatoreError.message);
                }
              }
              console.log('✅ Giocatori creati per squadra:', squadra.nome);
            }
          } catch (squadraError) {
            console.error('❌ Errore creazione squadra:', squadra.nome, squadraError.message);
          }
        }
        
        // Pulisci il file temporaneo
        try {
          fs.unlinkSync(excelFile.path);
          console.log('✅ File temporaneo rimosso:', excelFile.path);
        } catch (unlinkError) {
          console.log('⚠️ Warning: Impossibile rimuovere file temporaneo:', unlinkError.message);
        }
        
        res.status(201).json({
          success: true,
          message: 'Lega creata con successo',
          legaId: legaId,
          squadreCreate: squadre.length
        });
        
      } catch (parseError) {
        console.error('❌ Errore parsing Excel:', parseError);
        
        // Pulisci il file temporaneo anche in caso di errore
        try {
          fs.unlinkSync(excelFile.path);
        } catch (unlinkError) {
          console.log('⚠️ Warning: Impossibile rimuovere file temporaneo:', unlinkError.message);
        }
        
        return res.status(400).json({
          error: 'Errore nel parsing del file Excel',
          details: parseError.message
        });
      }
      
    } catch (legaError) {
      console.error('❌ Errore creazione lega:', legaError);
      
      // Pulisci il file temporaneo anche in caso di errore
      if (excelFile && excelFile.path) {
        try {
          fs.unlinkSync(excelFile.path);
        } catch (unlinkError) {
          console.log('⚠️ Warning: Impossibile rimuovere file temporaneo:', unlinkError.message);
        }
      }
      
      return res.status(500).json({
        error: 'Errore durante la creazione della lega',
        details: legaError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Errore generale creazione lega:', error);
    
    // Pulisci eventuali file temporanei
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (file && file.path) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.log('⚠️ Warning: Impossibile rimuovere file temporaneo:', unlinkError.message);
          }
        }
      });
    }
    
    return res.status(500).json({
      error: 'Errore interno del server',
      details: error.message
    });
  }
});

// Ottieni tutte le leghe (protetto)
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  console.log('GET /api/leghe - User ID:', userId);
  
  try {
    const db = getDb();
    console.log('Database connection obtained for /leghe');
    
    const result = await db.query(`
      SELECT 
        l.*,
        u.nome as admin_nome,
        u.cognome as admin_cognome
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      ORDER BY l.data_creazione DESC
    `);
    
    console.log('Query tutte le leghe eseguita con successo');
    res.json({ leghe: result.rows });
    
  } catch (error) {
    console.error('Errore query tutte le leghe:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni solo le leghe a cui l'utente partecipa
router.get('/user-leagues', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  console.log('GET /api/leghe/user-leagues - User ID:', userId);
  
  try {
    const db = getDb();
    console.log('Database connection obtained');
    
    console.log('Executing query with userId:', userId);
    const result = await db.query(`
      SELECT DISTINCT l.*, u.nome as admin_nome, u.cognome as admin_cognome
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      LEFT JOIN squadre s ON l.id = s.lega_id
      WHERE l.admin_id = ? OR s.proprietario_id = ?
      ORDER BY l.nome
    `, [userId, userId]);
    
    console.log('Query user-leagues executed successfully');
    res.json({ leghe: result.rows });
    
  } catch (error) {
    console.error('Errore query user-leagues:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni leghe amministrate dall'utente
router.get('/admin', requireAuth, async (req, res) => {
  const adminId = req.user.id;
  console.log('GET /api/leghe/admin - User ID:', adminId);
  console.log('GET /api/leghe/admin - User role:', req.user.ruolo);
  
  try {
    const db = getDb();
    console.log('Database connection obtained for admin query');
    
    if (!db) {
      console.log('❌ Database connection is null or undefined');
      return res.status(503).json({ error: 'Database connection not available' });
    }
    
    const result = await db.query(`
      SELECT l.*, 
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = false) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) as squadre_non_assegnate,
           (SELECT COUNT(*) FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = l.id) as numero_giocatori,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei,
           DATE_FORMAT(l.data_creazione, '%d/%m/%Y') as data_creazione_formattata
      FROM leghe l
      WHERE l.admin_id = ?
      ORDER BY l.data_creazione DESC
    `, [adminId]);
    
    console.log('Query admin leghe eseguita con successo');
    res.json({ leghe: result.rows });
    
  } catch (error) {
    console.error('Errore query admin leghe:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni tutte le leghe (solo per super admin)
router.get('/all', requireSuperAdmin, async (req, res) => {
  console.log('GET /api/leghe/all - SuperAdmin request');
  
  try {
    const db = getDb();
    console.log('Database connection obtained for superadmin query');
    
    const result = await db.query(`
      SELECT l.*, 
           u.nome as admin_nome,
           u.cognome as admin_cognome,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = false) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) as squadre_non_assegnate,
           (SELECT COUNT(*) FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = l.id) as numero_giocatori,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei,
           DATE_FORMAT(l.data_creazione, '%d/%m/%Y') as data_creazione_formattata
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      ORDER BY l.data_creazione DESC
    `);
    
    console.log('Query superadmin leghe eseguita con successo');
    res.json({ leghe: result.rows });
    
  } catch (error) {
    console.error('Errore query superadmin leghe:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni dettagli di una singola lega
router.get('/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const userId = req.user.id;
    const db = getDb();
    
    console.log(`GET /api/leghe/${legaId} - User ID: ${userId}`);
    
    // Verifica che il database sia disponibile
    if (!db) {
      console.error('Database non disponibile');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    // Ottieni dettagli della lega
    const result = await db.query(`
      SELECT l.*, 
           u.nome as admin_nome,
           u.cognome as admin_cognome,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = false) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = true) as squadre_non_assegnate,
           (SELECT COUNT(*) FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = l.id) as numero_giocatori,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      WHERE l.id = ?
    `, [legaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = result.rows[0];
    
    // Verifica autorizzazione (admin della lega, superadmin, o lega pubblica)
    if (lega.admin_id !== userId && 
        req.user.ruolo !== 'superadmin' && 
        req.user.ruolo !== 'SuperAdmin' && 
        lega.is_privata === 1) {
      return res.status(403).json({ error: 'Non autorizzato a visualizzare questa lega' });
    }
    
    res.json({ lega });
    
  } catch (error) {
    console.error('Errore query dettagli lega:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottieni squadre di una lega
router.get('/:legaId/squadre', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const userId = req.user.id;
    const db = getDb();
    
    console.log(`GET /api/leghe/${legaId}/squadre - User ID: ${userId}`);
    
    // Verifica che il database sia disponibile
    if (!db) {
      console.error('Database non disponibile');
      return res.status(500).json({ error: 'Database non disponibile' });
    }
    
    // Verifica che la lega esista
    const legaResult = await db.query('SELECT * FROM leghe WHERE id = ?', [legaId]);
    if (legaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = legaResult.rows[0];
    
    // Verifica autorizzazione (admin della lega, superadmin, o lega pubblica)
    if (lega.admin_id !== userId && 
        req.user.ruolo !== 'superadmin' && 
        req.user.ruolo !== 'SuperAdmin' && 
        lega.is_privata === 1) {
      return res.status(403).json({ error: 'Non autorizzato a visualizzare questa lega' });
    }
    
    // Ottieni squadre della lega
    const result = await db.query(`
      SELECT s.*, 
           (SELECT COUNT(*) FROM giocatori g WHERE g.squadra_id = s.id) as numero_giocatori,
           u.nome as proprietario_nome,
           u.cognome as proprietario_cognome
      FROM squadre s
      LEFT JOIN users u ON s.proprietario_id = u.id
      WHERE s.lega_id = ?
      ORDER BY s.nome
    `, [legaId]);
    
    res.json({ squadre: result.rows });
    
  } catch (error) {
    console.error('Errore query squadre lega:', error);
    res.status(500).json({ error: 'Errore interno del server' });
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
    if (lega.admin_id !== userId && req.user.ruolo !== 'superadmin' && req.user.ruolo !== 'SuperAdmin') {
      console.log('Non autorizzato - admin_id:', lega.admin_id, 'user_id:', userId, 'ruolo:', req.user.ruolo);
      return res.status(403).json({ error: 'Non autorizzato a cancellare questa lega' });
    }
    
    console.log('Autorizzazione OK, inizio transazione');
    
    // Elimina la lega e tutti i dati correlati
    await db.query('BEGIN');
    try {
      console.log('Transazione iniziata, elimino giocatori');
      
      // Elimina giocatori
      await db.query('DELETE FROM giocatori WHERE squadra_id IN (SELECT id FROM squadre WHERE lega_id = ?)', [legaId]);
      console.log('Giocatori eliminati, elimino squadre');
      
      // Elimina squadre
      await db.query('DELETE FROM squadre WHERE lega_id = ?', [legaId]);
      console.log('Squadre eliminate, elimino notifiche');
      
      // Elimina notifiche (rimossa perché la tabella notifiche non ha lega_id)
      console.log('Notifiche saltate (tabella non ha lega_id), elimino offerte');
      
      // Elimina offerte (rimossa perché la tabella offerte non esiste)
      console.log('Offerte saltate (tabella non esiste), elimino lega');
      
      // Elimina la lega
      await db.query('DELETE FROM leghe WHERE id = ?', [legaId]);
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

export default router; 