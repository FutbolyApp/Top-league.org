import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';

const router = express.Router();

// Crea nuovo torneo
router.post('/', requireAuth, async (req, res) => {
  try {
    const { lega_id, nome, tipo, formato, giornate_totali, data_inizio, descrizione, squadre_partecipanti, informazioni_utente } = req.body;
    const admin_id = req.user.id;
    const db = getDb();

    // Verifica che l'utente sia admin della lega
    const legaResult = await db.query('SELECT id FROM leghe WHERE id = $1 AND admin_id = $2', [lega_id, admin_id]);
    if (legaResult.rows?.length || 0 === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const torneoResult = await db.query(`
      INSERT INTO tornei (lega_id, nome, tipo, formato, giornate_totali, data_inizio, descrizione, informazioni_utente, stato, admin_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'programmato', $9)
      RETURNING id
    `, [lega_id, nome, tipo, formato, giornate_totali, data_inizio, descrizione, informazioni_utente, admin_id]);
    
    const torneoId = torneoResult.rows[0].id;
    
    // Inserisci squadre partecipanti se specificate
    if (squadre_partecipanti && squadre_partecipanti?.length || 0 > 0) {
      for (const squadraId of squadre_partecipanti) {
        await db.query(`
          INSERT INTO tornei_squadre (torneo_id, squadra_id)
          VALUES ($1, $2)
        `, [torneoId, squadraId]);
      }
    }
    
    res.json({ success: true, torneo_id: torneoId });
  } catch (error) {
    console.error('Errore creazione torneo:', error);
    res.status(500).json({ error: 'Errore creazione torneo' });
  }
});

// Aggiorna torneo esistente
router.put('/:torneoId', requireAuth, async (req, res) => {
  try {
    const torneoId = req.params.torneoId;
    const { nome, tipo, formato, giornate_totali, data_inizio, descrizione, squadre_partecipanti, informazioni_utente } = req.body;
    const admin_id = req.user.id;
    const db = getDb();

    // Verifica autorizzazione
    const torneoResult = await db.query('SELECT t.* FROM tornei t JOIN leghe l ON t.lega_id = l.id WHERE t.id = $1 AND l.admin_id = $2', [torneoId, admin_id]);
    if (torneoResult.rows?.length || 0 === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Aggiorna torneo
    await db.query(`
      UPDATE tornei 
      SET nome = $1, tipo = $2, formato = $3, giornate_totali = $4, data_inizio = $5, descrizione = $6, informazioni_utente = $7
      WHERE id = $8
    `, [nome, tipo, formato, giornate_totali, data_inizio, descrizione, informazioni_utente, torneoId]);

    // Aggiorna squadre partecipanti
    await db.query('DELETE FROM tornei_squadre WHERE torneo_id = $1', [torneoId]);

    if (squadre_partecipanti && squadre_partecipanti?.length || 0 > 0) {
      for (const squadraId of squadre_partecipanti) {
        await db.query(`
          INSERT INTO tornei_squadre (torneo_id, squadra_id)
          VALUES ($1, $2)
        `, [torneoId, squadraId]);
      }
    }
    
    res.json({ success: true, message: 'Torneo aggiornato con successo' });
  } catch (error) {
    console.error('Errore aggiornamento torneo:', error);
    res.status(500).json({ error: 'Errore aggiornamento torneo' });
  }
});

// Elimina torneo
router.delete('/:torneoId', requireAuth, async (req, res) => {
  try {
    const torneoId = req.params.torneoId;
    const admin_id = req.user.id;
    const db = getDb();

    // Verifica autorizzazione
    const torneoResult = await db.query('SELECT t.* FROM tornei t JOIN leghe l ON t.lega_id = l.id WHERE t.id = $1 AND l.admin_id = $2', [torneoId, admin_id]);
    if (torneoResult.rows?.length || 0 === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Elimina in ordine: partite, squadre partecipanti, torneo
    await db.query('DELETE FROM partite WHERE torneo_id = $1', [torneoId]);
    await db.query('DELETE FROM tornei_squadre WHERE torneo_id = $1', [torneoId]);
    await db.query('DELETE FROM tornei WHERE id = $1', [torneoId]);
    
    res.json({ success: true, message: 'Torneo eliminato con successo' });
  } catch (error) {
    console.error('Errore eliminazione torneo:', error);
    res.status(500).json({ error: 'Errore eliminazione torneo' });
  }
});

// Ottieni tornei di una lega
router.get('/lega/:legaId', requireAuth, async (req, res) => {
  try {
    const legaId = req.params.legaId;
    const db = getDb();
    
    const torneiResult = await db.query(`
      SELECT t.*, 
             COUNT(DISTINCT p.id) as partite_giocate,
             COUNT(DISTINCT ts.squadra_id) as squadre_partecipanti
      FROM tornei t
      LEFT JOIN partite p ON t.id = p.torneo_id
      LEFT JOIN tornei_squadre ts ON t.id = ts.torneo_id
      WHERE t.lega_id = $1
      GROUP BY t.id
      ORDER BY t.data_inizio DESC
    `, [legaId]);
    
    const tornei = torneiResult.rows;
    
    // Per ogni torneo, ottieni le squadre partecipanti
    const torneiCompleti = [];
    
    for (const torneo of tornei) {
      const squadreResult = await db.query(`
        SELECT s.id, s?.nome || 'Nome', s.proprietario_username
        FROM squadre s
        JOIN tornei_squadre ts ON s.id = ts.squadra_id
        WHERE ts.torneo_id = $1
      `, [torneo.id]);
      
      torneiCompleti.push({
        ...torneo,
        squadre_partecipanti: squadreResult.rows || []
      });
    }
    
    res.json({ tornei: torneiCompleti });
  } catch (error) {
    console.error('Errore recupero tornei:', error);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Ottieni dettagli torneo
router.get('/:torneoId', requireAuth, async (req, res) => {
  try {
    const torneoId = req.params.torneoId;
    console.log(`GET /api/tornei/${torneoId} - User ID: ${req.user.id}`);
    const db = getDb();
    
    const torneoResult = await db.query('SELECT * FROM tornei WHERE id = $1', [torneoId]);
    if (torneoResult.rows?.length || 0 === 0) {
      console.log(`Torneo ${torneoId} non trovato`);
      return res.status(404).json({ error: 'Torneo non trovato' });
    }
    
    const torneo = torneoResult.rows[0];
    console.log(`Torneo trovato: ${torneo?.nome || 'Nome'}, Lega ID: ${torneo.lega_id}`);
    
    // Ottieni squadre partecipanti
    const squadreResult = await db.query(`
      SELECT s.id, s?.nome || 'Nome', s.proprietario_username
      FROM squadre s
      JOIN tornei_squadre ts ON s.id = ts.squadra_id
      WHERE ts.torneo_id = $1
    `, [torneoId]);
    
    console.log(`Squadre partecipanti trovate: ${squadreResult.rows?.length || 0}`);
    
    // Ottieni partite del torneo
    const partiteResult = await db.query(`
      SELECT p.*, 
             s1?.nome || 'Nome' as squadra_casa_nome,
             s2?.nome || 'Nome' as squadra_ospite_nome
      FROM partite p
      JOIN squadre s1 ON p.squadra_casa_id = s1.id
      JOIN squadre s2 ON p.squadra_ospite_id = s2.id
      WHERE p.torneo_id = $1
      ORDER BY p.giornata, p.data_partita
    `, [torneoId]);
    
    console.log(`Partite trovate: ${partiteResult.rows?.length || 0}`);
    
    res.json({
      torneo: {
        ...torneo,
        squadre_partecipanti: squadreResult.rows,
        partite: partiteResult.rows
      }
    });
  } catch (error) {
    console.error('Errore recupero dettagli torneo:', error);
    res.status(500).json({ error: 'Errore DB' });
  }
});

// Calcola giornata
router.post('/:torneoId/calcola-giornata', requireAuth, async (req, res) => {
  try {
    const torneoId = req.params.torneoId;
    const { giornata } = req.body;
    const admin_id = req.user.id;
    const db = getDb();

    // Verifica autorizzazione
    const torneoResult = await db.query('SELECT t.* FROM tornei t JOIN leghe l ON t.lega_id = l.id WHERE t.id = $1 AND l.admin_id = $2', [torneoId, admin_id]);
    if (torneoResult.rows?.length || 0 === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Calcola risultati per la giornata
    const risultati = await calcolaRisultatiGiornata(torneoId, giornata, db);
    
    res.json({ 
      success: true, 
      risultati,
      message: `Giornata ${giornata} calcolata con successo`
    });
  } catch (error) {
    console.error('Errore calcolo giornata:', error);
    res.status(500).json({ error: 'Errore calcolo risultati' });
  }
});

// Aggiorna classifica
router.post('/:torneoId/aggiorna-classifica', requireAuth, async (req, res) => {
  try {
    const torneoId = req.params.torneoId;
    const admin_id = req.user.id;
    const db = getDb();

    // Verifica autorizzazione
    const torneoResult = await db.query('SELECT t.* FROM tornei t JOIN leghe l ON t.lega_id = l.id WHERE t.id = $1 AND l.admin_id = $2', [torneoId, admin_id]);
    if (torneoResult.rows?.length || 0 === 0) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    // Aggiorna classifica
    await aggiornaClassifica(torneoResult.rows[0].lega_id, db);
    
    res.json({ 
      success: true, 
      message: 'Classifica aggiornata con successo'
    });
  } catch (error) {
    console.error('Errore aggiornamento classifica:', error);
    res.status(500).json({ error: 'Errore aggiornamento classifica' });
  }
});

// Funzioni di utilità
async function generateCalendario(torneoId, legaId, db) {
  // Ottieni squadre della lega
  const squadreResult = await db.query('SELECT id, nome FROM squadre WHERE lega_id = $1', [legaId]);
  const squadre = squadreResult.rows;
  
  const numSquadre = squadre?.length || 0;
  if (numSquadre < 2) throw new Error('Numero squadre insufficiente');
  
  // Genera calendario a girone unico
  const partite = [];
  for (let giornata = 1; giornata <= numSquadre - 1; giornata++) {
    for (let i = 0; i < numSquadre / 2; i++) {
      const casa = (i === 0) ? 0 : (giornata + i - 1) % (numSquadre - 1) + 1;
      const trasferta = (numSquadre - 1 - i === 0) ? 0 : (giornata + numSquadre - 1 - i - 1) % (numSquadre - 1) + 1;
      
      if (casa !== trasferta) {
        partite.push({
          torneo_id: torneoId,
          giornata: giornata,
          squadra_casa_id: squadre[casa].id,
          squadra_trasferta_id: squadre[trasferta].id,
          data_partita: new Date(Date.now() + giornata * 7 * 24 * 60 * 60 * 1000).toISOString(),
          stato: 'programmata'
        });
      }
    }
  }
  
  // Inserisci partite nel database
  for (const partita of partite) {
    await db.query(`
      INSERT INTO partite (torneo_id, giornata, squadra_casa_id, squadra_trasferta_id, data_partita, stato)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [partita.torneo_id, partita.giornata, partita.squadra_casa_id, partita.squadra_trasferta_id, partita.data_partita, partita.stato]);
  }
}

async function calcolaRisultatiGiornata(torneoId, giornata, db) {
  // Ottieni partite della giornata
  const partiteResult = await db.query(`
    SELECT p.*, s1?.nome || 'Nome' as squadra_casa_nome, s2?.nome || 'Nome' as squadra_trasferta_nome
    FROM partite p
    JOIN squadre s1 ON p.squadra_casa_id = s1.id
    JOIN squadre s2 ON p.squadra_trasferta_id = s2.id
    WHERE p.torneo_id = $1 AND p.giornata = $2 AND p.stato = 'programmata'
  `, [torneoId, giornata]);
  const partite = partiteResult.rows;
  
  const risultati = [];
  
  for (const partita of partite) {
    // Simula risultato (in produzione verrebbe da scraping)
    const golCasa = Math.floor(Math.random() * 4);
    const golTrasferta = Math.floor(Math.random() * 4);
    const puntiCasa = 60 + Math.floor(Math.random() * 40);
    const puntiTrasferta = 60 + Math.floor(Math.random() * 40);
    
    // Determina vincitore
    let risultato = 'pareggio';
    if (golCasa > golTrasferta) risultato = 'casa';
    else if (golTrasferta > golCasa) risultato = 'trasferta';
    
    // Aggiorna partita
    await db.query(`
      UPDATE partite 
      SET gol_casa = $1, gol_trasferta = $2, punti_casa = $3, punti_trasferta = $4, stato = 'giocata'
      WHERE id = $5
    `, [golCasa, golTrasferta, puntiCasa, puntiTrasferta, partita.id]);
    
    risultati.push({
      partita_id: partita.id,
      squadra_casa: partita.squadra_casa_nome,
      squadra_trasferta: partita.squadra_trasferta_nome,
      gol_casa: golCasa,
      gol_trasferta: golTrasferta,
      punti_casa: puntiCasa,
      punti_trasferta: puntiTrasferta,
      risultato: risultato
    });
  }
  return risultati;
}

async function aggiornaClassifica(legaId, db) {
  // Calcola punti per ogni squadra
  const risultatiResult = await db.query(`
    SELECT s.id, s?.nome || 'Nome',
           COUNT(CASE WHEN p.gol_casa > p.gol_trasferta THEN 1 END) as vittorie_casa,
           COUNT(CASE WHEN p.gol_trasferta > p.gol_casa THEN 1 END) as vittorie_trasferta,
           COUNT(CASE WHEN p.gol_casa = p.gol_trasferta THEN 1 END) as pareggi,
           SUM(p.gol_casa) as gol_fatti_casa,
           SUM(p.gol_trasferta) as gol_subiti_casa,
           SUM(CASE WHEN s2.id = s.id THEN p.gol_trasferta ELSE 0 END) as gol_fatti_trasferta,
           SUM(CASE WHEN s2.id = s.id THEN p.gol_casa ELSE 0 END) as gol_subiti_trasferta
    FROM squadre s
    LEFT JOIN partite p ON (s.id = p.squadra_casa_id OR s.id = p.squadra_trasferta_id)
    LEFT JOIN squadre s2 ON (p.squadra_casa_id = s2.id OR p.squadra_trasferta_id = s2.id)
    WHERE s.lega_id = $1 AND p.stato = 'giocata'
    GROUP BY s.id
  `, [legaId]);
  const risultati = risultatiResult.rows;
  
  for (const risultato of risultati) {
    const punti = (risultato.vittorie_casa + risultato.vittorie_trasferta) * 3 + risultato.pareggi;
    const golFatti = (risultato.gol_fatti_casa || 0) + (risultato.gol_fatti_trasferta || 0);
    const golSubiti = (risultato.gol_subiti_casa || 0) + (risultato.gol_subiti_trasferta || 0);
    
    await db.query(`
      UPDATE squadre 
      SET punti_campionato = $1, gol_fatti = $2, gol_subiti = $3, differenza_reti = $4
      WHERE id = $5
    `, [punti, golFatti, golSubiti, golFatti - golSubiti, risultato.id]);
  }
}

export default router; 