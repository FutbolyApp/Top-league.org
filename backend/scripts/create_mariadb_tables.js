import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Carica le variabili d'ambiente
dotenv.config({ path: './env.local' });

const createTables = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'topleague',
    password: 'topleague123',
    database: 'topleague_local'
  });

  try {
    console.log('🔄 Creating MariaDB tables...');

    const tables = [
      // Tabella users (rinominata da utenti)
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
        ruolo VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabella leghe
      `CREATE TABLE IF NOT EXISTS leghe (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        modalita VARCHAR(50) NOT NULL,
        admin_id INT NOT NULL,
        is_pubblica BOOLEAN NOT NULL DEFAULT FALSE,
        password VARCHAR(255),
        max_squadre INT,
        min_giocatori INT,
        max_giocatori INT,
        roster_ab BOOLEAN DEFAULT FALSE,
        cantera BOOLEAN DEFAULT FALSE,
        contratti BOOLEAN DEFAULT FALSE,
        triggers BOOLEAN DEFAULT FALSE,
        regolamento_pdf VARCHAR(255),
        excel_originale VARCHAR(255),
        excel_modificato VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fantacalcio_url VARCHAR(255),
        fantacalcio_username VARCHAR(255),
        fantacalcio_password VARCHAR(255),
        scraping_automatico BOOLEAN DEFAULT FALSE,
        tipo_lega VARCHAR(50) DEFAULT 'serie_a',
        updated_at TIMESTAMP NULL,
        max_portieri INT DEFAULT 3,
        min_portieri INT DEFAULT 2,
        max_difensori INT DEFAULT 8,
        min_difensori INT DEFAULT 5,
        max_centrocampisti INT DEFAULT 8,
        min_centrocampisti INT DEFAULT 5,
        max_attaccanti INT DEFAULT 6,
        min_attaccanti INT DEFAULT 3,
        FOREIGN KEY(admin_id) REFERENCES users(id)
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
        is_orfana BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        proprietario_username VARCHAR(255),
        logo_url VARCHAR(255),
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(proprietario_id) REFERENCES users(id),
        UNIQUE KEY unique_lega_proprietario (lega_id, proprietario_id)
      )`,

      // Tabella giocatori
      `CREATE TABLE IF NOT EXISTS giocatori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        squadra_id INT NOT NULL,
        nome VARCHAR(255) NOT NULL,
        cognome VARCHAR(255),
        ruolo VARCHAR(50),
        squadra_reale VARCHAR(255),
        eta INT,
        quotazione_attuale INT DEFAULT 0,
        salario INT DEFAULT 0,
        costo_attuale INT DEFAULT 0,
        costo_precedente INT DEFAULT 0,
        prestito BOOLEAN DEFAULT FALSE,
        anni_contratto INT DEFAULT 0,
        cantera BOOLEAN DEFAULT FALSE,
        triggers TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        qa DECIMAL(5,2),
        qi DECIMAL(5,2),
        site_id VARCHAR(255),
        nazione_campionato VARCHAR(255),
        fvm INT DEFAULT 0,
        media_voto DECIMAL(3,2),
        fantamedia_voto DECIMAL(3,2),
        presenze INT DEFAULT 0,
        goalfatti INT DEFAULT 0,
        goalsubiti INT DEFAULT 0,
        rigoriparati INT DEFAULT 0,
        rigoricalciati INT DEFAULT 0,
        rigorisegnati INT DEFAULT 0,
        rigorisbagliati INT DEFAULT 0,
        assist INT DEFAULT 0,
        ammonizioni INT DEFAULT 0,
        espulsioni INT DEFAULT 0,
        autogol INT DEFAULT 0,
        r DECIMAL(3,2),
        fr DECIMAL(3,2),
        valore_trasferimento DECIMAL(10,2) DEFAULT 0,
        ultimo_pagamento_contratto TIMESTAMP NULL,
        valore_prestito DECIMAL(10,2) DEFAULT 0,
        ultimo_rinnovo_contratto TIMESTAMP NULL,
        roster VARCHAR(10) DEFAULT 'A',
        squadra_prestito_id INT,
        trasferimento BOOLEAN DEFAULT FALSE,
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(squadra_id) REFERENCES squadre(id),
        FOREIGN KEY(squadra_prestito_id) REFERENCES squadre(id)
      )`,

      // Tabella notifiche
      `CREATE TABLE IF NOT EXISTS notifiche (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT,
        utente_id INT,
        tipo VARCHAR(100),
        messaggio TEXT,
        letto BOOLEAN DEFAULT FALSE,
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_lettura TIMESTAMP NULL,
        archiviata BOOLEAN DEFAULT FALSE,
        titolo VARCHAR(255),
        dati_aggiuntivi JSON,
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(utente_id) REFERENCES users(id)
      )`,

      // Tabella log
      `CREATE TABLE IF NOT EXISTS log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT,
        azione VARCHAR(255),
        dettagli TEXT,
        utente_id INT,
        data_azione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(utente_id) REFERENCES users(id)
      )`,

      // Tabella offerte
      `CREATE TABLE IF NOT EXISTS offerte (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT,
        squadra_mittente_id INT,
        squadra_destinatario_id INT,
        giocatore_id INT,
        valore_offerta DECIMAL(10,2),
        stato VARCHAR(50) DEFAULT 'in_attesa',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP NULL,
        note TEXT,
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(squadra_mittente_id) REFERENCES squadre(id),
        FOREIGN KEY(squadra_destinatario_id) REFERENCES squadre(id),
        FOREIGN KEY(giocatore_id) REFERENCES giocatori(id)
      )`,

      // Tabella subadmin
      `CREATE TABLE IF NOT EXISTS subadmin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        utente_id INT NOT NULL,
        permessi JSON,
        attivo BOOLEAN DEFAULT TRUE,
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_nomina TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(utente_id) REFERENCES users(id),
        UNIQUE KEY unique_lega_utente (lega_id, utente_id)
      )`,

      // Tabella richieste_ingresso
      `CREATE TABLE IF NOT EXISTS richieste_ingresso (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        squadra_id INT NOT NULL,
        utente_id INT NOT NULL,
        messaggio_richiesta TEXT,
        stato VARCHAR(50) DEFAULT 'in_attesa',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP NULL,
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(squadra_id) REFERENCES squadre(id),
        FOREIGN KEY(utente_id) REFERENCES users(id)
      )`,

      // Tabella richieste_admin
      `CREATE TABLE IF NOT EXISTS richieste_admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        squadra_id INT NOT NULL,
        tipo_richiesta VARCHAR(100) NOT NULL,
        dati_richiesta JSON,
        stato VARCHAR(50) DEFAULT 'pending',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP NULL,
        note_admin TEXT,
        FOREIGN KEY(squadra_id) REFERENCES squadre(id)
      )`,

      // Tabella pending_changes
      `CREATE TABLE IF NOT EXISTS pending_changes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lega_id INT NOT NULL,
        subadmin_id INT NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        action_data JSON NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        admin_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        description TEXT,
        details TEXT,
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(subadmin_id) REFERENCES users(id)
      )`,

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
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(admin_id) REFERENCES users(id)
      )`,

      // Tabella tornei_squadre
      `CREATE TABLE IF NOT EXISTS tornei_squadre (
        id INT AUTO_INCREMENT PRIMARY KEY,
        torneo_id INT,
        squadra_id INT,
        data_iscrizione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(torneo_id) REFERENCES tornei(id),
        FOREIGN KEY(squadra_id) REFERENCES squadre(id),
        UNIQUE KEY unique_torneo_squadra (torneo_id, squadra_id)
      )`,

      // Tabella partite
      `CREATE TABLE IF NOT EXISTS partite (
        id INT AUTO_INCREMENT PRIMARY KEY,
        torneo_id INT,
        giornata INT,
        squadra_casa_id INT,
        squadra_trasferta_id INT,
        gol_casa INT,
        gol_trasferta INT,
        punti_casa INT,
        punti_trasferta INT,
        data_partita TIMESTAMP,
        stato VARCHAR(50) DEFAULT 'programmata',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(torneo_id) REFERENCES tornei(id),
        FOREIGN KEY(squadra_casa_id) REFERENCES squadre(id),
        FOREIGN KEY(squadra_trasferta_id) REFERENCES squadre(id)
      )`,

      // Tabella log_contratti
      `CREATE TABLE IF NOT EXISTS log_contratti (
        id INT AUTO_INCREMENT PRIMARY KEY,
        giocatore_id INT NOT NULL,
        lega_id INT NOT NULL,
        tipo_operazione VARCHAR(100),
        squadra_mittente_id INT,
        squadra_destinatario_id INT,
        valore DECIMAL(10,2),
        dettagli TEXT,
        utente_id INT,
        data_operazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(giocatore_id) REFERENCES giocatori(id),
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(squadra_mittente_id) REFERENCES squadre(id),
        FOREIGN KEY(squadra_destinatario_id) REFERENCES squadre(id),
        FOREIGN KEY(utente_id) REFERENCES users(id)
      )`,

      // Tabella log_operazioni_giocatori
      `CREATE TABLE IF NOT EXISTS log_operazioni_giocatori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        giocatore_id INT,
        lega_id INT,
        tipo_operazione VARCHAR(100),
        squadra_mittente_id INT,
        squadra_destinatario_id INT,
        valore DECIMAL(10,2),
        dettagli TEXT,
        utente_id INT,
        data_operazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(giocatore_id) REFERENCES giocatori(id),
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(squadra_mittente_id) REFERENCES squadre(id),
        FOREIGN KEY(squadra_destinatario_id) REFERENCES squadre(id),
        FOREIGN KEY(utente_id) REFERENCES users(id)
      )`,

      // Tabella log_squadre
      `CREATE TABLE IF NOT EXISTS log_squadre (
        id INT AUTO_INCREMENT PRIMARY KEY,
        squadra_id INT NOT NULL,
        lega_id INT NOT NULL,
        tipo_evento VARCHAR(100) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        titolo VARCHAR(255) NOT NULL,
        descrizione TEXT,
        dati_aggiuntivi JSON,
        utente_id INT,
        giocatore_id INT,
        data_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(squadra_id) REFERENCES squadre(id),
        FOREIGN KEY(lega_id) REFERENCES leghe(id),
        FOREIGN KEY(utente_id) REFERENCES users(id),
        FOREIGN KEY(giocatore_id) REFERENCES giocatori(id)
      )`,

      // Tabella richieste_unione_squadra
      `CREATE TABLE IF NOT EXISTS richieste_unione_squadra (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utente_id INT NOT NULL,
        squadra_id INT NOT NULL,
        lega_id INT NOT NULL,
        messaggio_richiesta TEXT,
        stato VARCHAR(50) DEFAULT 'in_attesa',
        data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_risposta TIMESTAMP NULL,
        FOREIGN KEY(utente_id) REFERENCES users(id),
        FOREIGN KEY(squadra_id) REFERENCES squadre(id),
        FOREIGN KEY(lega_id) REFERENCES leghe(id)
      )`,

      // Tabella qa_history
      `CREATE TABLE IF NOT EXISTS qa_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        giocatore_id INT NOT NULL,
        qa_value DECIMAL(5,2) NOT NULL,
        data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fonte VARCHAR(50) DEFAULT 'scraping',
        FOREIGN KEY(giocatore_id) REFERENCES giocatori(id)
      )`,

      // Tabella tornei_preferiti
      `CREATE TABLE IF NOT EXISTS tornei_preferiti (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utente_id INT NOT NULL,
        torneo_id INT NOT NULL,
        data_aggiunta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(utente_id) REFERENCES users(id),
        FOREIGN KEY(torneo_id) REFERENCES tornei(id),
        UNIQUE KEY unique_utente_torneo (utente_id, torneo_id)
      )`
    ];

    for (const table of tables) {
      try {
        await connection.execute(table);
        console.log('✅ Table created successfully');
      } catch (error) {
        console.log('⚠️ Table might already exist:', error.message);
      }
    }

    // Creiamo un utente admin di test
    const passwordHash = await bcrypt.hash('password', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (id, nome, cognome, username, email, password_hash, ruolo) 
      VALUES (1, 'Admin', 'Test', 'admin', 'admin@topleague.com', ?, 'admin')
    `, [passwordHash]);

    // Creiamo una lega di test
    await connection.execute(`
      INSERT IGNORE INTO leghe (id, nome, modalita, admin_id, is_pubblica) 
      VALUES (1, 'Lega Test Locale', 'classica', 1, TRUE)
    `);

    // Creiamo una squadra di test
    await connection.execute(`
      INSERT IGNORE INTO squadre (id, nome, lega_id, proprietario_id, is_orfana) 
      VALUES (1, 'Squadra Test Locale', 1, 1, FALSE)
    `);

    console.log('✅ Database setup completed successfully!');
    console.log('📊 Test data created:');
    console.log('   - User: admin@topleague.com / password');
    console.log('   - League: Lega Test Locale');
    console.log('   - Team: Squadra Test Locale');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await connection.end();
  }
};

createTables(); 