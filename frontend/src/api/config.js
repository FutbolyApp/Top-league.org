const API_BASE_URL = 'http://localhost:3001/api';

async function fetchWithRetry(url, options = {}, retries = 3) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Errore del server';
      try {
        // Prova a leggere come JSON
        const errorData = await response.clone().json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        try {
          // Se non è JSON, prova come testo
          const text = await response.text();
          if (text.includes('<!DOCTYPE')) {
            errorMessage = 'Errore del server: risposta non valida';
          } else {
            errorMessage = text || errorMessage;
          }
        } catch (e2) {
          // fallback
        }
      }
      throw new Error(errorMessage);
    }
    return response.json();
  } catch (error) {
    console.error('Request failed:', error);
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export const api = {
  get: (url, token) => fetchWithRetry(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }),
  
  post: (url, data, token) => fetchWithRetry(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(data),
  }),
  
  put: (url, data, token) => fetchWithRetry(url, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(data),
  }),
  
  delete: (url, token) => fetchWithRetry(url, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }),
}; 