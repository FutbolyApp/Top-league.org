import { apiRequest } from './axiosConfig.js';

// Crea nuovo torneo
export const createTorneo = async (torneoData, token) => {
  return apiRequest('POST', '/tornei', torneoData, token);
};

// Aggiorna torneo esistente
export const updateTorneo = async (torneoId, torneoData, token) => {
  return apiRequest('PUT', `/tornei/${torneoId}`, torneoData, token);
};

// Elimina torneo
export const deleteTorneo = async (torneoId, token) => {
  return apiRequest('DELETE', `/tornei/${torneoId}`, null, token);
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