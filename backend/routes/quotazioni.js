import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth, requireSubadminOrAdmin } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';
import XLSX from 'xlsx';

const router = express.Router();

// Configurazione multer per il caricamento file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'quotazioni-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo file Excel (.xlsx, .xls) sono permessi'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Funzione per fare backup dei dati attuali
const createBackup = async (legaId) => {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const backupData = {
      lega_id: legaId,
      timestamp: new Date().toISOString(),
      giocatori: []
    };

    const result = await db.query('SELECT * FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = $1', [legaId]);
    backupData.giocatori = result.rows || [];
    
    // Salva il backup in una tabella dedicata o come file JSON
    const backupJson = JSON.stringify(backupData);
    const backupPath = `backups/quotazioni_backup_${legaId}_${Date.now()}.json`;
    
    // Per ora salviamo solo in memoria, in produzione andrebbe salvato su disco
    return backupData;
  } catch (error) {
    console.error('Errore in createBackup:', error);
    throw error;
  }
};

// Funzione per trovare giocatori simili
const findSimilarPlayers = async (nome, squadra_reale, legaId) => {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    // Prima cerca per nome esatto
    const exactResult = await db.query('SELECT * FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = $1 AND g.nome = $2', [legaId, nome]);
    const giocatore = exactResult.rows[0];
    
    if (giocatore) {
      return giocatore;
    }
    
    // Se non trova, cerca nomi simili con squadra corrispondente
    const searchPattern = `%${nome}%`;
    const similarResult = await db.query(
      'SELECT * FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = $1 AND g.nome LIKE $2 AND g.squadra_reale = $3', 
      [legaId, searchPattern, squadra_reale]
    );
    
    return similarResult.rows[0] || null;
  } catch (error) {
    console.error('Errore in findSimilarPlayers:', error);
    throw error;
  }
};

// Funzione per aggiornare un giocatore
const updatePlayer = async (giocatoreId, updateData) => {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const fields = [];
    const values = [];
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        fields.push(`${key} = $${values.length + 1}`);
        values.push(value);
      }
    });
    
    if (fields.length === 0) {
      return 0;
    }
    
    values.push(giocatoreId);
    
    const sql = `UPDATE giocatori SET ${fields.join(', ')} WHERE id = $${values.length}`;
    
    const result = await db.query(sql, values);
    return result.rowCount;
  } catch (error) {
    console.error('Errore in updatePlayer:', error);
    throw error;
  }
};

// Route per caricare quotazioni aggiornate
router.post('/upload', requireSubadminOrAdmin, upload.single('file'), async (req, res) => {
  try {
    const { legaId } = req.body;
    
    if (!legaId) {
      return res.status(400).json({ error: 'ID lega richiesto' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }
    
    // Leggi il file Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Rimuovi l'intestazione
    const headers = data[0];
    const rows = data.slice(1);
    
    // Ottieni informazioni sulla lega per determinare il tipo
    const lega = await new Promise((resolve, reject) => {
      getDb().query('SELECT modalita FROM leghe WHERE id = $1', [legaId], (err, result) => {
        if (err) reject(err);
        else resolve(result.rows[0]);
      });
    });
    
    if (!lega) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const isEuroleghe = lega.modalita.includes('Euroleghe');
    const isMantra = lega.modalita.includes('Mantra');
    
    // Crea backup
    const backup = await createBackup(legaId);
    
    // Ottieni tutti i giocatori del database per questa lega
    const giocatoriDatabase = await new Promise((resolve, reject) => {
      getDb().query('SELECT * FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = $1', [legaId], (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      });
    });
    
    console.log(`[QUOTAZIONI] Giocatori nel database per lega ${legaId}: ${giocatoriDatabase.length}`);
    console.log(`[QUOTAZIONI] Primi 5 giocatori nel DB:`, giocatoriDatabase.slice(0, 5).map(g => ({ id: g.id, nome: g.nome, squadra: g.squadra_reale })));
    console.log(`[QUOTAZIONI] Righe Excel da processare: ${rows.length}`);
    console.log(`[QUOTAZIONI] Primi 3 nomi dall'Excel:`, rows.slice(0, 3).map(row => isEuroleghe ? row[5] : row[4]));
    
    // Crea un set per ricerca rapida dei giocatori dell'Excel
    const giocatoriExcel = new Set();
    const updatesFromExcel = [];
    
    // Prima passata: processa l'Excel e crea il set di ricerca
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        let playerData = {};
        let playerName = '';
        let playerSquadra = '';
        
        if (isEuroleghe) {
          // Struttura Euroleghe
          const siteId = row[0];
          const ruoloClassic = row[1];
          const ruoloMantra = row[2];
          playerName = row[3];
          const nazioneCampionato = row[4];
          playerSquadra = row[5];
          const qaClassic = row[6];
          const qiClassic = row[7];
          const qaMantra = row[9];
          const qiMantra = row[10];
          
          playerData = {
            site_id: siteId,
            nazione_campionato: nazioneCampionato,
            squadra_reale: playerSquadra
          };
          
          // Applica i valori in base alla modalità
          if (isMantra) {
            playerData.ruolo = ruoloMantra;
            playerData.qa = qaMantra;
            playerData.qi = qiMantra;
          } else {
            playerData.ruolo = ruoloClassic;
            playerData.qa = qaClassic;
            playerData.qi = qiClassic;
          }
          
        } else {
          // Struttura Serie A
          const siteId = row[0];
          const ruoloClassic = row[1];
          const ruoloMantra = row[2];
          playerName = row[3];
          playerSquadra = row[4];
          const qaClassic = row[5];
          const qiClassic = row[6];
          const qaMantra = row[8];
          const qiMantra = row[9];
          
          playerData = {
            site_id: siteId,
            squadra_reale: playerSquadra
          };
          
          // Applica i valori in base alla modalità
          if (isMantra) {
            playerData.ruolo = ruoloMantra;
            playerData.qa = qaMantra;
            playerData.qi = qiMantra;
          } else {
            playerData.ruolo = ruoloClassic;
            playerData.qa = qaClassic;
            playerData.qi = qiClassic;
          }
        }
        
        // Trova il giocatore nel database
        const giocatore = await findSimilarPlayers(playerName, playerSquadra, legaId);
        console.log(`[QUOTAZIONI] Ricerca: ${playerName} (${playerSquadra}) ->`, giocatore ? `TROVATO id=${giocatore.id}` : 'NON TROVATO');
        
        if (giocatore) {
          // Aggiungi al set per tracciare i giocatori trovati
          giocatoriExcel.add(`${giocatore.id}`);
          updatesFromExcel.push({ giocatore, playerData });
        }
        
      } catch (error) {
        console.error(`[QUOTAZIONI] Errore processando riga ${i + 2}:`, error);
      }
    }
    
    // Seconda passata: aggiorna i giocatori trovati
    let updatedCount = 0;
    for (const update of updatesFromExcel) {
      try {
        const updateResult = await updatePlayer(update.giocatore.id, update.playerData);
        console.log(`[QUOTAZIONI] Update id=${update.giocatore.id} (${update.giocatore.nome}):`, update.playerData, 'Risultato:', updateResult);
        updatedCount++;
      } catch (error) {
        console.error(`[QUOTAZIONI] Errore aggiornamento giocatore ${update.giocatore.id}:`, error);
      }
    }
    
    // Terza passata: trova giocatori del database non presenti nell'Excel
    let errorCount = 0;
    const errors = [];
    
    for (const giocatoreDb of giocatoriDatabase) {
      if (!giocatoriExcel.has(`${giocatoreDb.id}`)) {
        errorCount++;
        errors.push({
          id: giocatoreDb.id,
          nome: giocatoreDb.nome,
          squadra: giocatoreDb.squadra_reale,
          motivo: 'Giocatore presente nel database ma non trovato nel file Excel'
        });
      }
    }
    
    // Salva log del caricamento quotazioni
    const logData = {
      lega_id: legaId,
      utente_id: req.user.id,
      utente_nome: req.user.nome || req.user.username,
      file_nome: req.file.originalname,
      giocatori_aggiornati: updatedCount,
      errori: errorCount
    };
    
    getDb().query(`
      INSERT INTO caricalogquot (lega_id, utente_id, utente_nome, file_nome, giocatori_aggiornati, errori)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [logData.lega_id, logData.utente_id, logData.utente_nome, logData.file_nome, logData.giocatori_aggiornati, logData.errori], (err) => {
      if (err) {
        console.error('[QUOTAZIONI] Errore salvataggio log:', err);
      } else {
        console.log(`[QUOTAZIONI] Log salvato: ${logData.utente_nome} ha caricato ${logData.file_nome} per lega ${legaId}`);
      }
    });
    
    // Rimuovi il file temporaneo
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Aggiornamento completato. ${updatedCount} giocatori aggiornati, ${errorCount} errori.`,
      stats: {
        totalRows: rows.length,
        updated: updatedCount,
        errors: errorCount
      },
      errors: errors,
      backup: {
        timestamp: backup.timestamp,
        giocatoriCount: backup.giocatori.length
      }
    });
    
  } catch (error) {
    console.error('Errore caricamento quotazioni:', error);
    res.status(500).json({ 
      error: 'Errore durante il caricamento delle quotazioni',
      details: error.message 
    });
  }
});

// Route per ripristinare backup
router.post('/restore-backup', requireSubadminOrAdmin, async (req, res) => {
  try {
    const { legaId, backupData } = req.body;
    
    if (!legaId || !backupData) {
      return res.status(400).json({ error: 'Dati backup richiesti' });
    }
    
    // Ripristina i dati dal backup
    let restoredCount = 0;
    
    for (const giocatore of backupData.giocatori) {
      await updatePlayer(giocatore.id, {
        ruolo: giocatore.ruolo,
        squadra_reale: giocatore.squadra_reale,
        qa: giocatore.qa,
        qi: giocatore.qi,
        site_id: giocatore.site_id,
        nazione_campionato: giocatore.nazione_campionato
      });
      restoredCount++;
    }
    
    res.json({
      success: true,
      message: `Backup ripristinato. ${restoredCount} giocatori ripristinati.`,
      restoredCount
    });
    
  } catch (error) {
    console.error('Errore ripristino backup:', error);
    res.status(500).json({ 
      error: 'Errore durante il ripristino del backup',
      details: error.message 
    });
  }
});

// Route per caricare statistiche aggiornate
router.post('/upload-stats', requireSubadminOrAdmin, upload.single('file'), async (req, res) => {
  try {
    const { legaId } = req.body;
    
    if (!legaId) {
      return res.status(400).json({ error: 'ID lega richiesto' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }
    
    // Leggi il file Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Rimuovi l'intestazione
    const headers = data[0];
    const rows = data.slice(1);
    
    // Ottieni informazioni sulla lega per determinare il tipo
    const lega = await new Promise((resolve, reject) => {
      getDb().query('SELECT modalita FROM leghe WHERE id = $1', [legaId], (err, result) => {
        if (err) reject(err);
        else resolve(result.rows[0]);
      });
    });
    
    if (!lega) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const isEuroleghe = lega.modalita.includes('Euroleghe');
    
    // Crea backup
    const backup = await createBackup(legaId);
    
    // Ottieni tutti i giocatori del database per questa lega
    const giocatoriDatabase = await new Promise((resolve, reject) => {
      getDb().query('SELECT * FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = $1', [legaId], (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      });
    });
    
    console.log(`[STATISTICHE] Giocatori nel database per lega ${legaId}: ${giocatoriDatabase.length}`);
    console.log(`[STATISTICHE] Primi 5 giocatori nel DB:`, giocatoriDatabase.slice(0, 5).map(g => ({ id: g.id, nome: g.nome, squadra: g.squadra_reale })));
    console.log(`[STATISTICHE] Righe Excel da processare: ${rows.length}`);
    console.log(`[STATISTICHE] Primi 3 nomi dall'Excel:`, rows.slice(0, 3).map(row => ({ 
      nome: isEuroleghe ? row[3] : row[4], 
      squadra: isEuroleghe ? row[5] : row[5] 
    })));
    
    // Crea un set per ricerca rapida dei giocatori dell'Excel
    const giocatoriExcel = new Set();
    const updatesFromExcel = [];
    
    // Prima passata: processa l'Excel e crea il set di ricerca
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        let playerData = {};
        let playerName = '';
        let playerSquadra = '';
        
        if (isEuroleghe) {
          // Struttura Euroleghe - nome in colonna 4, squadra in colonna 6
          playerName = row[3]; // Colonna 4: Nome giocatore
          playerSquadra = row[5]; // Colonna 6: Squadra reale
          const presenze = row[6]; // Colonna 7: PR
          const mediaVoto = row[7]; // Colonna 8: M
          const fantamediaVoto = row[8]; // Colonna 9: FaM
          const goalfatti = row[9]; // Colonna 10: GF
          const goalsubiti = row[10]; // Colonna 11: GS
          const rigoriparati = row[11]; // Colonna 12: RP
          const rigoricalciati = row[12]; // Colonna 13: RC
          const rigorisegnati = row[13]; // Colonna 14: R+
          const rigorisbagliati = row[14]; // Colonna 15: R-
          const assist = row[15]; // Colonna 16: AS
          const ammonizioni = row[16]; // Colonna 17: AM
          const espulsioni = row[17]; // Colonna 18: ES
          const autogol = row[18]; // Colonna 19: Aut
          
          playerData = {
            presenze: presenze,
            r: mediaVoto,
            fr: fantamediaVoto,
            goalfatti: goalfatti,
            goalsubiti: goalsubiti,
            rigoriparati: rigoriparati,
            rigoricalciati: rigoricalciati,
            rigorisegnati: rigorisegnati,
            rigorisbagliati: rigorisbagliati,
            assist: assist,
            ammonizioni: ammonizioni,
            espulsioni: espulsioni,
            autogol: autogol
          };
          
        } else {
          // Struttura Serie A - colonne 4-18
          playerName = row[4];
          playerSquadra = row[5]; // Squadra in colonna 5 per Serie A
          const presenze = row[6];
          const mediaVoto = row[7];
          const fantamediaVoto = row[8];
          const goalfatti = row[9];
          const goalsubiti = row[10];
          const rigoriparati = row[11];
          const rigoricalciati = row[12];
          const rigorisegnati = row[13];
          const rigorisbagliati = row[14];
          const assist = row[15];
          const ammonizioni = row[16];
          const espulsioni = row[17];
          const autogol = row[18];
          
          playerData = {
            presenze: presenze,
            r: mediaVoto,
            fr: fantamediaVoto,
            goalfatti: goalfatti,
            goalsubiti: goalsubiti,
            rigoriparati: rigoriparati,
            rigoricalciati: rigoricalciati,
            rigorisegnati: rigorisegnati,
            rigorisbagliati: rigorisbagliati,
            assist: assist,
            ammonizioni: ammonizioni,
            espulsioni: espulsioni,
            autogol: autogol
          };
        }
        
        // Salta righe che sembrano essere intestazioni o squadre (non giocatori)
        if (!playerName || playerName.length < 2 || playerName === playerSquadra || 
            ['Aston Villa', 'Chelsea', 'Liverpool', 'Manchester City', 'Atletico Madrid', 
             'Atalanta', 'Juventus', 'Lazio', 'Roma', 'Inter', 'Milan', 'Napoli'].includes(playerName)) {
          console.log(`[STATISTICHE] Saltando riga che sembra essere intestazione/squadra: "${playerName}"`);
          continue;
        }
        
        // Trova il giocatore nel database usando nome e squadra
        const giocatore = await findSimilarPlayers(playerName, playerSquadra, legaId);
        console.log(`[STATISTICHE] Ricerca: "${playerName}" (${playerSquadra}) ->`, giocatore ? `TROVATO id=${giocatore.id} (${giocatore.nome})` : 'NON TROVATO');
        
        // Se non trova, prova una ricerca più flessibile
        if (!giocatore) {
          console.log(`[STATISTICHE] Tentativo ricerca flessibile per: "${playerName}"`);
          const giocatoreFlessibile = await new Promise((resolve, reject) => {
            const searchPattern = `%${playerName}%`;
            getDb().query('SELECT * FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = $1 AND g.nome LIKE $2', [legaId, searchPattern], (err, result) => {
              if (err) reject(err);
              else resolve(result.rows[0]);
            });
          });
          console.log(`[STATISTICHE] Ricerca flessibile: "${playerName}" ->`, giocatoreFlessibile ? `TROVATO id=${giocatoreFlessibile.id} (${giocatoreFlessibile.nome})` : 'NON TROVATO');
          
          if (giocatoreFlessibile) {
            giocatoriExcel.add(`${giocatoreFlessibile.id}`);
            updatesFromExcel.push({ giocatore: giocatoreFlessibile, playerData });
            continue;
          }
        }
        
        if (giocatore) {
          // Aggiungi al set per tracciare i giocatori trovati
          giocatoriExcel.add(`${giocatore.id}`);
          updatesFromExcel.push({ giocatore, playerData });
        }
        
      } catch (error) {
        console.error(`[STATISTICHE] Errore processando riga ${i + 2}:`, error);
      }
    }
    
    // Seconda passata: aggiorna i giocatori trovati
    let updatedCount = 0;
    for (const update of updatesFromExcel) {
      try {
        const updateResult = await updatePlayer(update.giocatore.id, update.playerData);
        console.log(`[STATISTICHE] Update id=${update.giocatore.id} (${update.giocatore.nome}):`, update.playerData, 'Risultato:', updateResult);
        updatedCount++;
      } catch (error) {
        console.error(`[STATISTICHE] Errore aggiornamento giocatore ${update.giocatore.id}:`, error);
      }
    }
    
    // Terza passata: trova giocatori del database non presenti nell'Excel
    let errorCount = 0;
    const errors = [];
    
    for (const giocatoreDb of giocatoriDatabase) {
      if (!giocatoriExcel.has(`${giocatoreDb.id}`)) {
        errorCount++;
        errors.push({
          id: giocatoreDb.id,
          nome: giocatoreDb.nome,
          squadra: giocatoreDb.squadra_reale,
          motivo: 'Giocatore presente nel database ma non trovato nel file Excel'
        });
      }
    }
    
    // Salva log del caricamento statistiche
    const logData = {
      lega_id: legaId,
      utente_id: req.user.id,
      utente_nome: req.user.nome || req.user.username,
      file_nome: req.file.originalname,
      giocatori_aggiornati: updatedCount,
      errori: errorCount
    };
    
    getDb().query(`
      INSERT INTO caricalogstat (lega_id, utente_id, utente_nome, file_nome, giocatori_aggiornati, errori)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [logData.lega_id, logData.utente_id, logData.utente_nome, logData.file_nome, logData.giocatori_aggiornati, logData.errori], (err) => {
      if (err) {
        console.error('[STATISTICHE] Errore salvataggio log:', err);
      } else {
        console.log(`[STATISTICHE] Log salvato: ${logData.utente_nome} ha caricato ${logData.file_nome} per lega ${legaId}`);
      }
    });
    
    // Rimuovi il file temporaneo
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Aggiornamento statistiche completato. ${updatedCount} giocatori aggiornati, ${errorCount} errori.`,
      stats: {
        totalRows: rows.length,
        updated: updatedCount,
        errors: errorCount
      },
      errors: errors,
      backup: {
        timestamp: backup.timestamp,
        giocatoriCount: backup.giocatori.length
      }
    });
    
  } catch (error) {
    console.error('Errore caricamento statistiche:', error);
    res.status(500).json({ 
      error: 'Errore durante il caricamento delle statistiche',
      details: error.message 
    });
  }
});

// Route per ottenere i log delle quotazioni
router.get('/logs/:legaId', requireSubadminOrAdmin, async (req, res) => {
  try {
    const { legaId } = req.params;
    
    const logs = await new Promise((resolve, reject) => {
      getDb().query(`
        SELECT * FROM caricalogquot 
        WHERE lega_id = $1 
        ORDER BY data_caricamento DESC 
        LIMIT 50
      `, [legaId], (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      });
    });
    
    res.json({ success: true, logs });
    
  } catch (error) {
    console.error('Errore caricamento log quotazioni:', error);
    res.status(500).json({ 
      error: 'Errore durante il caricamento dei log',
      details: error.message 
    });
  }
});

// Route per ottenere i log delle statistiche
router.get('/logs-stats/:legaId', requireSubadminOrAdmin, async (req, res) => {
  try {
    const { legaId } = req.params;
    
    const logs = await new Promise((resolve, reject) => {
      getDb().query(`
        SELECT * FROM caricalogstat 
        WHERE lega_id = $1 
        ORDER BY data_caricamento DESC 
        LIMIT 50
      `, [legaId], (err, result) => {
        if (err) reject(err);
        else resolve(result.rows);
      });
    });
    
    res.json({ success: true, logs });
    
  } catch (error) {
    console.error('Errore caricamento log statistiche:', error);
    res.status(500).json({ 
      error: 'Errore durante il caricamento dei log',
      details: error.message 
    });
  }
});

export default router; 