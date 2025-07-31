// Enhanced API configuration with comprehensive error handling and debug logging
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://www.top-league.org/api';
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_VERSION = process.env.REACT_APP_VERSION || '1.0.13';
const BUILD_TIMESTAMP = process.env.REACT_APP_BUILD_TIMESTAMP || new Date().toISOString();

console.log('config.js:9 API_BASE_URL:', API_BASE_URL);
console.log('config.js:10 NODE_ENV:', NODE_ENV);
console.log('config.js:11 Frontend version:', FRONTEND_VERSION);
console.log('config.js:12 Build timestamp:', BUILD_TIMESTAMP);

// Enhanced error handling and response processing
const processResponse = async (response, requestInfo) => {
  const { method, url, token } = requestInfo;
  
  console.log(`🔍 RESPONSE:`, {
    method,
    url,
    status: response.status,
    statusText: response.statusText,
    duration: `${Date.now() - requestInfo.startTime}ms`,
    timestamp: new Date().toISOString()
  });

  // Enhanced error handling for different status codes
  if (!response.ok) {
    let errorData = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        const textError = await response.text();
        errorData = { error: textError || 'Unknown error' };
      }
    } catch (parseError) {
      console.error('🚨 Error parsing error response:', parseError);
      errorData = { error: 'Failed to parse error response' };
    }

    console.error('🚨 HTTP Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData.error,
      data: errorData.data,
      url,
      method,
      token: token ? `${token.substring(0, 20)}...` : 'none'
    });

    // Enhanced error messages based on status code
    let errorMessage = errorData.error || 'Unknown error';
    
    switch (response.status) {
      case 401:
        errorMessage = 'Token non valido o scaduto';
        break;
      case 403:
        errorMessage = 'Accesso negato';
        break;
      case 404:
        errorMessage = 'Risorsa non trovata';
        break;
      case 500:
        errorMessage = 'Errore del server';
        break;
      case 503:
        errorMessage = 'Servizio non disponibile';
        break;
      default:
        errorMessage = errorData.error || `Errore ${response.status}`;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = errorData;
    throw error;
  }

  // Enhanced success response processing
  try {
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    console.log(`✅ API Success:`, {
      method,
      url,
      status: response.status,
      hasData: !!data,
      dataType: typeof data,
      timestamp: new Date().toISOString()
    });

    return {
      ok: true,
      data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (parseError) {
    console.error('🚨 Error parsing success response:', parseError);
    throw new Error('Errore nel parsing della risposta');
  }
};

// Enhanced request function with comprehensive logging
const makeRequest = async (method, endpoint, token = null, body = null, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  const requestInfo = {
    method,
    url,
    token: token ? `${token.substring(0, 20)}...` : 'none',
    startTime
  };

  console.log(`🔍 REQUEST:`, {
    method,
    url,
    ip: 'client',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    hasToken: !!token,
    hasBody: !!body,
    bodySize: body ? JSON.stringify(body).length : 0
  });

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Frontend-Version': FRONTEND_VERSION,
      'X-Build-Timestamp': BUILD_TIMESTAMP
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions = {
      method,
      headers,
      credentials: 'include',
      ...options
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    return await processResponse(response, requestInfo);
  } catch (error) {
    console.error('🚨 Network Error:', {
      method,
      url,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Enhanced network error handling
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Errore di connessione al server');
    }

    throw error;
  }
};

// Enhanced API object with better error handling
export const api = {
  get: async (endpoint, token = null) => {
    return makeRequest('GET', endpoint, token);
  },

  post: async (endpoint, data = null, token = null) => {
    return makeRequest('POST', endpoint, token, data);
  },

  put: async (endpoint, data = null, token = null) => {
    return makeRequest('PUT', endpoint, token, data);
  },

  delete: async (endpoint, token = null) => {
    return makeRequest('DELETE', endpoint, token);
  },

  patch: async (endpoint, data = null, token = null) => {
    return makeRequest('PATCH', endpoint, token, data);
  }
};

// Enhanced health check
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.ok;
  } catch (error) {
    console.error('🚨 API Health Check Failed:', error);
    return false;
  }
};

// Enhanced version check
export const getApiVersion = async () => {
  try {
    const response = await api.get('/version');
    return response.data;
  } catch (error) {
    console.error('🚨 API Version Check Failed:', error);
    return null;
  }
}; 