import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Se non è in caricamento e non c'è un utente, salva l'URL corrente
    if (!loading && !user) {
      // Salva l'URL corrente per il redirect dopo il login
      if (location.pathname !== '/login' && location.pathname !== '/register') {
        sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
      }
    }
  }, [user, loading, location]);

  useEffect(() => {
    // Se l'utente è loggato e c'è un URL di redirect salvato
    if (user && !loading) {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      }
    }
  }, [user, loading, navigate]);

  return null; // Questo componente non renderizza nulla
};

export default AuthRedirect; 