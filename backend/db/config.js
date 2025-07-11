import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usa database in memoria per test su Render
const DB_PATH = process.env.DB_PATH || (process.env.NODE_ENV === 'production' 
  ? ':memory:' 
  : path.join(__dirname, 'topleague.db'));
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

// Funzione per aggiungere colonne mancanti alla tabella giocatori
function addMissingColumns() {
  const db = getDb();
  
  // Aggiungi colonne mancanti alla tabella giocatori
  const columns = [
    'qi INTEGER',
    'qa INTEGER', 
    'fvm INTEGER',
    'media_voto REAL',
    'fantamedia_voto REAL',
    'presenze INTEGER',
    'goalfatti INTEGER',
    'goalsubiti INTEGER',
    'rigoriparati INTEGER',
    'rigoricalciati INTEGER',
    'rigorisegnati INTEGER',
    'rigorisbagliati INTEGER',
    'assist INTEGER',
    'ammonizioni INTEGER',
    'espulsioni INTEGER',
    'autogol INTEGER'
  ];

  columns.forEach(column => {
    const [columnName] = column.split(' ');
    db.run(`ALTER TABLE giocatori ADD COLUMN ${column}`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Errore aggiunta colonna ${columnName}:`, err.message);
      }
      // else console.log(`Colonna ${columnName} aggiunta o già esistente`);
    });
  });
}

export function initDb() {
  const db = getDb();
  db.serialize(() => {
    // Crea un utente di test se non esiste
    db.get('SELECT COUNT(*) as count FROM users', [], (err, countRow) => {
      if (countRow && countRow.count === 0) {
        console.log('Database vuoto, creando utente di test...');
        const bcrypt = require('bcryptjs');
        const password_hash = bcrypt.hashSync('admin123', 10);
        
        db.run(`INSERT INTO users (nome, cognome, username, email, password_hash, ruolo) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                ['Admin', 'Test', 'admin', 'admin@topleague.com', password_hash, 'SuperAdmin'],
                function(err) {
          if (err) {
            console.error('Errore creazione utente test:', err);
          } else {
            console.log('✅ Utente di test creato con successo');
            console.log('Email: admin@topleague.com');
            console.log('Password: admin123');
          }
        });
      } else {
        console.log('Database già contiene utenti:', countRow ? countRow.count : 'errore');
      }
    });
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
      squadra_prestito_id INTEGER,
      anni_contratto INTEGER DEFAULT 1,
      cantera BOOLEAN DEFAULT 0,
      triggers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (squadra_id) REFERENCES squadre(id),
      FOREIGN KEY (lega_id) REFERENCES leghe(id),
      FOREIGN KEY (squadra_prestito_id) REFERENCES squadre(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS notifiche (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL,
      lega_id INTEGER,
      tipo TEXT DEFAULT 'generale',
      titolo TEXT,
      messaggio TEXT NOT NULL,
      letta BOOLEAN DEFAULT 0,
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_lettura DATETIME,
      FOREIGN KEY (utente_id) REFERENCES users(id),
      FOREIGN KEY (lega_id) REFERENCES leghe(id)
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

    // Tabella log squadre
    db.run(`CREATE TABLE IF NOT EXISTS log_squadre (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squadra_id INTEGER NOT NULL,
      lega_id INTEGER NOT NULL,
      tipo_evento TEXT NOT NULL,
      categoria TEXT NOT NULL,
      titolo TEXT NOT NULL,
      descrizione TEXT,
      dati_aggiuntivi TEXT,
      utente_id INTEGER,
      giocatore_id INTEGER,
      data_evento DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (squadra_id) REFERENCES squadre (id),
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (utente_id) REFERENCES users (id),
      FOREIGN KEY (giocatore_id) REFERENCES giocatori (id)
    );`);

    // Tabella richieste di ingresso
    db.run(`CREATE TABLE IF NOT EXISTS richieste_ingresso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL,
      lega_id INTEGER NOT NULL,
      squadra_id INTEGER NOT NULL,
      password_fornita TEXT,
      stato TEXT DEFAULT 'in_attesa',
      data_richiesta DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_risposta DATETIME,
      risposta_admin_id INTEGER,
      messaggio_richiesta TEXT,
      messaggio_risposta TEXT,
      FOREIGN KEY(utente_id) REFERENCES users(id),
      FOREIGN KEY(lega_id) REFERENCES leghe(id),
      FOREIGN KEY(squadra_id) REFERENCES squadre(id),
      FOREIGN KEY(risposta_admin_id) REFERENCES users(id)
    );`);

    // Tabella squadre di scraping (separata dalle squadre ufficiali)
    db.run(`CREATE TABLE IF NOT EXISTS squadre_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'puppeteer',
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );`);

    // Tabella giocatori di scraping (separata dai giocatori ufficiali)
    db.run(`CREATE TABLE IF NOT EXISTS giocatori_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      squadra_scraping_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      ruolo TEXT,
      squadra_reale TEXT,
      quotazione REAL,
      qi REAL,
      fv_mp TEXT,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'puppeteer',
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (squadra_scraping_id) REFERENCES squadre_scraping (id)
    );`);

    // Tabella classifica di scraping
    db.run(`CREATE TABLE IF NOT EXISTS classifica_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      posizione INTEGER NOT NULL,
      squadra TEXT NOT NULL,
      punti INTEGER DEFAULT 0,
      partite INTEGER DEFAULT 0,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'playwright',
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );`);

    // Tabella voti di scraping
    db.run(`CREATE TABLE IF NOT EXISTS voti_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      giocatore TEXT NOT NULL,
      voto REAL NOT NULL,
      squadra TEXT,
      giornata INTEGER DEFAULT 1,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'playwright',
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );`);

    // Tabella formazioni di scraping
    db.run(`CREATE TABLE IF NOT EXISTS formazioni_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      squadra TEXT NOT NULL,
      modulo TEXT,
      titolari TEXT, -- JSON array di nomi
      panchinari TEXT, -- JSON array di nomi
      giornata INTEGER,
      tipo_squadra TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'playwright',
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );`);

    // Tabella mercato di scraping
    db.run(`CREATE TABLE IF NOT EXISTS mercato_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      giocatore TEXT NOT NULL,
      da TEXT,
      a TEXT,
      prezzo TEXT,
      tipo TEXT,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'playwright',
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );`);

    console.log('All tables ensured.');
    
    // Aggiungi colonna qi se non esiste
    db.run(`ALTER TABLE giocatori_scraping ADD COLUMN qi REAL;`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Errore aggiunta colonna qi:', err);
      }
    });

    // Aggiungi colonna created_at se non esiste
    db.run(`ALTER TABLE formazioni_scraping ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Errore aggiunta colonna created_at:', err);
      }
    });
    
    // Aggiungi colonne mancanti alla tabella giocatori
    addMissingColumns();
  });
} 