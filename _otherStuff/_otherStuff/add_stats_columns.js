import { getDb } from './db/postgres.js';

const columns = [
  'r REAL',
  'fr REAL', 
  'presenze INTEGER',
  'goalfatti INTEGER',
  'goalsubiti INTEGER',
  'rigoriparati INTEGER',
  'rigoricalciati INTEGER',
  'rigorisegnati INTEGER',
  'rigorisbagliati INTEGER',
  'assist INTEGER',
  'ammonizioni INTEGER',
  'espulsioni INTEGER',
  'autogol INTEGER'
];

async function addStatsColumns() {
  console.log('🔄 Aggiungendo colonne statistiche alla tabella giocatori...');
  
  const db = getDb();
  if (!db) {
    console.error('❌ Database non disponibile');
    return;
  }

  for (const columnDef of columns) {
    const columnName = columnDef.split(' ')[0];
    
    try {
      await db.query(`ALTER TABLE giocatori ADD COLUMN ${columnDef}`);
      console.log(`✅ Aggiunta colonna: ${columnName}`);
    } catch (error) {
      if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
        console.log(`⚠️  Colonna ${columnName} già esistente`);
      } else {
        console.log(`❌ Errore aggiungendo ${columnName}:`, error.message);
      }
    }
  }

  console.log('✅ Aggiornamento tabella completato!');

  // Crea tabelle di log per quotazioni e statistiche
  console.log('🔄 Creando tabelle di log...');

  // Tabella log quotazioni
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS caricalogquot (
        id SERIAL PRIMARY KEY,
        lega_id INTEGER NOT NULL,
        utente_id INTEGER NOT NULL,
        utente_nome TEXT NOT NULL,
        file_nome TEXT NOT NULL,
        giocatori_aggiornati INTEGER DEFAULT 0,
        errori INTEGER DEFAULT 0,
        data_caricamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (utente_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabella caricalogquot creata/verificata');
  } catch (error) {
    console.error('❌ Errore creazione tabella caricalogquot:', error.message);
  }

  // Tabella log statistiche
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS caricalogstat (
        id SERIAL PRIMARY KEY,
        lega_id INTEGER NOT NULL,
        utente_id INTEGER NOT NULL,
        utente_nome TEXT NOT NULL,
        file_nome TEXT NOT NULL,
        giocatori_aggiornati INTEGER DEFAULT 0,
        errori INTEGER DEFAULT 0,
        data_caricamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lega_id) REFERENCES leghe(id),
        FOREIGN KEY (utente_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabella caricalogstat creata/verificata');
  } catch (error) {
    console.error('❌ Errore creazione tabella caricalogstat:', error.message);
  }

  console.log('✅ Creazione tabelle di log completata!');
}

addStatsColumns().then(() => {
  console.log('✅ Processo completato!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
}); 