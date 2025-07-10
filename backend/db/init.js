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
  squadra_prestito_id INTEGER,
  anni_contratto INTEGER,
  cantera INTEGER,
  triggers TEXT,
  site_id TEXT,
  nazione_campionato TEXT,
  qi INTEGER,
  qa INTEGER,
  fvm INTEGER,
  media_voto REAL,
  fantamedia_voto REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_id) REFERENCES squadre(id),
  FOREIGN KEY(squadra_prestito_id) REFERENCES squadre(id)
);`;

// NOTIFICHE
const notifiche = `CREATE TABLE IF NOT EXISTS notifiche (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  utente_id INTEGER,
  titolo TEXT,
  messaggio TEXT NOT NULL,
  tipo TEXT DEFAULT 'generale',
  letta BOOLEAN DEFAULT 0,
  letto INTEGER DEFAULT 0,
  data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_lettura DATETIME,
  dati_aggiuntivi TEXT,
  archiviata INTEGER DEFAULT 0,
  FOREIGN KEY (lega_id) REFERENCES leghe (id),
  FOREIGN KEY (utente_id) REFERENCES utenti (id)
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
  FOREIGN KEY(utente_id) REFERENCES users(id),
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_id) REFERENCES squadre(id),
  FOREIGN KEY(risposta_admin_id) REFERENCES users(id)
);`;

// RICHIESTE UNIONE SQUADRA
const richieste_unione_squadra = `CREATE TABLE IF NOT EXISTS richieste_unione_squadra (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utente_id INTEGER NOT NULL,
  squadra_id INTEGER NOT NULL,
  lega_id INTEGER NOT NULL,
  stato TEXT DEFAULT 'in_attesa',
  data_richiesta DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_risposta DATETIME,
  risposta_admin_id INTEGER,
  messaggio_richiesta TEXT,
  messaggio_risposta TEXT,
  FOREIGN KEY(utente_id) REFERENCES users(id),
  FOREIGN KEY(squadra_id) REFERENCES squadre(id),
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(risposta_admin_id) REFERENCES users(id)
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
  FOREIGN KEY(utente_id) REFERENCES users(id)
);`;

// OFFERTE
const offerte = `CREATE TABLE IF NOT EXISTS offerte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  squadra_mittente_id INTEGER,
  squadra_destinatario_id INTEGER,
  giocatore_id INTEGER,
  giocatore_scambio_id INTEGER,
  tipo TEXT,
  valore_offerta INTEGER,
  richiesta_fm INTEGER,
  stato TEXT DEFAULT 'in_attesa',
  data_invio DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_accettazione DATETIME,
  data_approvazione_admin DATETIME,
  data_completamento DATETIME,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_mittente_id) REFERENCES squadre(id),
  FOREIGN KEY(squadra_destinatario_id) REFERENCES squadre(id),
  FOREIGN KEY(giocatore_id) REFERENCES giocatori(id),
  FOREIGN KEY(giocatore_scambio_id) REFERENCES giocatori(id)
);`;

// LOG OPERAZIONI GIOCATORI
const log_operazioni_giocatori = `CREATE TABLE IF NOT EXISTS log_operazioni_giocatori (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  giocatore_id INTEGER,
  lega_id INTEGER,
  tipo_operazione TEXT,
  squadra_mittente_id INTEGER,
  squadra_destinatario_id INTEGER,
  valore INTEGER,
  dettagli TEXT,
  data_operazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  utente_id INTEGER,
  FOREIGN KEY(giocatore_id) REFERENCES giocatori(id),
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_mittente_id) REFERENCES squadre(id),
  FOREIGN KEY(squadra_destinatario_id) REFERENCES squadre(id),
  FOREIGN KEY(utente_id) REFERENCES utenti(id)
);`;

// SUBADMIN
const subadmin = `CREATE TABLE IF NOT EXISTS subadmin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  utente_id INTEGER,
  permessi TEXT,
  attivo INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(utente_id) REFERENCES users(id)
);`;

// Tabella richieste_admin
const richieste_admin = `CREATE TABLE IF NOT EXISTS richieste_admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  squadra_id INTEGER NOT NULL,
  tipo_richiesta TEXT NOT NULL,
  dati_richiesta TEXT,
  stato TEXT DEFAULT 'pending',
  data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_risposta DATETIME,
  note_admin TEXT,
  FOREIGN KEY (squadra_id) REFERENCES squadre (id)
)`;

const tables = [utenti, leghe, squadre, giocatori, notifiche, richieste_ingresso, richieste_unione_squadra, log, offerte, log_operazioni_giocatori, subadmin, richieste_admin];

db.serialize(() => {
  for (const t of tables) {
    db.run(t, err => {
      if (err) console.error('Errore creazione tabella:', err.message);
    });
  }
  
  // Aggiungi colonna squadra_prestito_id se non esiste
  db.run(`ALTER TABLE giocatori ADD COLUMN squadra_prestito_id INTEGER REFERENCES squadre(id)`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Errore aggiunta colonna squadra_prestito_id:', err.message);
    }
  });
  
  // Aggiungi colonne per limiti di ruolo se non esistono
  const limitiColonne = [
    'max_portieri INTEGER DEFAULT 3',
    'min_portieri INTEGER DEFAULT 2',
    'max_difensori INTEGER DEFAULT 8',
    'min_difensori INTEGER DEFAULT 5',
    'max_centrocampisti INTEGER DEFAULT 8',
    'min_centrocampisti INTEGER DEFAULT 5',
    'max_attaccanti INTEGER DEFAULT 6',
    'min_attaccanti INTEGER DEFAULT 3'
  ];
  
  limitiColonne.forEach(colonna => {
    db.run(`ALTER TABLE leghe ADD COLUMN ${colonna}`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Errore aggiunta colonna ${colonna}:`, err.message);
      }
    });
  });
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
      FOREIGN KEY (admin_id) REFERENCES users (id)
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
      FOREIGN KEY (utente_id) REFERENCES users (id)
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
      utente_id INTEGER NOT NULL,
      titolo TEXT NOT NULL,
      messaggio TEXT NOT NULL,
      tipo TEXT NOT NULL,
      dati_aggiuntivi TEXT,
      letta INTEGER DEFAULT 0,
      letto INTEGER DEFAULT 0,
      archiviata INTEGER DEFAULT 0,
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utente_id) REFERENCES users (id)
    )
  `);

  // Tabella richieste unione squadra
  db.run(`
    CREATE TABLE IF NOT EXISTS richieste_unione_squadra (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL,
      squadra_id INTEGER NOT NULL,
      lega_id INTEGER NOT NULL,
      stato TEXT DEFAULT 'in_attesa',
      data_richiesta DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_risposta DATETIME,
      risposta_admin_id INTEGER,
      messaggio_richiesta TEXT,
      messaggio_risposta TEXT,
      FOREIGN KEY (utente_id) REFERENCES users (id),
      FOREIGN KEY (squadra_id) REFERENCES squadre (id),
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (risposta_admin_id) REFERENCES users (id)
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
      FOREIGN KEY (utente_id) REFERENCES users (id)
    )
  `);

  // Tabella log squadre
  db.run(`
    CREATE TABLE IF NOT EXISTS log_squadre (
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
    )
  `);

  // Tabella subadmin (aggiornata)
  db.run(`
    CREATE TABLE IF NOT EXISTS subadmin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER,
      lega_id INTEGER,
      permessi TEXT,
      attivo INTEGER DEFAULT 1,
      data_nomina DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utente_id) REFERENCES users (id),
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      UNIQUE(utente_id, lega_id)
    )
  `);

  // Tabella modifiche in attesa di approvazione
  db.run(`
    CREATE TABLE IF NOT EXISTS pending_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      subadmin_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      action_data TEXT NOT NULL,
      description TEXT,
      details TEXT,
      status TEXT DEFAULT 'pending',
      admin_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (subadmin_id) REFERENCES users (id)
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
      descrizione TEXT,
      informazioni_utente TEXT,
      stato TEXT DEFAULT 'programmato',
      admin_id INTEGER,
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (admin_id) REFERENCES users (id)
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

  // Tabella tornei_squadre
  db.run(`
    CREATE TABLE IF NOT EXISTS tornei_squadre (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      torneo_id INTEGER,
      squadra_id INTEGER,
      data_iscrizione DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (torneo_id) REFERENCES tornei (id),
      FOREIGN KEY (squadra_id) REFERENCES squadre (id),
      UNIQUE(torneo_id, squadra_id)
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

  // Tabella richieste_admin
  db.run(`
    CREATE TABLE IF NOT EXISTS richieste_admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squadra_id INTEGER NOT NULL,
      tipo_richiesta TEXT NOT NULL,
      dati_richiesta TEXT,
      stato TEXT DEFAULT 'pending',
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_risposta DATETIME,
      note_admin TEXT,
      FOREIGN KEY (squadra_id) REFERENCES squadre (id)
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

  // Tabella squadre di scraping (separata dalle squadre ufficiali)
  db.run(`
    CREATE TABLE IF NOT EXISTS squadre_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'puppeteer',
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    )
  `);

  // Tabella giocatori di scraping (separata dai giocatori ufficiali)
  db.run(`
    CREATE TABLE IF NOT EXISTS giocatori_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      squadra_scraping_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      ruolo TEXT,
      squadra_reale TEXT,
      quotazione REAL,
      fv_mp TEXT,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'puppeteer',
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (squadra_scraping_id) REFERENCES squadre_scraping (id)
    )
  `);

  console.log('All tables ensured successfully!');
  
  // Aggiungi colonne mancanti alla tabella subadmin se non esistono
  db.run("PRAGMA table_info(subadmin)", (err, columns) => {
    if (err) {
      console.error('Errore nel controllo struttura tabella subadmin:', err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('permessi')) {
      console.log('Aggiungendo colonna permessi alla tabella subadmin...');
      db.run('ALTER TABLE subadmin ADD COLUMN permessi TEXT', (err) => {
        if (err) console.error('Errore aggiunta colonna permessi:', err);
        else console.log('Colonna permessi aggiunta con successo');
      });
    }
    
    if (!columnNames.includes('data_nomina')) {
      console.log('Aggiungendo colonna data_nomina alla tabella subadmin...');
      db.run('ALTER TABLE subadmin ADD COLUMN data_nomina DATETIME DEFAULT CURRENT_TIMESTAMP', (err) => {
        if (err) console.error('Errore aggiunta colonna data_nomina:', err);
        else console.log('Colonna data_nomina aggiunta con successo');
      });
    }
  });

  // Aggiungi colonne mancanti alla tabella pending_changes se non esistono
  db.run("PRAGMA table_info(pending_changes)", (err, columns) => {
    if (err) {
      console.error('Errore nel controllo struttura tabella pending_changes:', err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('description')) {
      console.log('Aggiungendo colonna description alla tabella pending_changes...');
      db.run('ALTER TABLE pending_changes ADD COLUMN description TEXT', (err) => {
        if (err) console.error('Errore aggiunta colonna description:', err);
        else console.log('Colonna description aggiunta con successo');
      });
    }
    
    if (!columnNames.includes('details')) {
      console.log('Aggiungendo colonna details alla tabella pending_changes...');
      db.run('ALTER TABLE pending_changes ADD COLUMN details TEXT', (err) => {
        if (err) console.error('Errore aggiunta colonna details:', err);
        else console.log('Colonna details aggiunta con successo');
      });
    }
  });
}