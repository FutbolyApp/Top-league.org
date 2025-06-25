const API_URL = 'http://localhost:3001/api/squadre';

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

export async function getSquadreByLega(lega_id, token) {
  const res = await fetch(`${API_URL}/lega/${lega_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
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

export async function updateSquadra(id, data, token) {
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

export async function deleteSquadra(id, token) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function assignTeamToUser(squadraId, token) {
  const res = await fetch(`${API_URL}/${squadraId}/assign`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
} 