import { apiRequest } from './axiosConfig';

// Paga contratto singolo
export const pagaContratto = async (giocatoreId, token) => {
  return apiRequest('POST', `/contratti/paga/${giocatoreId}`, null, token);
};

// Paga contratti multipli
export const pagaContrattiMultipli = async (giocatoriIds, token) => {
  return apiRequest('POST', '/contratti/paga-multipli', { giocatoriIds }, token);
};

// Rinnova contratto
export const rinnovaContratto = async (giocatoreId, anniRinnovo, token) => {
  return apiRequest('POST', `/contratti/rinnova/${giocatoreId}`, { anniRinnovo }, token);
};

// Aggiorna impostazioni trasferimento/prestito
export const aggiornaImpostazioniTrasferimento = async (giocatoreId, data, token) => {
  return apiRequest('POST', `/contratti/impostazioni/${giocatoreId}`, data, token);
};

// Ottieni log contratti per squadra
export const getLogContratti = async (squadraId, token) => {
  return apiRequest('GET', `/contratti/log/${squadraId}`, null, token);
};

export const getLogRinnoviGiocatore = async (giocatoreId, token) => {
  return apiRequest('GET', `/contratti/log-giocatore/${giocatoreId}`, null, token);
}; 