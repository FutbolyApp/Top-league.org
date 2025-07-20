import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getDettaglioTorneo } from '../api/tornei';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  color: #2d3748;
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #718096;
  margin: 0;
  font-size: 1.1rem;
`;

const TorneoInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const InfoCard = styled.div`
  background: #f7fafc;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const InfoLabel = styled.div`
  font-size: 0.8rem;
  color: #718096;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 600;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const CardTitle = styled.h3`
  color: #2d3748;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SquadreGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const SquadraCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }
`;

const SquadraHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SquadraName = styled.h4`
  color: #2d3748;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const SquadraOwner = styled.span`
  background: #edf2f7;
  color: #4a5568;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const SquadraStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatLabel = styled.span`
  font-size: 0.8rem;
  color: #718096;
  font-weight: 500;
`;

const StatValue = styled.span`
  font-size: 0.9rem;
  color: #2d3748;
  font-weight: 600;
`;

const ClassificaTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  font-size: 0.9rem;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
  color: #2d3748;
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const Posizione = styled.span`
  background: ${props => {
    if (props.$pos === 1) return 'linear-gradient(135deg, #ffd700, #ffed4e)';
    if (props.$pos === 2) return 'linear-gradient(135deg, #c0c0c0, #e2e8f0)';
    if (props.$pos === 3) return 'linear-gradient(135deg, #cd7f32, #d69e2e)';
    return '#f7fafc';
  }};
  color: ${props => props.$pos <= 3 ? '#2d3748' : '#718096'};
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
  display: inline-block;
`;

const RisultatiList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RisultatoCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
`;

const RisultatoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Giornata = styled.span`
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const Data = styled.span`
  font-size: 0.8rem;
  color: #718096;
`;

const RisultatoMatch = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const Squadra = styled.div`
  flex: 1;
  text-align: ${props => props.$align || 'left'};
  font-weight: 600;
  color: #2d3748;
`;

const Punteggio = styled.div`
  background: #f7fafc;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  color: #2d3748;
  min-width: 60px;
  text-align: center;
`;

const Separator = styled.div`
  font-weight: 700;
  color: #718096;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: white;
  margin: 3rem 0;
`;

const EmptyState = styled.div`
  text-align: center;
  margin: 3rem 0;
  color: #718096;
  
  h3 {
    color: #2d3748;
    margin-bottom: 0.5rem;
  }
`;

const BackButton = styled.button`
  background: linear-gradient(135deg, #718096, #4a5568);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(113, 128, 150, 0.4);
  }
`;

const TorneoDetail = () => {
  const { torneoId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [torneo, setTorneo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTorneo();
  }, [torneoId]);

  const loadTorneo = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getDettaglioTorneo(torneoId, token);
      setTorneo(response.torneo);
    } catch (error) {
      console.error('Errore caricamento torneo:', error);
      setError('Errore nel caricamento del torneo. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Caricamento torneo...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Content>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            padding: '2rem', 
            borderRadius: '20px',
            textAlign: 'center',
            color: '#e53e3e'
          }}>
            {error}
          </div>
        </Content>
      </Container>
    );
  }

  if (!torneo) {
    return (
      <Container>
        <Content>
          <EmptyState>
            <h3>Torneo non trovato</h3>
            <p>Il torneo richiesto non esiste o non è accessibile.</p>
          </EmptyState>
        </Content>
      </Container>
    );
  }

  // Simula dati di classifica e risultati (in futuro verranno dal backend)
  const classifica = torneo.squadre_partecipanti?.map((squadra, index) => ({
    posizione: index + 1,
    squadra: squadra.nome,
    proprietario: squadra.proprietario_username || 'N/A',
    punti: Math.floor(Math.random() * 50) + 10,
    partite_giocate: Math.floor(Math.random() * 20) + 5,
    vittorie: Math.floor(Math.random() * 10) + 2,
    pareggi: Math.floor(Math.random() * 5) + 1,
    sconfitte: Math.floor(Math.random() * 5) + 1,
    gol_fatti: Math.floor(Math.random() * 30) + 10,
    gol_subiti: Math.floor(Math.random() * 25) + 8
  })).sort((a, b) => b.punti - a.punti) || [];

  const risultati = [
    {
      giornata: 1,
      data: '15/01/2024',
      casa: 'Squadra A',
      trasferta: 'Squadra B',
      gol_casa: 2,
      gol_trasferta: 1
    },
    {
      giornata: 1,
      data: '15/01/2024',
      casa: 'Squadra C',
      trasferta: 'Squadra D',
      gol_casa: 0,
      gol_trasferta: 0
    },
    {
      giornata: 2,
      data: '22/01/2024',
      casa: 'Squadra B',
      trasferta: 'Squadra C',
      gol_casa: 1,
      gol_trasferta: 3
    }
  ];

  return (
    <Container>
      <Content>
        <BackButton onClick={() => navigate(-1)}>
          ← Torna indietro
        </BackButton>

        <Header>
          <Title>{torneo.nome}</Title>
          <Subtitle>{torneo.descrizione || 'Nessuna descrizione disponibile'}</Subtitle>
          
          <TorneoInfo>
            <InfoCard>
              <InfoLabel>Tipo</InfoLabel>
              <InfoValue>{torneo.tipo}</InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>Formato</InfoLabel>
              <InfoValue>{torneo.formato}</InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>Stato</InfoLabel>
              <InfoValue>
                {torneo.stato === 'in_corso' && 'In Corso'}
                {torneo.stato === 'programmato' && 'Programmato'}
                {torneo.stato === 'completato' && 'Completato'}
              </InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>Squadre</InfoLabel>
              <InfoValue>{torneo.squadre_partecipanti?.length || 0}</InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>Giornate</InfoLabel>
              <InfoValue>{torneo.giornate_totali}</InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>Data Inizio</InfoLabel>
              <InfoValue>{torneo.data_inizio ? new Date(torneo.data_inizio).toLocaleDateString('it-IT') : 'N/A'}</InfoValue>
            </InfoCard>
          </TorneoInfo>
        </Header>

        <MainGrid>
          {/* Classifica */}
          <Card>
            <CardTitle>Classifica</CardTitle>
            
            {classifica.length === 0 ? (
              <EmptyState>
                <h3>Nessuna squadra</h3>
                <p>Non ci sono squadre iscritte a questo torneo.</p>
              </EmptyState>
            ) : (
              <ClassificaTable>
                <thead>
                  <tr>
                    <Th>Pos</Th>
                    <Th>Squadra</Th>
                    <Th>P</Th>
                    <Th>PG</Th>
                    <Th>V</Th>
                    <Th>P</Th>
                    <Th>S</Th>
                    <Th>GF</Th>
                    <Th>GS</Th>
                  </tr>
                </thead>
                <tbody>
                  {classifica.map((item, index) => (
                    <Tr key={index}>
                      <Td>
                        <Posizione $pos={item.posizione}>{item.posizione}</Posizione>
                      </Td>
                      <Td>
                        <div>
                          <div style={{ fontWeight: '600', color: '#2d3748' }}>
                            {item.squadra}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                            {item.proprietario}
                          </div>
                        </div>
                      </Td>
                      <Td style={{ fontWeight: '700', color: '#2d3748' }}>{item.punti}</Td>
                      <Td>{item.partite_giocate}</Td>
                      <Td style={{ color: '#28a745' }}>{item.vittorie}</Td>
                      <Td style={{ color: '#ffc107' }}>{item.pareggi}</Td>
                      <Td style={{ color: '#dc3545' }}>{item.sconfitte}</Td>
                      <Td>{item.gol_fatti}</Td>
                      <Td>{item.gol_subiti}</Td>
                    </Tr>
                  ))}
                </tbody>
              </ClassificaTable>
            )}
          </Card>

          {/* Ultimi Risultati */}
          <Card>
            <CardTitle>Ultimi Risultati</CardTitle>
            
            {risultati.length === 0 ? (
              <EmptyState>
                <h3>Nessun risultato</h3>
                <p>Non ci sono ancora risultati disponibili.</p>
              </EmptyState>
            ) : (
              <RisultatiList>
                {risultati.map((risultato, index) => (
                  <RisultatoCard key={index}>
                    <RisultatoHeader>
                      <Giornata>Giornata {risultato.giornata}</Giornata>
                      <Data>{risultato.data}</Data>
                    </RisultatoHeader>
                    <RisultatoMatch>
                      <Squadra>{risultato.casa}</Squadra>
                      <Punteggio>{risultato.gol_casa}</Punteggio>
                      <Separator>-</Separator>
                      <Punteggio>{risultato.gol_trasferta}</Punteggio>
                      <Squadra $align="right">{risultato.trasferta}</Squadra>
                    </RisultatoMatch>
                  </RisultatoCard>
                ))}
              </RisultatiList>
            )}
          </Card>
        </MainGrid>

        {/* Squadre Partecipanti */}
        <Card style={{ marginTop: '2rem' }}>
          <CardTitle>Squadre Partecipanti</CardTitle>
          
          {torneo.squadre_partecipanti?.length === 0 ? (
            <EmptyState>
              <h3>Nessuna squadra</h3>
              <p>Non ci sono squadre iscritte a questo torneo.</p>
            </EmptyState>
          ) : (
            <SquadreGrid>
              {torneo.squadre_partecipanti?.map((squadra, index) => (
                <SquadraCard key={squadra?.id || index}>
                  <SquadraHeader>
                    <SquadraName>{squadra?.nome}</SquadraName>
                    <SquadraOwner>
                      {squadra?.proprietario_username || 'Non assegnata'}
                    </SquadraOwner>
                  </SquadraHeader>
                  
                  <SquadraStats>
                    <StatItem>
                      <StatLabel>Valore Squadra</StatLabel>
                      <StatValue>FM {squadra?.valore_squadra?.toLocaleString() || '0'}</StatValue>
                    </StatItem>
                    <StatItem>
                      <StatLabel>Casse Societarie</StatLabel>
                      <StatValue>FM {squadra?.casse_societarie?.toLocaleString() || '0'}</StatValue>
                    </StatItem>
                    <StatItem>
                      <StatLabel>Giocatori</StatLabel>
                      <StatValue>{squadra?.numero_giocatori || 'N/A'}</StatValue>
                    </StatItem>
                    <StatItem>
                      <StatLabel>Stato</StatLabel>
                      <StatValue>
                        {squadra?.is_orfana ? 'Disponibile' : 'Assegnata'}
                      </StatValue>
                    </StatItem>
                  </SquadraStats>
                </SquadraCard>
              ))}
            </SquadreGrid>
          )}
        </Card>
      </Content>
    </Container>
  );
};

export default TorneoDetail; 