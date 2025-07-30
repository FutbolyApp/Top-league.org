import { api, responseSchemas } from './config.js';

// FIXED: Enhanced login with comprehensive validation and error handling
export const login = async (credentials) => {
  console.log('🔍 AUTH API: Login attempt with credentials:', { 
    email: credentials.email, 
    password: '***' 
  });
  
  // FIXED: Client-side validation before making request
  if (!credentials.email || !credentials.password) {
    const error = new Error('Email e password sono obbligatori');
    console.error('🚨 AUTH API ERROR: Missing credentials');
    throw error;
  }
  
  try {
    console.log('🔍 AUTH API: Making request to /auth/login');
    const response = await api.post('/auth/login', credentials, null, responseSchemas.auth);
    
    console.log('🔍 AUTH API: Response received:', {
      hasResponse: !!response,
      responseType: typeof response,
      hasData: !!response?.data,
      hasUser: !!response?.data?.user,
      hasToken: !!response?.data?.token,
      userKeys: response?.data?.user ? Object.keys(response.data.user) : 'no user',
      timestamp: new Date().toISOString()
    });

    // FIXED: Comprehensive response validation
    if (!response) {
      console.error('🚨 AUTH API ERROR: No response received');
      throw new Error('Nessuna risposta dal server');
    }

    if (!response.ok) {
      const errorMessage = response.error || response.message || 'Errore di autenticazione';
      console.error('🚨 AUTH API ERROR: Response not ok:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    if (!response.data) {
      console.error('🚨 AUTH API ERROR: Response missing data property');
      console.error('🚨 Full response:', response);
      throw new Error('Risposta del server non valida: dati mancanti');
    }

    if (!response.data.user) {
      console.error('🚨 AUTH API ERROR: Response missing user property');
      console.error('🚨 Full response:', response);
      throw new Error('Risposta del server non valida: dati utente mancanti');
    }

    if (!response.data.token) {
      console.error('🚨 AUTH API ERROR: Response missing token property');
      console.error('🚨 Full response:', response);
      throw new Error('Risposta del server non valida: token mancante');
    }

    // FIXED: Validate user object structure
    const user = response.data.user;
    if (!user.id || !user.email) {
      console.error('🚨 AUTH API ERROR: Invalid user object structure');
      console.error('🚨 User object:', user);
      throw new Error('Dati utente non validi');
    }

    console.log('🔍 AUTH API: Response validation passed, returning data');
    console.log('🔍 AUTH API: User data:', {
      id: user.id,
      email: user.email,
      username: user.username,
      ruolo: user.ruolo
    });

    return response.data;
    
  } catch (error) {
    console.error('🚨 AUTH API ERROR:', error);
    console.error('🚨 Error message:', error.message);
    console.error('🚨 Error response:', error.response?.data);
    console.error('🚨 Error status:', error.response?.status);
    throw error;
  }
};

// FIXED: Enhanced register with validation
export const register = async (userData) => {
  console.log('🔍 AUTH API: Register attempt with userData:', {
    email: userData.email,
    username: userData.username,
    hasPassword: !!userData.password
  });
  
  // FIXED: Client-side validation
  if (!userData.email || !userData.username || !userData.password) {
    throw new Error('Tutti i campi sono obbligatori');
  }
  
  try {
    const response = await api.post('/auth/register', userData, null, responseSchemas.auth);
    console.log('🔍 AUTH API: Register response received:', {
      hasResponse: !!response,
      hasData: !!response?.data,
      hasUser: !!response?.data?.user,
      hasToken: !!response?.data?.token
    });
    
    // FIXED: Validate registration response
    if (!response?.ok) {
      const errorMessage = response?.error || response?.message || 'Errore durante la registrazione';
      throw new Error(errorMessage);
    }
    
    return response.data || response;
  } catch (error) {
    console.error('🚨 AUTH API REGISTER ERROR:', error);
    throw error;
  }
};

// FIXED: Enhanced logout with proper cleanup
export const logout = async () => {
  console.log('🔍 AUTH API: Logout called');
  try {
    const response = await api.post('/auth/logout');
    console.log('🔍 AUTH API: Logout response received:', response);
    
    // FIXED: Always return success for logout, even if API fails
    return { success: true, message: 'Logout completato' };
  } catch (error) {
    console.error('🚨 AUTH API LOGOUT ERROR:', error);
    // FIXED: Don't throw on logout errors, just log them
    return { success: true, message: 'Logout completato (con warning)' };
  }
};

// FIXED: Enhanced verifyUser with better error handling
export const verifyUser = async (token) => {
  console.log('🔍 AUTH API: Verify user called with token:', token ? 'present' : 'missing');
  
  if (!token) {
    console.warn('🔍 AUTH API: No token provided for verification');
    return null;
  }
  
  try {
    const response = await api.get('/auth/verify-user', token, responseSchemas.user);
    
    console.log('🔍 AUTH API: Verify user response received:', {
      hasResponse: !!response,
      hasData: !!response?.data,
      hasUser: !!response?.data?.user
    });

    // FIXED: Handle verification failures gracefully
    if (!response?.ok) {
      console.warn('🔍 AUTH API: Token verification failed:', response?.error);
      return null;
    }

    if (!response?.data?.user) {
      console.warn('🔍 AUTH API: No user data in verification response');
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('🚨 AUTH API VERIFY ERROR:', error);
    return null;
  }
};

// FIXED: Enhanced user management functions
export const checkUser = (username) => {
  return api.post('/auth/check-user', { username }, null, { available: 'boolean' });
};

export const checkAvailability = (data) => {
  return api.post('/auth/check-availability', data, null, { available: 'boolean' });
};

export const searchUsers = (query, token) => {
  return api.get(`/auth/search-users?q=${encodeURIComponent(query)}`, token, { users: 'array' });
};

export const isLeagueAdmin = (legaId, token) => {
  return api.get(`/auth/is-league-admin/${legaId}`, token, { isAdmin: 'boolean' });
}; 