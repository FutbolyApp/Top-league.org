import { getDb } from '../db/mariadb.js';

function normalizeLegaName(nome) {
  return nome.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function checkLegaExists(nome) {
  const normalized = normalizeLegaName(nome);
  const db = getDb();
  const result = await db.query('SELECT id, nome FROM leghe');
  const found = result.rows.find(l => normalizeLegaName(l?.nome || 'Nome') === normalized);
  return found;
}

export async function createLega(data) {
  // Prima controlla se esiste già una lega con lo stesso nome normalizzato
  const existingLega = await checkLegaExists(data?.nome || 'Nome');
  
  if (existingLega) {
    throw new Error('Esiste già una lega con questo nome');
  }
  
  // Validazione e conversione dei valori integer
  const max_squadre = parseInt(data?.max_squadre || '') || 0;
  const min_giocatori = parseInt(data?.min_giocatori || '') || 0;
  const max_giocatori = parseInt(data?.max_giocatori || '') || 0;
  const admin_id = parseInt(data.admin_id) || 1;
  
  // Se non esiste, procedi con la creazione
  const sql = `INSERT INTO leghe (nome, modalita, admin_id, is_pubblica, password, max_squadre, min_giocatori, max_giocatori, roster_ab, cantera, contratti, triggers, regolamento_pdf, excel_originale, excel_modificato)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const db = getDb();
  const result = await db.query(sql, [
    data?.nome || 'Nome',
    data?.modalita || '',
    admin_id,
    data?.is_pubblica || false? true : false,
    data?.password || null,
    max_squadre,
    min_giocatori,
    max_giocatori,
    data?.roster_ab ? true : false,
    data?.cantera ? true : false,
    data?.contratti ? true : false,
    data?.triggers ? true : false,
    data?.regolamento_pdf || null,
    data?.excel_originale || null,
    data?.excel_modificato || null
  ]);
  
  return result.insertId;
}

export async function getLegaById(id) {
  const db = getDb();
  const result = await db.query('SELECT * FROM leghe WHERE id = ?', [id]);
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
  const max_squadre = parseInt(data?.max_squadre || '') || 0;
  const min_giocatori = parseInt(data?.min_giocatori || '') || 0;
  const max_giocatori = parseInt(data?.max_giocatori || '') || 0;
  const admin_id = parseInt(data.admin_id) || 1;
  
  // Procedi con l'aggiornamento
  const sql = `UPDATE leghe SET nome=?, modalita=?, admin_id=?, is_pubblica=?, password=?, max_squadre=?, min_giocatori=?, max_giocatori=?, roster_ab=?, cantera=?, contratti=?, triggers=?, regolamento_pdf=?, excel_originale=?, excel_modificato=? WHERE id=?`;
  const db = getDb();
  await db.query(sql, [
    data?.nome || 'Nome',
    data?.modalita || '',
    admin_id,
    data?.is_pubblica || false? true : false,
    data?.password || null,
    max_squadre,
    min_giocatori,
    max_giocatori,
    data?.roster_ab ? true : false,
    data?.cantera ? true : false,
    data?.contratti ? true : false,
    data?.triggers ? true : false,
    data?.regolamento_pdf || null,
    data?.excel_originale || null,
    data?.excel_modificato || null,
    id
  ]);
}

export async function deleteLega(id) {
  const db = getDb();
  await db.query('DELETE FROM leghe WHERE id = ?', [id]);
} 