import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getGiocatoreById, getQAHistory } from '../api/giocatori';
import { getSquadraById } from '../api/squadre';
import { getSquadreByLega } from '../api/leghe';
import { creaOfferta } from '../api/offerte';
import { splitRoles, getRoleClass } from '../utils/roleUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const PlayerTitle = styled.h1`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PlayerInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const InfoCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
`;

const InfoLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  color: #333;
  font-size: 1.5rem;
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid ${props => props.color || '#667eea'};
`;

const StatTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
`;

const ContractSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin: 0 0 2rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ContractGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const ContractCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
`;

const ContractLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const ContractValue = styled.div`
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
`;

const OfferSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const OfferForm = styled.form`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
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
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 1rem;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-weight: 600;
  background: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #dc3545;
`;

const QAHistorySection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const ChartContainer = styled.div`
  height: 400px;
  margin-top: 1rem;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

const DettaglioGiocatore = ({ setCurrentLeague, setCurrentTeam }) => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [giocatore, setGiocatore] = useState(null);
  const [squadra, setSquadra] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOfferta, setShowOfferta] = useState(false);
  const [form, setForm] = useState({ 
    squadra_destinatario_id: '', 
    tipo: 'trasferimento', 
    valore: '' 
  });
  const [offertaMsg, setOffertaMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [qaHistory, setQaHistory] = useState([]);
  const [qaHistoryLoading, setQaHistoryLoading] = useState(false);

  useEffect(() => {
    async function fetchGiocatore() {
      setLoading(true);
      setError('');
      try {
        const res = await getGiocatoreById(id, token);
        setGiocatore(res.giocatore);
        
        if (res.giocatore.squadra_id) {
          const squadraRes = await getSquadraById(res.giocatore.squadra_id, token);
          setSquadra(squadraRes.squadra);
          if (setCurrentTeam) setCurrentTeam(squadraRes.squadra);
        }
        
        const squadreRes = await getSquadreByLega(res.giocatore.lega_id, token);
        setSquadre(squadreRes.squadre);
        
        // Recupera la cronologia QA
        await fetchQAHistory();
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchGiocatore();
  }, [id, token, setCurrentTeam]);

  const fetchQAHistory = async () => {
    setQaHistoryLoading(true);
    try {
      const history = await getQAHistory(id, token);
      // Formatta i dati per il grafico
      const formattedHistory = history.map(item => ({
        ...item,
        data: new Date(item.data_registrazione).toLocaleDateString('it-IT'),
        qa_value: parseFloat(item.qa_value)
      })).reverse(); // Inverti per mostrare cronologicamente
      setQaHistory(formattedHistory);
    } catch (err) {
      console.error('Errore nel recupero della cronologia QA:', err);
    }
    setQaHistoryLoading(false);
  };

  const formatMoney = (value) => {
    if (!value) return 'FM 0';
    return `FM ${value.toLocaleString()}`;
  };

  async function handleOfferta(e) {
    e.preventDefault();
    setOffertaMsg('');
    setSubmitting(true);
    
    try {
      await creaOfferta({
        lega_id: giocatore.lega_id,
        squadra_mittente_id: giocatore.squadra_id,
        squadra_destinatario_id: form.squadra_destinatario_id,
        giocatore_id: giocatore.id,
        tipo: form.tipo,
        valore: form.valore
      }, token);
      setOffertaMsg('Offerta inviata con successo!');
      setForm({ squadra_destinatario_id: '', tipo: 'trasferimento', valore: '' });
      setShowOfferta(false);
    } catch (err) {
      setOffertaMsg(err.message);
    }
    setSubmitting(false);
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento giocatore...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  if (!giocatore) return (
    <Container>
      <ErrorContainer>Giocatore non trovato</ErrorContainer>
    </Container>
  );

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <PlayerTitle>{giocatore.nome} {giocatore.cognome}</PlayerTitle>
        
        <PlayerInfo>
          <InfoCard>
            <InfoLabel>Ruolo</InfoLabel>
            <InfoValue>
              <PlayerRole>
                {splitRoles(giocatore.ruolo).map((ruolo, index) => (
                  <span key={index} className={`ruolo-badge ${getRoleClass(ruolo)}`}>{ruolo}</span>
                ))}
              </PlayerRole>
            </InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Squadra Reale</InfoLabel>
            <InfoValue>
              <span
                style={{ color: '#ff9500', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
                onClick={() => navigate(`/squadra/${giocatore.squadra_id}`)}
              >
                {giocatore.squadra_nome}
              </span>
            </InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Età</InfoLabel>
            <InfoValue>{giocatore.eta} anni</InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Squadra Fantasy</InfoLabel>
            <InfoValue>{squadra?.nome || 'N/A'}</InfoValue>
          </InfoCard>
        </PlayerInfo>
      </Header>

      <StatsGrid>
        <StatCard color="#28a745">
          <StatTitle>Quotazione Attuale</StatTitle>
          <StatValue>{giocatore.quotazione_attuale}</StatValue>
        </StatCard>
        <StatCard color="#dc3545">
          <StatTitle>Salario</StatTitle>
          <StatValue>{formatMoney(giocatore.salario)}</StatValue>
        </StatCard>
        <StatCard color="#17a2b8">
          <StatTitle>Costo Attuale</StatTitle>
          <StatValue>{formatMoney(giocatore.costo_attuale)}</StatValue>
        </StatCard>
        <StatCard color="#6f42c1">
          <StatTitle>Costo Precedente</StatTitle>
          <StatValue>{formatMoney(giocatore.costo_precedente)}</StatValue>
        </StatCard>
        <StatCard color="#ffc107">
          <StatTitle>QA (Scraping)</StatTitle>
          <StatValue>{giocatore.qa || 'N/A'}</StatValue>
        </StatCard>
        <StatCard color="#fd7e14">
          <StatTitle>QI (Scraping)</StatTitle>
          <StatValue>{giocatore.qi || 'N/A'}</StatValue>
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
            <ContractValue>{giocatore.anni_contratto || 0}</ContractValue>
          </ContractCard>
          <ContractCard>
            <ContractLabel>Cantera</ContractLabel>
            <ContractValue>{giocatore.cantera ? 'Sì' : 'No'}</ContractValue>
          </ContractCard>
          <ContractCard>
            <ContractLabel>Triggers</ContractLabel>
            <ContractValue>{giocatore.triggers || 'N/A'}</ContractValue>
          </ContractCard>
        </ContractGrid>
      </ContractSection>

      <QAHistorySection>
        <SectionTitle>📈 Cronologia QA</SectionTitle>
        
        {qaHistoryLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Caricamento cronologia...</div>
        ) : qaHistory.length > 0 ? (
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qaHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 0.1', 'dataMax + 0.1']}
                />
                <Tooltip 
                  formatter={(value) => [`QA: ${value}`, 'Quotazione Attuale']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="qa_value" 
                  stroke="#28a745" 
                  strokeWidth={3}
                  dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#28a745', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <NoDataMessage>
            Nessun dato storico QA disponibile per questo giocatore.
          </NoDataMessage>
        )}
      </QAHistorySection>

      <OfferSection>
        <SectionTitle>💰 Proponi Offerta</SectionTitle>
        
        <ToggleButton onClick={() => setShowOfferta(v => !v)}>
          {showOfferta ? 'Nascondi Form Offerta' : 'Mostra Form Offerta'}
        </ToggleButton>
        
        {showOfferta && (
          <OfferForm onSubmit={handleOfferta}>
            <FormGroup>
              <Label>Squadra Destinataria</Label>
              <Select 
                name="squadra_destinatario_id" 
                value={form.squadra_destinatario_id} 
                onChange={handleChange} 
                required
              >
                <option value="">Seleziona squadra destinataria</option>
                {squadre.filter(sq => sq.id !== giocatore.squadra_id).map(sq => (
                  <option key={sq.id} value={sq.id}>{sq.nome}</option>
                ))}
              </Select>
            </FormGroup>
            
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
      </OfferSection>
    </Container>
  );
};

export default DettaglioGiocatore; 