import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { getLegheAdmin, getRichiesteAdmin, rispondiRichiesta } from '../api/leghe';
import { getPendingChangesByLega } from '../api/subadmin';
import { getRichiestePendingByLega } from '../api/richiesteAdmin';
import { api } from '../api/config';
import { useNavigate } from 'react-router-dom';
import RosterABManager from '../components/RosterABManager';

// Clean, modern container
const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 1.5rem;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

// Simplified header
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
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

// Clean stats cards
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${props => props.$color || '#3b82f6'};
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
`;

// Main content layout
const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 1rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h3`
  color: #1e293b;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Badge = styled.span`
  background: ${props => props.$color || '#3b82f6'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
`;

// Clean table design
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #f8fafc;
  padding: 0.5rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.8rem;
`;

const Td = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f8fafc;
  }
`;

// Simplified badges
const TypeBadge = styled.span`
  background: ${props => props.$public ? '#10b981' : '#6b7280'};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
`;

// Clean action buttons
const ActionButton = styled.button`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#3b82f6';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'info': return '#06b6d4';
      case 'danger': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  color: white;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.7rem;
  
  &:hover {
    filter: brightness(0.9);
  }
`;

// Loading and empty states
const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1rem;
  color: #64748b;
  margin: 3rem 0;
  padding: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  margin: 1.5rem 0;
  padding: 1.5rem;
`;

const EmptyIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  color: #cbd5e1;
`;

const EmptyTitle = styled.h3`
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  font-size: 1rem;
`;

const EmptyText = styled.p`
  color: #64748b;
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
`;

const Button = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  &:hover {
    background: #2563eb;
  }
`;

// Request items
const RequestItem = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const RequestInfo = styled.div`
  flex: 1;
`;

const RequestUser = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
`;

const RequestEmail = styled.div`
  color: #64748b;
  font-size: 0.7rem;
`;

const RequestDetails = styled.div`
  margin-bottom: 0.5rem;
`;

const RequestLega = styled.div`
  font-weight: 500;
  color: #3b82f6;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
`;

const RequestSquadra = styled.div`
  color: #10b981;
  font-weight: 500;
  font-size: 0.8rem;
`;

const RequestMessage = styled.div`
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-style: italic;
  color: #475569;
  border-left: 2px solid #3b82f6;
  font-size: 0.8rem;
`;

const RequestActions = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const RequestDate = styled.div`
  font-size: 0.7rem;
  color: #64748b;
  text-align: right;
`;

// Success message
const SuccessMessage = styled.div`
  background: #ecfdf5;
  color: #065f46;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #a7f3d0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AreaAdmin = () => {
  const { token, user } = useAuth();
  const { notifications, markSubadminRequestsAsRead, markAsRead } = useNotification();
  const navigate = useNavigate();
  const [leghe, setLeghe] = useState([]);
  const [richieste, setRichieste] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingCounts, setPendingCounts] = useState({});

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Carica le leghe dell'admin
      const legheData = await api.get('/leghe/admin', token);
      setLeghe(legheData.data?.leghe || []);
      
      // Carica le richieste
      const richiesteData = await api.get('/leghe/richieste/admin', token);
      console.log('Richieste ricevute:', richiesteData);
      console.log('Richieste data type:', typeof richiesteData);
      console.log('Richieste keys:', Object.keys(richiesteData || {}));
      console.log('Richieste data:', richiesteData.data);
      
      // Verifica che richiesteData.data.richieste esista prima di usare forEach
      if (richiesteData && richiesteData.data && richiesteData.data.richieste && Array.isArray(richiesteData.data.richieste)) {
        // Debug: controlla se le richieste admin hanno lega_id
        richiesteData.data.richieste.forEach((richiesta, index) => {
          if (richiesta.tipo_richiesta === 'admin') {
            console.log(`Richiesta admin ${index}:`, {
              id: richiesta.id,
              lega_id: richiesta.lega_id,
              lega_nome: richiesta.lega_nome,
              squadra_nome: richiesta.squadra_nome
            });
          }
        });
        setRichieste(richiesteData.data.richieste);
      } else {
        console.warn('Richieste non trovate o formato non valido:', richiesteData);
        setRichieste([]);
      }
      
      // Carica pending per ogni lega
      const pendingCountsObj = {};
      if (leghe && leghe.length > 0) {
        await Promise.all(
          leghe.map(async (lega) => {
            try {
              const res = await getPendingChangesByLega(lega.id, token);
              pendingCountsObj[lega.id] = (res.changes || []).length;
            } catch (e) {
              pendingCountsObj[lega.id] = 0;
            }
          })
        );
      }
      setPendingCounts(pendingCountsObj);
    } catch (error) {
      console.error('Errore caricamento dati admin:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token, loadAdminData]);

  // Removed excessive notification refresh - handled by NotificationSystem

  const handleRispostaRichiesta = async (richiestaId, risposta) => {
    try {
      // Determina se è una richiesta di ingresso o admin
      if (richiestaId.startsWith('ingresso_')) {
        const realId = richiestaId.replace('ingresso_', '');
        await rispondiRichiesta(realId, { risposta, messaggio: '' }, token);
        
        // Marca come lette le notifiche relative a questa richiesta
        const relatedNotifications = notifications.filter(n => {
          if (n.tipo !== 'richiesta_ingresso' || !n.dati_aggiuntivi) return false;
          
          try {
            let dati;
            // Se è già un oggetto, usalo direttamente
            if (typeof n.dati_aggiuntivi === 'object') {
              dati = n.dati_aggiuntivi;
            } else {
              // Altrimenti prova a parsarlo come JSON
              dati = JSON.parse(n.dati_aggiuntivi);
            }
            return dati.richiesta_id === parseInt(realId);
          } catch (error) {
            console.error('Errore parsing dati_aggiuntivi per notifica:', n.id, error);
            return false;
          }
        });
        
        for (const notification of relatedNotifications) {
          await markAsRead(notification.id);
        }
      } else if (richiestaId.startsWith('admin_')) {
        const realId = richiestaId.replace('admin_', '');
        // Per ora, naviga alla gestione richieste admin
        // TODO: Implementare gestione diretta delle richieste admin
        navigate(`/gestione-richieste-admin/${realId}`);
        return;
      }
      
      setSuccessMessage(`Richiesta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadAdminData();
    } catch (error) {
      console.error('Errore risposta richiesta:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGestioneTornei = (legaId) => {
    navigate(`/gestione-tornei/${legaId}`);
  };

  const handleScrapingManager = (legaId) => {
    navigate(`/scraping-manager/${legaId}`);
  };

  const handleGestioneSubadmin = async (legaId) => {
    // Marca come lette le notifiche subadmin_request per questa lega
    const unreadNotifications = notifications.filter(n => 
      n.tipo === 'subadmin_request' && 
      (!n.letto || n.letto === 0) &&
      n.lega_id === legaId
    );
    
    if (unreadNotifications.length > 0) {
      try {
        // Marca come lette solo le notifiche non lette per questa lega
        for (const notification of unreadNotifications) {
          await markAsRead(notification.id);
        }
        console.log(`Marcate come lette ${unreadNotifications.length} notifiche per la lega ${legaId}`);
      } catch (error) {
        console.error('Errore marcatura notifiche come lette:', error);
      }
    }
    
    navigate(`/league-admin/${legaId}`);
  };

  // Calcola statistiche
  const totalLeghe = leghe.length;
  const totalSquadre = leghe.reduce((sum, lega) => sum + (lega.squadre_assegnate || 0), 0);
  const totalRichieste = richieste.length;

  if (loading) {
    return (
      <Container>
        <ContentWrapper>
          <LoadingMessage>Caricamento dashboard admin...</LoadingMessage>
        </ContentWrapper>
      </Container>
    );
  }

  return (
    <Container>
      <ContentWrapper>
        <Header>
          <Title>Dashboard Admin</Title>
          <Subtitle>Gestisci le tue leghe e monitora le attività</Subtitle>
        </Header>

        {successMessage && (
          <SuccessMessage>
            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
            {successMessage}
          </SuccessMessage>
        )}

        {/* Statistiche */}
        <StatsGrid>
          <StatCard>
            <StatNumber $color="#3b82f6">{totalLeghe}</StatNumber>
            <StatLabel>Leghe Gestite</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber $color="#10b981">{totalSquadre}</StatNumber>
            <StatLabel>Squadre Assegnate</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber $color="#f59e0b">{leghe.reduce((sum, lega) => sum + (lega.numero_tornei || 0), 0)}</StatNumber>
            <StatLabel>Tornei Totali</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber $color="#ef4444">{totalRichieste}</StatNumber>
            <StatLabel>Richieste in Attesa</StatLabel>
          </StatCard>
        </StatsGrid>

        <MainGrid>
          {/* Sezione Leghe */}
          <Section>
            <SectionHeader>
              <SectionTitle>
                Le tue Leghe
                <Badge $color="#3b82f6">{totalLeghe}</Badge>
              </SectionTitle>
            </SectionHeader>
            
            {leghe.length === 0 ? (
              <EmptyState>
                <EmptyIcon>🏆</EmptyIcon>
                <EmptyTitle>Nessuna lega amministrata</EmptyTitle>
                <EmptyText>Non hai ancora creato o amministrato nessuna lega.</EmptyText>
                <Button onClick={() => navigate('/crea-lega')}>
                  Crea la tua prima lega
                </Button>
              </EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Nome Lega</Th>
                    <Th>Squadre</Th>
                    <Th>Tornei</Th>
                    <Th>Tipo</Th>
                    <Th>Data Creazione</Th>
                    <Th>Azioni</Th>
                  </tr>
                </thead>
                <tbody>
                  {leghe.map(lega => (
                    <Tr key={lega.id}>
                      <Td>
                        <div 
                          style={{ 
                            fontWeight: '700', 
                            color: '#f59e0b', 
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease'
                          }}
                          onClick={() => navigate(`/lega/${lega.id}`)}
                          onMouseEnter={(e) => e.target.style.color = '#d97706'}
                          onMouseLeave={(e) => e.target.style.color = '#f59e0b'}
                        >
                          {lega.nome}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontWeight: '600', color: '#10b981', fontSize: '0.8rem' }}>
                            {lega.squadre_assegnate || 0}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>/</span>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            {lega.numero_squadre_totali || 0}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontWeight: '600', color: '#f59e0b', fontSize: '0.8rem' }}>
                            {lega.numero_tornei || 0}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {(lega.numero_tornei || 0) === 1 ? 'torneo' : 'tornei'}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <TypeBadge $public={lega.is_pubblica}>
                          {lega.is_pubblica ? 'Pubblica' : 'Privata'}
                        </TypeBadge>
                      </Td>
                      <Td>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {lega.data_creazione_formattata || 'N/A'}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <ActionButton 
                            $variant="success"
                            onClick={() => handleGestioneTornei(lega.id)}
                          >
                            Tornei
                          </ActionButton>
                          <ActionButton 
                            $variant="warning"
                            onClick={() => handleGestioneSubadmin(lega.id)}
                            style={{ position: 'relative' }}
                          >
                            Subadmin
                            {pendingCounts[lega.id] > 0 && (
                              <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: '#ff3b30',
                                color: 'white',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6rem',
                                fontWeight: '600',
                                border: '2px solid white'
                              }}>
                                {pendingCounts[lega.id] > 9 ? '9+' : pendingCounts[lega.id]}
                              </span>
                            )}
                          </ActionButton>
                          <ActionButton 
                            $variant="info"
                            onClick={() => handleScrapingManager(lega.id)}
                          >
                            Sync
                          </ActionButton>
                          <ActionButton 
                            $variant="primary"
                            onClick={() => navigate(`/gestione-richieste-admin/${lega.id}`)}
                          >
                            Richieste Admin
                          </ActionButton>
                          <ActionButton 
                            $variant="danger"
                            onClick={() => navigate(`/modifica-lega/${lega.id}`)}
                          >
                            Modifica
                          </ActionButton>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Section>

          {/* Sezione Richieste */}
          <Section>
            <SectionHeader>
              <SectionTitle>
                Richieste
                <Badge $color="#ef4444">{totalRichieste}</Badge>
              </SectionTitle>
            </SectionHeader>
            
            {richieste.length === 0 ? (
              <EmptyState style={{ margin: '1rem 0', padding: '1rem' }}>
                <EmptyIcon style={{ fontSize: '1.5rem' }}>✅</EmptyIcon>
                <EmptyTitle style={{ fontSize: '0.9rem' }}>Nessuna richiesta</EmptyTitle>
                <EmptyText style={{ fontSize: '0.8rem' }}>
                  Non ci sono richieste di ingresso o richieste admin in attesa.
                </EmptyText>
              </EmptyState>
            ) : (
              <div>
                {richieste.map(richiesta => (
                  <RequestItem key={richiesta.id}>
                    <RequestHeader>
                      <RequestInfo>
                        <RequestUser>
                          {richiesta.tipo_richiesta === 'admin' ? 
                            `Richiesta Admin - ${richiesta.utente_nome}` : 
                            richiesta.utente_nome
                          }
                        </RequestUser>
                        <RequestEmail>
                          {richiesta.tipo_richiesta === 'admin' ? 
                            `Tipo: ${richiesta.tipo_richiesta_richiesta} | Email: ${richiesta.utente_email}` : 
                            richiesta.utente_email
                          }
                        </RequestEmail>
                      </RequestInfo>
                      <RequestDate>{formatDate(richiesta.data_richiesta)}</RequestDate>
                    </RequestHeader>
                    
                    <RequestDetails>
                      <RequestLega>{richiesta.lega_nome}</RequestLega>
                      <RequestSquadra>{richiesta.squadra_nome}</RequestSquadra>
                      {richiesta.tipo_richiesta === 'admin' && (
                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600', marginTop: '0.25rem' }}>
                          📋 Richiesta: {richiesta.tipo_richiesta_richiesta}
                        </div>
                      )}
                      {richiesta.tipo_richiesta === 'user' && richiesta.messaggio_richiesta && (
                        <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '500', marginTop: '0.25rem' }}>
                          💬 Messaggio: {richiesta.messaggio_richiesta}
                        </div>
                      )}
                    </RequestDetails>
                    
                    <RequestActions>
                      {richiesta.tipo_richiesta === 'admin' ? (
                        <>
                          <ActionButton 
                            $variant="success"
                            onClick={() => {
                              // Fallback: se richiesta.lega_id è undefined, cerca la lega per nome
                              let targetLegaId = richiesta.lega_id;
                              if (!targetLegaId && richiesta.lega_nome) {
                                const matchingLega = leghe.find(l => l.nome === richiesta.lega_nome);
                                targetLegaId = matchingLega ? matchingLega.id : null;
                              }
                              if (targetLegaId) {
                                navigate(`/gestione-richieste-admin/${targetLegaId}`);
                              } else {
                                console.error('Impossibile trovare lega_id per richiesta:', richiesta);
                                alert('Errore: impossibile determinare la lega per questa richiesta');
                              }
                            }}
                          >
                            Gestisci
                          </ActionButton>
                        </>
                      ) : (
                        <>
                          <ActionButton 
                            $variant="success"
                            onClick={() => handleRispostaRichiesta(richiesta.id, 'accetta')}
                          >
                            Accetta
                          </ActionButton>
                          <ActionButton 
                            $variant="danger"
                            onClick={() => handleRispostaRichiesta(richiesta.id, 'rifiuta')}
                          >
                            Rifiuta
                          </ActionButton>
                        </>
                      )}
                    </RequestActions>
                  </RequestItem>
                ))}
              </div>
            )}
          </Section>

          {/* Sezione Gestione Roster A/B */}
          <Section>
            <SectionHeader>
              <SectionTitle>
                📊 Gestione Roster A/B
                <Badge $color="#3b82f6">Admin Only</Badge>
              </SectionTitle>
            </SectionHeader>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                Seleziona una squadra per gestire i roster A/B. Solo admin, superadmin e subadmin possono modificare i roster.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {leghe.map(lega => (
                  <div key={lega.id} style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => navigate(`/gestione-roster-admin/${lega.id}`)}
                  onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.background = '#f8fafc'}
                  >
                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                      {lega.nome}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {lega.squadre_assegnate || 0} squadre • {lega.numero_tornei || 0} tornei
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                      👆 Clicca per gestire roster
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </MainGrid>
      </ContentWrapper>
    </Container>
  );
};

export default AreaAdmin; 