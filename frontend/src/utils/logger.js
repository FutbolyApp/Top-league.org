// Sistema di logging controllato
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configurazione dei log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// In produzione, mostra solo ERROR e WARN
const PRODUCTION_LOG_LEVEL = LOG_LEVELS.WARN;
// In sviluppo, mostra tutto
const DEVELOPMENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

const currentLogLevel = isProduction ? PRODUCTION_LOG_LEVEL : DEVELOPMENT_LOG_LEVEL;

// Funzioni di logging
export const logger = {
  error: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`❌ ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(`ℹ️ ${message}`, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(`🔍 ${message}`, ...args);
    }
  },
  
  // Log per operazioni critiche (sempre visibili)
  critical: (message, ...args) => {
    console.log(`🚨 ${message}`, ...args);
  }
};

// Funzione per log di debug condizionale
export const debugLog = (message, ...args) => {
  if (!isProduction) {
    console.log(`🔍 DEBUG: ${message}`, ...args);
  }
};

// Funzione per log di API
export const apiLog = (message, ...args) => {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`🌐 API: ${message}`, ...args);
  }
};

// Funzione per log di autenticazione
export const authLog = (message, ...args) => {
  if (currentLogLevel >= LOG_LEVELS.INFO) {
    console.log(`🔐 AUTH: ${message}`, ...args);
  }
};

// Funzione per log di componenti
export const componentLog = (componentName, message, ...args) => {
  if (currentLogLevel >= LOG_LEVELS.DEBUG) {
    console.log(`📦 ${componentName}: ${message}`, ...args);
  }
}; 