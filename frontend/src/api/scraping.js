import { apiRequest } from './axiosConfig';

// Test scraping per un URL
export const testScraping = async (url, token) => {
  return apiRequest('POST', '/scraping/test', { url }, token);
};

// Scraping classifica
export const scrapeClassifica = async (url, lega_id, token) => {
  return apiRequest('POST', '/scraping/classifica', { url, lega_id }, token);
};

// Scraping risultati
export const scrapeRisultati = async (url, token) => {
  return apiRequest('POST', '/scraping/risultati', { url }, token);
};

// Scraping calciatori
export const scrapeCalciatori = async (url, token) => {
  return apiRequest('POST', '/scraping/calciatori', { url }, token);
};

// Scraping voti
export const scrapeVoti = async (url, token) => {
  return apiRequest('POST', '/scraping/voti', { url }, token);
};

// Aggiorna classifica nel database
export const updateClassificaFromScraping = async (url, lega_id, token) => {
  return apiRequest('POST', '/scraping/update-classifica', { url, lega_id }, token);
};

// Aggiorna voti nel database
export const updateVotiFromScraping = async (url, lega_id, token) => {
  return apiRequest('POST', '/scraping/update-voti', { url, lega_id }, token);
};

// Importa calciatori nel database
export const importCalciatoriFromScraping = async (url, lega_id, token) => {
  return apiRequest('POST', '/scraping/import-calciatori', { url, lega_id }, token);
};

// Scraping completo per una lega
export const scrapingCompleto = async (lega_id, urls, token) => {
  return apiRequest('POST', '/scraping/completo', { 
    lega_id, 
    classifica_url: urls.classifica,
    voti_url: urls.voti,
    calciatori_url: urls.calciatori
  }, token);
};

// Test manuale delle credenziali
export const testCredentials = async (leagueId, username, password, token) => {
    return apiRequest('POST', '/scraping/test-credentials', {
        leagueId,
        username,
        password
    }, token);
};

// Debug: ottieni credenziali dal database
export const debugCredentials = async (leagueId, token) => {
    return apiRequest('GET', `/scraping/debug-credentials/${leagueId}`, null, token);
};

// Test URL di scraping
export const testScrapingUrls = async (leagueUrl, token) => {
    return apiRequest('POST', '/scraping/test-urls', {
        leagueUrl
    }, token);
};

// Test URL di scraping con Puppeteer (per siti protetti)
export const testScrapingUrlsPuppeteer = async (leagueUrl, scrapingUrls, username, password, token) => {
    return apiRequest('POST', '/scraping/test-urls-puppeteer', {
        leagueUrl,
        scrapingUrls,
        username,
        password
    }, token);
};

// Test credenziali con Puppeteer (nuovo metodo principale)
export const testCredentialsPuppeteer = async (lega_id, username, password, token) => {
    return apiRequest('POST', '/scraping/test-credentials-puppeteer', {
        lega_id,
        username,
        password
    }, token);
};

// Test credenziali con Selenium (deprecato - da rimuovere)
export const testCredentialsSelenium = async (leagueId, username, password, token) => {
    return apiRequest('POST', '/scraping/test-credentials-selenium', {
        leagueId,
        username,
        password
    }, token);
};

// NUOVO: Scraping con Playwright (frontend)
export const scrapingPlaywright = async (lega_id, leagueUrl, scrapingUrls, username, password, token, tournament = null) => {
  return apiRequest('POST', '/scraping/playwright', { 
    leagueUrl,
    scrapingUrls,
    username,
    password,
    lega_id,
    tournament
  }, token);
};

// NUOVO: Scraping batch di più tornei con Playwright
export const scrapingPlaywrightBatch = async (lega_id, leagueUrl, scrapingUrls, username, password, tournamentIds, token) => {
  return apiRequest('POST', '/scraping/playwright-batch', { 
    leagueUrl,
    scrapingUrls,
    username,
    password,
    lega_id,
    tournamentIds
  }, token);
};

// Ottieni dati di scraping di una lega
export const getDatiScraping = async (lega_id, token) => {
  return apiRequest('GET', `/scraping/dati-scraping/${lega_id}`, {}, token);
};

// Confronta dati ufficiali vs scraping
export const getConfrontoDati = async (lega_id, token) => {
  return apiRequest('GET', `/scraping/confronto/${lega_id}`, {}, token);
};

// Aggiorna credenziali di una lega
export const updateCredentials = async (lega_id, username, password, token) => {
  return apiRequest('POST', '/scraping/update-credentials', {
    lega_id,
    username,
    password
  }, token);
};

// Debug: analizza struttura pagina
export const debugPageStructure = async (url, username, password, token) => {
  return apiRequest('POST', '/scraping/debug-page-structure', {
    url,
    username,
    password
  }, token);
};

// NUOVO: Pulizia profili browser
export const cleanupProfiles = async () => {
  try {
    const response = await apiRequest('POST', '/scraping/cleanup-profiles');
    return response.data;
  } catch (error) {
    console.error('Errore pulizia profili:', error);
    throw error;
  }
};

// Ottieni tornei disponibili per una lega
export const getAvailableTournaments = async (lega_id, leagueUrl, username, password, token) => {
  return apiRequest('POST', '/scraping/tournaments', { 
    lega_id,
    leagueUrl,
    username,
    password
  }, token);
}; 