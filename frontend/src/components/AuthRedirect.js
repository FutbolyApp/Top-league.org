import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Solo se non è in caricamento e non c'è un utente, salva l'URL corrente
    if (!loading && !user && location.pathname !== '/login' && location.pathname !== '/register') {
      // Pulisci l'URL da eventuali ? prima di salvarlo
      const cleanPath = location.pathname.replace('?/', '/');
      const cleanUrl = cleanPath + location.search;
      sessionStorage.setItem('redirectAfterLogin', cleanUrl);
    }
  }, [user, loading, location.pathname, location.search]);

  useEffect(() => {
    // Solo se l'utente è loggato e c'è un URL di redirect salvato
    if (user && !loading) {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl && redirectUrl !== location.pathname + location.search) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      }
    }
  }, [user, loading, navigate, location.pathname, location.search]);

  return null;
};

export default AuthRedirect; 