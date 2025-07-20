import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getGiocatoriByIds } from '../api/giocatori';
import { getLeghe } from '../api/leghe';
import { splitRoles, getRoleClass } from '../utils/roleUtils';

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

const FilterSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const FilterForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
`;

const Select = styled.select`
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

const PlayersSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const PlayersTable = styled.div`
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
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
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
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #e5e5e7;
  color: #1d1d1f;
  text-align: center;
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

const MoneyValue = styled.span`
  font-weight: 600;
  color: #28a745;
`;

const CostValue = styled.span`
  font-weight: 600;
  color: #dc3545;
`;

const ViewButton = styled.button`
  color: #FFA94D;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
  background: none;
  border: none;
  padding: 0;
  
  &:hover {
    color: #FF8C00;
    text-decoration: underline;
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

const GiocatoriManager = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [giocatori, setGiocatori] = useState([]);
  const [leghe, setLeghe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLega, setSelectedLega] = useState('');
  const [filters, setFilters] = useState({
    nome: '',
    ruolo: '',
    squadra_reale: '',
    eta_min: '',
    eta_max: '',
    quotazione_min: '',
    quotazione_max: ''
  });

  const fetchGiocatori = useCallback(async (legaId) => {
    try {
      // Per ora carichiamo tutti i giocatori della lega
      // In futuro potremmo implementare una paginazione
      const res = await getGiocatoriByIds([], token); // Array vuoto per tutti
      const giocatori = res?.data?.giocatori || res?.giocatori || [];
      setGiocatori(giocatori);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const legheRes = await getLeghe(token);
        setLeghe(legheRes?.data?.leghe || legheRes?.leghe || []);
        
        const leghe = legheRes?.data?.leghe || legheRes?.leghe || [];
        if (leghe.length > 0) {
          setSelectedLega(leghe[0]?.id);
          await fetchGiocatori(leghe[0]?.id);
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [token, fetchGiocatori]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  function applyFilters() {
    // Implementa la logica di filtro
    console.log('Applicando filtri:', filters);
  }

  const formatMoney = (value) => {
    if (!value) return 'FM 0';
    return `FM ${value.toLocaleString()}`;
  };

  const ruoli = ['P', 'D', 'C', 'A'];

  // Per ordinamento Mantra:
  const roleOrderMantra = ['P', 'DC', 'DD', 'DS', 'E', 'M', 'C', 'B', 'T', 'W', 'A', 'PC'];
  const sortPlayersByRole = (players) => {
    if (!players) return [];
    const isMantra = leghe?.find(lega => lega.id === selectedLega)?.modalita?.includes('Mantra');
    const roleOrder = isMantra ? roleOrderMantra : ['P', 'D', 'C', 'A'];
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

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento giocatori...</LoadingContainer>
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
        <Title>⚽ Gestione Giocatori</Title>
      </Header>

      <FilterSection>
        <FilterForm onSubmit={(e) => e.preventDefault()}>
          <FormGroup>
            <Label>Lega</Label>
            <Select
              value={selectedLega}
              onChange={(e) => setSelectedLega(e.target.value)}
            >
              <option value="">Seleziona una lega</option>
              {leghe.map(lega => (
                <option key={lega.id} value={lega.id}>{lega.nome}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Nome</Label>
            <Input
              name="nome"
              placeholder="Cerca per nome..."
              value={filters.nome}
              onChange={handleFilterChange}
            />
          </FormGroup>
          <FormGroup>
            <Label>Ruolo</Label>
            <Select
              name="ruolo"
              value={filters.ruolo}
              onChange={handleFilterChange}
            >
              <option value="">Tutti i ruoli</option>
              {ruoli.map(ruolo => (
                <option key={ruolo} value={ruolo}>{ruolo}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Squadra Reale</Label>
            <Input
              name="squadra_reale"
              placeholder="Squadra reale..."
              value={filters.squadra_reale}
              onChange={handleFilterChange}
            />
          </FormGroup>

          <FormGroup>
            <Label>Quotazione Min</Label>
            <Input
              name="quotazione_min"
              type="number"
              placeholder="Quotazione minima"
              value={filters.quotazione_min}
              onChange={handleFilterChange}
            />
          </FormGroup>
          <FormGroup>
            <Label>Quotazione Max</Label>
            <Input
              name="quotazione_max"
              type="number"
              placeholder="Quotazione massima"
              value={filters.quotazione_max}
              onChange={handleFilterChange}
            />
          </FormGroup>
          <FilterButton onClick={applyFilters}>
            Filtra
          </FilterButton>
        </FilterForm>
      </FilterSection>

      <PlayersSection>
        {giocatori.length === 0 ? (
          <EmptyContainer>
            <div>
              <h3>Nessun giocatore trovato</h3>
              <p>Non ci sono giocatori con i criteri selezionati.</p>
            </div>
          </EmptyContainer>
        ) : (
          <PlayersTable>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Giocatore</TableHeader>
                  <TableHeader>Ruolo</TableHeader>
                  <TableHeader>Squadra Reale</TableHeader>
                  <TableHeader>Cantera</TableHeader>
                  <TableHeader>Quotazione</TableHeader>
                  <TableHeader>Salario</TableHeader>
                  <TableHeader>Costo Attuale</TableHeader>
                  <TableHeader>Squadra Fantasy</TableHeader>
                  <TableHeader>Azioni</TableHeader>
                </tr>
              </thead>
              <tbody>
                {sortPlayersByRole(giocatori).map(giocatore => (
                  <tr key={giocatore.id}>
                    <TableCell>
                      <span
                        style={{ color: '#ff9500', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
                        onClick={() => navigate(`/giocatore/${giocatore.id}`)}
                      >
                        {giocatore.nome} {giocatore.cognome}
                      </span>
                    </TableCell>
                    <TableCell>
                      <PlayerRole>
                        {splitRoles(giocatore.ruolo).map((ruolo, index) => (
                          <span key={index} className={`ruolo-badge ${getRoleClass(ruolo)}`}>{ruolo}</span>
                        ))}
                      </PlayerRole>
                    </TableCell>
                    <TableCell>{giocatore.squadra_reale}</TableCell>
                    <TableCell>{giocatore.cantera ? '✓' : ''}</TableCell>
                    <TableCell>{giocatore.quotazione_attuale}</TableCell>
                    <TableCell>
                      <CostValue>{formatMoney(giocatore.salario)}</CostValue>
                    </TableCell>
                    <TableCell>
                      <MoneyValue>{formatMoney(giocatore.costo_attuale)}</MoneyValue>
                    </TableCell>
                    <TableCell>{giocatore.squadra_nome || 'N/A'}</TableCell>
                    <TableCell>
                      <ViewButton onClick={() => navigate(`/giocatore/${giocatore.id}`)}>
                        Visualizza
                      </ViewButton>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </PlayersTable>
        )}
      </PlayersSection>
    </Container>
  );
};

export default GiocatoriManager; 