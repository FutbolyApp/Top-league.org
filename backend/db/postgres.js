import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Configurazione PostgreSQL
let pool;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test della connessione
    pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
      // Don't exit the process, just log the error
      console.log('Database connection error, but continuing...');
    });
  } catch (error) {
    console.error('❌ Failed to create database pool:', error.message);
    pool = null;
  }
} else {
  console.log('⚠️ DATABASE_URL not set, database functionality will be disabled');
  pool = null;
}

export function getDb() {
  if (!pool) {
    console.log('Database not available');
    return null;
  }
  return pool;
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
    
    // Tabella leghe
    await client.query(`
      CREATE TABLE IF NOT EXISTS leghe (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        modalita VARCHAR(50) NOT NULL,
        admin_id INTEGER NOT NULL REFERENCES users(id),
        is_pubblica BOOLEAN DEFAULT true,
        password VARCHAR(255),
        max_squadre INTEGER,
        min_giocatori INTEGER,
        max_giocatori INTEGER,
        roster_ab BOOLEAN DEFAULT false,
        cantera BOOLEAN DEFAULT false,
        contratti BOOLEAN DEFAULT false,
        triggers BOOLEAN DEFAULT false,
        regolamento_pdf TEXT,
        excel_originale TEXT,
        excel_modificato TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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