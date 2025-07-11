import { api } from './config.js';

export async function getNotifiche(token) {
  return api.get('/notifiche', token);
}

export async function getNotificheByUtente(token) {
  return api.get('/notifiche/utente', token);
}

export const getNotificheAdmin = async (legaId, token) => {
  return apiRequest('GET', `/notifiche/admin/${legaId}`, null, token);
};

export const createNotificaAdmin = async (legaId, tipo, messaggio, giocatoreId = null, squadraId = null, token) => {
  return apiRequest('POST', `/notifiche/admin`, {
    lega_id: legaId,
    tipo: tipo,
    messaggio: messaggio,
    giocatore_id: giocatoreId,
    squadra_id: squadraId
  }, token);
};

export const marcaNotificaLetta = async (notificaId, token) => {
  return apiRequest('PUT', `/notifiche/${notificaId}/letta`, null, token);
};

export const marcaTutteLette = async (token) => {
  return apiRequest('PUT', '/notifiche/tutte-lette', null, token);
};

export const eliminaNotifica = async (notificaId, token) => {
  return apiRequest('DELETE', `/notifiche/${notificaId}`, null, token);
};

export const getNotificheUtente = async (token) => {
  return apiRequest('GET', '/notifiche', null, token);
};

export const segnaNotificaLetta = async (notificaId, token) => {
  return apiRequest('PUT', `/notifiche/${notificaId}/letta`, {}, token);
};

export const rispondiNotificaAdmin = async (notificaId, risposta, token) => {
  return apiRequest('PUT', `/notifiche/admin/${notificaId}/risposta`, { risposta }, token);
}; 