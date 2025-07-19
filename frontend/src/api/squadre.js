import { api } from './config.js';

export async function getSquadraById(id, token) {
  return api.get(`/squadre/${id}`, token);
}

export async function joinSquadra(squadra_id, token, data = {}) {
  return api.post(`/squadre/${squadra_id}/join`, data, token);
}

export async function getSquadreByIds(ids, token) {
  return api.post('/squadre/by-ids', { ids }, token);
}

export async function getSquadreByLega(lega_id, token) {
  return api.get(`/squadre/lega/${lega_id}`, token);
}

export async function getSquadreByUtente(token) {
  return api.get('/leghe/utente', token);
}

export async function getGiocatoriSquadra(squadraId, token) {
  return api.get(`/squadre/${squadraId}/giocatori`, token);
}

export async function updateSquadra(id, data, token) {
  return api.put(`/squadre/${id}`, data, token);
}

export async function deleteSquadra(id, token) {
  return api.delete(`/squadre/${id}`, token);
}

export async function assignTeamToUser(squadraId, token) {
  return api.post(`/squadre/${squadraId}/assign`, {}, token);
}

// Richieste di unione squadra
export async function getRichiesteUnioneSquadra(legaId, token) {
  return api.get(`/squadre/richieste-unione/${legaId}`, token);
}

export async function rispondiRichiestaUnioneSquadra(richiestaId, risposta, messaggio, token) {
  return api.post(`/squadre/richieste-unione/${richiestaId}/rispondi`, { risposta, messaggio }, token);
}

export async function cancellaRichiestaUnioneSquadra(richiestaId, token) {
  return api.delete(`/squadre/richieste-unione/${richiestaId}`, token);
}

// Ottieni la squadra dell'utente con giocatori
export async function getMyTeam(token) {
  return api.get('/squadre/my-team', token);
}

// Ottieni la squadra dell'utente per una lega specifica con giocatori
export async function getMyTeamByLeague(legaId, token) {
  return api.get(`/squadre/my-team/${legaId}`, token);
} 