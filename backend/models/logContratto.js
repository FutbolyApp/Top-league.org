import { getDb } from '../db/postgres.js';

export async function createLogContratto(data) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const sql = `INSERT INTO log_contratti (giocatore_id, squadra_id, tipo, valore_prima, valore_dopo, importo, note)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    
    const result = await db.query(sql, [
      data.giocatore_id,
      data.squadra_id,
      data.tipo,
      data.valore_prima || null,
      data.valore_dopo || null,
      data.importo || null,
      data.note || null
    ]);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Errore in createLogContratto:', error);
    throw error;
  }
}

export async function getLogContrattiBySquadra(squadra_id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const sql = `
      SELECT lc.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome
      FROM log_contratti lc
      JOIN giocatori g ON lc.giocatore_id = g.id
      WHERE lc.squadra_id = $1
      ORDER BY lc.data_operazione DESC
      LIMIT 50
    `;
    
    const result = await db.query(sql, [squadra_id]);
    return result.rows;
  } catch (error) {
    console.error('Errore in getLogContrattiBySquadra:', error);
    throw error;
  }
}

export async function getLogContrattiByGiocatore(giocatore_id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const sql = `
      SELECT lc.*, g.nome as giocatore_nome, g.cognome as giocatore_cognome
      FROM log_contratti lc
      JOIN giocatori g ON lc.giocatore_id = g.id
      WHERE lc.giocatore_id = $1
      ORDER BY lc.data_operazione DESC
      LIMIT 20
    `;
    
    const result = await db.query(sql, [giocatore_id]);
    return result.rows;
  } catch (error) {
    console.error('Errore in getLogContrattiByGiocatore:', error);
    throw error;
  }
} 