import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getPendingChangesBySubadmin, getChangeHistory, getSubadminLeagues, cancelPendingChange } from '../api/subadmin';
import { getLegaById } from '../api/leghe';
import { getSquadreByLega } from '../api/squadre';
import { getTorneiByLega } from '../api/tornei';
import RosterABManager from '../components/RosterABManager';

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

const LeagueCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }
`;

const LeagueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const LeagueName = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.3rem;
`;

const LeagueStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
`;

const PermissionTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const PermissionTag = styled.span`
  background: ${props => props.$active ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$active ? '#155724' : '#721c24'};
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
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
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
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

const ChangeCard = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const ChangeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ChangeType = styled.span`
  background: #007bff;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const ChangeDate = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const ChangeDescription = styled.div`
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const StatusBadge = styled.span`
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  
  &.pending {
    background: #fff3cd;
    color: #856404;
  }
  
  &.approved {
    background: #d4edda;
    color: #155724;
  }
  
  &.rejected {
    background: #f8d7da;
    color: #721c24;
  }
`;

const LeagueLink = styled.span`
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 600;
  
  &:hover {
    color: #5a6fd8;
  }
`;

const SubadminInfo = styled.div`
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
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

const InfoCard = styled.div`
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e9ecef;
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 1rem 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$active ? '#667eea' : '#666'};
  border-bottom: 2px solid ${props => props.$active ? '#667eea' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    color: #667eea;
  }
`;

const SubadminArea = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('leagues');
  const [subadminLeagues, setSubadminLeagues] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [changeHistory, setChangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [leaguesRes, pendingRes, historyRes] = await Promise.all([
          getSubadminLeagues(token),
          getPendingChangesBySubadmin(token),
          getChangeHistory(null, token)
        ]);
        
        setSubadminLeagues(leaguesRes.leagues || []);
        setPendingChanges(pendingRes.changes || []);
        setChangeHistory(historyRes.changes || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleLeagueClick = (leagueId) => {
    navigate(`/league-subadmin/${leagueId}`);
  };

  const handleCancelChange = async (changeId) => {
    if (!window.confirm('Sei sicuro di voler annullare questa modifica? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      await cancelPendingChange(changeId, token);
      alert('Modifica annullata con successo!');
      // Ricarica i dati
      fetchData();
    } catch (error) {
      console.error('Errore nell\'annullamento della modifica:', error);
      alert(`Errore nell'annullamento: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionLabel = (permission) => {
    const labels = {
      modifica_squadre: 'Modifica Squadre',
      gestione_giocatori: 'Gestione Calciatori',
      gestione_tornei: 'Gestione Tornei',
      modifica_impostazioni: 'Modifica Impostazioni',
      gestione_contratti: 'Gestione Contratti',
      gestione_richieste: 'Gestione Richieste'
    };
    return labels[permission] || permission;
  };

  const formatActionType = (actionType) => {
    const labels = {
      modifica_squadre: '🏆 Modifica Squadre',
      gestione_giocatori: '👥 Gestione Calciatori',
      gestione_tornei: '🏅 Gestione Tornei',
      modifica_impostazioni: '⚙️ Modifica Impostazioni',
      gestione_contratti: '📄 Gestione Contratti'
    };
    return labels[actionType] || actionType;
  };

  const formatActionData = (actionData) => {
    try {
      const data = typeof actionData === 'string' ? JSON.parse(actionData) : actionData;
      
      // Funzione helper per pulire i valori null
      const cleanValue = (value) => {
        if (value === null || value === undefined || value === 'null') {
          return 'N/A';
        }
        return value;
      };
      
      if (data && typeof data === 'object' && data.squadreModifiche) {
        const squadreMod = Object.entries(data.squadreModifiche);
        const addedPlayers = data.addedPlayers ? Object.values(data.addedPlayers).flat().length : 0;
        const removedPlayers = data.removedPlayers ? Object.values(data.removedPlayers).flat().length : 0;
        
        let description = [];
        
        if (squadreMod.length > 0) {
          description.push(`📝 Modifiche a ${squadreMod.length} squadra${squadreMod.length > 1 ? 'e' : ''}`);
          squadreMod.forEach(([squadraId, modifiche]) => {
            if (modifiche && typeof modifiche === 'object') {
            const modificheList = Object.entries(modifiche).map(([campo, valore]) => {
              const labels = {
                nome: 'Nome',
                immagine: 'Immagine',
                casse_societarie: 'Casse Societarie',
                club_level: 'Club Level',
                proprietario: 'Proprietario',
                note: 'Note'
              };
              return `${labels[campo] || campo}: ${valore}`;
            });
            description.push(`  • Squadra ${squadraId}: ${modificheList.join(', ')}`);
            }
          });
        }
        
        if (addedPlayers > 0) {
          description.push(`➕ ${addedPlayers} giocatore${addedPlayers > 1 ? 'i' : ''} aggiunto${addedPlayers > 1 ? 'i' : ''}`);
        }
        
        if (removedPlayers > 0) {
          description.push(`➖ ${removedPlayers} giocatore${removedPlayers > 1 ? 'i' : ''} rimosso${removedPlayers > 1 ? 'i' : ''}`);
        }
        
        return description.join('\n');
      }
      
      // Gestione modifiche giocatori
      if (data && typeof data === 'object' && data.modifiche && data.modifiche.giocatoreId && data.modifiche.modifiche) {
        // Struttura nested (nuova)
        const labels = {
          nome: 'Nome',
          cognome: 'Cognome',
          ruolo: 'Ruolo',
          media_voto: 'Media Voto',
          fantamedia_voto: 'Fantamedia Voto',
          squadra_reale: 'Squadra Reale',
          eta: 'Età',
          quotazione_iniziale: 'Quotazione Iniziale',
          costo_attuale: 'Ingaggio',
          quotazione_attuale: 'Quotazione Attuale',
          fanta_valore_mercato: 'Fanta Valore di Mercato',
          anni_contratto: 'Anni Contratto',
          prestito: 'Prestito',
          triggers: 'Triggers'
        };
        
        const modificheList = Object.entries(data.modifiche.modifiche).map(([campo, nuovoValore]) => {
          const valoreOriginale = cleanValue(data.modifiche.valoriOriginali?.[campo]) || 'N/A';
          return `${labels[campo] || campo}: ${valoreOriginale} → ${cleanValue(nuovoValore)}`;
        });
        
        // Ottieni il nome del giocatore, ruolo e squadra fantasy
        const giocatoreNome = cleanValue(data.modifiche.giocatore) || `ID ${data.modifiche.giocatoreId}` || 'Giocatore sconosciuto';
        const ruolo = cleanValue(data.modifiche.valoriOriginali?.ruolo) || cleanValue(data.modifiche.modifiche?.ruolo) || 'N/A';
        const squadraFantasy = cleanValue(data.modifiche.squadra) || 'N/A';
        
        // Debug log per capire cosa sta succedendo
        console.log('Debug SubadminArea formatActionData - nested structure:', {
          data,
          giocatoreNome,
          ruolo,
          squadraFantasy,
          modificheList
        });
        
        return `👤 ${giocatoreNome} (${ruolo}) - ${squadraFantasy}:\n  • ${modificheList.join('\n  • ')}`;
      } else if (data && typeof data === 'object' && data.giocatoreId && data.modifiche) {
        // Struttura flat (per compatibilità)
        const labels = {
          nome: 'Nome',
          cognome: 'Cognome',
          ruolo: 'Ruolo',
          media_voto: 'Media Voto',
          fantamedia_voto: 'Fantamedia Voto',
          squadra_reale: 'Squadra Reale',
          eta: 'Età',
          quotazione_iniziale: 'Quotazione Iniziale',
          costo_attuale: 'Ingaggio',
          quotazione_attuale: 'Quotazione Attuale',
          fanta_valore_mercato: 'Fanta Valore di Mercato',
          anni_contratto: 'Anni Contratto',
          prestito: 'Prestito',
          triggers: 'Triggers'
        };
        
        const modificheList = Object.entries(data.modifiche).map(([campo, nuovoValore]) => {
          const valoreOriginale = cleanValue(data.valoriOriginali?.[campo]) || 'N/A';
          return `${labels[campo] || campo}: ${valoreOriginale} → ${cleanValue(nuovoValore)}`;
        });
        
        // Ottieni il nome del giocatore, ruolo e squadra fantasy
        const giocatoreNome = cleanValue(data.giocatore) || `ID ${data.giocatoreId}` || 'Giocatore sconosciuto';
        const ruolo = cleanValue(data.valoriOriginali?.ruolo) || cleanValue(data.modifiche?.ruolo) || 'N/A';
        const squadraFantasy = cleanValue(data.squadra) || 'N/A';
        
        return `👤 ${giocatoreNome} (${ruolo}) - ${squadraFantasy}:\n  • ${modificheList.join('\n  • ')}`;
      }
      
      // Ensure we always return a string
      if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
      }
      
      return String(data || actionData || '');
    } catch (e) {
      console.error('Error formatting action data:', e);
      return typeof actionData === 'string' ? actionData : JSON.stringify(actionData);
    }
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento area subadmin...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  return (
    <Container>
      <Header>
        <Title>Area Subadmin</Title>
        <Subtitle>Gestione delle tue leghe e richieste di modifica</Subtitle>
      </Header>

      <InfoCard>
        <h3>Come funziona il sistema Subadmin</h3>
        <p>
          Come subadmin, hai accesso limitato alle leghe che ti sono state assegnate. 
          Puoi richiedere modifiche che verranno esaminate dall'amministratore della lega. 
          Le tue richieste appariranno nella sezione "Modifiche in Attesa" e "Storico Modifiche".
        </p>
      </InfoCard>

      <TabContainer>
        <Tab 
          $active={activeTab === 'leagues'} 
          onClick={() => setActiveTab('leagues')}
        >
          🏆 Le Mie Leghe ({subadminLeagues.length})
        </Tab>
        <Tab 
          $active={activeTab === 'pending'} 
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Modifiche in Attesa ({pendingChanges.length})
        </Tab>
        <Tab 
          $active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
        >
          📋 Storico Modifiche ({changeHistory.length})
        </Tab>
        <Tab 
          $active={activeTab === 'requests'} 
          onClick={() => setActiveTab('requests')}
        >
          📝 Gestione Richieste
        </Tab>
        <Tab 
          $active={activeTab === 'roster'} 
          onClick={() => setActiveTab('roster')}
        >
          📊 Gestione Roster A/B
        </Tab>
      </TabContainer>

      {activeTab === 'leagues' && (
        <Section>
          <SectionTitle>🏆 Le Mie Leghe</SectionTitle>
          
          {subadminLeagues.length > 0 ? (
            subadminLeagues.map(league => (
              <LeagueCard key={league.id} onClick={() => handleLeagueClick(league.id)}>
                <LeagueHeader>
                  <LeagueName>{league.nome}</LeagueName>
                  <ActionButton>Gestisci Lega</ActionButton>
                </LeagueHeader>
                
                <PermissionTags>
                  {Object.entries(league.permessi).map(([perm, value]) => (
                    <PermissionTag key={perm} $active={value}>
                      {getPermissionLabel(perm)}
                    </PermissionTag>
                  ))}
                </PermissionTags>
              </LeagueCard>
            ))
          ) : (
            <EmptyContainer>
              <h3>Nessuna lega assegnata</h3>
              <p>Non sei ancora stato assegnato come subadmin a nessuna lega.</p>
            </EmptyContainer>
          )}
        </Section>
      )}

      {activeTab === 'pending' && (
        <Section>
          <SectionTitle>⏳ Modifiche in Attesa</SectionTitle>
          
          {pendingChanges.length > 0 ? (
            pendingChanges.map(change => (
              <ChangeCard key={change.id}>
                <ChangeHeader>
                  <ChangeType>{formatActionType(change.action_type)}</ChangeType>
                  <ChangeDate>{formatDate(change.created_at)}</ChangeDate>
                </ChangeHeader>
                <ChangeDescription>
                  <strong>Lega:</strong> <LeagueLink onClick={() => handleLeagueClick(change.lega_id)}>{change.lega_nome}</LeagueLink><br/>
                  <strong>Modifiche:</strong><br/>
                  <pre style={{ 
                    background: '#f8f9fa', 
                    padding: '0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                    margin: '0.5rem 0'
                  }}>
                    {formatActionData(change.action_data)}
                  </pre>
                </ChangeDescription>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <StatusBadge className="pending">In Attesa</StatusBadge>
                  <ActionButton 
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelChange(change.id);
                    }}
                  >
                    ❌ Annulla
                  </ActionButton>
                </div>
              </ChangeCard>
            ))
          ) : (
            <EmptyContainer>
              <h3>Nessuna modifica in attesa</h3>
              <p>Non hai modifiche in attesa di approvazione.</p>
            </EmptyContainer>
          )}
        </Section>
      )}

      {activeTab === 'history' && (
        <Section>
          <SectionTitle>📋 Storico Modifiche</SectionTitle>
          
          {changeHistory.length > 0 ? (
            changeHistory.map(change => (
              <ChangeCard key={change.id} style={{ 
                background: change.status === 'approved' ? '#d4edda' : '#f8d7da',
                borderColor: change.status === 'approved' ? '#c3e6cb' : '#f5c6cb'
              }}>
                <ChangeHeader>
                  <ChangeType style={{ 
                    background: change.status === 'approved' ? '#28a745' : '#dc3545'
                  }}>
                    {formatActionType(change.action_type)}
                  </ChangeType>
                  <ChangeDate>{formatDate(change.created_at)}</ChangeDate>
                </ChangeHeader>
                <ChangeDescription>
                  <strong>Lega:</strong> <LeagueLink onClick={() => handleLeagueClick(change.lega_id)}>{change.lega_nome}</LeagueLink><br/>
                  <strong>Modifiche:</strong><br/>
                  <pre style={{ 
                    background: '#f8f9fa', 
                    padding: '0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                    margin: '0.5rem 0'
                  }}>
                    {formatActionData(change.action_data)}
                  </pre>
                  {change.admin_response && (
                    <><strong>Risposta Admin:</strong> {change.admin_response}<br/></>
                  )}
                  {change.reviewed_at && (
                    <><strong>Risolto il:</strong> {formatDate(change.reviewed_at)}<br/></>
                  )}
                </ChangeDescription>
                <StatusBadge className={change.status}>
                  {change.status === 'approved' ? 'Approvato' : 'Rifiutato'}
                </StatusBadge>
              </ChangeCard>
            ))
          ) : (
            <EmptyContainer>
              <h3>Nessuna modifica nello storico</h3>
              <p>Non hai ancora fatto modifiche alle leghe.</p>
            </EmptyContainer>
          )}
        </Section>
      )}

      {activeTab === 'requests' && (
        <Section>
          <SectionTitle>📝 Gestione Richieste</SectionTitle>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Gestisci le richieste di ingresso nelle tue leghe. Clicca il pulsante qui sotto per accedere alla pagina di gestione.
          </p>
          <ActionButton 
            onClick={() => navigate('/subadmin-requests')}
            style={{ marginTop: '1rem' }}
          >
            📋 Vai alla Gestione Richieste
          </ActionButton>
        </Section>
      )}

      {activeTab === 'roster' && (
        <Section>
          <SectionTitle>📊 Gestione Roster A/B</SectionTitle>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Gestisci i roster A/B per le squadre delle tue leghe. Seleziona una lega per iniziare.
          </p>
          
          {subadminLeagues.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {subadminLeagues.map(league => (
                <LeagueCard key={league.id} onClick={() => navigate(`/gestione-roster-admin/${league.id}`)}>
                  <LeagueHeader>
                    <LeagueName>{league.nome}</LeagueName>
                    <ActionButton>Gestisci Roster</ActionButton>
                  </LeagueHeader>
                  
                  <PermissionTags>
                    {Object.entries(league.permessi).map(([perm, value]) => (
                      <PermissionTag key={perm} $active={value}>
                        {getPermissionLabel(perm)}
                      </PermissionTag>
                    ))}
                  </PermissionTags>
                </LeagueCard>
              ))}
            </div>
          ) : (
            <EmptyContainer>
              <h3>Nessuna lega disponibile</h3>
              <p>Non hai accesso a nessuna lega per gestire i roster.</p>
            </EmptyContainer>
          )}
        </Section>
      )}
    </Container>
  );
};

export default SubadminArea; 