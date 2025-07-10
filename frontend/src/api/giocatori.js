const API_URL = 'http://localhost:3001/api/giocatori';

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

export async function getGiocatoreById(id, token) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getGiocatoriByIds(ids, token) {
  // ids: array di ID
  const res = await fetch(`${API_URL}/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res);
}

export async function getGiocatoriByLega(legaId, token) {
  const res = await fetch(`${API_URL}/lega/${legaId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getGiocatoriBySquadra(squadraId, token) {
  const res = await fetch(`${API_URL}/squadra/${squadraId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function updateGiocatore(id, data, token) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function createGiocatore(data, token) {
  const res = await fetch(`${API_URL}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteGiocatore(id, token) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return handleResponse(res);
}

export async function transferGiocatore(id, transferData, token) {
  const res = await fetch(`${API_URL}/${id}/transfer`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transferData)
  });
  return handleResponse(res);
} 

// Ottieni cronologia QA di un giocatore
export const getQAHistory = async (giocatoreId, token) => {
  try {
    const response = await fetch(`${API_URL}/${giocatoreId}/qa-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Errore nel recupero della cronologia QA');
    }

    const data = await response.json();
    return data.history;
  } catch (error) {
    console.error('Errore API getQAHistory:', error);
    throw error;
  }
}; 