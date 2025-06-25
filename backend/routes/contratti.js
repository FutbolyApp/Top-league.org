import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/config.js';

const router = express.Router();
const db = getDb();

// Paga contratto giocatore
router.post('/paga/:giocatoreId', requireAuth, (req, res) => {
  const { giocatoreId } = req.params;
  const { token } = req.body;

  try {
    db.serialize(() => {
      // 1. Ottieni informazioni giocatore e squadra
      db.get(
        `SELECT g.*, s.casse_societarie, s.id as squadra_id 
         FROM giocatori g 
         JOIN squadre s ON g.squadra_id = s.id 
         WHERE g.id = ?`,
        [giocatoreId],
        (err, giocatore) => {
          if (err) {
            return res.status(500).json({ error: 'Errore nel recupero giocatore' });
          }
          if (!giocatore) {
            return res.status(404).json({ error: 'Giocatore non trovato' });
          }

          // 2. Verifica se ci sono abbastanza fondi
          if (giocatore.casse_societarie < giocatore.salario) {
            return res.status(400).json({ error: 'Fondi insufficienti per pagare il contratto' });
          }

          // 3. Aggiorna casse societarie
          const nuoveCasse = giocatore.casse_societarie - giocatore.salario;
          db.run(
            'UPDATE squadre SET casse_societarie = ? WHERE id = ?',
            [nuoveCasse, giocatore.squadra_id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Errore nell\'aggiornamento casse' });
              }

              // 4. Registra il pagamento
              db.run(
                `INSERT INTO log_contratti (giocatore_id, squadra_id, tipo, importo, data_pagamento)
                 VALUES (?, ?, 'pagamento', ?, datetime('now'))`,
                [giocatoreId, giocatore.squadra_id, giocatore.salario],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Errore nella registrazione pagamento' });
                  }

                  // 5. Crea notifica
                  db.run(
                    `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
                     VALUES (?, 'pagamento_contratto', ?, datetime('now'))`,
                    [giocatore.proprietario_id, `Contratto pagato per ${giocatore.nome} - FM ${giocatore.salario}`],
                    function(err) {
                      if (err) {
                        console.log('Errore creazione notifica:', err);
                      }
                      
                      res.json({ 
                        success: true, 
                        message: 'Contratto pagato con successo',
                        nuoveCasse: nuoveCasse
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Rinnova contratto giocatore
router.post('/rinnova/:giocatoreId', requireAuth, (req, res) => {
  const { giocatoreId } = req.params;
  const { nuovoSalario, durataMesi } = req.body;

  try {
    db.serialize(() => {
      // 1. Calcola nuova scadenza
      const nuovaScadenza = new Date();
      nuovaScadenza.setMonth(nuovaScadenza.getMonth() + durataMesi);

      // 2. Aggiorna contratto
      db.run(
        `UPDATE giocatori 
         SET salario = ?, contratto_scadenza = ?, data_rinnovo = datetime('now')
         WHERE id = ?`,
        [nuovoSalario, nuovaScadenza.toISOString(), giocatoreId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Errore nel rinnovo contratto' });
          }

          // 3. Registra il rinnovo
          db.run(
            `INSERT INTO log_contratti (giocatore_id, tipo, importo, note, data_pagamento)
             VALUES (?, 'rinnovo', ?, ?, datetime('now'))`,
            [giocatoreId, nuovoSalario, `Rinnovo per ${durataMesi} mesi`],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Errore nella registrazione rinnovo' });
              }

              res.json({ 
                success: true, 
                message: 'Contratto rinnovato con successo',
                nuovaScadenza: nuovaScadenza.toISOString()
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni contratti in scadenza
router.get('/scadenza', requireAuth, (req, res) => {
  try {
    const sql = `
      SELECT g.*, s.nome as squadra_nome, s.casse_societarie
      FROM giocatori g
      JOIN squadre s ON g.squadra_id = s.id
      WHERE g.contratto_scadenza IS NOT NULL
      AND g.contratto_scadenza <= datetime('now', '+30 days')
      ORDER BY g.contratto_scadenza ASC
    `;
    
    db.all(sql, (err, contratti) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero contratti' });
      }
      
      res.json({ contratti });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni log contratti
router.get('/log/:squadraId', requireAuth, (req, res) => {
  const { squadraId } = req.params;
  
  try {
    const sql = `
      SELECT lc.*, g.nome as giocatore_nome
      FROM log_contratti lc
      JOIN giocatori g ON lc.giocatore_id = g.id
      WHERE lc.squadra_id = ?
      ORDER BY lc.data_pagamento DESC
      LIMIT 50
    `;
    
    db.all(sql, [squadraId], (err, log) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero log' });
      }
      
      res.json({ log });
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

export default router; 