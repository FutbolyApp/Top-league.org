import { api } from './config.js';

// Ottieni tutti i subadmin (solo SuperAdmin)
export const getAllSubadmins = async (token) => {
  return api.get('/subadmin/all', token);
};

// Ottieni subadmin di una lega
export const getSubadminsByLega = async (legaId, token) => {
  return api.get(`/subadmin/lega/${legaId}`, token);
};

// Aggiungi subadmin (solo SuperAdmin)
export const addSubadmin = async (legaId, userId, permissions, token) => {
  return api.post('/subadmin/add', { legaId, userId, permissions }, token);
};

// Rimuovi subadmin (solo SuperAdmin)
export const removeSubadmin = async (legaId, userId, token) => {
  return api.delete('/subadmin/remove', token);
};

// Verifica se utente è subadmin di una lega
export const checkSubadmin = async (legaId, token) => {
  return api.get(`/subadmin/check/${legaId}`, token);
};

// Verifica permesso specifico
export const checkPermission = async (legaId, permission, token) => {
  return api.get(`/subadmin/permission/${legaId}/${permission}`, token);
};

// Ottieni modifiche in attesa per una lega (admin della lega)
export const getPendingChangesByLega = async (legaId, token) => {
  return api.get(`/subadmin/pending/${legaId}`, token);
};

// Ottieni modifiche in attesa per un subadmin
export const getPendingChangesBySubadmin = async (token) => {
  return api.get('/subadmin/pending/subadmin', token);
};

// Approva modifica (admin della lega)
export const approveChange = async (changeId, adminResponse, token) => {
  return api.post(`/subadmin/approve/${changeId}`, { adminResponse }, token);
};

// Rifiuta modifica (admin della lega)
export const rejectChange = async (changeId, adminResponse, token) => {
  return api.post(`/subadmin/reject/${changeId}`, { adminResponse }, token);
};

// Ottieni storico modifiche di una lega (admin della lega)
export const getChangeHistory = async (legaId, token) => {
  const url = legaId ? `/subadmin/history/${legaId}` : '/subadmin/history';
  return api.get(url, token);
};

// Ottieni le leghe dove l'utente è subadmin
export const getSubadminLeagues = async (token) => {
  return api.get('/subadmin/check-all', token);
};

// Crea una nuova richiesta di modifica
export const createPendingChange = async (requestData, token) => {
  return api.post('/subadmin/request', requestData, token);
}; 

// Annulla una modifica in attesa (solo il subadmin che l'ha creata)
export const cancelPendingChange = async (changeId, token) => {
  return api.delete(`/subadmin/cancel/${changeId}`, token);
};

// Aggiorna permessi di un subadmin
export const updateSubadminPermissions = async (legaId, userId, permissions, token) => {
  return api.put('/subadmin/update-permissions', { legaId, userId, permissions }, token);
}; 