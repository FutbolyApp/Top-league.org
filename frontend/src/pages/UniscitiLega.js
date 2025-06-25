import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLeghe, getRichiesteUtente } from '../api/leghe';
import { getSquadreByUtente } from '../api/squadre';
import RichiestaForm from '../components/RichiestaForm';
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
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  color: #333;
  margin: 0;
  font-size: 2rem;
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SearchSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const SearchForm = styled.form`
  display: flex;
  gap: 1rem;
  align-items: end;
`;

const FormGroup = styled.div`
  flex: 1;
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
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
`;

const SearchButton = styled.button`
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
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
  cursor: pointer;
  user-select: none;
  position: relative;
  
  &:hover {
    background: #e9ecef;
  }
  
  ${props => props.$sortable && `
    &::after {
      content: '${props.$sortDirection === 'asc' ? '▲' : props.$sortDirection === 'desc' ? '▼' : '↕'}';
      position: absolute;
      right: 0.5rem;
      color: #666;
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

const ActionButton = styled.button`
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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

const UniscitiLega = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [leghe, setLeghe] = useState([]);
  const [filteredLeghe, setFilteredLeghe] = useState([]);
  const [richiesteUtente, setRichiesteUtente] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModalita, setSelectedModalita] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRichiestaForm, setShowRichiestaForm] = useState(false);
  const [selectedLega, setSelectedLega] = useState(null);
  const [showAdminSelector, setShowAdminSelector] = useState(false);
  const [squadre, setSquadre] = useState([]);
  
  // Stato per l'ordinamento
  const [sortField, setSortField] = useState('nome');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [legheRes, richiesteRes] = await Promise.all([
          getLeghe(token),
          getRichiesteUtente(token)
        ]);
        setLeghe(legheRes.leghe);
        setFilteredLeghe(legheRes.leghe);
        setRichiesteUtente(richiesteRes.richieste || []);
        const squadreRes = await getSquadreByUtente(token);
        setSquadre(squadreRes.squadre);
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

  useEffect(() => {
    let filtered = leghe;
    
    if (searchTerm) {
      filtered = filtered.filter(lega => 
        lega.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lega.admin_nome?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedModalita) {
      filtered = filtered.filter(lega => lega.modalita === selectedModalita);
    }
    
    // Applica ordinamento
    filtered = sortLeghe(filtered);
    
    setFilteredLeghe(filtered);
  }, [leghe, searchTerm, selectedModalita, sortField, sortDirection]);

  const handleRichiediIngresso = (lega) => {
    // Se è admin della lega, mostra il selettore diretto
    if (isAdminOfLega(lega)) {
      setSelectedLega(lega);
      setShowAdminSelector(true);
      return;
    }
    
    // Per utenti normali, verifica se può richiedere
    if (!canRequestJoin(lega)) {
      const message = getStatusMessage(lega);
      setError(message);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setSelectedLega(lega);
    setShowRichiestaForm(true);
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
      setFilteredLeghe(legheRes.leghe);
      setRichiesteUtente(richiesteRes.richieste || []);
      setSquadre(squadreRes.squadre || []);
    } catch (err) {
      console.error('Errore nel ricaricamento dati:', err);
    }
  };

  const handleCloseRichiestaForm = () => {
    setShowRichiestaForm(false);
    setSelectedLega(null);
  };

  const handleCloseAdminSelector = () => {
    setShowAdminSelector(false);
    setSelectedLega(null);
  };

  const modalitaOptions = [...new Set(leghe.map(lega => lega.modalita))];

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento leghe disponibili...</LoadingContainer>
    </Container>
  );

  if (error && !successMessage) return (
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
        <Title>🔗 Unisciti a una Lega</Title>
      </Header>

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

      <SearchSection>
        <SearchForm onSubmit={(e) => e.preventDefault()}>
          <FormGroup>
            <Label>Cerca Lega</Label>
            <Input
              type="text"
              placeholder="Nome lega o admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>Modalità</Label>
            <Select
              value={selectedModalita}
              onChange={(e) => setSelectedModalita(e.target.value)}
            >
              <option value="">Tutte le modalità</option>
              {modalitaOptions.map(modalita => (
                <option key={modalita} value={modalita}>{modalita}</option>
              ))}
            </Select>
          </FormGroup>
          <SearchButton type="submit">
            Cerca
          </SearchButton>
        </SearchForm>
      </SearchSection>

      {filteredLeghe.length === 0 ? (
        <EmptyContainer>
          <div>
            <h3>Nessuna lega trovata</h3>
            <p>Non ci sono leghe disponibili con i criteri di ricerca selezionati.</p>
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
              {filteredLeghe.map(lega => {
                const canJoin = canRequestJoin(lega);
                const statusMessage = getStatusMessage(lega);
                
                return (
                  <tr key={lega.id}>
                    <Td>
                      <LegaLink to={`/lega/${lega.id}`}>
                        {lega.nome}
                      </LegaLink>
                    </Td>
                    <Td>{lega.admin_nome || 'N/A'}</Td>
                    <Td>{lega.modalita}</Td>
                    <Td>
                      <StatusBadge $status={lega.is_pubblica ? 'pubblica' : 'privata'}>
                        {lega.is_pubblica ? 'Pubblica' : 'Privata'}
                      </StatusBadge>
                    </Td>
                    <Td>{lega.squadre_assegnate || 0}/{lega.numero_squadre_totali || 0}</Td>
                    <Td>{lega.squadre_disponibili || 0}</Td>
                    <Td>
                      {lega.admin_id === user?.id ? (
                        hasTeamInLega(lega) ? (
                          <ActionButton 
                            onClick={() => navigate('/area-manager')}
                            title="Gestisci Squadra"
                          >
                            Gestisci
                          </ActionButton>
                        ) : (
                          <ActionButton 
                            onClick={() => handleRichiediIngresso(lega)}
                            title="Seleziona Squadra"
                          >
                            Seleziona Squadra
                          </ActionButton>
                        )
                      ) : (
                        <ActionButton 
                          onClick={() => handleRichiediIngresso(lega)}
                          disabled={!canJoin}
                          title={statusMessage || 'Richiedi Ingresso'}
                        >
                          {!canJoin ? (statusMessage || 'Non Disponibile') : 'Richiedi Ingresso'}
                        </ActionButton>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </LeaguesTable>
      )}

      {/* Popup Richiesta Form */}
      <RichiestaForm
        lega={selectedLega}
        isOpen={showRichiestaForm}
        onClose={handleCloseRichiestaForm}
        onSuccess={handleRichiestaSuccess}
      />

      {/* Popup Selettore Squadre */}
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

export default UniscitiLega; 