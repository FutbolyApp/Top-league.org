import { apiRequest } from './axiosConfig.js';

// Crea nuovo torneo
export const createTorneo = async (torneoData, token) => {
  return apiRequest('POST', '/tornei', torneoData, token);
};

// Ottieni tornei di una lega
export const getTorneiLega = async (legaId, token) => {
  return apiRequest('GET', `/tornei/lega/${legaId}`, null, token);
};

// Ottieni dettagli torneo
export const getDettaglioTorneo = async (torneoId, token) => {
  return apiRequest('GET', `/tornei/${torneoId}`, null, token);
};

// Calcola giornata
export const calcolaGiornata = async (torneoId, giornata, token) => {
  return apiRequest('POST', `/tornei/${torneoId}/calcola-giornata`, { giornata }, token);
};

// Aggiorna classifica
export const aggiornaClassifica = async (torneoId, token) => {
  return apiRequest('POST', `/tornei/${torneoId}/aggiorna-classifica`, {}, token);
}; 