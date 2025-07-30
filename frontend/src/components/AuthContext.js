import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyUser } from '../api/auth';
import { clearUserCache, verifyUserShared } from '../api/sharedApi';

// FIXED: Enhanced auth context with better error handling
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log('🔍 AuthProvider: Component mounted');
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FIXED: Enhanced token validation
  const isValidToken = (token) => {
    if (!token || typeof token !== 'string') return false;
    if (token.length < 10) return false; // Basic length validation
    return true;
  };

  // FIXED: Enhanced user data validation
  const isValidUser = (userData) => {
    if (!userData || typeof userData !== 'object') return false;
    if (!userData.id || !userData.email) return false;
    return true;
  };

  // FIXED: Enhanced refresh user data with comprehensive error handling
  const refreshUserData = async () => {
    if (!token || !isValidToken(token)) {
      console.log('🔍 AuthProvider: No valid token for refresh');
      return;
    }
    
    try {
      console.log('🔍 AuthProvider: Refreshing user data');
      const response = await verifyUserShared(token);
      
      console.log('🔍 AuthProvider: Refresh response:', {
        hasResponse: !!response,
        hasUser: !!response?.user,
        userId: response?.user?.id
      });
      
      if (response && isValidUser(response.user)) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('🔍 AuthProvider: User data refreshed successfully');
        setError(null);
      } else {
        console.warn('🔍 AuthProvider: Invalid user data in refresh response');
        throw new Error('Dati utente non validi');
      }
    } catch (error) {
      console.error('🚨 AuthProvider: Failed to refresh user data:', error);
      setError(error.message || 'Errore nel refresh dei dati utente');
      
      // FIXED: Handle token expiration gracefully
      if (error.message?.includes('401') || 
          error.message?.includes('Token') || 
          error.message?.includes('expired') ||
          error.message?.includes('unauthorized')) {
        console.log('🔍 AuthProvider: Token appears to be expired, logging out');
        logoutUser();
      }
    }
  };

  // FIXED: Enhanced initialization with better error handling
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 AuthProvider: Initializing authentication');
        
        if (token && isValidToken(token)) {
          console.log('🔍 AuthProvider: Valid token found, verifying user');
          
          // FIXED: Try to load user from localStorage first
          try {
            const userDataString = localStorage.getItem('user');
            if (userDataString && userDataString !== 'undefined' && userDataString !== 'null') {
              const userData = JSON.parse(userDataString);
              if (isValidUser(userData)) {
                console.log('🔍 AuthProvider: Loaded user from localStorage');
                setUser(userData);
              } else {
                console.warn('🔍 AuthProvider: Invalid user data in localStorage');
                localStorage.removeItem('user');
              }
            }
          } catch (parseError) {
            console.error('🚨 AuthProvider: Error parsing user data from localStorage:', parseError);
            localStorage.removeItem('user');
          }
          
          // FIXED: Verify token with server
          try {
            await refreshUserData();
          } catch (verifyError) {
            console.error('🚨 AuthProvider: Token verification failed:', verifyError);
            // Don't logout immediately, let the user try to use the app
          }
        } else {
          console.log('🔍 AuthProvider: No valid token found');
          // FIXED: Clear any invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('🚨 AuthProvider: Error during initialization:', error);
        setError(error.message || 'Errore durante l\'inizializzazione');
        
        // FIXED: Clear invalid data on initialization error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // FIXED: Only run on mount

  // FIXED: Enhanced login user with validation
  const loginUser = (userData, newToken) => {
    try {
      console.log('🔍 AuthProvider: Logging in user:', {
        hasUserData: !!userData,
        hasToken: !!newToken,
        userId: userData?.id
      });
      
      // FIXED: Validate input data
      if (!isValidUser(userData)) {
        throw new Error('Dati utente non validi per il login');
      }
      
      if (!isValidToken(newToken)) {
        throw new Error('Token non valido per il login');
      }
      
      // FIXED: Set user and token
      setUser(userData);
      setToken(newToken);
      setError(null);
      
      // FIXED: Save to localStorage with error handling
      try {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('🔍 AuthProvider: User data saved to localStorage');
      } catch (storageError) {
        console.error('🚨 AuthProvider: Error saving to localStorage:', storageError);
        // Don't throw, the login can still succeed
      }
      
      console.log('🔍 AuthProvider: User logged in successfully');
    } catch (error) {
      console.error('🚨 AuthProvider: Error during login:', error);
      setError(error.message || 'Errore durante il login');
      throw error;
    }
  };

  // FIXED: Enhanced logout user with cleanup
  const logoutUser = () => {
    try {
      console.log('🔍 AuthProvider: Logging out user');
      
      // FIXED: Clear all auth data
      setUser(null);
      setToken(null);
      setError(null);
      
      // FIXED: Clear localStorage with error handling
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('🔍 AuthProvider: Auth data cleared from localStorage');
      } catch (storageError) {
        console.error('🚨 AuthProvider: Error clearing localStorage:', storageError);
        // Don't throw, the logout can still succeed
      }
      
      // FIXED: Clear any cached data
      try {
        clearUserCache();
      } catch (cacheError) {
        console.error('🚨 AuthProvider: Error clearing cache:', cacheError);
      }
      
      console.log('🔍 AuthProvider: User logged out successfully');
    } catch (error) {
      console.error('🚨 AuthProvider: Error during logout:', error);
      // FIXED: Force logout even if there's an error
      setUser(null);
      setToken(null);
    }
  };

  // FIXED: Enhanced context value with safe defaults
  const value = {
    user: user || null,
    token: token || null,
    loading: loading || false,
    error: error || null,
    loginUser,
    logoutUser,
    refreshUserData,
    isAuthenticated: !!(user && token && isValidToken(token)),
    isTokenValid: isValidToken(token),
    isUserValid: isValidUser(user)
  };

  console.log('🔍 AuthProvider: Context value updated:', {
    hasUser: !!value.user,
    hasToken: !!value.token,
    isAuthenticated: value.isAuthenticated,
    loading: value.loading
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// FIXED: Enhanced useAuth hook with error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('🚨 useAuth must be used within an AuthProvider');
    // FIXED: Return safe defaults instead of throwing
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      loginUser: () => { throw new Error('AuthProvider not available'); },
      logoutUser: () => { throw new Error('AuthProvider not available'); },
      refreshUserData: () => { throw new Error('AuthProvider not available'); },
      isAuthenticated: false,
      isTokenValid: false,
      isUserValid: false
    };
  }
  return context;
}; 