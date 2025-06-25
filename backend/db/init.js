import { getDb } from './config.js';
const db = getDb();

// UTENTI
const utenti = `CREATE TABLE IF NOT EXISTS utenti (
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
);`;

// LEGHE
const leghe = `CREATE TABLE IF NOT EXISTS leghe (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  modalita TEXT NOT NULL,
  admin_id INTEGER NOT NULL,
  is_pubblica INTEGER NOT NULL,
  password TEXT,
  max_squadre INTEGER,
  min_giocatori INTEGER,
  max_giocatori INTEGER,
  roster_ab INTEGER,
  cantera INTEGER,
  contratti INTEGER,
  triggers INTEGER,
  regolamento_pdf TEXT,
  excel_originale TEXT,
  excel_modificato TEXT,
  fantacalcio_url TEXT,
  fantacalcio_username TEXT,
  fantacalcio_password TEXT,
  scraping_automatico INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(admin_id) REFERENCES utenti(id)
);`;

// SQUADRE
const squadre = `CREATE TABLE IF NOT EXISTS squadre (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  proprietario_id INTEGER,
  club_level INTEGER,
  casse_societarie INTEGER,
  costo_salariale_totale INTEGER,
  costo_salariale_annuale INTEGER,
  valore_squadra INTEGER,
  is_orfana INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(proprietario_id) REFERENCES utenti(id),
  UNIQUE(lega_id, proprietario_id)
);`;

// GIOCATORI
const giocatori = `CREATE TABLE IF NOT EXISTS giocatori (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER NOT NULL,
  squadra_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT,
  ruolo TEXT,
  squadra_reale TEXT,
  eta INTEGER,
  quotazione_attuale INTEGER,
  salario INTEGER,
  costo_attuale INTEGER,
  costo_precedente INTEGER,
  prestito INTEGER,
  anni_contratto INTEGER,
  cantera INTEGER,
  triggers TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_id) REFERENCES squadre(id)
);`;

// NOTIFICHE
const notifiche = `CREATE TABLE IF NOT EXISTS notifiche (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  utente_id INTEGER,
  tipo TEXT,
  messaggio TEXT,
  letto INTEGER,
  data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_lettura DATETIME,
  archiviata INTEGER,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(utente_id) REFERENCES utenti(id)
);`;

// RICHIESTE INGRESSO
const richieste_ingresso = `CREATE TABLE IF NOT EXISTS richieste_ingresso (
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
  FOREIGN KEY(utente_id) REFERENCES utenti(id),
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_id) REFERENCES squadre(id),
  FOREIGN KEY(risposta_admin_id) REFERENCES utenti(id)
);`;

// LOG
const log = `CREATE TABLE IF NOT EXISTS log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  azione TEXT,
  dettagli TEXT,
  utente_id INTEGER,
  data_azione DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(utente_id) REFERENCES utenti(id)
);`;

// OFFERTE
const offerte = `CREATE TABLE IF NOT EXISTS offerte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  squadra_mittente_id INTEGER,
  squadra_destinatario_id INTEGER,
  giocatore_id INTEGER,
  tipo TEXT,
  valore INTEGER,
  stato TEXT,
  data_invio DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_accettazione DATETIME,
  data_approvazione_admin DATETIME,
  data_completamento DATETIME,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_mittente_id) REFERENCES squadre(id),
  FOREIGN KEY(squadra_destinatario_id) REFERENCES squadre(id),
  FOREIGN KEY(giocatore_id) REFERENCES giocatori(id)
);`;

// SUBADMIN
const subadmin = `CREATE TABLE IF NOT EXISTS subadmin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  utente_id INTEGER,
  attivo INTEGER,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(utente_id) REFERENCES utenti(id)
);`;

const tables = [utenti, leghe, squadre, giocatori, notifiche, richieste_ingresso, log, offerte, subadmin];

db.serialize(() => {
  for (const t of tables) {
    db.run(t, err => {
      if (err) console.error('Errore creazione tabella:', err.message);
    });
  }
});

db.close();

export function ensureTables() {
  console.log('Ensuring all tables exist...');

  // Tabella utenti
  db.run(`
    CREATE TABLE IF NOT EXISTS utenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      ruolo TEXT DEFAULT 'user',
      data_registrazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultimo_accesso DATETIME,
      attivo BOOLEAN DEFAULT 1
    )
  `);

  // Tabella leghe
  db.run(`
    CREATE TABLE IF NOT EXISTS leghe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descrizione TEXT,
      admin_id INTEGER,
      max_squadre INTEGER DEFAULT 20,
      budget_iniziale DECIMAL(10,2) DEFAULT 1000000.00,
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      stato TEXT DEFAULT 'attiva',
      FOREIGN KEY (admin_id) REFERENCES utenti (id)
    )
  `);

  // Tabella squadre
  db.run(`
    CREATE TABLE IF NOT EXISTS squadre (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      lega_id INTEGER,
      utente_id INTEGER,
      budget_iniziale DECIMAL(10,2) DEFAULT 1000000.00,
      punti_campionato INTEGER DEFAULT 0,
      gol_fatti INTEGER DEFAULT 0,
      gol_subiti INTEGER DEFAULT 0,
      differenza_reti INTEGER DEFAULT 0,
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (utente_id) REFERENCES utenti (id)
    )
  `);

  // Tabella giocatori
  db.run(`
    CREATE TABLE IF NOT EXISTS giocatori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      ruolo TEXT CHECK(ruolo IN ('P', 'D', 'C', 'A')),
      eta INTEGER,
      squadra_id INTEGER,
      valore_mercato DECIMAL(10,2),
      stipendio DECIMAL(10,2),
      scadenza_contratto DATE,
      stato TEXT DEFAULT 'attivo',
      data_inserimento DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (squadra_id) REFERENCES squadre (id)
    )
  `);

  // Tabella offerte
  db.run(`
    CREATE TABLE IF NOT EXISTS offerte (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      giocatore_id INTEGER,
      squadra_offerente_id INTEGER,
      squadra_proprietaria_id INTEGER,
      importo DECIMAL(10,2) NOT NULL,
      stato TEXT DEFAULT 'in_attesa',
      data_offerta DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_risposta DATETIME,
      note TEXT,
      FOREIGN KEY (giocatore_id) REFERENCES giocatori (id),
      FOREIGN KEY (squadra_offerente_id) REFERENCES squadre (id),
      FOREIGN KEY (squadra_proprietaria_id) REFERENCES squadre (id)
    )
  `);

  // Tabella notifiche
  db.run(`
    CREATE TABLE IF NOT EXISTS notifiche (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER,
      utente_id INTEGER,
      titolo TEXT NOT NULL,
      messaggio TEXT NOT NULL,
      tipo TEXT DEFAULT 'generale',
      letta BOOLEAN DEFAULT 0,
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_lettura DATETIME,
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (utente_id) REFERENCES utenti (id)
    )
  `);

  // Tabella notifiche admin
  db.run(`
    CREATE TABLE IF NOT EXISTS notifiche_admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER,
      tipo TEXT NOT NULL,
      messaggio TEXT NOT NULL,
      giocatore_id INTEGER,
      squadra_id INTEGER,
      stato TEXT DEFAULT 'in_attesa',
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_risposta DATETIME,
      risposta_admin TEXT,
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (giocatore_id) REFERENCES giocatori (id),
      FOREIGN KEY (squadra_id) REFERENCES squadre (id)
    )
  `);

  // Tabella log
  db.run(`
    CREATE TABLE IF NOT EXISTS log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER,
      azione TEXT NOT NULL,
      dettagli TEXT,
      data_azione DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      FOREIGN KEY (utente_id) REFERENCES utenti (id)
    )
  `);

  // Tabella subadmin
  db.run(`
    CREATE TABLE IF NOT EXISTS subadmin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER,
      lega_id INTEGER,
      permessi TEXT,
      data_nomina DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utente_id) REFERENCES utenti (id),
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    )
  `);

  // Tabella contratti
  db.run(`
    CREATE TABLE IF NOT EXISTS contratti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      giocatore_id INTEGER,
      squadra_id INTEGER,
      stipendio DECIMAL(10,2) NOT NULL,
      data_inizio DATE NOT NULL,
      data_fine DATE NOT NULL,
      stato TEXT DEFAULT 'attivo',
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (giocatore_id) REFERENCES giocatori (id),
      FOREIGN KEY (squadra_id) REFERENCES squadre (id)
    )
  `);

  // Tabella pagamenti
  db.run(`
    CREATE TABLE IF NOT EXISTS pagamenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contratto_id INTEGER,
      importo DECIMAL(10,2) NOT NULL,
      data_pagamento DATE NOT NULL,
      stato TEXT DEFAULT 'in_attesa',
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contratto_id) REFERENCES contratti (id)
    )
  `);

  // Tabella tornei
  db.run(`
    CREATE TABLE IF NOT EXISTS tornei (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER,
      nome TEXT NOT NULL,
      tipo TEXT DEFAULT 'campionato',
      formato TEXT DEFAULT 'girone_unico',
      giornate_totali INTEGER,
      data_inizio DATE,
      data_fine DATE,
      stato TEXT DEFAULT 'in_corso',
      admin_id INTEGER,
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (admin_id) REFERENCES utenti (id)
    )
  `);

  // Tabella partite
  db.run(`
    CREATE TABLE IF NOT EXISTS partite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      torneo_id INTEGER,
      giornata INTEGER,
      squadra_casa_id INTEGER,
      squadra_trasferta_id INTEGER,
      gol_casa INTEGER,
      gol_trasferta INTEGER,
      punti_casa INTEGER,
      punti_trasferta INTEGER,
      data_partita DATETIME,
      stato TEXT DEFAULT 'programmata',
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (torneo_id) REFERENCES tornei (id),
      FOREIGN KEY (squadra_casa_id) REFERENCES squadre (id),
      FOREIGN KEY (squadra_trasferta_id) REFERENCES squadre (id)
    )
  `);

  // Tabella transazioni finanziarie
  db.run(`
    CREATE TABLE IF NOT EXISTS transazioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squadra_id INTEGER,
      tipo TEXT CHECK(tipo IN ('entrata', 'uscita')),
      categoria TEXT NOT NULL,
      importo DECIMAL(10,2) NOT NULL,
      descrizione TEXT,
      giocatore_id INTEGER,
      data_transazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (squadra_id) REFERENCES squadre (id),
      FOREIGN KEY (giocatore_id) REFERENCES giocatori (id)
    )
  `);

  // Tabella backup log
  db.run(`
    CREATE TABLE IF NOT EXISTS backup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_backup TEXT NOT NULL,
      descrizione TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      dimensione INTEGER,
      record_count INTEGER,
      stato TEXT DEFAULT 'completato'
    )
  `);

  // Tabella configurazioni scraping
  db.run(`
    CREATE TABLE IF NOT EXISTS scraping_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER,
      url_classifica TEXT,
      url_risultati TEXT,
      url_giocatori TEXT,
      url_voti TEXT,
      attivo BOOLEAN DEFAULT 1,
      ultimo_scraping DATETIME,
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    )
  `);

  console.log('All tables ensured successfully!');
}