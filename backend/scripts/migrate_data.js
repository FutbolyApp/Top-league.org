import sqlite3 from 'sqlite3';
import { getDb } from '../db/postgres.js';
import fs from 'fs';
import path from 'path';

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...');
    
    // Connessione a SQLite
    const sqlitePath = path.join(process.cwd(), 'backend/db/topleague.db');
    if (!fs.existsSync(sqlitePath)) {
      console.log('❌ SQLite database not found at:', sqlitePath);
      return;
    }
    
    const sqliteDb = new sqlite3.Database(sqlitePath);
    const pgDb = getDb();
    
    if (!pgDb) {
      console.log('❌ PostgreSQL connection not available');
      return;
    }
    
    console.log('✅ Connected to both databases');
    
    // Migra utenti
    console.log('📊 Migrating users...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const user of users) {
      try {
        await pgDb.query(`
          INSERT INTO users (id, nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id, user.nome, user.cognome, user.username, user.provenienza,
          user.squadra_cuore, user.come_conosciuto, user.email, user.password_hash,
          user.ruolo, user.created_at
        ]);
      } catch (error) {
        console.log(`⚠️ Warning inserting user ${user.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // Migra leghe
    console.log('📊 Migrating leagues...');
    const leghe = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM leghe', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const lega of leghe) {
      try {
        await pgDb.query(`
          INSERT INTO leghe (id, nome, modalita, admin_id, is_pubblica, password, max_squadre, min_giocatori, max_giocatori, roster_ab, cantera, contratti, triggers, regolamento_pdf, excel_originale, excel_modificato, created_at, fantacalcio_url, fantacalcio_username, fantacalcio_password, scraping_automatico, tipo_lega, updated_at, max_portieri, min_portieri, max_difensori, min_difensori, max_centrocampisti, min_centrocampisti, max_attaccanti, min_attaccanti)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
          ON CONFLICT (id) DO NOTHING
        `, [
          lega.id, lega.nome, lega?.modalita || 'N/A', lega.admin_id, lega?.is_pubblica || false,
          lega.password, lega.max_squadre, lega.min_giocatori, lega.max_giocatori,
          lega.roster_ab, lega.cantera, lega.contratti, lega.triggers,
          lega.regolamento_pdf, lega.excel_originale, lega.excel_modificato,
          lega.created_at, lega.fantacalcio_url, lega.fantacalcio_username,
          lega.fantacalcio_password, lega.scraping_automatico, lega.tipo_lega,
          lega.updated_at, lega.max_portieri, lega.min_portieri, lega.max_difensori,
          lega.min_difensori, lega.max_centrocampisti, lega.min_centrocampisti,
          lega.max_attaccanti, lega.min_attaccanti
        ]);
      } catch (error) {
        console.log(`⚠️ Warning inserting league ${lega.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${leghe.length} leagues`);
    
    // Migra squadre
    console.log('📊 Migrating teams...');
    const squadre = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM squadre', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const squadra of squadre) {
      try {
        await pgDb.query(`
          INSERT INTO squadre (id, lega_id, nome, proprietario_id, club_level, casse_societarie, costo_salariale_totale, costo_salariale_annuale, valore_squadra, is_orfana, created_at, proprietario_username)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING
        `, [
          squadra.id, squadra.lega_id, squadra.nome, squadra.proprietario_id,
          squadra.club_level, squadra.casse_societarie, squadra.costo_salariale_totale,
          squadra.costo_salariale_annuale, squadra.valore_squadra, squadra.is_orfana,
          squadra.created_at, squadra.proprietario_username
        ]);
      } catch (error) {
        console.log(`⚠️ Warning inserting team ${squadra.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${squadre.length} teams`);
    
    // Migra giocatori
    console.log('📊 Migrating players...');
    const giocatori = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM giocatori', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const giocatore of giocatori) {
      try {
        await pgDb.query(`
          INSERT INTO giocatori (id, squadra_id, nome, cognome, ruolo, squadra_reale, eta, quotazione_attuale, salario, costo_attuale, costo_precedente, prestito, anni_contratto, cantera, triggers, created_at, qi, site_id, nazione_campionato, media_voto, fantamedia_voto, presenze, goalfatti, goalsubiti, rigoriparati, rigoricalciati, rigorisegnati, rigorisbagliati, assist, ammonizioni, espulsioni, autogol, r, fr, valore_trasferimento, ultimo_pagamento_contratto, valore_prestito, ultimo_rinnovo_contratto, roster, squadra_prestito_id, trasferimento)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
          ON CONFLICT (id) DO NOTHING
        `, [
          giocatore.id, giocatore.squadra_id, giocatore.nome,
          giocatore.cognome, giocatore.ruolo, giocatore.squadra_reale, giocatore.eta,
          giocatore.quotazione_attuale, giocatore.salario, giocatore.costo_attuale,
          giocatore.costo_precedente, giocatore.prestito, giocatore.anni_contratto,
          giocatore.cantera, giocatore.triggers, giocatore.created_at, giocatore.qi,
          giocatore.site_id, giocatore.nazione_campionato, giocatore.media_voto,
          giocatore.fantamedia_voto, giocatore.presenze, giocatore.goalfatti,
          giocatore.goalsubiti, giocatore.rigoriparati, giocatore.rigoricalciati,
          giocatore.rigorisegnati, giocatore.rigorisbagliati, giocatore.assist,
          giocatore.ammonizioni, giocatore.espulsioni, giocatore.autogol, giocatore.r,
          giocatore.fr, giocatore.valore_trasferimento, giocatore.ultimo_pagamento_contratto,
          giocatore.valore_prestito, giocatore.ultimo_rinnovo_contratto, giocatore.roster,
          giocatore.squadra_prestito_id, giocatore.trasferimento
        ]);
      } catch (error) {
        console.log(`⚠️ Warning inserting player ${giocatore.id}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${giocatori.length} players`);
    
    // Chiudi connessione SQLite
    sqliteDb.close();
    
    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during data migration:', error);
  }
}

// Esegui la migrazione
migrateData(); 