const API_URL = 'http://localhost:3001/api/leghe';

// Funzione helper per gestire gli errori
async function handleResponse(res) {
  if (!res.ok) {
    let errorMessage = 'Errore del server';
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Se non riesce a parsare JSON, usa il testo della risposta
      const text = await res.text();
      if (text.includes('<!DOCTYPE')) {
        errorMessage = 'Errore del server: risposta non valida';
      } else {
        errorMessage = text || errorMessage;
      }
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function getLeghe(token) {
  const res = await fetch(`${API_URL}/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getUserLeghe(token) {
  const res = await fetch(`${API_URL}/user-leagues`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getLegaById(id, token) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getSquadreByLega(id, token) {
  const res = await fetch(`${API_URL}/${id}/squadre`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function creaLega(data, token) {
  // data: { nome, modalita, admin_id, is_pubblica, password, max_squadre, min_giocatori, max_giocatori, roster_ab, cantera, contratti, triggers, regolamento_pdf (File), excel (File) }
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  const res = await fetch(`${API_URL}/create`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return handleResponse(res);
}

export async function joinLega(legaId, password, token) {
  const res = await fetch(`${API_URL}/${legaId}/join`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });
  return handleResponse(res);
}

export async function getSquadraById(id, token) {
  // Ottiene la squadra e i suoi giocatori
  const res = await fetch(`${API_URL}/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function joinSquadra(squadra_id, token) {
  const res = await fetch(`${API_URL}/${squadra_id}/join`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getSquadreByIds(ids, token) {
  // ids: array di ID
  const res = await fetch(`${API_URL}/by-ids`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res);
}

export async function getSquadreByUtente(token) {
  const res = await fetch(`${API_URL}/utente`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getGiocatoriSquadra(squadraId, token) {
  const res = await fetch(`${API_URL}/${squadraId}/giocatori`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getLegheAdmin(token) {
  const res = await fetch(`${API_URL}/admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getAllLegheAdmin(token) {
  const res = await fetch(`${API_URL}/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function updateLega(legaId, data, token) {
  const res = await fetch(`${API_URL}/${legaId}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteLeague(legaId, token) {
  const res = await fetch(`${API_URL}/${legaId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

// Ottieni squadre disponibili per una lega
export const getSquadreDisponibili = async (legaId, token) => {
  const res = await fetch(`${API_URL}/${legaId}/squadre-disponibili`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Invia richiesta di ingresso a una lega
export const richiediIngresso = async (legaId, data, token) => {
  const res = await fetch(`${API_URL}/${legaId}/richiedi-ingresso`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};

// Ottieni richieste di ingresso dell'utente
export const getRichiesteUtente = async (token) => {
  try {
    const response = await fetch(`${API_URL}/richieste/utente`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Errore nel caricamento delle richieste');
  }
};

// Ottieni richieste di ingresso per admin di lega
export const getRichiesteAdmin = async (token) => {
  const res = await fetch(`${API_URL}/richieste/admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Rispondi a una richiesta di ingresso
export const rispondiRichiesta = async (richiestaId, data, token) => {
  const res = await fetch(`${API_URL}/richieste/${richiestaId}/rispondi`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};

// Cancella una richiesta di ingresso
export const cancellaRichiesta = async (richiestaId, token) => {
  const res = await fetch(`${API_URL}/richieste/${richiestaId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}; 