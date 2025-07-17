import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

dotenv.config({ path: './env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Funzione per estrarre tabelle e colonne dallo schema SQLite
function parseSqliteSchema(schemaPath) {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const tableRegex = /CREATE TABLE (\w+) \(([^;]+)\);/g;
  const tables = {};
  let match;
  while ((match = tableRegex.exec(schema)) !== null) {
    const tableName = match[1];
    const columnsRaw = match[2];
    const columns = columnsRaw
      .split(',')
      .map(line => line.trim().split(' ')[0].replace(/['`"]/g, ''))
      .filter(col => col && !col.startsWith('FOREIGN') && !col.startsWith('UNIQUE') && !col.startsWith('--'));
    tables[tableName] = columns;
  }
  return tables;
}

async function getPostgresSchema() {
  const tables = {};
  const res = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `);
  for (const row of res.rows) {
    const table = row.table_name;
    const colRes = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = $1
    `, [table]);
    tables[table] = colRes.rows.map(r => r.column_name);
  }
  return tables;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqliteSchemaPath = path.join(__dirname, '../db/sqlite_schema.sql');
  const sqliteTables = parseSqliteSchema(sqliteSchemaPath);
  const pgTables = await getPostgresSchema();

  // Confronto tabelle
  const missingTables = Object.keys(sqliteTables).filter(t => !pgTables[t]);
  const extraTables = Object.keys(pgTables).filter(t => !sqliteTables[t]);

  console.log('--- Tabelle mancanti in PostgreSQL rispetto a SQLite ---');
  console.log(missingTables);
  console.log('--- Tabelle extra in PostgreSQL ---');
  console.log(extraTables);

  // Confronto colonne
  for (const table of Object.keys(sqliteTables)) {
    if (!pgTables[table]) continue;
    const sqliteCols = sqliteTables[table];
    const pgCols = pgTables[table];
    const missingCols = sqliteCols.filter(c => !pgCols.includes(c));
    const extraCols = pgCols.filter(c => !sqliteCols.includes(c));
    if (missingCols.length || extraCols.length) {
      console.log(`\nTabella: ${table}`);
      if (missingCols.length) console.log('  Colonne mancanti in PostgreSQL:', missingCols);
      if (extraCols.length) console.log('  Colonne extra in PostgreSQL:', extraCols);
    }
  }
  await pool.end();
  console.log('\n✅ Controllo schema completato!');
}

main().catch(e => { console.error(e); process.exit(1); }); 