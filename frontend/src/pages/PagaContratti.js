import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLeghe } from '../api/leghe';
import { getSquadreByLega } from '../api/leghe';
import { getGiocatoriBySquadra } from '../api/giocatori';
import { splitRoles, getRoleClass } from '../utils/roleUtils';

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

const Title = styled.h1`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FilterSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const FilterForm = styled.form`
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

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
`;

const FilterButton = styled.button`
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

const ContractsSection = styled.div`
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

const ContractsTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.th`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  color: #333;
  
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

const PlayerName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const MoneyValue = styled.span`
  font-weight: 600;
  color: #28a745;
`;

const CostValue = styled.span`
  font-weight: 600;
  color: #dc3545;
`;

const TriggerBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => props.$active ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$active ? '#155724' : '#721c24'};
`;

const ActionButton = styled.button`
  background: ${props => props.pay ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.2s;
  margin-right: 0.5rem;
  
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

const PagaContratti = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [leghe, setLeghe] = useState([]);
  const [selectedLega, setSelectedLega] = useState('');
  const [squadre, setSquadre] = useState([]);
  const [selectedSquadra, setSelectedSquadra] = useState('');
  const [giocatori, setGiocatori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const res = await getLeghe(token);
        setLeghe(res.leghe);
        
        if (res.leghe?.length || 0 > 0) {
          setSelectedLega(res.leghe[0].id);
          await fetchSquadre(res.leghe[0].id);
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [token]);

  const fetchSquadre = async (legaId) => {
    try {
      const res = await getSquadreByLega(legaId, token);
      setSquadre(res.squadre);
      
      if (res.squadre?.length || 0 > 0) {
        setSelectedSquadra(res.squadre[0].id);
        await fetchGiocatori(res.squadre[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchGiocatori = async (squadraId) => {
    try {
      const res = await getGiocatoriBySquadra(squadraId, token);
      setGiocatori(res.giocatori || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLegaChange = async (legaId) => {
    setSelectedLega(legaId);
    await fetchSquadre(legaId);
  };

  const handleSquadraChange = async (squadraId) => {
    setSelectedSquadra(squadraId);
    await fetchGiocatori(squadraId);
  };

  const handlePagaContratto = async (giocatoreId) => {
    setActionMessage('');
    try {
      // TODO: Implementare la logica di pagamento contratto
      setActionMessage(`Contratto pagato con successo per il giocatore!`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTrigger = async (giocatoreId, triggerType) => {
    setActionMessage('');
    try {
      // TODO: Implementare la logica dei trigger
      setActionMessage(`Trigger ${triggerType} attivato con successo!`);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatMoney = (value) => {
    if (!value) return 'FM 0';
    return `FM ${value.toLocaleString()}`;
  };

  const getContractStats = () => {
    const contrattiScaduti = giocatori?.filter(g => g.contratto_scadenza && new Date(g.contratto_scadenza) < new Date()).length;
    const contrattiInScadenza = giocatori?.filter(g => {
      if (!g.contratto_scadenza) return false;
      const scadenza = new Date(g.contratto_scadenza);
      const oggi = new Date();
      const diffTime = scadenza - oggi;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    }).length;
    const costoContratti = giocatori?.reduce((sum, g) => sum + (g.salario || 0), 0);
    const triggerAttivi = giocatori?.filter(g => g.trigger_attivo).length;

    return {
      contrattiScaduti,
      contrattiInScadenza,
      costoContratti,
      triggerAttivi
    };
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento contratti...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  const stats = getContractStats();

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <Title>💰 Gestione Contratti e Trigger</Title>
      </Header>

      <StatsGrid>
        <StatCard color="#dc3545">
          <StatTitle>Contratti Scaduti</StatTitle>
          <StatValue>{stats.contrattiScaduti}</StatValue>
        </StatCard>
        <StatCard color="#ffc107">
          <StatTitle>In Scadenza (30gg)</StatTitle>
          <StatValue>{stats.contrattiInScadenza}</StatValue>
        </StatCard>
        <StatCard color="#28a745">
          <StatTitle>Costo Contratti</StatTitle>
          <StatValue>{formatMoney(stats.costoContratti)}</StatValue>
        </StatCard>
        <StatCard color="#667eea">
          <StatTitle>Trigger Attivi</StatTitle>
          <StatValue>{stats.triggerAttivi}</StatValue>
        </StatCard>
      </StatsGrid>

      <FilterSection>
        <FilterForm onSubmit={(e) => e.preventDefault()}>
          <FormGroup>
            <Label>Lega</Label>
            <Select
              value={selectedLega}
              onChange={(e) => handleLegaChange(e.target.value)}
            >
              <option value="">Seleziona una lega</option>
              {leghe?.map(lega => (
                <option key={lega.id} value={lega.id}>{lega?.nome || 'Nome'}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Squadra</Label>
            <Select
              value={selectedSquadra}
              onChange={(e) => handleSquadraChange(e.target.value)}
            >
              <option value="">Seleziona una squadra</option>
              {squadre?.map(squadra => (
                <option key={squadra.id} value={squadra.id}>{squadra?.nome || 'Nome'}</option>
              ))}
            </Select>
          </FormGroup>
        </FilterForm>
      </FilterSection>

      {actionMessage && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem', 
          textAlign: 'center', 
          fontWeight: '600',
          backgroundColor: actionMessage.includes('successo') ? '#d4edda' : '#f8d7da',
          color: actionMessage.includes('successo') ? '#155724' : '#721c24',
          border: `1px solid ${actionMessage.includes('successo') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {actionMessage}
        </div>
      )}

      <ContractsSection>
        <SectionTitle>📋 Contratti e Trigger</SectionTitle>
        
        {giocatori?.length || 0 === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <h3>Nessun giocatore trovato</h3>
            <p>Seleziona una squadra per visualizzare i contratti.</p>
          </div>
        ) : (
          <ContractsTable>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Giocatore</TableHeader>
                  <TableHeader>Ruolo</TableHeader>
                  <TableHeader>Salario</TableHeader>
                  <TableHeader>Scadenza Contratto</TableHeader>
                  <TableHeader>Trigger</TableHeader>
                  <TableHeader>Stato</TableHeader>
                  <TableHeader>Azioni</TableHeader>
                </tr>
              </thead>
              <tbody>
                {giocatori?.map(giocatore => {
                  const isScaduto = giocatore.contratto_scadenza && new Date(giocatore.contratto_scadenza) < new Date();
                  const inScadenza = giocatore.contratto_scadenza && !isScaduto && 
                    (new Date(giocatore.contratto_scadenza) - new Date()) / (1000 * 60 * 60 * 24) <= 30;
                  
                  return (
                    <tr key={giocatore.id}>
                      <TableCell>
                        <span
                          style={{ color: '#E67E22', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
                          onClick={() => navigate(`/giocatore/${giocatore.id}`)}
                        >
                          {giocatore?.nome || 'Nome'} {giocatore?.cognome || ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        {splitRoles(giocatore?.ruolo || 'Ruolo').map((ruolo, index) => (
                          <span key={index} className={`ruolo-badge ${getRoleClass(ruolo)}`}>{ruolo}</span>
                        ))}
                      </TableCell>
                      <TableCell>
                        <MoneyValue>{formatMoney(giocatore.salario)}</MoneyValue>
                      </TableCell>
                      <TableCell>
                        {giocatore.contratto_scadenza ? 
                          new Date(giocatore.contratto_scadenza).toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {giocatore.trigger_attivo && (
                          <TriggerBadge $active>Attivo</TriggerBadge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isScaduto ? (
                          <span style={{ color: '#dc3545', fontWeight: '600' }}>Scaduto</span>
                        ) : inScadenza ? (
                          <span style={{ color: '#ffc107', fontWeight: '600' }}>In Scadenza</span>
                        ) : (
                          <span style={{ color: '#28a745', fontWeight: '600' }}>Valido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ActionButton 
                          pay 
                          onClick={() => handlePagaContratto(giocatore.id)}
                          disabled={!isScaduto && !inScadenza}
                        >
                          Paga
                        </ActionButton>
                        {giocatore.trigger_attivo && (
                          <ActionButton 
                            onClick={() => handleTrigger(giocatore.id, 'rinnegoziazione')}
                          >
                            Trigger
                          </ActionButton>
                        )}
                      </TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </ContractsTable>
        )}
      </ContractsSection>
    </Container>
  );
};

export default PagaContratti; 