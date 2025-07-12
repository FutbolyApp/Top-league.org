import { getDb } from '../db/postgres.js';
import fs from 'fs';
import path from 'path';

async function createMissingTables() {
  try {
    console.log('🔄 Connessione al database PostgreSQL...');
    const db = getDb();
    
    // Verifica connessione
    await db.query('SELECT NOW()');
    console.log('✅ Connesso al database PostgreSQL');
    
    // Leggi il file SQL
    const sqlPath = path.join(process.cwd(), 'backend/db/create_missing_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Esecuzione script SQL per creare le tabelle mancanti...');
    
    // Esegui lo script SQL
    await db.query(sqlContent);
    
    console.log('✅ Tutte le tabelle sono state create con successo!');
    
    // Verifica che le tabelle siano state create
    const tables = [
      'tornei',
      'tornei_squadre', 
      'partite',
      'richieste_admin',
      'log_operazioni_giocatori',
      'log_squadre',
      'pending_changes',
      'log_contratti',
      'qa_history',
      'tornei_preferiti',
      'richieste_unione_squadra',
      'squadre_scraping',
      'giocatori_scraping',
      'classifica_scraping',
      'voti_scraping',
      'formazioni_scraping',
      'mercato_scraping'
    ];
    
    console.log('🔍 Verifica delle tabelle create...');
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Tabella ${table}: ${result.rows[0].count} righe`);
      } catch (err) {
        console.log(`❌ Errore nella tabella ${table}: ${err.message}`);
      }
    }
    
    console.log('🎉 Setup del database completato!');
    
  } catch (error) {
    console.error('❌ Errore durante la creazione delle tabelle:', error);
    process.exit(1);
  }
}

// Esegui lo script
createMissingTables(); 