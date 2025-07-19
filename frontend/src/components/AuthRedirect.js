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
      sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    }
  }, [user, loading, location.pathname, location.search]);

  useEffect(() => {
    // Solo se l'utente è loggato e c'è un URL di redirect salvato
    if (user && !loading) {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      }
    }
  }, [user, loading, navigate]);

  return null;
};

export default AuthRedirect; 