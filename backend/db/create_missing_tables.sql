-- Script per creare le tabelle mancanti in PostgreSQL
-- Basato sullo schema SQLite esistente

-- Tabella tornei
CREATE TABLE IF NOT EXISTS tornei (
    id SERIAL PRIMARY KEY,
    lega_id INTEGER NOT NULL,
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
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Tabella tornei_squadre
CREATE TABLE IF NOT EXISTS tornei_squadre (
    id SERIAL PRIMARY KEY,
    torneo_id INTEGER,
    squadra_id INTEGER,
    data_iscrizione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (torneo_id) REFERENCES tornei(id),
    FOREIGN KEY (squadra_id) REFERENCES squadre(id),
    UNIQUE(torneo_id, squadra_id)
);

-- Tabella partite
CREATE TABLE IF NOT EXISTS partite (
    id SERIAL PRIMARY KEY,
    torneo_id INTEGER,
    giornata INTEGER,
    squadra_casa_id INTEGER,
    squadra_trasferta_id INTEGER,
    gol_casa INTEGER,
    gol_trasferta INTEGER,
    punti_casa INTEGER,
    punti_trasferta INTEGER,
    data_partita TIMESTAMP,
    stato TEXT DEFAULT 'programmata',
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (torneo_id) REFERENCES tornei(id),
    FOREIGN KEY (squadra_casa_id) REFERENCES squadre(id),
    FOREIGN KEY (squadra_trasferta_id) REFERENCES squadre(id)
);

-- Tabella richieste_admin
CREATE TABLE IF NOT EXISTS richieste_admin (
    id SERIAL PRIMARY KEY,
    squadra_id INTEGER NOT NULL,
    tipo_richiesta TEXT NOT NULL,
    dati_richiesta TEXT,
    stato TEXT DEFAULT 'pending',
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_risposta TIMESTAMP,
    note_admin TEXT,
    FOREIGN KEY (squadra_id) REFERENCES squadre(id)
);

-- Tabella log_operazioni_giocatori
CREATE TABLE IF NOT EXISTS log_operazioni_giocatori (
    id SERIAL PRIMARY KEY,
    giocatore_id INTEGER,
    lega_id INTEGER,
    tipo_operazione TEXT,
    squadra_mittente_id INTEGER,
    squadra_destinatario_id INTEGER,
    valore REAL,
    dettagli TEXT,
    utente_id INTEGER,
    data_operazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella log_squadre
CREATE TABLE IF NOT EXISTS log_squadre (
    id SERIAL PRIMARY KEY,
    squadra_id INTEGER NOT NULL,
    lega_id INTEGER NOT NULL,
    tipo_evento TEXT NOT NULL,
    categoria TEXT NOT NULL,
    titolo TEXT NOT NULL,
    descrizione TEXT,
    dati_aggiuntivi TEXT,
    utente_id INTEGER,
    giocatore_id INTEGER,
    data_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (squadra_id) REFERENCES squadre(id),
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (utente_id) REFERENCES users(id),
    FOREIGN KEY (giocatore_id) REFERENCES giocatori(id)
);

-- Tabella pending_changes
CREATE TABLE IF NOT EXISTS pending_changes (
    id SERIAL PRIMARY KEY,
    lega_id INTEGER NOT NULL,
    subadmin_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    action_data TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    description TEXT,
    details TEXT,
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (subadmin_id) REFERENCES users(id)
);

-- Tabella log_contratti
CREATE TABLE IF NOT EXISTS log_contratti (
    id SERIAL PRIMARY KEY,
    giocatore_id INTEGER NOT NULL,
    lega_id INTEGER NOT NULL,
    squadra_id INTEGER NOT NULL,
    tipo_contratto TEXT NOT NULL,
    valore REAL,
    durata_anni INTEGER,
    data_inizio DATE,
    data_fine DATE,
    stato TEXT DEFAULT 'attivo',
    note TEXT,
    utente_id INTEGER,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (giocatore_id) REFERENCES giocatori(id),
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (squadra_id) REFERENCES squadre(id),
    FOREIGN KEY (utente_id) REFERENCES users(id)
);

-- Tabella qa_history
CREATE TABLE IF NOT EXISTS qa_history (
    id SERIAL PRIMARY KEY,
    giocatore_id INTEGER NOT NULL,
    qa_value REAL NOT NULL,
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fonte TEXT DEFAULT 'scraping',
    FOREIGN KEY (giocatore_id) REFERENCES giocatori(id)
);

-- Tabella tornei_preferiti
CREATE TABLE IF NOT EXISTS tornei_preferiti (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL,
    lega_id INTEGER NOT NULL,
    torneo_id INTEGER NOT NULL,
    data_preferenza TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utente_id) REFERENCES users(id),
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (torneo_id) REFERENCES tornei(id),
    UNIQUE(utente_id, torneo_id)
);

-- Tabella richieste_ingresso
CREATE TABLE IF NOT EXISTS richieste_ingresso (
    id SERIAL PRIMARY KEY,
    utente_id INTEGER NOT NULL,
    lega_id INTEGER NOT NULL,
    squadra_id INTEGER NOT NULL,
    password_fornita TEXT,
    stato TEXT DEFAULT 'in_attesa',
    data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_risposta TIMESTAMP,
    risposta_admin_id INTEGER,
    messaggio_richiesta TEXT,
    messaggio_risposta TEXT,
    FOREIGN KEY (utente_id) REFERENCES users(id),
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (squadra_id) REFERENCES squadre(id),
    FOREIGN KEY (risposta_admin_id) REFERENCES users(id)
);

-- Tabella richieste_unione_squadra
CREATE TABLE IF NOT EXISTS richieste_unione_squadra (
    id SERIAL PRIMARY KEY,
    squadra_richiedente_id INTEGER NOT NULL,
    squadra_destinatario_id INTEGER NOT NULL,
    stato TEXT DEFAULT 'pending',
    data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_risposta TIMESTAMP,
    messaggio_richiesta TEXT,
    messaggio_risposta TEXT,
    FOREIGN KEY (squadra_richiedente_id) REFERENCES squadre(id),
    FOREIGN KEY (squadra_destinatario_id) REFERENCES squadre(id)
);

-- Tabella squadre_scraping
CREATE TABLE IF NOT EXISTS squadre_scraping (
    id SERIAL PRIMARY KEY,
    lega_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fonte_scraping TEXT DEFAULT 'puppeteer',
    FOREIGN KEY (lega_id) REFERENCES leghe(id)
);

-- Tabella giocatori_scraping
CREATE TABLE IF NOT EXISTS giocatori_scraping (
    id SERIAL PRIMARY KEY,
    lega_id INTEGER NOT NULL,
    squadra_scraping_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    ruolo TEXT,
    squadra_reale TEXT,
    quotazione REAL,
    fv_mp TEXT,
    data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fonte_scraping TEXT DEFAULT 'puppeteer',
    qi REAL,
    FOREIGN KEY (lega_id) REFERENCES leghe(id),
    FOREIGN KEY (squadra_scraping_id) REFERENCES squadre_scraping(id)
);

-- Tabella classifica_scraping
CREATE TABLE IF NOT EXISTS classifica_scraping (
    id SERIAL PRIMARY KEY,
    lega_id INTEGER NOT NULL,
    posizione INTEGER NOT NULL,
    squadra TEXT NOT NULL,
    punti INTEGER DEFAULT 0,
    partite INTEGER DEFAULT 0,
    data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fonte_scraping TEXT DEFAULT 'playwright',
    vittorie INTEGER DEFAULT 0,
    pareggi INTEGER DEFAULT 0,
    sconfitte INTEGER DEFAULT 0,
    gol_fatti INTEGER DEFAULT 0,
    gol_subiti INTEGER DEFAULT 0,
    differenza_reti INTEGER DEFAULT 0,
    punti_totali REAL DEFAULT 0,
    FOREIGN KEY (lega_id) REFERENCES leghe(id)
);

-- Tabella voti_scraping
CREATE TABLE IF NOT EXISTS voti_scraping (
    id SERIAL PRIMARY KEY,
    lega_id INTEGER NOT NULL,
    giocatore TEXT NOT NULL,
    voto REAL NOT NULL,
    squadra TEXT,
    giornata INTEGER DEFAULT 1,
    data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fonte_scraping TEXT DEFAULT 'playwright',
    FOREIGN KEY (lega_id) REFERENCES leghe(id)
);

-- Tabella formazioni_scraping
CREATE TABLE IF NOT EXISTS formazioni_scraping (
    id SERIAL PRIMARY KEY,
    lega_id INTEGER NOT NULL,
    squadra TEXT NOT NULL,
    modulo TEXT,
    titolari TEXT,
    panchina TEXT,
    esclusi TEXT,
    data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fonte_scraping TEXT DEFAULT 'playwright',
    giornata INTEGER DEFAULT 1,
    FOREIGN KEY (lega_id) REFERENCES leghe(id)
);

-- Tabella mercato_scraping
CREATE TABLE IF NOT EXISTS mercato_scraping (
    id SERIAL PRIMARY KEY,
    lega_id INTEGER NOT NULL,
    giocatore TEXT NOT NULL,
    squadra_attuale TEXT,
    squadra_destinazione TEXT,
    tipo_operazione TEXT,
    valore REAL,
    data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fonte_scraping TEXT DEFAULT 'puppeteer',
    FOREIGN KEY (lega_id) REFERENCES leghe(id)
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_tornei_lega_id ON tornei(lega_id);
CREATE INDEX IF NOT EXISTS idx_tornei_squadre_torneo_id ON tornei_squadre(torneo_id);
CREATE INDEX IF NOT EXISTS idx_tornei_squadre_squadra_id ON tornei_squadre(squadra_id);
CREATE INDEX IF NOT EXISTS idx_partite_torneo_id ON partite(torneo_id);
CREATE INDEX IF NOT EXISTS idx_partite_giornata ON partite(giornata);
CREATE INDEX IF NOT EXISTS idx_richieste_admin_squadra_id ON richieste_admin(squadra_id);
CREATE INDEX IF NOT EXISTS idx_log_operazioni_giocatori_giocatore_id ON log_operazioni_giocatori(giocatore_id);
CREATE INDEX IF NOT EXISTS idx_log_squadre_squadra_id ON log_squadre(squadra_id);
CREATE INDEX IF NOT EXISTS idx_qa_history_giocatore_id ON qa_history(giocatore_id); 