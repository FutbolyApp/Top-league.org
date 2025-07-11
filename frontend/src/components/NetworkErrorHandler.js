import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ErrorOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ErrorModal = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
`;

const ErrorTitle = styled.h2`
  color: #e53e3e;
  margin: 1rem 0;
  font-size: 1.5rem;
`;

const ErrorMessage = styled.p`
  color: #4a5568;
  margin: 1rem 0;
  line-height: 1.6;
`;

const RetryButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
`;

const CloseButton = styled.button`
  background: transparent;
  color: #718096;
  border: 2px solid #718096;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.5rem;
  
  &:hover {
    background: #718096;
    color: white;
  }
`;

const NetworkErrorHandler = ({ children }) => {
  const [networkError, setNetworkError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError({
        type: 'connection',
        message: 'Connessione internet persa. Verifica la tua connessione e riprova.',
        title: 'Errore di Connessione'
      });
    };

    const handleFetchError = (event) => {
      if (event.detail && event.detail.error) {
        const error = event.detail.error;
        
        if (error.message && error.message.includes('Failed to fetch')) {
          setNetworkError({
            type: 'fetch',
            message: 'Impossibile raggiungere il server. Verifica la tua connessione o riprova più tardi.',
            title: 'Errore di Connessione'
          });
        } else if (error.status === 502) {
          setNetworkError({
            type: 'server',
            message: 'Il server è temporaneamente non disponibile. Riprova tra qualche minuto.',
            title: 'Server Non Disponibile'
          });
        } else if (error.status === 404) {
          setNetworkError({
            type: 'notfound',
            message: 'La risorsa richiesta non è stata trovata.',
            title: 'Risorsa Non Trovata'
          });
        } else if (error.status === 403) {
          setNetworkError({
            type: 'forbidden',
            message: 'Non hai i permessi per accedere a questa risorsa.',
            title: 'Accesso Negato'
          });
        } else if (error.status === 401) {
          setNetworkError({
            type: 'unauthorized',
            message: 'Sessione scaduta. Effettua di nuovo il login.',
            title: 'Sessione Scaduta'
          });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('fetch-error', handleFetchError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('fetch-error', handleFetchError);
    };
  }, []);

  const handleRetry = () => {
    setNetworkError(null);
    window.location.reload();
  };

  const handleClose = () => {
    setNetworkError(null);
  };

  if (!networkError) {
    return children;
  }

  return (
    <>
      {children}
      <ErrorOverlay>
        <ErrorModal>
          <ErrorIcon>
            {networkError.type === 'connection' && '🌐'}
            {networkError.type === 'server' && '🔧'}
            {networkError.type === 'notfound' && '🔍'}
            {networkError.type === 'forbidden' && '🚫'}
            {networkError.type === 'unauthorized' && '🔐'}
            {networkError.type === 'fetch' && '📡'}
          </ErrorIcon>
          
          <ErrorTitle>{networkError.title}</ErrorTitle>
          <ErrorMessage>{networkError.message}</ErrorMessage>
          
          <div>
            <RetryButton onClick={handleRetry}>
              Riprova
            </RetryButton>
            <CloseButton onClick={handleClose}>
              Chiudi
            </CloseButton>
          </div>
        </ErrorModal>
      </ErrorOverlay>
    </>
  );
};

export default NetworkErrorHandler; 