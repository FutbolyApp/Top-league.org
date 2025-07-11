import { api } from './config.js';
import { updateApiStats } from '../components/ApiMonitor.js';

// Cache per le richieste API
const apiCache = new Map();
const pendingRequests = new Map();
const lastCallTime = new Map();

// Funzione per debounce delle chiamate API
const debounceCall = (key, minInterval = 1000) => {
  const now = Date.now();
  const lastCall = lastCallTime.get(key) || 0;
  
  if (now - lastCall < minInterval) {
    console.log(`⏱️ Debounced call for: ${key} (${minInterval - (now - lastCall)}ms remaining)`);
    return false;
  }
  
  lastCallTime.set(key, now);
  return true;
};

// Funzione per deduplicare le richieste API
const deduplicateRequest = async (key, requestFn, cacheTime = 30000) => {
  // Debounce per evitare chiamate troppo frequenti
  if (!debounceCall(key, 2000)) {
    // Se la chiamata è stata debounced, restituisci i dati dalla cache se disponibili
    const cached = apiCache.get(key);
    if (cached) {
      console.log(`⏱️ Returning cached data for debounced call: ${key}`);
      updateApiStats('cache');
      return cached.data;
    }
    // Se non ci sono dati in cache, aspetta un po' e riprova
    await new Promise(resolve => setTimeout(resolve, 1000));
    return deduplicateRequest(key, requestFn, cacheTime);
  }

  // Se c'è già una richiesta in corso per questa chiave, restituisci la promise esistente
  if (pendingRequests.has(key)) {
    console.log(`🔄 Request deduplication hit for: ${key}`);
    updateApiStats('deduplication');
    return pendingRequests.get(key);
  }

  // Se abbiamo dati in cache e sono recenti, restituiscili
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < cacheTime) {
    console.log(`💾 Cache hit for: ${key}`);
    updateApiStats('cache');
    return cached.data;
  }

  console.log(`🌐 New API request for: ${key}`);
  updateApiStats('unique');
  // Crea una nuova richiesta
  const promise = requestFn().then(data => {
    // Salva in cache
    apiCache.set(key, {
      data,
      timestamp: Date.now()
    });
    // Rimuovi dalla lista delle richieste in corso
    pendingRequests.delete(key);
    return data;
  }).catch(error => {
    // Rimuovi dalla lista delle richieste in corso anche in caso di errore
    pendingRequests.delete(key);
    throw error;
  });

  // Salva la promise nella lista delle richieste in corso
  pendingRequests.set(key, promise);
  return promise;
};

// Funzione per invalidare la cache
export const invalidateCache = (pattern) => {
  if (pattern) {
    // Rimuovi tutte le chiavi che corrispondono al pattern
    for (const key of apiCache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key);
      }
    }
  } else {
    // Pulisci tutta la cache
    apiCache.clear();
  }
};

// API functions con deduplicazione
export const getNotificheShared = async (token, userId) => {
  return deduplicateRequest(
    `notifiche_${userId}`,
    () => api.get('/notifiche', token),
    30000 // 30 secondi di cache
  );
};

export const getSquadreUtenteShared = async (token, userId) => {
  return deduplicateRequest(
    `squadre_utente_${userId}`,
    () => api.get('/squadre/utente', token),
    60000 // 1 minuto di cache
  );
};

export const getLegheUserShared = async (token, userId) => {
  return deduplicateRequest(
    `leghe_user_${userId}`,
    () => api.get('/leghe/user-leagues', token),
    60000 // 1 minuto di cache
  );
};

export const getRichiesteAdminShared = async (token, adminId) => {
  return deduplicateRequest(
    `richieste_admin_${adminId}`,
    () => api.get('/leghe/richieste/admin', token),
    30000 // 30 secondi di cache
  );
};

export const verifyUserShared = async (token) => {
  return deduplicateRequest(
    `verify_user_${token ? token.substring(0, 20) : 'anonymous'}`,
    () => api.get('/auth/verify-user', token),
    60000 // 1 minuto di cache
  );
};

export const checkSubadminShared = async (token) => {
  return deduplicateRequest(
    `subadmin_check_${token ? token.substring(0, 20) : 'anonymous'}`,
    () => api.get('/subadmin/check-all', token),
    60000 // 1 minuto di cache
  );
};

// Funzione per pulire la cache quando l'utente fa logout
export const clearUserCache = (userId) => {
  if (userId) {
    invalidateCache(userId.toString());
  } else {
    // Pulisci tutta la cache se non c'è userId
    apiCache.clear();
  }
  // Pulisci anche le richieste in corso
  pendingRequests.clear();
}; 