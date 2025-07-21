import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getGiocatoreById, getQAHistory } from '../api/giocatori';
import { getSquadraById } from '../api/squadre';
import { getSquadreByLega } from '../api/leghe';
import { creaOfferta, getLogGiocatore } from '../api/offerte';
import { splitRoles, getRoleClass } from '../utils/roleUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { api } from '../api/config.js';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: #FFA94D;
  }
`;

const Header = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const PlayerTitle = styled.h1`
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PlayerInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const InfoCard = styled.div`
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.5rem;
  text-align: center;
`;

const InfoLabel = styled.div`
  color: #666;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  color: #333;
  font-size: 0.9rem;
  font-weight: 700;
`;

const PlayerRole = styled.span`
  .ruolo-badge {
    display: inline-block;
    padding: 6px 12px;
    margin: 3px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    min-width: 28px;
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
    border: 1px solid rgba(255,255,255,0.2);
    transition: all 0.2s ease;
  }
  
  .ruolo-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.2);
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 0.5rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  text-align: center;
`;

const StatTitle = styled.div`
  font-size: 0.6rem;
  color: #86868b;
  font-weight: 500;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #1d1d1f;
`;

const ContractSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 0.5rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ContractGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
`;

const ContractCard = styled.div`
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.5rem;
  text-align: center;
`;

const ContractLabel = styled.div`
  color: #666;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`;

const ContractValue = styled.div`
  color: #333;
  font-size: 0.8rem;
  font-weight: 600;
`;

const OfferSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const OfferForm = styled.form`
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.5rem;
  margin-top: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 0.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  color: #333;
  font-weight: 600;
  font-size: 0.7rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.7rem;
  background: white;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.7rem;
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.7rem;
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

const ToggleButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.7rem;
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const Message = styled.div`
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  font-weight: 600;
  font-size: 0.7rem;
  background: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
`;

const QAHistorySection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const ChartContainer = styled.div`
  height: 200px;
  margin-top: 0.5rem;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 1rem;
  color: #666;
  font-style: italic;
  font-size: 0.7rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  font-size: 0.8rem;
  color: #dc3545;
`;

const LogSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

// Helper function per i colori delle operazioni
const getOperationColor = (tipo) => {
  switch (tipo) {
    case 'trasferimento':
      return '#28a745';
    case 'prestito':
      return '#ffc107';
    case 'scambio':
      return '#17a2b8';
    case 'rinnovo':
      return '#6f42c1';
    case 'pagamento':
      return '#fd7e14';
    default:
      return '#6c757d';
  }
};

const DettaglioGiocatore = ({ setCurrentLeague, setCurrentTeam }) => {
  const { token, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [giocatore, setGiocatore] = useState(null);
  const [squadra, setSquadra] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qaHistory, setQAHistory] = useState([]);
  const [qaHistoryLoading, setQAHistoryLoading] = useState(false);
  const [showOfferta, setShowOfferta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [offertaMsg, setOffertaMsg] = useState('');
  const [form, setForm] = useState({ 
    squadra_destinatario_id: '', 
    tipo: 'trasferimento', 
    valore: '',
    richiesta_fm: '',
    giocatore_scambio_id: ''
  });
  const [logOperazioni, setLogOperazioni] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [userTeam, setUserTeam] = useState(null);
  const [userTeamPlayers, setUserTeamPlayers] = useState([]);

  useEffect(() => {
    async function fetchGiocatore() {
      setLoading(true);
      setError('');
      try {
        const res = await getGiocatoreById(id, token);
        setGiocatore(res?.giocatore);
        
        // Carica la squadra del giocatore
        if (res?.giocatore?.squadra_id) {
          const squadraRes = await getSquadraById(res?.giocatore?.squadra_id, token);
          setSquadra(squadraRes?.data?.squadra || squadraRes?.squadra);
          
          // Carica tutte le squadre della lega per le offerte
          if (squadraRes?.data?.squadra?.lega_id || squadraRes?.squadra?.lega_id) {
            const legaId = squadraRes?.data?.squadra?.lega_id || squadraRes?.squadra?.lega_id;
            const squadreRes = await getSquadreByLega(legaId, token);
            setSquadre(squadreRes?.data?.squadre || squadreRes?.squadre || []);
          }
        }
      } catch (err) {
        console.error('Errore nel caricamento del giocatore:', err);
        if (err.message === 'Giocatore non trovato') {
          setError('Giocatore non trovato. Il giocatore potrebbe essere stato eliminato o l\'ID non è corretto.');
        } else {
          setError(err.message || 'Errore nel caricamento del giocatore');
        }
      }
      setLoading(false);
    }
    if (token) fetchGiocatore();
  }, [id, token]);

  // useEffect separato per caricare la cronologia QA dopo che giocatore è stato caricato
  useEffect(() => {
    if (giocatore && token) {
      fetchQAHistory();
      fetchLogOperazioni();
      fetchUserTeam();
    }
  }, [giocatore, token]);

  const fetchQAHistory = async () => {
    setQAHistoryLoading(true);
    try {
      const history = await getQAHistory(id, token);
      
      // Crea la cronologia della quotazione
      const quotazioneHistory = [];
      
      // Aggiungi QI come primo punto (se disponibile)
      if (giocatore.qi) {
        quotazioneHistory.push({
          data: 'QI Iniziale',
          qa_value: parseFloat(giocatore.qi),
          tipo: 'QI'
        });
      }
      
      // Aggiungi i dati storici QA, ma solo se sono diversi dal valore precedente
      let lastValue = giocatore.qi ? parseFloat(giocatore.qi) : null;
      
      history.forEach(item => {
        const currentValue = parseFloat(item.qa_value);
        
        // Aggiungi solo se il valore è cambiato rispetto al precedente
        if (lastValue === null || currentValue !== lastValue) {
          quotazioneHistory.push({
            data: new Date(item.data_registrazione).toLocaleDateString('it-IT'),
            qa_value: currentValue,
            tipo: 'QA'
          });
          lastValue = currentValue;
        }
      });
      
      // Aggiungi QA attuale se è diverso dall'ultimo valore storico
      if (giocatore.qa && quotazioneHistory.length > 0) {
        const currentQA = parseFloat(giocatore.qa);
        const lastHistoricalValue = quotazioneHistory[quotazioneHistory.length - 1].qa_value;
        
        if (currentQA !== lastHistoricalValue) {
          quotazioneHistory.push({
            data: 'Oggi',
            qa_value: currentQA,
            tipo: 'QA Attuale'
          });
        }
      }
      
      setQAHistory(quotazioneHistory);
    } catch (err) {
      console.error('Errore nel recupero della cronologia QA:', err);
      setQAHistory([]);
    }
    setQAHistoryLoading(false);
  };

  const fetchLogOperazioni = async () => {
    setLogLoading(true);
    try {
      const log = await getLogGiocatore(id, token);
      setLogOperazioni(log);
    } catch (err) {
      console.error('Errore nel recupero del log operazioni:', err);
      setLogOperazioni([]);
    }
    setLogLoading(false);
  };

  const fetchUserTeam = async () => {
    try {
      // Ottieni la squadra dell'utente nella lega del giocatore
      if (!giocatore?.lega_id) {
        console.warn('🔍 DettaglioGiocatore: giocatore.lega_id undefined, skipping');
        return;
      }
      const userTeamRes = await api.get(`/squadre/my-team/${giocatore.lega_id}`, token);
      if (userTeamRes.ok) {
        const userTeamData = await userTeamRes.json();
        setUserTeam(userTeamData.squadra);
        setUserTeamPlayers(userTeamData.giocatori || []);
      }
    } catch (err) {
      console.error('Errore nel recupero della squadra utente:', err);
    }
  };

  const formatMoney = (value) => {
    if (!value || value === 'N/A') return 'FM 0';
    if (typeof value === 'string') return `FM ${value}`;
    return `FM ${value.toLocaleString()}`;
  };

  async function handleOfferta(e) {
    e.preventDefault();
    setOffertaMsg('');
    setSubmitting(true);
    
    try {
      await creaOfferta({
        giocatore_id: giocatore.id,
        tipo: form.tipo,
        valore_offerta: parseInt(form.valore) || 0,
        richiesta_fm: parseInt(form.richiesta_fm) || 0,
        giocatore_scambio_id: form.giocatore_scambio_id || null
      }, token);
      setOffertaMsg('Offerta inviata con successo!');
      setForm({ 
        squadra_destinatario_id: '', 
        tipo: 'trasferimento', 
        valore: '',
        richiesta_fm: '',
        giocatore_scambio_id: ''
      });
      setShowOfferta(false);
    } catch (err) {
      setOffertaMsg(err.message);
    }
    setSubmitting(false);
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Helper per mostrare solo stringhe/numero
  const safeText = (val) => (typeof val === 'string' || typeof val === 'number') ? val : 'N/A';

  // Gestione loading e errori
  if (loading) {
    return (
      <Container>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          Caricamento giocatore...
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <BackButton onClick={() => navigate(-1)}>
          ← Torna indietro
        </BackButton>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            color: '#e74c3c',
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            ⚠️ Errore
          </div>
          <div style={{ 
            fontSize: '1rem', 
            color: '#666',
            marginBottom: '2rem',
            maxWidth: '500px'
          }}>
            {error}
          </div>
          <button 
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Torna alla Home
          </button>
        </div>
      </Container>
    );
  }

  if (!giocatore) {
    return (
      <Container>
        <BackButton onClick={() => navigate(-1)}>
          ← Torna indietro
        </BackButton>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            color: '#e74c3c',
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            ❌ Giocatore non trovato
          </div>
          <div style={{ 
            fontSize: '1rem', 
            color: '#666',
            marginBottom: '2rem',
            maxWidth: '500px'
          }}>
            Il giocatore con ID {id} non esiste o è stato eliminato.
          </div>
          <button 
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Torna alla Home
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <PlayerTitle>{safeText(giocatore.nome)} {giocatore.cognome ? safeText(giocatore.cognome) : ''}</PlayerTitle>
        
        <PlayerInfo>
          <InfoCard>
            <InfoLabel>Ruolo</InfoLabel>
            <InfoValue>
              <PlayerRole>
                {Array.isArray(splitRoles(giocatore.ruolo)) && splitRoles(giocatore.ruolo).length > 0
                  ? splitRoles(giocatore.ruolo).map((ruolo, index) => (
                      <span key={index} className={`ruolo-badge ${getRoleClass(safeText(ruolo))}`}>{safeText(ruolo)}</span>
                    ))
                  : 'N/A'}
              </PlayerRole>
            </InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Squadra Reale</InfoLabel>
            <InfoValue>
              {safeText(giocatore.squadra_reale) !== 'N/A' && giocatore.squadra_id ? (
                <span
                  style={{ color: '#E67E22', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
                  onClick={() => navigate(`/squadra/${giocatore.squadra_id}`)}
                >
                  {safeText(giocatore.squadra_reale)}
                </span>
              ) : 'N/A'}
            </InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Squadra Fantasy</InfoLabel>
            <InfoValue>{safeText(squadra?.nome)}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Ingaggio</InfoLabel>
            <InfoValue>{safeText(formatMoney(giocatore.costo_attuale))}</InfoValue>
          </InfoCard>

          <InfoCard>
            <InfoLabel>Cantera</InfoLabel>
            <InfoValue>
              {giocatore.cantera ? (
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>✔ Sì</span>
              ) : (
                <span style={{ color: '#6c757d' }}>✗ No</span>
              )}
            </InfoValue>
          </InfoCard>
        </PlayerInfo>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatTitle>Quotazione Attuale</StatTitle>
          <StatValue>{safeText(giocatore.quotazione_attuale)}</StatValue>
        </StatCard>
                <StatCard>
          <StatTitle>Ingaggio</StatTitle>
            <StatValue>{formatMoney(safeText(giocatore.costo_attuale))}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Costo Precedente</StatTitle>
          <StatValue>{formatMoney(safeText(giocatore.costo_precedente))}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>QA</StatTitle>
          <StatValue>{safeText(giocatore.qa)}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>QI</StatTitle>
          <StatValue>{safeText(giocatore.qi)}</StatValue>
        </StatCard>
      </StatsGrid>

      <ContractSection>
        <SectionTitle>📋 Dettagli Contratto</SectionTitle>
        
        <ContractGrid>
          <ContractCard>
            <ContractLabel>Prestito</ContractLabel>
            <ContractValue>{giocatore.prestito ? 'Sì' : 'No'}</ContractValue>
          </ContractCard>
          <ContractCard>
            <ContractLabel>Anni Contratto</ContractLabel>
            <ContractValue>{safeText(giocatore.anni_contratto)}</ContractValue>
          </ContractCard>
          <ContractCard>
            <ContractLabel>Cantera</ContractLabel>
            <ContractValue>{giocatore.cantera ? 'Sì' : 'No'}</ContractValue>
          </ContractCard>
          <ContractCard>
            <ContractLabel>Triggers</ContractLabel>
            <ContractValue>{safeText(giocatore.triggers)}</ContractValue>
          </ContractCard>
        </ContractGrid>
      </ContractSection>

      <QAHistorySection>
        <SectionTitle>📈 Cronologia Quotazione</SectionTitle>
        
        {qaHistoryLoading ? (
          <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>Caricamento cronologia...</div>
        ) : qaHistory.length > 0 ? (
          <div style={{ marginTop: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Data</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Tipo</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Quotazione</th>
                </tr>
              </thead>
              <tbody>
                {qaHistory.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem', textAlign: 'left' }}>{item.data}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        backgroundColor: item.tipo === 'QI' ? '#ffc107' : '#28a745',
                        color: 'white'
                      }}>
                        {item.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{item.qa_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <NoDataMessage>
            Nessun dato storico della quotazione disponibile per questo giocatore.
          </NoDataMessage>
        )}
      </QAHistorySection>

      <OfferSection>
        <SectionTitle>💰 Proponi Offerta</SectionTitle>
        
        {/* Mostra il form solo se il giocatore non è nella squadra dell'utente */}
        {userTeam && giocatore.squadra_id !== userTeam.id ? (
          <>
            <ToggleButton onClick={() => setShowOfferta(v => !v)}>
              {showOfferta ? 'Nascondi Form Offerta' : 'Mostra Form Offerta'}
            </ToggleButton>
            
            {showOfferta && (
              <OfferForm onSubmit={handleOfferta}>
                <FormGroup>
                  <Label>Tipo di Offerta</Label>
                  <Select name="tipo" value={form.tipo} onChange={handleChange}>
                    <option value="trasferimento">Trasferimento</option>
                    <option value="prestito">Prestito</option>
                    <option value="scambio">Scambio</option>
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>Valore Offerta (FM)</Label>
                  <Input 
                    name="valore" 
                    type="number" 
                    value={form.valore} 
                    onChange={handleChange}
                    placeholder="Inserisci il valore dell'offerta"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Richiesta (FM)</Label>
                  <Input 
                    name="richiesta_fm" 
                    type="number" 
                    value={form.richiesta_fm} 
                    onChange={handleChange}
                    placeholder="Inserisci la richiesta (opzionale)"
                  />
                </FormGroup>
                
                {form.tipo === 'scambio' && (
                  <FormGroup>
                    <Label>Giocatore da Scambiare</Label>
                    <Select 
                      name="giocatore_scambio_id" 
                      value={form.giocatore_scambio_id} 
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleziona giocatore da scambiare</option>
                      {userTeamPlayers.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.nome} {player.cognome} ({player.ruolo})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
                
                <SubmitButton type="submit" disabled={submitting}>
                  {submitting ? 'Invio in corso...' : 'Invia Offerta'}
                </SubmitButton>
                
                {offertaMsg && (
                  <Message success={offertaMsg.includes('successo')}>
                    {offertaMsg}
                  </Message>
                )}
              </OfferForm>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#666', fontStyle: 'italic' }}>
            {userTeam && giocatore.squadra_id === userTeam.id 
              ? 'Questo giocatore appartiene già alla tua squadra'
              : 'Caricamento...'
            }
          </div>
        )}
      </OfferSection>

      <LogSection>
        <SectionTitle>📋 Log Operazioni</SectionTitle>
        
        {logLoading ? (
          <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>Caricamento log...</div>
        ) : logOperazioni.length > 0 ? (
          <div style={{ marginTop: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Data</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Tipo</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Valore</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Dettagli</th>
                </tr>
              </thead>
              <tbody>
                {logOperazioni.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem', textAlign: 'left' }}>
                      {new Date(item.data_operazione).toLocaleDateString('it-IT')}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        backgroundColor: getOperationColor(item.tipo_operazione),
                        color: 'white'
                      }}>
                        {item.tipo_operazione}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                      {item.valore ? `FM ${item.valore}` : '-'}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.65rem' }}>
                      {item.dettagli}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <NoDataMessage>
            Nessuna operazione registrata per questo giocatore.
          </NoDataMessage>
        )}
      </LogSection>
    </Container>
  );
};

export default DettaglioGiocatore; 