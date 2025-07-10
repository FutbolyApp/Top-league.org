import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLegaById } from '../api/leghe';
import { getSquadreByLega } from '../api/squadre';
import { getTorneiLega } from '../api/tornei';
import { checkSubadmin } from '../api/subadmin';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
`;

const Section = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PermissionWarning = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  color: #856404;
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.className === 'success') return '#28a745';
    if (props.className === 'danger') return '#dc3545';
    if (props.className === 'secondary') return '#6c757d';
    return '#667eea';
  }};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  margin-right: 1rem;
  margin-bottom: 1rem;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
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
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const PermissionTag = styled.span`
  background: ${props => props.$active ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$active ? '#155724' : '#721c24'};
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  display: inline-block;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
`;

const RequestCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
`;

const RequestTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
`;

const RequestDescription = styled.p`
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const LeagueSubadminArea = () => {
  const { legaId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [lega, setLega] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [tornei, setTornei] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        // Verifica i permessi del subadmin
        const subadminRes = await checkSubadmin(legaId, token);
        if (!subadminRes.isSubadmin) {
          setError('Accesso negato: non sei subadmin di questa lega');
          setLoading(false);
          return;
        }
        
        setPermissions(subadminRes.permissions || {});

        // Carica i dati della lega
        const [legaRes, squadreRes, torneiRes] = await Promise.all([
          getLegaById(legaId, token),
          getSquadreByLega(legaId, token),
          getTorneiLega(legaId, token)
        ]);
        
        setLega(legaRes.lega);
        setSquadre(squadreRes.squadre || []);
        setTornei(torneiRes || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token && legaId) fetchData();
  }, [token, legaId]);

  const getPermissionLabel = (permission) => {
    const labels = {
      modifica_squadre: 'Modifica Squadre',
      gestione_giocatori: 'Gestione Calciatori',
      gestione_tornei: 'Gestione Tornei',
      modifica_impostazioni: 'Modifica Impostazioni',
      gestione_contratti: 'Gestione Contratti'
    };
    return labels[permission] || permission;
  };

  const handleRequestModification = (type) => {
    // Naviga alla pagina di richiesta modifica appropriata
    switch (type) {
      case 'squadre':
        navigate(`/request-squadre-modification/${legaId}`);
        break;
      case 'giocatori':
        navigate(`/request-giocatori-modification/${legaId}`);
        break;
      case 'tornei':
        navigate(`/request-tornei-modification/${legaId}`);
        break;
      case 'contratti':
        navigate(`/request-contratti-modification/${legaId}`);
        break;
      case 'impostazioni':
        navigate(`/request-impostazioni-modification/${legaId}`);
        break;
      default:
        alert(`Funzionalità di richiesta modifica per ${type} sarà implementata presto!`);
    }
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento lega...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  if (!lega) return (
    <Container>
      <ErrorContainer>Lega non trovata</ErrorContainer>
    </Container>
  );

  return (
    <Container>
      <Header>
        <Title>Area Subadmin - {lega.nome}</Title>
        <Subtitle>Richiedi modifiche alla lega (non modificare direttamente)</Subtitle>
      </Header>

      <PermissionWarning>
        <strong>⚠️ Attenzione:</strong> Come subadmin, non puoi modificare direttamente la lega. 
        Puoi solo richiedere modifiche che verranno esaminate dall'amministratore della lega.
      </PermissionWarning>

      <Section>
        <SectionTitle>🔐 I Tuoi Permessi</SectionTitle>
        <div>
          {Object.entries(permissions).map(([perm, value]) => (
            <PermissionTag key={perm} $active={value}>
              {getPermissionLabel(perm)}: {value ? '✅ Attivo' : '❌ Non attivo'}
            </PermissionTag>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle>📊 Statistiche Lega</SectionTitle>
        <StatsGrid>
          <StatCard>
            <StatValue>{squadre.length}</StatValue>
            <StatLabel>Squadre</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{tornei.length}</StatValue>
            <StatLabel>Tornei</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{lega.numero_giocatori || 0}</StatValue>
            <StatLabel>Giocatori</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{lega.budget || 0}</StatValue>
            <StatLabel>Budget</StatLabel>
          </StatCard>
        </StatsGrid>
      </Section>

      <Section>
        <SectionTitle>📝 Richieste di Modifica</SectionTitle>
        
        <div>
          <RequestCard>
            <RequestTitle>🏆 Gestione Squadre</RequestTitle>
            <RequestDescription>
              Richiedi modifiche alle squadre della lega (aggiunta/rimozione giocatori, 
              cambio formazione, ecc.)
            </RequestDescription>
            <ActionButton 
              onClick={() => handleRequestModification('squadre')}
              disabled={!permissions.modifica_squadre}
            >
              Richiedi Modifica Squadre
            </ActionButton>
          </RequestCard>

          <RequestCard>
            <RequestTitle>👥 Gestione Calciatori</RequestTitle>
            <RequestDescription>
              Richiedi modifiche ai giocatori (aggiunta nuovi giocatori, 
              modifica statistiche, ecc.)
            </RequestDescription>
            <ActionButton 
              onClick={() => handleRequestModification('giocatori')}
              disabled={!permissions.gestione_giocatori}
            >
              Richiedi Modifica Giocatori
            </ActionButton>
          </RequestCard>

          <RequestCard>
            <RequestTitle>🏅 Gestione Tornei</RequestTitle>
            <RequestDescription>
              Richiedi modifiche ai tornei (creazione nuovo torneo, 
              modifica calendario, ecc.)
            </RequestDescription>
            <ActionButton 
              onClick={() => handleRequestModification('tornei')}
              disabled={!permissions.gestione_tornei}
            >
              Richiedi Modifica Tornei
            </ActionButton>
          </RequestCard>

          <RequestCard>
            <RequestTitle>📋 Gestione Contratti</RequestTitle>
            <RequestDescription>
              Richiedi modifiche ai contratti (nuovi contratti, 
              rinnovi, rescissioni, ecc.)
            </RequestDescription>
            <ActionButton 
              onClick={() => handleRequestModification('contratti')}
              disabled={!permissions.gestione_contratti}
            >
              Richiedi Modifica Contratti
            </ActionButton>
          </RequestCard>

          <RequestCard>
            <RequestTitle>⚙️ Modifica Impostazioni</RequestTitle>
            <RequestDescription>
              Richiedi modifiche alle impostazioni della lega (budget, 
              regolamento, numero giocatori, ecc.)
            </RequestDescription>
            <ActionButton 
              onClick={() => handleRequestModification('impostazioni')}
              disabled={!permissions.modifica_impostazioni}
            >
              Richiedi Modifica Impostazioni
            </ActionButton>
          </RequestCard>
        </div>

        {Object.values(permissions).every(p => !p) && (
          <EmptyContainer>
            <h3>Nessun permesso attivo</h3>
            <p>Non hai ancora permessi attivi per questa lega. Contatta l'amministratore della lega.</p>
          </EmptyContainer>
        )}
      </Section>

      <Section>
        <SectionTitle>ℹ️ Informazioni Lega</SectionTitle>
        <div>
          <p><strong>Nome:</strong> {lega.nome}</p>
          <p><strong>Descrizione:</strong> {lega.descrizione || 'Nessuna descrizione'}</p>
          <p><strong>Regolamento:</strong> {lega.regolamento || 'Nessun regolamento specificato'}</p>
          <p><strong>Budget:</strong> FM {lega.budget || 0}</p>
          <p><strong>Numero Giocatori:</strong> {lega.numero_giocatori || 0}</p>
          <p><strong>Data Creazione:</strong> {new Date(lega.created_at).toLocaleDateString('it-IT')}</p>
        </div>
      </Section>
    </Container>
  );
};

export default LeagueSubadminArea; 