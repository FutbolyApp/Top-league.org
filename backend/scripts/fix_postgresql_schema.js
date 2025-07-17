import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: './env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addColumnIfNotExists(table, column, type) {
  try {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
    console.log(`✅ Colonna ${column} aggiunta a ${table}`);
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(`ℹ️ Colonna ${column} già esistente in ${table}`);
    } else {
      console.log(`⚠️ Errore aggiunta colonna ${column} in ${table}:`, err.message);
    }
  }
}

async function fixPostgresqlSchema() {
  try {
    console.log('🔄 Inizializzazione aggiornamento schema PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connesso al database PostgreSQL');

    // 1. CREA TABELLE MANCANTI
    console.log('\n📋 Creazione tabelle mancanti...');

    // utenti
    await pool.query(`CREATE TABLE IF NOT EXISTS utenti (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      username TEXT UNIQUE,
      provenienza TEXT,
      squadra_cuore TEXT,
      come_conosciuto TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      ruolo TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    // log
    await pool.query(`CREATE TABLE IF NOT EXISTS log (
      id SERIAL PRIMARY KEY,
      lega_id INTEGER,
      azione TEXT,
      dettagli TEXT,
      utente_id INTEGER,
      data_azione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    // offerte
    await pool.query(`CREATE TABLE IF NOT EXISTS offerte (
      id SERIAL PRIMARY KEY,
      lega_id INTEGER,
      squadra_mittente_id INTEGER,
      squadra_destinatario_id INTEGER,
      giocatore_id INTEGER,
      tipo TEXT,
      valore INTEGER,
      stato TEXT,
      data_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_accettazione TIMESTAMP,
      data_approvazione_admin TIMESTAMP,
      data_completamento TIMESTAMP,
      cantera BOOLEAN DEFAULT false,
      valore_offerta REAL DEFAULT 0,
      richiesta_fm REAL DEFAULT 0,
      giocatore_scambio_id INTEGER
    )`);
    // subadmin
    await pool.query(`CREATE TABLE IF NOT EXISTS subadmin (
      id SERIAL PRIMARY KEY,
      lega_id INTEGER,
      utente_id INTEGER,
      attivo BOOLEAN DEFAULT true,
      data_nomina TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      permessi TEXT
    )`);
    // richieste_ingresso
    await pool.query(`CREATE TABLE IF NOT EXISTS richieste_ingresso (
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
      messaggio_risposta TEXT
    )`);

    // 2. AGGIUNGI COLONNE MANCANTI
    console.log('\n🔧 Aggiunta colonne mancanti...');

    // leghe
    await addColumnIfNotExists('leghe', 'min_giocatori', 'INTEGER');
    await addColumnIfNotExists('leghe', 'max_giocatori', 'INTEGER');
    await addColumnIfNotExists('leghe', 'regolamento_pdf', 'TEXT');
    await addColumnIfNotExists('leghe', 'excel_originale', 'TEXT');
    await addColumnIfNotExists('leghe', 'excel_modificato', 'TEXT');
    await addColumnIfNotExists('leghe', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await addColumnIfNotExists('leghe', 'fantacalcio_url', 'TEXT');
    await addColumnIfNotExists('leghe', 'fantacalcio_username', 'TEXT');
    await addColumnIfNotExists('leghe', 'fantacalcio_password', 'TEXT');
    await addColumnIfNotExists('leghe', 'scraping_automatico', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('leghe', 'tipo_lega', "TEXT DEFAULT 'serie_a'");
    await addColumnIfNotExists('leghe', 'updated_at', 'TIMESTAMP');

    // squadre
    await addColumnIfNotExists('squadre', 'proprietario_username', 'TEXT');
    await addColumnIfNotExists('squadre', 'logo_url', 'TEXT');

    // giocatori
    await addColumnIfNotExists('giocatori', 'qa', 'REAL');
    await addColumnIfNotExists('giocatori', 'qi', 'REAL');
    await addColumnIfNotExists('giocatori', 'site_id', 'TEXT');
    await addColumnIfNotExists('giocatori', 'nazione_campionato', 'TEXT');
    await addColumnIfNotExists('giocatori', 'fvm', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'media_voto', 'REAL');
    await addColumnIfNotExists('giocatori', 'fantamedia_voto', 'REAL');
    await addColumnIfNotExists('giocatori', 'presenze', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'goalfatti', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'goalsubiti', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'rigoriparati', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'rigoricalciati', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'rigorisegnati', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'rigorisbagliati', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'assist', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'ammonizioni', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'espulsioni', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'autogol', 'INTEGER');
    await addColumnIfNotExists('giocatori', 'r', 'REAL');
    await addColumnIfNotExists('giocatori', 'fr', 'REAL');
    await addColumnIfNotExists('giocatori', 'ultimo_pagamento_contratto', 'TIMESTAMP');
    await addColumnIfNotExists('giocatori', 'ultimo_rinnovo_contratto', 'TIMESTAMP');
    await addColumnIfNotExists('giocatori', 'trasferimento', 'INTEGER DEFAULT 0');

    // formazioni_scraping
    await addColumnIfNotExists('formazioni_scraping', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await addColumnIfNotExists('formazioni_scraping', 'tipo_squadra', 'TEXT');

    // mercato_scraping
    await addColumnIfNotExists('mercato_scraping', 'da', 'TEXT');
    await addColumnIfNotExists('mercato_scraping', 'a', 'TEXT');
    await addColumnIfNotExists('mercato_scraping', 'prezzo', 'TEXT');
    await addColumnIfNotExists('mercato_scraping', 'tipo', 'TEXT');

    // tornei_preferiti
    await addColumnIfNotExists('tornei_preferiti', 'torneo_nome', 'TEXT NOT NULL');
    await addColumnIfNotExists('tornei_preferiti', 'torneo_url', 'TEXT');
    await addColumnIfNotExists('tornei_preferiti', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // log_contratti
    await addColumnIfNotExists('log_contratti', 'tipo', 'TEXT');
    await addColumnIfNotExists('log_contratti', 'valore_prima', 'REAL');
    await addColumnIfNotExists('log_contratti', 'valore_dopo', 'REAL');
    await addColumnIfNotExists('log_contratti', 'importo', 'REAL');
    await addColumnIfNotExists('log_contratti', 'data_operazione', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Colonne mancanti rimanenti
    await addColumnIfNotExists('squadre', 'proprietario_id', 'INTEGER');
    await addColumnIfNotExists('tornei_preferiti', 'torneo_id', 'TEXT NOT NULL');
    await addColumnIfNotExists('tornei_squadre', 'squadra_id', 'INTEGER');

    console.log('\n✅ Schema PostgreSQL aggiornato con successo!');
    console.log('📋 Tutte le tabelle e colonne mancanti sono state aggiunte.');
  } catch (err) {
    console.error('❌ Errore durante l\'aggiornamento schema:', err);
  } finally {
    await pool.end();
  }
}

fixPostgresqlSchema(); 