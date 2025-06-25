import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/config.js';

const router = express.Router();
const db = getDb();

// Crea nuovo torneo
router.post('/', requireAuth, (req, res) => {
  const { lega_id, nome, tipo, formato, giornate_totali, data_inizio } = req.body;
  const admin_id = req.user.id;

  // Verifica che l'utente sia admin della lega
  db.get('SELECT id FROM leghe WHERE id = ? AND admin_id = ?', [lega_id, admin_id], (err, lega) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!lega) return res.status(403).json({ error: 'Non autorizzato' });

    db.run(`
      INSERT INTO tornei (lega_id, nome, tipo, formato, giornate_totali, data_inizio, stato, admin_id)
      VALUES (?, ?, ?, ?, ?, ?, 'in_corso', ?)
    `, [lega_id, nome, tipo, formato, giornate_totali, data_inizio, admin_id], function(err) {
      if (err) return res.status(500).json({ error: 'Errore creazione torneo' });
      
      const torneoId = this.lastID;
      
      // Genera calendario automatico
      generateCalendario(torneoId, lega_id, (err) => {
        if (err) {
          console.error('Errore generazione calendario:', err);
        }
        res.json({ success: true, torneo_id: torneoId });
      });
    });
  });
});

// Ottieni tornei di una lega
router.get('/lega/:legaId', requireAuth, (req, res) => {
  const legaId = req.params.legaId;
  
  db.all(`
    SELECT t.*, 
           COUNT(DISTINCT p.id) as partite_giocate,
           COUNT(DISTINCT p.id) as partite_totali
    FROM tornei t
    LEFT JOIN partite p ON t.id = p.torneo_id
    WHERE t.lega_id = ?
    GROUP BY t.id
    ORDER BY t.data_inizio DESC
  `, [legaId], (err, tornei) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    res.json({ tornei });
  });
});

// Ottieni dettagli torneo
router.get('/:torneoId', requireAuth, (req, res) => {
  const torneoId = req.params.torneoId;
  
  db.get('SELECT * FROM tornei WHERE id = ?', [torneoId], (err, torneo) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!torneo) return res.status(404).json({ error: 'Torneo non trovato' });
    
    // Ottieni classifica
    db.all(`
      SELECT s.id, s.nome, s.punti_campionato, s.gol_fatti, s.gol_subiti,
             (s.gol_fatti - s.gol_subiti) as differenza_reti
      FROM squadre s
      WHERE s.lega_id = ?
      ORDER BY s.punti_campionato DESC, differenza_reti DESC
    `, [torneo.lega_id], (err, classifica) => {
      if (err) return res.status(500).json({ error: 'Errore DB' });
      
      // Ottieni calendario
      db.all(`
        SELECT p.*, 
               s1.nome as squadra_casa_nome,
               s2.nome as squadra_trasferta_nome
        FROM partite p
        JOIN squadre s1 ON p.squadra_casa_id = s1.id
        JOIN squadre s2 ON p.squadra_trasferta_id = s2.id
        WHERE p.torneo_id = ?
        ORDER BY p.giornata, p.data_partita
      `, [torneoId], (err, calendario) => {
        if (err) return res.status(500).json({ error: 'Errore DB' });
        
        res.json({ 
          torneo, 
          classifica, 
          calendario 
        });
      });
    });
  });
});

// Calcola giornata
router.post('/:torneoId/calcola-giornata', requireAuth, (req, res) => {
  const torneoId = req.params.torneoId;
  const { giornata } = req.body;
  const admin_id = req.user.id;

  // Verifica autorizzazione
  db.get('SELECT t.* FROM tornei t JOIN leghe l ON t.lega_id = l.id WHERE t.id = ? AND l.admin_id = ?', 
    [torneoId, admin_id], (err, torneo) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!torneo) return res.status(403).json({ error: 'Non autorizzato' });

    // Calcola risultati per la giornata
    calcolaRisultatiGiornata(torneoId, giornata, (err, risultati) => {
      if (err) return res.status(500).json({ error: 'Errore calcolo risultati' });
      
      res.json({ 
        success: true, 
        risultati,
        message: `Giornata ${giornata} calcolata con successo`
      });
    });
  });
});

// Aggiorna classifica
router.post('/:torneoId/aggiorna-classifica', requireAuth, (req, res) => {
  const torneoId = req.params.torneoId;
  const admin_id = req.user.id;

  // Verifica autorizzazione
  db.get('SELECT t.* FROM tornei t JOIN leghe l ON t.lega_id = l.id WHERE t.id = ? AND l.admin_id = ?', 
    [torneoId, admin_id], (err, torneo) => {
    if (err) return res.status(500).json({ error: 'Errore DB' });
    if (!torneo) return res.status(403).json({ error: 'Non autorizzato' });

    // Aggiorna classifica
    aggiornaClassifica(torneo.lega_id, (err) => {
      if (err) return res.status(500).json({ error: 'Errore aggiornamento classifica' });
      
      res.json({ 
        success: true, 
        message: 'Classifica aggiornata con successo'
      });
    });
  });
});

// Funzioni di utilità
function generateCalendario(torneoId, legaId, callback) {
  // Ottieni squadre della lega
  db.all('SELECT id, nome FROM squadre WHERE lega_id = ?', [legaId], (err, squadre) => {
    if (err) return callback(err);
    
    const numSquadre = squadre.length;
    if (numSquadre < 2) return callback(new Error('Numero squadre insufficiente'));
    
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
    let completate = 0;
    partite.forEach(partita => {
      db.run(`
        INSERT INTO partite (torneo_id, giornata, squadra_casa_id, squadra_trasferta_id, data_partita, stato)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [partita.torneo_id, partita.giornata, partita.squadra_casa_id, partita.squadra_trasferta_id, partita.data_partita, partita.stato], (err) => {
        if (err) console.error('Errore inserimento partita:', err);
        completate++;
        if (completate === partite.length) {
          callback(null);
        }
      });
    });
  });
}

function calcolaRisultatiGiornata(torneoId, giornata, callback) {
  // Ottieni partite della giornata
  db.all(`
    SELECT p.*, s1.nome as squadra_casa_nome, s2.nome as squadra_trasferta_nome
    FROM partite p
    JOIN squadre s1 ON p.squadra_casa_id = s1.id
    JOIN squadre s2 ON p.squadra_trasferta_id = s2.id
    WHERE p.torneo_id = ? AND p.giornata = ? AND p.stato = 'programmata'
  `, [torneoId, giornata], (err, partite) => {
    if (err) return callback(err);
    
    const risultati = [];
    let completate = 0;
    
    partite.forEach(partita => {
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
      db.run(`
        UPDATE partite 
        SET gol_casa = ?, gol_trasferta = ?, punti_casa = ?, punti_trasferta = ?, stato = 'giocata'
        WHERE id = ?
      `, [golCasa, golTrasferta, puntiCasa, puntiTrasferta, partita.id], (err) => {
        if (err) console.error('Errore aggiornamento partita:', err);
        
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
        
        completate++;
        if (completate === partite.length) {
          callback(null, risultati);
        }
      });
    });
  });
}

function aggiornaClassifica(legaId, callback) {
  // Calcola punti per ogni squadra
  db.all(`
    SELECT s.id, s.nome,
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
    WHERE s.lega_id = ? AND p.stato = 'giocata'
    GROUP BY s.id
  `, [legaId], (err, risultati) => {
    if (err) return callback(err);
    
    let aggiornate = 0;
    risultati.forEach(risultato => {
      const punti = (risultato.vittorie_casa + risultato.vittorie_trasferta) * 3 + risultato.pareggi;
      const golFatti = (risultato.gol_fatti_casa || 0) + (risultato.gol_fatti_trasferta || 0);
      const golSubiti = (risultato.gol_subiti_casa || 0) + (risultato.gol_subiti_trasferta || 0);
      
      db.run(`
        UPDATE squadre 
        SET punti_campionato = ?, gol_fatti = ?, gol_subiti = ?, differenza_reti = ?
        WHERE id = ?
      `, [punti, golFatti, golSubiti, golFatti - golSubiti, risultato.id], (err) => {
        if (err) console.error('Errore aggiornamento squadra:', err);
        aggiornate++;
        if (aggiornate === risultati.length) {
          callback(null);
        }
      });
    });
  });
}

export default router; 