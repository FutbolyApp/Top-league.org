import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';

const router = express.Router();

// Ottieni bilancio squadra
router.get('/squadra/:squadraId', requireAuth, async (req, res) => {
  try {
    const squadraId = req.params.squadraId;
    const userId = req.user.id;

    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica che l'utente sia proprietario della squadra
    const squadraResult = await db.query('SELECT id FROM squadre WHERE id = $1 AND proprietario_id = $2', [squadraId, userId]);
    if ((squadraResult.rows?.length || 0) === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Calcola bilancio
    const bilancioResult = await db.query(`
      SELECT 
        s.budget_iniziale,
        COALESCE(SUM(CASE WHEN t.tipo = 'entrata' THEN t.importo ELSE 0 END), 0) as entrate_totali,
        COALESCE(SUM(CASE WHEN t.tipo = 'uscita' THEN t.importo ELSE 0 END), 0) as uscite_totali,
        (s.budget_iniziale + COALESCE(SUM(CASE WHEN t.tipo = 'entrata' THEN t.importo ELSE -t.importo END), 0)) as bilancio_attuale
      FROM squadre s
      LEFT JOIN transazioni t ON s.id = t.squadra_id
      WHERE s.id = $1
      GROUP BY s.id
    `, [squadraId]);
    
    const bilancio = bilancioResult.rows[0];
    res.json({ bilancio });
  } catch (error) {
    console.error('Errore in bilancio squadra:', error);
    res.status(500).json({ error: 'Errore calcolo bilancio' });
  }
});

// Ottieni transazioni squadra
router.get('/squadra/:squadraId/transazioni', requireAuth, async (req, res) => {
  try {
    const squadraId = req.params.squadraId;
    const userId = req.user.id;
    const { page = 1, limit = 20, tipo, categoria } = req.query;

    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica autorizzazione
    const squadraResult = await db.query('SELECT id FROM squadre WHERE id = $1 AND proprietario_id = $2', [squadraId, userId]);
    if ((squadraResult.rows?.length || 0) === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    let query = `
      SELECT t.*, COALESCE(g.nome, 'Nome') as giocatore_nome, COALESCE(s.nome, 'Nome') as squadra_nome
      FROM transazioni t
      LEFT JOIN giocatori g ON t.giocatore_id = g.id
      LEFT JOIN squadre s ON t.squadra_id = s.id
      WHERE t.squadra_id = $1
    `;
    let params = [squadraId];
    let paramIndex = 1;

    if (tipo) {
      paramIndex++;
      query += ` AND t.tipo = $${paramIndex}`;
      params.push(tipo);
    }

    if (categoria) {
      paramIndex++;
      query += ` AND t.categoria = $${paramIndex}`;
      params.push(categoria);
    }

    paramIndex++;
    query += ` ORDER BY t.data_transazione DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const transazioniResult = await db.query(query, params);
    const transazioni = transazioniResult.rows;
    
    // Conta totale
    let countQuery = 'SELECT COUNT(*) as total FROM transazioni WHERE squadra_id = $1';
    let countParams = [squadraId];
    let countParamIndex = 1;
    
    if (tipo) {
      countParamIndex++;
      countQuery += ` AND tipo = $${countParamIndex}`;
      countParams.push(tipo);
    }
    
    if (categoria) {
      countParamIndex++;
      countQuery += ` AND categoria = $${countParamIndex}`;
      countParams.push(categoria);
    }

    const countResult = await db.query(countQuery, countParams);
    const count = countResult.rows[0];
    
    res.json({
      transazioni,
      paginazione: {
        pagina: parseInt(page),
        per_pagina: parseInt(limit),
        totale: count.total,
        pagine_totali: Math.ceil(count.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Errore in transazioni squadra:', error);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Registra nuova transazione
router.post('/squadra/:squadraId/transazione', requireAuth, async (req, res) => {
  try {
    const squadraId = req.params.squadraId;
    const userId = req.user.id;
    const { tipo, categoria, importo, descrizione, giocatore_id, data_transazione } = req.body;

    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica autorizzazione
    const squadraResult = await db.query('SELECT id FROM squadre WHERE id = $1 AND proprietario_id = $2', [squadraId, userId]);
    if ((squadraResult.rows?.length || 0) === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Verifica bilancio per uscite
    if (tipo === 'uscita') {
      const bilancioResult = await db.query(`
        SELECT 
          s.budget_iniziale,
          COALESCE(SUM(CASE WHEN t.tipo = 'entrata' THEN t.importo ELSE -t.importo END), 0) as saldo_attuale
        FROM squadre s
        LEFT JOIN transazioni t ON s.id = t.squadra_id
        WHERE s.id = $1
        GROUP BY s.id
      `, [squadraId]);
      
      const bilancio = bilancioResult.rows[0];
      const saldoDisponibile = bilancio.budget_iniziale + bilancio.saldo_attuale;
      if (saldoDisponibile < importo) {
        return res.status(400).json({ error: 'Fondi insufficienti' });
      }
    }

    // Inserisci transazione
    const insertResult = await db.query(`
      INSERT INTO transazioni (squadra_id, tipo, categoria, importo, descrizione, giocatore_id, data_transazione)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [squadraId, tipo, categoria, importo, descrizione, giocatore_id || null, data_transazione || new Date().toISOString()]);
    
    res.json({ 
      success: true, 
      transazione_id: insertResult.rows[0].id,
      message: 'Transazione registrata con successo'
    });
  } catch (error) {
    console.error('Errore in inserimento transazione:', error);
    res.status(500).json({ error: 'Errore inserimento transazione' });
  }
});

// Report finanziario
router.get('/squadra/:squadraId/report', requireAuth, async (req, res) => {
  try {
    const squadraId = req.params.squadraId;
    const userId = req.user.id;
    const { periodo = 'mese' } = req.query;

    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica autorizzazione
    const squadraResult = await db.query('SELECT id FROM squadre WHERE id = $1 AND proprietario_id = $2', [squadraId, userId]);
    if ((squadraResult.rows?.length || 0) === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

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
    const statsCategoriaResult = await db.query(`
      SELECT 
        categoria,
        tipo,
        SUM(importo) as totale,
        COUNT(*) as numero_transazioni
      FROM transazioni 
      WHERE squadra_id = $1 ${dateFilter}
      GROUP BY categoria, tipo
      ORDER BY totale DESC
    `, params);
    
    const statsCategoria = statsCategoriaResult.rows;

    // Transazioni per mese
    const statsMensiliResult = await db.query(`
      SELECT 
        strftime('%Y-%m', data_transazione) as mese,
        tipo,
        SUM(importo) as totale
      FROM transazioni 
      WHERE squadra_id = $1 ${dateFilter}
      GROUP BY strftime('%Y-%m', data_transazione), tipo
      ORDER BY mese DESC
    `, params);
    
    const statsMensili = statsMensiliResult.rows;

    // Top spese
    const topSpeseResult = await db.query(`
      SELECT t.*, COALESCE(g.nome, 'Nome') as giocatore_nome
      FROM transazioni t
      LEFT JOIN giocatori g ON t.giocatore_id = g.id
      WHERE t.squadra_id = $1 AND t.tipo = 'uscita' ${dateFilter}
      ORDER BY t.importo DESC
      LIMIT 10
    `, params);
    
    const topSpese = topSpeseResult.rows;

    res.json({
      stats_categoria: statsCategoria,
      stats_mensili: statsMensili,
      top_spese: topSpese,
      periodo: periodo
    });
  } catch (error) {
    console.error('Errore in report finanziario:', error);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Gestione budget
router.put('/squadra/:squadraId/budget', requireAuth, async (req, res) => {
  try {
    const squadraId = req.params.squadraId;
    const userId = req.user.id;
    const { nuovo_budget } = req.body;

    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica che l'utente sia admin della lega
    const squadraResult = await db.query(`
      SELECT s.id FROM squadre s 
      JOIN leghe l ON s.lega_id = l.id 
      WHERE s.id = $1 AND l.admin_id = $2
    `, [squadraId, userId]);
    
    if ((squadraResult.rows?.length || 0) === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    await db.query('UPDATE squadre SET budget_iniziale = $1 WHERE id = $2', [nuovo_budget, squadraId]);
    
    res.json({ 
      success: true, 
      message: 'Budget aggiornato con successo',
      nuovo_budget: nuovo_budget
    });
  } catch (error) {
    console.error('Errore in gestione budget:', error);
    res.status(500).json({ error: 'Errore aggiornamento budget' });
  }
});

// Esporta transazioni
router.get('/squadra/:squadraId/export', requireAuth, async (req, res) => {
  try {
    const squadraId = req.params.squadraId;
    const userId = req.user.id;
    const { formato = 'csv' } = req.query;

    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica autorizzazione
    const squadraResult = await db.query('SELECT id FROM squadre WHERE id = $1 AND proprietario_id = $2', [squadraId, userId]);
    if ((squadraResult.rows?.length || 0) === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const transazioniResult = await db.query(`
      SELECT 
        t.data_transazione,
        t.tipo,
        t.categoria,
        t.importo,
        t.descrizione,
        COALESCE(g.nome, 'Nome') as giocatore_nome
      FROM transazioni t
      LEFT JOIN giocatori g ON t.giocatore_id = g.id
      WHERE t.squadra_id = $1
      ORDER BY t.data_transazione DESC
    `, [squadraId]);
    
    const transazioni = transazioniResult.rows;

    if (formato === 'csv') {
      const csv = [
        'Data,Tipo,Categoria,Importo,Descrizione,Giocatore',
        ...transazioni?.map(t => 
          `${t.data_transazione},${t.tipo},${t.categoria},${t.importo},"${t.descrizione}",${t.giocatore_nome || ''}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transazioni_${squadraId}.csv`);
      res.send(csv);
    } else {
      res.json({ transazioni });
    }
  } catch (error) {
    console.error('Errore in esportazione transazioni:', error);
    res.status(500).json({ error: 'Errore DB' });
  }
});

export default router; 