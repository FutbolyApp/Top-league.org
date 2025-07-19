import { api } from './config.js';

export async function getLeghe(token) {
  return api.get('/leghe', token);
}

export async function getUserLeghe(token) {
  return api.get('/leghe/user-leagues', token);
}

export async function getLegaById(id, token) {
  return api.get(`/leghe/${id}`, token);
}

export async function getSquadreByLega(id, token) {
  return api.get(`/leghe/${id}/squadre`, token);
}

export async function creaLega(data, token) {
  // data: { nome, modalita, admin_id, is_pubblica, password, max_squadre, min_giocatori, max_giocatori, roster_ab, cantera, contratti, triggers, regolamento_pdf (File), excel (File) }
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  
  return api.postFormData('/leghe/create', formData, token);
}

export async function joinLega(legaId, password, token) {
  return api.post(`/leghe/${legaId}/join`, { password }, token);
}

export async function getSquadraById(id, token) {
  return api.get(`/leghe/${id}`, token);
}

export async function joinSquadra(squadra_id, token) {
  return api.post(`/leghe/${squadra_id}/join`, {}, token);
}

export async function getSquadreByIds(ids, token) {
  return api.post('/leghe/by-ids', { ids }, token);
}

export async function getSquadreByUtente(token) {
  return api.get('/leghe/utente', token);
}

export async function getGiocatoriSquadra(squadraId, token) {
  return api.get(`/leghe/${squadraId}/giocatori`, token);
}

export async function getLegheAdmin(token) {
  return api.get('/leghe/admin', token);
}

export async function getAllLegheAdmin(token) {
  return api.get('/leghe/all', token);
}

export async function updateLega(legaId, data, token) {
  // Decodifica il token per ottenere il ruolo dell'utente
  const payload = JSON.parse(atob(token.split('.')[1]));
  const userRole = payload.ruolo;
  
  // Usa la rotta appropriata in base al ruolo
  const endpoint = (userRole === 'admin' || userRole === 'SuperAdmin') ? `/leghe/${legaId}/admin` : `/leghe/${legaId}`;
  
  return api.put(endpoint, data, token);
}

export async function deleteLeague(legaId, token) {
  return api.delete(`/leghe/${legaId}`, token);
}

// Ottieni squadre disponibili per una lega
export const getSquadreDisponibili = async (legaId, token) => {
  return api.get(`/leghe/${legaId}/squadre-disponibili`, token);
};

// Invia richiesta di ingresso a una lega
export const richiediIngresso = async (legaId, data, token) => {
  return api.post(`/leghe/${legaId}/richiedi-ingresso`, data, token);
};

// Ottieni richieste di ingresso dell'utente
export const getRichiesteUtente = async (token) => {
  return api.get('/leghe/richieste/utente', token);
};

// Ottieni richieste di ingresso per admin di lega
export const getRichiesteAdmin = async (token) => {
  return api.get('/leghe/richieste/admin', token);
};

// Rispondi a una richiesta di ingresso
export const rispondiRichiesta = async (richiestaId, data, token) => {
  return api.post(`/leghe/richieste/${richiestaId}/rispondi`, data, token);
};

// Cancella una richiesta di ingresso
export const cancellaRichiesta = async (richiestaId, token) => {
  return api.delete(`/leghe/richieste/${richiestaId}`, token);
}; 

// Ottieni configurazioni lega
export const getLeagueConfig = async (legaId, token) => {
  return api.get(`/leghe/${legaId}/config`, token);
};

// Aggiorna configurazioni lega
export const updateLeagueConfig = async (legaId, config, token) => {
  return api.put(`/leghe/${legaId}/config`, config, token);
}; 