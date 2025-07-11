import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../api/config.js';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 14px;
`;

const NotificheGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const NotificaCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => {
    switch (props.tipo) {
      case 'proposta_trasferimento': return '#ff8c42';
      case 'proposta_prestito': return '#4CAF50';
      case 'richiesta_admin': return '#2196F3';
      case 'rinnovo_contratto': return '#9C27B0';
      case 'club_level': return '#FF9800';
      default: return '#666';
    }
  }};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const NotificaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const NotificaTipo = styled.span`
  background: ${props => {
    switch (props.tipo) {
      case 'proposta_trasferimento': return '#fff3e0';
      case 'proposta_prestito': return '#e8f5e8';
      case 'richiesta_admin': return '#e3f2fd';
      case 'rinnovo_contratto': return '#f3e5f5';
      case 'club_level': return '#fff8e1';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.tipo) {
      case 'proposta_trasferimento': return '#e65100';
      case 'proposta_prestito': return '#2e7d32';
      case 'richiesta_admin': return '#1565c0';
      case 'rinnovo_contratto': return '#7b1fa2';
      case 'club_level': return '#f57c00';
      default: return '#666';
    }
  }};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const NotificaData = styled.span`
  color: #666;
  font-size: 12px;
`;

const NotificaMessaggio = styled.div`
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
`;

const NotificaAzioni = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const AcceptButton = styled(Button)`
  background: #4CAF50;
  color: white;
  
  &:hover {
    background: #45a049;
  }
`;

const RejectButton = styled(Button)`
  background: #f44336;
  color: white;
  
  &:hover {
    background: #da190b;
  }
`;

const ViewButton = styled(Button)`
  background: #2196F3;
  color: white;
  
  &:hover {
    background: #1976D2;
  }
`;

const ArchiveButton = styled(Button)`
  background: #9e9e9e;
  color: white;
  
  &:hover {
    background: #757575;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const NotificheManager = () => {
  const [notifiche, setNotifiche] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('tutte');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifiche();
  }, []);

  const fetchNotifiche = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await api.get('/notifiche', token);
      setNotifiche(data.notifiche || []);
    } catch (error) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (notificaId) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/notifiche/${notificaId}/accept`, {}, token);
      // Aggiorna la notifica localmente
      setNotifiche(prev => prev.map(n => 
        n.id === notificaId ? { ...n, stato: 'accettata' } : n
      ));
    } catch (error) {
      console.error('Errore nell\'accettazione:', error);
    }
  };

  const handleReject = async (notificaId) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/notifiche/${notificaId}/reject`, {}, token);
      setNotifiche(prev => prev.map(n => 
        n.id === notificaId ? { ...n, stato: 'rifiutata' } : n
      ));
    } catch (error) {
      console.error('Errore nel rifiuto:', error);
    }
  };

  const handleArchive = async (notificaId) => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/notifiche/${notificaId}/archive`, {}, token);
      setNotifiche(prev => prev.filter(n => n.id !== notificaId));
    } catch (error) {
      console.error('Errore nell\'archiviazione:', error);
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'proposta_trasferimento': return 'Proposta Trasferimento';
      case 'proposta_prestito': return 'Proposta Prestito';
      case 'richiesta_admin': return 'Richiesta Admin';
      case 'rinnovo_contratto': return 'Rinnovo Contratto';
      case 'club_level': return 'Club Level';
      default: return tipo;
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'proposta_trasferimento': return '🔄';
      case 'proposta_prestito': return '📋';
      case 'richiesta_admin': return '👨‍💼';
      case 'rinnovo_contratto': return '📝';
      case 'club_level': return '⭐';
      default: return '📢';
    }
  };

  const getNotificationBackgroundColor = (type) => {
    switch (type) {
      case 'trasferimento': return '#d4edda';
      case 'offerta': return '#d1ecf1';
      case 'sistema': return '#e2d9f3';
      case 'richiesta_admin': return '#e3f2fd';
      case 'richiesta_ingresso': return '#d4edda';
      case 'risposta_richiesta': return '#e2d9f3';
      case 'richiesta_unione_squadra': return '#ffeaa7';
      case 'risposta_richiesta_unione': return '#d1f2eb';
      default: return '#cce7ff';
    }
  };

  const getNotificationBorderColor = (type) => {
    switch (type) {
      case 'trasferimento': return '#28a745';
      case 'offerta': return '#17a2b8';
      case 'sistema': return '#6f42c1';
      case 'richiesta_admin': return '#1565c0';
      case 'richiesta_ingresso': return '#28a745';
      case 'risposta_richiesta': return '#6f42c1';
      case 'richiesta_unione_squadra': return '#fd7e14';
      case 'risposta_richiesta_unione': return '#20c997';
      default: return '#007bff';
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'trasferimento': return 'Trasferimento';
      case 'offerta': return 'Offerta';
      case 'sistema': return 'Sistema';
      case 'richiesta_admin': return 'Richiesta Admin';
      case 'richiesta_ingresso': return 'Richiesta Ingresso';
      case 'risposta_richiesta': return 'Risposta Richiesta';
      case 'richiesta_unione_squadra': return 'Richiesta Unione Squadra';
      case 'risposta_richiesta_unione': return 'Risposta Richiesta Unione';
      default: return 'Notifica';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trasferimento': return '🔄';
      case 'offerta': return '💰';
      case 'sistema': return '⚙️';
      case 'richiesta_admin': return '👨‍💼';
      case 'richiesta_ingresso': return '🔐';
      case 'risposta_richiesta': return '✅';
      case 'richiesta_unione_squadra': return '👥';
      case 'risposta_richiesta_unione': return '🎯';
      default: return '📢';
    }
  };

  const filteredNotifiche = notifiche.filter(notifica => {
    if (filter === 'tutte') return true;
    if (filter === 'non_lette') return !notifica.letto;
    if (filter === 'trasferimenti') return notifica.tipo.includes('trasferimento');
    if (filter === 'prestiti') return notifica.tipo.includes('prestito');
    if (filter === 'richieste') return notifica.tipo.includes('richiesta');
    return true;
  });

  if (loading) {
    return (
      <Container>
        <div>Caricamento notifiche...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ color: 'red' }}>{error}</div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📢 Notifiche</Title>
        <div>Totale: {notifiche.length}</div>
      </Header>

      <FilterContainer>
        <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="tutte">Tutte le notifiche</option>
          <option value="non_lette">Non lette</option>
          <option value="trasferimenti">Trasferimenti</option>
          <option value="prestiti">Prestiti</option>
          <option value="richieste">Richieste</option>
        </FilterSelect>
      </FilterContainer>

      {filteredNotifiche.length === 0 ? (
        <EmptyState>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <div>Nessuna notifica trovata</div>
        </EmptyState>
      ) : (
        <NotificheGrid>
          {filteredNotifiche.map(notifica => (
            <NotificaCard key={notifica.id} tipo={notifica.tipo}>
              <NotificaHeader>
                <NotificaTipo tipo={notifica.tipo}>
                  {getNotificationIcon(notifica.tipo)} {getTipoLabel(notifica.tipo)}
                </NotificaTipo>
                <NotificaData>
                  {new Date(notifica.data_creazione).toLocaleString('it-IT')}
                </NotificaData>
              </NotificaHeader>
              
              <NotificaMessaggio>
                {notifica.messaggio}
              </NotificaMessaggio>
              
              <NotificaAzioni>
                {!notifica.letto && (
                  <>
                    <AcceptButton onClick={() => handleAccept(notifica.id)}>
                      ✅ Accetta
                    </AcceptButton>
                    <RejectButton onClick={() => handleReject(notifica.id)}>
                      ❌ Rifiuta
                    </RejectButton>
                  </>
                )}
                <ViewButton onClick={() => console.log('Visualizza dettagli')}>
                  👁️ Dettagli
                </ViewButton>
                <ArchiveButton onClick={() => handleArchive(notifica.id)}>
                  📁 Archivia
                </ArchiveButton>
              </NotificaAzioni>
            </NotificaCard>
          ))}
        </NotificheGrid>
      )}
    </Container>
  );
};

export default NotificheManager; 