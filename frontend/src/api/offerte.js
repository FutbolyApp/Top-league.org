import { api } from './config.js';

// Crea una nuova offerta
export const creaOfferta = async (offertaData, token) => {
  return api.post('/offerte/crea', offertaData, token);
};

// Ottieni offerte ricevute dall'utente
export const getOfferteRicevute = async (token) => {
  return api.get('/offerte/ricevute', token);
};

// Accetta offerta
export const accettaOfferta = async (offertaId, token) => {
  return api.post(`/offerte/accetta/${offertaId}`, {}, token);
};

// Rifiuta offerta
export const rifiutaOfferta = async (offertaId, token) => {
  return api.post(`/offerte/rifiuta/${offertaId}`, {}, token);
};

// Ottieni log operazioni per un giocatore
export const getLogGiocatore = async (giocatoreId, token) => {
  return api.get(`/contratti/log-giocatore/${giocatoreId}`, token);
};

export async function getOfferteByLega(lega_id, token) {
  return api.get(`/offerte/lega/${lega_id}`, token);
}

export async function updateOffertaStatus(offerta_id, stato, token) {
  return api.put(`/offerte/${offerta_id}/status`, { stato }, token);
}

export async function getMovimentiMercato(lega_id, token) {
  return api.get(`/offerte/movimenti/${lega_id}`, token);
} 