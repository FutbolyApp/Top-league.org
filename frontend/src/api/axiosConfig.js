import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : 'https://topleaguem.onrender.com/api',
  withCredentials: false,
});

// Funzione per logout automatico (puoi personalizzare)
function autoLogout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

api.interceptors.response.use(
  response => response,
  error => {
    // Emetti evento personalizzato per errori di rete
    const errorEvent = new CustomEvent('fetch-error', {
      detail: {
        error: {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        }
      }
    });
    window.dispatchEvent(errorEvent);
    
    if (error.response && error.response.status === 401) {
      error.customMessage = 'Sessione scaduta o non autorizzato. Effettua di nuovo il login.';
      autoLogout();
    }
    return Promise.reject(error);
  }
);

export const apiRequest = async (method, url, data, token) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api({ method, url, data, headers });
    return response.data;
  } catch (error) {
    throw new Error(error.customMessage || error.message || 'Errore sconosciuto');
  }
};

export default api; 