import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { useParams, useNavigate } from 'react-router-dom';
import { getLegheAdmin } from '../api/leghe';
import { 
  testScraping, 
  scrapeClassifica, 
  scrapeRisultati, 
  scrapeCalciatori,
  scrapeVoti,
  updateClassificaFromScraping,
  updateVotiFromScraping,
  importCalciatoriFromScraping,
  scrapingCompleto,
  testCredentials,
  debugCredentials,
  testScrapingUrls,
  testCredentialsPuppeteer,
  scrapingPlaywright,
  scrapingPlaywrightBatch,
  testScrapingUrlsPuppeteer,
  getDatiScraping,
  getConfrontoDati,
  updateCredentials,
  debugPageStructure,
  getAvailableTournaments,
  cleanupProfiles
} from '../api/scraping';
import { splitRoles, getRoleClass } from '../utils/roleUtils';
// import { updateCredentials } from '../api/auth'; // Commentato perché non esiste
import './ScrapingManager.css';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin: 0;
`;

const FormCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const FormTitle = styled.h2`
  color: #333;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultCard = styled.div`
  background: ${props => props.$success ? '#d4edda' : '#f8d7da'};
  border: 1px solid ${props => props.$success ? '#c3e6cb' : '#f5c6cb'};
  color: ${props => props.$success ? '#155724' : '#721c24'};
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #FFA94D;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PlayerRole = styled.span`
  .ruolo-badge {
    display: inline-block;
    padding: 4px 8px;
    margin: 2px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    min-width: 24px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    transition: all 0.2s ease;
  }
  
  .ruolo-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .ruolo-badge:last-child {
    margin-right: 0;
  }
  
  /* Ruoli Serie A Classic */
  .ruolo-p { 
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
    color: white; 
    border-color: #e65100;
  }
  
  .ruolo-d { 
    background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); 
    color: white; 
    border-color: #2e7d32;
  }
  
  .ruolo-c { 
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); 
    color: white; 
    border-color: #1565c0;
  }
  
  .ruolo-a { 
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
    color: white; 
    border-color: #c62828;
  }
  
  /* Ruoli Euroleghe Mantra */
  /* Portieri - Arancione (come P) */
  .ruolo-por { 
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
    color: white; 
    border-color: #e65100;
  }
  
  /* Difensori - Palette di verdi */
  .ruolo-dc { 
    background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); 
    color: white; 
    border-color: #0d4f14;
  }
  
  .ruolo-dd { 
    background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%); 
    color: white; 
    border-color: #1b5e20;
  }
  
  .ruolo-ds { 
    background: linear-gradient(135deg, #43a047 0%, #388e3c 100%); 
    color: white; 
    border-color: #2e7d32;
  }
  
  /* Centrocampisti - Palette di blu */
  .ruolo-b { 
    background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%); 
    color: white; 
    border-color: #002171;
  }
  
  .ruolo-e { 
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); 
    color: white; 
    border-color: #0d47a1;
  }
  
  .ruolo-m { 
    background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%); 
    color: white; 
    border-color: #1565c0;
  }
  
  .ruolo-t { 
    background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%); 
    color: white; 
    border-color: #1976d2;
  }
  
  .ruolo-w { 
    background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%); 
    color: white; 
    border-color: #1e88e5;
  }
  
  /* Attaccanti - Palette di rossi */
  .ruolo-a { 
    background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); 
    color: white; 
    border-color: #8e0000;
  }
  
  .ruolo-pc { 
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
    color: white; 
    border-color: #b71c1c;
  }
  
  /* Fallback */
  .ruolo-default { 
    background: linear-gradient(135deg, #757575 0%, #616161 100%); 
    color: white; 
    border-color: #424242;
  }
`;

const ScrapingManager = () => {
  const { token } = useAuth();
  const { showErrorModal, showSuccessModal, showConfirmModal } = useNotification();
  const { legaId } = useParams();
  const navigate = useNavigate();
  const [selectedLega, setSelectedLega] = useState('');
  const [leghe, setLeghe] = useState([]);
  const [legaData, setLegaData] = useState(null);
  const [leagueUrl, setLeagueUrl] = useState('');
  const [scrapingUrls, setScrapingUrls] = useState({
    rose: '',
    classifica: '',
    formazioni: '',
  });
  const [formazioniGiornata, setFormazioniGiornata] = useState('');
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [selectedTournament, setSelectedTournament] = useState('');
  const [availableTournaments, setAvailableTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [scrapingTestResult, setScrapingTestResult] = useState(null);
  const [datiScraping, setDatiScraping] = useState(null);
  const [confrontoDati, setConfrontoDati] = useState(null);
  const [activeTab, setActiveTab] = useState('scraping');
  const [expandedSections, setExpandedSections] = useState({
    rose: false,
    classifica: false,
    formazioni: false
  });
  const [expandedSquadre, setExpandedSquadre] = useState({});
  const [sortField, setSortField] = useState('default');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [selectedTournaments, setSelectedTournaments] = useState([]);

  // Carica le credenziali salvate dal localStorage
  useEffect(() => {
    const savedCredentials = localStorage.getItem('scraping_credentials');
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        setCredentials(prev => ({
          ...prev,
          username: parsed.username || '',
          password: parsed.password || ''
        }));
      } catch (error) {
        console.error('Errore nel caricamento delle credenziali salvate:', error);
      }
    }
  }, []);

  // Salva le credenziali nel localStorage quando cambiano
  useEffect(() => {
    if (credentials.username || credentials.password) {
      localStorage.setItem('scraping_credentials', JSON.stringify({
        username: credentials.username,
        password: credentials.password
      }));
    }
  }, [credentials.username, credentials.password]);

  // Carica le leghe dell'admin
  useEffect(() => {
    const loadLeghe = async () => {
      try {
        const response = await getLegheAdmin(token);
        setLeghe(response.leghe || []);
        
        // Se abbiamo un legaId nell'URL, selezionalo automaticamente
        if (legaId) {
          const lega = response.leghe?.find(l => l.id.toString() === legaId);
          if (lega) {
            setSelectedLega(lega.id.toString());
            setLegaData(lega);
            // Pre-compila gli URL se la lega ha dati di scraping
            if (lega.fantacalcio_url) {
              setLeagueUrl(lega.fantacalcio_url);
              // Pre-compila tutti gli URL di scraping basati sull'URL base
              const baseUrl = lega.fantacalcio_url.replace(/\/$/, '');
              setScrapingUrls({
                rose: `${baseUrl}/rose`,
                classifica: `${baseUrl}/classifica`,
                formazioni: `${baseUrl}/formazioni`,
              });
            }
            // Pre-compila le credenziali se la lega le ha configurate
            if (lega.fantacalcio_username && lega.fantacalcio_password) {
              // Controlla se ci sono già credenziali salvate dall'utente
              const savedCredentials = localStorage.getItem('scraping_credentials');
              if (!savedCredentials) {
                // Solo se non ci sono credenziali salvate, usa quelle della lega
                setCredentials({
                  username: lega.fantacalcio_username,
                  password: lega.fantacalcio_password
                });
              }
            }
          } else {
            showErrorModal('Lega Non Trovata', `La lega con ID ${legaId} non è stata trovata o non hai i permessi per accedervi.`);
          }
        }
      } catch (error) {
        console.error('Errore caricamento leghe:', error);
        showErrorModal('Errore di Caricamento', 'Impossibile caricare le leghe. Verifica la connessione e riprova.');
      }
    };
    
    loadLeghe();
  }, [token, legaId, showErrorModal]);

  const handleUrlChange = (field, value) => {
    if (field === 'base') {
      setLeagueUrl(value);
      // Aggiorna automaticamente tutti gli URL basati sull'URL base
      const baseUrl = value.replace(/\/$/, ''); // Rimuove trailing slash
      setScrapingUrls({
        rose: `${baseUrl}/rose`,
        classifica: `${baseUrl}/classifica`,
        formazioni: `${baseUrl}/formazioni`,
      });
    } else {
      setScrapingUrls(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCredentialsChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleClearSavedCredentials = () => {
    localStorage.removeItem('scraping_credentials');
    setCredentials({ username: '', password: '' });
    showSuccessModal('Credenziali Rimosse', 'Le credenziali salvate sono state rimosse con successo.');
  };

  const handleTestUrl = async (url) => {
    if (!url) {
      showErrorModal('URL Mancante', 'Inserisci un URL da testare.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await testScraping(url, token);
      if (result.success) {
        showSuccessModal('✅ URL Valido', 'L\'URL è raggiungibile e il contenuto è accessibile.');
      } else {
        showErrorModal('❌ URL Non Valido', result.error || 'L\'URL non è raggiungibile o il contenuto non è accessibile.');
      }
      setScrapingTestResult(result);
    } catch (error) {
      showErrorModal('❌ Errore di Test', `Errore durante il test: ${error.message}`);
      setScrapingTestResult(null);
    }
    setLoading(false);
  };

  const handleUpdateClassifica = async () => {
    if (!selectedLega || !leagueUrl) {
      showErrorModal('Configurazione Mancante', 'Seleziona una lega e inserisci l\'URL della classifica.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await updateClassificaFromScraping(leagueUrl, selectedLega, token);
      if (result.success) {
        showSuccessModal('✅ Classifica Aggiornata', 'La classifica è stata aggiornata con successo!');
      } else {
        showErrorModal('❌ Errore Aggiornamento', result.error || 'Errore durante l\'aggiornamento della classifica');
      }
      setResults(prev => ({ ...prev, classifica: result }));
    } catch (error) {
      showErrorModal('❌ Errore di Connessione', `Errore: ${error.message}`);
      setResults(prev => ({ ...prev, classifica: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const handleImportCalciatori = async () => {
    if (!selectedLega || !leagueUrl) {
      showErrorModal('Configurazione Mancante', 'Seleziona una lega e inserisci l\'URL dei calciatori.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await importCalciatoriFromScraping(leagueUrl, selectedLega, token);
      if (result.success) {
        showSuccessModal('✅ Calciatori Importati', 'I calciatori sono stati importati con successo!');
      } else {
        showErrorModal('❌ Errore Importazione', result.error || 'Errore durante l\'importazione dei calciatori');
      }
      setResults(prev => ({ ...prev, calciatori: result }));
    } catch (error) {
      showErrorModal('❌ Errore di Connessione', `Errore: ${error.message}`);
      setResults(prev => ({ ...prev, calciatori: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const handleScrapingCompleto = async () => {
    if (!selectedLega) {
      showErrorModal('Configurazione Mancante', 'Seleziona una lega per procedere.');
      return;
    }
    
    showConfirmModal(
      '🔄 Scraping Completo',
      'Questo processo importerà tutti i dati disponibili (classifica, voti, calciatori). Vuoi procedere?',
      async () => {
        setLoading(true);
        try {
          const result = await scrapingCompleto(selectedLega, { classifica: leagueUrl, voti: leagueUrl, calciatori: leagueUrl }, token);
          if (result.success) {
            showSuccessModal('✅ Scraping Completato', 'Tutti i dati sono stati importati con successo!');
          } else {
            showErrorModal('❌ Errore Scraping', result.error || 'Errore durante lo scraping completo');
          }
          setResults(prev => ({ ...prev, completo: result }));
        } catch (error) {
          showErrorModal('❌ Errore di Connessione', `Errore: ${error.message}`);
          setResults(prev => ({ ...prev, completo: { success: false, error: error.message } }));
        }
        setLoading(false);
      }
    );
  };

  const handleTestCredentials = async () => {
    if (!selectedLega || !legaData) {
      showErrorModal('Configurazione Mancante', 'Seleziona una lega per testare le credenziali.');
      return;
    }

    if (!legaData.fantacalcio_username || !legaData.fantacalcio_password) {
      showErrorModal('Credenziali Mancanti', 'Questa lega non ha configurato le credenziali di scraping.');
      return;
    }

    setLoading(true);
    try {
      const result = await testCredentials(
        selectedLega, 
        legaData.fantacalcio_username, 
        legaData.fantacalcio_password, 
        token
      );
      
      if (result.success) {
        showSuccessModal('✅ Credenziali Valide', 'Le credenziali sono corrette e il login è riuscito!');
      } else {
        showErrorModal('❌ Credenziali Non Valide', result.message || 'Le credenziali non sono corrette o il login è fallito.');
      }
      setResults(prev => ({ ...prev, credentials: result }));
    } catch (error) {
      showErrorModal('❌ Errore Test Credenziali', `Errore: ${error.message}`);
      setResults(prev => ({ ...prev, credentials: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const handleDebugCredentials = async () => {
    if (!selectedLega) {
      showErrorModal('Configurazione Mancante', 'Seleziona una lega per il debug.');
      return;
    }

    setLoading(true);
    try {
      const result = await debugCredentials(selectedLega, token);
      
      if (result.success) {
        const debugInfo = result.data;
        showSuccessModal('🔍 Debug Credenziali', 
          `Lega: ${debugInfo.leagueName}\n` +
          `Username: ${debugInfo.username || 'Non impostato'}\n` +
          `Password: ${debugInfo.hasPassword ? 'Impostata (' + debugInfo.passwordLength + ' caratteri)' : 'Non impostata'}`
        );
      } else {
        showErrorModal('❌ Errore Debug', result.message || 'Errore durante il debug delle credenziali.');
      }
      setResults(prev => ({ ...prev, debug: result }));
    } catch (error) {
      showErrorModal('❌ Errore Debug', `Errore: ${error.message}`);
      setResults(prev => ({ ...prev, debug: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const handleTestUrls = async () => {
    if (!leagueUrl) {
      showErrorModal('URL Mancante', 'Seleziona una lega con URL configurato.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await testScrapingUrls(leagueUrl, token);
      
      if (result.success) {
        showSuccessModal('✅ Test URL Completato', 
          `Test completato!\n\nURL validi trovati: ${result.results.filter(r => r.exists).length}\n\nURL suggeriti:\n• Classifica: ${result.suggestedUrls.classifica}\n• Voti: ${result.suggestedUrls.voti}\n• Calciatori: ${result.suggestedUrls.calciatori}`
        );
      } else {
        showErrorModal('❌ Errore Test URL', result.message || 'Errore durante il test degli URL');
      }
    } catch (error) {
      showErrorModal('❌ Errore di Connessione', `Errore: ${error.message}`);
    }
    setLoading(false);
  };

  const handleTestCredentialsPuppeteer = async () => {
    if (!selectedLega) {
      showErrorModal('Lega Mancante', 'Seleziona una lega per testare le credenziali.');
      return;
    }

    if (!credentials.username || !credentials.password) {
      showErrorModal('Credenziali Mancanti', 'Inserisci username e password per testare le credenziali.');
      return;
    }

    setLoading(true);
    try {
      const result = await testCredentialsPuppeteer(
        selectedLega,
        credentials.username,
        credentials.password,
        token
      );
      
      if (result.success) {
        setScrapingTestResult({
          success: true,
          message: '✅ Credenziali valide! Login effettuato con successo.',
          details: result.data
        });
        showSuccessModal('✅ Credenziali Valide', 'Le credenziali sono corrette e il login è stato effettuato con successo!');
      } else {
        setScrapingTestResult({
          success: false,
          message: '❌ Credenziali non valide o errore di login.',
          details: result.error
        });
        showErrorModal('❌ Credenziali Non Valide', result.error || 'Errore durante il test delle credenziali.');
      }
    } catch (error) {
      console.error('Errore test credenziali Puppeteer:', error);
      setScrapingTestResult({
        success: false,
        message: '❌ Errore durante il test delle credenziali.',
        details: error.message
      });
      showErrorModal('❌ Errore', 'Errore durante il test delle credenziali.');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapingPlaywright = async () => {
    if (!selectedLega || !leagueUrl || !credentials.username || !credentials.password) {
      showErrorModal('Dati Mancanti', 'Seleziona una lega, inserisci l\'URL e le credenziali.');
      return;
    }

    setLoading(true);
    setShowProgressModal(true);
    setProgress(0);
    setProgressMessage('Inizializzazione scraping...');

    try {
      console.log('Avvio scraping con Playwright...');
      console.log('Lega:', selectedLega);
      console.log('URL:', leagueUrl);
      console.log('Tornei selezionati:', selectedTournaments);

      // Se ci sono tornei selezionati, fai scraping per tutti
      if (selectedTournaments.length > 0) {
        setProgressMessage(`Scraping di ${selectedTournaments.length} tornei...`);
        
        // Se ci sono più tornei, usa il metodo batch
        if (selectedTournaments.length > 1) {
          console.log('Usando metodo batch per più tornei...');
          
          setProgress(10);
          setProgressMessage('Inizializzazione scraping batch...');
          
          // Simula progresso durante l'operazione
          const progressInterval = setInterval(() => {
            setProgress(prev => {
              if (prev < 90) {
                return Math.floor(prev + Math.random() * 3 + 1); // Incremento intero tra 1-4%
              }
              return prev;
            });
          }, 2000); // Aggiorna ogni 2 secondi
          
          const response = await scrapingPlaywrightBatch(
            selectedLega,
            leagueUrl,
            scrapingUrls,
            credentials.username,
            credentials.password,
            selectedTournaments,
            token
          );
          
          clearInterval(progressInterval);
          setResults(response);
          setProgress(100);
          setProgressMessage('Scraping batch completato!');
          
          if (response.success) {
            showSuccessModal('Scraping Batch Completato', response.message);
            // Ricarica i dati di scraping
            await loadDatiScraping();
            await loadConfrontoDati();
          } else {
            showErrorModal('Errore Scraping Batch', response.error || 'Errore durante lo scraping batch');
          }
          
        } else {
          // Singolo torneo - usa il metodo originale
          const tournamentId = selectedTournaments[0];
          const tournament = availableTournaments.find(t => t.id === tournamentId);
          
          setProgress(15);
          setProgressMessage(`Scraping torneo: ${tournament?.name || tournamentId}...`);
          
          // Simula progresso durante l'operazione
          const progressInterval = setInterval(() => {
            setProgress(prev => {
              if (prev < 85) {
                return Math.floor(prev + Math.random() * 4 + 2); // Incremento intero tra 2-6%
              }
              return prev;
            });
          }, 1500); // Aggiorna ogni 1.5 secondi
          
          const response = await scrapingPlaywright(
            selectedLega,
            leagueUrl,
            scrapingUrls,
            credentials.username,
            credentials.password,
            token,
            tournamentId
          );

          clearInterval(progressInterval);
          setResults(response);
          setProgress(100);
          setProgressMessage('Scraping completato!');

          if (response.success) {
            showSuccessModal('Scraping Completato', response.message);
            // Ricarica i dati di scraping
            await loadDatiScraping();
            await loadConfrontoDati();
          } else {
            showErrorModal('Errore Scraping', response.error || 'Errore durante lo scraping');
          }
        }

      } else {
        // Scraping senza torneo specifico (comportamento originale)
        setProgress(20);
        setProgressMessage('Scraping senza selezione torneo...');
        
        // Simula progresso durante l'operazione
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 80) {
              return Math.floor(prev + Math.random() * 3 + 1); // Incremento intero tra 1-4%
            }
            return prev;
          });
        }, 1800); // Aggiorna ogni 1.8 secondi
        
        const response = await scrapingPlaywright(
          selectedLega,
          leagueUrl,
          scrapingUrls,
          credentials.username,
          credentials.password,
          token,
          null
        );

        clearInterval(progressInterval);
        setResults(response);
        setProgress(100);
        setProgressMessage('Scraping completato!');

        if (response.success) {
          showSuccessModal('Scraping Completato', response.message);
          // Ricarica i dati di scraping
          await loadDatiScraping();
          await loadConfrontoDati();
        } else {
          showErrorModal('Errore Scraping', response.error || 'Errore durante lo scraping');
        }
      }

    } catch (error) {
      console.error('Errore scraping:', error);
      setResults({
        success: false,
        error: error.message,
        message: 'Errore durante lo scraping'
      });
      showErrorModal('Errore Scraping', error.message);
    } finally {
      setLoading(false);
      setShowProgressModal(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  // Nuovo metodo per recuperare i tornei disponibili
  const handleGetTournaments = async () => {
    if (!selectedLega || !leagueUrl || !credentials.username || !credentials.password) {
      showErrorModal('Dati Mancanti', 'Inserisci tutti i dati richiesti per recuperare i tornei.');
      return;
    }

    setLoading(true);
    setShowProgressModal(true);
    setProgress(0);
    setProgressMessage('Recupero tornei disponibili...');

    // Simula progresso durante l'operazione
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 85) {
          return Math.floor(prev + Math.random() * 4 + 2); // Incremento intero tra 2-6%
        }
        return prev;
      });
    }, 1500); // Aggiorna ogni 1.5 secondi

    try {
      console.log('Recupero tornei disponibili...');
      
      const response = await getAvailableTournaments(
        selectedLega,
        leagueUrl,
        credentials.username,
        credentials.password,
        token
      );

      clearInterval(progressInterval);

      if (response.success) {
        setProgress(100);
        setProgressMessage('Tornei recuperati con successo!');
        setAvailableTournaments(response.tournaments || []);
        console.log('Tornei recuperati:', response.tournaments);
      } else {
        showErrorModal('Errore', response.message || 'Impossibile recuperare i tornei');
        console.log('Errore recupero tornei:', response.message);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Errore recupero tornei:', error);
      showErrorModal('Errore', error.message || 'Errore di connessione');
    } finally {
      setLoading(false);
      setShowProgressModal(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleTestUrlsPuppeteer = async () => {
    if (!leagueUrl || !credentials.username || !credentials.password) {
      showErrorModal('Configurazione Mancante', 'Inserisci URL base e credenziali per testare gli URL.');
      return;
    }

    setLoading(true);
    try {
      const result = await testScrapingUrlsPuppeteer(
        leagueUrl, 
        scrapingUrls, // Passa tutti gli URL di scraping
        credentials.username, 
        credentials.password, 
        token
      );
      
      if (result.success) {
        setResults(prev => ({
          ...prev,
          testUrls: {
            success: true,
            message: '✅ Test URL completato con successo!',
            data: result.data
          }
        }));
        showSuccessModal('✅ Test URL Completato', 'Gli URL sono accessibili e funzionanti!');
      } else {
        setResults(prev => ({
          ...prev,
          testUrls: {
            success: false,
            message: '❌ Errore durante il test degli URL.',
            error: result.error
          }
        }));
        showErrorModal('❌ Errore Test URL', result.error || 'Errore durante il test degli URL.');
      }
    } catch (error) {
      console.error('Errore test URL Puppeteer:', error);
      setResults(prev => ({
        ...prev,
        testUrls: {
          success: false,
          message: '❌ Errore durante il test degli URL.',
          error: error.message
        }
      }));
      showErrorModal('❌ Errore', 'Errore durante il test degli URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!selectedLega || !credentials.username || !credentials.password) {
      showErrorModal('Dati Mancanti', 'Seleziona una lega e inserisci username e password.');
      return;
    }

    setLoading(true);
    try {
      const result = await updateCredentials(selectedLega, credentials.username, credentials.password, token);
      if (result.success) {
        showSuccessModal('✅ Credenziali Aggiornate', 'Le credenziali sono state salvate nel database!');
        // Ricarica i dati della lega
        // await loadLeghe(); // Commentato perché loadLeghe non è definita
      } else {
        showErrorModal('❌ Errore', result.error || 'Errore durante l\'aggiornamento delle credenziali.');
      }
    } catch (error) {
      console.error('Errore aggiornamento credenziali:', error);
      showErrorModal('❌ Errore', 'Errore durante l\'aggiornamento delle credenziali.');
    } finally {
      setLoading(false);
    }
  };

  const handleDebugPageStructure = async () => {
    if (!leagueUrl) {
      showErrorModal('URL Mancante', 'Inserisci l\'URL base della lega per analizzare la struttura.');
      return;
    }

    setLoading(true);
    try {
      const result = await debugPageStructure(
        scrapingUrls.rose || leagueUrl,
        credentials.username,
        credentials.password,
        token
      );
      
      if (result.success) {
        setResults(prev => ({
          ...prev,
          debugStructure: {
            success: true,
            message: '✅ Struttura pagina analizzata con successo!',
            data: result.data
          }
        }));
        showSuccessModal('✅ Debug Completato', 'La struttura della pagina è stata analizzata. Controlla i log del backend per i dettagli.');
      } else {
        setResults(prev => ({
          ...prev,
          debugStructure: {
            success: false,
            message: '❌ Errore durante l\'analisi della struttura.',
            error: result.error
          }
        }));
        showErrorModal('❌ Errore Debug', result.error || 'Errore durante l\'analisi della struttura.');
      }
    } catch (error) {
      console.error('Errore debug struttura pagina:', error);
      setResults(prev => ({
        ...prev,
        debugStructure: {
          success: false,
          message: '❌ Errore durante l\'analisi della struttura.',
          error: error.message
        }
      }));
      showErrorModal('❌ Errore', 'Errore durante l\'analisi della struttura.');
    } finally {
      setLoading(false);
    }
  };

  const loadDatiScraping = async () => {
    if (!selectedLega) return;
    
    console.log('Debug: Caricamento dati scraping per lega:', legaId);
    console.log('Debug: Token disponibile:', !!token);
    
    try {
      const response = await getDatiScraping(selectedLega, token);
      if (response.success) {
        setDatiScraping(response.dati_scraping);
      }
    } catch (error) {
      console.error('❌ Errore caricamento dati scraping:', error);
      console.error('❌ Dettagli errore:', error.response?.data || error.message);
    }
  };

  const loadConfrontoDati = async () => {
    if (!selectedLega || !token) return;
    
    try {
      console.log('Debug: Caricamento confronto dati per lega:', legaId);
      console.log('Debug: Token disponibile:', !!token);
      
      const response = await getConfrontoDati(selectedLega, token);
      setConfrontoDati(response);
    } catch (error) {
      console.error('Errore caricamento confronto dati:', error);
      console.error('Dettagli errore:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    if (selectedLega) {
      loadDatiScraping();
      loadConfrontoDati();
    }
  }, [selectedLega]);

  // Funzioni di ordinamento
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortGiocatori = (giocatori) => {
    if (!giocatori || giocatori.length === 0) return giocatori;
    
    return [...giocatori].sort((a, b) => {
      // Se non è specificato un campo di ordinamento, ordina per ruolo
      if (!sortField || sortField === 'default') {
        // Ordine ufficiale Euroleghe Mantra
        const ruoliMantra = { 
          'P': 12, 'Dc': 11, 'Dd': 10, 'Ds': 9, 'E': 8, 'M': 7, 'C': 6, 'W': 5, 'T': 4, 'A': 3, 'Pc': 2, 'Sp': 1 
        };
        
        // Ordine Serie A Classic
        const ruoliClassic = { 'P': 4, 'D': 3, 'C': 2, 'A': 1 };
        
        // Determina se è una lega Mantra o Classic basandosi sui ruoli presenti
        const hasMantraRoles = giocatori.some(g => 
          g.ruolo && (g.ruolo.includes('Dc') || g.ruolo.includes('Dd') || g.ruolo.includes('Ds') || 
                     g.ruolo.includes('E') || g.ruolo.includes('M') || g.ruolo.includes('W') || 
                     g.ruolo.includes('T') || g.ruolo.includes('Pc') || g.ruolo.includes('Sp'))
        );
        
        const ruoli = hasMantraRoles ? ruoliMantra : ruoliClassic;
        
        // Per ruoli multipli, usa il primo ruolo per l'ordinamento
        const ruoloA = a.ruolo ? a.ruolo.split('/')[0].trim() : '';
        const ruoloB = b.ruolo ? b.ruolo.split('/')[0].trim() : '';
        
        const valoreA = ruoli[ruoloA] || 0;
        const valoreB = ruoli[ruoloB] || 0;
        
        return valoreB - valoreA; // Decrescente (P prima, A dopo)
      }
      
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Gestisci valori numerici
      if (sortField === 'quotazione' || sortField === 'fv_mp' || sortField === 'qi') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        // Gestisci stringhe
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className={`results ${results.success ? 'success' : 'error'}`}>
        <h3>{results.type === 'credentials' ? 'Test Credenziali' : 
             results.type === 'url' ? 'Test URL' : 
             results.type === 'scraping' ? 'Scraping Completato' : 'Aggiornamento Credenziali'}</h3>
        <p>{results.message}</p>
        {results.details && <pre>{JSON.stringify(results.details, null, 2)}</pre>}
      </div>
    );
  };

  const renderDatiScraping = () => {
    if (!datiScraping) return <p>Nessun dato di scraping disponibile per questa lega</p>;

    const toggleSection = (sectionName) => {
      setExpandedSections(prev => ({
        ...prev,
        [sectionName]: !prev[sectionName]
      }));
    };

    const toggleSquadra = (squadraId) => {
      setExpandedSquadre(prev => ({
        ...prev,
        [squadraId]: !prev[squadraId]
      }));
    };

    return (
      <div className="dati-scraping-container">
        <div className="dati-scraping-header">
          <h3>Dati di Scraping - {datiScraping.lega_nome}</h3>
          <button 
            className="refresh-button"
            onClick={async () => {
              console.log('🔄 Refresh manuale dati scraping...');
              await loadDatiScraping();
              await loadConfrontoDati();
              console.log('✅ Dati aggiornati manualmente');
            }}
            disabled={loading}
          >
            🔄 Aggiorna Dati
          </button>
        </div>
        <p className="info-text">
          Dati estratti tramite scraping automatico. Questi dati sono separati dai dati ufficiali della lega.
        </p>

        {/* Sezione Rose */}
        {datiScraping.rose && datiScraping.rose.length > 0 && (
          <div className="data-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('rose')}
            >
              <h4>📋 Rose ({datiScraping.rose.length} squadre)</h4>
              <span className="toggle-icon">
                {expandedSections.rose ? '▼' : '▶'}
              </span>
            </div>
            
            {expandedSections.rose && (
              <div className="section-content">
                <div className="sorting-controls">
                  <label>Ordina per:</label>
                  <select 
                    className="sort-select"
                    value={sortField || 'default'}
                    onChange={(e) => handleSort(e.target.value)}
                  >
                    <option value="default">Predefinito (Ruolo)</option>
                    <option value="nome">Nome</option>
                    <option value="ruolo">Ruolo</option>
                    <option value="squadra_reale">Squadra Reale</option>
                    <option value="qi">QI</option>
                    <option value="quotazione">QA</option>
                    <option value="fv_mp">FVMp</option>
                  </select>
                  <button 
                    className={`sort-button ${sortDirection === 'asc' ? 'active' : ''}`}
                    onClick={() => setSortDirection('asc')}
                  >
                    Crescente
                  </button>
                  <button 
                    className={`sort-button ${sortDirection === 'desc' ? 'active' : ''}`}
                    onClick={() => setSortDirection('desc')}
                  >
                    Decrescente
                  </button>
                </div>
                
                {datiScraping.rose.map((squadra, index) => (
                  <div key={index} className="squadra-card">
                    <div 
                      className="squadra-header"
                      onClick={() => toggleSquadra(`rose-${index}`)}
                    >
                      <h5>{squadra.nome}</h5>
                      <span className="giocatori-count">
                        {squadra.giocatori?.length || 0} giocatori
                      </span>
                      <span className="toggle-icon">
                        {expandedSquadre[`rose-${index}`] ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    {expandedSquadre[`rose-${index}`] && squadra.giocatori && (
                      <div className="giocatori-list">
                        <table className="giocatori-table">
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>Ruolo</th>
                              <th>Squadra Reale</th>
                              <th>QI</th>
                              <th>QA</th>
                              <th>FVMp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortGiocatori(squadra.giocatori).map((giocatore, gIndex) => (
                              <tr key={gIndex}>
                                <td>{giocatore.nome}</td>
                                <td>
                                  <PlayerRole>
                                    {splitRoles(giocatore.ruolo).map((ruolo, index) => (
                                      <span key={index} className={`ruolo-badge ${getRoleClass(ruolo)}`}>{ruolo}</span>
                                    ))}
                                  </PlayerRole>
                                </td>
                                <td>{giocatore.squadra_reale}</td>
                                <td>{giocatore.qi || '-'}</td>
                                <td>{giocatore.quotazione || '-'}</td>
                                <td>{giocatore.fv_mp || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sezione Classifica */}
        {datiScraping.classifica && datiScraping.classifica.length > 0 && (
          <div className="data-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('classifica')}
            >
              <h4>Classifica ({datiScraping.classifica.length} posizioni)</h4>
              <span className="toggle-icon">
                {expandedSections.classifica ? '▼' : '▶'}
              </span>
            </div>
            
            {expandedSections.classifica && (
              <div className="section-content">
                <table className="classifica-table">
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Squadra</th>
                      <th>Punti</th>
                      <th>Partite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datiScraping.classifica.map((posizione, index) => (
                      <tr key={index}>
                        <td className="posizione">{posizione.posizione}</td>
                        <td className="squadra">{posizione.squadra}</td>
                        <td className="punti">{posizione.punti}</td>
                        <td className="partite">{posizione.partite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sezione Formazioni */}
        {datiScraping.formazioni && datiScraping.formazioni.length > 0 && (
          <div className="data-section">
            <div 
              className="section-header" 
              onClick={() => toggleSection('formazioni')}
            >
              <h4>Formazioni ({datiScraping.formazioni.length} formazioni)</h4>
              <span className="toggle-icon">
                {expandedSections.formazioni ? '▼' : '▶'}
              </span>
            </div>
            
            {expandedSections.formazioni && (
              <div className="section-content">
                {datiScraping.formazioni.map((formazione, index) => (
                  <div key={index} className="formazione-card">
                    <div 
                      className="formazione-header"
                      onClick={() => toggleSquadra(`formazione-${index}`)}
                    >
                      <h5>{formazione.squadra}</h5>
                      <span className="modulo">Modulo: {formazione.modulo}</span>
                      <span className="toggle-icon">
                        {expandedSquadre[`formazione-${index}`] ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    {expandedSquadre[`formazione-${index}`] && (
                      <div className="formazione-details">
                        <div className="titolari-section">
                          <h6>👥 Titolari ({formazione.titolari.length})</h6>
                          <div className="giocatori-grid">
                            {formazione.titolari.map((giocatore, gIndex) => (
                              <span key={gIndex} className="giocatore-chip">
                                {giocatore}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="panchinari-section">
                          <h6>🪑 Panchinari ({formazione.panchinari.length})</h6>
                          <div className="giocatori-grid">
                            {formazione.panchinari.map((giocatore, gIndex) => (
                              <span key={gIndex} className="giocatore-chip panchinaro">
                                {giocatore}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messaggio se non ci sono dati */}
        {(!datiScraping.rose || datiScraping.rose.length === 0) &&
         (!datiScraping.classifica || datiScraping.classifica.length === 0) &&
         (!datiScraping.formazioni || datiScraping.formazioni.length === 0) && (
          <div className="no-data-message">
            <p>📭 Nessun dato di scraping disponibile per questa lega</p>
            <p>Esegui lo scraping per iniziare a raccogliere dati</p>
          </div>
        )}
      </div>
    );
  };

  const renderConfrontoDati = () => {
    if (!confrontoDati) return <p>Nessun dato di confronto disponibile</p>;

    return (
      <div className="confronto-dati">
        <h3>Confronto: Dati Ufficiali vs Dati Scraping</h3>
        
        <div className="confronto-stats">
          <div className="stat-card">
            <h4>Dati Ufficiali (Excel)</h4>
            <p>Squadre: {confrontoDati.confronto.squadre_ufficiali}</p>
            <p>Giocatori: {confrontoDati.confronto.giocatori_ufficiali}</p>
          </div>
          
          <div className="stat-card">
            <h4>Dati Scraping</h4>
            <p>Squadre: {confrontoDati.confronto.squadre_scraping}</p>
            <p>Giocatori: {confrontoDati.confronto.giocatori_scraping}</p>
          </div>
          
          <div className="stat-card">
            <h4>Corrispondenze</h4>
            <p>Squadre comuni: {confrontoDati.confronto.squadre_comuni}</p>
            <p>Giocatori comuni: {confrontoDati.confronto.giocatori_comuni}</p>
          </div>
        </div>

        <div className="differenze">
          <h4>Differenze Principali:</h4>
          <ul>
            <li><strong>Dati Ufficiali:</strong> Caricati tramite file Excel durante la creazione della lega</li>
            <li><strong>Dati Scraping:</strong> Ottenuti tramite scraping automatico, salvati separatamente</li>
            <li><strong>Separazione:</strong> I due set di dati non si sovrascrivono mai</li>
            <li><strong>Scopo:</strong> I dati di scraping sono utilizzati per altri scopi (aggiornamenti, confronti, ecc.)</li>
          </ul>
        </div>
      </div>
    );
  };

  // Popup di progresso
  const ProgressModal = () => {
    if (!showProgressModal) return null;

    // Determina il tipo di operazione basato sul messaggio
    const isScraping = progressMessage.toLowerCase().includes('scraping');
    const isTournamentRecovery = progressMessage.toLowerCase().includes('tornei') || progressMessage.toLowerCase().includes('recupero');

    return (
      <div className="progress-modal-overlay">
        <div className="progress-modal">
          <h3>
            {isScraping ? '🕷️ Scraping in corso...' : 
             isTournamentRecovery ? '🔍 Recupero tornei...' : 
             '⏳ Operazione in corso...'}
          </h3>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{progressMessage}</p>
          <p className="progress-percentage">{progress}%</p>
          <div className="progress-info">
            <small>
              {isScraping ? '⏱️ Tempo stimato: 30-60 secondi' : 
               isTournamentRecovery ? '⏱️ Tempo stimato: 10-20 secondi' : 
               '⏱️ Operazione in corso...'}
            </small>
            <br />
            <small>🔄 Non chiudere questa finestra durante l'operazione</small>
          </div>
        </div>
      </div>
    );
  };

  const toggleTournament = (id) => {
    if (selectedTournaments.includes(id)) {
      setSelectedTournaments(selectedTournaments.filter((i) => i !== id));
    } else {
      setSelectedTournaments([...selectedTournaments, id]);
    }
  };

  const selectAllTournaments = () => {
    setSelectedTournaments(availableTournaments.map((t) => t.id));
  };

  const clearTournamentSelection = () => {
    setSelectedTournaments([]);
  };

  return (
    <Container>
      <Header>
        <Title>🕷️ Gestione Scraping</Title>
        <Subtitle>Importa dati da siti esterni come leghe.fantacalcio.it</Subtitle>
        <Button 
          onClick={() => navigate('/area-admin')}
          style={{ marginTop: '1rem', background: '#6c757d' }}
        >
          ← Torna all'Area Admin
        </Button>
      </Header>

      <div className="tabs">
        <button 
          className={activeTab === 'scraping' ? 'active' : ''} 
          onClick={() => setActiveTab('scraping')}
        >
          Scraping
        </button>
        <button 
          className={activeTab === 'dati-scraping' ? 'active' : ''} 
          onClick={() => setActiveTab('dati-scraping')}
        >
          Dati Scraping
        </button>
        <button 
          className={activeTab === 'confronto' ? 'active' : ''} 
          onClick={() => setActiveTab('confronto')}
        >
          Confronto Dati
        </button>
      </div>

      {activeTab === 'scraping' && (
        <div className="scraping-section">
          <div className="form-section">
            <h3>Configurazione Scraping</h3>
            
            <div className="form-group">
              <label>Seleziona Lega:</label>
              <select 
                value={selectedLega} 
                onChange={(e) => setSelectedLega(e.target.value)}
              >
                <option value="">Seleziona una lega</option>
                {leghe.map(lega => (
                  <option key={lega.id} value={lega.id}>
                    {lega.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>URL Base Lega Fantacalcio:</label>
              <input
                type="text"
                value={leagueUrl}
                onChange={(e) => handleUrlChange('base', e.target.value)}
                placeholder="https://leghe.fantacalcio.it/fantaleague-11"
              />
              <small>Inserisci l'URL base della lega. Gli altri URL verranno generati automaticamente.</small>
            </div>

            <div className="form-group">
              <label>URL Rose:</label>
              <input
                type="text"
                value={scrapingUrls.rose}
                onChange={(e) => handleUrlChange('rose', e.target.value)}
                placeholder="https://leghe.fantacalcio.it/fantaleague-11/rose"
              />
            </div>

            <div className="form-group">
              <label>URL Classifica:</label>
              <input
                type="text"
                value={scrapingUrls.classifica}
                onChange={(e) => handleUrlChange('classifica', e.target.value)}
                placeholder="https://leghe.fantacalcio.it/fantaleague-11/classifica"
              />
            </div>

            <div className="form-group">
              <label>URL Formazioni:</label>
              <input
                type="text"
                value={scrapingUrls.formazioni}
                onChange={(e) => handleUrlChange('formazioni', e.target.value)}
                placeholder="https://leghe.fantacalcio.it/fantaleague-11/formazioni"
              />
            </div>

            <div className="form-group">
              <label>Giornata Formazioni (opzionale):</label>
              <input
                type="number"
                value={formazioniGiornata}
                onChange={(e) => setFormazioniGiornata(e.target.value)}
                placeholder="1"
                min="1"
                max="38"
              />
              <small>Inserisci il numero della giornata per le formazioni. Se lasciato vuoto, verrà usata la giornata corrente.</small>
            </div>

            <div className="form-group">
              <label>Username Fantacalcio:</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => handleCredentialsChange('username', e.target.value)}
                placeholder="Inserisci username"
              />
            </div>

            <div className="form-group">
              <label>Password Fantacalcio:</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => handleCredentialsChange('password', e.target.value)}
                placeholder="Inserisci password"
              />
            </div>

            {/* Pulsante per pulire le credenziali salvate */}
            {(credentials.username || credentials.password) && (
              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleClearSavedCredentials}
                  style={{ fontSize: '0.9em', padding: '8px 16px' }}
                >
                  🗑️ Rimuovi Credenziali Salvate
                </button>
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                  Rimuove le credenziali salvate dal browser. Dovrai reinserirle alla prossima sessione.
                </small>
              </div>
            )}

            {/* Sezione Tornei */}
            <div className="form-group">
              <label>Gestione Tornei:</label>
              <div className="tournament-controls">
                <button 
                  type="button"
                  className="btn btn-warning"
                  onClick={handleGetTournaments}
                  disabled={loading}
                  style={{ 
                    backgroundColor: '#ebb13d', 
                    borderColor: '#ebb13d', 
                    color: 'white',
                    fontWeight: '600',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    minWidth: '150px'
                  }}
                >
                  {loading ? 'Recuperando...' : 'Recupera Tornei Disponibili'}
                </button>
                
                {availableTournaments.length > 0 && (
                  <div className="tournament-selection">
                    <h4>Tornei Disponibili:</h4>
                    <div className="tournament-buttons">
                      {availableTournaments.map((tournament, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`btn btn-outline-secondary tournament-btn ${selectedTournaments.includes(tournament.id) ? 'active' : ''}`}
                          onClick={() => toggleTournament(tournament.id)}
                        >
                          {tournament.name} (ID: {tournament.id})
                        </button>
                      ))}
                    </div>
                    <div className="tournament-actions">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => selectAllTournaments()}
                      >
                        Seleziona Tutti
                      </button>
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => clearTournamentSelection()}
                      >
                        Deseleziona Tutti
                      </button>
                    </div>
                    <div className="selected-tournaments">
                      <strong>Tornei selezionati:</strong> {selectedTournaments.length > 0 ? selectedTournaments.join(', ') : 'Nessuno'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="actions">
              <button onClick={handleTestCredentialsPuppeteer} disabled={loading}>
                {loading ? 'Testando...' : 'Test Credenziali'}
              </button>
              <button onClick={handleTestUrlsPuppeteer} disabled={loading}>
                {loading ? 'Testando...' : 'Test URL'}
              </button>
              <button onClick={handleDebugPageStructure} disabled={loading}>
                {loading ? 'Analizzando...' : 'Debug Struttura'}
              </button>
              <button onClick={handleUpdateCredentials} disabled={loading}>
                {loading ? 'Aggiornando...' : 'Aggiorna Credenziali'}
              </button>
              <button onClick={handleScrapingPlaywright} disabled={loading} className="primary">
                {loading ? 'Scraping...' : 'Avvia Scraping'}
              </button>
            </div>
          </div>

          {renderResults()}
        </div>
      )}

      {activeTab === 'dati-scraping' && (
        <div className="dati-scraping-section">
          <div className="form-group">
            <label>Seleziona Lega per visualizzare i dati di scraping:</label>
            <select 
              value={selectedLega} 
              onChange={(e) => setSelectedLega(e.target.value)}
            >
              <option value="">Seleziona una lega</option>
              {leghe.map(lega => (
                <option key={lega.id} value={lega.id}>
                  {lega.nome}
                </option>
              ))}
            </select>
          </div>
          
          {renderDatiScraping()}
        </div>
      )}

      {activeTab === 'confronto' && (
        <div className="confronto-section">
          <div className="form-group">
            <label>Seleziona Lega per confrontare i dati:</label>
            <select 
              value={selectedLega} 
              onChange={(e) => setSelectedLega(e.target.value)}
            >
              <option value="">Seleziona una lega</option>
              {leghe.map(lega => (
                <option key={lega.id} value={lega.id}>
                  {lega.nome}
                </option>
              ))}
            </select>
          </div>
          
          {renderConfrontoDati()}
        </div>
      )}

      <ProgressModal />
    </Container>
  );
};

// Stili CSS per i componenti
const styles = `
  .tournament-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 15px 0;
  }
  
  .tournament-btn {
    min-width: 120px;
    text-align: center;
    font-size: 0.9em;
    padding: 8px 12px;
  }
  
  .tournament-btn.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }
  
  .tournament-actions {
    display: flex;
    gap: 10px;
    margin: 15px 0;
  }
  
  .selected-tournaments {
    margin-top: 15px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 5px;
    border: 1px solid #dee2e6;
  }
`;

// Inserisci gli stili nel DOM
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default ScrapingManager; 