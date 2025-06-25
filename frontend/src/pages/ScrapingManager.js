import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { useParams, useNavigate } from 'react-router-dom';
import { getLegheAdmin } from '../api/leghe';
import { 
  testScraping, 
  updateClassificaFromScraping, 
  updateVotiFromScraping, 
  importCalciatoriFromScraping,
  scrapingCompleto,
  testCredentials,
  debugCredentials,
  testScrapingUrls
} from '../api/scraping';

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

const ScrapingManager = () => {
  const { token } = useAuth();
  const { showErrorModal, showSuccessModal, showConfirmModal } = useNotification();
  const { legaId } = useParams();
  const navigate = useNavigate();
  const [selectedLega, setSelectedLega] = useState('');
  const [leghe, setLeghe] = useState([]);
  const [legaData, setLegaData] = useState(null);
  const [urls, setUrls] = useState({
    classifica: '',
    voti: '',
    calciatori: ''
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [scrapingTestResult, setScrapingTestResult] = useState(null);

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
              setUrls(prev => ({
                ...prev,
                classifica: `${lega.fantacalcio_url}/classifica`,
                voti: `${lega.fantacalcio_url}/voti-giornata`,
                calciatori: `${lega.fantacalcio_url}/rose`
              }));
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
    setUrls(prev => ({ ...prev, [field]: value }));
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
    if (!selectedLega || !urls.classifica) {
      showErrorModal('Configurazione Mancante', 'Seleziona una lega e inserisci l\'URL della classifica.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await updateClassificaFromScraping(urls.classifica, selectedLega, token);
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

  const handleUpdateVoti = async () => {
    if (!selectedLega || !urls.voti) {
      showErrorModal('Configurazione Mancante', 'Seleziona una lega e inserisci l\'URL dei voti.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await updateVotiFromScraping(urls.voti, selectedLega, token);
      if (result.success) {
        showSuccessModal('✅ Voti Aggiornati', 'I voti sono stati aggiornati con successo!');
      } else {
        showErrorModal('❌ Errore Aggiornamento', result.error || 'Errore durante l\'aggiornamento dei voti');
      }
      setResults(prev => ({ ...prev, voti: result }));
    } catch (error) {
      showErrorModal('❌ Errore di Connessione', `Errore: ${error.message}`);
      setResults(prev => ({ ...prev, voti: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const handleImportCalciatori = async () => {
    if (!selectedLega || !urls.calciatori) {
      showErrorModal('Configurazione Mancante', 'Seleziona una lega e inserisci l\'URL dei calciatori.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await importCalciatoriFromScraping(urls.calciatori, selectedLega, token);
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
          const result = await scrapingCompleto(selectedLega, urls, token);
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
    if (!legaData?.fantacalcio_url) {
      showErrorModal('URL Mancante', 'Questa lega non ha configurato l\'URL di scraping.');
      return;
    }

    setLoading(true);
    try {
      const result = await testScrapingUrls(legaData.fantacalcio_url, token);
      
      if (result.success) {
        const existingUrls = result.results.filter(r => r.exists);
        const message = `Test completato!\n\n` +
          `URL validi trovati: ${existingUrls.length}\n\n` +
          `URL suggeriti:\n` +
          `Classifica: ${result.suggestedUrls.classifica}\n` +
          `Voti: ${result.suggestedUrls.voti}\n` +
          `Calciatori: ${result.suggestedUrls.calciatori}`;
        
        showSuccessModal('🔗 Test URL Completato', message);
        
        // Aggiorna automaticamente gli URL se sono diversi
        const currentUrls = {
          classifica: urls.classifica,
          voti: urls.voti,
          calciatori: urls.calciatori
        };
        
        if (JSON.stringify(currentUrls) !== JSON.stringify(result.suggestedUrls)) {
          setUrls(result.suggestedUrls);
          showSuccessModal('🔄 URL Aggiornati', 'Gli URL sono stati aggiornati automaticamente con quelli validi trovati.');
        }
      } else {
        showErrorModal('❌ Errore Test URL', result.message || 'Errore durante il test degli URL.');
      }
      setResults(prev => ({ ...prev, urlTest: result }));
    } catch (error) {
      showErrorModal('❌ Errore Test URL', `Errore: ${error.message}`);
      setResults(prev => ({ ...prev, urlTest: { success: false, error: error.message } }));
    }
    setLoading(false);
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

      <FormCard>
        <FormTitle>⚙️ Configurazione</FormTitle>
        <Form>
          <FormGroup>
            <Label>Lega</Label>
            <Select 
              value={selectedLega} 
              onChange={(e) => {
                const lega = leghe.find(l => l.id.toString() === e.target.value);
                setSelectedLega(e.target.value);
                setLegaData(lega);
                if (lega?.fantacalcio_url) {
                  setUrls(prev => ({
                    ...prev,
                    classifica: `${lega.fantacalcio_url}/classifica`,
                    voti: `${lega.fantacalcio_url}/voti-giornata`,
                    calciatori: `${lega.fantacalcio_url}/rose`
                  }));
                }
              }}
            >
              <option value="">Seleziona una lega</option>
              {leghe.map(lega => (
                <option key={lega.id} value={lega.id}>
                  {lega.nome} {lega.fantacalcio_url ? '(Scraping configurato)' : ''}
                </option>
              ))}
            </Select>
            {legaData && !legaData.fantacalcio_url && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.5rem', 
                backgroundColor: '#fff3cd', 
                color: '#856404', 
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                ⚠️ Questa lega non ha ancora configurato lo scraping automatico. 
                <br />
                <a href={`/crea-lega`} style={{ color: '#856404', textDecoration: 'underline' }}>
                  Configura lo scraping nella creazione della lega
                </a>
              </div>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label>URL Classifica</Label>
            <Input
              type="url"
              placeholder="https://leghe.fantacalcio.it/lega/classifica"
              value={urls.classifica}
              onChange={(e) => handleUrlChange('classifica', e.target.value)}
            />
            <Button 
              type="button" 
              onClick={() => handleTestUrl(urls.classifica)}
              disabled={!urls.classifica || loading}
            >
              {loading ? <LoadingSpinner /> : 'Test URL'}
            </Button>
          </FormGroup>
          
          <FormGroup>
            <Label>URL Voti</Label>
            <Input
              type="url"
              placeholder="https://leghe.fantacalcio.it/lega/voti"
              value={urls.voti}
              onChange={(e) => handleUrlChange('voti', e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>URL Calciatori</Label>
            <Input
              type="url"
              placeholder="https://leghe.fantacalcio.it/lega/calciatori"
              value={urls.calciatori}
              onChange={(e) => handleUrlChange('calciatori', e.target.value)}
            />
          </FormGroup>

          {legaData && legaData.fantacalcio_url && (
            <FormGroup>
              <FormTitle style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🔐 Gestione Credenziali Scraping</FormTitle>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>
                  Configura e testa le credenziali per accedere a Fantacalcio.it e permettere lo scraping automatico.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Button 
                    onClick={() => navigate(`/gestione-credenziali/${legaData.id}`)}
                    disabled={loading}
                    style={{ background: '#28a745' }}
                  >
                    ⚙️ Gestione Credenziali
                  </Button>
                  <Button 
                    onClick={handleTestCredentials}
                    disabled={!legaData.fantacalcio_username || !legaData.fantacalcio_password || loading}
                    style={{ background: '#17a2b8' }}
                  >
                    {loading ? <LoadingSpinner /> : '🧪 Test Credenziali'}
                  </Button>
                  <Button 
                    onClick={handleDebugCredentials}
                    disabled={loading}
                    style={{ background: '#6f42c1' }}
                  >
                    {loading ? <LoadingSpinner /> : '🔍 Debug Credenziali'}
                  </Button>
                  <Button 
                    onClick={handleTestUrls}
                    disabled={loading}
                    style={{ background: '#fd7e14' }}
                  >
                    {loading ? <LoadingSpinner /> : '🔗 Test URL'}
                  </Button>
                </div>
              </div>
            </FormGroup>
          )}
        </Form>
      </FormCard>

      <FormCard>
        <FormTitle>🔄 Azioni Scraping</FormTitle>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button 
            onClick={handleUpdateClassifica}
            disabled={!selectedLega || !urls.classifica || loading}
          >
            {loading ? <LoadingSpinner /> : 'Aggiorna Classifica'}
          </Button>
          
          <Button 
            onClick={handleUpdateVoti}
            disabled={!selectedLega || !urls.voti || loading}
          >
            {loading ? <LoadingSpinner /> : 'Aggiorna Voti'}
          </Button>
          
          <Button 
            onClick={handleImportCalciatori}
            disabled={!selectedLega || !urls.calciatori || loading}
          >
            {loading ? <LoadingSpinner /> : 'Importa Calciatori'}
          </Button>
          
          <Button 
            onClick={handleScrapingCompleto}
            disabled={!selectedLega || loading}
          >
            {loading ? <LoadingSpinner /> : 'Scraping Completo'}
          </Button>
        </div>
      </FormCard>

      {/* Risultati */}
      {Object.keys(results).length > 0 && (
        <FormCard>
          <FormTitle>📊 Risultati</FormTitle>
          {Object.entries(results).map(([key, result]) => (
            <ResultCard key={key} $success={result.success}>
              <strong>{key.toUpperCase()}:</strong> {result.success ? result.message : result.error}
            </ResultCard>
          ))}
        </FormCard>
      )}

      {scrapingTestResult && (
        <FormCard>
          <FormTitle>🔐 Test Credenziali</FormTitle>
          <div style={{
            padding: '0.75rem',
            borderRadius: '6px',
            backgroundColor: scrapingTestResult.success ? '#d4edda' : '#f8d7da',
            color: scrapingTestResult.success ? '#155724' : '#721c24',
            border: `1px solid ${scrapingTestResult.success ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {scrapingTestResult.message}
            {scrapingTestResult.success && scrapingTestResult.data && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <strong>Dati trovati:</strong>
                {scrapingTestResult.data.rose && (
                  <div>📊 {scrapingTestResult.data.rose.length} squadre trovate</div>
                )}
                {scrapingTestResult.data.summary && (
                  <div>
                    <div>👥 {scrapingTestResult.data.summary.giocatori_totali} giocatori totali</div>
                    <div>🏆 {scrapingTestResult.data.summary.squadre_trovate} squadre</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </FormCard>
      )}
    </Container>
  );
};

export default ScrapingManager; 