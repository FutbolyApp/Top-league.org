const API_BASE_URL = 'http://localhost:3001/api';

async function fetchWithRetry(url, options = {}, retries = 3) {
  try {
    console.log('Making request to:', `${API_BASE_URL}${url}`, 'with data:', options.body);
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Errore del server';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Se non riesce a parsare JSON, usa il testo della risposta
        const text = await response.text();
        console.log('Error response text:', text);
        if (text.includes('<!DOCTYPE')) {
          errorMessage = 'Errore del server: risposta non valida';
        } else {
          errorMessage = text || errorMessage;
        }
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.log('Request failed:', error);
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