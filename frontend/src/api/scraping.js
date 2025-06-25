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