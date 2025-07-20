import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { useParams, useNavigate } from 'react-router-dom';
import { getLegheAdmin } from '../api/leghe';

const Container = styled.div`
  max-width: 800px;
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

const TestResult = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  background: ${props => props.$success ? '#d4edda' : '#f8d7da'};
  border: 1px solid ${props => props.$success ? '#c3e6cb' : '#f5c6cb'};
  color: ${props => props.$success ? '#155724' : '#721c24'};
`;

const GestioneCredenziali = () => {
  const { token } = useAuth();
  const { showErrorModal, showSuccessModal } = useNotification();
  const { legaId } = useParams();
  const navigate = useNavigate();
  const [legaData, setLegaData] = useState(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Carica i dati della lega
  useEffect(() => {
    const loadLega = async () => {
      try {
        const response = await getLegheAdmin(token);
        const leghe = response?.data?.leghe || response?.leghe || [];
        const lega = leghe?.find(l => l?.id?.toString() === legaId);
        
        if (lega) {
          setLegaData(lega);
          setCredentials({
            username: lega?.fantacalcio_username || '',
            password: lega?.fantacalcio_password || ''
          });
        } else {
          showErrorModal('Lega Non Trovata', 'La lega richiesta non è stata trovata.');
          navigate('/scraping-manager');
        }
      } catch (error) {
        console.error('Errore caricamento lega:', error);
        showErrorModal('Errore di Caricamento', 'Impossibile caricare i dati della lega.');
      }
    };

    if (legaId) {
      loadLega();
    }
  }, [legaId, token, showErrorModal, navigate]);

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials?.password || '') {
      showErrorModal('Campi Mancanti', 'Inserisci sia username che password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/leghe/${legaId}/scraping-credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fantacalcio_username: credentials.username,
          fantacalcio_password: credentials?.password || ''
        })
      });

      const result = await response.json();

      if (result.success) {
        showSuccessModal(
          '✅ Credenziali Aggiornate',
          'Le credenziali sono state aggiornate con successo! Ora puoi testarle.'
        );
        
        // Ricarica i dati della lega
        const legheResponse = await getLegheAdmin(token);
        const leghe = legheResponse?.data?.leghe || legheResponse?.leghe || [];
        const updatedLega = leghe?.find(l => l?.id?.toString() === legaId);
        if (updatedLega) {
          setLegaData(updatedLega);
        }
        
        setTestResult(null); // Reset test result
      } else {
        showErrorModal(
          '❌ Errore Aggiornamento',
          result.error || 'Errore durante l\'aggiornamento delle credenziali'
        );
      }
    } catch (error) {
      showErrorModal(
        '❌ Errore di Connessione',
        `Errore: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestCredentials = async () => {
    if (!legaData || !legaData.fantacalcio_url) {
      showErrorModal('Configurazione Mancante', 'Questa lega non ha configurato l\'URL di scraping.');
      return;
    }

    setLoading(true);
    setTestResult(null);
    
    try {
      // Ricarica i dati freschi dal database
      const legheResponse = await getLegheAdmin(token);
      const leghe = legheResponse?.data?.leghe || legheResponse?.leghe || [];
      const freshLegaData = leghe?.find(l => l?.id?.toString() === legaId);
      
      if (!freshLegaData) {
        throw new Error('Impossibile caricare i dati aggiornati della lega');
      }

      const requestBody = {
        leagueUrl: freshLegaData.fantacalcio_url,
        username: freshLegaData.fantacalcio_username,
        password: freshLegaData.fantacalcio_password,
        lega_id: legaId
      };

      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/scraping/puppeteer/league`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        let message = `✅ Credenziali valide! Connessione riuscita. Trovate ${result.data?.summary?.squadre_trovate || 0} squadre con ${result.data?.summary?.giocatori_totali || 0} giocatori totali.`;
        
        // Aggiungi informazioni sul salvataggio nel database se disponibili
        if (result.data?.database) {
          message += `\n\n💾 Salvataggio nel database:\n• ${result.data.database.squadre_salvate} squadre salvate\n• ${result.data.database.giocatori_salvati} giocatori salvati`;
        }
        
        setTestResult({
          success: true,
          message: message
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Test fallito: ${result.error || 'Errore sconosciuto'}`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Errore di connessione: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!legaData) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <LoadingSpinner />
          <p>Caricamento...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🔐 Gestione Credenziali Scraping</Title>
        <Subtitle>Configura le credenziali per {legaData?.nome || 'Nome'}</Subtitle>
        <Button 
          onClick={() => navigate('/scraping-manager')}
          style={{ marginTop: '1rem', background: '#6c757d' }}
        >
          ← Torna alla Gestione Scraping
        </Button>
      </Header>

      <FormCard>
        <FormTitle>⚙️ Credenziali piattaforma esterna</FormTitle>
        <Form onSubmit={handleUpdateCredentials}>
          <FormGroup>
            <Label>Username</Label>
            <Input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Inserisci username piattaforma esterna"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Password</Label>
            <Input
              type="password"
              value={credentials?.password || ''}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Inserisci password piattaforma esterna"
              required
            />
          </FormGroup>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner /> : '💾 Salva Credenziali'}
            </Button>
            
            <Button 
              type="button" 
              onClick={handleTestCredentials}
              disabled={loading || !legaData.fantacalcio_url}
              style={{ background: '#28a745' }}
            >
              {loading ? <LoadingSpinner /> : '🧪 Testa Credenziali'}
            </Button>
          </div>
        </Form>

        {testResult && (
          <TestResult $success={testResult.success}>
            {testResult.message}
          </TestResult>
        )}
      </FormCard>

      <FormCard>
        <FormTitle>ℹ️ Informazioni</FormTitle>
        <div style={{ lineHeight: '1.6' }}>
          <p><strong>URL Lega:</strong> {legaData.fantacalcio_url || 'Non configurato'}</p>
          <p><strong>Username attuale:</strong> {legaData.fantacalcio_username || 'Non configurato'}</p>
          <p><strong>Password:</strong> {legaData.fantacalcio_password ? '***' : 'Non configurata'}</p>
        </div>
      </FormCard>
    </Container>
  );
};

export default GestioneCredenziali; 