import { getDb } from '../db/postgres.js';

export async function createSquadra(data) {
  const db = getDb();
  const sql = `INSERT INTO squadre (lega_id, nome, proprietario_id, club_level, casse_societarie, costo_salariale_totale, costo_salariale_annuale, valore_squadra, is_orfana)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;
  const result = await db.query(sql, [
    data.lega_id,
    data.nome,
    data.proprietario_id || null,
    data.club_level || 1,
    data.casse_societarie || 0,
    data.costo_salariale_totale || 0,
    data.costo_salariale_annuale || 0,
    data.valore_squadra || 0,
    data.is_orfana ? true : false
  ]);
  return result.rows[0].id;
}

export async function getSquadraById(id) {
  const db = getDb();
  const result = await db.query(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome 
           END as proprietario_nome,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN ''
             ELSE u.cognome 
           END as proprietario_cognome
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    WHERE s.id = $1
  `, [id]);
  
  return result.rows[0] || null;
}

export async function getSquadreByLega(lega_id) {
  const db = getDb();
  const result = await db.query(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome 
           END as proprietario_nome,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN ''
             ELSE u.cognome 
           END as proprietario_cognome,
           STRING_AGG(t.nome, ', ') as tornei_nomi,
           STRING_AGG(t.id::text, ', ') as tornei_ids,
           COALESCE((
             SELECT SUM(COALESCE(g.qa, g.quotazione_attuale, 0))
             FROM giocatori g
             WHERE g.squadra_id = s.id
           ), 0) as valore_attuale_qa
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    LEFT JOIN tornei_squadre ts ON s.id = ts.squadra_id
    LEFT JOIN tornei t ON ts.torneo_id = t.id
    WHERE s.lega_id = $1
    GROUP BY s.id, u.username, u.nome, u.cognome, u.ruolo
  `, [lega_id]);
  
  return result.rows;
}

export async function getAllSquadre() {
  const db = getDb();
  const result = await db.query(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN 'Futboly'
             ELSE u.nome 
           END as proprietario_nome,
           CASE 
             WHEN u.ruolo = 'SuperAdmin' THEN ''
             ELSE u.cognome 
           END as proprietario_cognome
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
  `);
  
  return result.rows;
}

export async function updateSquadra(id, data) {
  const db = getDb();
  const sql = `UPDATE squadre SET lega_id=$1, nome=$2, proprietario_id=$3, club_level=$4, casse_societarie=$5, costo_salariale_totale=$6, costo_salariale_annuale=$7, valore_squadra=$8, is_orfana=$9, logo_url=$10 WHERE id=$11`;
  await db.query(sql, [
    data.lega_id,
    data.nome,
    data.proprietario_id || null,
    data.club_level || 1,
    data.casse_societarie || 0,
    data.costo_salariale_totale || 0,
    data.costo_salariale_annuale || 0,
    data.valore_squadra || 0,
    data.is_orfana ? true : false,
    data.logo_url || null,
    id
  ]);
}

export async function updateSquadraPartial(id, updates) {
  // First get the current squad data
  const squadra = await getSquadraById(id);
  if (!squadra) {
    throw new Error('Squadra non trovata');
  }

  // Merge current data with updates
  const updatedData = {
    lega_id: squadra.lega_id,
    nome: squadra.nome,
    proprietario_id: squadra.proprietario_id,
    club_level: squadra.club_level,
    casse_societarie: squadra.casse_societarie,
    costo_salariale_totale: squadra.costo_salariale_totale,
    costo_salariale_annuale: squadra.costo_salariale_annuale,
    valore_squadra: squadra.valore_squadra,
    is_orfana: squadra.is_orfana,
    logo_url: squadra.logo_url,
    ...updates // Override with provided updates
  };

  // Use the existing updateSquadra function
  await updateSquadra(id, updatedData);
}

export async function deleteSquadra(id) {
  const db = getDb();
  await db.query('DELETE FROM squadre WHERE id = $1', [id]);
} 