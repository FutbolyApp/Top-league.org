import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyUser } from '../api/auth';
import { clearUserCache } from '../api/sharedApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Funzione per aggiornare i dati utente dal server
  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      const response = await verifyUser(token);
      if (response && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('User data refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Se il token è scaduto, fai logout
      if (error.message?.includes('401') || error.message?.includes('Token')) {
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
            
            // Verifica se i dati sono aggiornati (controlla se mancano leghe_admin)
            if (!userData.leghe_admin || userData.leghe_admin.length === 0) {
              // Se mancano i dati delle leghe admin, è normale per utenti non admin
              // Non loggare più questo messaggio per ridurre il rumore
            }
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
  }, [token]);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser, refreshUserData }}>
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