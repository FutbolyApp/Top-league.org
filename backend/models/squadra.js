import { getDb } from '../db/mariadb.js';

export async function createSquadra(data) {
  try {
    console.log(`🔄 Creando squadra nel database:`, JSON.stringify(data, null, 2));
    
    const db = getDb();
    const sql = `INSERT INTO squadre (lega_id, nome, proprietario_id, club_level, casse_societarie, costo_salariale_totale, costo_salariale_annuale, valore_squadra, is_orfana)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      data.lega_id,
      data?.nome || 'Nome',
      data.proprietario_id || null,
      data.club_level || 1,
      data.casse_societarie || 0,
      data.costo_salariale_totale || 0,
      data.costo_salariale_annuale || 0,
      data.valore_squadra || 0,
      data.is_orfana ? true : false
    ];
    
    console.log(`🔄 SQL: ${sql}`);
    console.log(`🔄 Parametri:`, JSON.stringify(params, null, 2));
    
    const result = await db.query(sql, params);
    const squadraId = result.insertId;
    
    console.log(`✅ Squadra creata con successo. ID: ${squadraId}`);
    return squadraId;
  } catch (error) {
    console.error(`❌ Errore creazione squadra ${data?.nome || 'Nome'}:`, error.message);
    console.error(`❌ Stack trace:`, error.stack);
    console.error(`❌ Dati squadra:`, JSON.stringify(data, null, 2));
    throw error;
  }
}

export async function getSquadraById(id) {
  const db = getDb();
  const result = await db.query(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN 'Futboly'
             ELSE COALESCE(u.nome, 'Nome') 
           END as proprietario_nome,
           CASE 
             WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN ''
             ELSE COALESCE(u.cognome, '') 
           END as proprietario_cognome
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    WHERE s.id = ?
  `, [id]);
  
  return result.rows[0] || null;
}

export async function getSquadreByLega(lega_id) {
  const db = getDb();
  
  try {
    // Query semplificata senza STRING_AGG per evitare problemi
    const result = await db.query(`
      SELECT s.*, 
             u.username as proprietario_username,
             CASE 
               WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN 'Futboly'
               ELSE COALESCE(u.nome, 'Nome') 
             END as proprietario_nome,
             CASE 
               WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN ''
               ELSE COALESCE(u.cognome, '') 
             END as proprietario_cognome,
             COALESCE((
               SELECT SUM(COALESCE(g.quotazione_attuale, 0))
               FROM giocatori g
               WHERE g.squadra_id = s.id
             ), 0) as valore_attuale_qa
      FROM squadre s
      LEFT JOIN users u ON s.proprietario_id = u.id
      WHERE s.lega_id = ?
      ORDER BY s.nome
    `, [lega_id]);
    
    // Aggiungi i tornei separatamente per evitare problemi con STRING_AGG
    for (const squadra of result.rows) {
      try {
        const torneiResult = await db.query(`
          SELECT t.id, t.nome
          FROM tornei_squadre ts
          JOIN tornei t ON ts.torneo_id = t.id
          WHERE ts.squadra_id = ?
          ORDER BY t.nome
        `, [squadra.id]);
        
        squadra.tornei = torneiResult.rows;
        squadra.tornei_nomi = torneiResult.rows.map(t => t.nome).join(', ');
        squadra.tornei_ids = torneiResult.rows.map(t => t.id.toString()).join(', ');
      } catch (error) {
        console.error(`Errore recupero tornei per squadra ${squadra.id}:`, error);
        squadra.tornei = [];
        squadra.tornei_nomi = '';
        squadra.tornei_ids = '';
      }
    }
    
    return result.rows;
  } catch (error) {
    console.error('Errore in getSquadreByLega:', error);
    throw error;
  }
}

export async function getAllSquadre() {
  const db = getDb();
  const result = await db.query(`
    SELECT s.*, 
           u.username as proprietario_username,
           CASE 
             WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN 'Futboly'
             ELSE COALESCE(u.nome, 'Nome') 
           END as proprietario_nome,
           CASE 
             WHEN COALESCE(u.ruolo, 'Ruolo') = 'SuperAdmin' THEN ''
             ELSE COALESCE(u.cognome, '') 
           END as proprietario_cognome
    FROM squadre s
    LEFT JOIN users u ON s.proprietario_id = u.id
    ORDER BY s.nome
  `);
  
  return result.rows;
}

export async function updateSquadra(id, data) {
  const db = getDb();
  const sql = `UPDATE squadre SET lega_id=?, nome=?, proprietario_id=?, club_level=?, casse_societarie=?, costo_salariale_totale=?, costo_salariale_annuale=?, valore_squadra=?, is_orfana=? WHERE id=?`;
  await db.query(sql, [
    data.lega_id,
    data?.nome || 'Nome',
    data.proprietario_id || null,
    data.club_level || 1,
    data.casse_societarie || 0,
    data.costo_salariale_totale || 0,
    data.costo_salariale_annuale || 0,
    data.valore_squadra || 0,
    data.is_orfana ? true : false,
    id
  ]);
}

export async function updateSquadraPartial(id, updates) {
  const db = getDb();
  
  // Costruisci dinamicamente la query UPDATE
  const fields = [];
  const values = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });
  
  values.push(id);
  
  const sql = `UPDATE squadre SET ${fields.join(', ')} WHERE id = ?`;
  await db.query(sql, values);
}

export async function deleteSquadra(id) {
  const db = getDb();
  await db.query('DELETE FROM squadre WHERE id = ?', [id]);
} 