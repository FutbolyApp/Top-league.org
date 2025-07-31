import { getDb } from '../db/mariadb.js';

// Validazione bilancio squadra
export const validateBudget = async (req, res, next) => {
  const { squadra_id, importo } = req.body;
  
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    const squadraResult = await db.query(
      'SELECT casse_societarie FROM squadre WHERE id = $1',
      [squadra_id]
    );
    
    if (squadraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Squadra non trovata' });
    }
    
    const squadra = squadraResult.rows[0];
    
    if (squadra.casse_societarie < importo) {
      return res.status(400).json({ 
        error: 'Fondi insufficienti',
        casse_disponibili: squadra.casse_societarie,
        importo_richiesto: importo
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
};

// Validazione offerta (non più del valore del giocatore)
export const validateOfferta = async (req, res, next) => {
  const { giocatore_id, valore } = req.body;
  
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    const giocatoreResult = await db.query(
      'SELECT costo_attuale FROM giocatori WHERE id = $1',
      [giocatore_id]
    );
    
    if (giocatoreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }
    
    const giocatore = giocatoreResult.rows[0];
    
    if (valore > giocatore.costo_attuale * 1.5) {
      return res.status(400).json({ 
        error: 'Offerta troppo alta',
        valore_massimo: giocatore.costo_attuale * 1.5,
        valore_offerto: valore
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
};

// Validazione limiti roster
export const validateRosterLimits = async (req, res, next) => {
  const { squadra_id, lega_id } = req.body;
  
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Ottieni limiti della lega
    const legaResult = await db.query(
      'SELECT min_giocatori, max_giocatori FROM leghe WHERE id = $1',
      [lega_id]
    );
    
    if (legaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lega non trovata' });
    }
    
    const lega = legaResult.rows[0];
    
    // Conta giocatori attuali
    const giocatoriResult = await db.query(
      'SELECT COUNT(*) as count FROM giocatori WHERE squadra_id = $1',
      [squadra_id]
    );
    
    const giocatoriAttuali = parseInt(giocatoriResult.rows[0].count);
    
    if (giocatoriAttuali >= lega?.max_giocatori || '') {
      return res.status(400).json({ 
        error: 'Roster al massimo',
        giocatori_attuali: giocatoriAttuali,
        limite_massimo: lega?.max_giocatori || ''
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
};

// Validazione unicità squadra per utente per lega
export const validateSquadraUnica = async (req, res, next) => {
  const { utente_id, lega_id } = req.body;
  
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    const squadraResult = await db.query(
      'SELECT id FROM squadre WHERE proprietario_id = $1 AND lega_id = $2',
      [utente_id, lega_id]
    );
    
    if (squadraResult.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Utente già proprietario di una squadra in questa lega',
        squadra_id: squadraResult.rows[0].id
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
};

// Validazione scadenza contratti
export const validateContractExpiry = async (req, res, next) => {
  const { giocatore_id } = req.params;
  
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    const giocatoreResult = await db.query(
      'SELECT contratto_scadenza FROM giocatori WHERE id = $1',
      [giocatore_id]
    );
    
    if (giocatoreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }
    
    const giocatore = giocatoreResult.rows[0];
    
    if (giocatore.contratto_scadenza && new Date(giocatore.contratto_scadenza) < new Date()) {
      return res.status(400).json({ 
        error: 'Contratto scaduto',
        scadenza: giocatore.contratto_scadenza
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
}; 