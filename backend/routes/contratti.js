import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';
import { createLogContratto, getLogContrattiBySquadra } from '../models/logContratto.js';

const router = express.Router();

// Paga contratto giocatore
router.post('/paga/:giocatoreId', requireAuth, async (req, res) => {
  try {
    const { giocatoreId } = req.params;
    const { token } = req.body;
    const db = getDb();

    // 1. Ottieni informazioni giocatore e squadra
    const giocatoreResult = await db.query(
      `SELECT g.*, s.casse_societarie, s.id as squadra_id, s.proprietario_id
       FROM giocatori g 
       JOIN squadre s ON g.squadra_id = s.id 
       WHERE g.id = $1`,
      [giocatoreId]
    );

    if (giocatoreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    const giocatore = giocatoreResult.rows[0];

    // 2. Verifica che il giocatore non sia in Roster B (non può essere modificato)
    if (giocatore.roster === 'B') {
      return res.status(400).json({ error: 'Non puoi pagare contratti per giocatori in Roster B' });
    }

    // 3. Verifica se ci sono abbastanza fondi
    if (giocatore.casse_societarie < giocatore.costo_attuale) {
      return res.status(400).json({ error: 'Fondi insufficienti per pagare il contratto' });
    }

    // 4. Aggiorna casse societarie
    const nuoveCasse = giocatore.casse_societarie - giocatore.costo_attuale;
    await db.query(
      'UPDATE squadre SET casse_societarie = $1 WHERE id = $2',
      [nuoveCasse, giocatore.squadra_id]
    );

    // 5. Aggiorna timestamp ultimo pagamento e diminuisci anni contratto
    await db.query(
      `UPDATE giocatori 
       SET ultimo_pagamento_contratto = NOW(),
           anni_contratto = CASE 
             WHEN anni_contratto > 0 THEN anni_contratto - 1 
             ELSE 0 
           END
       WHERE id = $1`,
      [giocatoreId]
    );

    // 6. Registra il pagamento nel log
    await createLogContratto({
      giocatore_id: giocatoreId,
      squadra_id: giocatore.squadra_id,
      tipo: 'pagamento_contratto',
      valore_prima: giocatore.casse_societarie,
      valore_dopo: nuoveCasse,
      importo: giocatore.costo_attuale,
      note: `Pagamento contratto ${giocatore.nome}`
    });

    // 7. Crea notifica
    await db.query(
      `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
       VALUES ($1, 'pagamento_contratto', $2, NOW())`,
      [giocatore.proprietario_id, `Contratto pagato per ${giocatore.nome} - FM ${giocatore.costo_attuale}`]
    );

    res.json({ 
      success: true, 
      message: 'Contratto pagato con successo',
      nuoveCasse: nuoveCasse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore pagamento contratto:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Paga contratti multipli
router.post('/paga-multipli', requireAuth, async (req, res) => {
  try {
    const { giocatoriIds } = req.body;
    const userId = req.user.id;
    const db = getDb();

    if (!giocatoriIds || !Array.isArray(giocatoriIds) || giocatoriIds.length === 0) {
      return res.status(400).json({ error: 'Lista giocatori non valida' });
    }

    // 1. Ottieni tutte le squadre dell'utente
    const squadreResult = await db.query(
      `SELECT s.id as squadra_id, s.casse_societarie, s.proprietario_id, s.nome
       FROM squadre s 
       WHERE s.proprietario_id = $1`,
      [userId]
    );

    if (squadreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Nessuna squadra trovata' });
    }

    const squadre = squadreResult.rows;

    // 2. Ottieni tutti i giocatori e calcola il totale
    const placeholders = giocatoriIds.map((_, index) => `$${index + 1}`).join(',');
    const squadraIds = squadre.map(s => s.id);
    const squadraPlaceholders = squadraIds.map((_, index) => `$${giocatoriIds.length + index + 1}`).join(',');
    
    const giocatoriResult = await db.query(
      `SELECT g.*, s.casse_societarie, s.nome as squadra_nome 
       FROM giocatori g 
       JOIN squadre s ON g.squadra_id = s.id
       WHERE g.id IN (${placeholders}) AND g.squadra_id IN (${squadraPlaceholders})`,
      [...giocatoriIds, ...squadraIds]
    );

    const giocatori = giocatoriResult.rows;
    if (giocatori.length !== giocatoriIds.length) {
      return res.status(400).json({ error: 'Alcuni giocatori non appartengono alla tua squadra' });
    }

    // 3. Verifica che nessun giocatore sia in Roster B
    const giocatoriInRosterB = giocatori.filter(g => g.roster === 'B');
    if (giocatoriInRosterB.length > 0) {
      const nomiGiocatori = giocatoriInRosterB.map(g => `${g.nome} ${g.cognome || ''}`).join(', ');
      return res.status(400).json({ 
        error: `Non puoi pagare contratti per giocatori in Roster B: ${nomiGiocatori}` 
      });
    }

    // 4. Calcola il totale da pagare per ogni squadra
    const pagamentiPerSquadra = {};
    giocatori.forEach(g => {
      if (!pagamentiPerSquadra[g.squadra_id]) {
        pagamentiPerSquadra[g.squadra_id] = {
          squadra_id: g.squadra_id,
          squadra_nome: g.squadra_nome,
          casse_societarie: g.casse_societarie,
          totale: 0,
          giocatori: []
        };
      }
      pagamentiPerSquadra[g.squadra_id].totale += (g.costo_attuale || 0);
      pagamentiPerSquadra[g.squadra_id].giocatori.push(g);
    });

    // 5. Verifica fondi per ogni squadra
    for (const squadraId in pagamentiPerSquadra) {
      const squadra = pagamentiPerSquadra[squadraId];
      if (squadra.casse_societarie < squadra.totale) {
        return res.status(400).json({ 
          error: `Fondi insufficienti per la squadra ${squadra.squadra_nome}` 
        });
      }
    }

    // 6. Aggiorna casse societarie per ogni squadra
    for (const squadraId in pagamentiPerSquadra) {
      const squadra = pagamentiPerSquadra[squadraId];
      const nuoveCasse = squadra.casse_societarie - squadra.totale;
      await db.query(
        'UPDATE squadre SET casse_societarie = $1 WHERE id = $2',
        [nuoveCasse, squadra.squadra_id]
      );
    }

    // 7. Aggiorna timestamp e anni contratto per tutti i giocatori
    const giocatoriPlaceholders = giocatoriIds.map((_, index) => `$${index + 1}`).join(',');
    await db.query(
      `UPDATE giocatori 
       SET ultimo_pagamento_contratto = NOW(),
           anni_contratto = CASE 
             WHEN anni_contratto > 0 THEN anni_contratto - 1 
             ELSE 0 
           END
       WHERE id IN (${giocatoriPlaceholders})`,
      giocatoriIds
    );

    // 8. Registra i pagamenti nel log
    for (const giocatore of giocatori) {
      await createLogContratto({
        giocatore_id: giocatore.id,
        squadra_id: giocatore.squadra_id,
        tipo: 'pagamento_contratto',
        valore_prima: giocatore.casse_societarie,
        valore_dopo: giocatore.casse_societarie - giocatore.costo_attuale,
        importo: giocatore.costo_attuale,
        note: `Pagamento contratto ${giocatore.nome}`
      });
    }

    // 9. Crea notifica
    const totalePagato = giocatori.reduce((sum, g) => sum + (g.costo_attuale || 0), 0);
    await db.query(
      `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
       VALUES ($1, 'pagamento_contratti_multipli', $2, NOW())`,
      [userId, `Pagati contratti per ${giocatori.length} giocatori - Totale: FM ${totalePagato}`]
    );

    res.json({ 
      success: true, 
      message: `Pagati contratti per ${giocatori.length} giocatori`,
      totale_pagato: totalePagato,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore pagamento contratti multipli:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Rinnova contratto giocatore
router.post('/rinnova/:giocatoreId', requireAuth, async (req, res) => {
  const { giocatoreId } = req.params;
  const { anniRinnovo } = req.body;

  if (!anniRinnovo || anniRinnovo < 1 || anniRinnovo > 4) {
    return res.status(400).json({ error: 'Anni di rinnovo non validi (1-4)' });
  }

  try {
    const db = getDb();

    // 1. Ottieni informazioni giocatore e squadra
    const giocatoreResult = await db.query(
      `SELECT g.*, s.casse_societarie, s.id as squadra_id 
       FROM giocatori g 
       JOIN squadre s ON g.squadra_id = s.id 
       WHERE g.id = $1`,
      [giocatoreId]
    );

    if (giocatoreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    const giocatore = giocatoreResult.rows[0];

    // 2. Verifica che il giocatore non sia in Roster B (non può essere modificato)
    if (giocatore.roster === 'B') {
      return res.status(400).json({ error: 'Non puoi rinnovare contratti per giocatori in Roster B' });
    }

    // 3. Verifica se ci sono abbastanza fondi
    if (giocatore.casse_societarie < giocatore.quotazione_attuale) {
      return res.status(400).json({ error: 'Fondi insufficienti per il rinnovo' });
    }

    // 3. Calcola nuovi anni contratto
    const nuoviAnniContratto = (giocatore.anni_contratto || 0) + anniRinnovo;

    // 4. Aggiorna casse societarie
    const nuoveCasse = giocatore.casse_societarie - giocatore.quotazione_attuale;
    await db.query(
      'UPDATE squadre SET casse_societarie = $1 WHERE id = $2',
      [nuoveCasse, giocatore.squadra_id]
    );

    // 5. Aggiorna anni contratto e timestamp
    await db.query(
      `UPDATE giocatori 
       SET anni_contratto = $1, ultimo_rinnovo_contratto = NOW()
       WHERE id = $2`,
      [nuoviAnniContratto, giocatoreId]
    );

    // 6. Registra il rinnovo nel log
    await createLogContratto({
      giocatore_id: giocatoreId,
      squadra_id: giocatore.squadra_id,
      tipo: 'rinnovo_contratto',
      valore_prima: giocatore.casse_societarie,
      valore_dopo: nuoveCasse,
      importo: giocatore.quotazione_attuale,
      note: `Rinnovo contratto ${giocatore.nome} per ${anniRinnovo} anni`
    });

    // 7. Crea notifica per il rinnovo
    await db.query(
      `INSERT INTO notifiche (utente_id, tipo, messaggio, data_creazione)
       VALUES ($1, 'rinnovo_contratto', $2, NOW())`,
      [giocatore.proprietario_id, `Contratto rinnovato per ${giocatore.nome} - ${anniRinnovo} anni - FM ${giocatore.quotazione_attuale}`]
    );

    res.json({ 
      success: true, 
      message: 'Contratto rinnovato con successo',
      nuoviAnniContratto: nuoviAnniContratto,
      nuoveCasse: nuoveCasse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore rinnovo contratto:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiorna impostazioni trasferimento/prestito
router.post('/impostazioni/:giocatoreId', requireAuth, async (req, res) => {
  const { giocatoreId } = req.params;
  const { prestito, valorePrestito, trasferimento, valoreTrasferimento } = req.body;
  const userId = req.user.id;

  try {
    const db = getDb();

    // 1. Verifica che il giocatore appartenga alla squadra dell'utente
    const giocatoreResult = await db.query(
      `SELECT g.*, s.proprietario_id 
       FROM giocatori g 
       JOIN squadre s ON g.squadra_id = s.id 
       WHERE g.id = $1 AND s.proprietario_id = $2`,
      [giocatoreId, userId]
    );

    if (giocatoreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato o non autorizzato' });
    }

    const giocatore = giocatoreResult.rows[0];

    // 2. Verifica che il giocatore non sia in Roster B (non può essere modificato)
    if (giocatore.roster === 'B') {
      return res.status(400).json({ error: 'Non puoi modificare impostazioni per giocatori in Roster B' });
    }

    // 3. Aggiorna le impostazioni
    const updateData = {};
    if (prestito !== undefined) {
      updateData.prestito = prestito ? 1 : 0;
      updateData.valore_prestito = valorePrestito || 0;
    }
    if (trasferimento !== undefined) {
      updateData.trasferimento = trasferimento ? 1 : 0;
      updateData.valore_trasferimento = valoreTrasferimento || 0;
    }

    const updateFields = Object.keys(updateData).map(field => `${field} = $${Object.keys(updateData).length + 1}`).join(', ');
    const updateValues = Object.values(updateData);

    await db.query(
      `UPDATE giocatori SET ${updateFields} WHERE id = $${Object.keys(updateData).length + 2}`,
      [...updateValues, giocatoreId]
    );

    res.json({ 
      success: true, 
      message: 'Impostazioni aggiornate con successo'
    });
  } catch (error) {
    console.error('Errore aggiornamento impostazioni:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni log contratti per squadra
router.get('/log/:squadraId', requireAuth, async (req, res) => {
  const { squadraId } = req.params;
  
  try {
    const log = await getLogContrattiBySquadra(squadraId);
    res.json({ log });
  } catch (error) {
    console.error('Errore recupero log:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Ottieni log rinnovi contratto per un giocatore
router.get('/log-giocatore/:giocatoreId', requireAuth, async (req, res) => {
  const { giocatoreId } = req.params;
  try {
    const log = await getLogContrattiBySquadra(null, giocatoreId, 'rinnovo_contratto');
    res.json({ log });
  } catch (error) {
    console.error('Errore recupero log rinnovi:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
});

export default router; 