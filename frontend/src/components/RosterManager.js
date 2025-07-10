import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const RosterSection = styled.div`
  margin-bottom: 30px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const RosterTitle = styled.h3`
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RosterStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 5px;
`;

const PlayerList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
`;

const PlayerCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.div`
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
`;

const PlayerDetails = styled.div`
  font-size: 14px;
  color: #666;
`;

const MoveButton = styled.button`
  background: ${props => props.roster === 'A' ? '#28a745' : '#ffc107'};
  color: ${props => props.roster === 'A' ? 'white' : '#333'};
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Alert = styled.div`
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 6px;
  background: ${props => props.type === 'warning' ? '#fff3cd' : '#d4edda'};
  color: ${props => props.type === 'warning' ? '#856404' : '#155724'};
  border: 1px solid ${props => props.type === 'warning' ? '#ffeaa7' : '#c3e6cb'};
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 40px;
  color: #dc3545;
`;

const RosterManager = ({ squadraId, token }) => {
  const [rosterData, setRosterData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leagueData, setLeagueData] = useState(null);

  useEffect(() => {
    if (squadraId && token) {
      fetchRosterData();
    }
  }, [squadraId, token]);

  const fetchRosterData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rosterRes, statsRes, leagueRes] = await Promise.all([
        fetch(`http://localhost:3001/api/offerte/roster/${squadraId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/api/offerte/roster/stats/${squadraId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/api/squadre/${squadraId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!rosterRes.ok || !statsRes.ok || !leagueRes.ok) {
        throw new Error('Errore nel caricamento dei dati roster');
      }

      const [rosterData, statsData, leagueData] = await Promise.all([
        rosterRes.json(),
        statsRes.json(),
        leagueRes.json()
      ]);

      setRosterData(rosterData);
      setStats(statsData);
      setLeagueData(leagueData.squadra);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) => {
    if (!value) return 'FM 0';
    return `FM ${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>Caricamento roster...</LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>Errore: {error}</ErrorContainer>
      </Container>
    );
  }

  if (!rosterData || !stats) {
    return (
      <Container>
        <ErrorContainer>Nessun dato disponibile</ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <h2>Gestione Roster A/B</h2>
      
      {stats.rosterA.count + stats.rosterB.count > (leagueData?.max_giocatori || 30) && (
        <Alert type="warning">
          ⚠️ La tua squadra ha più di {leagueData?.max_giocatori || 30} giocatori. I giocatori in Roster B non vengono pagati.
        </Alert>
      )}

      <RosterStats>
        <StatCard>
          <StatValue>{stats.rosterA.count}</StatValue>
          <StatLabel>Roster A (Attivi)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatMoney(stats.rosterA.salary)}</StatValue>
          <StatLabel>Costo Salariale Roster A</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.rosterB.count}</StatValue>
          <StatLabel>Roster B (Inattivi)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Totale Giocatori</StatLabel>
        </StatCard>
      </RosterStats>

      <RosterSection>
        <RosterTitle>
          🟢 Roster A - Giocatori Attivi ({rosterData.rosterA.length})
        </RosterTitle>
        <PlayerList>
          {rosterData.rosterA.map(giocatore => (
            <PlayerCard key={giocatore.id} style={{
              backgroundColor: giocatore.prestito ? '#fffbf0' : 'transparent'
            }}>
              <PlayerInfo>
                <PlayerName>
                  {giocatore.nome} {giocatore.cognome}
                </PlayerName>
                <PlayerDetails>
                  {giocatore.ruolo} • {giocatore.squadra_reale} • {formatMoney(giocatore.salario)}
                </PlayerDetails>
              </PlayerInfo>
            </PlayerCard>
          ))}
          {rosterData.rosterA.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: '20px' }}>
              Nessun giocatore in Roster A
            </div>
          )}
        </PlayerList>
      </RosterSection>

      <RosterSection>
        <RosterTitle>
          🟡 Roster B - Giocatori Inattivi ({rosterData.rosterB.length})
        </RosterTitle>
        <PlayerList>
          {rosterData.rosterB.map(giocatore => (
            <PlayerCard key={giocatore.id} style={{
              backgroundColor: '#ffeaea'
            }}>
              <PlayerInfo>
                <PlayerName>
                  {giocatore.nome} {giocatore.cognome}
                </PlayerName>
                <PlayerDetails>
                  {giocatore.ruolo} • {giocatore.squadra_reale} • {giocatore.prestito ? 'Prestato' : 'Non Attivo'}
                </PlayerDetails>
              </PlayerInfo>
            </PlayerCard>
          ))}
          {rosterData.rosterB.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: '20px' }}>
              Nessun giocatore in Roster B
            </div>
          )}
        </PlayerList>
      </RosterSection>
    </Container>
  );
};

export default RosterManager; 