import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from './AuthContext';
import { getLeghe } from '../api/leghe';
import { getSquadreByLega } from '../api/squadre';
import { getGiocatoriByLega } from '../api/giocatori';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: #333;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
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

const StatChange = styled.div`
  font-size: 0.8rem;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
  margin-top: 0.5rem;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LeagueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const LeagueCard = styled.div`
  border: 2px solid #eee;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
  }
`;

const LeagueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const LeagueName = styled.h4`
  margin: 0;
  color: #333;
`;

const LeagueStatus = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.public ? '#d4edda' : '#fff3cd'};
  color: ${props => props.public ? '#155724' : '#856404'};
`;

const LeagueStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const LeagueStat = styled.div`
  text-align: center;
  
  h5 {
    margin: 0 0 0.25rem 0;
    color: #666;
    font-size: 0.8rem;
    text-transform: uppercase;
  }
  
  p {
    margin: 0;
    color: #333;
    font-weight: 600;
    font-size: 1.1rem;
  }
`;

const LeagueButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const StandingsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #eee;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  color: #333;
`;

const PositionCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  font-weight: 700;
  color: #333;
  text-align: center;
`;

const TopPlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const PlayerCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const PlayerAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.5rem;
  margin: 0 auto 0.5rem auto;
`;

const PlayerName = styled.h4`
  margin: 0 0 0.25rem 0;
  color: #333;
`;

const PlayerDetails = styled.p`
  margin: 0;
  color: #666;
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
  
  h3 {
    margin-bottom: 1rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const BigButton = styled.button`
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  color: white;
  border: none;
  padding: 1.2rem 2.5rem;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255,140,66,0.08);
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 8px 24px rgba(255,140,66,0.15);
  }
`;

const TeamStatus = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.orphan ? '#d4edda' : '#fff3cd'};
  color: ${props => props.orphan ? '#155724' : '#856404'};
`;

const DashboardAvanzata = () => {
  const { user, token } = useAuth();
  const [leghe, setLeghe] = useState([]);
  const [selectedLega, setSelectedLega] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [giocatori, setGiocatori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const legheRes = await getLeghe(token);
      setLeghe(legheRes.leghe);
      
      if (legheRes.leghe.length > 0) {
        setSelectedLega(legheRes.leghe[0]);
        await fetchLegaData(legheRes.leghe[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLegaData = async (legaId) => {
    try {
      const [squadreRes, giocatoriRes] = await Promise.all([
        getSquadreByLega(legaId, token),
        getGiocatoriByLega(legaId, token)
      ]);
      
      setSquadre(squadreRes.squadre);
      setGiocatori(giocatoriRes.giocatori);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLegaSelect = async (lega) => {
    setSelectedLega(lega);
    await fetchLegaData(lega.id);
  };

  const getStats = () => {
    if (!selectedLega) return {};
    
    const totalSquadre = squadre.length;
    const totalGiocatori = giocatori.length;
    const squadreOrfane = squadre.filter(s => s.is_orfana).length;
    const valoreMedioSquadra = squadre.length > 0 
      ? Math.round(squadre.reduce((sum, s) => sum + (s.valore_squadra || 0), 0) / squadre.length)
      : 0;
    
    return {
      totalSquadre,
      totalGiocatori,
      squadreOrfane,
      valoreMedioSquadra
    };
  };

  const getTopGiocatori = () => {
    return giocatori
      .sort((a, b) => (b.costo_attuale || 0) - (a.costo_attuale || 0))
      .slice(0, 6);
  };

  const getClassifica = () => {
    return squadre
      .sort((a, b) => (b.valore_squadra || 0) - (a.valore_squadra || 0))
      .map((squadra, index) => ({
        ...squadra,
        posizione: index + 1
      }));
  };

  if (loading) return <Container><div>Caricamento dashboard...</div></Container>;
  if (error) return <Container><div style={{ color: 'red' }}>{error}</div></Container>;

  const stats = getStats();
  const topGiocatori = getTopGiocatori();
  const classifica = getClassifica();

  return (
    <Container>
      <Header>
        <Title>Dashboard Avanzata</Title>
        <div>Bentornato, <strong>{user?.nome}</strong></div>
      </Header>

      <ActionButtons>
        <BigButton onClick={() => navigate('/crea-lega')}>➕ Crea una Lega</BigButton>
        <BigButton onClick={() => navigate('/unisciti-lega')}>🤝 Unisciti ad una Lega</BigButton>
      </ActionButtons>

      {leghe.length === 0 ? (
        <EmptyState>
          <h3>Nessuna lega trovata</h3>
          <p>Crea la tua prima lega per iniziare a giocare!</p>
          <ActionButtons>
            <BigButton onClick={() => navigate('/crea-lega')}>➕ Crea una Lega</BigButton>
            <BigButton onClick={() => navigate('/unisciti-lega')}>🤝 Unisciti ad una Lega</BigButton>
          </ActionButtons>
        </EmptyState>
      ) : (
        <>
          <Section>
            <SectionTitle>📊 Statistiche Generali</SectionTitle>
            <StatsGrid>
              <StatCard color="#667eea">
                <StatTitle>Leghe Totali</StatTitle>
                <StatValue>{leghe.length}</StatValue>
              </StatCard>
              <StatCard color="#28a745">
                <StatTitle>Squadre Totali</StatTitle>
                <StatValue>{stats.totalSquadre}</StatValue>
              </StatCard>
              <StatCard color="#ffc107">
                <StatTitle>Giocatori Totali</StatTitle>
                <StatValue>{stats.totalGiocatori}</StatValue>
              </StatCard>
              <StatCard color="#dc3545">
                <StatTitle>Squadre Orfane</StatTitle>
                <StatValue>{stats.squadreOrfane}</StatValue>
              </StatCard>
            </StatsGrid>
          </Section>

          <Section>
            <SectionTitle>🏆 Le Tue Leghe</SectionTitle>
            <LeagueGrid>
              {leghe.map(lega => (
                <LeagueCard key={lega.id} onClick={() => handleLegaSelect(lega)}>
                  <LeagueHeader>
                    <LeagueName>{lega.nome}</LeagueName>
                    <LeagueStatus public={lega.is_pubblica}>
                      {lega.is_pubblica ? 'Pubblica' : 'Privata'}
                    </LeagueStatus>
                  </LeagueHeader>
                  <LeagueStats>
                    <LeagueStat>
                      <h5>Modalità</h5>
                      <p>{lega??.modalita || '' || 'N/A'}</p>
                    </LeagueStat>
                    <LeagueStat>
                      <h5>Admin</h5>
                      <p>Tu</p>
                    </LeagueStat>
                  </LeagueStats>
                  <LeagueButton>
                    Gestisci Lega
                  </LeagueButton>
                </LeagueCard>
              ))}
            </LeagueGrid>
          </Section>

          {selectedLega && (
            <>
              <Section>
                <SectionTitle>📈 Classifica - {selectedLega.nome}</SectionTitle>
                <StandingsTable>
                  <thead>
                    <tr>
                      <TableHeader>Pos</TableHeader>
                      <TableHeader>Squadra</TableHeader>
                      <TableHeader>Crediti Residui</TableHeader>
                      <TableHeader>Valore Squadra</TableHeader>
                      <TableHeader>Costo Ingaaggi</TableHeader>
                      <TableHeader>Giocatori</TableHeader>
                      <TableHeader>Stato</TableHeader>
                      <TableHeader>Azioni</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {classifica.map(squadra => (
                      <tr key={squadra.id}>
                        <PositionCell>{squadra.posizione}</PositionCell>
                        <TableCell>{squadra.nome}</TableCell>
                        <TableCell>FM {squadra.casse_societarie?.toLocaleString() || 0}</TableCell>
                        <TableCell>FM {squadra.valore_squadra?.toLocaleString() || 0}</TableCell>
                        <TableCell>FM {squadra.costo_attuale?.toLocaleString() || 0}</TableCell>
                        <TableCell>{giocatori.filter(g => g.squadra_id === squadra.id).length}</TableCell>
                        <TableCell>
                          <TeamStatus $orphan={squadra.is_orfana}>
                            {squadra.is_orfana ? 'Non Assegnata' : 'Assegnata'}
                          </TeamStatus>
                        </TableCell>
                        <TableCell>
                          <ActionButtons>
                            <BigButton onClick={() => navigate(`/gestisci-squadra/${squadra.id}`)}>Gestisci Squadra</BigButton>
                          </ActionButtons>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </StandingsTable>
              </Section>

              <Section>
                <SectionTitle>⭐ Top Giocatori - {selectedLega.nome}</SectionTitle>
                <TopPlayersGrid>
                  {topGiocatori.map(giocatore => (
                    <PlayerCard key={giocatore.id}>
                      <PlayerAvatar>
                        {giocatore.nome?.charAt(0) || '?'}
                      </PlayerAvatar>
                      <PlayerName>{giocatore.nome}</PlayerName>
                      <PlayerDetails>
                        {giocatore.ruolo} • {giocatore.squadra_reale}
                      </PlayerDetails>
                      <PlayerDetails>
                        FM {giocatore.costo_attuale?.toLocaleString() || 0}
                      </PlayerDetails>
                    </PlayerCard>
                  ))}
                </TopPlayersGrid>
              </Section>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default DashboardAvanzata; 