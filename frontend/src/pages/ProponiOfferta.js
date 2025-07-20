import React, { useState, useEffect, Fragment } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getSquadreByLega } from '../api/leghe';
import { getGiocatoriByLega } from '../api/giocatori';
import { splitRoles, getRoleClass } from '../utils/roleUtils';
import { api } from '../api/config.js';

const Container = styled.div`
  max-width: 1400px;
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

const Title = styled.h1`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TeamsSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  color: #333;
  margin: 0 0 2rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TeamsTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.th`
  background: #5856d6;
  color: white;
  padding: 0.5rem 0.25rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
  }
`;

const TableCell = styled.td`
  padding: 0.5rem 0.25rem;
  border-bottom: 1px solid #e5e5e7;
  color: #1d1d1f;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.85rem;
  
  &:hover {
    background-color: ${props => props.isLoan ? '#fff3cd' : '#f8f9fa'};
  }
`;

const TeamName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 1rem;
`;

const AvailabilityBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  
  &.available {
    background: #28a745;
    color: white;
  }
  
  &.unavailable {
    background: #dc3545;
    color: white;
  }
  
  &.loan {
    background: #ffc107;
    color: #212529;
  }
`;

const TransferBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  margin: 1px;
  
  &.available {
    background: #28a745;
    color: white;
  }
  
  &.unavailable {
    background: #6c757d;
    color: white;
  }
`;

const TeamStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
`;

const TeamStat = styled.div`
  text-align: center;
  
  .value {
    font-weight: 700;
    color: #333;
    font-size: 1rem;
  }
  
  .label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  background: ${props => {
    if (props.disabled) {
      return 'linear-gradient(135deg, #6c757d 0%, #545b62 100%)';
    }
    switch (props.type) {
      case 'contatta': return 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
      case 'trasferimento': return 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)';
      case 'prestito': return 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
      default: return 'linear-gradient(135deg, #6c757d 0%, #545b62 100%)';
    }
  }};
  color: white;
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.2)'};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const PlayersSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  margin-top: 1rem;
`;

const PlayersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PlayersTitle = styled.h3`
  color: #333;
  margin: 0;
  font-size: 1.2rem;
`;

const CloseButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  
  &:hover {
    background: #c82333;
  }
`;

const PlayersTable = styled.div`
  overflow-x: auto;
`;

const FloatingCloseButton = styled.button`
  position: fixed;
  left: 2rem;
  top: 50%;
  transform: translateY(-50%);
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 100;
  transition: all 0.3s ease;
  
  &:hover {
    background: #c82333;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 16px rgba(0,0,0,0.4);
  }
`;

const ExpandedRow = styled.tr`
  background: #f8f9fa;
`;

const ExpandedCell = styled.td`
  padding: 0 !important;
  border: none !important;
`;

const ExpandedContent = styled.div`
  padding: 1rem;
  background: white;
  margin: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const PlayerName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
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
    border-color: #0a3d91;
  }
  
  .ruolo-c { 
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); 
    color: white; 
    border-color: #0d47a1;
  }
  
  .ruolo-m { 
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); 
    color: white; 
    border-color: #1565c0;
  }
  
  .ruolo-w { 
    background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%); 
    color: white; 
    border-color: #1976d2;
  }
  
  /* Attaccanti - Palette di rossi */
  .ruolo-a { 
    background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); 
    color: white; 
    border-color: #a41515;
  }
  
  .ruolo-pc { 
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
    color: white; 
    border-color: #b71c1c;
  }
  
  .ruolo-t { 
    background: linear-gradient(135deg, #ef5350 0%, #f44336 100%); 
    color: white; 
    border-color: #d32f2f;
  }
`;

const MoneyValue = styled.span`
  font-weight: 700;
  color: #28a745;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  flex-direction: column;
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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  color: #333;
  margin: 0;
  font-size: 1.5rem;
`;

const ModalCloseButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  
  &:hover {
    background: #c82333;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e5e7;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #28a745;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e5e7;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #28a745;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => props.type === 'trasferimento' 
    ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' 
    : 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)'};
  color: white;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid #6c757d;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  color: #6c757d;
  
  &:hover {
    background: #6c757d;
    color: white;
  }
`;

const ProponiOfferta = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const squadraId = searchParams.get('squadra');
  
  const [squadre, setSquadre] = useState([]);
  const [giocatori, setGiocatori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [offerType, setOfferType] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [legaId, setLegaId] = useState(null);
  const [isCantera, setIsCantera] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedPlayerToOffer, setSelectedPlayerToOffer] = useState('');
  const [moneyToOffer, setMoneyToOffer] = useState('');
  const [moneyToReceive, setMoneyToReceive] = useState('');
  const [userSquadra, setUserSquadra] = useState(null);
  const [selectedTorneo, setSelectedTorneo] = useState('tutti');
  const [tornei, setTornei] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        // Prima ottieni la lega della squadra
        const squadraRes = await fetch(`${api.baseUrl}/squadre/${squadraId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const squadraData = await squadraRes.json();
        
        if (!squadraRes.ok) throw new Error(squadraData.error || 'Errore caricamento squadra');
        
        const legaId = squadraData?.squadra?.lega_id;
        if (!legaId) {
          throw new Error('Lega ID non trovato per questa squadra');
        }
        setLegaId(legaId);
        setUserSquadra(squadraData?.squadra);
        
        // Poi carica tutte le squadre e giocatori della lega
        const [squadreRes, giocatoriRes] = await Promise.all([
          getSquadreByLega(legaId, token),
          getGiocatoriByLega(legaId, token)
        ]);
        
        // Filtra le squadre escludendo la squadra dell'utente (non invia offerte a se stesso)
        const squadre = squadreRes?.data?.squadre || squadreRes?.squadre || [];
        const filteredSquadre = squadre?.filter(s => s?.id !== parseInt(squadraId)) || [];
        setSquadre(filteredSquadre);
        setGiocatori(giocatoriRes?.data?.giocatori || giocatoriRes?.giocatori || []);
        
        // Estrai i tornei unici dalle squadre
        const uniqueTornei = [...new Set(filteredSquadre.map(s => s.torneo || 'N/A'))];
        setTornei(uniqueTornei);
        
        // Non selezionare automaticamente nessuna squadra, lascia che l'utente scelga
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token && squadraId) fetchData();
  }, [token, squadraId]);

  const formatMoney = (value) => {
    if (!value) return 'FM 0';
    return `FM ${value.toLocaleString()}`;
  };

  const handleProponiTrasferimento = (giocatore) => {
    setSelectedPlayer(giocatore);
    setOfferType('trasferimento');
    setOfferAmount('');
    setOfferMessage('');
    setShowModal(true);
  };

  const handleProponiPrestito = (giocatore) => {
    setSelectedPlayer(giocatore);
    setOfferType('prestito');
    setOfferAmount('');
    setOfferMessage('');
    setShowModal(true);
  };

  const handleProponiScambio = (giocatore) => {
    setSelectedPlayer(giocatore);
    setSelectedPlayerToOffer('');
    setMoneyToOffer('');
    setMoneyToReceive('');
    setShowSwapModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPlayer(null);
    setOfferType('');
    setOfferAmount('');
    setOfferMessage('');
  };

  const handleCloseSwapModal = () => {
    setShowSwapModal(false);
    setSelectedPlayer(null);
    setSelectedPlayerToOffer('');
    setMoneyToOffer('');
    setMoneyToReceive('');
  };

  const handleSubmitOffer = async () => {
    if (!offerAmount) {
      alert('Inserisci il valore dell\'offerta');
      return;
    }

    const offerValue = parseFloat(offerAmount);
    
    // Controlla se l'utente ha abbastanza fondi
    if (offerValue > userSquadra?.casse_societarie) {
      alert('Non hai abbastanza fondi nelle casse societarie per questa offerta');
      return;
    }

    // Controlla i limiti di giocatori per trasferimento
    if (offerType === 'trasferimento') {
      const userTeamPlayers = giocatori.filter(g => g.squadra_id === userSquadra?.id).length;
      const maxPlayers = 25;
      
      if (userTeamPlayers + 1 > maxPlayers) {
        alert('La tua squadra supererebbe il limite massimo di giocatori');
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${api.baseUrl}/offerte/crea`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          giocatore_id: selectedPlayer?.id,
          tipo: offerType,
          valore_offerta: offerValue,
          richiesta_fm: 0,
          cantera: isCantera
        })
      });

      if (response.ok) {
        alert('Offerta inviata con successo!');
        handleCloseModal();
      } else {
        const errorData = await response.json();
        alert('Errore nell\'invio dell\'offerta: ' + (errorData.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      alert('Errore nell\'invio dell\'offerta: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeamClick = (squadra) => {
    setSelectedTeam(squadra);
  };

  const handleClosePlayers = () => {
    setSelectedTeam(null);
  };

  const getTeamStats = (squadra) => {
    const giocatoriSquadra = giocatori.filter(g => g.squadra_id === squadra.id);
    const valoreSquadra = giocatoriSquadra.reduce((sum, g) => sum + (g.costo_attuale || 0), 0);
    const costoSalariale = giocatoriSquadra.reduce((sum, g) => sum + (g.salario || 0), 0);
    
    return {
      giocatori: giocatoriSquadra.length,
      valore: valoreSquadra,
      salari: costoSalariale
    };
  };



  const getTransferAvailability = (giocatore) => {
    // Il giocatore è disponibile per trasferimento se valore_trasferimento > 0 (messo in trasferimento dal proprietario)
    return giocatore.valore_trasferimento > 0 ? 'available' : 'unavailable';
  };

  const getLoanAvailability = (giocatore) => {
    // Il giocatore è disponibile per prestito se valore_prestito > 0 (messo in prestito dal proprietario)
    return giocatore.valore_prestito > 0 ? 'available' : 'unavailable';
  };

  const getFilteredSquadre = () => {
    if (selectedTorneo === 'tutti') {
      return squadre;
    }
    return squadre.filter(s => (s.torneo || 'N/A') === selectedTorneo);
  };

  const handleSubmitSwapOffer = async () => {
    // Validazioni
    if (!selectedPlayerToOffer) {
      alert('Seleziona un giocatore da offrire');
      return;
    }

    const moneyToOfferValue = parseFloat(moneyToOffer) || 0;
    const moneyToReceiveValue = parseFloat(moneyToReceive) || 0;

    // Controlla se l'utente ha abbastanza fondi solo se offre denaro
    if (moneyToOfferValue > 0 && moneyToOfferValue > userSquadra?.casse_societarie) {
      alert('Non hai abbastanza fondi nelle casse societarie per questa offerta');
      return;
    }

    // Controlla se la squadra destinataria ha abbastanza fondi solo se richiede denaro
    if (moneyToReceiveValue > 0 && moneyToReceiveValue > selectedTeam?.casse_societarie) {
      alert('La squadra destinataria non ha abbastanza fondi per questa offerta');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${api.baseUrl}/offerte/crea`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          giocatore_id: selectedPlayer?.id,
          tipo: 'scambio',
          valore_offerta: moneyToOfferValue,
          richiesta_fm: moneyToReceiveValue,
          giocatore_scambio_id: selectedPlayerToOffer
        })
      });

      if (response.ok) {
        alert('Offerta di scambio inviata con successo!');
        handleCloseSwapModal();
      } else {
        const errorData = await response.json();
        alert('Errore nell\'invio dell\'offerta: ' + (errorData.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      alert('Errore nell\'invio dell\'offerta: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento squadre e giocatori...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <Title>💰 Proponi Offerta</Title>
      </Header>

      <TeamsSection>
        <SectionTitle>🏆 Squadre della Lega</SectionTitle>
        
        {tornei.length > 1 && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontWeight: '600', color: '#333' }}>Filtra per Torneo:</label>
            <select
              value={selectedTorneo}
              onChange={(e) => setSelectedTorneo(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                fontSize: '0.9rem'
              }}
            >
              <option value="tutti">Tutti i Tornei</option>
              {tornei.map(torneo => (
                <option key={torneo} value={torneo}>{torneo}</option>
              ))}
            </select>
          </div>
        )}
        
        {getFilteredSquadre().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Nessuna squadra disponibile in questa lega
          </div>
        ) : (
          <TeamsTable>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Squadra</TableHeader>
                  <TableHeader>Proprietario</TableHeader>
                  <TableHeader>Giocatori</TableHeader>
                  <TableHeader>Valore</TableHeader>
                  <TableHeader>Ingaggi</TableHeader>
                  <TableHeader>Azioni</TableHeader>
                </tr>
              </thead>
              <tbody>
                {getFilteredSquadre().map(squadra => {
                  const stats = getTeamStats(squadra);
                  const isSelected = selectedTeam && selectedTeam.id === squadra.id;
                  
                  return (
                    <Fragment key={squadra.id}>
                      <tr onClick={() => handleTeamClick(squadra)}>
                        <TableCell>
                          <TeamName>{squadra.nome}</TeamName>
                        </TableCell>
                        <TableCell>
                          <div className="value">
                            {squadra.proprietario_nome && squadra.proprietario_cognome 
                              ? `${squadra.proprietario_nome} ${squadra.proprietario_cognome}`
                              : squadra.proprietario_nome || squadra.proprietario_cognome || 'Non assegnato'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="value">{stats.giocatori}</div>
                        </TableCell>
                        <TableCell>
                          <MoneyValue>{formatMoney(stats.valore)}</MoneyValue>
                        </TableCell>
                        <TableCell>
                          <MoneyValue>{formatMoney(stats.salari)}</MoneyValue>
                        </TableCell>
                        <TableCell>
                          <ActionButton 
                            type="contatta"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                handleClosePlayers();
                              } else {
                              handleTeamClick(squadra);
                              }
                            }}
                          >
                            {isSelected ? 'Chiudi' : 'Visualizza Giocatori'}
                          </ActionButton>
                        </TableCell>
                      </tr>
                      {isSelected && (
                        <ExpandedRow>
                          <ExpandedCell colSpan="15">
                            <ExpandedContent>
                              <PlayersHeader>
                                <PlayersTitle>👥 Giocatori di {squadra.nome}</PlayersTitle>
                              </PlayersHeader>
                              
                              <PlayersTable>
                                <Table>
                                  <thead>
                                    <tr>
                                      <TableHeader>Giocatore</TableHeader>
                                      <TableHeader>Ruolo</TableHeader>
                                      <TableHeader>Squadra Reale</TableHeader>
                                      <TableHeader>Cantera</TableHeader>
                                      <TableHeader>QA</TableHeader>
                                      <TableHeader>Ingaggio</TableHeader>
                                      <TableHeader>Valore Mercato</TableHeader>
                                      <TableHeader>St.Pres</TableHeader>
                                      <TableHeader>St.Tra</TableHeader>
                                      <TableHeader>Roster</TableHeader>
                                      <TableHeader>Prestito</TableHeader>
                                      <TableHeader>Valore Prestito</TableHeader>
                                      <TableHeader>Trasferimento</TableHeader>
                                      <TableHeader>Valore Trasferimento</TableHeader>
                                      <TableHeader>Azioni</TableHeader>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {giocatori
                                      .filter(g => g.squadra_id === squadra.id)
                                      .sort((a, b) => {
                                        // Ordina per ruolo: P, Por, D, Dc, B, Dd, Ds, E, M, C, T, W, A, Pc
                                        const roleOrder = { 
                                          'P': 1, 'Por': 2, 'D': 3, 'Dc': 4, 'B': 5, 'Dd': 6, 'Ds': 7, 'E': 8, 
                                          'M': 9, 'C': 10, 'T': 11, 'W': 12, 'A': 13, 'Pc': 14 
                                        };
                                        const aRoles = splitRoles(a.ruolo);
                                        const bRoles = splitRoles(b.ruolo);
                                        
                                        // Prendi il primo ruolo di ogni giocatore
                                        const aFirstRole = aRoles[0] || '';
                                        const bFirstRole = bRoles[0] || '';
                                        
                                        const aOrder = roleOrder[aFirstRole] || 15;
                                        const bOrder = roleOrder[bFirstRole] || 15;
                                        
                                        if (aOrder !== bOrder) {
                                          return aOrder - bOrder;
                                        }
                                        
                                        // Se hanno lo stesso ruolo, ordina per nome
                                        return (a.nome + ' ' + (a.cognome || '')).localeCompare(b.nome + ' ' + (b.cognome || ''));
                                      })
                                      .map(giocatore => (
                                        <tr 
                                          key={giocatore.id}
                                          style={{
                                            backgroundColor: giocatore.prestito ? '#fff3cd' : 'transparent'
                                          }}
                                        >
                                          <TableCell isLoan={giocatore.prestito}>
                                            <span
                                              style={{ color: '#E67E22', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
                                              onClick={() => navigate(`/giocatore/${giocatore.id}`)}
                                            >
                                              {giocatore.nome} {giocatore.cognome || ''}
                                            </span>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <PlayerRole>
                                              {splitRoles(giocatore.ruolo).map((ruolo, index) => (
                                                <span key={index} className={`ruolo-badge ${getRoleClass(ruolo)}`}>{ruolo}</span>
                                              ))}
                                            </PlayerRole>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>{giocatore.squadra_reale}</TableCell>
                                          <TableCell isLoan={giocatore.prestito}>{giocatore.cantera ? '✔' : '-'}</TableCell>
                                          <TableCell isLoan={giocatore.prestito}>{giocatore.qa_scraping || giocatore.quotazione_attuale || '-'}</TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <MoneyValue>{formatMoney(giocatore.salario)}</MoneyValue>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <MoneyValue>{formatMoney(giocatore.costo_attuale)}</MoneyValue>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            {giocatore.prestito ? (
                                              <div style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '2px' }}>In Prestito da</div>
                                                <TransferBadge className="loan">{giocatore.squadra_prestito_nome || 'Sconosciuta'}</TransferBadge>
                                              </div>
                                            ) : '-'}
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            {giocatore.trasferimento ? (
                                              <TransferBadge className="unavailable">Trasferimento</TransferBadge>
                                            ) : '-'}
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <span style={{ 
                                              color: giocatore.roster === 'B' ? '#ffc107' : '#28a745', 
                                              fontWeight: 'bold' 
                                            }}>
                                              {giocatore.roster === 'B' ? 'B' : 'A'}
                                            </span>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <TransferBadge className={getLoanAvailability(giocatore)}>
                                              {getLoanAvailability(giocatore) === 'available' ? 'Sì' : 'No'}
                                            </TransferBadge>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <MoneyValue>
                                              {giocatore.valore_prestito > 0 ? formatMoney(giocatore.valore_prestito) : '-'}
                                            </MoneyValue>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <TransferBadge className={getTransferAvailability(giocatore)}>
                                              {getTransferAvailability(giocatore) === 'available' ? 'Sì' : 'No'}
                                            </TransferBadge>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <MoneyValue>
                                              {giocatore.valore_trasferimento > 0 ? formatMoney(giocatore.valore_trasferimento) : '-'}
                                            </MoneyValue>
                                          </TableCell>
                                          <TableCell isLoan={giocatore.prestito}>
                                            <ActionButtons>
                                              <ActionButton 
                                                type="trasferimento"
                                                onClick={() => handleProponiTrasferimento(giocatore)}
                                              >
                                                Trasferimento
                                              </ActionButton>
                                              <ActionButton 
                                                type="prestito"
                                                onClick={() => handleProponiPrestito(giocatore)}
                                              >
                                                Prestito
                                              </ActionButton>
                                              <ActionButton 
                                                type="scambio"
                                                onClick={() => handleProponiScambio(giocatore)}
                                              >
                                                Scambio
                                              </ActionButton>
                                            </ActionButtons>
                                          </TableCell>
                                        </tr>
                                      ))}
                                  </tbody>
                                </Table>
                              </PlayersTable>
                            </ExpandedContent>
                          </ExpandedCell>
                        </ExpandedRow>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </Table>
          </TeamsTable>
        )}
      </TeamsSection>

      {selectedTeam && (
        <FloatingCloseButton onClick={handleClosePlayers}>
          ✕
        </FloatingCloseButton>
      )}

      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                Proponi {offerType === 'trasferimento' ? 'Trasferimento' : 'Prestito'} - {selectedPlayer?.nome} {selectedPlayer?.cognome}
              </ModalTitle>
              <ModalCloseButton onClick={handleCloseModal}>✕</ModalCloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>Valore Offerta (FM)</Label>
              <Input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Inserisci il valore dell'offerta"
                min="0"
                step="1"
              />
            </FormGroup>

            <FormGroup>
              <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={isCantera}
                  onChange={(e) => setIsCantera(e.target.checked)}
                />
                Calciatore Cantera
              </Label>
              <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                I calciatori cantera hanno un ingaggio ridotto (quotazione attuale / 2)
              </small>
            </FormGroup>

            <ModalButtons>
              <CancelButton onClick={handleCloseModal}>
                Annulla
              </CancelButton>
              <SubmitButton 
                type={offerType}
                onClick={handleSubmitOffer}
                disabled={submitting}
              >
                {submitting ? 'Invio...' : `Proponi ${offerType === 'trasferimento' ? 'Trasferimento' : 'Prestito'}`}
              </SubmitButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}

      {showSwapModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                Proponi Scambio - {selectedPlayer?.nome} {selectedPlayer?.cognome}
              </ModalTitle>
              <ModalCloseButton onClick={handleCloseSwapModal}>✕</ModalCloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>Giocatore che offri (dalla tua squadra)</Label>
              <select
                value={selectedPlayerToOffer}
                onChange={(e) => setSelectedPlayerToOffer(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">Seleziona un giocatore</option>
                {giocatori
                  .filter(g => g.squadra_id === userSquadra?.id)
                  .map(giocatore => (
                    <option key={giocatore.id} value={giocatore.id}>
                      {giocatore.nome} {giocatore.cognome} ({giocatore.ruolo})
                    </option>
                  ))}
              </select>
            </FormGroup>

            <FormGroup>
              <Label>Giocatore che ricevi (dalla squadra {selectedTeam?.nome})</Label>
              <div style={{ 
                padding: '0.5rem', 
                borderRadius: '4px', 
                border: '1px solid #ddd', 
                backgroundColor: '#f8f9fa',
                color: '#333',
                fontWeight: '600'
              }}>
                {selectedPlayer?.nome} {selectedPlayer?.cognome} ({selectedPlayer?.ruolo})
              </div>
            </FormGroup>

            <FormGroup>
              <Label>Offro (FM) - Verrà aggiunto alle casse societarie di {selectedTeam?.nome}</Label>
              <Input
                type="number"
                value={moneyToOffer}
                onChange={(e) => setMoneyToOffer(e.target.value)}
                placeholder="Inserisci il valore da offrire"
                min="0"
                step="1"
              />
            </FormGroup>

            <FormGroup>
              <Label>Ricevo (FM) - Verrà aggiunto alle tue casse societarie</Label>
              <Input
                type="number"
                value={moneyToReceive}
                onChange={(e) => setMoneyToReceive(e.target.value)}
                placeholder="Inserisci il valore da ricevere"
                min="0"
                step="1"
              />
            </FormGroup>

            <ModalButtons>
              <CancelButton onClick={handleCloseSwapModal}>
                Annulla
              </CancelButton>
              <SubmitButton 
                type="scambio"
                onClick={handleSubmitSwapOffer}
                disabled={submitting}
              >
                {submitting ? 'Invio...' : 'Proponi Scambio'}
              </SubmitButton>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default ProponiOfferta; 