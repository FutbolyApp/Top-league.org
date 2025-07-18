import { api } from './config.js';

export const login = async (credentials) => {
  console.log('Login attempt with credentials:', { email: credentials.email, password: '***' });
  try {
    const response = await api.post('/auth/login', credentials);
    console.log('Login response received:', response);
    return response.data; // Return the data directly, not the wrapper
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

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
  
  return api.get(`/auth/search-users?${params}`, token);
}; 