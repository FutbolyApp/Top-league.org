import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLegaById, getSquadreByLega } from '../api/leghe';
import { deleteSquadra } from '../api/squadre';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #007AFF;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  
  &:hover {
    opacity: 0.7;
  }
`;

const Header = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 0;
`;

const TeamsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TeamsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TeamRow = styled.div`
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  padding: 1rem;
  background: white;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    background: #f8f9fa;
    border-color: #007AFF;
  }
`;

const TeamInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
`;

const TeamName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
  min-width: 200px;
`;

const TeamDetails = styled.div`
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
`;

const DetailLabel = styled.span`
  color: #666;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.span`
  color: #1d1d1f;
  font-weight: 600;
  font-size: 0.9rem;
`;

const TeamActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const InfoItem = styled.div`
  font-size: 0.9rem;
`;

const InfoLabel = styled.span`
  color: #666;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #1d1d1f;
  font-weight: 600;
`;

const ActionButton = styled.button`
  background: #ff9500;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0.25rem;
  
  &:hover {
    background: #e6850e;
    transform: translateY(-1px);
  }
  
  &.danger {
    background: #dc3545;
    
    &:hover {
      background: #c82333;
    }
  }
  
  &.success {
    background: #28a745;
    
    &:hover {
      background: #218838;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1rem;
  color: #86868b;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1rem;
  color: #dc3545;
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #007AFF;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const GestioneSquadreLega = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [lega, setLega] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [legaRes, squadreRes] = await Promise.all([
          getLegaById(id, token),
          getSquadreByLega(id, token)
        ]);
        
        setLega(legaRes.lega);
        setSquadre(squadreRes.squadre || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [id, token]);

  const handleEditSquadra = (squadraId) => {
    navigate(`/modifica-squadra-completa/${squadraId}`);
  };

  const handleDeleteSquadra = async (squadraId, squadraNome) => {
    if (window.confirm(`Sei sicuro di voler eliminare la squadra "${squadraNome}"? Questa azione non può essere annullata.`)) {
      try {
        await deleteSquadra(squadraId, token);
        setSquadre(squadre.filter(s => s.id !== squadraId));
        alert('Squadra eliminata con successo!');
      } catch (err) {
        alert(`Errore nell'eliminazione: ${err.message}`);
      }
    }
  };

  const handleAddSquadra = () => {
    navigate(`/super-admin/lega/${id}/squadra/nuova`);
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento squadre...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  const totalGiocatori = squadre.reduce((sum, squadra) => sum + (squadra.giocatori?.length || 0), 0);
  const squadreOrfane = squadre.filter(s => s.is_orfana).length;
  const squadreAssegnate = squadre.filter(s => !s.is_orfana).length;

  return (
    <Container>
      <BackButton onClick={() => navigate(`/super-admin/lega/${id}/edit`)}>
        ← Torna alla Modifica Lega
      </BackButton>
      
      <Header>
        <Title>Gestione Squadre: {lega?.nome}</Title>
        <Subtitle>Modifica e gestisci tutte le squadre di questa lega</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber>{squadre.length}</StatNumber>
          <StatLabel>Squadre Totali</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{totalGiocatori}</StatNumber>
          <StatLabel>Giocatori Totali</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{squadreAssegnate}</StatNumber>
          <StatLabel>Squadre Assegnate</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{squadreOrfane}</StatNumber>
          <StatLabel>Squadre Orfane</StatLabel>
        </StatCard>
      </StatsGrid>

      <TeamsSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <SectionTitle>Squadre della Lega</SectionTitle>
          <ActionButton 
            className="success"
            onClick={handleAddSquadra}
          >
            ➕ Aggiungi Squadra
          </ActionButton>
        </div>
        
        {squadre.length === 0 ? (
          <EmptyContainer>
            <h3>Nessuna squadra trovata</h3>
            <p>Non ci sono ancora squadre in questa lega.</p>
            <ActionButton 
              className="success"
              onClick={handleAddSquadra}
            >
              ➕ Crea Prima Squadra
            </ActionButton>
          </EmptyContainer>
        ) : (
          <TeamsList>
            {squadre.map(squadra => (
              <TeamRow key={squadra.id}>
                <TeamInfo>
                  <TeamName>{squadra.nome}</TeamName>
                  
                  <TeamDetails>
                    <DetailItem>
                      <DetailLabel>Proprietario</DetailLabel>
                      <DetailValue>{squadra.proprietario_nome || 'Orfana'}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Giocatori</DetailLabel>
                      <DetailValue>{squadra.giocatori?.length || 0}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Club Level</DetailLabel>
                      <DetailValue>{squadra.club_level || 1}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Valore</DetailLabel>
                      <DetailValue>FM {squadra.valore_squadra?.toLocaleString() || 0}</DetailValue>
                    </DetailItem>
                  </TeamDetails>
                </TeamInfo>
                
                <TeamActions>
                  <ActionButton 
                    onClick={() => handleEditSquadra(squadra.id)}
                  >
                    Modifica
                  </ActionButton>
                  <ActionButton 
                    className="danger"
                    onClick={() => handleDeleteSquadra(squadra.id, squadra.nome)}
                  >
                    🗑️ Elimina
                  </ActionButton>
                </TeamActions>
              </TeamRow>
            ))}
          </TeamsList>
        )}
      </TeamsSection>
    </Container>
  );
};

export default GestioneSquadreLega; 