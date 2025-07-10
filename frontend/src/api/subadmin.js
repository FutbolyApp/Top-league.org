const API_URL = 'http://localhost:3001/api/subadmin';

// Funzione helper per gestire gli errori
async function handleResponse(res) {
  if (!res.ok) {
    let errorMessage = 'Errore del server';
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
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

// Ottieni tutti i subadmin (solo SuperAdmin)
export const getAllSubadmins = async (token) => {
  const res = await fetch(`${API_URL}/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Ottieni subadmin di una lega
export const getSubadminsByLega = async (legaId, token) => {
  const res = await fetch(`${API_URL}/lega/${legaId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Aggiungi subadmin (solo SuperAdmin)
export const addSubadmin = async (legaId, userId, permissions, token) => {
  const res = await fetch(`${API_URL}/add`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ legaId, userId, permissions })
  });
  return handleResponse(res);
};

// Rimuovi subadmin (solo SuperAdmin)
export const removeSubadmin = async (legaId, userId, token) => {
  const res = await fetch(`${API_URL}/remove`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ legaId, userId })
  });
  return handleResponse(res);
};

// Verifica se utente è subadmin di una lega
export const checkSubadmin = async (legaId, token) => {
  const res = await fetch(`${API_URL}/check/${legaId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Verifica permesso specifico
export const checkPermission = async (legaId, permission, token) => {
  const res = await fetch(`${API_URL}/permission/${legaId}/${permission}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Ottieni modifiche in attesa per una lega (admin della lega)
export const getPendingChangesByLega = async (legaId, token) => {
  const res = await fetch(`${API_URL}/pending/${legaId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Ottieni modifiche in attesa per un subadmin
export const getPendingChangesBySubadmin = async (token) => {
  const res = await fetch(`${API_URL}/pending/subadmin`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Approva modifica (admin della lega)
export const approveChange = async (changeId, adminResponse, token) => {
  const res = await fetch(`${API_URL}/approve/${changeId}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ adminResponse })
  });
  return handleResponse(res);
};

// Rifiuta modifica (admin della lega)
export const rejectChange = async (changeId, adminResponse, token) => {
  const res = await fetch(`${API_URL}/reject/${changeId}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ adminResponse })
  });
  return handleResponse(res);
};

// Ottieni storico modifiche di una lega (admin della lega)
export const getChangeHistory = async (legaId, token) => {
  const url = legaId ? `${API_URL}/history/${legaId}` : `${API_URL}/history`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Ottieni le leghe dove l'utente è subadmin
export const getSubadminLeagues = async (token) => {
  const res = await fetch(`${API_URL}/check-all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Crea una nuova richiesta di modifica
export const createPendingChange = async (requestData, token) => {
  const res = await fetch(`${API_URL}/request`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  });
  return handleResponse(res);
}; 

// Annulla una modifica in attesa (solo il subadmin che l'ha creata)
export const cancelPendingChange = async (changeId, token) => {
  const res = await fetch(`${API_URL}/cancel/${changeId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
};

// Aggiorna permessi di un subadmin
export const updateSubadminPermissions = async (legaId, userId, permissions, token) => {
  const res = await fetch(`${API_URL}/update-permissions`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ legaId, userId, permissions })
  });
  return handleResponse(res);
}; 