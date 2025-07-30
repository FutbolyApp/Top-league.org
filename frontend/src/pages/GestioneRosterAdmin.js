import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { api } from '../api/config';
import RosterABManager from '../components/RosterABManager';
import ConnectionErrorModal from '../components/ConnectionErrorModal';

const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 1.5rem;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

const Title = styled.h1`
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

const BackButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  
  &:hover {
    background: #2563eb;
  }
`;

const LeagueInfo = styled.div`
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const LeagueName = styled.h3`
  color: #0c4a6e;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const LeagueStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0ea5e9;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const TeamCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
`;

const TeamName = styled.h3`
  color: #1e293b;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const TeamOwner = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.25rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1rem;
  color: #64748b;
  margin: 3rem 0;
  padding: 2rem;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #64748b;
  padding: 3rem;
  font-size: 0.9rem;
`;

const GestioneRosterAdmin = () => {
  const { legaId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [lega, setLega] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConnectionError, setShowConnectionError] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verifica che l'utente sia admin, superadmin o subadmin
      const ruoliAutorizzati = ['admin', 'superadmin', 'subadmin', 'Admin', 'SuperAdmin', 'SubAdmin'];
      if (!ruoliAutorizzati.includes(user?.ruolo)) {
        setError('Accesso negato. Solo admin, superadmin e subadmin possono gestire i roster.');
        return;
      }

      // Carica informazioni della lega
      const legaResponse = await api.get(`/leghe/${legaId}`, token);
      setLega(legaResponse);

      // Carica squadre della lega
      const squadreResponse = await api.get(`/leghe/${legaId}/squadre`, token);
      console.log('🔍 Squadre response:', squadreResponse);
      console.log('🔍 Squadre response type:', typeof squadreResponse);
      console.log('🔍 Squadre response keys:', Object.keys(squadreResponse || {}));
      
      // Assicurati che squadre sia sempre un array
      let squadreArray = [];
      if (Array.isArray(squadreResponse)) {
        squadreArray = squadreResponse;
        console.log('🔍 Caso 1: Array diretto');
      } else if (squadreResponse?.squadre && Array.isArray(squadreResponse.squadre)) {
        squadreArray = squadreResponse.squadre;
        console.log('🔍 Caso 2: squadreResponse.squadre');
      } else if (squadreResponse?.data?.squadre && Array.isArray(squadreResponse.data.squadre)) {
        squadreArray = squadreResponse.data.squadre;
        console.log('🔍 Caso 3: squadreResponse.data.squadre');
      } else if (squadreResponse?.data && Array.isArray(squadreResponse.data)) {
        squadreArray = squadreResponse.data;
        console.log('🔍 Caso 4: squadreResponse.data');
      } else {
        console.log('🔍 Caso 5: Nessun array trovato');
      }
      console.log('🔍 Squadre array finale:', squadreArray);
      console.log('🔍 Squadre array length:', squadreArray.length);
      setSquadre(squadreArray);

    } catch (err) {
      console.error('Errore fetch data:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
        setShowConnectionError(true);
      } else {
        setError('Errore nel caricamento dei dati');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    if (token && user) {
      fetchData();
    }
  }, [legaId, token, user]);

  if (loading) {
    return (
      <Container>
        <ContentWrapper>
          <LoadingMessage>Caricamento dati lega...</LoadingMessage>
        </ContentWrapper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ContentWrapper>
          <ErrorMessage>{error}</ErrorMessage>
          <BackButton onClick={() => navigate('/area-admin')}>
            ← Torna alla Dashboard Admin
          </BackButton>
        </ContentWrapper>
      </Container>
    );
  }

  if (!lega) {
    return (
      <Container>
        <ContentWrapper>
          <EmptyState>Lega non trovata</EmptyState>
          <BackButton onClick={() => navigate('/area-admin')}>
            ← Torna alla Dashboard Admin
          </BackButton>
        </ContentWrapper>
      </Container>
    );
  }

  return (
    <Container>
      <ContentWrapper>
        <BackButton onClick={() => navigate('/area-admin')}>
          ← Torna alla Dashboard Admin
        </BackButton>

        <Header>
          <Title>📊 Gestione Roster A/B - {lega?.nome || 'Nome'}</Title>
          <Subtitle>
            Gestisci i roster A/B per tutte le squadre della lega. 
            Solo admin, superadmin e subadmin possono modificare i roster.
          </Subtitle>
        </Header>

        <LeagueInfo>
          <LeagueName>{lega?.nome || 'Nome'}</LeagueName>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            {lega.descrizione || 'Nessuna descrizione disponibile'}
          </div>
          
          <LeagueStats>
            <StatItem>
              <StatValue>{Array.isArray(squadre) ? squadre?.length || 0 : 0}</StatValue>
              <StatLabel>Squadre</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{lega.numero_tornei || 0}</StatValue>
              <StatLabel>Tornei</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{lega?.max_giocatori || 30}</StatValue>
              <StatLabel>Max Giocatori</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{lega?.is_pubblica || false? 'Pubblica' : 'Privata'}</StatValue>
              <StatLabel>Tipo</StatLabel>
            </StatItem>
          </LeagueStats>
        </LeagueInfo>

        {!Array.isArray(squadre) || squadre.length === 0 ? (
          <EmptyState>
            Nessuna squadra trovata in questa lega
          </EmptyState>
        ) : (
          <TeamsGrid>
            {squadre.map(squadra => (
              <TeamCard key={squadra.id}>
                <TeamHeader>
                  <div>
                    <TeamName>{squadra?.nome || 'Nome'}</TeamName>
                    <TeamOwner>
                      Proprietario: {squadra.proprietario_nome} {squadra.proprietario_cognome}
                    </TeamOwner>
                  </div>
                </TeamHeader>
                
                <RosterABManager 
                  key={`roster-${squadra.id}-${legaId}`}
                  squadraId={squadra.id}
                  legaId={legaId}
                  userRole={user?.ruolo}
                />
              </TeamCard>
            ))}
          </TeamsGrid>
        )}
        
        <ConnectionErrorModal
          isOpen={showConnectionError}
          onClose={() => setShowConnectionError(false)}
          onRetry={() => {
            setLoading(true);
            setError(null);
            setShowConnectionError(false);
            // Ricarica i dati
            setTimeout(() => {
              fetchData();
            }, 1000);
          }}
        />
      </ContentWrapper>
    </Container>
  );
};

export default GestioneRosterAdmin; 