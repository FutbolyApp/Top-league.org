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
    console.log('Creazione lega semplice - User ID:', req.user.id);
    console.log('Creazione lega semplice - Body:', req.body);
    
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
    
    console.log('Lega semplice creata con ID:', legaId);
    
    res.status(201).json({
      success: true,
      message: 'Lega creata con successo',
      legaId: legaId
    });
    
  } catch (error) {
    console.error('Errore nella creazione lega semplice:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// Ottieni tutte le leghe
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('GET /api/leghe - User ID:', req.user.id);
    
    const db = getDb();
    const result = await db.query(`
      SELECT l.*, 
             CONCAT(u.nome, ' ', u.cognome) as admin_nome
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      ORDER BY l.data_creazione DESC
    `);
    
    console.log('Query tutte le leghe eseguita con successo');
    res.json({ leghe: result.rows });
    
  } catch (error) {
    console.error('Errore nel recupero leghe:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// Ottieni leghe dell'utente (admin)
router.get('/admin', requireAuth, async (req, res) => {
  try {
    console.log('GET /api/leghe/admin - User ID:', req.user.id);
    
    const db = getDb();
    const result = await db.query(`
      SELECT l.*, 
             DATE_FORMAT(l.data_creazione, '%d/%m/%Y') as data_creazione_formattata,
             CONCAT(u.nome, ' ', u.cognome) as admin_nome
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      WHERE l.admin_id = ?
      ORDER BY l.data_creazione DESC
    `, [req.user.id]);
    
    res.json({ leghe: result.rows });
    
  } catch (error) {
    console.error('Errore nel recupero leghe admin:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// Ottieni tutte le leghe (per super admin)
router.get('/all', requireAuth, async (req, res) => {
  try {
    console.log('GET /api/leghe/all - User ID:', req.user.id);
    
    const db = getDb();
    const result = await db.query(`
      SELECT l.*, 
             DATE_FORMAT(l.data_creazione, '%d/%m/%Y') as data_creazione_formattata,
             CONCAT(u.nome, ' ', u.cognome) as admin_nome
      FROM leghe l
      LEFT JOIN users u ON l.admin_id = u.id
      ORDER BY l.data_creazione DESC
    `);
    
    res.json({ leghe: result.rows });
    
  } catch (error) {
    console.error('Errore nel recupero tutte le leghe:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// Ottieni richieste admin (placeholder)
router.get('/richieste/admin', requireAuth, async (req, res) => {
  try {
    console.log('GET /api/leghe/richieste/admin - User ID:', req.user.id);
    
    // Per ora restituiamo un array vuoto
    res.json({ richieste: [] });
    
  } catch (error) {
    console.error('Errore nel recupero richieste admin:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// Crea una lega con file Excel (endpoint completo)
router.post('/create', requireAuth, upload.any(), async (req, res) => {
  try {
    console.log('POST /api/leghe/create - User ID:', req.user.id);
    console.log('POST /api/leghe/create - Content-Type:', req.headers['content-type']);
    
    // Gestisci sia JSON che FormData
    let data;
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      // FormData - estrai i dati dal body
      data = req.body;
      console.log('POST /api/leghe/create - FormData received:', Object.keys(data));
      console.log('POST /api/leghe/create - FormData values:', data);
    } else {
      // JSON - usa direttamente req.body
      data = req.body;
      console.log('POST /api/leghe/create - JSON Body:', data);
    }
    
    const {
      nome, descrizione, modalita, max_squadre, regole,
      is_pubblica, password, min_giocatori, max_giocatori,
      roster_ab, cantera, contratti, triggers,
      fantacalcio_url, fantacalcio_username, fantacalcio_password,
      scraping_automatico
    } = data;

    // Validazione dei dati richiesti
    if (!nome || !modalita) {
      console.log('POST /api/leghe/create - Validation failed:', { nome, modalita });
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
      max_squadre: parseInt(max_squadre) || 20,
      regole: regole || null,
      is_pubblica: is_pubblica === 'true' || is_pubblica === true,
      password: password || null,
      min_giocatori: parseInt(min_giocatori) || 0,
      max_giocatori: parseInt(max_giocatori) || 0,
      roster_ab: roster_ab === 'true' || roster_ab === true,
      cantera: cantera === 'true' || cantera === true,
      contratti: contratti === 'true' || contratti === true,
      triggers: triggers === 'true' || triggers === true,
      fantacalcio_url: fantacalcio_url || null,
      fantacalcio_username: fantacalcio_username || null,
      fantacalcio_password: fantacalcio_password || null,
      scraping_automatico: scraping_automatico === 'true' || scraping_automatico === true
    };

    // Crea la lega
    const legaId = await createLega({
      ...cleanData,
      admin_id: req.user.id
    });

    console.log('Lega creata con successo, ID:', legaId);

    res.status(201).json({
      success: true,
      message: 'Lega creata con successo',
      legaId: legaId
    });

  } catch (error) {
    console.error('Errore nella creazione lega:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      details: error.message
    });
  }
});

// Elimina una lega (solo admin della lega o SuperAdmin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const legaId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.ruolo;
    
    console.log('DELETE /api/leghe/:id - Lega ID:', legaId, 'User ID:', userId, 'Role:', userRole);
    
    const db = getDb();
    
    // Verifica che la lega esista
    const legaResult = await db.query('SELECT * FROM leghe WHERE id = ?', [legaId]);
    if (legaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = legaResult.rows[0];
    
    // Verifica permessi: solo admin della lega o SuperAdmin
    if (userRole !== 'SuperAdmin' && lega.admin_id !== userId) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    
    // Elimina la lega
    await db.query('DELETE FROM leghe WHERE id = ?', [legaId]);
    
    console.log('Lega eliminata con successo, ID:', legaId);
    res.json({ success: true, message: 'Lega eliminata con successo' });
    
  } catch (error) {
    console.error('Errore eliminazione lega:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

export default router; 