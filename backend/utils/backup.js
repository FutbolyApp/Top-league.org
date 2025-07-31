import fs from 'fs';
import path from 'path';
import { getDb } from '../db/mariadb.js';
import archiver from 'archiver';
import extract from 'extract-zip';

class BackupManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Crea backup completo del database
  async createBackup(description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);
    
    try {
      // Crea directory per il backup
      fs.mkdirSync(backupPath, { recursive: true });

      // Esporta tutte le tabelle
      const tables = await this.getTables();
      const data = {};

      for (const table of tables) {
        data[table] = await this.exportTable(table);
      }

      // Salva dati in JSON
      const dataPath = path.join(backupPath, 'data.json');
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

      // Salva schema del database
      const schema = await this.exportSchema();
      const schemaPath = path.join(backupPath, 'schema.sql');
      fs.writeFileSync(schemaPath, schema);

      // Salva metadati del backup
      const metadata = {
        timestamp: new Date().toISOString(),
        description: description,
        version: '1.0',
        tables: tables,
        recordCount: Object.keys(data).reduce((sum, table) => sum + data[table].length, 0)
      };
      
      const metadataPath = path.join(backupPath, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // Comprimi il backup
      const zipPath = `${backupPath}.zip`;
      await this.compressDirectory(backupPath, zipPath);

      // Rimuovi directory temporanea
      fs.rmSync(backupPath, { recursive: true, force: true });

      // Registra backup nel database
      await this.registerBackup(backupName, metadata);

      return {
        success: true,
        backupName: backupName,
        backupPath: zipPath,
        metadata: metadata
      };

    } catch (error) {
      console.error('Errore creazione backup:', error);
      // Pulisci in caso di errore
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      throw error;
    }
  }

  // Ripristina backup
  async restoreBackup(backupName) {
    const backupPath = path.join(this.backupDir, `${backupName}.zip`);
    const extractPath = path.join(this.backupDir, backupName);

    try {
      // Verifica esistenza backup
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup non trovato');
      }

      // Estrai backup
      await extract(backupPath, { dir: extractPath });

      // Leggi metadati
      const metadataPath = path.join(extractPath, 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

      // Leggi dati
      const dataPath = path.join(extractPath, 'data.json');
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      // Inizia transazione
      await db.query('BEGIN');

      try {
        // Pulisci database esistente
        const tables = Object.keys(data);
        for (const table of tables) {
          await db.query(`DELETE FROM ${table}`);
        }

        // Ripristina dati
        for (const [table, records] of Object.entries(data)) {
          if (records.length > 0) {
            const columns = Object.keys(records[0]);
            const placeholders = columns.map((_, index) => `$${index + 1}`).join(',');
            const stmt = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
            
            for (const record of records) {
              const values = columns.map(col => record[col]);
              await db.query(stmt, values);
            }
          }
        }

        // Commit transazione
        await db.query('COMMIT');

      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

      // Pulisci directory temporanea
      fs.rmSync(extractPath, { recursive: true, force: true });

      return {
        success: true,
        message: 'Backup ripristinato con successo',
        metadata: metadata
      };

    } catch (error) {
      console.error('Errore ripristino backup:', error);
      // Pulisci in caso di errore
      if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
      throw error;
    }
  }

  // Lista backup disponibili
  async listBackups() {
    try {
      const backups = [];
      const files = fs.readdirSync(this.backupDir);
      
      for (const file of files) {
        if (file.endsWith('.zip')) {
          const backupName = file.replace('.zip', '');
          const backupPath = path.join(this.backupDir, file);
          const stats = fs.statSync(backupPath);
          
          // Leggi metadati dal database
          const metadata = await this.getBackupMetadata(backupName);
          
          backups.push({
            name: backupName,
            path: backupPath,
            size: stats.size,
            created: stats.birthtime,
            metadata: metadata
          });
        }
      }

      return backups.sort((a, b) => new Date(b.created) - new Date(a.created));

    } catch (error) {
      console.error('Errore lista backup:', error);
      throw error;
    }
  }

  // Elimina backup
  async deleteBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, `${backupName}.zip`);
      
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        await this.removeBackupRecord(backupName);
        return { success: true, message: 'Backup eliminato con successo' };
      } else {
        throw new Error('Backup non trovato');
      }
    } catch (error) {
      console.error('Errore eliminazione backup:', error);
      throw error;
    }
  }

  // Ottieni lista tabelle
  async getTables() {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      const result = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      return result.rows.map(row => row.table_name);
    } catch (error) {
      console.error('Errore ottenimento tabelle:', error);
      throw error;
    }
  }

  // Esporta tabella
  async exportTable(tableName) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      const result = await db.query(`SELECT * FROM ${tableName}`);
      return result.rows;
    } catch (error) {
      console.error(`Errore esportazione tabella ${tableName}:`, error);
      throw error;
    }
  }

  // Esporta schema
  async exportSchema() {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      const result = await db.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `);
      
      let schema = '';
      let currentTable = '';
      
      for (const row of result.rows) {
        if (row.table_name !== currentTable) {
          if (currentTable) schema += ');\n\n';
          currentTable = row.table_name;
          schema += `CREATE TABLE ${row.table_name} (\n`;
        } else {
          schema += ',\n';
        }
        
        schema += `  ${row.column_name} ${row.data_type}`;
        if (row.is_nullable === 'NO') schema += ' NOT NULL';
        if (row.column_default) schema += ` DEFAULT ${row.column_default}`;
      }
      
      if (currentTable) schema += ');\n';
      
      return schema;
    } catch (error) {
      console.error('Errore esportazione schema:', error);
      throw error;
    }
  }

  // Comprimi directory
  async compressDirectory(sourcePath, destPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(destPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(sourcePath, false);
      archive.finalize();
    });
  }

  // Registra backup nel database
  async registerBackup(backupName, metadata) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      await db.query(`
        INSERT INTO backup_log (nome_backup, descrizione, timestamp, metadati)
        VALUES ($1, $2, $3, $4)
      `, [backupName, metadata.description, metadata.timestamp, JSON.stringify(metadata)]);
    } catch (error) {
      console.error('Errore registrazione backup:', error);
      throw error;
    }
  }

  // Ottieni metadati backup
  async getBackupMetadata(backupName) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      const result = await db.query(
        'SELECT * FROM backup_log WHERE nome_backup = $1',
        [backupName]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Errore ottenimento metadati backup:', error);
      return null;
    }
  }

  // Rimuovi record backup
  async removeBackupRecord(backupName) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      await db.query('DELETE FROM backup_log WHERE nome_backup = $1', [backupName]);
    } catch (error) {
      console.error('Errore rimozione record backup:', error);
      throw error;
    }
  }
}

export default BackupManager; 