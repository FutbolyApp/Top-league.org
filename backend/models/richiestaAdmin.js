import { getDb } from '../db/postgres.js';

export async function createRichiestaAdmin(squadra_id, tipo_richiesta, dati_richiesta) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const dati_json = JSON.stringify(dati_richiesta);
    const result = await db.query(
      'INSERT INTO richieste_admin (squadra_id, tipo_richiesta, dati_richiesta) VALUES ($1, $2, $3) RETURNING id',
      [squadra_id, tipo_richiesta, dati_json]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Errore in createRichiestaAdmin:', error);
    throw error;
  }
}

export async function getRichiesteBySquadra(squadra_id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const result = await db.query(
      'SELECT * FROM richieste_admin WHERE squadra_id = $1 ORDER BY data_creazione DESC',
      [squadra_id]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Errore in getRichiesteBySquadra:', error);
    throw error;
  }
}

export async function getRichiestePendingByLega(lega_id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const result = await db.query(`
      SELECT ra.*, s.nome as squadra_nome, s.proprietario_id, u.username as proprietario_username
      FROM richieste_admin ra
      JOIN squadre s ON ra.squadra_id = s.id
      JOIN users u ON s.proprietario_id = u.id
      WHERE s.lega_id = $1 AND ra.stato = 'pending'
      ORDER BY ra.data_creazione DESC
    `, [lega_id]);
    
    return result.rows;
  } catch (error) {
    console.error('Errore in getRichiestePendingByLega:', error);
    throw error;
  }
}

export async function updateRichiestaStato(richiesta_id, stato, note_admin) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const data_risposta = new Date().toISOString();
    await db.query(
      'UPDATE richieste_admin SET stato = $1, data_risposta = $2, note_admin = $3 WHERE id = $4',
      [stato, data_risposta, note_admin, richiesta_id]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Errore in updateRichiestaStato:', error);
    throw error;
  }
}

export async function getRichiestaById(richiesta_id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const result = await db.query(
      'SELECT * FROM richieste_admin WHERE id = $1',
      [richiesta_id]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Errore in getRichiestaById:', error);
    throw error;
  }
}

export async function deleteRichiestaAdmin(id) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const result = await db.query('DELETE FROM richieste_admin WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      throw new Error('Richiesta non trovata');
    }
    
    return { id };
  } catch (error) {
    console.error('Errore in deleteRichiestaAdmin:', error);
    throw error;
  }
}

 