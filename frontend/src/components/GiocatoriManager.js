import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getGiocatoriByIds } from '../api/giocatori';
import { getLeghe } from '../api/leghe';

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
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: #e3f2fd;
  color: #1976d2;
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
  background: #ff9500;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    background: #e6850e;
    transform: translateY(-1px);
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
      setGiocatori(res.giocatori || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [legheRes] = await Promise.all([
          getLeghe(token)
        ]);
        setLeghe(legheRes.leghe);
        
        if (legheRes.leghe.length > 0) {
          setSelectedLega(legheRes.leghe[0].id);
          await fetchGiocatori(legheRes.leghe[0].id);
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
            <Label>Età Min</Label>
            <Input
              name="eta_min"
              type="number"
              placeholder="Età minima"
              value={filters.eta_min}
              onChange={handleFilterChange}
            />
          </FormGroup>
          <FormGroup>
            <Label>Età Max</Label>
            <Input
              name="eta_max"
              type="number"
              placeholder="Età massima"
              value={filters.eta_max}
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
                  <TableHeader>Età</TableHeader>
                  <TableHeader>Quotazione</TableHeader>
                  <TableHeader>Salario</TableHeader>
                  <TableHeader>Costo Attuale</TableHeader>
                  <TableHeader>Squadra Fantasy</TableHeader>
                  <TableHeader>Azioni</TableHeader>
                </tr>
              </thead>
              <tbody>
                {giocatori.map(giocatore => (
                  <tr key={giocatore.id}>
                    <TableCell>
                      <PlayerName>{giocatore.nome} {giocatore.cognome}</PlayerName>
                    </TableCell>
                    <TableCell>
                      <PlayerRole>{giocatore.ruolo}</PlayerRole>
                    </TableCell>
                    <TableCell>{giocatore.squadra_reale}</TableCell>
                    <TableCell>{giocatore.eta}</TableCell>
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