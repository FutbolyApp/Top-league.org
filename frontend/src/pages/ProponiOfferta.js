import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getSquadreByLega } from '../api/leghe';
import { getGiocatoriByLega } from '../api/giocatori';

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

const TeamCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const TeamName = styled.h3`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  font-weight: 700;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: ${props => {
    switch (props.type) {
      case 'trasferimento': return 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      case 'prestito': return 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)';
      case 'contatta': return 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
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

const ProponiOfferta = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const squadraId = searchParams.get('squadra');
  
  const [squadre, setSquadre] = useState([]);
  const [giocatori, setGiocatori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        // Prima ottieni la lega della squadra
        const squadraRes = await fetch(`http://localhost:3001/api/squadre/${squadraId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const squadraData = await squadraRes.json();
        
        if (!squadraRes.ok) throw new Error(squadraData.error || 'Errore caricamento squadra');
        
        const legaId = squadraData.squadra.lega_id;
        
        // Poi carica tutte le squadre e giocatori della lega
        const [squadreRes, giocatoriRes] = await Promise.all([
          getSquadreByLega(legaId, token),
          getGiocatoriByLega(legaId, token)
        ]);
        
        setSquadre(squadreRes.squadre.filter(s => s.id !== parseInt(squadraId)));
        setGiocatori(giocatoriRes.giocatori);
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
    navigate(`/proponi-trasferimento?giocatore=${giocatore.id}&squadra=${squadraId}`);
  };

  const handleProponiPrestito = (giocatore) => {
    navigate(`/proponi-prestito?giocatore=${giocatore.id}&squadra=${squadraId}`);
  };

  const handleContattaSquadra = (squadra) => {
    navigate(`/contatta-squadra?squadra=${squadra.id}&mittente=${squadraId}`);
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
        
        {squadre.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Nessuna altra squadra disponibile in questa lega
          </div>
        ) : (
          squadre.map(squadra => {
            const giocatoriSquadra = giocatori.filter(g => g.squadra_id === squadra.id);
            
            return (
              <TeamCard key={squadra.id}>
                <TeamName>{squadra.nome}</TeamName>
                
                <ActionButtons>
                  <ActionButton 
                    type="contatta"
                    onClick={() => handleContattaSquadra(squadra)}
                  >
                    Contatta Squadra
                  </ActionButton>
                </ActionButtons>
                
                {giocatoriSquadra.length > 0 && (
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
                          <TableHeader>Azioni</TableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {giocatoriSquadra.map(giocatore => (
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
                              <MoneyValue>{formatMoney(giocatore.salario)}</MoneyValue>
                            </TableCell>
                            <TableCell>
                              <MoneyValue>{formatMoney(giocatore.costo_attuale)}</MoneyValue>
                            </TableCell>
                            <TableCell>
                              <ActionButtons>
                                <ActionButton 
                                  type="trasferimento"
                                  onClick={() => handleProponiTrasferimento(giocatore)}
                                >
                                  Proponi Trasferimento
                                </ActionButton>
                                <ActionButton 
                                  type="prestito"
                                  onClick={() => handleProponiPrestito(giocatore)}
                                >
                                  Proponi Prestito
                                </ActionButton>
                              </ActionButtons>
                            </TableCell>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </PlayersTable>
                )}
              </TeamCard>
            );
          })
        )}
      </TeamsSection>
    </Container>
  );
};

export default ProponiOfferta; 