const API_URL = 'http://localhost:3001/api/offerte';

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

// Crea una nuova offerta
export const creaOfferta = async (offertaData, token) => {
  const res = await fetch(`${API_URL}/crea`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(offertaData)
  });
  return handleResponse(res);
};

// Ottieni offerte ricevute dall'utente
export const getOfferteRicevute = async (token) => {
  const res = await fetch(`${API_URL}/ricevute`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Accetta offerta
export const accettaOfferta = async (offertaId, token) => {
  const res = await fetch(`${API_URL}/accetta/${offertaId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Rifiuta offerta
export const rifiutaOfferta = async (offertaId, token) => {
  const res = await fetch(`${API_URL}/rifiuta/${offertaId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Ottieni log operazioni per un giocatore
export const getLogGiocatore = async (giocatoreId, token) => {
  const res = await fetch(`${API_URL}/log-giocatore/${giocatoreId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

export async function getOfferteByLega(lega_id, token) {
  const res = await fetch(`${API_URL}/lega/${lega_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function updateOffertaStatus(offerta_id, stato, token) {
  const res = await fetch(`${API_URL}/${offerta_id}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stato })
  });
  return handleResponse(res);
}

export async function getMovimentiMercato(lega_id, token) {
  const res = await fetch(`${API_URL}/movimenti/${lega_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
} 