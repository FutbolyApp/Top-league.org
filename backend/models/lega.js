import { getDb } from '../db/config.js';
const db = getDb();

function normalizeLegaName(nome) {
  return nome
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // rimuove tutto tranne lettere e numeri
}

export function checkLegaExists(nome, callback) {
  const normalized = normalizeLegaName(nome);
  // Cerco tra tutte le leghe già normalizzate
  getDb().all('SELECT id, nome FROM leghe', [], (err, leghe) => {
    if (err) return callback(err, null);
    const found = leghe.find(l => normalizeLegaName(l.nome) === normalized);
    callback(null, found);
  });
}

export function createLega(data, callback) {
  // Prima controlla se esiste già una lega con lo stesso nome normalizzato
  checkLegaExists(data.nome, (err, existingLega) => {
    if (err) {
      return callback(err, null);
    }
    
    if (existingLega) {
      return callback(new Error('Esiste già una lega con questo nome'), null);
    }
    
    // Se non esiste, procedi con la creazione
    const sql = `INSERT INTO leghe (nome, modalita, admin_id, is_pubblica, password, max_squadre, min_giocatori, max_giocatori, roster_ab, cantera, contratti, triggers, regolamento_pdf, excel_originale, excel_modificato, fantacalcio_url, fantacalcio_username, fantacalcio_password, scraping_automatico)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [
      data.nome,
      data.modalita,
      data.admin_id,
      data.is_pubblica ? 1 : 0,
      data.password || null,
      data.max_squadre,
      data.min_giocatori,
      data.max_giocatori,
      data.roster_ab ? 1 : 0,
      data.cantera ? 1 : 0,
      data.contratti ? 1 : 0,
      data.triggers ? 1 : 0,
      data.regolamento_pdf || null,
      data.excel_originale || null,
      data.excel_modificato || null,
      data.fantacalcio_url || null,
      data.fantacalcio_username || null,
      data.fantacalcio_password || null,
      data.scraping_automatico ? 1 : 0
    ], function(err) {
      callback(err, this ? this.lastID : null);
    });
  });
}

export function getLegaById(id, callback) {
  db.get('SELECT * FROM leghe WHERE id = ?', [id], callback);
}

export function getAllLeghe(callback) {
  db.all('SELECT * FROM leghe', [], callback);
}

export function updateLega(id, data, callback) {
  // Se si sta modificando il nome, controlla che non ci siano duplicati
  if (data.nome) {
    checkLegaExists(data.nome, (err, existingLega) => {
      if (err) {
        return callback(err);
      }
      
      // Se trova una lega con lo stesso nome normalizzato E non è la stessa lega che si sta modificando
      if (existingLega && existingLega.id !== parseInt(id)) {
        return callback(new Error('Esiste già una lega con questo nome'));
      }
      
      // Se non ci sono conflitti, procedi con l'aggiornamento
      performUpdate();
    });
  } else {
    // Se non si sta modificando il nome, procedi direttamente
    performUpdate();
  }
  
  function performUpdate() {
    const sql = `UPDATE leghe SET nome=?, modalita=?, admin_id=?, is_pubblica=?, password=?, max_squadre=?, min_giocatori=?, max_giocatori=?, roster_ab=?, cantera=?, contratti=?, triggers=?, regolamento_pdf=?, excel_originale=?, excel_modificato=?, fantacalcio_url=?, fantacalcio_username=?, fantacalcio_password=?, scraping_automatico=? WHERE id=?`;
    db.run(sql, [
      data.nome,
      data.modalita,
      data.admin_id,
      data.is_pubblica ? 1 : 0,
      data.password || null,
      data.max_squadre,
      data.min_giocatori,
      data.max_giocatori,
      data.roster_ab ? 1 : 0,
      data.cantera ? 1 : 0,
      data.contratti ? 1 : 0,
      data.triggers ? 1 : 0,
      data.regolamento_pdf || null,
      data.excel_originale || null,
      data.excel_modificato || null,
      data.fantacalcio_url || null,
      data.fantacalcio_username || null,
      data.fantacalcio_password || null,
      data.scraping_automatico ? 1 : 0,
      id
    ], callback);
  }
}

export function deleteLega(id, callback) {
  db.run('DELETE FROM leghe WHERE id = ?', [id], callback);
} 