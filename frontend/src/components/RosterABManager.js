import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { api } from '../api/config.js';
import { useAuth } from './AuthContext';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  min-height: 200px;
  max-width: 100%;
  overflow: hidden;
`;

const Title = styled.h3`
  color: #1e293b;
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${props => props.$variant === 'rosterA' ? '#f0f9ff' : '#fef3c7'};
  border: 1px solid ${props => props.$variant === 'rosterA' ? '#0ea5e9' : '#f59e0b'};
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.$variant === 'rosterA' ? '#0ea5e9' : '#f59e0b'};
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.875rem;
  min-width: 350px;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
    min-width: 300px;
  }
`;

const Th = styled.th`
  background: #f8fafc;
  padding: 0.3rem 0.2rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.7rem;
  white-space: nowrap;
  
  &:nth-child(1) { width: 45%; } /* Giocatore */
  &:nth-child(2) { width: 20%; } /* Ruolo */
  &:nth-child(3) { width: 15%; } /* Roster */
  &:nth-child(4) { width: 20%; } /* Azioni */
  
  @media (max-width: 768px) {
    padding: 0.25rem 0.15rem;
    font-size: 0.65rem;
  }
`;

const Td = styled.td`
  padding: 0.3rem 0.2rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  vertical-align: middle;
  font-size: 0.75rem;
  
  @media (max-width: 768px) {
    padding: 0.25rem 0.15rem;
    font-size: 0.7rem;
  }
`;

const Tr = styled.tr`
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f8fafc;
  }
`;

const RosterBadge = styled.span`
  padding: 0.1rem 0.2rem;
  border-radius: 3px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  text-align: center;
  min-width: 14px;
  
  &.rosterA {
    background: #dbeafe;
    color: #1e40af;
  }
  
  &.rosterB {
    background: #fef3c7;
    color: #92400e;
  }
  
  @media (max-width: 768px) {
    font-size: 0.55rem;
    padding: 0.08rem 0.15rem;
    min-width: 12px;
  }
`;

const ActionButton = styled.button`
  background: ${props => {
    switch (props.$variant) {
      case 'moveToA': return '#10b981';
      case 'moveToB': return '#f59e0b';
      case 'disabled': return '#6b7280';
      default: return '#3b82f6';
    }
  }};
  color: white;
  border: none;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-weight: 500;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  font-size: 0.6rem;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  white-space: nowrap;
  
  &:hover {
    ${props => !props.$disabled && 'filter: brightness(0.9);'}
  }
  
  @media (max-width: 768px) {
    padding: 0.15rem 0.3rem;
    font-size: 0.55rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1rem;
  color: #64748b;
  margin: 2rem 0;
  padding: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #64748b;
  padding: 2rem;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const RosterABManager = ({ squadraId, legaId, userRole }) => {
  const { token } = useAuth();
  const [rosterData, setRosterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [movingPlayer, setMovingPlayer] = useState(null);
  const isFetchingRef = useRef(false);
  

  


  const fetchRosterData = async () => {
    // Evita chiamate duplicate
    if (isFetchingRef.current) {
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/offerte/roster/${squadraId}`, token);
      // Fix estrazione dati come per squadre
      let roster = response;
      if (response && response.ok && response.data) {
        roster = response.data;
        console.log('🔍 [RosterABManager] Estratto da response.data:', roster);
      } else {
        console.log('🔍 [RosterABManager] Estratto diretto:', roster);
      }
      console.log(`🔍 RosterA length:`, roster?.rosterA?.length);
      console.log(`🔍 RosterB length:`, roster?.rosterB?.length);
      setRosterData(roster);
    } catch (err) {
      console.error('Errore fetch roster data:', err);
      console.error('Error details:', err.response?.data);
      setError('Errore nel caricamento dei dati roster');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (squadraId && token && !isFetchingRef.current) {
      fetchRosterData();
    }
  }, [squadraId, token]);

  const handleMovePlayer = async (giocatoreId, targetRoster) => {
    try {
      setMovingPlayer(giocatoreId);
      setError(null);
      setSuccessMessage('');

      const response = await api.post(`/offerte/roster/move-player`, {
        giocatoreId,
        targetRoster,
        squadraId,
        legaId
      }, token);

      setSuccessMessage(`Giocatore spostato con successo in Roster ${targetRoster}`);
      
      // Ricarica i dati
      await fetchRosterData();
    } catch (err) {
      setError(err.response?.data?.error || 'Errore nello spostamento del giocatore');
      console.error('Errore move player:', err);
    } finally {
      setMovingPlayer(null);
    }
  };

  const canManageRoster = userRole === 'admin' || userRole === 'superadmin' || userRole === 'subadmin' || 
                          userRole === 'Admin' || userRole === 'SuperAdmin' || userRole === 'SubAdmin';

  if (!canManageRoster) {
    return (
      <Container>
        <Title>🚫 Accesso Negato</Title>
        <p>Non hai i permessi per gestire i roster A/B.</p>
      </Container>
    );
  }


  
  if (loading) {
    return (
      <Container>
        <Title>📊 Gestione Roster A/B</Title>
        <LoadingMessage>Caricamento dati roster...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>📊 Gestione Roster A/B</Title>
        <ErrorMessage>{error}</ErrorMessage>
        <ActionButton onClick={fetchRosterData}>Riprova</ActionButton>
      </Container>
    );
  }

  if (!rosterData) {
    return (
      <Container>
        <Title>📊 Gestione Roster A/B</Title>
        <EmptyState>Nessun dato roster disponibile</EmptyState>
      </Container>
    );
  }

  const allPlayers = [
    ...(rosterData.rosterA || []).map(p => ({ ...p, currentRoster: 'A' })),
    ...(rosterData.rosterB || []).map(p => ({ ...p, currentRoster: 'B' }))
  ];

  return (
    <Container key={`roster-manager-${squadraId}`}>
      <Title>📊 Gestione Roster A/B</Title>
      
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <StatsGrid>
        <StatCard $variant="rosterA">
          <StatNumber $variant="rosterA">{rosterData.rosterA?.length || 0}</StatNumber>
          <StatLabel>Roster A (Attivi)</StatLabel>
        </StatCard>
        <StatCard $variant="rosterB">
          <StatNumber $variant="rosterB">{rosterData.rosterB?.length || 0}</StatNumber>
          <StatLabel>Roster B (Inattivi)</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{rosterData.total || 0}</StatNumber>
          <StatLabel>Totale Giocatori</StatLabel>
        </StatCard>
      </StatsGrid>

      <div style={{ overflowX: 'auto' }}>
        <Table>
          <thead>
            <tr>
              <Th>Giocatore</Th>
              <Th>Ruolo</Th>
              <Th>Roster</Th>
              <Th>Azioni</Th>
            </tr>
          </thead>
          <tbody>
            {allPlayers.length > 0 ? (
              allPlayers.map(giocatore => (
                <Tr key={giocatore.id}>
                  <Td>
                    <strong>{giocatore.nome} {giocatore.cognome || ''}</strong>
                  </Td>
                  <Td>{giocatore.ruolo}</Td>
                  <Td>
                    <RosterBadge className={`roster${giocatore.currentRoster}`}>
                      {giocatore.currentRoster}
                    </RosterBadge>
                  </Td>
                  <Td>
                    {giocatore.currentRoster === 'A' ? (
                      <ActionButton
                        $variant="moveToB"
                        $disabled={movingPlayer === giocatore.id}
                        onClick={() => handleMovePlayer(giocatore.id, 'B')}
                      >
                        {movingPlayer === giocatore.id ? '...' : '→ B'}
                      </ActionButton>
                    ) : (
                      <ActionButton
                        $variant="moveToA"
                        $disabled={movingPlayer === giocatore.id}
                        onClick={() => handleMovePlayer(giocatore.id, 'A')}
                      >
                        {movingPlayer === giocatore.id ? '...' : '→ A'}
                      </ActionButton>
                    )}
                  </Td>
                </Tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Nessun giocatore trovato
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {allPlayers.length === 0 && (
        <EmptyState>
          Nessun giocatore trovato in questa squadra
        </EmptyState>
      )}
    </Container>
  );
};

export default RosterABManager; 