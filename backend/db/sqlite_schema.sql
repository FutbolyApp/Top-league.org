CREATE TABLE utenti (
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
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE leghe (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, fantacalcio_url TEXT, fantacalcio_username TEXT, fantacalcio_password TEXT, scraping_automatico INTEGER DEFAULT 0, tipo_lega TEXT DEFAULT 'serie_a', updated_at TEXT, max_portieri INTEGER DEFAULT 3, min_portieri INTEGER DEFAULT 2, max_difensori INTEGER DEFAULT 8, min_difensori INTEGER DEFAULT 5, max_centrocampisti INTEGER DEFAULT 8, min_centrocampisti INTEGER DEFAULT 5, max_attaccanti INTEGER DEFAULT 6, min_attaccanti INTEGER DEFAULT 3,
  FOREIGN KEY(admin_id) REFERENCES utenti(id)
);
CREATE TABLE squadre (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, proprietario_username TEXT, logo_url TEXT,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(proprietario_id) REFERENCES utenti(id),
  UNIQUE(lega_id, proprietario_id)
);
CREATE TABLE giocatori (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, qa REAL, qi REAL, site_id TEXT, nazione_campionato TEXT, fvm INTEGER, media_voto REAL, fantamedia_voto REAL, presenze INTEGER, goalfatti INTEGER, goalsubiti INTEGER, rigoriparati INTEGER, rigoricalciati INTEGER, rigorisegnati INTEGER, rigorisbagliati INTEGER, assist INTEGER, ammonizioni INTEGER, espulsioni INTEGER, autogol INTEGER, r REAL, fr REAL, valore_trasferimento REAL DEFAULT 0, ultimo_pagamento_contratto DATETIME, valore_prestito REAL DEFAULT 0, ultimo_rinnovo_contratto DATETIME, roster TEXT DEFAULT 'A', squadra_prestito_id INTEGER REFERENCES squadre(id), trasferimento INTEGER DEFAULT 0,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_id) REFERENCES squadre(id)
);
CREATE TABLE notifiche (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  utente_id INTEGER,
  tipo TEXT,
  messaggio TEXT,
  letto INTEGER,
  data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_lettura DATETIME,
  archiviata INTEGER, titolo TEXT, dati_aggiuntivi TEXT,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(utente_id) REFERENCES utenti(id)
);
CREATE TABLE log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  azione TEXT,
  dettagli TEXT,
  utente_id INTEGER,
  data_azione DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(utente_id) REFERENCES utenti(id)
);
CREATE TABLE offerte (
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
  data_completamento DATETIME, cantera BOOLEAN DEFAULT 0, valore_offerta REAL DEFAULT 0, richiesta_fm REAL DEFAULT 0, giocatore_scambio_id INTEGER,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(squadra_mittente_id) REFERENCES squadre(id),
  FOREIGN KEY(squadra_destinatario_id) REFERENCES squadre(id),
  FOREIGN KEY(giocatore_id) REFERENCES giocatori(id)
);
CREATE TABLE subadmin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lega_id INTEGER,
  utente_id INTEGER,
  attivo INTEGER, data_nomina DATETIME DEFAULT CURRENT_TIMESTAMP, permessi TEXT,
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  FOREIGN KEY(utente_id) REFERENCES utenti(id)
);
CREATE TABLE users (
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
    );
CREATE TABLE richieste_ingresso (
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
);
CREATE TABLE squadre_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'puppeteer',
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );
CREATE TABLE giocatori_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      squadra_scraping_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      ruolo TEXT,
      squadra_reale TEXT,
      quotazione REAL,
      fv_mp TEXT,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'puppeteer', qi REAL,
      FOREIGN KEY (lega_id) REFERENCES leghe (id),
      FOREIGN KEY (squadra_scraping_id) REFERENCES squadre_scraping (id)
    );
CREATE TABLE classifica_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      posizione INTEGER NOT NULL,
      squadra TEXT NOT NULL,
      punti INTEGER DEFAULT 0,
      partite INTEGER DEFAULT 0,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'playwright', vittorie INTEGER DEFAULT 0, pareggi INTEGER DEFAULT 0, sconfitte INTEGER DEFAULT 0, gol_fatti INTEGER DEFAULT 0, gol_subiti INTEGER DEFAULT 0, differenza_reti INTEGER DEFAULT 0, punti_totali REAL DEFAULT 0,
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );
CREATE TABLE voti_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      giocatore TEXT NOT NULL,
      voto REAL NOT NULL,
      squadra TEXT,
      giornata INTEGER DEFAULT 1,
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'playwright',
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );
CREATE TABLE formazioni_scraping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lega_id INTEGER NOT NULL,
      squadra TEXT NOT NULL,
      modulo TEXT,
      titolari TEXT, -- JSON array di nomi
      panchinari TEXT, -- JSON array di nomi
      data_scraping DATETIME DEFAULT CURRENT_TIMESTAMP,
      fonte_scraping TEXT DEFAULT 'playwright', giornata INTEGER DEFAULT 1, created_at TEXT, tipo_squadra TEXT,
      FOREIGN KEY (lega_id) REFERENCES leghe (id)
    );
CREATE TABLE mercato_scraping (
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
    );
CREATE TABLE qa_history (id INTEGER PRIMARY KEY AUTOINCREMENT, giocatore_id INTEGER NOT NULL, qa_value REAL NOT NULL, data_registrazione DATETIME DEFAULT CURRENT_TIMESTAMP, fonte TEXT DEFAULT 'scraping', FOREIGN KEY(giocatore_id) REFERENCES giocatori(id));
CREATE TABLE tornei_preferiti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utente_id INTEGER NOT NULL,
  lega_id INTEGER NOT NULL,
  torneo_id TEXT NOT NULL,
  torneo_nome TEXT NOT NULL,
  torneo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(utente_id) REFERENCES utenti(id),
  FOREIGN KEY(lega_id) REFERENCES leghe(id),
  UNIQUE(utente_id, lega_id, torneo_id)
);
CREATE TABLE richieste_unione_squadra (
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
);
CREATE TABLE tornei (id INTEGER PRIMARY KEY AUTOINCREMENT, lega_id INTEGER, nome TEXT NOT NULL, tipo TEXT DEFAULT 'campionato', formato TEXT DEFAULT 'girone_unico', giornate_totali INTEGER, data_inizio DATE, data_fine DATE, descrizione TEXT, informazioni_utente TEXT, stato TEXT DEFAULT 'programmato', admin_id INTEGER, data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (lega_id) REFERENCES leghe (id), FOREIGN KEY (admin_id) REFERENCES users (id));
CREATE TABLE tornei_squadre (id INTEGER PRIMARY KEY AUTOINCREMENT, torneo_id INTEGER, squadra_id INTEGER, data_iscrizione DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (torneo_id) REFERENCES tornei (id), FOREIGN KEY (squadra_id) REFERENCES squadre (id), UNIQUE(torneo_id, squadra_id));
CREATE TABLE partite (id INTEGER PRIMARY KEY AUTOINCREMENT, torneo_id INTEGER, giornata INTEGER, squadra_casa_id INTEGER, squadra_trasferta_id INTEGER, gol_casa INTEGER, gol_trasferta INTEGER, punti_casa INTEGER, punti_trasferta INTEGER, data_partita DATETIME, stato TEXT DEFAULT 'programmata', data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (torneo_id) REFERENCES tornei (id), FOREIGN KEY (squadra_casa_id) REFERENCES squadre (id), FOREIGN KEY (squadra_trasferta_id) REFERENCES squadre (id));
CREATE UNIQUE INDEX idx_lega_nome_unique ON leghe (nome COLLATE NOCASE);
CREATE TABLE pending_changes (id INTEGER PRIMARY KEY AUTOINCREMENT, lega_id INTEGER NOT NULL, subadmin_id INTEGER NOT NULL, action_type TEXT NOT NULL, action_data TEXT NOT NULL, status TEXT DEFAULT "pending", admin_response TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, reviewed_at DATETIME, description TEXT, details TEXT, FOREIGN KEY (lega_id) REFERENCES leghe (id), FOREIGN KEY (subadmin_id) REFERENCES utenti (id));
CREATE TABLE log_contratti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giocatore_id INTEGER NOT NULL,
    squadra_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    valore_prima REAL,
    valore_dopo REAL,
    importo REAL,
    note TEXT,
    data_operazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (giocatore_id) REFERENCES giocatori (id),
    FOREIGN KEY (squadra_id) REFERENCES squadre (id)
  );
CREATE TABLE richieste_admin (id INTEGER PRIMARY KEY AUTOINCREMENT, squadra_id INTEGER NOT NULL, tipo_richiesta TEXT NOT NULL, dati_richiesta TEXT, stato TEXT DEFAULT 'pending', data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP, data_risposta DATETIME, note_admin TEXT, FOREIGN KEY (squadra_id) REFERENCES squadre (id));
CREATE TABLE log_operazioni_giocatori (id INTEGER PRIMARY KEY AUTOINCREMENT, giocatore_id INTEGER, lega_id INTEGER, tipo_operazione TEXT, squadra_mittente_id INTEGER, squadra_destinatario_id INTEGER, valore REAL, dettagli TEXT, utente_id INTEGER, data_operazione DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE log_squadre (id INTEGER PRIMARY KEY AUTOINCREMENT, squadra_id INTEGER NOT NULL, lega_id INTEGER NOT NULL, tipo_evento TEXT NOT NULL, categoria TEXT NOT NULL, titolo TEXT NOT NULL, descrizione TEXT, dati_aggiuntivi TEXT, utente_id INTEGER, giocatore_id INTEGER, data_evento DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (squadra_id) REFERENCES squadre (id), FOREIGN KEY (lega_id) REFERENCES leghe (id), FOREIGN KEY (utente_id) REFERENCES users (id), FOREIGN KEY (giocatore_id) REFERENCES giocatori (id));
