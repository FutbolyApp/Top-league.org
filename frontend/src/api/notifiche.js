import { api } from './config.js';

export async function getNotifiche(token) {
  return api.get('/notifiche', token);
}

export async function getNotificheByUtente(token) {
  return api.get('/notifiche/utente', token);
}

export const getNotificheAdmin = async (legaId, token) => {
  return api.get(`/notifiche/admin/${legaId}`, token);
};

export const createNotificaAdmin = async (legaId, tipo, messaggio, giocatoreId = null, squadraId = null, token) => {
  return api.post('/notifiche/admin', {
    lega_id: legaId,
    tipo: tipo,
    messaggio: messaggio,
    giocatore_id: giocatoreId,
    squadra_id: squadraId
  }, token);
};

export const marcaNotificaLetta = async (notificaId, token) => {
  return api.put(`/notifiche/${notificaId}/letta`, {}, token);
};

export const marcaTutteLette = async (token) => {
  return api.put('/notifiche/tutte-lette', {}, token);
};

export const eliminaNotifica = async (notificaId, token) => {
  return api.delete(`/notifiche/${notificaId}`, token);
};

export const getNotificheUtente = async (token) => {
  return api.get('/notifiche', token);
};

export const segnaNotificaLetta = async (notificaId, token) => {
  return api.put(`/notifiche/${notificaId}/letta`, {}, token);
};

export const rispondiNotificaAdmin = async (notificaId, risposta, token) => {
  return api.put(`/notifiche/admin/${notificaId}/risposta`, { risposta }, token);
}; 