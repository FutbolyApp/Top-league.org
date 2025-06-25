import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usa una directory persistente per il database su Render, altrimenti locale
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'topleague.db');
console.log('SQLite DB Path:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database opened successfully!');
  }
});

export function getDb() {
  return db;
}

export function initDb() {
  const db = getDb();
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      username TEXT UNIQUE,
      provenienza TEXT,
      squadra_cuore TEXT,
      come_conosciuto TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      ruolo TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS leghe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      modalita TEXT NOT NULL,
      admin_id INTEGER NOT NULL,
      is_pubblica BOOLEAN DEFAULT 1,
      password TEXT,
      max_squadre INTEGER,
      min_giocatori INTEGER,
      max_giocatori INTEGER,
      roster_ab BOOLEAN DEFAULT 0,
      cantera BOOLEAN DEFAULT 0,
      contratti BOOLEAN DEFAULT 0,
      triggers BOOLEAN DEFAULT 0,
      regolamento_pdf TEXT,
      excel_originale TEXT,
      excel_modificato TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS squadre (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      lega_id INTEGER NOT NULL,
      proprietario_id INTEGER,
      is_orfana BOOLEAN DEFAULT 1,
      club_level INTEGER DEFAULT 1,
      casse_societarie INTEGER DEFAULT 0,
      costo_salariale_totale INTEGER DEFAULT 0,
      costo_salariale_annuale INTEGER DEFAULT 0,
      valore_squadra INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lega_id) REFERENCES leghe(id),
      FOREIGN KEY (proprietario_id) REFERENCES users(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS giocatori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cognome TEXT,
      ruolo TEXT NOT NULL,
      squadra_id INTEGER,
      lega_id INTEGER NOT NULL,
      squadra_reale TEXT,
      eta INTEGER,
      quotazione_attuale INTEGER,
      costo_attuale INTEGER DEFAULT 0,
      costo_precedente INTEGER,
      salario INTEGER DEFAULT 0,
      prestito BOOLEAN DEFAULT 0,
      anni_contratto INTEGER DEFAULT 1,
      cantera BOOLEAN DEFAULT 0,
      triggers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (squadra_id) REFERENCES squadre(id),
      FOREIGN KEY (lega_id) REFERENCES leghe(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS notifiche (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      messaggio TEXT NOT NULL,
      letta BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS offerte (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      giocatore_id INTEGER NOT NULL,
      squadra_mittente_id INTEGER NOT NULL,
      squadra_destinatario_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      valore INTEGER NOT NULL,
      stato TEXT DEFAULT 'inviata',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lega_id) REFERENCES leghe(id),
      FOREIGN KEY (giocatore_id) REFERENCES giocatori(id),
      FOREIGN KEY (squadra_mittente_id) REFERENCES squadre(id),
      FOREIGN KEY (squadra_destinatario_id) REFERENCES squadre(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      azione TEXT NOT NULL,
      dettagli TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );`);

    console.log('All tables ensured.');
  });
} 