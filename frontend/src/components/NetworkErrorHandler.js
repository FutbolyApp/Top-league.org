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

// Styled components per il form di login
const LoginForm = styled.form`
  margin-top: 1.5rem;
  text-align: left;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.5rem;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorText = styled.p`
  color: #e53e3e;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

const NetworkErrorHandler = ({ children }) => {
  const [networkError, setNetworkError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // Salva il token nel localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Chiudi il popup e ricarica la pagina
        setNetworkError(null);
        window.location.reload();
      } else {
        setLoginError(data.message || 'Errore durante il login');
      }
    } catch (error) {
      setLoginError('Errore di connessione. Riprova.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInputChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
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
          
          {networkError.type === 'unauthorized' ? (
            <LoginForm onSubmit={handleLogin}>
              <FormGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleInputChange}
                  placeholder="Inserisci la tua email"
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={loginData?.password || ''}
                  onChange={handleInputChange}
                  placeholder="Inserisci la tua password"
                  required
                />
              </FormGroup>
              
              {loginError && <ErrorText>{loginError}</ErrorText>}
              
              <LoginButton type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? 'Accesso in corso...' : 'Accedi'}
              </LoginButton>
            </LoginForm>
          ) : (
            <div>
              <RetryButton onClick={handleRetry}>
                Riprova
              </RetryButton>
              <CloseButton onClick={handleClose}>
                Chiudi
              </CloseButton>
            </div>
          )}
        </ErrorModal>
      </ErrorOverlay>
    </>
  );
};

export default NetworkErrorHandler; 