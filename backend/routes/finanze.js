import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';

const router = express.Router();
const db = getDb();

// Ottieni bilancio squadra
router.get('/squadra/:squadraId', requireAuth, (req, res) => {
  const squadraId = req.params.squadraId;
  const userId = req.user.id;

  // Verifica che l'utente sia proprietario della squadra
  db.get('SELECT id FROM squadre WHERE id = ? AND utente_id = ?', [squadraId, userId], (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!squadra) return res.status(403).json({ error: 'Non autorizzato' });

    // Calcola bilancio
    db.get(`
      SELECT 
        s.budget_iniziale,
        COALESCE(SUM(CASE WHEN t.tipo = 'entrata' THEN t.importo ELSE 0 END), 0) as entrate_totali,
        COALESCE(SUM(CASE WHEN t.tipo = 'uscita' THEN t.importo ELSE 0 END), 0) as uscite_totali,
        (s.budget_iniziale + COALESCE(SUM(CASE WHEN t.tipo = 'entrata' THEN t.importo ELSE -t.importo END), 0)) as bilancio_attuale
      FROM squadre s
      LEFT JOIN transazioni t ON s.id = t.squadra_id
      WHERE s.id = ?
      GROUP BY s.id
    `, [squadraId], (err, bilancio) => {
      if (err) return res.status(500).json({ error: 'Errore calcolo bilancio' });
      
      res.json({ bilancio });
    });
  });
});

// Ottieni transazioni squadra
router.get('/squadra/:squadraId/transazioni', requireAuth, (req, res) => {
  const squadraId = req.params.squadraId;
  const userId = req.user.id;
  const { page = 1, limit = 20, tipo, categoria } = req.query;

  // Verifica autorizzazione
  db.get('SELECT id FROM squadre WHERE id = ? AND utente_id = ?', [squadraId, userId], (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!squadra) return res.status(403).json({ error: 'Non autorizzato' });

    let query = `
      SELECT t.*, g.nome as giocatore_nome, s.nome as squadra_nome
      FROM transazioni t
      LEFT JOIN giocatori g ON t.giocatore_id = g.id
      LEFT JOIN squadre s ON t.squadra_id = s.id
      WHERE t.squadra_id = ?
    `;
    let params = [squadraId];

    if (tipo) {
      query += ' AND t.tipo = ?';
      params.push(tipo);
    }

    if (categoria) {
      query += ' AND t.categoria = ?';
      params.push(categoria);
    }

    query += ' ORDER BY t.data_transazione DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    db.all(query, params, (err, transazioni) => {
      if (err) return res.status(500).json({ error: 'Errore DB' });
      
      // Conta totale
      let countQuery = 'SELECT COUNT(*) as total FROM transazioni WHERE squadra_id = ?';
      let countParams = [squadraId];
      
      if (tipo) {
        countQuery += ' AND tipo = ?';
        countParams.push(tipo);
      }
      
      if (categoria) {
        countQuery += ' AND categoria = ?';
        countParams.push(categoria);
      }

      db.get(countQuery, countParams, (err, count) => {
        if (err) return res.status(500).json({ error: 'Errore DB' });
        
        res.json({
          transazioni,
          paginazione: {
            pagina: parseInt(page),
            per_pagina: parseInt(limit),
            totale: count.total,
            pagine_totali: Math.ceil(count.total / parseInt(limit))
          }
        });
      });
    });
  });
});

// Registra nuova transazione
router.post('/squadra/:squadraId/transazione', requireAuth, (req, res) => {
  const squadraId = req.params.squadraId;
  const userId = req.user.id;
  const { tipo, categoria, importo, descrizione, giocatore_id, data_transazione } = req.body;

  // Verifica autorizzazione
  db.get('SELECT id FROM squadre WHERE id = ? AND utente_id = ?', [squadraId, userId], (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!squadra) return res.status(403).json({ error: 'Non autorizzato' });

    // Verifica bilancio per uscite
    if (tipo === 'uscita') {
      db.get(`
        SELECT 
          s.budget_iniziale,
          COALESCE(SUM(CASE WHEN t.tipo = 'entrata' THEN t.importo ELSE -t.importo END), 0) as saldo_attuale
        FROM squadre s
        LEFT JOIN transazioni t ON s.id = t.squadra_id
        WHERE s.id = ?
        GROUP BY s.id
      `, [squadraId], (err, bilancio) => {
        if (err) return res.status(500).json({ error: 'Errore verifica bilancio' });
        
        const saldoDisponibile = bilancio.budget_iniziale + bilancio.saldo_attuale;
        if (saldoDisponibile < importo) {
          return res.status(400).json({ error: 'Fondi insufficienti' });
        }
        
        insertTransazione();
      });
    } else {
      insertTransazione();
    }

    function insertTransazione() {
      db.run(`
        INSERT INTO transazioni (squadra_id, tipo, categoria, importo, descrizione, giocatore_id, data_transazione)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [squadraId, tipo, categoria, importo, descrizione, giocatore_id || null, data_transazione || new Date().toISOString()], function(err) {
        if (err) return res.status(500).json({ error: 'Errore inserimento transazione' });
        
        res.json({ 
          success: true, 
          transazione_id: this.lastID,
          message: 'Transazione registrata con successo'
        });
      });
    }
  });
});

// Report finanziario
router.get('/squadra/:squadraId/report', requireAuth, (req, res) => {
  const squadraId = req.params.squadraId;
  const userId = req.user.id;
  const { periodo = 'mese' } = req.query;

  // Verifica autorizzazione
  db.get('SELECT id FROM squadre WHERE id = ? AND utente_id = ?', [squadraId, userId], (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!squadra) return res.status(403).json({ error: 'Non autorizzato' });

    let dateFilter = '';
    let params = [squadraId];

    switch (periodo) {
      case 'settimana':
        dateFilter = 'AND t.data_transazione >= date("now", "-7 days")';
        break;
      case 'mese':
        dateFilter = 'AND t.data_transazione >= date("now", "-1 month")';
        break;
      case 'trimestre':
        dateFilter = 'AND t.data_transazione >= date("now", "-3 months")';
        break;
      case 'anno':
        dateFilter = 'AND t.data_transazione >= date("now", "-1 year")';
        break;
    }

    // Statistiche per categoria
    db.all(`
      SELECT 
        categoria,
        tipo,
        SUM(importo) as totale,
        COUNT(*) as numero_transazioni
      FROM transazioni 
      WHERE squadra_id = ? ${dateFilter}
      GROUP BY categoria, tipo
      ORDER BY totale DESC
    `, params, (err, statsCategoria) => {
      if (err) return res.status(500).json({ error: 'Errore DB' });

      // Transazioni per mese
      db.all(`
        SELECT 
          strftime('%Y-%m', data_transazione) as mese,
          tipo,
          SUM(importo) as totale
        FROM transazioni 
        WHERE squadra_id = ? ${dateFilter}
        GROUP BY strftime('%Y-%m', data_transazione), tipo
        ORDER BY mese DESC
      `, params, (err, statsMensili) => {
        if (err) return res.status(500).json({ error: 'Errore DB' });

        // Top spese
        db.all(`
          SELECT t.*, g.nome as giocatore_nome
          FROM transazioni t
          LEFT JOIN giocatori g ON t.giocatore_id = g.id
          WHERE t.squadra_id = ? AND t.tipo = 'uscita' ${dateFilter}
          ORDER BY t.importo DESC
          LIMIT 10
        `, params, (err, topSpese) => {
          if (err) return res.status(500).json({ error: 'Errore DB' });

          res.json({
            stats_categoria: statsCategoria,
            stats_mensili: statsMensili,
            top_spese: topSpese,
            periodo: periodo
          });
        });
      });
    });
  });
});

// Gestione budget
router.put('/squadra/:squadraId/budget', requireAuth, (req, res) => {
  const squadraId = req.params.squadraId;
  const userId = req.user.id;
  const { nuovo_budget } = req.body;

  // Verifica che l'utente sia admin della lega
  db.get(`
    SELECT s.id FROM squadre s 
    JOIN leghe l ON s.lega_id = l.id 
    WHERE s.id = ? AND l.admin_id = ?
  `, [squadraId, userId], (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!squadra) return res.status(403).json({ error: 'Non autorizzato' });

    db.run('UPDATE squadre SET budget_iniziale = ? WHERE id = ?', [nuovo_budget, squadraId], function(err) {
      if (err) return res.status(500).json({ error: 'Errore aggiornamento budget' });
      
      res.json({ 
        success: true, 
        message: 'Budget aggiornato con successo',
        nuovo_budget: nuovo_budget
      });
    });
  });
});

// Esporta transazioni
router.get('/squadra/:squadraId/export', requireAuth, (req, res) => {
  const squadraId = req.params.squadraId;
  const userId = req.user.id;
  const { formato = 'csv' } = req.query;

  // Verifica autorizzazione
  db.get('SELECT id FROM squadre WHERE id = ? AND utente_id = ?', [squadraId, userId], (err, squadra) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!squadra) return res.status(403).json({ error: 'Non autorizzato' });

    db.all(`
      SELECT 
        t.data_transazione,
        t.tipo,
        t.categoria,
        t.importo,
        t.descrizione,
        g.nome as giocatore_nome
      FROM transazioni t
      LEFT JOIN giocatori g ON t.giocatore_id = g.id
      WHERE t.squadra_id = ?
      ORDER BY t.data_transazione DESC
    `, [squadraId], (err, transazioni) => {
      if (err) return res.status(500).json({ error: 'Errore DB' });

      if (formato === 'csv') {
        const csv = [
          'Data,Tipo,Categoria,Importo,Descrizione,Giocatore',
          ...transazioni.map(t => 
            `${t.data_transazione},${t.tipo},${t.categoria},${t.importo},"${t.descrizione}",${t.giocatore_nome || ''}`
          )
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transazioni_${squadraId}.csv`);
        res.send(csv);
      } else {
        res.json({ transazioni });
      }
    });
  });
});

export default router; 