import { apiRequest } from './axiosConfig.js';

// Crea nuovo backup
export const createBackup = async (description, token) => {
  return apiRequest('POST', '/backup/create', { description }, token);
};

// Lista backup disponibili
export const listBackups = async (token) => {
  return apiRequest('GET', '/backup/list', null, token);
};

// Ripristina backup
export const restoreBackup = async (backupName, token) => {
  return apiRequest('POST', `/backup/restore/${backupName}`, {}, token);
};

// Elimina backup
export const deleteBackup = async (backupName, token) => {
  return apiRequest('DELETE', `/backup/${backupName}`, null, token);
};

// Download backup
export const downloadBackup = async (backupName, token) => {
  return apiRequest('GET', `/backup/download/${backupName}`, null, token, 'blob');
};

// Statistiche backup
export const getBackupStats = async (token) => {
  return apiRequest('GET', '/backup/stats', null, token);
}; 