import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyUser } from '../api/auth';
import { clearUserCache, verifyUserShared } from '../api/sharedApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Funzione per aggiornare i dati utente dal server
  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      const response = await verifyUserShared(token);
      if (response && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('User data refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Se il token è scaduto, fai logout solo se non siamo già nella pagina di login
      if ((error.message?.includes('401') || error.message?.includes('Token')) && 
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/register') {
        logoutUser();
      }
    }
  };

  useEffect(() => {
    // Verifica token al mount
    if (token) {
      try {
        const userDataString = localStorage.getItem('user');
        if (userDataString && userDataString !== 'undefined' && userDataString !== 'null') {
          const userData = JSON.parse(userDataString);
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
      }
    }
    setLoading(false);
  }, []); // Solo al mount, non quando cambia token

  const loginUser = (userData, newToken) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    // Pulisci la cache API prima di fare logout
    clearUserCache(user?.id);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Non bloccare il rendering dell'app durante il loading
  // L'app può funzionare anche senza user inizialmente

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logoutUser, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 