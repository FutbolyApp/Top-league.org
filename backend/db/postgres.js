import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

// Configurazione PostgreSQL
let pool = null;

export function getDb() {
  if (!pool) {
    console.log('⚠️ DATABASE_URL not set, database functionality will be disabled');
    return null;
  }
  return pool;
}

export async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('⚠️ DATABASE_URL not set, database functionality will be disabled');
    return;
  }

  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Connected to PostgreSQL database');
    
    // Create missing tables
    await createMissingTables();
    
    // Update existing tables with missing columns
    await updateExistingTables();
    
    // Migrate data from SQLite if needed
    await migrateDataIfNeeded();
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    pool = null;
  }
}

async function createMissingTables() {
  try {
    console.log('📄 Creating missing tables...');
    
    const tables = [
      // Tabella tornei
      `CREATE TABLE IF NOT EXISTS tornei (
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
      )`,
      
      // Tabella tornei_squadre
      `CREATE TABLE IF NOT EXISTS tornei_squadre (
        id SERIAL PRIMARY KEY,
        torneo_id INTEGER,
        squadra_id INTEGER,
        data_iscrizione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (torneo_id) REFERENCES tornei(id),
        FOREIGN KEY (squadra_id) REFERENCES squadre(id),
        UNIQUE(torneo_id, squadra_id)
      )`,
      
      // Tabella partite
      `CREATE TABLE IF NOT EXISTS partite (
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
      )`,
      
      // Tabella richieste_admin
      `CREATE TABLE IF NOT EXISTS richieste_admin (
        id SERIAL PRIMARY KEY,
        squadra_id INTEGER NOT NULL,
        tipo_richiesta TEXT NOT NULL,
        dati_richiesta TEXT,
        stato TEXT DEFAULT 'pending',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP,
        note_admin TEXT,
        FOREIGN KEY (squadra_id) REFERENCES squadre(id)
      )`,
      
      // Tabella log_operazioni_giocatori
      `CREATE TABLE IF NOT EXISTS log_operazioni_giocatori (
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
      )`,
      
      // Tabella log_squadre
      `CREATE TABLE IF NOT EXISTS log_squadre (
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
      )`,
      
      // Tabella pending_changes
      `CREATE TABLE IF NOT EXISTS pending_changes (
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
      )`,
      
      // Tabella log_contratti
      `CREATE TABLE IF NOT EXISTS log_contratti (
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
      )`,
      
      // Tabella qa_history
      `CREATE TABLE IF NOT EXISTS qa_history (
        id SERIAL PRIMARY KEY,
        giocatore_id INTEGER NOT NULL,
        qa_value REAL NOT NULL,
        data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte TEXT DEFAULT 'scraping',
        FOREIGN KEY (giocatore_id) REFERENCES giocatori(id)
      )`,
      
      // Tabella tornei_preferiti
      `CREATE TABLE IF NOT EXISTS tornei_preferiti (
        id SERIAL PRIMARY KEY,
        utente_id INTEGER NOT NULL,
        lega_id INTEGER NOT NULL,
        torneo_id INTEGER NOT NULL,
        data_preferenza TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utente_id) REFERENCES users(id),
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (torneo_id) REFERENCES tornei(id),
        UNIQUE(utente_id, torneo_id)
      )`,
      
      // Tabella richieste_unione_squadra
      `CREATE TABLE IF NOT EXISTS richieste_unione_squadra (
        id SERIAL PRIMARY KEY,
        utente_id INTEGER NOT NULL,
        squadra_id INTEGER NOT NULL,
        lega_id INTEGER NOT NULL,
        stato TEXT DEFAULT 'in_attesa',
        data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP,
        risposta_admin_id INTEGER,
        messaggio_richiesta TEXT,
        messaggio_risposta TEXT,
        FOREIGN KEY (utente_id) REFERENCES users(id),
        FOREIGN KEY (squadra_id) REFERENCES squadre(id),
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (risposta_admin_id) REFERENCES users(id)
      )`,
      
      // Tabella squadre_scraping
      `CREATE TABLE IF NOT EXISTS squadre_scraping (
        id SERIAL PRIMARY KEY,
        lega_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping TEXT DEFAULT 'puppeteer',
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
      )`,
      
      // Tabella giocatori_scraping
      `CREATE TABLE IF NOT EXISTS giocatori_scraping (
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
      )`,
      
      // Tabella classifica_scraping
      `CREATE TABLE IF NOT EXISTS classifica_scraping (
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
      )`,
      
      // Tabella voti_scraping
      `CREATE TABLE IF NOT EXISTS voti_scraping (
        id SERIAL PRIMARY KEY,
        lega_id INTEGER NOT NULL,
        giocatore TEXT NOT NULL,
        voto REAL NOT NULL,
        squadra TEXT,
        giornata INTEGER DEFAULT 1,
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping TEXT DEFAULT 'playwright',
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
      )`,
      
      // Tabella formazioni_scraping
      `CREATE TABLE IF NOT EXISTS formazioni_scraping (
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
      )`,
      
      // Tabella mercato_scraping
      `CREATE TABLE IF NOT EXISTS mercato_scraping (
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
      )`
    ];
    
    for (const tableSql of tables) {
      try {
        await pool.query(tableSql);
      } catch (error) {
        console.log(`⚠️ Warning creating table: ${error.message}`);
      }
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_tornei_lega_id ON tornei(lega_id)',
      'CREATE INDEX IF NOT EXISTS idx_tornei_squadre_torneo_id ON tornei_squadre(torneo_id)',
      'CREATE INDEX IF NOT EXISTS idx_tornei_squadre_squadra_id ON tornei_squadre(squadra_id)',
      'CREATE INDEX IF NOT EXISTS idx_partite_torneo_id ON partite(torneo_id)',
      'CREATE INDEX IF NOT EXISTS idx_partite_giornata ON partite(giornata)',
      'CREATE INDEX IF NOT EXISTS idx_richieste_admin_squadra_id ON richieste_admin(squadra_id)',
      'CREATE INDEX IF NOT EXISTS idx_log_operazioni_giocatori_giocatore_id ON log_operazioni_giocatori(giocatore_id)',
      'CREATE INDEX IF NOT EXISTS idx_log_squadre_squadra_id ON log_squadre(squadra_id)',
      'CREATE INDEX IF NOT EXISTS idx_qa_history_giocatore_id ON qa_history(giocatore_id)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await pool.query(indexSql);
      } catch (error) {
        console.log(`⚠️ Warning creating index: ${error.message}`);
      }
    }
    
    console.log('✅ All missing tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating missing tables:', error);
  }
}

async function migrateDataIfNeeded() {
  try {
    console.log('📊 Checking if data migration is needed...');
    
    // Controlla se ci sono dati in PostgreSQL
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    if (userCount > 0) {
      console.log(`✅ PostgreSQL already has ${userCount} users, skipping migration`);
      return;
    }
    
    console.log('🔄 No users found in PostgreSQL, creating default admin user...');
    
    // Crea un utente admin di default
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      await pool.query(`
        INSERT INTO users (id, nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo, created_at)
        VALUES (1, 'Admin', 'User', 'admin', 'Default', 'Default', 'Default', 'admin@topleague.com', $1, 'SuperAdmin', NOW())
        ON CONFLICT (id) DO NOTHING
      `, [hashedPassword]);
      
      console.log('✅ Default admin user created');
      
      // Crea una lega di test
      await pool.query(`
        INSERT INTO leghe (id, nome, modalita, admin_id, is_pubblica, max_squadre, min_giocatori, max_giocatori, roster_ab, cantera, contratti, triggers, created_at)
        VALUES (1, 'Test League', 'serie_a', 1, true, 10, 20, 25, true, true, true, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `);
      
      console.log('✅ Default test league created');
      
    } catch (error) {
      console.log(`⚠️ Warning creating default data: ${error.message}`);
    }
    
  } catch (error) {
    console.log('⚠️ Data migration failed:', error.message);
  }
}

async function updateExistingTables() {
  try {
    console.log('🔄 Updating existing tables with missing columns...');
    
    // Update richieste_admin table if needed
    try {
      // Check if dati_richiesta column exists
      const checkDatiRichiesta = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'richieste_admin' AND column_name = 'dati_richiesta'
      `);
      
      if (checkDatiRichiesta.rows.length === 0) {
        console.log('📄 Adding dati_richiesta column to richieste_admin table...');
        await pool.query(`
          ALTER TABLE richieste_admin ADD COLUMN dati_richiesta TEXT
        `);
        console.log('✅ dati_richiesta column added');
      } else {
        console.log('✅ dati_richiesta column already exists');
      }
    } catch (error) {
      console.log(`Column dati_richiesta already exists or error: ${error.message}`);
    }
    
    try {
      // Check if data_creazione column exists
      const checkDataCreazione = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'richieste_admin' AND column_name = 'data_creazione'
      `);
      
      if (checkDataCreazione.rows.length === 0) {
        console.log('📄 Adding data_creazione column to richieste_admin table...');
        await pool.query(`
          ALTER TABLE richieste_admin ADD COLUMN data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ data_creazione column added');
      } else {
        console.log('✅ data_creazione column already exists');
      }
    } catch (error) {
      console.log(`Column data_creazione already exists or error: ${error.message}`);
    }
    
    // Update other tables as needed
    try {
      await pool.query(`
        ALTER TABLE giocatori 
        ADD COLUMN IF NOT EXISTS roster VARCHAR(10) DEFAULT 'A'
      `);
    } catch (error) {
      console.log(`Column roster already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE giocatori 
        ADD COLUMN IF NOT EXISTS valore_prestito REAL DEFAULT 0
      `);
    } catch (error) {
      console.log(`Column valore_prestito already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE giocatori 
        ADD COLUMN IF NOT EXISTS valore_trasferimento REAL DEFAULT 0
      `);
    } catch (error) {
      console.log(`Column valore_trasferimento already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE leghe 
        ADD COLUMN IF NOT EXISTS max_portieri INTEGER DEFAULT 3
      `);
    } catch (error) {
      console.log(`Column max_portieri already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE leghe 
        ADD COLUMN IF NOT EXISTS min_portieri INTEGER DEFAULT 2
      `);
    } catch (error) {
      console.log(`Column min_portieri already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE leghe 
        ADD COLUMN IF NOT EXISTS max_difensori INTEGER DEFAULT 8
      `);
    } catch (error) {
      console.log(`Column max_difensori already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE leghe 
        ADD COLUMN IF NOT EXISTS min_difensori INTEGER DEFAULT 5
      `);
    } catch (error) {
      console.log(`Column min_difensori already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE leghe 
        ADD COLUMN IF NOT EXISTS max_centrocampisti INTEGER DEFAULT 8
      `);
    } catch (error) {
      console.log(`Column max_centrocampisti already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE leghe 
        ADD COLUMN IF NOT EXISTS min_centrocampisti INTEGER DEFAULT 5
      `);
    } catch (error) {
      console.log(`Column min_centrocampisti already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE leghe 
        ADD COLUMN IF NOT EXISTS max_attaccanti INTEGER DEFAULT 6
      `);
    } catch (error) {
      console.log(`Column max_attaccanti already exists or error: ${error.message}`);
    }
    
    try {
      await pool.query(`
        ALTER TABLE leghe 
        ADD COLUMN IF NOT EXISTS min_attaccanti INTEGER DEFAULT 3
      `);
    } catch (error) {
      console.log(`Column min_attaccanti already exists or error: ${error.message}`);
    }
    
    console.log('✅ Table updates completed');
    
  } catch (error) {
    console.error('❌ Error updating existing tables:', error);
  }
}

// Funzione per inizializzare le tabelle
export async function initDb() {
  if (!pool) {
    console.log('Database not available, skipping initialization');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    console.log('Creating tables...');
    
    // Tabella users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cognome VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE,
        provenienza VARCHAR(255),
        squadra_cuore VARCHAR(255),
        come_conosciuto TEXT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        ruolo VARCHAR(50) NOT NULL DEFAULT 'Utente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tabella leghe (aggiornata con colonne di configurazione)
    await client.query(`
      CREATE TABLE IF NOT EXISTS leghe (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        descrizione TEXT,
        admin_id INTEGER NOT NULL,
        modalita TEXT DEFAULT 'Classic Serie A',
        max_squadre INTEGER DEFAULT 20,
        is_pubblica BOOLEAN DEFAULT true,
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_modifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        stato TEXT DEFAULT 'attiva',
        password TEXT,
        is_privata BOOLEAN DEFAULT false,
        subadmin_id INTEGER,
        roster_ab INTEGER DEFAULT 0,
        cantera INTEGER DEFAULT 0,
        contratti INTEGER DEFAULT 0,
        triggers INTEGER DEFAULT 0,
        max_portieri INTEGER DEFAULT 3,
        min_portieri INTEGER DEFAULT 2,
        max_difensori INTEGER DEFAULT 8,
        min_difensori INTEGER DEFAULT 5,
        max_centrocampisti INTEGER DEFAULT 8,
        min_centrocampisti INTEGER DEFAULT 5,
        max_attaccanti INTEGER DEFAULT 6,
        min_attaccanti INTEGER DEFAULT 3,
        FOREIGN KEY (admin_id) REFERENCES users(id),
        FOREIGN KEY (subadmin_id) REFERENCES users(id)
      );
    `);
    
    // Tabella squadre
    await client.query(`
      CREATE TABLE IF NOT EXISTS squadre (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        proprietario_id INTEGER REFERENCES users(id),
        is_orfana BOOLEAN DEFAULT true,
        club_level INTEGER DEFAULT 1,
        casse_societarie INTEGER DEFAULT 0,
        costo_salariale_totale INTEGER DEFAULT 0,
        costo_salariale_annuale INTEGER DEFAULT 0,
        valore_squadra INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tabella giocatori
    await client.query(`
      CREATE TABLE IF NOT EXISTS giocatori (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cognome VARCHAR(255),
        ruolo VARCHAR(50) NOT NULL,
        squadra_id INTEGER REFERENCES squadre(id),
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        squadra_reale VARCHAR(255),
        eta INTEGER,
        quotazione_attuale INTEGER,
        costo_attuale INTEGER DEFAULT 0,
        costo_precedente INTEGER,
        salario INTEGER DEFAULT 0,
        prestito BOOLEAN DEFAULT false,
        squadra_prestito_id INTEGER REFERENCES squadre(id),
        anni_contratto INTEGER DEFAULT 1,
        cantera BOOLEAN DEFAULT false,
        triggers TEXT,
        roster VARCHAR(10) DEFAULT 'A',
        valore_prestito REAL DEFAULT 0,
        valore_trasferimento REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tabella notifiche
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifiche (
        id SERIAL PRIMARY KEY,
        utente_id INTEGER NOT NULL REFERENCES users(id),
        lega_id INTEGER REFERENCES leghe(id),
        tipo VARCHAR(50) DEFAULT 'generale',
        titolo VARCHAR(255),
        messaggio TEXT NOT NULL,
        letta BOOLEAN DEFAULT false,
        archiviata BOOLEAN DEFAULT false,
        dati_aggiuntivi TEXT DEFAULT '{}',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_lettura TIMESTAMP
      );
    `);
    
    // Tabella offerte
    await client.query(`
      CREATE TABLE IF NOT EXISTS offerte (
        id SERIAL PRIMARY KEY,
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        giocatore_id INTEGER NOT NULL REFERENCES giocatori(id),
        squadra_mittente_id INTEGER NOT NULL REFERENCES squadre(id),
        squadra_destinatario_id INTEGER NOT NULL REFERENCES squadre(id),
        tipo VARCHAR(50) NOT NULL,
        valore INTEGER NOT NULL,
        stato VARCHAR(50) DEFAULT 'inviata',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tabella log
    await client.query(`
      CREATE TABLE IF NOT EXISTS log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        azione VARCHAR(255) NOT NULL,
        dettagli TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tabella log_squadre
    await client.query(`
      CREATE TABLE IF NOT EXISTS log_squadre (
        id SERIAL PRIMARY KEY,
        squadra_id INTEGER NOT NULL REFERENCES squadre(id),
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        tipo_evento VARCHAR(100) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        titolo VARCHAR(255) NOT NULL,
        descrizione TEXT,
        dati_aggiuntivi TEXT,
        utente_id INTEGER REFERENCES users(id),
        giocatore_id INTEGER REFERENCES giocatori(id),
        data_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tabella richieste_ingresso
    await client.query(`
      CREATE TABLE IF NOT EXISTS richieste_ingresso (
        id SERIAL PRIMARY KEY,
        utente_id INTEGER NOT NULL REFERENCES users(id),
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        squadra_id INTEGER NOT NULL REFERENCES squadre(id),
        password_fornita VARCHAR(255),
        stato VARCHAR(50) DEFAULT 'in_attesa',
        data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP,
        risposta_admin_id INTEGER REFERENCES users(id),
        messaggio_richiesta TEXT,
        messaggio_risposta TEXT
      );
    `);
    
    // Tabella subadmin
    await client.query(`
      CREATE TABLE IF NOT EXISTS subadmin (
        id SERIAL PRIMARY KEY,
        utente_id INTEGER NOT NULL REFERENCES users(id),
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        permessi TEXT DEFAULT '{}',
        attivo BOOLEAN DEFAULT true,
        data_nomina TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(utente_id, lega_id)
      );
    `);
    
    // Tabella pending_changes
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_changes (
        id SERIAL PRIMARY KEY,
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        subadmin_id INTEGER NOT NULL REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL,
        action_data TEXT NOT NULL,
        description TEXT,
        details TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        admin_response TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tabella tornei
    await client.query(`
      CREATE TABLE IF NOT EXISTS tornei (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        tipo VARCHAR(50) DEFAULT 'normale',
        stato VARCHAR(50) DEFAULT 'attivo',
        data_inizio DATE,
        data_fine DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Tabella richieste_admin
    await client.query(`
      CREATE TABLE IF NOT EXISTS richieste_admin (
        id SERIAL PRIMARY KEY,
        squadra_id INTEGER NOT NULL REFERENCES squadre(id),
        tipo_richiesta VARCHAR(50) NOT NULL,
        descrizione TEXT,
        stato VARCHAR(50) DEFAULT 'pending',
        data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP,
        risposta_admin_id INTEGER REFERENCES users(id),
        messaggio_risposta TEXT
      );
    `);
    
    // Tabella richieste_unione_squadra
    await client.query(`
      CREATE TABLE IF NOT EXISTS richieste_unione_squadra (
        id SERIAL PRIMARY KEY,
        utente_id INTEGER NOT NULL REFERENCES users(id),
        squadra_id INTEGER NOT NULL REFERENCES squadre(id),
        lega_id INTEGER NOT NULL REFERENCES leghe(id),
        stato VARCHAR(50) DEFAULT 'in_attesa',
        data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP,
        risposta_admin_id INTEGER REFERENCES users(id),
        messaggio_richiesta TEXT,
        messaggio_risposta TEXT
      );
    `);
    
    console.log('✅ All tables created successfully');
    
    // Migrazione: aggiungi colonne mancanti alla tabella notifiche se non esistono
    try {
      await client.query(`
        ALTER TABLE notifiche 
        ADD COLUMN IF NOT EXISTS archiviata BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS dati_aggiuntivi TEXT DEFAULT '{}'
      `);
      console.log('✅ Migration: added missing columns to notifiche table');
    } catch (error) {
      console.log('Migration note: columns may already exist:', error.message);
    }
    
    // Migrazione: aggiungi colonna data_nomina alla tabella subadmin se non esiste
    try {
      await client.query(`
        ALTER TABLE subadmin 
        ADD COLUMN IF NOT EXISTS data_nomina TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Migration: added data_nomina column to subadmin table');
    } catch (error) {
      console.log('Migration note: data_nomina column may already exist:', error.message);
    }
    
    // Crea un utente di test se non esiste
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    if (result.rows[0].count === '0') {
      console.log('Creating test user...');
      const password_hash = bcrypt.hashSync('admin123', 10);
      
      await client.query(`
        INSERT INTO users (nome, cognome, username, email, password_hash, ruolo) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['Futboly', 'Admin', 'futboly', 'admin@topleague.com', password_hash, 'SuperAdmin']);
      
      console.log('✅ Test user created');
      console.log('Email: admin@topleague.com');
      console.log('Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;