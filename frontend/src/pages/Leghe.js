import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLeghe, getRichiesteUtente } from '../api/leghe';
import { getSquadreByUtente } from '../api/squadre';
import JoinLeagueForm from '../components/JoinLeagueForm';
import AdminTeamSelector from '../components/AdminTeamSelector';

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
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: #FFA94D;
  }
`;

const Header = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 1rem 0;
`;

const Subtitle = styled.h2`
  font-size: 0.9rem;
  color: #86868b;
  margin: 0 0 1rem 0;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const ActionButton = styled(Link)`
  background: #007AFF;
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #0056b3;
  }
`;

const CreateButton = styled(ActionButton)`
  background: #ff9500;
  
  &:hover {
    background: #e6850e;
  }
`;

// Sezione filtri
const FiltersSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
`;

const FiltersTitle = styled.h3`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem;
  margin-bottom: 0.5rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const FilterInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const FilterCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
  
  &:hover {
    border-color: #FFA94D;
  }
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  label {
    cursor: pointer;
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const FilterButton = styled.button`
  background: ${props => props.$primary ? 'linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%)' : '#6c757d'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 0.9rem;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const LeaguesTable = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #5856d6;
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  
  &:hover {
    background: #4a4ac7;
  }
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
  }
  
  ${props => props.$sortable && `
    &::after {
      content: '${props.$sortDirection === 'asc' ? '▲' : props.$sortDirection === 'desc' ? '▼' : '↕'}';
      position: absolute;
      right: 0.5rem;
      color: white;
      font-size: 0.8rem;
    }
  `}
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  color: #333;
  vertical-align: middle;
`;

const LegaLink = styled(Link)`
  color: #007bff;
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'pubblica': return '#28a745';
      case 'privata': return '#6c757d';
      default: return '#6c757d';
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const FeatureTag = styled.span`
  background: ${props => props.active ? '#d4edda' : '#f8f9fa'};
  color: ${props => props.active ? '#155724' : '#666'};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  display: inline-block;
`;

const TableActionButton = styled.button`
  background: ${props => {
    if (props.$isManage) {
      return 'linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%)';
    }
    return 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
  }};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 0.8rem;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
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

const EmptyContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #666;
  text-align: center;
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 600;
  background: ${props => props.$success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$success ? '#155724' : '#721c24'};
`;

const ExpandedRow = styled.tr`
  background: #f8f9fa;
`;

const ExpandedCell = styled.td`
  padding: 0;
  border-bottom: 1px solid #dee2e6;
`;

const ExpandedContent = styled.div`
  padding: 1.5rem;
`;

const TeamStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
`;

const ExpandedActionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const ExpandedActionButton = styled.button`
  background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%);
  color: white;
  border: none;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

// Switch grafico stile pill
const FilterSwitchWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
`;

const FilterSwitch = styled.div`
  display: flex;
  border-radius: 999px;
  background: #e9ecef;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow: hidden;
  width: 340px;
`;

const SwitchOption = styled.button`
  flex: 1;
  padding: 0.8rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  outline: none;
  cursor: pointer;
  background: ${props => props.$active ? '#d4edda' : '#f8f9fa'};
  color: ${props => props.$active ? '#155724' : '#666'};
  transition: background 0.2s, color 0.2s;
`;

const Leghe = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [leghe, setLeghe] = useState([]);
  const [richiesteUtente, setRichiesteUtente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedLega, setSelectedLega] = useState(null);
  const [showAdminSelector, setShowAdminSelector] = useState(false);
  const [squadre, setSquadre] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  
  // Stato per l'ordinamento
  const [sortField, setSortField] = useState('nome');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Stato per i filtri
  const [filters, setFilters] = useState({
    tipo: 'tutti',
    stato: 'tutti',
    squadreMin: '',
    squadreMax: '',
    soloMieLeghe: true
  });

  // Assicurati che i popup siano sempre chiusi all'inizio
  useEffect(() => {
    setShowJoinForm(false);
    setShowAdminSelector(false);
    setSelectedLega(null);
  }, []);

  // Debug: monitora quando il popup si apre
  useEffect(() => {
    if (showJoinForm) {
      console.log('🚨 POPUP JOIN APERTO - showJoinForm:', showJoinForm, 'selectedLega:', selectedLega?.nome);
    }
  }, [showJoinForm, selectedLega]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [legheRes, richiesteRes, squadreRes] = await Promise.all([
          getLeghe(token),
          getRichiesteUtente(token),
          getSquadreByUtente(token)
        ]);
        setLeghe(legheRes.leghe);
        setRichiesteUtente(richiesteRes.richieste || []);
        setSquadre(squadreRes.squadre || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [token]);

  // Funzione per verificare se l'utente può richiedere ingresso a una lega
  const canRequestJoin = (lega) => {
    // Se ha già una squadra in questa lega, non può richiedere
    if (lega.is_iscritto) return false;
    
    // Se ha già una richiesta per questa lega (qualsiasi stato), non può richiedere
    const hasRequest = richiesteUtente.some(richiesta => richiesta.lega_id === lega.id);
    if (hasRequest) return false;
    
    // Se non ci sono squadre disponibili, non può richiedere
    if (!lega.ha_squadre_disponibili) return false;
    
    return true;
  };

  // Funzione per verificare se l'utente è admin della lega
  const isAdminOfLega = (lega) => {
    return lega.admin_id === user?.id;
  };

  const hasTeamInLega = (lega) => {
    return squadre.some(squadra => squadra.lega_id === lega.id);
  };

  // Funzione per ottenere il messaggio di stato per una lega
  const getStatusMessage = (lega) => {
    if (lega.is_iscritto) {
      return 'Hai già una squadra in questa lega';
    }
    
    const richiesta = richiesteUtente.find(r => r.lega_id === lega.id);
    if (richiesta) {
      switch (richiesta.stato) {
        case 'in_attesa':
          return 'Richiesta in attesa di risposta';
        case 'accettata':
          return 'Richiesta accettata';
        case 'rifiutata':
          return 'Richiesta rifiutata';
        default:
          return 'Hai già una richiesta per questa lega';
      }
    }
    
    if (!lega.ha_squadre_disponibili) {
      return 'Nessuna squadra disponibile';
    }
    
    return null;
  };

  // Funzione per verificare se una lega è completa
  const isLegaCompleta = (lega) => {
    return (lega.squadre_assegnate || 0) >= (lega.numero_squadre_totali || 0);
  };

  // Funzione per filtrare le leghe
  const filterLeghe = (legheToFilter) => {
    return legheToFilter.filter(lega => {
      // Filtro per mostrare solo le leghe dell'utente (quando abilitato)
      if (filters.soloMieLeghe) {
        const isAdmin = isAdminOfLega(lega);
        const hasTeam = hasTeamInLega(lega);
        if (!isAdmin && !hasTeam) return false;
      } else {
        // Di default, mostra solo le leghe dove l'utente NON ha fatto accesso
        const isAdmin = isAdminOfLega(lega);
        const hasTeam = hasTeamInLega(lega);
        if (isAdmin || hasTeam) return false;
      }
      
      // Filtro per tipo (pubblica/privata)
      if (filters.tipo !== 'tutti') {
        if (filters.tipo === 'pubblica' && !lega?.is_pubblica) return false;
        if (filters.tipo === 'privata' && lega?.is_pubblica) return false;
      }
      
      // Filtro per stato (completa/non completa)
      if (filters.stato !== 'tutti') {
        const completa = isLegaCompleta(lega);
        if (filters.stato === 'completa' && !completa) return false;
        if (filters.stato === 'non_completa' && completa) return false;
      }
      
      // Filtro per numero totale di squadre nella lega (min)
      if (filters.squadreMin && (lega?.max_squadre || 0) < parseInt(filters.squadreMin)) {
        return false;
      }
      
      // Filtro per numero totale di squadre nella lega (max)
      if (filters.squadreMax && (lega?.max_squadre || 0) > parseInt(filters.squadreMax)) {
        return false;
      }
      
      return true;
    });
  };

  // Funzione per gestire l'ordinamento
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Funzione per ordinare le leghe
  const sortLeghe = (legheToSort) => {
    return [...legheToSort].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Gestione valori nulli
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Conversione in stringa per confronto
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  const handleRichiediIngresso = (lega) => {
    console.log('🔍 handleRichiediIngresso chiamato per lega:', lega.nome);
    
    // Se è admin della lega, mostra il selettore diretto
    if (isAdminOfLega(lega)) {
      console.log('👑 Utente è admin della lega, mostro selettore admin');
      setSelectedLega(lega);
      setShowAdminSelector(true);
      return;
    }
    
    // Per utenti normali, verifica se può richiedere
    if (!canRequestJoin(lega)) {
      const message = getStatusMessage(lega);
      console.log('❌ Utente non può richiedere:', message);
      setError(message);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    console.log('✅ Utente può richiedere, apro form richiesta');
    setSelectedLega(lega);
    setShowJoinForm(true);
  };

  const handleRichiestaSuccess = async (message) => {
    setSuccessMessage(message);
    // Ricarica i dati per aggiornare lo stato
    try {
      const [legheRes, richiesteRes, squadreRes] = await Promise.all([
        getLeghe(token),
        getRichiesteUtente(token),
        getSquadreByUtente(token)
      ]);
      setLeghe(legheRes.leghe);
      setRichiesteUtente(richiesteRes.richieste || []);
      setSquadre(squadreRes.squadre || []);
    } catch (err) {
      console.error('Errore nel ricaricamento dati:', err);
    }
  };

  const handleCloseJoinForm = () => {
    setShowJoinForm(false);
    setSelectedLega(null);
  };

  const handleCloseAdminSelector = () => {
    setShowAdminSelector(false);
    setSelectedLega(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSwitchToggle = (showMyLeagues) => {
    setFilters(prev => ({
      ...prev,
      soloMieLeghe: showMyLeagues
    }));
  };

  const clearFilters = () => {
    setFilters({
      tipo: 'tutti',
      stato: 'tutti',
      squadreMin: '',
      squadreMax: '',
      soloMieLeghe: true
    });
  };

  const handleToggleExpanded = (legaId) => {
    setExpandedTeam(expandedTeam === legaId ? null : legaId);
  };

  const getTeamInLega = (legaId) => {
    return squadre.find(squadra => squadra.lega_id === legaId);
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento leghe...</LoadingContainer>
    </Container>
  );

  if (error && !successMessage) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  // Applica filtri e ordinamento
  const filteredLeghe = filterLeghe(leghe || []);
  const sortedLeghe = sortLeghe(filteredLeghe);

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      {successMessage && (
        <Message $success={true}>
          {successMessage}
        </Message>
      )}
      
      {error && (
        <Message $success={false}>
          {error}
        </Message>
      )}
      
      <Header>
        <Title>Leghe Disponibili</Title>
        <Subtitle>Esplora e unisciti alle leghe fantasy football</Subtitle>
        <ActionButtons>
          <CreateButton to="/crea-lega">
            Crea una Lega
          </CreateButton>
        </ActionButtons>
      </Header>

      <FiltersSection>
        <FiltersTitle>Filtri</FiltersTitle>
        <FiltersGrid>
          <FilterGroup>
            <FilterLabel>Tipo</FilterLabel>
            <FilterSelect 
              value={filters.tipo} 
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
            >
              <option value="tutti">Tutti i tipi</option>
              <option value="pubblica">Pubblica</option>
              <option value="privata">Privata</option>
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Stato</FilterLabel>
            <FilterSelect 
              value={filters.stato} 
              onChange={(e) => handleFilterChange('stato', e.target.value)}
            >
              <option value="tutti">Tutti gli stati</option>
              <option value="completa">Completa</option>
              <option value="non_completa">Non completa</option>
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Numero squadre nella lega (min)</FilterLabel>
            <FilterInput 
              type="number" 
              min="0"
              value={filters.squadreMin} 
              onChange={(e) => handleFilterChange('squadreMin', e.target.value)}
              placeholder="Min"
            />
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Numero squadre nella lega (max)</FilterLabel>
            <FilterInput 
              type="number" 
              min="0"
              value={filters.squadreMax} 
              onChange={(e) => handleFilterChange('squadreMax', e.target.value)}
              placeholder="Max"
            />
          </FilterGroup>
        </FiltersGrid>
        <FilterActions>
          <FilterButton onClick={clearFilters}>
            Cancella Filtri
          </FilterButton>
        </FilterActions>
        <FilterSwitchWrapper>
          <FilterSwitch>
            <SwitchOption 
              $active={filters.soloMieLeghe}
              onClick={() => handleSwitchToggle(true)}
            >
              Le tue Leghe
            </SwitchOption>
            <SwitchOption 
              $active={!filters.soloMieLeghe}
              onClick={() => handleSwitchToggle(false)}
            >
              Leghe Disponibili
            </SwitchOption>
          </FilterSwitch>
        </FilterSwitchWrapper>
      </FiltersSection>

      {sortedLeghe.length === 0 ? (
        <EmptyContainer>
          <div>
            <h3>Nessuna lega disponibile</h3>
            <p>Non ci sono leghe che corrispondono ai filtri selezionati.</p>
          </div>
        </EmptyContainer>
      ) : (
        <LeaguesTable>
          <Table>
            <thead>
              <tr>
                <Th 
                  $sortable 
                  $sortDirection={sortField === 'nome' ? sortDirection : null}
                  onClick={() => handleSort('nome')}
                >
                  Nome Lega
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortField === 'admin_nome' ? sortDirection : null}
                  onClick={() => handleSort('admin_nome')}
                >
                  Admin
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortField === 'modalita' ? sortDirection : null}
                  onClick={() => handleSort('modalita')}
                >
                  Modalità
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortField === 'is_pubblica' ? sortDirection : null}
                  onClick={() => handleSort('is_pubblica')}
                >
                  Tipo
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortField === 'squadre_assegnate' ? sortDirection : null}
                  onClick={() => handleSort('squadre_assegnate')}
                >
                  Squadre
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortField === 'squadre_disponibili' ? sortDirection : null}
                  onClick={() => handleSort('squadre_disponibili')}
                >
                  Disponibili
                </Th>

                <Th>Azioni</Th>
              </tr>
            </thead>
            <tbody>
              {sortedLeghe.map(lega => {
                const canJoin = canRequestJoin(lega);
                const statusMessage = getStatusMessage(lega);
                const isAdmin = isAdminOfLega(lega);
                const hasTeam = hasTeamInLega(lega);
                const teamInLega = getTeamInLega(lega.id);
                const isExpanded = expandedTeam === lega.id;
                
                return (
                  <React.Fragment key={lega.id}>
                    <tr>
                      <Td>
                        <LegaLink to={`/lega/${lega.id}`}>
                          {lega.nome}
                        </LegaLink>
                      </Td>
                      <Td>{lega.admin_nome || 'N/A'}</Td>
                      <Td>{lega?.modalita || 'N/A'}</Td>
                      <Td>
                        <StatusBadge $status={lega?.is_pubblica || false? 'pubblica' : 'privata'}>
                          {lega?.is_pubblica || false? 'Pubblica' : 'Privata'}
                        </StatusBadge>
                      </Td>
                      <Td>{lega.squadre_assegnate || 0}/{lega.numero_squadre_totali || 0}</Td>
                      <Td>{lega.squadre_disponibili || 0}</Td>

                      <Td>
                        {isAdmin ? (
                          hasTeam ? (
                            <TableActionButton 
                              $isManage={true}
                              onClick={() => handleToggleExpanded(lega.id)}
                              title="Gestisci Squadra"
                            >
                              Gestisci
                            </TableActionButton>
                          ) : (
                            <TableActionButton 
                              onClick={() => handleRichiediIngresso(lega)}
                              title="Seleziona Squadra"
                            >
                              Seleziona Squadra
                            </TableActionButton>
                          )
                        ) : (
                          <TableActionButton 
                            onClick={() => handleRichiediIngresso(lega)}
                            disabled={!canJoin}
                            title={statusMessage || 'Richiedi Ingresso'}
                          >
                            {!canJoin ? (statusMessage || 'Non Disponibile') : 'Richiedi Ingresso'}
                          </TableActionButton>
                        )}
                      </Td>
                    </tr>
                    {isExpanded && teamInLega && (
                      <ExpandedRow>
                        <ExpandedCell colSpan="7">
                          <ExpandedContent>
                            <TeamStats>
                              <StatItem>
                                <StatLabel>Squadra</StatLabel>
                                <StatValue>{teamInLega.nome}</StatValue>
                              </StatItem>
                              <StatItem>
                                <StatLabel>Lega</StatLabel>
                                <StatValue>{lega.nome}</StatValue>
                              </StatItem>
                              <StatItem>
                                <StatLabel>Admin</StatLabel>
                                <StatValue>{lega.admin_nome || 'N/A'}</StatValue>
                              </StatItem>
                              <StatItem>
                                <StatLabel>Modalità</StatLabel>
                                <StatValue>{lega?.modalita || 'N/A'}</StatValue>
                              </StatItem>
                            </TeamStats>
                            <ExpandedActionButtons>
                              <ExpandedActionButton onClick={() => navigate(`/squadra/${teamInLega.id}`)}>
                                Dettagli Squadra
                              </ExpandedActionButton>
                              <ExpandedActionButton onClick={() => navigate(`/lega/${lega.id}`)}>
                                Dettagli Lega
                              </ExpandedActionButton>
                              <ExpandedActionButton onClick={() => navigate('/area-manager')}>
                                Area Manager
                              </ExpandedActionButton>
                            </ExpandedActionButtons>
                          </ExpandedContent>
                        </ExpandedCell>
                      </ExpandedRow>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </LeaguesTable>
      )}

      {/* Popup Join League Form */}
      {showJoinForm && selectedLega && (
        <JoinLeagueForm
          lega={selectedLega}
          onClose={handleCloseJoinForm}
          onSuccess={handleRichiestaSuccess}
        />
      )}

      {/* Popup Selettore Admin */}
      {showAdminSelector && selectedLega && (
        <AdminTeamSelector
          lega={selectedLega}
          onClose={handleCloseAdminSelector}
          onSuccess={handleRichiestaSuccess}
        />
      )}
    </Container>
  );
};

export default Leghe; 