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
  console.log('🔍 [creaLega] Inizio creazione lega...');
  console.log('🔍 [creaLega] Dati ricevuti:', {
    nome: data.nome,
    modalita: data.modalita,
    admin_id: data.admin_id,
    is_pubblica: data.is_pubblica,
    max_squadre: data.max_squadre,
    min_giocatori: data.min_giocatori,
    max_giocatori: data.max_giocatori,
    excel_size: data.excel?.size,
    excel_name: data.excel?.name,
    excel_type: data.excel?.type,
    pdf_size: data.regolamento_pdf?.size,
    pdf_name: data.regolamento_pdf?.name
  });
  
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
      console.log(`🔍 [creaLega] Aggiunto al FormData: ${key} = ${value instanceof File ? `File(${value.size} bytes, ${value.type})` : value}`);
    }
  });
  
  console.log('🔍 [creaLega] FormData creato, invio richiesta...');
  console.log('🔍 [creaLega] FormData entries:');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value instanceof File ? `File(${value.size} bytes, ${value.type})` : value}`);
  }
  
  try {
    const result = await api.postFormData('/leghe/create', formData, token);
    console.log('✅ [creaLega] Risposta server:', result);
    return result;
  } catch (error) {
    console.error('❌ [creaLega] Errore durante la creazione:', error);
    throw error;
  }
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
  const endpoint = userRole === 'admin' ? `/leghe/${legaId}/admin` : `/leghe/${legaId}`;
  
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