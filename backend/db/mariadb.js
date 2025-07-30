import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Configurazione MariaDB
let pool = null;

export function getDb() {
  console.log('🔍 getDb() called - pool:', pool ? 'available' : 'null');
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
  
  // If pool is null but DATABASE_URL is set, try to initialize
  if (!pool && process.env.DATABASE_URL) {
    console.log('⚠️ Pool is null but DATABASE_URL is set - attempting initialization...');
    // Don't initialize here, just return the fallback
    return {
      query: async (sql, params = []) => {
        console.error('❌ Database query attempted but pool is null:', sql);
        throw new Error('Database not available - pool is null');
      },
      execute: async (sql, params = []) => {
        console.error('❌ Database execute attempted but pool is null:', sql);
        throw new Error('Database not available - pool is null');
      }
    };
  }
  
  if (!pool) {
    console.log('⚠️ Database pool not available, database functionality will be disabled');
    return {
      query: async (sql, params = []) => {
        console.error('❌ Database query attempted but pool is null:', sql);
        throw new Error('Database not available - pool is null');
      },
      execute: async (sql, params = []) => {
        console.error('❌ Database execute attempted but pool is null:', sql);
        throw new Error('Database not available - pool is null');
      }
    };
  }
  
  return {
    query: async (sql, params = []) => {
      try {
      const result = await pool.execute(sql, params);
      return { 
        rows: result[0], 
        fields: result[1],
        insertId: result[0].insertId || result[0].insert_id
      };
      } catch (error) {
        console.error('❌ Database query error:', error.message);
        console.error('❌ SQL:', sql);
        console.error('❌ Params:', params);
        throw error;
      }
    },
    execute: async (sql, params = []) => {
      try {
        return await pool.execute(sql, params);
      } catch (error) {
        console.error('❌ Database execute error:', error.message);
        console.error('❌ SQL:', sql);
        console.error('❌ Params:', params);
        throw error;
      }
    }
  };
}

export async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('⚠️ DATABASE_URL not set, database functionality will be disabled');
    return;
  }

  try {
    console.log('🔄 Connecting to MariaDB database...');
    console.log('🔍 DATABASE_URL:', databaseUrl.substring(0, 20) + '...');
    
    // Parse DATABASE_URL per MariaDB
    const url = new URL(databaseUrl);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Rimuovi lo slash iniziale
      // Configurazione per performance
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true
    };

    console.log('🔍 Database config:', {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database
    });

    pool = mysql.createPool(config);

    // Test connection with retry
    let retries = 3;
    while (retries > 0) {
      try {
    const connection = await pool.getConnection();
    await connection.query('SELECT NOW()');
    connection.release();
    console.log('✅ Connected to MariaDB database');
        break;
      } catch (error) {
        retries--;
        console.error(`❌ Database connection attempt failed (${3-retries}/3):`, error.message);
        if (retries === 0) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
    
    // Create missing tables
    await createMissingTables();
    
    // Update existing tables with missing columns
    await updateExistingTables();
    
    console.log('✅ Database initialization completed');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    pool = null;
  }
}

async function createMissingTables() {
  try {
    console.log('📄 Creating missing tables...');
    
    // Prima creiamo le tabelle base (senza foreign key)
    const baseTables = [
      // Tabella users
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
      )`,
      
      // Tabella leghe
      `CREATE TABLE IF NOT EXISTS leghe (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome TEXT NOT NULL,
        descrizione TEXT,
        admin_id INT NOT NULL,
        modalita TEXT DEFAULT 'Classic Serie A',
        max_squadre INT DEFAULT 20,
        is_pubblica BOOLEAN DEFAULT true,
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_modifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        stato TEXT DEFAULT 'attiva',
        password TEXT,
        is_privata BOOLEAN DEFAULT false,
        subadmin_id INT,
        roster_ab INT DEFAULT 0,
        cantera INT DEFAULT 0,
        contratti INT DEFAULT 0,
        triggers INT DEFAULT 0,
        max_portieri INT DEFAULT 3,
        min_portieri INT DEFAULT 2,
        max_difensori INT DEFAULT 8,
        min_difensori INT DEFAULT 5,
        max_centrocampisti INT DEFAULT 8,
        min_centrocampisti INT DEFAULT 5,
        max_attaccanti INT DEFAULT 6,
        min_attaccanti INT DEFAULT 3,
        FOREIGN KEY (admin_id) REFERENCES users(id),
        FOREIGN KEY (subadmin_id) REFERENCES users(id)
      )`,
      
      // Tabella squadre
      `CREATE TABLE IF NOT EXISTS squadre (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        proprietario_id INT,
        club_level INT DEFAULT 1,
        casse_societarie INT DEFAULT 0,
        costo_salariale_totale INT DEFAULT 0,
        costo_salariale_annuale INT DEFAULT 0,
        valore_squadra INT DEFAULT 0,
        is_orfana BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        proprietario_username VARCHAR(255),
        logo_url TEXT,
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (proprietario_id) REFERENCES users(id)
      )`,
      
      // Tabella giocatori
      `CREATE TABLE IF NOT EXISTS giocatori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        squadra_id INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        cognome VARCHAR(255) NOT NULL,
        ruolo VARCHAR(10) NOT NULL,
        quotazione INT DEFAULT 0,
        fv_mp VARCHAR(50),
        qi DECIMAL(10,2),
        qa DECIMAL(10,2),
        site_id VARCHAR(255),
        nazione_campionato VARCHAR(255),
        fvm INT DEFAULT 0,
        media_voto DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (squadra_id) REFERENCES squadre(id)
      )`
    ];
    
    // Creiamo prima le tabelle base
    for (const table of baseTables) {
      await pool.execute(table);
    }
    
    // Ora creiamo le tabelle con foreign key
    const dependentTables = [
      // Tabella tornei
      `CREATE TABLE IF NOT EXISTS tornei (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'campionato',
        formato VARCHAR(50) DEFAULT 'girone_unico',
        giornate_totali INT,
        data_inizio DATE,
        data_fine DATE,
        descrizione TEXT,
        informazioni_utente TEXT,
        stato VARCHAR(50) DEFAULT 'programmato',
        admin_id INT,
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (admin_id) REFERENCES users(id)
      )`,
      
      // Tabella tornei_squadre
      `CREATE TABLE IF NOT EXISTS tornei_squadre (
        id INT AUTO_INCREMENT PRIMARY KEY,
        torneo_id INT,
        squadra_id INT,
        data_iscrizione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (torneo_id) REFERENCES tornei(id),
        FOREIGN KEY (squadra_id) REFERENCES squadre(id),
        UNIQUE KEY unique_torneo_squadra (torneo_id, squadra_id)
      )`,
      
      // Tabella partite
      `CREATE TABLE IF NOT EXISTS partite (
        id INT AUTO_INCREMENT PRIMARY KEY,
        torneo_id INT,
        giornata INT,
        squadra_casa_id INT,
        squadra_trasferta_id INT,
        gol_casa INT DEFAULT 0,
        gol_trasferta INT DEFAULT 0,
        punti_casa INT DEFAULT 0,
        punti_trasferta INT DEFAULT 0,
        data_partita DATETIME,
        stato VARCHAR(50) DEFAULT 'programmata',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (torneo_id) REFERENCES tornei(id),
        FOREIGN KEY (squadra_casa_id) REFERENCES squadre(id),
        FOREIGN KEY (squadra_trasferta_id) REFERENCES squadre(id)
      )`,
      
      // Tabella classifica
      `CREATE TABLE IF NOT EXISTS classifica (
        id INT AUTO_INCREMENT PRIMARY KEY,
        torneo_id INT,
        squadra_id INT,
        punti INT DEFAULT 0,
        partite_giocate INT DEFAULT 0,
        vittorie INT DEFAULT 0,
        pareggi INT DEFAULT 0,
        sconfitte INT DEFAULT 0,
        gol_fatti INT DEFAULT 0,
        gol_subiti INT DEFAULT 0,
        FOREIGN KEY (torneo_id) REFERENCES tornei(id),
        FOREIGN KEY (squadra_id) REFERENCES squadre(id),
        UNIQUE KEY unique_torneo_squadra (torneo_id, squadra_id)
      )`,
      
      // Tabella notifiche
      `CREATE TABLE IF NOT EXISTS notifiche (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        titolo VARCHAR(255) NOT NULL,
        messaggio TEXT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'info',
        letto BOOLEAN DEFAULT FALSE,
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_lettura TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // Tabella richieste_ingresso
      `CREATE TABLE IF NOT EXISTS richieste_ingresso (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utente_id INT NOT NULL,
        lega_id INT NOT NULL,
        squadra_id INT NOT NULL,
        password_fornita TEXT,
        stato VARCHAR(50) DEFAULT 'in_attesa',
        data_richiesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP NULL,
        risposta_admin_id INT NULL,
        messaggio_richiesta TEXT,
        messaggio_risposta TEXT,
        FOREIGN KEY (utente_id) REFERENCES users(id),
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (squadra_id) REFERENCES squadre(id),
        FOREIGN KEY (risposta_admin_id) REFERENCES users(id)
      )`,
      
      // Tabella log
      `CREATE TABLE IF NOT EXISTS log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        azione VARCHAR(255) NOT NULL,
        dettagli TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // Tabella squadre_scraping
      `CREATE TABLE IF NOT EXISTS squadre_scraping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping VARCHAR(50) DEFAULT 'puppeteer',
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
      )`,
      
      // Tabella giocatori_scraping
      `CREATE TABLE IF NOT EXISTS giocatori_scraping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        squadra_scraping_id INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        ruolo VARCHAR(50),
        squadra_reale VARCHAR(255),
        quotazione DECIMAL(10,2),
        fv_mp VARCHAR(50),
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping VARCHAR(50) DEFAULT 'puppeteer',
        qi DECIMAL(10,2),
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (squadra_scraping_id) REFERENCES squadre_scraping(id)
      )`,
      
      // Tabella classifica_scraping
      `CREATE TABLE IF NOT EXISTS classifica_scraping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        posizione INT NOT NULL,
        squadra VARCHAR(255) NOT NULL,
        punti INT DEFAULT 0,
        partite INT DEFAULT 0,
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping VARCHAR(50) DEFAULT 'playwright',
        vittorie INT DEFAULT 0,
        pareggi INT DEFAULT 0,
        sconfitte INT DEFAULT 0,
        gol_fatti INT DEFAULT 0,
        gol_subiti INT DEFAULT 0,
        differenza_reti INT DEFAULT 0,
        punti_totali DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
      )`,
      
      // Tabella voti_scraping
      `CREATE TABLE IF NOT EXISTS voti_scraping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        giocatore VARCHAR(255) NOT NULL,
        voto DECIMAL(10,2) NOT NULL,
        squadra VARCHAR(255),
        giornata INT DEFAULT 1,
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping VARCHAR(50) DEFAULT 'playwright',
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
      )`,
      
      // Tabella formazioni_scraping
      `CREATE TABLE IF NOT EXISTS formazioni_scraping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        squadra VARCHAR(255) NOT NULL,
        modulo VARCHAR(50),
        titolari TEXT,
        panchina TEXT,
        esclusi TEXT,
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping VARCHAR(50) DEFAULT 'playwright',
        giornata INT DEFAULT 1,
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
      )`,
      
      // Tabella mercato_scraping
      `CREATE TABLE IF NOT EXISTS mercato_scraping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        giocatore VARCHAR(255) NOT NULL,
        da VARCHAR(255),
        a VARCHAR(255),
        prezzo VARCHAR(255),
        tipo VARCHAR(50),
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping VARCHAR(50) DEFAULT 'playwright',
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
      )`,
      
      // Tabella qa_history
      `CREATE TABLE IF NOT EXISTS qa_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        giocatore_id INT NOT NULL,
        qa_value DECIMAL(10,2) NOT NULL,
        data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte VARCHAR(50) DEFAULT 'scraping',
        FOREIGN KEY (giocatore_id) REFERENCES giocatori(id)
      )`,
      
      // Tabella tornei_preferiti
      `CREATE TABLE IF NOT EXISTS tornei_preferiti (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utente_id INT NOT NULL,
        lega_id INT NOT NULL,
        torneo_id VARCHAR(255) NOT NULL,
        torneo_nome VARCHAR(255) NOT NULL,
        torneo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utente_id) REFERENCES users(id),
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        UNIQUE KEY unique_utente_lega_torneo (utente_id, lega_id, torneo_id)
      )`,
      
      // Tabella pending_changes
      `CREATE TABLE IF NOT EXISTS pending_changes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        subadmin_id INT NOT NULL,
        action_type VARCHAR(255) NOT NULL,
        action_data TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        admin_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        description TEXT,
        details TEXT,
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (subadmin_id) REFERENCES users(id)
      )`
    ];
    
    // Creiamo le tabelle dipendenti
    for (const table of dependentTables) {
      await pool.execute(table);
    }
    
    console.log('✅ All tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  }
}

async function updateExistingTables() {
  try {
    console.log('🔧 Updating existing tables...');
    
    // Verifica e aggiungi colonne mancanti alla tabella users
    const userColumns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS ruolo VARCHAR(50) DEFAULT "user"',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS ultimo_accesso TIMESTAMP NULL',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT TRUE'
    ];

    for (const column of userColumns) {
      try {
        await pool.execute(column);
      } catch (error) {
        // Ignora errori se la colonna esiste già
        console.log(`Column might already exist: ${error.message}`);
      }
    }

    // Verifica e aggiungi colonne mancanti alla tabella leghe
    const legheColumns = [
      'ALTER TABLE leghe ADD COLUMN IF NOT EXISTS descrizione TEXT',
      'ALTER TABLE leghe ADD COLUMN IF NOT EXISTS regole TEXT',
      'ALTER TABLE leghe ADD COLUMN IF NOT EXISTS data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'ALTER TABLE leghe ADD COLUMN IF NOT EXISTS stato VARCHAR(50) DEFAULT "attiva"'
    ];

    for (const column of legheColumns) {
      try {
        await pool.execute(column);
      } catch (error) {
        console.log(`Column might already exist: ${error.message}`);
      }
    }

    console.log('✅ Tables updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating tables:', error.message);
  }
}

export async function initDb() {
  await initializeDatabase();
}

// Funzioni helper per query comuni
export async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database not available');
  }
  const result = await pool.execute(sql, params);
  return { rows: result[0], fields: result[1] };
}

export async function queryOne(sql, params = []) {
  const [rows] = await query(sql, params);
  return rows[0];
}

export async function queryAll(sql, params = []) {
  const [rows] = await query(sql, params);
  return rows;
}

export async function insert(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  const [result] = await query(sql, values);
  
  return result.insertId;
}

export async function update(table, data, where, whereParams = []) {
  const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
  const params = [...Object.values(data), ...whereParams];
  
  const [result] = await query(sql, params);
  return result.affectedRows;
}

export async function deleteRecord(table, where, params = []) {
  const sql = `DELETE FROM ${table} WHERE ${where}`;
  const [result] = await query(sql, params);
  return result.affectedRows;
} 