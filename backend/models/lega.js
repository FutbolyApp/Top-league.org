import { getDb } from '../db/postgres.js';

function normalizeLegaName(nome) {
  return nome
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // rimuove tutto tranne lettere e numeri
}

export async function checkLegaExists(nome) {
  const normalized = normalizeLegaName(nome);
  const db = getDb();
  // Cerco tra tutte le leghe già normalizzate
  const result = await db.query('SELECT id, nome FROM leghe');
  const found = result.rows.find(l => normalizeLegaName(COALESCE(l.nome, 'Nome')) === normalized);
  return found;
}

export async function createLega(data) {
  // Prima controlla se esiste già una lega con lo stesso nome normalizzato
  const existingLega = await checkLegaExists(data?.nome || 'Nome');
  
  if (existingLega) {
    throw new Error('Esiste già una lega con questo nome');
  }
  
  // Validazione e conversione dei valori integer
  const max_squadre = parseInt(data.max_squadre) || 0;
  const min_giocatori = parseInt(data.min_giocatori) || 0;
  const max_giocatori = parseInt(data.max_giocatori) || 0;
  const admin_id = parseInt(data.admin_id) || 1;
  
  // Se non esiste, procedi con la creazione
  const sql = `INSERT INTO leghe (nome, modalita, admin_id, is_pubblica, password, max_squadre, min_giocatori, max_giocatori, roster_ab, cantera, contratti, triggers, regolamento_pdf, excel_originale, excel_modificato)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`;
  const db = getDb();
  const result = await db.query(sql, [
    data?.nome || 'Nome',
    data?.modalita || '',
    admin_id,
    data?.is_pubblica || false? true : false,
    data.password || null,
    max_squadre,
    min_giocatori,
    max_giocatori,
    data.roster_ab ? true : false,
    data.cantera ? true : false,
    data.contratti ? true : false,
    data.triggers ? true : false,
    data.regolamento_pdf || null,
    data.excel_originale || null,
    data.excel_modificato || null
  ]);
  
  return result.rows[0].id;
}

export async function getLegaById(id) {
  const db = getDb();
  const result = await db.query('SELECT * FROM leghe WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getAllLeghe() {
  const db = getDb();
  const result = await db.query('SELECT * FROM leghe');
  return result.rows;
}

export async function updateLega(id, data) {
  // Se si sta modificando il nome, controlla che non ci siano duplicati
  if (data?.nome || 'Nome') {
    const existingLega = await checkLegaExists(data?.nome || 'Nome');
    
    // Se trova una lega con lo stesso nome normalizzato E non è la stessa lega che si sta modificando
    if (existingLega && existingLega.id !== parseInt(id)) {
      throw new Error('Esiste già una lega con questo nome');
    }
  }
  
  // Validazione e conversione dei valori integer
  const max_squadre = parseInt(data.max_squadre) || 0;
  const min_giocatori = parseInt(data.min_giocatori) || 0;
  const max_giocatori = parseInt(data.max_giocatori) || 0;
  const admin_id = parseInt(data.admin_id) || 1;
  
  // Procedi con l'aggiornamento
  const sql = `UPDATE leghe SET nome=$1, modalita=$2, admin_id=$3, is_pubblica=$4, password=$5, max_squadre=$6, min_giocatori=$7, max_giocatori=$8, roster_ab=$9, cantera=$10, contratti=$11, triggers=$12, regolamento_pdf=$13, excel_originale=$14, excel_modificato=$15 WHERE id=$16`;
  const db = getDb();
  await db.query(sql, [
    data?.nome || 'Nome',
    data?.modalita || '',
    admin_id,
    data?.is_pubblica || false? true : false,
    data.password || null,
    max_squadre,
    min_giocatori,
    max_giocatori,
    data.roster_ab ? true : false,
    data.cantera ? true : false,
    data.contratti ? true : false,
    data.triggers ? true : false,
    data.regolamento_pdf || null,
    data.excel_originale || null,
    data.excel_modificato || null,
    id
  ]);
}

export async function deleteLega(id) {
  const db = getDb();
  await db.query('DELETE FROM leghe WHERE id = $1', [id]);
} 