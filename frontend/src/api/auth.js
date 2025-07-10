import { api } from './config.js';

const API_URL = 'http://localhost:3001/api/auth';

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

export const login = (credentials) => api.post('/login', credentials);

export const register = (userData) => api.post('/auth/register', userData);

export const logout = async (token) => {
  return api.post('/auth/logout', {}, token);
};

export const checkUser = (username) => api.post('/auth/check-user', { username });

export const checkAvailability = (data) => api.post('/auth/check-availability', data);

export const isLeagueAdmin = (legaId, token) => api.get(`/auth/is-league-admin/${legaId}`, token);

export const verifyUser = (token) => api.get('/auth/verify-user', token);

// Ricerca utenti per autocomplete (solo SuperAdmin)
export const searchUsers = async (query, legaId, token) => {
  const params = new URLSearchParams({ query });
  if (legaId) {
    params.append('legaId', legaId);
  }
  
  const res = await fetch(`${API_URL}/search-users?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return handleResponse(res);
}; 