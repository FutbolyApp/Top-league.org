import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getGiocatoreById } from '../api/giocatori';
import { getSquadraById } from '../api/squadre';
import { getSquadreByLega } from '../api/leghe';
import { creaOfferta } from '../api/offerte';

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
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: #e3f2fd;
  color: #1976d2;
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
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchGiocatore();
  }, [id, token, setCurrentTeam]);

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
              <PlayerRole>{giocatore.ruolo}</PlayerRole>
            </InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Squadra Reale</InfoLabel>
            <InfoValue>{giocatore.squadra_reale}</InfoValue>
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