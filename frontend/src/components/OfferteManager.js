import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getOfferteByLega, updateOffertaStatus } from '../api/offerte';
import { getLeghe } from '../api/leghe';
import { getGiocatoriByIds } from '../api/giocatori';
import { getSquadreByIds } from '../api/squadre';

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

const OffersSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const OffersTable = styled.div`
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
`;

const PlayerName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const TeamName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const MoneyValue = styled.span`
  font-weight: 600;
  color: #28a745;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'accettata': return '#d4edda';
      case 'rifiutata': return '#f8d7da';
      case 'in_attesa': return '#fff3cd';
      default: return '#f8f9fa';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'accettata': return '#155724';
      case 'rifiutata': return '#721c24';
      case 'in_attesa': return '#856404';
      default: return '#666';
    }
  }};
`;

const ActionButton = styled.button`
  background: ${props => props.accept ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)'};
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
  background: ${props => props.success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.success ? '#155724' : '#721c24'};
`;

const OfferteManager = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [leghe, setLeghe] = useState([]);
  const [selectedLega, setSelectedLega] = useState('');
  const [offerte, setOfferte] = useState([]);
  const [giocatori, setGiocatori] = useState([]);
  const [squadre, setSquadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const legheRes = await getLeghe(token);
      const leghe = legheRes?.data?.leghe || legheRes?.leghe || [];
      setLeghe(leghe);
      
      if (leghe.length > 0) {
        setSelectedLega(leghe[0]?.id);
        await fetchOfferte(leghe[0]?.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchOfferte = async (legaId) => {
    try {
      const res = await getOfferteByLega(legaId, token);
      setOfferte(res.offerte);
      
      // Carica dati correlati
      const giocatoriIds = res.offerte.map(o => o.giocatore_id);
      const squadreIds = Array.from(new Set(res.offerte.flatMap(o => [o.squadra_mittente_id, o.squadra_destinatario_id])));
      
      if (giocatoriIds.length > 0) {
        const giocatoriRes = await getGiocatoriByIds(giocatoriIds, token);
        setGiocatori(giocatoriRes.giocatori);
      }
      
      if (squadreIds.length > 0) {
        const squadreRes = await getSquadreByIds(squadreIds, token);
        setSquadre(squadreRes.squadre);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOffertaAction = async (offertaId, status) => {
    setActionMessage('');
    try {
      await updateOffertaStatus(offertaId, status, token);
      setActionMessage(`Offerta ${status === 'accettata' ? 'accettata' : 'rifiutata'} con successo!`);
      await fetchOfferte(selectedLega);
    } catch (err) {
      setError(err.message);
    }
  };

  const getFilteredOfferte = () => {
    if (selectedLega === 'ricevute') {
      return offerte.filter(o => o.squadra_destinatario_id === user.squadra_id);
    } else if (selectedLega === 'inviate') {
      return offerte.filter(o => o.squadra_mittente_id === user.squadra_id);
    }
    return offerte;
  };

  const getGiocatore = (id) => giocatori.find(gioc => gioc.id === id);
  const getSquadra = (id) => squadre.find(s => s.id === id);

  const handleFilter = async () => {
    if (!selectedLega) return;
    await fetchOfferte(selectedLega);
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento offerte...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  const filteredOfferte = getFilteredOfferte();

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <Title>💰 Gestione Offerte</Title>
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
            <Label>Stato</Label>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tutti gli stati</option>
              <option value="in_attesa">In Attesa</option>
              <option value="accettata">Accettata</option>
              <option value="rifiutata">Rifiutata</option>
            </Select>
          </FormGroup>
          <FilterButton onClick={handleFilter}>
            Filtra
          </FilterButton>
        </FilterForm>
      </FilterSection>

      {actionMessage && (
        <Message success={actionMessage.includes('successo')}>
          {actionMessage}
        </Message>
      )}

      <OffersSection>
        {filteredOfferte.length === 0 ? (
          <EmptyContainer>
            <div>
              <h3>Nessuna offerta trovata</h3>
              <p>Non ci sono offerte con i criteri selezionati.</p>
            </div>
          </EmptyContainer>
        ) : (
          <OffersTable>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Giocatore</TableHeader>
                  <TableHeader>Squadra Mittente</TableHeader>
                  <TableHeader>Squadra Destinataria</TableHeader>
                  <TableHeader>Tipo</TableHeader>
                  <TableHeader>Valore</TableHeader>
                  <TableHeader>Stato</TableHeader>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Azioni</TableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredOfferte.map(offerta => {
                  const giocatore = getGiocatore(offerta.giocatore_id);
                  const squadraMittente = getSquadra(offerta.squadra_mittente_id);
                  const squadraDestinatario = getSquadra(offerta.squadra_destinatario_id);
                  
                  return (
                    <tr key={offerta.id}>
                      <TableCell>
                        <PlayerName>{giocatore?.nome || 'Giocatore non trovato'}</PlayerName>
                      </TableCell>
                      <TableCell>
                        <TeamName>{squadraMittente?.nome || 'Squadra non trovata'}</TeamName>
                      </TableCell>
                      <TableCell>
                        <TeamName>{squadraDestinatario?.nome || 'Squadra non trovata'}</TeamName>
                      </TableCell>
                      <TableCell>{offerta.tipo}</TableCell>
                      <TableCell>
                        <MoneyValue>{offerta.valore ? `FM ${offerta.valore.toLocaleString()}` : 'FM 0'}</MoneyValue>
                      </TableCell>
                      <TableCell>
                        <StatusBadge $status={offerta.stato}>
                          {offerta.stato.toUpperCase()}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{new Date(offerta.data_creazione).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {offerta.stato === 'in_attesa' && (
                          <>
                            <ActionButton 
                              accept 
                              onClick={() => handleOffertaAction(offerta.id, 'accettata')}
                            >
                              Accetta
                            </ActionButton>
                            <ActionButton 
                              onClick={() => handleOffertaAction(offerta.id, 'rifiutata')}
                            >
                              Rifiuta
                            </ActionButton>
                          </>
                        )}
                      </TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </OffersTable>
        )}
      </OffersSection>
    </Container>
  );
};

export default OfferteManager; 