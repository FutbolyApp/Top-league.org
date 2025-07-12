// Configurazione API URL
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001/api'
  : 'https://topleaguem.onrender.com/api'; // URL del backend su Render

console.log('API_BASE_URL:', API_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Frontend version:', '1.0.1'); // Force redeployment

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
      // Emetti evento personalizzato per errori di rete
      const errorEvent = new CustomEvent('fetch-error', {
        detail: {
          error: {
            status: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: fullUrl
          }
        }
      });
      window.dispatchEvent(errorEvent);
      
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
    
    // Emetti evento personalizzato per errori di rete
    const errorEvent = new CustomEvent('fetch-error', {
      detail: {
        error: {
          status: null,
          message: error.message,
          url: fullUrl
        }
      }
    });
    window.dispatchEvent(errorEvent);
    
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
  
  // Special method for FormData requests
  postFormData: (url, formData, token) => {
    const fullUrl = `${API_BASE_URL}${url}`;
    console.log('Making FormData request to:', fullUrl);
    console.log('FormData contents:', Array.from(formData.entries()));
    
    return fetch(fullUrl, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      mode: 'cors',
      credentials: 'include'
    }).then(async (response) => {
      console.log('Response status:', response.status, 'for URL:', fullUrl);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = 'Errore del server';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    }).catch((error) => {
      console.error('FormData request failed:', error);
      console.error('Error details:', error.message);
      throw error;
    });
  },
}; 