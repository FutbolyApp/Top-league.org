import { getDb } from '../db/postgres.js';

const db = getDb();

// Validazione bilancio squadra
export const validateBudget = async (req, res, next) => {
  const { squadra_id, importo } = req.body;
  
  try {
    db.get(
      'SELECT casse_societarie FROM squadre WHERE id = ?',
      [squadra_id],
      (err, squadra) => {
        if (err) {
          return res.status(500).json({ error: 'Errore nel controllo bilancio' });
        }
        
        if (!squadra) {
          return res.status(404).json({ error: 'Squadra non trovata' });
        }
        
        if (squadra.casse_societarie < importo) {
          return res.status(400).json({ 
            error: 'Fondi insufficienti',
            casse_disponibili: squadra.casse_societarie,
            importo_richiesto: importo
          });
        }
        
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
};

// Validazione offerta (non più del valore del giocatore)
export const validateOfferta = async (req, res, next) => {
  const { giocatore_id, valore } = req.body;
  
  try {
    db.get(
      'SELECT costo_attuale FROM giocatori WHERE id = ?',
      [giocatore_id],
      (err, giocatore) => {
        if (err) {
          return res.status(500).json({ error: 'Errore nel controllo giocatore' });
        }
        
        if (!giocatore) {
          return res.status(404).json({ error: 'Giocatore non trovato' });
        }
        
        if (valore > giocatore.costo_attuale * 1.5) {
          return res.status(400).json({ 
            error: 'Offerta troppo alta',
            valore_massimo: giocatore.costo_attuale * 1.5,
            valore_offerto: valore
          });
        }
        
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
};

// Validazione limiti roster
export const validateRosterLimits = async (req, res, next) => {
  const { squadra_id, lega_id } = req.body;
  
  try {
    // Ottieni limiti della lega
    db.get(
      'SELECT min_giocatori, max_giocatori FROM leghe WHERE id = ?',
      [lega_id],
      (err, lega) => {
        if (err) {
          return res.status(500).json({ error: 'Errore nel controllo lega' });
        }
        
        // Conta giocatori attuali
        db.get(
          'SELECT COUNT(*) as count FROM giocatori WHERE squadra_id = ?',
          [squadra_id],
          (err, result) => {
            if (err) {
              return res.status(500).json({ error: 'Errore nel conteggio giocatori' });
            }
            
            const giocatoriAttuali = result.count;
            
            if (giocatoriAttuali >= lega.max_giocatori) {
              return res.status(400).json({ 
                error: 'Roster al massimo',
                giocatori_attuali: giocatoriAttuali,
                limite_massimo: lega.max_giocatori
              });
            }
            
            next();
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
};

// Validazione unicità squadra per utente per lega
export const validateSquadraUnica = async (req, res, next) => {
  const { utente_id, lega_id } = req.body;
  
  try {
    db.get(
      'SELECT id FROM squadre WHERE proprietario_id = ? AND lega_id = ?',
      [utente_id, lega_id],
      (err, squadra) => {
        if (err) {
          return res.status(500).json({ error: 'Errore nel controllo squadra' });
        }
        
        if (squadra) {
          return res.status(400).json({ 
            error: 'Utente già proprietario di una squadra in questa lega',
            squadra_id: squadra.id
          });
        }
        
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
};

// Validazione scadenza contratti
export const validateContractExpiry = async (req, res, next) => {
  const { giocatore_id } = req.params;
  
  try {
    db.get(
      'SELECT contratto_scadenza FROM giocatori WHERE id = ?',
      [giocatore_id],
      (err, giocatore) => {
        if (err) {
          return res.status(500).json({ error: 'Errore nel controllo contratto' });
        }
        
        if (!giocatore) {
          return res.status(404).json({ error: 'Giocatore non trovato' });
        }
        
        if (giocatore.contratto_scadenza && new Date(giocatore.contratto_scadenza) < new Date()) {
          return res.status(400).json({ 
            error: 'Contratto scaduto',
            scadenza: giocatore.contratto_scadenza
          });
        }
        
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
}; 