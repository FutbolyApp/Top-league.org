import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getUserLeghe } from '../api/leghe';
import { getSquadreByUtente } from '../api/squadre';
import { getNotificheUtente } from '../api/notifiche';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const WelcomeTitle = styled.h1`
  color: #1d1d1f;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #86868b;
  font-size: 0.9rem;
`;

const UserName = styled.span`
  font-weight: 600;
  color: #1d1d1f;
`;

const QuickActionsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const QuickActionButton = styled(Link)`
  background: #5856d6;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #4a4ac4;
    transform: translateY(-1px);
  }
`;

const ActionsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  justify-content: center;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  max-width: 600px;
  width: 100%;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ActionCard = styled(Link)`
  background: ${props => props.$variant === 'crea' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%)'};
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  padding: 1rem;
  text-decoration: none;
  color: white;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ActionIcon = styled.div`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  text-align: center;
  color: white;
`;

const ActionTitle = styled.h3`
  color: white;
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
`;

const ActionDescription = styled.p`
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-align: center;
  line-height: 1.3;
  font-size: 0.75rem;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  color: #1d1d1f;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
`;

const Th = styled.th`
  background: #5856d6;
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  
  &:hover {
    background: #4a4ac7;
  }
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
  }
  
  ${props => props.$sortable && `
    &::after {
      content: '${props.$sortDirection === 'asc' ? '▲' : props.$sortDirection === 'desc' ? '▼' : '↕'}';
      position: absolute;
      right: 0.5rem;
      color: white;
      font-size: 0.8rem;
    }
  `}
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  color: #333;
  vertical-align: middle;
`;

const StyledLink = styled(Link)`
  color: #007bff;
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'pubblica': return '#28a745';
      case 'privata': return '#6c757d';
      default: return '#6c757d';
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const FeatureTag = styled.span`
  background: ${props => props.active ? '#d4edda' : '#f8f9fa'};
  color: ${props => props.active ? '#155724' : '#666'};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  display: inline-block;
`;

const MoneyValue = styled.span`
  font-weight: 600;
  color: #28a745;
`;

const ViewMoreButton = styled(Link)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-block;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #86868b;
  font-size: 0.9rem;
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

const Home = () => {
  const { user, token } = useAuth();
  const [legheAdmin, setLegheAdmin] = useState([]);
  const [squadre, setSquadre] = useState([]);
  const [notifiche, setNotifiche] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stato per l'ordinamento delle leghe admin
  const [sortFieldLeghe, setSortFieldLeghe] = useState('nome');
  const [sortDirectionLeghe, setSortDirectionLeghe] = useState('asc');
  
  // Stato per l'ordinamento delle squadre
  const [sortFieldSquadre, setSortFieldSquadre] = useState('nome');
  const [sortDirectionSquadre, setSortDirectionSquadre] = useState('asc');

  useEffect(() => {
    const loadData = async () => {
      if (!user || !token) return;
      
      try {
        setLoading(true);
        const [legheRes, squadreRes, notificheRes] = await Promise.all([
          getUserLeghe(token),
          getSquadreByUtente(token),
          getNotificheUtente(token)
        ]);
        
        setLegheAdmin(legheRes.leghe || []);
        setSquadre(squadreRes.squadre || []);
        setNotifiche(notificheRes.notifiche || []);
      } catch (error) {
        console.error('Errore caricamento dati:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, token]);

  // Funzione per gestire l'ordinamento delle leghe
  const handleSortLeghe = (field) => {
    if (sortFieldLeghe === field) {
      setSortDirectionLeghe(sortDirectionLeghe === 'asc' ? 'desc' : 'asc');
    } else {
      setSortFieldLeghe(field);
      setSortDirectionLeghe('asc');
    }
  };

  // Funzione per gestire l'ordinamento delle squadre
  const handleSortSquadre = (field) => {
    if (sortFieldSquadre === field) {
      setSortDirectionSquadre(sortDirectionSquadre === 'asc' ? 'desc' : 'asc');
    } else {
      setSortFieldSquadre(field);
      setSortDirectionSquadre('asc');
    }
  };

  // Funzione per ordinare le leghe
  const sortLeghe = (legheToSort) => {
    return [...legheToSort].sort((a, b) => {
      let aValue = a[sortFieldLeghe];
      let bValue = b[sortFieldLeghe];
      
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortDirectionLeghe === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  // Funzione per ordinare le squadre
  const sortSquadre = (squadreToSort) => {
    return [...squadreToSort].sort((a, b) => {
      let aValue = a[sortFieldSquadre];
      let bValue = b[sortFieldSquadre];
      
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortDirectionSquadre === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento dashboard...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  const sortedLegheAdmin = sortLeghe(legheAdmin).slice(0, 3);
  const sortedSquadre = sortSquadre(squadre).slice(0, 3);

  return (
    <Container>
      <Header>
        <WelcomeTitle>Benvenuto in TopLeague</WelcomeTitle>
        <UserInfo>
          <UserName>{user?.nome} {user?.cognome}</UserName>
          <span>•</span>
          <span>{user?.email}</span>
        </UserInfo>
      </Header>

      <ActionsSection>
        <ActionsGrid>
          <ActionCard to="/crea-lega" $variant="crea">
            <ActionIcon></ActionIcon>
            <ActionTitle>Crea Lega</ActionTitle>
            <ActionDescription>
              Crea una nuova lega per gestire il tuo Fantacalcio
            </ActionDescription>
          </ActionCard>
          
          <ActionCard to="/unisciti-lega" $variant="unisciti">
            <ActionIcon></ActionIcon>
            <ActionTitle>Unisciti a Lega</ActionTitle>
            <ActionDescription>
              Trova e unisciti a una lega esistente
            </ActionDescription>
          </ActionCard>
        </ActionsGrid>
      </ActionsSection>

      {legheAdmin.length > 0 && (
        <Section>
          <SectionTitle>Area Admin</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldLeghe === 'nome' ? sortDirectionLeghe : null}
                  onClick={() => handleSortLeghe('nome')}
                >
                  Nome Lega
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldLeghe === 'modalita' ? sortDirectionLeghe : null}
                  onClick={() => handleSortLeghe('modalita')}
                >
                  Modalità
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldLeghe === 'is_pubblica' ? sortDirectionLeghe : null}
                  onClick={() => handleSortLeghe('is_pubblica')}
                >
                  Tipo
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldLeghe === 'squadre_assegnate' ? sortDirectionLeghe : null}
                  onClick={() => handleSortLeghe('squadre_assegnate')}
                >
                  Squadre
                </Th>
              </tr>
            </thead>
            <tbody>
              {sortedLegheAdmin.map(lega => (
                <tr key={lega.id}>
                  <Td>
                    <StyledLink to={`/lega/${lega.id}`}>
                      {lega.nome}
                    </StyledLink>
                  </Td>
                  <Td>{lega.modalita}</Td>
                  <Td>
                    <StatusBadge $status={lega.is_pubblica ? 'pubblica' : 'privata'}>
                      {lega.is_pubblica ? 'Pubblica' : 'Privata'}
                    </StatusBadge>
                  </Td>
                  <Td>{lega.squadre_assegnate || 0}/{lega.numero_squadre_totali || 0}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {legheAdmin.length > 3 && (
            <ViewMoreButton to="/area-admin">
              Altre Leghe
            </ViewMoreButton>
          )}
        </Section>
      )}

      {squadre.length > 0 && (
        <Section>
          <SectionTitle>Area Manager</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldSquadre === 'nome' ? sortDirectionSquadre : null}
                  onClick={() => handleSortSquadre('nome')}
                >
                  Nome Squadra
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldSquadre === 'lega_nome' ? sortDirectionSquadre : null}
                  onClick={() => handleSortSquadre('lega_nome')}
                >
                  Nome Lega
                </Th>
                <Th>Torneo</Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldSquadre === 'modalita' ? sortDirectionSquadre : null}
                  onClick={() => handleSortSquadre('modalita')}
                >
                  Modalità
                </Th>
                <Th>Tipo</Th>
                <Th>Squadre</Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldSquadre === 'valore_squadra' ? sortDirectionSquadre : null}
                  onClick={() => handleSortSquadre('valore_squadra')}
                >
                  Valore
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldSquadre === 'casse_societarie' ? sortDirectionSquadre : null}
                  onClick={() => handleSortSquadre('casse_societarie')}
                >
                  Crediti
                </Th>
              </tr>
            </thead>
            <tbody>
              {sortedSquadre.map(squadra => (
                <tr key={squadra.id}>
                  <Td>
                    <StyledLink to={`/squadra/${squadra.id}`}>
                      {squadra.nome}
                    </StyledLink>
                  </Td>
                  <Td>{squadra.lega_nome || 'N/A'}</Td>
                  <Td>-</Td>
                  <Td>{squadra.lega_modalita || 'N/A'}</Td>
                  <Td>
                    <StatusBadge $status={squadra.lega_is_pubblica ? 'pubblica' : 'privata'}>
                      {squadra.lega_is_pubblica ? 'Pubblica' : 'Privata'}
                    </StatusBadge>
                  </Td>
                  <Td>{squadra.lega_squadre_assegnate || 0}/{squadra.lega_numero_squadre_totali || 0}</Td>
                  <Td>
                    <MoneyValue>FM {squadra.valore_squadra?.toLocaleString() || 0}</MoneyValue>
                  </Td>
                  <Td>
                    <MoneyValue>FM {squadra.casse_societarie?.toLocaleString() || 0}</MoneyValue>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {squadre.length > 3 && (
            <ViewMoreButton to="/area-manager">
              Altre Squadre
            </ViewMoreButton>
          )}
        </Section>
      )}

      {legheAdmin.length === 0 && squadre.length === 0 && (
        <EmptyState>
          <p>Non hai ancora leghe o squadre. Inizia creando una lega o unendoti a una esistente!</p>
          <QuickActionsContainer>
            <QuickActionButton to="/crea-lega">Crea Lega</QuickActionButton>
            <QuickActionButton to="/unisciti-lega">Unisciti a Lega</QuickActionButton>
          </QuickActionsContainer>
        </EmptyState>
      )}
    </Container>
  );
};

export default Home; 