import express from 'express';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import BackupManager from '../utils/backup.js';
import fs from 'fs';

const router = express.Router();
const backupManager = new BackupManager();

// Crea nuovo backup
router.post('/create', requireSuperAdmin, async (req, res) => {
  const { description } = req.body;
  
  try {
    const result = await backupManager.createBackup(description);
    res.json(result);
  } catch (error) {
    console.error('Errore creazione backup:', error);
    res.status(500).json({ error: 'Errore creazione backup' });
  }
});

// Lista backup disponibili
router.get('/list', requireSuperAdmin, async (req, res) => {
  try {
    const backups = await backupManager.listBackups();
    res.json({ backups });
  } catch (error) {
    console.error('Errore lista backup:', error);
    res.status(500).json({ error: 'Errore recupero lista backup' });
  }
});

// Ripristina backup
router.post('/restore/:backupName', requireSuperAdmin, async (req, res) => {
  const { backupName } = req.params;
  
  try {
    const result = await backupManager.restoreBackup(backupName);
    res.json(result);
  } catch (error) {
    console.error('Errore ripristino backup:', error);
    res.status(500).json({ error: 'Errore ripristino backup' });
  }
});

// Elimina backup
router.delete('/:backupName', requireSuperAdmin, async (req, res) => {
  const { backupName } = req.params;
  
  try {
    const result = await backupManager.deleteBackup(backupName);
    res.json(result);
  } catch (error) {
    console.error('Errore eliminazione backup:', error);
    res.status(500).json({ error: 'Errore eliminazione backup' });
  }
});

// Download backup
router.get('/download/:backupName', requireSuperAdmin, (req, res) => {
  const { backupName } = req.params;
  const backupPath = backupManager.backupDir + '/' + backupName + '.zip';
  
  if (fs.existsSync(backupPath)) {
    res.download(backupPath);
  } else {
    res.status(404).json({ error: 'Backup non trovato' });
  }
});

// Statistiche backup
router.get('/stats', requireSuperAdmin, async (req, res) => {
  try {
    const backups = await backupManager.listBackups();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const avgSize = backups.length > 0 ? totalSize / backups.length : 0;
    
    res.json({
      total_backups: backups.length,
      total_size: totalSize,
      average_size: avgSize,
      oldest_backup: backups.length > 0 ? backups[backups.length - 1].created : null,
      newest_backup: backups.length > 0 ? backups[0].created : null
    });
  } catch (error) {
    console.error('Errore statistiche backup:', error);
    res.status(500).json({ error: 'Errore recupero statistiche' });
  }
});

export default router; 