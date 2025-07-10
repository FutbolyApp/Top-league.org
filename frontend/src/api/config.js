// Configurazione API URL
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001/api'
  : 'https://topleaguem.onrender.com/api'; // URL del backend su Render

console.log('API_BASE_URL:', API_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

async function fetchWithRetry(url, options = {}, retries = 3) {
  const fullUrl = `${API_BASE_URL}${url}`;
  console.log('Making request to:', fullUrl, 'with options:', { ...options, body: options.body ? '***' : undefined });
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log('Response status:', response.status, 'for URL:', fullUrl);
    
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