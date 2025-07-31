// Centralized API client with comprehensive logging and error handling
import { api } from './config.js';

// Enhanced API client with uniform error handling and logging
class ApiClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://www.top-league.org/api';
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // Enhanced request method with comprehensive logging
  async request(method, endpoint, data = null, token = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    const requestInfo = {
      id: requestId,
      method,
      url,
      endpoint,
      hasData: !!data,
      hasToken: !!token,
      timestamp: new Date().toISOString(),
      startTime
    };

    // Log request details
    if (this.debugMode) {
      console.log(`🔍 API REQUEST [${requestId}]:`, {
        method,
        url,
        endpoint,
        hasData: !!data,
        hasToken: !!token,
        dataSize: data ? JSON.stringify(data).length : 0,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Frontend-Version': process.env.REACT_APP_VERSION || '1.0.13',
        'X-Build-Timestamp': process.env.REACT_APP_BUILD_TIMESTAMP || new Date().toISOString()
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

      if (data && method !== 'GET') {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);
      const duration = Date.now() - startTime;

      // Log response details
      if (this.debugMode) {
        console.log(`🔍 API RESPONSE [${requestId}]:`, {
          method,
          url,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
      }

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
          console.error(`🚨 API ERROR [${requestId}]: Error parsing error response:`, parseError);
          errorData = { error: 'Failed to parse error response' };
        }

        // Enhanced error logging with context
        console.error(`🚨 API ERROR [${requestId}]:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          data: errorData.data,
          url,
          method,
          duration: `${duration}ms`,
          token: token ? `${token.substring(0, 20)}...` : 'none',
          timestamp: new Date().toISOString()
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
        error.requestId = requestId;
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

        if (this.debugMode) {
          console.log(`✅ API SUCCESS [${requestId}]:`, {
            method,
            url,
            status: response.status,
            hasData: !!data,
            dataType: typeof data,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
          });
        }

        return {
          ok: true,
          data,
          status: response.status,
          statusText: response.statusText,
          requestId
        };
      } catch (parseError) {
        console.error(`🚨 API ERROR [${requestId}]: Error parsing success response:`, parseError);
        throw new Error('Errore nel parsing della risposta');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`🚨 API NETWORK ERROR [${requestId}]:`, {
        method,
        url,
        error: error.message,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // Enhanced network error handling
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Errore di connessione al server');
      }

      throw error;
    }
  }

  // Enhanced GET method
  async get(endpoint, token = null) {
    return this.request('GET', endpoint, null, token);
  }

  // Enhanced POST method
  async post(endpoint, data = null, token = null) {
    return this.request('POST', endpoint, data, token);
  }

  // Enhanced PUT method
  async put(endpoint, data = null, token = null) {
    return this.request('PUT', endpoint, data, token);
  }

  // Enhanced DELETE method
  async delete(endpoint, token = null) {
    return this.request('DELETE', endpoint, null, token);
  }

  // Enhanced PATCH method
  async patch(endpoint, data = null, token = null) {
    return this.request('PATCH', endpoint, data, token);
  }

  // Enhanced FormData method
  async postFormData(endpoint, formData, token = null) {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    if (this.debugMode) {
      console.log(`🔍 API FORMDATA REQUEST [${requestId}]:`, {
        url,
        hasFormData: !!formData,
        formDataEntries: formData ? Array.from(formData.entries()).map(([key, value]) => [key, typeof value]) : [],
        hasToken: !!token,
        timestamp: new Date().toISOString()
      });
    }

    try {
      const headers = {
        'X-Request-ID': requestId,
        'X-Frontend-Version': process.env.REACT_APP_VERSION || '1.0.13',
        'X-Build-Timestamp': process.env.REACT_APP_BUILD_TIMESTAMP || new Date().toISOString()
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });

      const duration = Date.now() - startTime;

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
          errorData = { error: 'Failed to parse error response' };
        }

        console.error(`🚨 API FORMDATA ERROR [${requestId}]:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          data: errorData.data,
          url,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });

        const error = new Error(errorData.error || `Errore ${response.status}`);
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = errorData;
        throw error;
      }

      let data;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = { message: text };
        }
      } catch (parseError) {
        throw new Error('Errore nel parsing della risposta');
      }

      if (this.debugMode) {
        console.log(`✅ API FORMDATA SUCCESS [${requestId}]:`, {
          url,
          status: response.status,
          hasData: !!data,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
      }

      return {
        ok: true,
        data,
        status: response.status,
        statusText: response.statusText,
        requestId
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`🚨 API FORMDATA NETWORK ERROR [${requestId}]:`, {
        url,
        error: error.message,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient; 