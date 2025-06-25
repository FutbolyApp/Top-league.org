import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { getLegheAdmin } from '../api/leghe';
import { getNotificheAdmin } from '../api/notifiche';
import { useNavigate, Link } from 'react-router-dom';
import { getRichiesteAdmin, rispondiRichiesta } from '../api/leghe';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin: 0;
`;

const LegheTable = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  color: #333;
  vertical-align: middle;
`;

const StatusBadge = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'attiva': return '#28a745';
      case 'inattiva': return '#dc3545';
      case 'in_corso': return '#ffc107';
      default: return '#6c757d';
    }
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const TypeBadge = styled.span`
  background: ${props => props.$public ? '#28a745' : '#6c757d'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 0.8rem;
  margin-right: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:nth-child(2) {
    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  }
  
  &:nth-child(3) {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  }
  
  &:nth-child(4) {
    background: linear-gradient(135deg, #6f42c1 0%, #6610f2 100%);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  margin: 3rem 0;
`;

const EmptyState = styled.div`
  text-align: center;
  margin: 3rem 0;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h2`
  color: #333;
  margin: 0 0 1rem 0;
`;

const EmptyText = styled.p`
  color: #666;
  margin: 0 0 2rem 0;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const NotificationsSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
`;

const NotificationsTitle = styled.h3`
  color: #333;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NotificationItem = styled.div`
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: ${props => props.$read ? '#f8f9fa' : 'white'};
  cursor: pointer;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const NotificationMessage = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const NotificationDate = styled.div`
  color: #999;
  font-size: 0.8rem;
`;

const AreaAdmin = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [leghe, setLeghe] = useState([]);
  const [notifiche, setNotifiche] = useState([]);
  const [richieste, setRichieste] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user && token) {
      loadAdminData();
    }
  }, [user, token]);

  const loadAdminData = async () => {
    try {
      // DEBUG: log prima delle chiamate API
      // eslint-disable-next-line
      console.log('Calling APIs with token:', token);
      
      const [legheData, richiesteData] = await Promise.all([
        getLegheAdmin(token),
        getRichiesteAdmin(token)
      ]);
      
      // DEBUG: log risposte API
      // eslint-disable-next-line
      console.log('LEGHE ADMIN:', legheData);
      console.log('RICHIESTE ADMIN:', richiesteData);
      
      setLeghe(legheData.leghe || []);
      setRichieste(richiesteData.richieste || []);
      setNotifiche([]); // Per ora non carichiamo le notifiche admin
    } catch (error) {
      console.error('Errore caricamento dati admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRispostaRichiesta = async (richiestaId, risposta) => {
    try {
      await rispondiRichiesta(richiestaId, { risposta }, token);
      setSuccessMessage(`Richiesta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo!`);
      
      // Rimuovi la richiesta dalla lista
      setRichieste(prev => prev.filter(r => r.id !== richiestaId));
      
      // Ricarica le leghe per aggiornare i conteggi
      const legheData = await getLegheAdmin(token);
      setLeghe(legheData.leghe || []);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Errore nella risposta:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGestioneTornei = (legaId) => {
    navigate(`/tornei/${legaId}`);
  };

  const handleDashboardAvanzata = (squadraId) => {
    navigate(`/dashboard/${squadraId}`);
  };

  const handleScrapingManager = (legaId) => {
    navigate(`/scraping-manager/${legaId}`);
  };

  return (
    <Container>
      <Header>
        <Title>🔧 Area Admin</Title>
        <Subtitle>Gestisci le tue leghe e monitora le attività</Subtitle>
      </Header>

      {successMessage && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid #c3e6cb'
        }}>
          {successMessage}
        </div>
      )}

      {loading ? (
        <LoadingMessage>Caricamento leghe...</LoadingMessage>
      ) : (
        <>
          {/* Sezione Richieste di Ingresso */}
          {richieste.length > 0 && (
            <LegheTable>
              <NotificationsTitle>📨 Richieste di Ingresso ({richieste.length})</NotificationsTitle>
              <Table>
                <thead>
                  <tr>
                    <Th>Utente</Th>
                    <Th>Lega</Th>
                    <Th>Squadra</Th>
                    <Th>Messaggio</Th>
                    <Th>Data</Th>
                    <Th>Azioni</Th>
                  </tr>
                </thead>
                <tbody>
                  {richieste.map(richiesta => (
                    <tr key={richiesta.id}>
                      <Td>
                        <div>
                          <strong>{richiesta.utente_nome}</strong>
                          <br />
                          <small style={{ color: '#999' }}>{richiesta.utente_email}</small>
                        </div>
                      </Td>
                      <Td>
                        <strong>{richiesta.lega_nome}</strong>
                      </Td>
                      <Td>
                        <strong>{richiesta.squadra_nome}</strong>
                      </Td>
                      <Td>
                        <div style={{ maxWidth: '200px', wordWrap: 'break-word', fontSize: '0.9rem', color: '#666' }}>
                          {richiesta.messaggio_richiesta || 'Nessun messaggio'}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ fontSize: '0.8rem', color: '#999' }}>
                          {formatDate(richiesta.data_richiesta)}
                        </div>
                      </Td>
                      <Td>
                        <ActionButton
                          style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }}
                          onClick={() => handleRispostaRichiesta(richiesta.id, 'accetta')}
                        >
                          ✓ Accetta
                        </ActionButton>
                        <ActionButton
                          style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}
                          onClick={() => handleRispostaRichiesta(richiesta.id, 'rifiuta')}
                        >
                          ✗ Rifiuta
                        </ActionButton>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </LegheTable>
          )}

          {/* Sezione Leghe */}
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
            <LegheTable>
              <NotificationsTitle>🏆 Le tue Leghe ({leghe.length})</NotificationsTitle>
              <Table>
                <thead>
                  <tr>
                    <Th>Nome</Th>
                    <Th>Squadre</Th>
                    <Th>Data creazione</Th>
                    <Th>Tipo</Th>
                    <Th>Azioni</Th>
                  </tr>
                </thead>
                <tbody>
                  {leghe.map(lega => (
                    <tr key={lega.id}>
                      <Td>{lega.nome}</Td>
                      <Td>{lega.squadre_assegnate || 0}/{lega.numero_squadre_totali || 0}</Td>
                      <Td>{lega.data_creazione_formattata || 'N/A'}</Td>
                      <Td><TypeBadge $public={lega.is_pubblica}>{lega.is_pubblica ? 'Pubblica' : 'Privata'}</TypeBadge></Td>
                      <Td>
                        <ActionButton onClick={() => navigate(`/lega/${lega.id}`)}>
                          👁️ Visualizza
                        </ActionButton>
                        
                        <ActionButton onClick={() => handleGestioneTornei(lega.id)}>
                          🏆 Tornei
                        </ActionButton>
                        
                        <ActionButton onClick={() => handleScrapingManager(lega.id)}>
                          🔄 Scraping
                        </ActionButton>
                        
                        <ActionButton onClick={() => handleDashboardAvanzata(lega.id)}>
                          📊 Dashboard
                        </ActionButton>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </LegheTable>
          )}
        </>
      )}

      {notifiche.length > 0 && (
        <NotificationsSection>
          <NotificationsTitle>🔔 Notifiche Admin</NotificationsTitle>
          {notifiche.slice(0, 5).map(notifica => (
            <NotificationItem key={notifica.id} $read={notifica.letta}>
              <NotificationTitle>{notifica.titolo}</NotificationTitle>
              <NotificationMessage>{notifica.messaggio}</NotificationMessage>
              <NotificationDate>
                {new Date(notifica.data_creazione).toLocaleDateString('it-IT')}
              </NotificationDate>
            </NotificationItem>
          ))}
        </NotificationsSection>
      )}
    </Container>
  );
};

export default AreaAdmin; 