import fs from 'fs';
import path from 'path';
import { getDb } from '../db/config.js';
import archiver from 'archiver';
import extract from 'extract-zip';

const db = getDb();

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

      // Inizia transazione
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        try {
          // Disabilita foreign keys temporaneamente
          db.run('PRAGMA foreign_keys = OFF');

          // Pulisci database esistente
          const tables = Object.keys(data);
          for (const table of tables) {
            db.run(`DELETE FROM ${table}`);
          }

          // Ripristina dati
          for (const [table, records] of Object.entries(data)) {
            if (records.length > 0) {
              const columns = Object.keys(records[0]);
              const placeholders = columns.map(() => '?').join(',');
              const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`);
              
              records.forEach(record => {
                const values = columns.map(col => record[col]);
                stmt.run(values);
              });
              
              stmt.finalize();
            }
          }

          // Riabilita foreign keys
          db.run('PRAGMA foreign_keys = ON');

          // Commit transazione
          db.run('COMMIT');

        } catch (error) {
          db.run('ROLLBACK');
          throw error;
        }
      });

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
    const backupPath = path.join(this.backupDir, `${backupName}.zip`);
    
    try {
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

  // Backup automatico programmato
  async scheduleBackup(cronExpression, description = 'Backup automatico') {
    // Implementa scheduling con node-cron
    // Per ora ritorna successo
    return { success: true, message: 'Backup programmato' };
  }

  // Funzioni di utilità private
  async getTables() {
    return new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) reject(err);
        else resolve(tables.map(t => t.name));
      });
    });
  }

  async exportTable(tableName) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async exportSchema() {
    return new Promise((resolve, reject) => {
      db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, schemas) => {
        if (err) reject(err);
        else resolve(schemas.map(s => s.sql).join(';\n'));
      });
    });
  }

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

  async registerBackup(backupName, metadata) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO backup_log (nome_backup, descrizione, timestamp, dimensione, record_count)
        VALUES (?, ?, ?, ?, ?)
      `, [backupName, metadata.description, metadata.timestamp, 0, metadata.recordCount], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async getBackupMetadata(backupName) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM backup_log WHERE nome_backup = ?', [backupName], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async removeBackupRecord(backupName) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM backup_log WHERE nome_backup = ?', [backupName], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

export default BackupManager; 