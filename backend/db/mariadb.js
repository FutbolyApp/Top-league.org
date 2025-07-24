import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';

// Configurazione MariaDB
let pool = null;

export function getDb() {
  console.log('🔍 getDb() called - pool:', pool ? 'available' : 'null');
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
  if (!pool) {
    console.log('⚠️ DATABASE_URL not set, database functionality will be disabled');
    return null;
  }
  return {
    query: async (sql, params = []) => {
      const result = await pool.execute(sql, params);
      return { 
        rows: result[0], 
        fields: result[1],
        insertId: result[0].insertId || result[0].insert_id
      };
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
    
    // Parse DATABASE_URL per MariaDB
    const url = new URL(databaseUrl);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Rimuovi lo slash iniziale
      ssl: {
        rejectUnauthorized: false
      },
      // Configurazione per performance
      connectionLimit: 10
    };

    pool = mysql.createPool(config);

    // Test connection
    const connection = await pool.getConnection();
    await connection.query('SELECT NOW()');
    connection.release();
    
    console.log('✅ Connected to MariaDB database');
    
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
      
      // Tabella notifiche (se non esiste)
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
      
      // Tabella transazioni
      `CREATE TABLE IF NOT EXISTS transazioni (
        id INT AUTO_INCREMENT PRIMARY KEY,
        squadra_id INT NOT NULL,
        tipo ENUM('entrata', 'uscita') NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        importo DECIMAL(10,2) NOT NULL,
        descrizione TEXT,
        giocatore_id INT,
        data_transazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (squadra_id) REFERENCES squadre(id),
        FOREIGN KEY (giocatore_id) REFERENCES giocatori(id)
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
        squadra_attuale VARCHAR(255),
        squadra_destinazione VARCHAR(255),
        tipo_operazione VARCHAR(50),
        valore DECIMAL(10,2),
        data_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte_scraping VARCHAR(50) DEFAULT 'puppeteer',
        FOREIGN KEY (lega_id) REFERENCES leghe(id)
      )`
    ];

    for (const table of tables) {
      await pool.execute(table);
    }
    
    console.log('✅ All tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
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

async function migrateDataIfNeeded() {
  try {
    console.log('🔄 Checking for data migration...');
    
    // Verifica se ci sono dati da migrare da SQLite
    const sqliteFile = './db/topleague.db';
    if (fs.existsSync(sqliteFile)) {
      console.log('📦 SQLite database found, migration may be needed');
      // Qui puoi aggiungere la logica di migrazione se necessario
    }
    
  } catch (error) {
    console.error('❌ Error during migration check:', error.message);
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