import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getMyTeamByLeague } from '../api/squadre';
import { pagaContratto, pagaContrattiMultipli, rinnovaContratto, aggiornaImpostazioniTrasferimento, getLogRinnoviGiocatore } from '../api/contratti';
import styled from 'styled-components';
import { getRoleClass } from '../utils/roleUtils';
import { api } from '../api/config.js';


// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

// Title component removed as it's not used

const Subtitle = styled.p`
  color: #86868b;
  margin: 0;
`;

const LeagueName = styled.span`
  background: linear-gradient(135deg, #ff9f21 0%, #ff6b35 100%);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 159, 33, 0.3);
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 159, 33, 0.4);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const TeamLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
  margin-right: 1rem;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const TeamHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const TeamName = styled.h1`
  color: #1d1d1f;
  margin: 0;
  display: flex;
  align-items: center;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #007aff;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 1rem;
  padding: 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const TeamInfo = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
`;

const InfoCard = styled.div`
  text-align: center;
`;

const InfoLabel = styled.div`
  color: #86868b;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  color: #1d1d1f;
  font-weight: 600;
  font-size: 1rem;
`;

const ControlsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const SelectionControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &.primary {
    background: #007aff;
    color: white;
    
    &:hover {
      background: #0056b3;
    }
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }
  
  &.secondary {
    background: #6c757d;
    color: white;
    
    &:hover {
      background: #545b62;
    }
  }
  
  &.success {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #1e7e34;
    }
  }
`;

const PayContractsButton = styled(Button)`
  background: #28a745;
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  
  &:hover {
    background: #1e7e34;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const PlayersTable = styled.div`
  background: white;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  background: #ff9f21;
  color: white;
  padding: 0.5rem 0.3rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  border-bottom: 1px solid #dee2e6;
  white-space: nowrap;
  
  &:hover {
    background: #e68a1e;
  }
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
  }
`;

const TableCell = styled.td`
  padding: 0.5rem 0.3rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
  font-size: 0.8rem;
  text-align: center;
  white-space: nowrap;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const PlayerName = styled.span`
  color: #007aff;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
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

const ActionButton = styled.button`
  padding: 0.3rem 0.6rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
  white-space: nowrap;
  
  &.contract {
    background: #007aff;
    color: white;
    
    &:hover {
      background: #0056b3;
    }
  }
  
  &.transfer {
    background: #6c757d;
    color: white;
    
    &:hover {
      background: #545b62;
    }
  }
  
  &.renew {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #1e7e34;
    }
  }
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
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  margin-bottom: 1.5rem;
  color: #1d1d1f;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1d1d1f;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #007aff;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Timestamp = styled.div`
  font-size: 0.9rem;
  color: #86868b;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
`;

const Warning = styled.div`
  background: #fff3cd;
  color: #856404;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  border: 1px solid #ffeaa7;
`;

const LogSection = styled.div`
  margin-top: 1.5rem;
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
`;

const LogTitle = styled.h4`
  color: #1d1d1f;
  margin-bottom: 1rem;
  font-size: 1rem;
`;

const LogItem = styled.div`
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border-left: 3px solid #28a745;
`;

const LogDate = styled.div`
  font-size: 0.8rem;
  color: #86868b;
  margin-bottom: 0.25rem;
`;

const LogDetails = styled.div`
  font-size: 0.9rem;
  color: #1d1d1f;
  font-weight: 500;
`;

const LogAmount = styled.span`
  color: #28a745;
  font-weight: 600;
`;

const NoLogs = styled.div`
  text-align: center;
  color: #86868b;
  font-style: italic;
  padding: 1rem;
`;

// StatusBadge component removed as it's not used

const GestioneSquadra = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { legaId } = useParams();
  const [squadra, setSquadra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [payingContracts, setPayingContracts] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEndLoanModal, setShowEndLoanModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [contractYears, setContractYears] = useState(1);
  const [renewalLogs, setRenewalLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [transferData, setTransferData] = useState({
    prestito: false,
    trasferimento: false,
    valorePrestito: 0,
    valoreTrasferimento: 0
  });

  const [rosterData, setRosterData] = useState(null);
  const [leagueConfig, setLeagueConfig] = useState({
    roster_ab: false,
    cantera: false,
    contratti: false,
    triggers: false,
    is_classic: false
  });

  useEffect(() => {
    fetchSquadra();
  }, [legaId, token]);

  useEffect(() => {
    if (squadra && token) {
      fetchRosterData();
    }
  }, [squadra, token]);

  const fetchSquadra = useCallback(async () => {
    if (!token || !legaId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await getMyTeamByLeague(legaId, token);
      console.log('fetchSquadra: risposta API:', response);
      setSquadra(response.squadra);
      console.log('fetchSquadra: squadra impostata:', response.squadra);
      // Ottieni configurazioni della lega se disponibili
      if (response.config) {
        setLeagueConfig(response.config);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, legaId]);

  const fetchRosterData = useCallback(async () => {
    if (!squadra || !token || !squadra.id) {
      console.log('fetchRosterData: squadra o token mancanti, squadra:', squadra);
      return;
    }
    
    try {
      console.log('fetchRosterData: chiamando API con squadra.id:', squadra.id);
      const response = await fetch(`${api.baseUrl}/offerte/roster/${squadra.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRosterData(data);
      } else {
        console.error('fetchRosterData: errore response:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Errore caricamento dati roster:', err);
    }
  }, [squadra, token]);

  const handleSelectPlayer = (playerId) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    if (squadra?.giocatori) {
      setSelectedPlayers(squadra.giocatori.map(p => p.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedPlayers([]);
  };

  const handlePayContracts = async () => {
    if (selectedPlayers.length === 0) return;
    
    setPayingContracts(true);
    try {
      await pagaContrattiMultipli(selectedPlayers, token);
      await fetchSquadra(); // Refresh data
      setSelectedPlayers([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setPayingContracts(false);
    }
  };

  const handleContractAction = async (action, player) => {
    setSelectedPlayer(player);
    if (action === 'renew') {
      setShowRenewModal(true);
      setLoadingLogs(true);
      try {
        const response = await getLogRinnoviGiocatore(player.id, token);
        setRenewalLogs(response.log || []);
      } catch (err) {
        console.log('Errore caricamento log rinnovi:', err);
        setRenewalLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    } else {
      setShowContractModal(true);
    }
  };

  const handleTransferAction = (player) => {
    setSelectedPlayer(player);
    setTransferData({
      prestito: player.prestito || false,
      trasferimento: player.trasferimento || false,
      valorePrestito: player.valore_prestito || 0,
      valoreTrasferimento: player.valore_trasferimento || 0
    });
    setShowTransferModal(true);
  };

  const handlePayContract = async () => {
    if (!selectedPlayer) return;
    
    try {
      await pagaContratto(selectedPlayer.id, token);
      await fetchSquadra();
      setShowContractModal(false);
      setSelectedPlayer(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRenewContract = async () => {
    if (!selectedPlayer) return;
    
    try {
      await rinnovaContratto(selectedPlayer.id, contractYears, token);
      await fetchSquadra();
      setShowRenewModal(false);
      setSelectedPlayer(null);
      setContractYears(1);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveTransferSettings = async () => {
    if (!selectedPlayer) return;
    
    try {
      await aggiornaImpostazioniTrasferimento(selectedPlayer.id, transferData, token);
      await fetchSquadra();
      setShowTransferModal(false);
      setSelectedPlayer(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEndLoanAction = (player) => {
    setSelectedPlayer(player);
    setShowEndLoanModal(true);
  };

  const handleConfirmEndLoan = async () => {
    if (!selectedPlayer) return;
    
    try {
      const response = await fetch(`${api.baseUrl}/squadre/end-loan/${selectedPlayer.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore durante la conclusione del prestito');
      }
      
      await fetchSquadra();
      setShowEndLoanModal(false);
      setSelectedPlayer(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatMoney = (amount) => {
    if (!amount) return 'FM 0';
    return `FM ${amount}`;
  };

  const splitRoles = (ruolo) => {
    return ruolo ? ruolo.split(';').map(r => r.trim()) : [];
  };

  // Sort players by role
  const sortPlayersByRole = (players) => {
    if (!players) return [];
    
    const roleOrder = ['P', 'Por', 'D', 'Dc', 'B', 'Dd', 'Ds', 'E', 'M', 'C', 'T', 'W', 'A', 'Pc'];
    
    return [...players].sort((a, b) => {
      const roleA = splitRoles(a.ruolo)[0] || '';
      const roleB = splitRoles(b.ruolo)[0] || '';
      const indexA = roleOrder.indexOf(roleA);
      const indexB = roleOrder.indexOf(roleB);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return roleA.localeCompare(roleB);
    });
  };

  if (loading) {
    return (
      <Container>
        <div>Caricamento squadra...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div>Errore: {error}</div>
      </Container>
    );
  }

  if (!squadra) {
    return (
      <Container>
        <div>Squadra non trovata</div>
      </Container>
    );
  }

  const totalSalary = selectedPlayers.reduce((sum, playerId) => {
    const player = squadra.giocatori.find(p => p.id === playerId);
    
    // Se abbiamo dati roster, considera solo giocatori in Roster A
    if (rosterData && rosterData.rosterA) {
      const isInRosterA = rosterData.rosterA.some(p => p.id === playerId);
      return sum + (isInRosterA ? (player?.costo_attuale || 0) : 0);
    }
    
    // Altrimenti considera tutti i giocatori selezionati
    return sum + (player?.costo_attuale || 0);
  }, 0);

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <TeamHeader>
          {squadra.logo_url ? (
            <TeamLogo 
              src={`${api.baseUrl}/uploads/${squadra.logo_url}`} 
              alt={squadra.nome} 
            />
          ) : (
            <TeamLogo 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+" 
              alt={squadra.nome} 
            />
          )}
          <TeamName>
            Gestione Squadra: {squadra.nome}
          </TeamName>
        </TeamHeader>
        <Subtitle>
          Lega: <LeagueName 
            onClick={() => navigate(`/lega/${legaId}`)}
          >
            {squadra.lega_nome}
          </LeagueName>
        </Subtitle>
      </Header>

      <TeamInfo>
        <InfoCard>
          <InfoLabel>Nome Squadra</InfoLabel>
          <InfoValue>{squadra.nome}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Proprietario</InfoLabel>
          <InfoValue>{squadra.proprietario_nome || 'N/A'}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Casse Societarie</InfoLabel>
          <InfoValue>{formatMoney(squadra.casse_societarie)}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Giocatori</InfoLabel>
          <InfoValue>{squadra.giocatori?.length || 0}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Selezionati</InfoLabel>
          <InfoValue>{selectedPlayers.length}</InfoValue>
        </InfoCard>
        <InfoCard>
          <InfoLabel>Totale da Pagare</InfoLabel>
          <InfoValue>{formatMoney(totalSalary)}</InfoValue>
        </InfoCard>
      </TeamInfo>

      <ControlsSection>
        <SelectionControls>
          <Button onClick={handleSelectAll}>Seleziona Tutti</Button>
          <Button onClick={handleDeselectAll}>Deseleziona Tutti</Button>
        </SelectionControls>
        
        {leagueConfig.contratti && (
        <PayContractsButton 
          onClick={handlePayContracts}
          disabled={selectedPlayers.length === 0 || payingContracts}
        >
          {payingContracts ? 'Pagamento...' : 'Paga Contratti'}
        </PayContractsButton>
        )}
      </ControlsSection>

      <PlayersTable>
        <Table>
          <thead>
            <tr>
              <TableHeader>
                <Checkbox 
                  type="checkbox"
                  checked={selectedPlayers.length === squadra.giocatori?.length}
                  onChange={selectedPlayers.length === squadra.giocatori?.length ? handleDeselectAll : handleSelectAll}
                />
              </TableHeader>
              <TableHeader>Giocatore</TableHeader>
              <TableHeader>Ruolo</TableHeader>
              <TableHeader>M</TableHeader>
              <TableHeader>FaM</TableHeader>
              <TableHeader>
                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                  Squadra{'\n'}Reale
                </div>
              </TableHeader>
              <TableHeader>Cantera</TableHeader>
              <TableHeader>QI</TableHeader>
              <TableHeader>QA</TableHeader>
              <TableHeader>FVMP</TableHeader>
              {leagueConfig.contratti && (
                <>
              <TableHeader>Ingaggio</TableHeader>
              <TableHeader>
                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                  Anni{'\n'}Contratto
                </div>
              </TableHeader>
                </>
              )}
              {leagueConfig.triggers && <TableHeader>Triggers</TableHeader>}
              {leagueConfig.roster_ab && <TableHeader>Roster</TableHeader>}
              <TableHeader>St.Pres</TableHeader>
              <TableHeader>St.Trasf</TableHeader>
              <TableHeader>Azioni</TableHeader>
            </tr>
          </thead>
          <tbody>
            {sortPlayersByRole(squadra.giocatori || []).map(giocatore => {
              // Determina il colore di sfondo
              let backgroundColor = 'transparent';
              
              if (giocatore.squadra_prestito_id) {
                // Giocatore in prestito da un'altra squadra (giallo chiaro)
                backgroundColor = '#fffbf0';
              } else if (giocatore.valore_prestito > 0 || giocatore.valore_trasferimento > 0) {
                // Giocatore della squadra corrente disponibile al prestito/trasferimento (viola molto chiaro)
                backgroundColor = '#faf5ff';
              } else if (rosterData && rosterData.rosterA ? 
                        !rosterData.rosterA.some(p => p.id === giocatore.id) : 
                        giocatore.roster === 'B') {
                // Giocatore in Roster B (rosso chiaro)
                backgroundColor = '#ffeaea';
              }
              
              return (
                <tr key={giocatore.id} style={{ backgroundColor }}>
                <TableCell>
                  <Checkbox 
                    type="checkbox"
                    checked={selectedPlayers.includes(giocatore.id)}
                    onChange={() => handleSelectPlayer(giocatore.id)}
                  />
                </TableCell>
                <TableCell>
                  <PlayerName onClick={() => navigate(`/giocatore/${giocatore.id}`)}>
                    {giocatore.nome} {giocatore.cognome}
                  </PlayerName>
                </TableCell>
                <TableCell>
                  <PlayerRole>
                    {splitRoles(giocatore.ruolo).map((ruolo, index) => (
                      <span key={index} className={`ruolo-badge ${getRoleClass(ruolo)}`}>
                        {ruolo}
                      </span>
                    ))}
                  </PlayerRole>
                </TableCell>
                <TableCell>{giocatore.r || '-'}</TableCell>
                <TableCell>{giocatore.fr || '-'}</TableCell>
                <TableCell>{giocatore.squadra_reale || '-'}</TableCell>
                <TableCell>{giocatore.cantera ? '✔' : '-'}</TableCell>
                <TableCell>{giocatore.qi || '-'}</TableCell>
                <TableCell>{giocatore.qa || giocatore.quotazione_attuale || '-'}</TableCell>
                <TableCell>{giocatore.fv_mp || '-'}</TableCell>
                {leagueConfig.contratti && (
                  <>
                <TableCell>{formatMoney(giocatore.costo_attuale)}</TableCell>
                <TableCell>{giocatore.anni_contratto || 0}</TableCell>
                  </>
                )}
                {leagueConfig.triggers && (
                <TableCell>{giocatore.triggers || '-'}</TableCell>
                )}
                {leagueConfig.roster_ab && (
                <TableCell>
                  {rosterData && rosterData.rosterA ? 
                    (rosterData.rosterA.some(p => p.id === giocatore.id) ? 
                      <span style={{ color: '#28a745', fontWeight: 'bold' }}>A</span> : 
                      <span style={{ color: '#ffc107', fontWeight: 'bold' }}>B</span>
                    ) : 
                    (giocatore.roster === 'B' ? 
                      <span style={{ color: '#ffc107', fontWeight: 'bold' }}>B</span> : 
                      <span style={{ color: '#28a745', fontWeight: 'bold' }}>A</span>
                    )
                  }
                </TableCell>
                )}
                <TableCell>
                  {(() => {
                    if (giocatore.squadra_prestito_id) {
                      // Giocatore in prestito da un'altra squadra
                      return (
                        <div style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '2px' }}>In Prestito da</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#28a745' }}>
                            {giocatore.squadra_prestito_nome || 'Sconosciuta'}
                          </div>
                        </div>
                      );
                    } else if (giocatore.valore_prestito > 0) {
                      // Giocatore della squadra corrente disponibile al prestito
                      return (
                        <div style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '2px' }}>Costo Prestito</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#28a745' }}>
                            ({formatMoney(giocatore.valore_prestito)})
                          </div>
                        </div>
                      );
                    } else {
                      return '-';
                    }
                  })()}
                </TableCell>
                <TableCell>
                  {giocatore.valore_trasferimento > 0 ? (
                    <div style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '2px' }}>Costo Trasferimento</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#dc3545' }}>
                        ({formatMoney(giocatore.valore_trasferimento)})
                      </div>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell style={{ padding: '0.5rem', minWidth: '200px', textAlign: 'center' }}>
                  {(() => {
                    const isInRosterB = rosterData && rosterData.rosterA ? 
                      !rosterData.rosterA.some(p => p.id === giocatore.id) : 
                      giocatore.roster === 'B';
                    
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center' }}>
                        {leagueConfig.contratti && (
                          <>
                  <ActionButton 
                    className="contract"
                    onClick={() => handleContractAction('contract', giocatore)}
                              disabled={isInRosterB}
                              title={isInRosterB ? 'Giocatori in Roster B non possono essere modificati' : ''}
                  >
                    Contratto
                  </ActionButton>
                  <ActionButton 
                    className="renew"
                    onClick={() => handleContractAction('renew', giocatore)}
                              disabled={isInRosterB}
                              title={isInRosterB ? 'Giocatori in Roster B non possono essere modificati' : ''}
                  >
                    Rinnovo
                  </ActionButton>
                          </>
                        )}
                  <ActionButton 
                    className="transfer"
                    onClick={() => handleTransferAction(giocatore)}
                          disabled={isInRosterB || giocatore.prestito}
                          title={isInRosterB ? 'Giocatori in Roster B non possono essere modificati' : 
                                 giocatore.prestito ? 'Giocatori in prestito non possono essere trasferiti' : ''}
                  >
                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                      Stato{'\n'}Trasferimento
                    </div>
                  </ActionButton>
                  {giocatore.squadra_prestito_id && (
                    <ActionButton 
                      className="end-loan"
                      onClick={() => handleEndLoanAction(giocatore)}
                      style={{ backgroundColor: '#dc3545', color: 'white' }}
                      title="Concludi il prestito e riporta il giocatore alla squadra di appartenenza"
                    >
                      <div style={{ whiteSpace: 'pre-line', lineHeight: '1.2' }}>
                        Concludi{'\n'}Prestito
                      </div>
                    </ActionButton>
                  )}
                      </div>
                    );
                  })()}
                </TableCell>
              </tr>
            );
          })}
          </tbody>
        </Table>
      </PlayersTable>



      {/* Modal Contratto */}
      {leagueConfig.contratti && showContractModal && selectedPlayer && (
        <Modal onClick={() => setShowContractModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Gestione Contratto: {selectedPlayer.nome}</ModalTitle>
            
            <FormGroup>
              <Label>Ingaggio Attuale</Label>
              <div>{formatMoney(selectedPlayer.costo_attuale)}</div>
            </FormGroup>
            
            <FormGroup>
              <Label>Anni Contratto Attuali</Label>
              <div>{selectedPlayer.anni_contratto || 0}</div>
            </FormGroup>
            
            {selectedPlayer.ultimo_pagamento_contratto && (
              <Timestamp>
                Ultimo pagamento: {new Date(selectedPlayer.ultimo_pagamento_contratto).toLocaleString('it-IT')}
              </Timestamp>
            )}
            
            {selectedPlayer.ultimo_rinnovo_contratto && (
              <Timestamp>
                Ultimo rinnovo: {new Date(selectedPlayer.ultimo_rinnovo_contratto).toLocaleString('it-IT')}
              </Timestamp>
            )}
            
            <ButtonGroup>
              <Button className="success" onClick={handlePayContract}>
                Paga Contratto
              </Button>
              <Button className="secondary" onClick={() => setShowContractModal(false)}>
                Chiudi
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Rinnovo Contratto */}
      {leagueConfig.contratti && showRenewModal && selectedPlayer && (
        <Modal onClick={() => setShowRenewModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Rinnovo Contratto: {selectedPlayer.nome}</ModalTitle>
            
            <FormGroup>
              <Label>Anni di Rinnovo</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button 
                  onClick={() => setContractYears(Math.max(1, contractYears - 1))}
                  disabled={contractYears <= 1}
                >
                  -
                </Button>
                <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>{contractYears}</span>
                <Button 
                  onClick={() => setContractYears(Math.min(4, contractYears + 1))}
                  disabled={contractYears >= 4}
                >
                  +
                </Button>
              </div>
            </FormGroup>
            
            <FormGroup>
              <Label>Costo Rinnovo</Label>
              <div>{formatMoney(selectedPlayer.quotazione_attuale)}</div>
            </FormGroup>
            
            <Warning>
              ⚠️ Una volta chiuso questo popup non potrai più annullare il rinnovo
            </Warning>
            
            <LogSection>
              <LogTitle>Storico Rinnovi</LogTitle>
              {loadingLogs ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>Caricamento log...</div>
              ) : renewalLogs.length > 0 ? (
                renewalLogs.map((log, index) => (
                  <LogItem key={index}>
                    <LogDate>
                      {new Date(log.data_operazione).toLocaleString('it-IT')}
                    </LogDate>
                    <LogDetails>
                      {log.note} - <LogAmount>{formatMoney(log.importo)}</LogAmount>
                    </LogDetails>
                  </LogItem>
                ))
              ) : (
                <NoLogs>Nessun rinnovo precedente</NoLogs>
              )}
            </LogSection>
            
            <ButtonGroup>
              <Button className="success" onClick={handleRenewContract}>
                Rinnova Contratto
              </Button>
              <Button className="secondary" onClick={() => setShowRenewModal(false)}>
                Chiudi
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Trasferimento */}
      {showTransferModal && selectedPlayer && (
        <Modal onClick={() => setShowTransferModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Impostazioni Trasferimento: {selectedPlayer.nome}</ModalTitle>
            
            <FormGroup>
              <Label>
                <input 
                  type="checkbox"
                  checked={transferData.prestito}
                  onChange={(e) => setTransferData(prev => ({ ...prev, prestito: e.target.checked }))}
                />
                Prestito
              </Label>
              {transferData.prestito && (
                <Input
                  type="number"
                  placeholder="Valore prestito (FM)"
                  value={transferData.valorePrestito || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTransferData(prev => ({ 
                      ...prev, 
                      valorePrestito: value === '' ? 0 : parseFloat(value) || 0 
                    }));
                  }}
                />
              )}
            </FormGroup>
            
            <FormGroup>
              <Label>
                <input 
                  type="checkbox"
                  checked={transferData.trasferimento}
                  onChange={(e) => setTransferData(prev => ({ ...prev, trasferimento: e.target.checked }))}
                />
                Trasferimento
              </Label>
              {transferData.trasferimento && (
                <Input
                  type="number"
                  placeholder="Valore trasferimento (FM)"
                  value={transferData.valoreTrasferimento || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTransferData(prev => ({ 
                      ...prev, 
                      valoreTrasferimento: value === '' ? 0 : parseFloat(value) || 0 
                    }));
                  }}
                />
              )}
            </FormGroup>
            
            <ButtonGroup>
              <Button className="success" onClick={handleSaveTransferSettings}>
                Salva
              </Button>
              <Button className="secondary" onClick={() => setShowTransferModal(false)}>
                Chiudi
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Conclusione Prestito */}
      {showEndLoanModal && selectedPlayer && (
        <Modal onClick={() => setShowEndLoanModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Concludi Prestito: {selectedPlayer.nome}</ModalTitle>
            
            <FormGroup>
              <Label>Confermi di voler concludere il prestito di questo giocatore?</Label>
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <strong>Giocatore:</strong> {selectedPlayer.nome} {selectedPlayer.cognome}<br />
                <strong>Squadra di appartenenza:</strong> {selectedPlayer.squadra_prestito_nome || 'Sconosciuta'}<br />
                <strong>Squadra attuale:</strong> {squadra?.nome || 'Sconosciuta'}
              </div>
            </FormGroup>
            
            <Warning>
              ⚠️ Il giocatore tornerà alla squadra di appartenenza. Se la squadra ha già il numero massimo di giocatori, il giocatore verrà automaticamente spostato nel Roster B.
            </Warning>
            
            <ButtonGroup>
              <Button className="danger" onClick={handleConfirmEndLoan}>
                Concludi Prestito
              </Button>
              <Button className="secondary" onClick={() => setShowEndLoanModal(false)}>
                Annulla
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default GestioneSquadra; 