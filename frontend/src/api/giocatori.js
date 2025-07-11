import { api } from './config.js';

export async function getGiocatoreById(id, token) {
  return api.get(`/giocatori/${id}`, token);
}

export async function getGiocatoriByIds(ids, token) {
  return api.post('/giocatori/batch', { ids }, token);
}

export async function getGiocatoriByLega(legaId, token) {
  return api.get(`/giocatori/lega/${legaId}`, token);
}

export async function getGiocatoriBySquadra(squadraId, token) {
  return api.get(`/giocatori/squadra/${squadraId}`, token);
}

export async function updateGiocatore(id, data, token) {
  return api.put(`/giocatori/${id}`, data, token);
}

export async function createGiocatore(data, token) {
  return api.post('/giocatori', data, token);
}

export async function deleteGiocatore(id, token) {
  return api.delete(`/giocatori/${id}`, token);
}

export async function transferGiocatore(id, transferData, token) {
  return api.post(`/giocatori/${id}/transfer`, transferData, token);
}

// Ottieni cronologia QA di un giocatore
export const getQAHistory = async (giocatoreId, token) => {
  try {
    const data = await api.get(`/giocatori/${giocatoreId}/qa-history`, token);
    return data.history;
  } catch (error) {
    console.error('Errore API getQAHistory:', error);
    throw error;
  }
}; 