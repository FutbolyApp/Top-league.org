import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyUser } from '../api/auth';
import { clearUserCache, verifyUserShared } from '../api/sharedApi';

// Enhanced AuthContext with useEffect for initial refresh and robust fallback handling
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log('🔍 AuthProvider: Component mounted');
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  // Enhanced token validation
  const isValidToken = (token) => {
    if (!token || typeof token !== 'string') return false;
    if (token.length < 10) return false;
    return true;
  };

  // Enhanced user data validation
  const isValidUser = (userData) => {
    if (!userData || typeof userData !== 'object') return false;
    if (!userData.id || !userData.email) return false;
    return true;
  };

  // Enhanced refresh user data with comprehensive error handling and fallback
  const refreshUserData = async () => {
    if (!token || !isValidToken(token)) {
      console.log('🔍 AuthProvider: No valid token for refresh');
      return { success: false, error: 'No valid token' };
    }
    
    try {
      console.log('🔍 AuthProvider: Refreshing user data with token:', token.substring(0, 20) + '...');
      const response = await verifyUserShared(token);
      
      console.log('🔍 AuthProvider: Refresh response:', {
        hasResponse: !!response,
        hasUser: !!response?.user,
        userId: response?.user?.id,
        responseType: typeof response
      });
      
      if (response && isValidUser(response.user)) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('🔍 AuthProvider: User data refreshed successfully');
        setError(null);
        return { success: true, user: response.user };
      } else {
        console.warn('🔍 AuthProvider: Invalid user data in refresh response:', response);
        throw new Error('Dati utente non validi');
      }
    } catch (error) {
      console.error('🚨 AuthProvider: Failed to refresh user data:', error);
      setError(error.message || 'Errore nel refresh dei dati utente');
      
      // Handle token expiration gracefully
      if (error.message?.includes('401') || 
          error.message?.includes('Token') || 
          error.message?.includes('expired') ||
          error.message?.includes('unauthorized')) {
        console.log('🔍 AuthProvider: Token appears to be expired, logging out');
        logoutUser();
      }
      
      return { success: false, error: error.message };
    }
  };

  // Enhanced initialization with useEffect for initial refresh
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 AuthProvider: Initializing authentication');
        
        if (token && isValidToken(token)) {
          console.log('🔍 AuthProvider: Valid token found, verifying user');
          
          // Try to load user from localStorage first for faster UI
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
          
          // Always refresh from server with retry logic
          let refreshSuccess = false;
          let attempts = 0;
          const maxAttempts = 3;
          
          while (!refreshSuccess && attempts < maxAttempts) {
            attempts++;
            console.log(`🔍 AuthProvider: Refresh attempt ${attempts}/${maxAttempts}`);
            
            const refreshResult = await refreshUserData();
            if (refreshResult.success) {
              refreshSuccess = true;
              console.log('🔍 AuthProvider: Refresh successful');
            } else {
              console.warn(`🔍 AuthProvider: Refresh attempt ${attempts} failed:`, refreshResult.error);
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
              }
            }
          }
          
          if (!refreshSuccess) {
            console.warn('🔍 AuthProvider: All refresh attempts failed, clearing state');
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          console.log('🔍 AuthProvider: No valid token found');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('🚨 AuthProvider: Error during initialization:', error);
        setError(error.message || 'Errore durante l\'inizializzazione');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
        console.log('🔍 AuthProvider: Initialization complete');
      }
    };

    initializeAuth();
  }, []); // Only run on mount

  // Enhanced login function
  const loginUser = (userData, newToken) => {
    try {
      console.log('🔍 AuthProvider: Logging in user:', userData?.email);
      
      if (!isValidUser(userData) || !isValidToken(newToken)) {
        throw new Error('Dati di login non validi');
      }
      
      setUser(userData);
      setToken(newToken);
      setError(null);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('🔍 AuthProvider: User logged in successfully');
    } catch (error) {
      console.error('🚨 AuthProvider: Error during login:', error);
      setError(error.message);
      throw error;
    }
  };

  // Enhanced logout function
  const logoutUser = () => {
    console.log('🔍 AuthProvider: Logging out user');
    
    setUser(null);
    setToken(null);
    setError(null);
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearUserCache();
    
    console.log('🔍 AuthProvider: User logged out successfully');
  };

  // Enhanced context value
  const contextValue = {
    user,
    token,
    loading,
    error,
    isInitialized,
    isAuthenticated: !!user && !!token,
    loginUser,
    logoutUser,
    refreshUserData,
    setError
  };

  console.log('🔍 AuthProvider: Context value updated:', {
    hasUser: !!user,
    hasToken: !!token,
    loading,
    isAuthenticated: !!user && !!token
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Enhanced useAuth hook with better error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    console.error('🚨 useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 