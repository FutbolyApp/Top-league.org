import { apiRequest } from './axiosConfig';

// Paga contratto giocatore
export const pagaContratto = async (giocatoreId, token) => {
  return apiRequest('POST', `/contratti/paga/${giocatoreId}`, { token }, token);
};

// Rinnova contratto giocatore
export const rinnovaContratto = async (giocatoreId, nuovoSalario, durataMesi, token) => {
  return apiRequest('POST', `/contratti/rinnova/${giocatoreId}`, { 
    nuovoSalario, 
    durataMesi 
  }, token);
};

// Ottieni contratti in scadenza
export const getContrattiInScadenza = async (token) => {
  return apiRequest('GET', '/contratti/scadenza', null, token);
};

// Ottieni log contratti per squadra
export const getLogContratti = async (squadraId, token) => {
  return apiRequest('GET', `/contratti/log/${squadraId}`, null, token);
}; 