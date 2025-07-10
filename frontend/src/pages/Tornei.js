import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  text-align: center;
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

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  background: white;
  border-radius: 16px;
  padding: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const Tab = styled.button`
  flex: 1;
  padding: 1rem;
  border: none;
  background: ${props => props.$active ? 'linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#666'};
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? 'linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%)' : '#f8f9fa'};
  }
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const MatchCard = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-left: 4px solid #FFA94D;
`;

const MatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
`;

const MatchTeams = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
`;

const Team = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
`;

const TeamName = styled.span`
  color: #333;
`;

const Score = styled.div`
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  margin: 0 1rem;
`;

const VS = styled.div`
  color: #666;
  font-weight: 600;
  margin: 0 1rem;
`;

const MatchResult = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const ResultInfo = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const Winner = styled.span`
  color: #28a745;
  font-weight: 600;
`;

const Loser = styled.span`
  color: #dc3545;
  font-weight: 600;
`;

const Draw = styled.span`
  color: #ffc107;
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  border-left: 4px solid ${props => props.color || '#667eea'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
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

const Tornei = () => {
  const { legaId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('classifica');
  const [loading, setLoading] = useState(true);
  const [torneo, setTorneo] = useState(null);
  const [classifica, setClassifica] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [risultati, setRisultati] = useState([]);

  useEffect(() => {
    if (legaId) {
      loadTorneoData();
    }
  }, [legaId]);

  const loadTorneoData = async () => {
    setLoading(true);
    try {
      // Simula caricamento dati torneo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTorneo = {
        id: legaId,
        nome: 'Campionato TopLeague 2024',
        tipo: 'Campionato',
        stato: 'in_corso',
        giornate_totali: 38,
        giornata_corrente: 15,
        squadre_partecipanti: 8
      };
      
      const mockClassifica = [
        { posizione: 1, squadra: 'Bolzano', punti: 57, g_fatti: 62, g_subiti: 48, differenza: 14 },
        { posizione: 2, squadra: 'Viterbo', punti: 51, g_fatti: 62, g_subiti: 60, differenza: 2 },
        { posizione: 3, squadra: 'Roma', punti: 51, g_fatti: 54, g_subiti: 47, differenza: 7 },
        { posizione: 4, squadra: 'Palermo', punti: 50, g_fatti: 65, g_subiti: 58, differenza: 7 },
        { posizione: 5, squadra: 'Modena', punti: 45, g_fatti: 44, g_subiti: 40, differenza: 4 },
        { posizione: 6, squadra: 'Firenze', punti: 44, g_fatti: 52, g_subiti: 55, differenza: -3 },
        { posizione: 7, squadra: 'Bergamo', punti: 42, g_fatti: 42, g_subiti: 53, differenza: -11 },
        { posizione: 8, squadra: 'Taranto', punti: 33, g_fatti: 44, g_subiti: 64, differenza: -20 }
      ];
      
      const mockCalendario = [
        {
          id: 1,
          giornata: 16,
          data: '2024-01-20',
          casa: 'Bolzano',
          trasferta: 'Roma',
          orario: '15:00',
          stato: 'programmata'
        },
        {
          id: 2,
          giornata: 16,
          data: '2024-01-20',
          casa: 'Firenze',
          trasferta: 'Modena',
          orario: '15:00',
          stato: 'programmata'
        },
        {
          id: 3,
          giornata: 16,
          data: '2024-01-20',
          casa: 'Bergamo',
          trasferta: 'Taranto',
          orario: '15:00',
          stato: 'programmata'
        },
        {
          id: 4,
          giornata: 16,
          data: '2024-01-20',
          casa: 'Viterbo',
          trasferta: 'Palermo',
          orario: '15:00',
          stato: 'programmata'
        }
      ];
      
      const mockRisultati = [
        {
          id: 1,
          giornata: 15,
          data: '2024-01-13',
          casa: 'Roma',
          trasferta: 'Bolzano',
          gol_casa: 0,
          gol_trasferta: 3,
          punti_casa: 62.50,
          punti_trasferta: 78.50,
          stato: 'giocata'
        },
        {
          id: 2,
          giornata: 15,
          data: '2024-01-13',
          casa: 'Firenze',
          trasferta: 'Modena',
          gol_casa: 0,
          gol_trasferta: 0,
          punti_casa: 62.00,
          punti_trasferta: 62.50,
          stato: 'giocata'
        },
        {
          id: 3,
          giornata: 15,
          data: '2024-01-13',
          casa: 'Bergamo',
          trasferta: 'Taranto',
          gol_casa: 4,
          gol_trasferta: 2,
          punti_casa: 81.00,
          punti_trasferta: 72.50,
          stato: 'giocata'
        },
        {
          id: 4,
          giornata: 15,
          data: '2024-01-13',
          casa: 'Viterbo',
          trasferta: 'Palermo',
          gol_casa: 2,
          gol_trasferta: 1,
          punti_casa: 76.00,
          punti_trasferta: 70.00,
          stato: 'giocata'
        }
      ];
      
      setTorneo(mockTorneo);
      setClassifica(mockClassifica);
      setCalendario(mockCalendario);
      setRisultati(mockRisultati);
      
    } catch (error) {
      console.error('Errore caricamento torneo:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultDisplay = (risultato) => {
    if (risultato.gol_casa > risultato.gol_trasferta) {
      return (
        <MatchResult>
          <ResultInfo>
            <Winner>{risultato.casa} vince</Winner> - {risultato.punti_casa} punti
          </ResultInfo>
          <ResultInfo>
            {risultato.trasferta} - {risultato.punti_trasferta} punti
          </ResultInfo>
        </MatchResult>
      );
    } else if (risultato.gol_casa < risultato.gol_trasferta) {
      return (
        <MatchResult>
          <ResultInfo>
            {risultato.casa} - {risultato.punti_casa} punti
          </ResultInfo>
          <ResultInfo>
            <Winner>{risultato.trasferta} vince</Winner> - {risultato.punti_trasferta} punti
          </ResultInfo>
        </MatchResult>
      );
    } else {
      return (
        <MatchResult>
          <ResultInfo>
            <Draw>Pareggio</Draw> - {risultato.punti_casa} vs {risultato.punti_trasferta} punti
          </ResultInfo>
        </MatchResult>
      );
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>Caricamento torneo...</LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🏆 {torneo?.nome}</Title>
        <Subtitle>
          {torneo?.tipo} • Giornata {torneo?.giornata_corrente}/{torneo?.giornate_totali} • {torneo?.squadre_partecipanti} squadre
        </Subtitle>
      </Header>

      <TabsContainer>
        <Tab $active={activeTab === 'classifica'} onClick={() => setActiveTab('classifica')}>
          📊 Classifica
        </Tab>
        <Tab $active={activeTab === 'calendario'} onClick={() => setActiveTab('calendario')}>
          📅 Calendario
        </Tab>
        <Tab $active={activeTab === 'risultati'} onClick={() => setActiveTab('risultati')}>
          ⚽ Risultati
        </Tab>
      </TabsContainer>

      {activeTab === 'classifica' && (
        <ContentCard>
          <SectionTitle>📊 Classifica Campionato</SectionTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Pos</TableHeader>
                <TableHeader>Squadra</TableHeader>
                <TableHeader>Punti</TableHeader>
                <TableHeader>G.F.</TableHeader>
                <TableHeader>G.S.</TableHeader>
                <TableHeader>Diff.</TableHeader>
              </tr>
            </thead>
            <tbody>
              {classifica.map((squadra, index) => (
                <tr key={index}>
                  <TableCell>
                    <strong>{squadra.posizione}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{squadra.squadra}</strong>
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: '#28a745' }}>{squadra.punti}</strong>
                  </TableCell>
                  <TableCell>{squadra.g_fatti}</TableCell>
                  <TableCell>{squadra.g_subiti}</TableCell>
                  <TableCell style={{ 
                    color: squadra.differenza > 0 ? '#28a745' : squadra.differenza < 0 ? '#dc3545' : '#666'
                  }}>
                    {squadra.differenza > 0 ? '+' : ''}{squadra.differenza}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </ContentCard>
      )}

      {activeTab === 'calendario' && (
        <ContentCard>
          <SectionTitle>📅 Calendario - Giornata {calendario[0]?.giornata}</SectionTitle>
          {calendario.map(partita => (
            <MatchCard key={partita.id}>
              <MatchHeader>
                <span>Giornata {partita.giornata}</span>
                <span>{new Date(partita.data).toLocaleDateString('it-IT')} - {partita.orario}</span>
              </MatchHeader>
              <MatchTeams>
                <Team>
                  <TeamName>{partita.casa}</TeamName>
                </Team>
                <VS>VS</VS>
                <Team style={{ justifyContent: 'flex-end' }}>
                  <TeamName>{partita.trasferta}</TeamName>
                </Team>
              </MatchTeams>
            </MatchCard>
          ))}
        </ContentCard>
      )}

      {activeTab === 'risultati' && (
        <ContentCard>
          <SectionTitle>⚽ Ultimi Risultati - Giornata {risultati[0]?.giornata}</SectionTitle>
          {risultati.map(risultato => (
            <MatchCard key={risultato.id}>
              <MatchHeader>
                <span>Giornata {risultato.giornata}</span>
                <span>{new Date(risultato.data).toLocaleDateString('it-IT')}</span>
              </MatchHeader>
              <MatchTeams>
                <Team>
                  <TeamName>{risultato.casa}</TeamName>
                </Team>
                <Score>{risultato.gol_casa} - {risultato.gol_trasferta}</Score>
                <Team style={{ justifyContent: 'flex-end' }}>
                  <TeamName>{risultato.trasferta}</TeamName>
                </Team>
              </MatchTeams>
              {getResultDisplay(risultato)}
            </MatchCard>
          ))}
        </ContentCard>
      )}

      <StatsGrid>
        <StatCard color="#28a745">
          <StatValue>{torneo?.giornata_corrente}</StatValue>
          <StatLabel>Giornata Corrente</StatLabel>
        </StatCard>
        <StatCard color="#667eea">
          <StatValue>{torneo?.squadre_partecipanti}</StatValue>
          <StatLabel>Squadre Partecipanti</StatLabel>
        </StatCard>
        <StatCard color="#ffc107">
          <StatValue>{risultati.length}</StatValue>
          <StatLabel>Partite Giocate</StatLabel>
        </StatCard>
        <StatCard color="#dc3545">
          <StatValue>{calendario.length}</StatValue>
          <StatLabel>Prossime Partite</StatLabel>
        </StatCard>
      </StatsGrid>
    </Container>
  );
};

export default Tornei; 