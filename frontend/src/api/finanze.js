import { apiRequest } from './axiosConfig.js';

// Ottieni bilancio squadra
export const getBilancioSquadra = async (squadraId, token) => {
  return apiRequest('GET', `/finanze/squadra/${squadraId}`, null, token);
};

// Ottieni transazioni squadra
export const getTransazioniSquadra = async (squadraId, params, token) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest('GET', `/finanze/squadra/${squadraId}/transazioni?${queryString}`, null, token);
};

// Registra nuova transazione
export const createTransazione = async (squadraId, transazioneData, token) => {
  return apiRequest('POST', `/finanze/squadra/${squadraId}/transazione`, transazioneData, token);
};

// Ottieni report finanziario
export const getReportFinanziario = async (squadraId, params, token) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest('GET', `/finanze/squadra/${squadraId}/report?${queryString}`, null, token);
};

// Aggiorna budget squadra
export const updateBudgetSquadra = async (squadraId, nuovoBudget, token) => {
  return apiRequest('PUT', `/finanze/squadra/${squadraId}/budget`, { nuovo_budget: nuovoBudget }, token);
};

// Esporta transazioni
export const exportTransazioni = async (squadraId, formato, token) => {
  return apiRequest('GET', `/finanze/squadra/${squadraId}/export?formato=${formato}`, null, token);
}; 