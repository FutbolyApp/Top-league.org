import React, { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

// Context per gestire errori di rete globalmente
const NetworkErrorContext = createContext();

export const useNetworkError = () => {
  const context = useContext(NetworkErrorContext);
  if (!context) {
    throw new Error('useNetworkError must be used within a NetworkErrorProvider');
  }
  return context;
};

// Componente per mostrare errori di rete
const NetworkErrorModal = ({ error, onClose, onRetry }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleRetry = () => {
    setIsVisible(false);
    onRetry();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Errore di Connessione
            </h3>
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            {error?.message || 'Si è verificato un errore di connessione. Verifica la tua connessione internet e riprova.'}
          </p>
          
          {error?.details && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 font-mono">
                {error.details}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Chiudi
          </button>
          <button
            onClick={handleRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Riprova
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente per mostrare errori di autenticazione
const AuthErrorModal = ({ error, onClose, onRetry }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleRetry = () => {
    setIsVisible(false);
    onRetry();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Errore di Autenticazione
            </h3>
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            {error?.message || 'Si è verificato un errore di autenticazione. Effettua nuovamente il login.'}
          </p>
          
          {error?.details && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 font-mono">
                {error.details}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Chiudi
          </button>
          <button
            onClick={handleRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Riconnetti
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente per mostrare errori di server
const ServerErrorModal = ({ error, onClose, onRetry }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const handleRetry = () => {
    setIsVisible(false);
    onRetry();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Errore del Server
            </h3>
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            {error?.message || 'Si è verificato un errore del server. Riprova più tardi.'}
          </p>
          
          {error?.details && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-500 font-mono">
                {error.details}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Chiudi
          </button>
          <button
            onClick={handleRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Riprova
          </button>
        </div>
      </div>
    </div>
  );
};

// Provider principale per gestire errori di rete
export const NetworkErrorProvider = ({ children }) => {
  const [networkError, setNetworkError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { logout } = useAuth();

  // Monitora lo stato della connessione
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError({
        message: 'Connessione internet persa',
        details: 'Verifica la tua connessione e riprova'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Funzione per gestire errori di rete
  const handleNetworkError = (error) => {
    console.error('🚨 Network Error:', error);
    
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      setNetworkError({
        message: 'Errore di connessione',
        details: 'Verifica la tua connessione internet e riprova'
      });
    } else if (error.message.includes('CORS')) {
      setNetworkError({
        message: 'Errore di configurazione',
        details: 'Problema di configurazione del server. Contatta l\'amministratore.'
      });
    } else {
      setNetworkError({
        message: 'Errore di rete',
        details: error.message
      });
    }
  };

  // Funzione per gestire errori di autenticazione
  const handleAuthError = (error) => {
    console.error('🚨 Auth Error:', error);
    
    if (error.message.includes('Token non valido') || error.message.includes('Unauthorized')) {
      setAuthError({
        message: 'Sessione scaduta',
        details: 'Effettua nuovamente il login'
      });
      // Logout automatico dopo 5 secondi
      setTimeout(() => {
        logout();
      }, 5000);
    } else {
      setAuthError({
        message: 'Errore di autenticazione',
        details: error.message
      });
    }
  };

  // Funzione per gestire errori del server
  const handleServerError = (error) => {
    console.error('🚨 Server Error:', error);
    
    if (error.status === 500) {
      setServerError({
        message: 'Errore interno del server',
        details: 'Il server ha riscontrato un errore. Riprova più tardi.'
      });
    } else if (error.status === 503) {
      setServerError({
        message: 'Servizio temporaneamente non disponibile',
        details: 'Il server è in manutenzione. Riprova più tardi.'
      });
    } else {
      setServerError({
        message: 'Errore del server',
        details: error.message
      });
    }
  };

  // Funzione per pulire gli errori
  const clearErrors = () => {
    setNetworkError(null);
    setAuthError(null);
    setServerError(null);
  };

  // Funzione per retry
  const handleRetry = () => {
    clearErrors();
    window.location.reload();
  };

  const value = {
    networkError,
    authError,
    serverError,
    isOnline,
    handleNetworkError,
    handleAuthError,
    handleServerError,
    clearErrors
  };

  return (
    <NetworkErrorContext.Provider value={value}>
      {children}
      
      {/* Modali per gli errori */}
      <NetworkErrorModal 
        error={networkError} 
        onClose={() => setNetworkError(null)}
        onRetry={handleRetry}
      />
      
      <AuthErrorModal 
        error={authError} 
        onClose={() => setAuthError(null)}
        onRetry={handleRetry}
      />
      
      <ServerErrorModal 
        error={serverError} 
        onClose={() => setServerError(null)}
        onRetry={handleRetry}
      />
    </NetworkErrorContext.Provider>
  );
};

// Hook per intercettare errori nelle chiamate API
export const useApiErrorHandler = () => {
  const { handleNetworkError, handleAuthError, handleServerError } = useNetworkError();

  const handleApiError = (error) => {
    console.error('🚨 API Error:', error);

    // Determina il tipo di errore
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      handleNetworkError(error);
    } else if (error.status === 401 || error.status === 403) {
      handleAuthError(error);
    } else if (error.status >= 500) {
      handleServerError(error);
    } else {
      // Altri errori HTTP
      handleServerError(error);
    }
  };

  return { handleApiError };
};

export default NetworkErrorProvider; 