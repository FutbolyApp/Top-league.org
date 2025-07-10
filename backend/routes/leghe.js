import express from 'express';
import multer from 'multer';
import path from 'path';
import { parseSquadreFromExcel } from '../utils/excelParser.js';
import { createLega, getAllLeghe, getLegaById, updateLega } from '../models/lega.js';
import { createSquadra, getSquadreByLega } from '../models/squadra.js';
import { createGiocatore, getGiocatoriBySquadra } from '../models/giocatore.js';
import { requireAuth, requireSuperAdmin, requireLegaAdminOrSuperAdmin } from '../middleware/auth.js';
import { getDb } from '../db/config.js';
import { getLeagueConfig } from '../utils/leagueConfig.js';
import fs from 'fs';

const router = express.Router();
const db = getDb();
const upload = multer({ dest: './backend/uploads/' });

// Crea una lega con upload Excel e popolamento squadre/giocatori
router.post('/create', requireAuth, upload.single('excel'), async (req, res) => {
  try {
    console.log('Creazione lega - Body:', req.body);
    console.log('Creazione lega - File:', req.file);
    console.log('User ID:', req.user.id);
    
    const {
      nome, modalita, is_pubblica, password, max_squadre, min_giocatori, max_giocatori,
      roster_ab, cantera, contratti, triggers, regolamento_pdf,
      fantacalcio_url, fantacalcio_username, fantacalcio_password, scraping_automatico
    } = req.body;
    
    if (!req.file) {
      console.log('Errore: File Excel mancante');
      return res.status(400).json({ error: 'File Excel mancante' });
    }

    console.log('File Excel ricevuto:', req.file.originalname, 'Path:', req.file.path);

    // 1. Crea la lega - admin_id è automaticamente l'utente corrente
    createLega({
      nome,
      modalita,
      admin_id: req.user.id, // Imposta automaticamente l'admin_id all'utente corrente
      is_pubblica: is_pubblica === 'true' || is_pubblica === true,
      password,
      max_squadre,
      min_giocatori,
      max_giocatori,
      roster_ab: roster_ab === 'true' || roster_ab === true,
      cantera: cantera === 'true' || cantera === true,
      contratti: contratti === 'true' || contratti === true,
      triggers: triggers === 'true' || triggers === true,
      regolamento_pdf: regolamento_pdf || null,
      excel_originale: req.file.path,
      excel_modificato: null,
      fantacalcio_url: fantacalcio_url || null,
      fantacalcio_username: fantacalcio_username || null,
      fantacalcio_password: fantacalcio_password || null,
      scraping_automatico: scraping_automatico === 'true' || scraping_automatico === true
    }, (err, legaId) => {
      if (err) {
        console.log('Errore creazione lega:', err);
        
        // Gestione specifica per nome duplicato
        if (err.message === 'Esiste già una lega con questo nome') {
          return res.status(400).json({ 
            error: 'Nome lega duplicato', 
            details: 'Esiste già una lega con questo nome. Scegli un nome diverso.' 
          });
        }
        
        return res.status(500).json({ error: 'Errore creazione lega', details: err.message });
      }
      
      console.log('Lega creata con ID:', legaId, 'Admin ID:', req.user.id);
      
      // 2. Parsing Excel con parametri di validazione
      try {
        const validationParams = {
          numeroSquadre: parseInt(max_squadre) || 0,
          minGiocatori: parseInt(min_giocatori) || 0,
          maxGiocatori: parseInt(max_giocatori) || 0
        };
        
        console.log('Parametri di validazione per il parser:', validationParams);
        const squadre = parseSquadreFromExcel(req.file.path, validationParams);
        console.log('Squadre parseate:', squadre.length);
        
        // NUOVO: Controlla se il numero di squadre corrisponde a quello atteso
        const expectedTeams = parseInt(max_squadre) || 0;
        const foundTeams = squadre.length;
        let warnings = [];
        
        if (expectedTeams > 0 && foundTeams !== expectedTeams) {
          warnings.push(`⚠️ Attenzione: trovate ${foundTeams} squadre, ma ne erano attese ${expectedTeams}`);
        }
        
        // 3. Popola squadre e giocatori
        let squadreInserite = 0;
        squadre.forEach((sq, idx) => {
          createSquadra({
            lega_id: legaId,
            nome: sq.nome,
            casse_societarie: sq.casseSocietarie || 0,
            valore_squadra: sq.valoreRosa || 0,
            is_orfana: 1
          }, (err, squadraId) => {
            if (err) {
              console.log('Errore creazione squadra:', err);
              return;
            }
            console.log('Squadra creata:', sq.nome, 'ID:', squadraId, 'Casse:', sq.casseSocietarie, 'Valore:', sq.valoreRosa);
            
            // Inserisci giocatori
            if (sq.giocatori && sq.giocatori.length > 0) {
              console.log('Inserendo', sq.giocatori.length, 'giocatori per la squadra', sq.nome);
              sq.giocatori.forEach((g, gIdx) => {
                createGiocatore({
                  lega_id: legaId,
                  squadra_id: squadraId,
                  nome: g.nome,
                  ruolo: g.ruolo,
                  squadra_reale: g.squadra,
                  costo_attuale: g.costo
                }, (err) => {
                  if (err) {
                    console.log('Errore creazione giocatore:', err, 'Giocatore:', g);
                  } else {
                    console.log('Giocatore creato:', g.nome, 'per squadra:', sq.nome);
                  }
                });
              });
            } else {
              console.log('Nessun giocatore trovato per la squadra:', sq.nome);
            }
            
            squadreInserite++;
            if (squadreInserite === squadre.length) {
              console.log('Tutte le squadre create con successo');
              return res.json({ success: true, legaId, squadre: squadre.length, warnings });
            }
          });
        });
      } catch (parseError) {
        console.log('Errore parsing Excel:', parseError);
        return res.status(500).json({ error: 'Errore parsing file Excel', details: parseError.message });
      }
    });
  } catch (e) {
    console.log('Errore generale:', e);
    res.status(500).json({ error: 'Errore interno', details: e.message });
  }
});

// Ottieni tutte le leghe (protetto)
router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT l.*, 
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome || ' ' || u.cognome 
           END as admin_nome,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = 0) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = 1) as squadre_disponibili,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei,
           CASE 
             WHEN (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = 1) > 0 
             THEN 1 
             ELSE 0 
           END as ha_squadre_disponibili
    FROM leghe l
    LEFT JOIN users u ON l.admin_id = u.id
    WHERE l.admin_id = ? OR l.is_pubblica = 1
    ORDER BY l.nome
  `, [userId], (err, leghe) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ leghe });
  });
});

// Ottieni solo le leghe a cui l'utente partecipa
router.get('/user-leagues', requireAuth, (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT l.*, 
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome || ' ' || u.cognome 
           END as admin_nome,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = 0) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = 1) as squadre_disponibili,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei
    FROM leghe l
    LEFT JOIN users u ON l.admin_id = u.id
    WHERE l.admin_id = ?
    ORDER BY l.nome
  `, [userId], (err, leghe) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    res.json({ leghe });
  });
});

// Ottieni leghe amministrate dall'utente (DEVE ESSERE PRIMA DELLE ROUTE CON PARAMETRI)
router.get('/admin', requireAuth, (req, res) => {
  const adminId = req.user.id;
  console.log('GET /api/leghe/admin - User ID:', adminId);
  
  db.all(`
    SELECT l.*, 
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id) as numero_squadre_totali,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = 0) as squadre_assegnate,
           (SELECT COUNT(*) FROM squadre s WHERE s.lega_id = l.id AND s.is_orfana = 1) as squadre_non_assegnate,
           (SELECT COUNT(*) FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = l.id) as numero_giocatori,
           (SELECT COUNT(*) FROM tornei t WHERE t.lega_id = l.id) as numero_tornei,
           strftime('%d/%m/%Y', l.created_at) as data_creazione_formattata
    FROM leghe l
    WHERE l.admin_id = ?
    ORDER BY l.created_at DESC
  `, [adminId], (err, leghe) => {
    if (err) {
      console.error('Errore query admin leghe:', err);
      return res.status(500).json({ error: 'Errore DB' });
    }
    console.log('Leghe admin trovate:', leghe.length);
    res.json({ leghe });
  });
});

// Ottieni tutte le leghe (solo SuperAdmin)
router.get('/all', requireSuperAdmin, (req, res) => {
  console.log('GET /api/leghe/all - SuperAdmin request');
  
  db.all(`
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
  `, [], (err, leghe) => {
    if (err) {
      console.error('Errore query tutte le leghe:', err);
      return res.status(500).json({ error: 'Errore DB' });
    }
    console.log('Tutte le leghe trovate:', leghe.length);
    res.json({ leghe });
  });
});

// Ottieni tutte le squadre e i giocatori di una lega
router.get('/:legaId/squadre', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  getSquadreByLega(legaId, async (err, squadre) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    
    // Processa le informazioni sui tornei per ogni squadra
    squadre.forEach(squadra => {
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
    });
    
    // Per ogni squadra, aggiungi i giocatori
    let count = 0;
    squadre.forEach((sq, idx) => {
      getGiocatoriBySquadra(sq.id, (err, giocatori) => {
        squadre[idx].giocatori = giocatori || [];
        count++;
        if (count === squadre.length) {
          res.json({ squadre });
        }
      });
    });
    if (squadre.length === 0) res.json({ squadre: [] });
  });
});

// Ottieni i dettagli di una singola lega
router.get('/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  getLegaById(legaId, (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB', details: err.message });
    if (!lega) return res.status(404).json({ error: 'Lega non trovata' });
    res.json({ lega });
  });
});

// Upload regolamento PDF per una lega
router.post('/:legaId/upload-regolamento', requireAuth, upload.single('pdf'), (req, res) => {
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
router.post('/:legaId/join', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  const { password } = req.body;
  
  console.log(`POST /api/leghe/${legaId}/join - User ID: ${userId}`);
  
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
    
    console.log('Lega trovata:', { id: lega.id, nome: lega.nome, is_pubblica: lega.is_pubblica });
    
    // Se la lega non è pubblica, verifica la password
    if (!lega.is_pubblica) {
      if (!password) {
        return res.status(400).json({ error: 'Password richiesta per unirsi a questa lega' });
      }
      if (lega.password !== password) {
        return res.status(400).json({ error: 'Password non corretta' });
      }
    }
    
    // Verifica che l'utente non sia già admin di questa lega
    if (lega.admin_id === userId) {
      return res.status(400).json({ error: 'Sei già l\'admin di questa lega' });
    }
    
    // Verifica che l'utente non abbia già una squadra in questa lega
    db.get('SELECT id FROM squadre WHERE lega_id = ? AND proprietario_id = ?', [legaId, userId], (err, squadra) => {
      if (err) {
        console.error('Errore verifica squadra esistente:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      if (squadra) {
        return res.status(400).json({ error: 'Hai già una squadra in questa lega' });
      }
      
      // Trova una squadra orfana disponibile
      db.get('SELECT id, nome FROM squadre WHERE lega_id = ? AND is_orfana = 1 LIMIT 1', [legaId], (err, squadraOrfana) => {
        if (err) {
          console.error('Errore ricerca squadra orfana:', err);
          return res.status(500).json({ error: 'Errore DB', details: err.message });
        }
        
        if (!squadraOrfana) {
          return res.status(400).json({ error: 'Nessuna squadra disponibile in questa lega' });
        }
        
        // Assegna la squadra orfana all'utente
        db.run('UPDATE squadre SET proprietario_id = ?, is_orfana = 0 WHERE id = ?', [userId, squadraOrfana.id], (err) => {
          if (err) {
            console.error('Errore assegnazione squadra:', err);
            return res.status(500).json({ error: 'Errore assegnazione squadra', details: err.message });
          }
          
          console.log(`Squadra ${squadraOrfana.nome} assegnata all'utente ${userId}`);
          res.json({ 
            success: true, 
            message: `Unito con successo alla lega ${lega.nome}`,
            squadra: {
              id: squadraOrfana.id,
              nome: squadraOrfana.nome
            }
          });
        });
      });
    });
  });
});

// Cancella una lega (solo admin della lega o superadmin)
router.delete('/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  
  console.log(`DELETE /api/leghe/${legaId} - User ID: ${userId}, Role: ${req.user.ruolo}`);
  
  // Verifica che l'utente sia admin della lega o superadmin
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
    
    // Verifica autorizzazione
    if (lega.admin_id !== userId && req.user.ruolo !== 'SuperAdmin') {
      console.log('Non autorizzato - admin_id:', lega.admin_id, 'user_id:', userId, 'ruolo:', req.user.ruolo);
      return res.status(403).json({ error: 'Non autorizzato a cancellare questa lega' });
    }
    
    console.log('Autorizzazione OK, inizio transazione');
    
    // Elimina la lega e tutti i dati correlati
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Errore BEGIN TRANSACTION:', err);
        return res.status(500).json({ error: 'Errore DB', details: err.message });
      }
      
      console.log('Transazione iniziata, elimino giocatori');
      
      // Elimina giocatori
      db.run('DELETE FROM giocatori WHERE squadra_id IN (SELECT id FROM squadre WHERE lega_id = ?)', [legaId], (err) => {
        if (err) {
          console.error('Errore eliminazione giocatori:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Errore eliminazione giocatori', details: err.message });
        }
        
        console.log('Giocatori eliminati, elimino squadre');
        
        // Elimina squadre
        db.run('DELETE FROM squadre WHERE lega_id = ?', [legaId], (err) => {
          if (err) {
            console.error('Errore eliminazione squadre:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Errore eliminazione squadre', details: err.message });
          }
          
          console.log('Squadre eliminate, elimino notifiche');
          
          // Elimina notifiche
          db.run('DELETE FROM notifiche WHERE lega_id = ?', [legaId], (err) => {
            if (err) {
              console.error('Errore eliminazione notifiche:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Errore eliminazione notifiche', details: err.message });
            }
            
            console.log('Notifiche eliminate, elimino offerte');
            
            // Elimina offerte
            db.run('DELETE FROM offerte WHERE lega_id = ?', [legaId], (err) => {
              if (err) {
                console.error('Errore eliminazione offerte:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Errore eliminazione offerte', details: err.message });
              }
              
              console.log('Offerte eliminate, elimino log');
              
              // Elimina log
              db.run('DELETE FROM log WHERE lega_id = ?', [legaId], (err) => {
                if (err) {
                  console.error('Errore eliminazione log:', err);
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Errore eliminazione log', details: err.message });
                }
                
                console.log('Log eliminati, elimino lega');
                
                // Elimina la lega
                db.run('DELETE FROM leghe WHERE id = ?', [legaId], (err) => {
                  if (err) {
                    console.error('Errore eliminazione lega:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Errore eliminazione lega', details: err.message });
                  }
                  
                  console.log('Lega eliminata, faccio commit');
                  
                  // Commit della transazione
                  db.run('COMMIT', (err) => {
                    if (err) {
                      console.error('Errore COMMIT:', err);
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: 'Errore commit', details: err.message });
                    }
                    
                    console.log('Transazione completata con successo');
                    res.json({ success: true, message: 'Lega eliminata con successo' });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
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
      modalita: updateData.modalita || lega.modalita,
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
      modalita: updateData.modalita || lega.modalita,
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
router.get('/:legaId/squadre-disponibili', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  
  db.all(`
    SELECT s.id, s.nome, s.is_orfana
    FROM squadre s
    WHERE s.lega_id = ?
    ORDER BY s.nome
  `, [legaId], (err, squadre) => {
    if (err) {
      console.error('Errore query squadre disponibili:', err);
      return res.status(500).json({ error: 'Errore DB' });
    }
    
    // Filtra solo squadre non assegnate per la richiesta
    const squadreDisponibili = squadre.filter(s => s.is_orfana === 1);
    const squadreAssegnate = squadre.filter(s => s.is_orfana === 0);
    
    res.json({ 
      squadre_disponibili: squadreDisponibili,
      squadre_assegnate: squadreAssegnate,
      totale_squadre: squadre.length
    });
  });
});

// Invia richiesta di ingresso a una lega
router.post('/:legaId/richiedi-ingresso', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  const userId = req.user.id;
  const { squadra_id, password, messaggio } = req.body;
  
  console.log(`POST /api/leghe/${legaId}/richiedi-ingresso - User ID: ${userId}`);
  
  // Verifica che la lega esista
  getLegaById(legaId, (err, lega) => {
    if (err) {
      console.error('Errore nel getLegaById:', err);
      return res.status(500).json({ error: 'Errore DB', details: err.message });
    }
    if (!lega) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    // Verifica che l'utente non sia già admin di questa lega
    if (lega.admin_id === userId) {
      return res.status(400).json({ error: 'Sei già l\'admin di questa lega' });
    }
    
    // Verifica che l'utente non sia già proprietario di una squadra in questa lega
    db.get('SELECT id FROM squadre WHERE lega_id = ? AND proprietario_id = ?', [legaId, userId], (err, squadraPosseduta) => {
      if (err) {
        console.error('Errore verifica squadra posseduta:', err);
        return res.status(500).json({ error: 'Errore DB' });
      }
      if (squadraPosseduta) {
        return res.status(400).json({ error: 'Hai già una squadra in questa lega' });
      }

      // Verifica che l'utente non abbia già una richiesta (in attesa, accettata o rifiutata) per questa lega
      db.get('SELECT id FROM richieste_ingresso WHERE utente_id = ? AND lega_id = ?', [userId, legaId], (err, richiestaEsistente) => {
        if (err) {
          console.error('Errore verifica richiesta esistente:', err);
          return res.status(500).json({ error: 'Errore DB' });
        }
        if (richiestaEsistente) {
          return res.status(400).json({ error: 'Hai già inviato una richiesta per questa lega' });
        }

        // Verifica che la squadra esista e sia disponibile
        db.get('SELECT id, nome, is_orfana FROM squadre WHERE id = ? AND lega_id = ?', [squadra_id, legaId], (err, squadra) => {
          if (err) {
            console.error('Errore verifica squadra:', err);
            return res.status(500).json({ error: 'Errore DB' });
          }

          if (!squadra) {
            return res.status(404).json({ error: 'Squadra non trovata' });
          }

          if (squadra.is_orfana !== 1) {
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
          db.run(`
            INSERT INTO richieste_ingresso 
            (utente_id, lega_id, squadra_id, password_fornita, messaggio_richiesta)
            VALUES (?, ?, ?, ?, ?)
          `, [userId, legaId, squadra_id, password || null, messaggio || null], function(err) {
            if (err) {
              console.error('Errore inserimento richiesta:', err);
              return res.status(500).json({ error: 'Errore DB' });
            }

            const richiestaId = this.lastID;

            // Crea notifica per l'admin
            db.run(`
              INSERT INTO notifiche (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
              VALUES (?, ?, 'richiesta_ingresso', ?, ?, datetime('now'))
            `, [legaId, lega.admin_id, 'richiesta_ingresso', 'Nuova richiesta di ingresso', `Nuova richiesta di ingresso per la squadra ${squadra.nome} da ${req.user.nome || req.user.username}`], (err) => {
              if (err) {
                console.error('Errore creazione notifica admin:', err);
              }
            });

            // Crea notifiche per i subadmin con permesso gestione_richieste
            db.all(`
              SELECT s.utente_id, s.permessi
              FROM subadmin s
              WHERE s.lega_id = ? AND s.attivo = 1
            `, [legaId], (err, subadmins) => {
              if (err) {
                console.error('Errore recupero subadmin per notifiche:', err);
                return;
              }

              subadmins.forEach(subadmin => {
                try {
                  const permessi = JSON.parse(subadmin.permessi || '{}');
                  if (permessi.gestione_richieste) {
                    db.run(`
                      INSERT INTO notifiche (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
                      VALUES (?, ?, 'richiesta_ingresso', ?, ?, datetime('now'))
                    `, [legaId, subadmin.utente_id, 'Nuova richiesta di ingresso', `Nuova richiesta di ingresso per la squadra ${squadra.nome} da ${req.user.nome || req.user.username}`], (err) => {
                      if (err) {
                        console.error('Errore creazione notifica subadmin:', err);
                      } else {
                        console.log(`Notifica creata per subadmin ${subadmin.utente_id}`);
                      }
                    });
                  }
                } catch (e) {
                  console.error('Errore parsing permessi subadmin:', e);
                }
              });
            });

            console.log('Richiesta di ingresso creata:', richiestaId);
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

// Ottieni richieste di ingresso per un utente
router.get('/richieste/utente', requireAuth, (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT ri.*, l.nome as lega_nome, s.nome as squadra_nome, 
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome || ' ' || u.cognome 
           END as admin_nome
    FROM richieste_ingresso ri
    JOIN leghe l ON ri.lega_id = l.id
    JOIN squadre s ON ri.squadra_id = s.id
    LEFT JOIN users u ON ri.risposta_admin_id = u.id
    WHERE ri.utente_id = ?
    ORDER BY ri.data_richiesta DESC
  `, [userId], (err, richieste) => {
    if (err) {
      console.error('Errore query richieste utente:', err);
      return res.status(500).json({ error: 'Errore DB' });
    }
    res.json({ richieste });
  });
});

// Ottieni richieste di ingresso per admin di lega
router.get('/richieste/admin', requireAuth, (req, res) => {
  const adminId = req.user.id;
  
  console.log('GET /api/leghe/richieste/admin - Admin ID:', adminId);
  
  // Prima ottieni le richieste di ingresso normali
  db.all(`
    SELECT ri.*, l.nome as lega_nome, l.id as lega_id, s.nome as squadra_nome, 
           u.nome || ' ' || u.cognome as utente_nome, u.email as utente_email,
           'user' as tipo_richiesta, ri.messaggio_richiesta as tipo_richiesta_richiesta
    FROM richieste_ingresso ri
    JOIN leghe l ON ri.lega_id = l.id
    JOIN squadre s ON ri.squadra_id = s.id
    JOIN users u ON ri.utente_id = u.id
    WHERE l.admin_id = ? AND ri.stato = 'in_attesa'
  `, [adminId], (err, richiesteIngresso) => {
    if (err) {
      console.error('Errore query richieste ingresso:', err);
      return res.status(500).json({ error: 'Errore DB' });
    }

    // Poi ottieni le richieste admin
    db.all(`
      SELECT ra.*, l.nome as lega_nome, l.id as lega_id, s.nome as squadra_nome,
             COALESCE(u.nome || ' ' || u.cognome, 'N/A') as utente_nome, 
             COALESCE(u.email, 'N/A') as utente_email,
             'admin' as tipo_richiesta, ra.tipo_richiesta as tipo_richiesta_richiesta
      FROM richieste_admin ra
      JOIN squadre s ON ra.squadra_id = s.id
      JOIN leghe l ON s.lega_id = l.id
      LEFT JOIN users u ON s.proprietario_id = u.id
      WHERE l.admin_id = ? AND ra.stato = 'pending'
    `, [adminId], (err, richiesteAdmin) => {
      if (err) {
        console.error('Errore query richieste admin:', err);
        return res.status(500).json({ error: 'Errore DB' });
      }

      console.log('Richieste admin trovate:', richiesteAdmin.length);

      // Combina le due liste
      const tutteRichieste = [
        ...richiesteIngresso.map(r => ({ ...r, id: `ingresso_${r.id}` })),
        ...richiesteAdmin.map(r => ({ ...r, id: `admin_${r.id}` }))
      ];

      console.log('Richieste totali trovate:', tutteRichieste.length);
      res.json({ richieste: tutteRichieste });
    });
  });
});

// Ottieni richieste di ingresso per subadmin di lega
router.get('/richieste/subadmin', requireAuth, (req, res) => {
  const subadminId = req.user.id;
  
  console.log('GET /api/leghe/richieste/subadmin - Subadmin ID:', subadminId);
  
  // Verifica che l'utente sia subadmin con permesso gestione_richieste
  db.get(`
    SELECT s.*, l.nome as lega_nome
    FROM subadmin s
    JOIN leghe l ON s.lega_id = l.id
    WHERE s.utente_id = ? AND s.attivo = 1
  `, [subadminId], (err, subadmin) => {
    if (err) {
      console.error('Errore verifica subadmin:', err);
      return res.status(500).json({ error: 'Errore DB' });
    }
    
    if (!subadmin) {
      return res.status(403).json({ error: 'Non sei subadmin di nessuna lega' });
    }
    
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
    db.all(`
      SELECT ri.*, l.nome as lega_nome, s.nome as squadra_nome, 
             u.nome || ' ' || u.cognome as utente_nome, u.email as utente_email
      FROM richieste_ingresso ri
      JOIN leghe l ON ri.lega_id = l.id
      JOIN squadre s ON ri.squadra_id = s.id
      JOIN users u ON ri.utente_id = u.id
      JOIN subadmin sub ON sub.lega_id = l.id
      WHERE sub.utente_id = ? AND sub.attivo = 1 AND ri.stato = 'in_attesa'
      ORDER BY ri.data_richiesta ASC
    `, [subadminId], (err, richieste) => {
      if (err) {
        console.error('Errore query richieste subadmin:', err);
        return res.status(500).json({ error: 'Errore DB' });
      }
      console.log('Richieste subadmin trovate:', richieste.length);
      res.json({ richieste });
    });
  });
});

// Rispondi a una richiesta di ingresso (accetta/rifiuta)
router.post('/richieste/:richiestaId/rispondi', requireAuth, (req, res) => {
  const richiestaId = req.params.richiestaId;
  const adminId = req.user.id;
  const { risposta, messaggio } = req.body; // risposta: 'accetta' o 'rifiuta'
  
  console.log(`POST /api/leghe/richieste/${richiestaId}/rispondi - Admin ID: ${adminId}`);
  
  // Verifica che la richiesta esista e che l'utente sia admin della lega
  db.get(`
    SELECT ri.*, l.admin_id, l.nome as lega_nome, s.nome as squadra_nome, u.email as utente_email
    FROM richieste_ingresso ri
    JOIN leghe l ON ri.lega_id = l.id
    JOIN squadre s ON ri.squadra_id = s.id
    JOIN users u ON ri.utente_id = u.id
    WHERE ri.id = ? AND ri.stato = 'in_attesa'
  `, [richiestaId], (err, richiesta) => {
    if (err) {
      console.error('Errore query richiesta:', err);
      return res.status(500).json({ error: 'Errore DB' });
    }
    
    if (!richiesta) {
      return res.status(404).json({ error: 'Richiesta non trovata o già processata' });
    }
    
    // Funzione per aggiornare la richiesta
    const updateRequest = () => {
      const nuovoStato = risposta === 'accetta' ? 'accettata' : 'rifiutata';
      const dataRisposta = new Date().toISOString();
      
      // Aggiorna la richiesta
      db.run(`
        UPDATE richieste_ingresso 
        SET stato = ?, data_risposta = ?, risposta_admin_id = ?, messaggio_risposta = ?
        WHERE id = ?
      `, [nuovoStato, dataRisposta, adminId, messaggio || null, richiestaId], (err) => {
        if (err) {
          console.error('Errore aggiornamento richiesta:', err);
          return res.status(500).json({ error: 'Errore DB' });
        }
        
        if (risposta === 'accetta') {
          // Assegna la squadra all'utente
          db.run(`
            UPDATE squadre 
            SET proprietario_id = ?, is_orfana = 0
            WHERE id = ?
          `, [richiesta.utente_id, richiesta.squadra_id], (err) => {
            if (err) {
              console.error('Errore assegnazione squadra:', err);
            }
          });
        }
        
        // Crea notifica per l'utente
        const messaggioNotifica = risposta === 'accetta' 
          ? `La tua richiesta per la squadra ${richiesta.squadra_nome} nella lega ${richiesta.lega_nome} è stata accettata!`
          : `La tua richiesta per la squadra ${richiesta.squadra_nome} nella lega ${richiesta.lega_nome} è stata rifiutata.`;
        
        const titoloNotifica = risposta === 'accetta' 
          ? 'Richiesta accettata! 🎉'
          : 'Richiesta rifiutata';
        
        db.run(`
          INSERT INTO notifiche (lega_id, utente_id, tipo, titolo, messaggio, data_creazione)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [richiesta.lega_id, richiesta.utente_id, 'risposta_richiesta', titoloNotifica, messaggioNotifica], (err) => {
          if (err) {
            console.error('Errore creazione notifica:', err);
          }
        });
        
        console.log('Risposta alla richiesta processata:', richiestaId);
        res.json({ 
          success: true, 
          message: `Richiesta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo.`
        });
      });
    };

    // Verifica che l'utente sia admin della lega O subadmin con permesso gestione_richieste
    if (richiesta.admin_id === adminId) {
      // L'utente è admin della lega, può procedere
      updateRequest();
    } else {
      // Verifica se è subadmin con permesso gestione_richieste
      db.get(`
        SELECT s.permessi
        FROM subadmin s
        WHERE s.utente_id = ? AND s.lega_id = ? AND s.attivo = 1
      `, [adminId, richiesta.lega_id], (err, subadmin) => {
        if (err) {
          console.error('Errore verifica subadmin:', err);
          return res.status(500).json({ error: 'Errore DB' });
        }
        
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
        updateRequest();
      });
    }
  });
});

// Cancella una richiesta di ingresso (solo utente che l'ha creata)
router.delete('/richieste/:richiestaId', requireAuth, (req, res) => {
  const richiestaId = req.params.richiestaId;
  const userId = req.user.id;
  
  db.run(`
    DELETE FROM richieste_ingresso 
    WHERE id = ? AND utente_id = ? AND stato = 'in_attesa'
  `, [richiestaId, userId], function(err) {
    if (err) {
      console.error('Errore cancellazione richiesta:', err);
      return res.status(500).json({ error: 'Errore DB' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Richiesta non trovata o non cancellabile' });
    }
    
    res.json({ success: true, message: 'Richiesta cancellata con successo.' });
  });
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
      modalita: lega.modalita,
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
    if (lega.modalita === 'Classic Serie A' || lega.modalita === 'Classic Euroleghe') {
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
        roster_ab = ?, cantera = ?, contratti = ?, triggers = ?,
        max_portieri = ?, min_portieri = ?,
        max_difensori = ?, min_difensori = ?,
        max_centrocampisti = ?, min_centrocampisti = ?,
        max_attaccanti = ?, min_attaccanti = ?
      WHERE id = ?
    `;

    await new Promise((resolve, reject) => {
      db.run(updateQuery, [
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
        max_portieri, min_portieri,
        max_difensori, min_difensori,
        max_centrocampisti, min_centrocampisti,
        max_attaccanti, min_attaccanti
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
        is_classic: config.modalita === 'Classic Serie A' || config.modalita === 'Classic Euroleghe',
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