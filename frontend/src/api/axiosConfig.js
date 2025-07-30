import axios from 'axios';
import { useState, useCallback } from 'react';

const isDevelopment = process.env.NODE_ENV === 'development';
const isIonos = process.env.REACT_APP_HOSTING === 'ionos';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

let baseURL;
if (isDevelopment || isLocalhost) {
  baseURL = 'http://localhost:3001/api';
} else if (isIonos || window.location.hostname === 'top-league.org') {
  baseURL = 'https://www.top-league.org/api';
} else {
  baseURL = 'https://topleaguem.onrender.com/api';
}

const api = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  timeout: 10000, // 10 secondi timeout
});

// Funzione per logout automatico (puoi personalizzare)
function autoLogout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

// Retry logic per errori di rete
const retryRequest = async (config, retries = 3) => {
  try {
    return await api(config);
  } catch (error) {
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.message.includes('Network Error'))) {
      console.log(`🔄 Retry attempt ${4 - retries} for ${config.url}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      return retryRequest(config, retries - 1);
    }
    throw error;
  }
};

// Validazione schema risposta
const validateResponse = (data, expectedSchema) => {
  if (!expectedSchema) return true;
  
  for (const [key, type] of Object.entries(expectedSchema)) {
    if (!(key in data)) {
      console.warn(`⚠️ Missing required field: ${key}`);
      return false;
    }
    if (type === 'array' && !Array.isArray(data[key])) {
      console.warn(`⚠️ Expected array for field: ${key}`);
      return false;
    }
    if (type === 'object' && typeof data[key] !== 'object') {
      console.warn(`⚠️ Expected object for field: ${key}`);
      return false;
    }
  }
  return true;
};

api.interceptors.response.use(
  response => response,
  error => {
    // Log dettagliato dell'errore
    console.error('🚨 API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });

    // Emetti evento personalizzato per errori di rete
    const errorEvent = new CustomEvent('fetch-error', {
      detail: {
        error: {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          data: error.response?.data
        }
      }
    });
    window.dispatchEvent(errorEvent);
    
    // Gestione errori specifici
    if (error.response?.status === 401) {
      error.customMessage = 'Sessione scaduta o non autorizzato. Effettua di nuovo il login.';
      autoLogout();
    } else if (error.response?.status === 503) {
      error.customMessage = 'Servizio temporaneamente non disponibile. Riprova tra qualche minuto.';
    } else if (error.response?.status === 404) {
      error.customMessage = 'Risorsa non trovata.';
    } else if (error.response?.status >= 500) {
      error.customMessage = 'Errore del server. Riprova più tardi.';
    } else if (error.code === 'ECONNABORTED') {
      error.customMessage = 'Timeout della richiesta. Verifica la connessione.';
    } else if (error.message.includes('Network Error')) {
      error.customMessage = 'Errore di rete. Verifica la connessione.';
    }
    
    return Promise.reject(error);
  }
);

export const apiRequest = async (method, url, data, token, expectedSchema = null) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const config = { method, url, data, headers };
    
    // Usa retry logic per richieste importanti
    const response = await retryRequest(config);
    
    // Valida schema se fornito
    if (expectedSchema && !validateResponse(response.data, expectedSchema)) {
      throw new Error('Risposta API non valida');
    }
    
    return { ok: true, data: response.data };
  } catch (error) {
    console.error('🚨 apiRequest failed:', {
      method,
      url,
      error: error.customMessage || error.message
    });
    throw new Error(error.customMessage || error.message || 'Errore sconosciuto');
  }
};

// Hook reusabile per API calls
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, token = null, expectedSchema = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiRequest(method, url, data, token, expectedSchema);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, token = null, expectedSchema = null) => 
    request('GET', url, null, token, expectedSchema), [request]);
  
  const post = useCallback((url, data, token = null, expectedSchema = null) => 
    request('POST', url, data, token, expectedSchema), [request]);
  
  const put = useCallback((url, data, token = null, expectedSchema = null) => 
    request('PUT', url, data, token, expectedSchema), [request]);
  
  const del = useCallback((url, token = null, expectedSchema = null) => 
    request('DELETE', url, null, token, expectedSchema), [request]);

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del
  };
};

// Schemi di risposta comuni
export const responseSchemas = {
  leghe: { leghe: 'array' },
  squadre: { squadre: 'array' },
  giocatori: { giocatori: 'array' },
  notifiche: { notifiche: 'array' },
  offerte: { offerte: 'array' },
  richieste: { richieste: 'array' },
  user: { user: 'object' },
  success: { success: 'boolean' }
};

export default api; 