import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/config.js';
import { useNotification } from '../components/NotificationSystem';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
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
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const Title = styled.h1`
  color: #1d1d1f;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #5856d6;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.4rem;
  }
`;

const ArchiveButton = styled.button`
  background: #5856d6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: #4a4a9e;
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
`;

const FilterContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #e5e5e7;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  min-width: 150px;
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
`;

const DateFilterContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: #218838;
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
`;

const NotificationCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid ${props => props.$type === 'unread' ? '#5856d6' : '#e5e5e7'};
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const NotificationTitle = styled.h3`
  color: #1d1d1f;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const NotificationTime = styled.span`
  color: #86868b;
  font-size: 0.8rem;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const NotificationMessage = styled.p`
  color: #666;
  margin: 0.5rem 0;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionBtn = styled.button`
  background: ${props => props.$variant === 'danger' ? '#ff3b30' : '#5856d6'};
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: ${props => props.$variant === 'danger' ? '#d70015' : '#4a4a9e'};
  }
  
  @media (max-width: 768px) {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #86868b;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const EmptyTitle = styled.h3`
  color: #1d1d1f;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const EmptyMessage = styled.p`
  color: #86868b;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const LoadMoreButton = styled.button`
  background: #5856d6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  margin-top: 1rem;
  
  &:hover {
    background: #4a4a9e;
  }
  
  @media (max-width: 768px) {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
`;

// Styled components per il popup di mercato
const MarketModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
`;

const MarketModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  cursor: default;
`;

const MarketModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
`;

const MarketModalTitle = styled.h2`
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
`;

const MarketModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #333;
  }
`;

const MarketModalBody = styled.div`
  padding: 10px 20px;
`;

const MarketDetailsSection = styled.div`
  margin-bottom: 10px;
`;

const MarketDetailTitle = styled.h3`
  margin: 0 0 6px 0;
  color: #333;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 2px solid #ffc107;
  padding-bottom: 2px;
`;

const MarketDetailGrid = styled.div`
  display: grid;
  gap: 6px;
`;

const MarketDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
`;

const MarketDetailLabel = styled.span`
  font-weight: 600;
  color: #555;
  font-size: 11px;
`;

const MarketDetailValue = styled.span`
  color: #333;
  font-size: 11px;
`;

const MarketImpactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const MarketImpactItem = styled.div`
  padding: 6px 8px;
  background: #fff3cd;
  border-radius: 6px;
  border: 1px solid #ffeaa7;
`;

const MarketImpactLabel = styled.div`
  font-weight: 600;
  color: #856404;
  margin-bottom: 3px;
  font-size: 11px;
`;

const MarketImpactBefore = styled.div`
  color: #856404;
  font-size: 10px;
  margin-bottom: 1px;
`;

const MarketImpactAfter = styled.div`
  color: #856404;
  font-size: 10px;
  font-weight: 600;
`;

const MarketModalFooter = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 12px 20px;
  border-top: 1px solid #eee;
`;

const MarketActionButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  
  background: ${props => {
    if (props.disabled) return '#6c757d';
    return props.$variant === 'danger' ? '#dc3545' : '#28a745';
  }};
  color: white;
  
  &:hover {
    background: ${props => {
      if (props.disabled) return '#6c757d';
      return props.$variant === 'danger' ? '#c82333' : '#218838';
    }};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const NotifichePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('tutte');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [userLeagues, setUserLeagues] = useState([]);
  const [notificationsPerPage] = useState(6);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [selectedMarketNotification, setSelectedMarketNotification] = useState(null);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [processingMarketAction, setProcessingMarketAction] = useState(false);
  const [offerProcessed, setOfferProcessed] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivingNotifications, setArchivingNotifications] = useState(false);
  
  // Stati per i popup delle richieste admin
  const [showRequestResponseModal, setShowRequestResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [processingResponse, setProcessingResponse] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    loadNotifications();
    loadUserLeagues();
    // Marca tutte le notifiche come lette quando si arriva alla pagina
    markAllAsReadOnPageLoad();
  }, [user, token]);

  const markAllAsReadOnPageLoad = async () => {
    try {
      // Marca tutte le notifiche non lette come lette
      const unreadNotifications = notifications.filter(n => !n.letta);
      if (unreadNotifications.length > 0) {
        await Promise.all(unreadNotifications.map(n => markAsRead(n.id)));
        console.log('✅ Tutte le notifiche marcate come lette');
      }
    } catch (error) {
      console.error('❌ Errore nel marcare le notifiche come lette:', error);
    }
  };

  // Funzione per gestire la risposta a una richiesta admin
  const handleAdminRequestResponse = async (richiesta, risposta) => {
    try {
      setProcessingResponse(true);
      
      const response = await api.post(`/richieste-admin/${richiesta.id}/gestisci`, {
        azione: risposta === 'accetta' ? 'accepted' : 'rejected',
        note_admin: responseMessage,
        valore_costo: richiesta.dati_richiesta?.valore_costo || 0
      }, token);

      if (response.ok) {
        showNotification(
          `Richiesta ${risposta === 'accetta' ? 'accettata' : 'rifiutata'} con successo!`,
          'success'
        );
        
        // Ricarica le notifiche
        await loadNotifications();
        
        // Chiudi i popup
        setShowRequestResponseModal(false);
        setSelectedRequest(null);
        setResponseMessage('');
      } else {
        showNotification('Errore durante la gestione della richiesta', 'error');
      }
    } catch (error) {
      console.error('Errore gestione richiesta admin:', error);
      showNotification('Errore durante la gestione della richiesta', 'error');
    } finally {
      setProcessingResponse(false);
    }
  };

  // Funzione per aprire il popup di risposta
  const openResponseModal = (richiesta) => {
    setSelectedRequest(richiesta);
    setResponseMessage('');
    setShowRequestResponseModal(true);
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('🔄 Loading notifications...');
      const response = await api.get('/notifiche', token);
      
      console.log('📊 Notification response:', response);
      
      if (response && (response.ok || response.notifiche)) {
        // Gestione compatibile con mock API (risposta diretta) e API reale (risposta.data)
        const notificheData = response?.data?.notifiche || response?.notifiche || [];
        
        if (Array.isArray(notificheData)) {
          const notificheNormalizzate = notificheData.map(n => {
            const dati_aggiuntivi = n.dati_aggiuntivi ? 
              (typeof n.dati_aggiuntivi === 'string' ? JSON.parse(n.dati_aggiuntivi) : n.dati_aggiuntivi) : 
              {};
            
            return {
              ...n,
              letta: n.letta || n.letto === 1,
              dati_aggiuntivi: dati_aggiuntivi
            };
          });
          
          setNotifications(notificheNormalizzate);
          setDisplayedNotifications(notificheNormalizzate.slice(0, notificationsPerPage));
          setCurrentPage(1);
          console.log('✅ Notifications loaded successfully');
        } else {
          console.error('❌ Invalid notifications data format:', notificheData);
          setError('Formato dati notifiche non valido');
        }
      } else {
        console.error('❌ Notification API error:', response);
        setError('Errore nel caricamento delle notifiche: ' + (response?.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('❌ Notification loading error:', error);
      setError('Errore di connessione: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLeagues = async () => {
    try {
      const response = await api.get('/leghe/user-leagues', token);
      if (response.ok) {
        setUserLeagues(response?.data?.leghe || []);
      } else {
        console.error('Errore nel caricamento delle leghe:', response);
      }
    } catch (error) {
      console.error('Errore di connessione per leghe:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifiche/${notificationId}/letta`, {}, token);
      
      setNotifications(prev => 
        prev?.map(n => n.id === notificationId ? { ...n, letta: true, letto: 1 } : n)
      );
      setDisplayedNotifications(prev => 
        prev?.map(n => n.id === notificationId ? { ...n, letta: true, letto: 1 } : n)
      );
    } catch (error) {
      console.error('Errore marcatura notifica come letta:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifiche/tutte-lette', {}, token);
      
      setNotifications(prev => 
        prev?.map(n => ({ ...n, letta: true, letto: 1 }))
      );
      setDisplayedNotifications(prev => 
        prev?.map(n => ({ ...n, letta: true, letto: 1 }))
      );
    } catch (error) {
      console.error('Errore marcatura tutte notifiche come lette:', error);
    }
  };

  const isMarketNotification = (notification) => {
    return ['trasferimento', 'prestito', 'scambio', 'offerta_inviata', 'offerta_ricevuta'].includes(notification.tipo);
  };

  const handleNotificationClick = (notification) => {
    // Marca come letta
    markAsRead(notification.id);
    
    // Se è una notifica di mercato, mostra il popup
    if (isMarketNotification(notification)) {
      // Assicurati che i dati_aggiuntivi siano parsati correttamente
      if (notification.dati_aggiuntivi && typeof notification.dati_aggiuntivi === 'string') {
        try {
          notification.dati_aggiuntivi = JSON.parse(notification.dati_aggiuntivi);
        } catch (error) {
          console.error('Errore parsing dati aggiuntivi:', error);
        }
      }
      
      setSelectedMarketNotification(notification);
      setShowMarketModal(true);
      return;
    }

    // Logica esistente per altre notifiche
    switch (notification.tipo) {
      case 'richiesta_ingresso':
        navigate('/gestione-richieste');
        break;
      case 'richiesta_admin':
        // Apri il popup per gestire la richiesta admin
        openResponseModal(notification);
        break;
      case 'richiesta_unione_squadra':
        // Naviga alla pagina delle richieste di unione squadra
        navigate('/area-admin');
        break;
      case 'risposta_richiesta_admin':
        navigate('/area-admin');
        break;
      case 'risposta_richiesta_unione':
        navigate('/area-admin');
        break;
      default:
        // Per altre notifiche, mostra solo i dettagli
        console.log('Notifica cliccata:', notification);
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'trasferimento': return '🔄 Trasferimento';
      case 'offerta': return '💰 Offerta';
      case 'offerta_inviata': return '📤 Offerta Inviata';
      case 'offerta_ricevuta': return '📥 Offerta Ricevuta';
      case 'sistema': return '⚙️ Sistema';
      case 'richiesta_ingresso': return '🔐 Richiesta Ingresso';
      case 'risposta_richiesta': return '✅ Risposta Richiesta';
      case 'richiesta_admin': return '📋 Richiesta Admin';
      case 'risposta_richiesta_admin': return '📋 Risposta Richiesta Admin';
      case 'richiesta_admin_gestita': return '📋 Richiesta Admin Gestita';
      case 'richiesta_admin_annullata': return '❌ Richiesta Admin Annullata';
      case 'richiesta_unione_squadra': return '👥 Richiesta Unione Squadra';
      case 'risposta_richiesta_unione': return '🎯 Risposta Richiesta Unione';
      case 'prestito': return '📤 Prestito';
      case 'pagamento': return '💳 Pagamento';
      default: return '📢 Notifica';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationDetails = (notification) => {
    if (!notification.dati_aggiuntivi) return null;
    
    try {
      let dati;
      // Se è già un oggetto, usalo direttamente
      if (typeof notification.dati_aggiuntivi === 'object') {
        dati = notification.dati_aggiuntivi;
      } else {
        // Altrimenti prova a parsarlo come JSON
        dati = JSON.parse(notification.dati_aggiuntivi);
      }
      
      // Per le notifiche di offerta, crea un messaggio più compatto
      if (notification.tipo === 'offerta_ricevuta' || notification.tipo === 'offerta_inviata') {
        let details = [];
        
        if (dati.giocatore_nome) {
          const giocatoreNome = `${dati.giocatore_nome}${dati.giocatore_cognome ? ` ${dati.giocatore_cognome}` : ''}`;
          details.push(giocatoreNome);
        }
        
        if (dati.giocatore_scambio_nome) {
          const giocatoreScambioNome = `${dati.giocatore_scambio_nome}${dati.giocatore_scambio_cognome ? ` ${dati.giocatore_scambio_cognome}` : ''}`;
          details.push(`↔️ ${giocatoreScambioNome}`);
        }
        
        if (dati.valore && dati.valore > 0) {
          details.push(`💰 ${dati.valore} FM`);
        }
        
        if (dati.richiesta_fm && dati.richiesta_fm > 0) {
          details.push(`💸 Richiesta: ${dati.richiesta_fm} FM`);
        }
        
        return details.join(' • ');
      }
      
      // Per le richieste admin Cantera, mostra dettagli completi del giocatore
      if (notification.tipo === 'richiesta_admin' && dati.tipo_richiesta === 'cantera') {
        let details = [];
        
        if (dati.costi_dimezzati && typeof dati.costi_dimezzati === 'object') {
          const costiEntries = Object.entries(dati.costi_dimezzati);
          if (costiEntries?.length || 0 > 0) {
            details.push(`Giocatori Selezionati: ${dati.giocatori_selezionati ? dati.giocatori_selezionati?.length || 0 : 0}`);
            details.push(`Costi Dimezzati: ${costiEntries?.length || 0} giocatori`);
            
            // Aggiungi dettagli completi per ogni giocatore se disponibili
            if (dati.dettagli_giocatori && typeof dati.dettagli_giocatori === 'object') {
              Object.entries(dati.dettagli_giocatori).forEach(([giocatoreId, dettagli]) => {
                details.push(`  • ${dettagli?.nome || 'Nome'} ${dettagli?.cognome || ''} (${dettagli?.ruolo || 'Ruolo'})`);
                details.push(`    Squadra Reale: ${dettagli.squadra_reale}`);
                details.push(`    QA: ${dettagli?.qa || 0}`);
                details.push(`    QI: ${dettagli.qi}`);
                details.push(`    Ingaggio Attuale: ${dettagli.costo_attuale} FM`);
                details.push(`    Ingaggio Cantera: ${dettagli.costo_dimezzato} FM`);
              });
            } else {
              // Fallback per richieste esistenti senza dettagli
              if (dati.giocatori_selezionati && Array.isArray(dati.giocatori_selezionati)) {
                dati.giocatori_selezionati.forEach((giocatoreId, index) => {
                  const costoDimezzato = dati.costi_dimezzati[giocatoreId];
                  if (costoDimezzato !== undefined) {
                    details.push(`  • Giocatore ${index + 1}: ${costoDimezzato} FM`);
                  }
                });
              }
            }
          }
        }
        
        return details.join('\n');
      }
      
      // Per altre notifiche, usa la logica esistente
      let details = [];
      
      if (dati.giocatore_nome && dati.giocatore_cognome) {
        details.push(`Giocatore: ${dati.giocatore_nome} ${dati.giocatore_cognome}`);
      }
      
      if (dati.giocatore_scambio_nome && dati.giocatore_scambio_cognome) {
        details.push(`In scambio: ${dati.giocatore_scambio_nome} ${dati.giocatore_scambio_cognome}`);
      }
      
      if (dati.squadra_mittente) {
        details.push(`Da: ${dati.squadra_mittente}`);
      }
      
      if (dati.squadra_destinatario) {
        details.push(`A: ${dati.squadra_destinatario}`);
      }
      
      if (dati.valore_offerta) {
        details.push(`Valore: ${dati.valore_offerta} FM`);
      }
      
      if (dati.richiesta_fm) {
        details.push(`Richiesta: ${dati.richiesta_fm} FM`);
      }
      
      return details.join(' • ');
    } catch (error) {
      console.error('Errore parsing dati notifica:', error);
      return null;
    }
  };

  const isPendingOffer = (notification) => {
    if (!notification.dati_aggiuntivi) return false;
    
    // Controlla se il messaggio indica che l'offerta è già stata processata
    if (notification.messaggio && (
      notification.messaggio.includes(' - ACCETTATA') || 
      notification.messaggio.includes(' - RIFIUTATA') ||
      notification.messaggio.includes('Hai accettato l\'offerta') ||
      notification.messaggio.includes('Hai rifiutato l\'offerta') ||
      notification.messaggio.includes('La tua offerta è stata accettata') ||
      notification.messaggio.includes('La tua offerta è stata rifiutata')
    )) {
      return false;
    }
    
    try {
      let dati;
      // Se è già un oggetto, usalo direttamente
      if (typeof notification.dati_aggiuntivi === 'object') {
        dati = notification.dati_aggiuntivi;
      } else {
        // Altrimenti prova a parsarlo come JSON
        dati = JSON.parse(notification.dati_aggiuntivi);
      }
      return dati.offerta_id && ['trasferimento', 'prestito', 'scambio', 'offerta_ricevuta', 'offerta_inviata'].includes(notification.tipo);
    } catch (error) {
      return false;
    }
  };

  // Filtra le notifiche in base ai filtri selezionati
  const filteredNotifications = useMemo(() => {
    return notifications?.filter(notification => {
      // Filtro per tipo
      if (filter === 'tutte') {
        // Continua con altri filtri
      } else if (filter === 'non_lette' && notification.letta) return false;
      else if (filter === 'lette' && !notification.letta) return false;
      else if (filter === 'richieste' && !notification?.tipo?.includes('richiesta')) return false;
      else if (filter === 'trasferimenti' && !['trasferimento', 'prestito', 'scambio'].includes(notification.tipo)) return false;
      else if (filter === 'pagamenti' && !notification?.tipo?.includes('pagamento')) return false;
      else if (filter === 'offerte' && !notification?.tipo?.includes('offerta')) return false;
      else if (filter === 'admin' && notification.tipo !== 'richiesta_admin') return false;
      else if (filter !== 'tutte') return false;

      // Filtro per lega
      if (selectedLeague && notification?.lega_id !== parseInt(selectedLeague)) return false;

      // Filtro per mese/anno
      if (selectedMonth || selectedYear) {
        const notificationDate = new Date(notification.data_creazione);
        const notificationMonth = notificationDate.getMonth() + 1;
        const notificationYear = notificationDate.getFullYear();
        
        if (selectedMonth && notificationMonth !== parseInt(selectedMonth)) return false;
        if (selectedYear && notificationYear !== parseInt(selectedYear)) return false;
      }

      return true;
    });
  }, [notifications, filter, selectedMonth, selectedYear, selectedLeague]);

  // Aggiorna le notifiche visualizzate quando cambiano i filtri
  useEffect(() => {
    const newDisplayed = filteredNotifications.slice(0, notificationsPerPage);
    setDisplayedNotifications(newDisplayed);
    setCurrentPage(1);
  }, [filteredNotifications, notificationsPerPage]);

  const unreadCount = notifications?.filter(n => !n.letta).length;
  const readCount = notifications?.filter(n => n.letta).length;

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    const newNotifications = filteredNotifications.slice(0, nextPage * notificationsPerPage);
    setDisplayedNotifications(newNotifications);
    setCurrentPage(nextPage);
  };

  // Genera opzioni per mese e anno solo se ci sono notifiche in quei periodi
  const getAvailableMonths = () => {
    const monthsWithNotifications = new Set();
    notifications.forEach(notification => {
      const date = new Date(notification.data_creazione);
      monthsWithNotifications.add(date.getMonth() + 1);
    });

    const months = [
      { value: '', label: 'Tutti i mesi' }
    ];

    for (let i = 1; i <= 12; i++) {
      if (monthsWithNotifications.has(i)) {
        const monthNames = [
          'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
          'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        months.push({ value: i.toString(), label: monthNames[i - 1] });
      }
    }

    return months;
  };

  const getAvailableYears = () => {
    const yearsWithNotifications = new Set();
    notifications.forEach(notification => {
      const date = new Date(notification.data_creazione);
      yearsWithNotifications.add(date.getFullYear());
    });

    const years = [
      { value: '', label: 'Tutti gli anni' }
    ];

    Array.from(yearsWithNotifications).sort((a, b) => b - a).forEach(year => {
      years.push({ value: year.toString(), label: year.toString() });
    });

    return years;
  };

  const months = getAvailableMonths();
  const years = getAvailableYears();

  const handleMarketAction = async (action) => {
    if (!selectedMarketNotification) return;
    
    // Check if offer ID exists
    const offerId = selectedMarketNotification.dati_aggiuntivi?.offerta_id;
    if (!offerId) {
      alert('Errore: ID offerta non trovato');
      return;
    }
    
    setProcessingMarketAction(true);
    try {
      const response = await api.post(`/offerte/${action}/${offerId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = response.data;
        alert(`Offerta ${action === 'accetta' ? 'accettata' : 'rifiutata'} con successo!`);
        setOfferProcessed(true);
        
        // Aggiorna la notifica locale per riflettere il nuovo stato
        setNotifications(prev => 
          prev?.map(n => 
            n.id === selectedMarketNotification.id 
              ? { ...n, messaggio: n.messaggio + ` - ${action.toUpperCase()}` }
              : n
          )
        );
        
        // Chiudi il modal dopo un breve delay
        setTimeout(() => {
        setShowMarketModal(false);
        setSelectedMarketNotification(null);
          setOfferProcessed(false);
          setProcessingMarketAction(false);
        // Ricarica le notifiche per aggiornare lo stato
        loadNotifications();
        }, 1500);
      } else {
        const errorData = response.data;
        alert(`Errore: ${errorData.error || 'Errore sconosciuto'}`);
        setProcessingMarketAction(false);
      }
    } catch (error) {
      console.error('Errore azione mercato:', error);
      alert('Errore durante l\'elaborazione della richiesta');
      setProcessingMarketAction(false);
    }
  };

  const closeMarketModal = () => {
    setShowMarketModal(false);
    setSelectedMarketNotification(null);
    setOfferProcessed(false);
    setProcessingMarketAction(false);
  };

  const handleArchiveNotifications = async () => {
    if (!token) return;
    
    setArchivingNotifications(true);
    try {
      // Ottieni le notifiche filtrate attuali
      const notificaIds = filteredNotifications?.map(n => n.id);
      
              if ((notificaIds?.length || 0) === 0) {
        alert('Nessuna notifica da archiviare');
        return;
      }
      
      const response = await api.put('/notifiche/archivia', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: { notifica_ids: notificaIds }
      });
      
      if (response.ok) {
        const result = response.data;
        alert(`Archiviate ${result.archiviate} notifiche con successo!`);
        setShowArchiveModal(false);
        loadNotifications(); // Ricarica le notifiche
      } else {
        const errorData = response.data;
        alert(`Errore: ${errorData.error}`);
      }
    } catch (err) {
      alert('Errore di connessione');
    } finally {
      setArchivingNotifications(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          Caricamento notifiche...
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '10px'
            }}>
              ⚠️
            </div>
            <h3 style={{
              color: '#856404',
              marginBottom: '10px'
            }}>
              Errore nel caricamento delle notifiche
            </h3>
            <p style={{
              color: '#856404',
              marginBottom: '20px'
            }}>
              {error}
            </p>
            <button
              onClick={loadNotifications}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              🔄 Riprova
            </button>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: '1px solid #6c757d',
              color: '#6c757d',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ⬅️ Torna indietro
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate(-1)}>
            ⬅️ Torna indietro
          </BackButton>
          <Title>🔔 Notifiche</Title>
        </HeaderLeft>
        <HeaderRight>
          <ArchiveButton onClick={() => setShowArchiveModal(true)}>
            📦 Archivia
          </ArchiveButton>
        </HeaderRight>
      </Header>

      <FilterContainer>
        <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="tutte">Tutte le notifiche</option>
          <option value="non_lette">Non lette</option>
          <option value="lette">Lette</option>
          <option value="richieste">Richieste</option>
          <option value="trasferimenti">Trasferimenti & Prestiti</option>
          <option value="pagamenti">Pagamenti</option>
          <option value="offerte">Offerte</option>
          <option value="admin">Richieste Admin</option>
        </FilterSelect>

        {userLeagues?.length || 0 > 0 && (
          <FilterSelect value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)}>
            <option value="">Tutte le leghe</option>
            {userLeagues?.map(league => (
              <option key={league.id} value={league.id}>{league?.nome || 'Nome'}</option>
            ))}
          </FilterSelect>
        )}

        {months?.length || 0 > 1 && (
          <DateFilterContainer>
            <FilterSelect value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {months?.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </FilterSelect>
            
            <FilterSelect value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years?.map(year => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </FilterSelect>
          </DateFilterContainer>
        )}
        
        {unreadCount > 0 && (
          <ActionButton onClick={markAllAsRead}>
            Segna tutte come lette
          </ActionButton>
        )}
        
        <ActionButton onClick={loadNotifications}>
          🔄 Aggiorna
        </ActionButton>
      </FilterContainer>

              {(filteredNotifications?.length || 0) === 0 ? (
        <EmptyState>
          <EmptyIcon>📭</EmptyIcon>
          <EmptyTitle>Nessuna notifica trovata</EmptyTitle>
          <EmptyMessage>Non ci sono notifiche che corrispondono ai tuoi filtri.</EmptyMessage>
        </EmptyState>
      ) : (
        <>
          {displayedNotifications?.map(notification => (
            <NotificationCard 
              key={notification.id} 
              $type={notification.letta ? 'read' : 'unread'}
              onClick={() => handleNotificationClick(notification)}
            >
              <NotificationHeader>
                <NotificationTitle>{getNotificationTitle(notification.tipo)}</NotificationTitle>
                <NotificationTime>{formatTime(notification.data_creazione)}</NotificationTime>
              </NotificationHeader>
              
              <NotificationMessage>{notification.messaggio}</NotificationMessage>
              
              {getNotificationDetails(notification) && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{
                    background: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    color: '#495057',
                    whiteSpace: 'pre-line',
                    fontFamily: 'monospace'
                  }}>
                    {getNotificationDetails(notification)}
                  </div>
                  
                  <NotificationActions>
                    <ActionBtn 
                      $variant={isPendingOffer(notification) ? 'warning' : 'success'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPendingOffer(notification)) {
                          handleMarketAction(isPendingOffer(notification) ? 'rifiuta' : 'accetta');
                        }
                      }}
                      disabled={processingMarketAction}
                    >
                      {isPendingOffer(notification) ? 'Rispondi' : 'Segna come letta'}
                    </ActionBtn>
                    {notification.letta && !isPendingOffer(notification) && (
                      <ActionBtn $variant="success">
                        ✅ Letta
                      </ActionBtn>
                    )}
                    {isPendingOffer(notification) && (
                      <ActionBtn $variant="warning">
                        ⏳ In attesa di risposta
                      </ActionBtn>
                    )}
                  </NotificationActions>
                </div>
              )}
            </NotificationCard>
          ))}

          {displayedNotifications?.length || 0 < filteredNotifications?.length || 0 && (
            <LoadMoreButton onClick={handleLoadMore}>
              Mostra di più ({filteredNotifications?.length || 0 - displayedNotifications?.length || 0} rimanenti)
            </LoadMoreButton>
          )}
        </>
      )}

      {/* Popup per notifiche di mercato */}
      {showMarketModal && selectedMarketNotification && (
        <MarketModal onClick={closeMarketModal}>
          <MarketModalContent onClick={(e) => e.stopPropagation()}>
            <MarketModalHeader>
              <MarketModalTitle>
                {getNotificationTitle(selectedMarketNotification.tipo)} - Dettagli Offerta
              </MarketModalTitle>
              <MarketModalCloseButton onClick={closeMarketModal}>✕</MarketModalCloseButton>
            </MarketModalHeader>

            <MarketModalBody>
              <MarketDetailsSection>
                <MarketDetailTitle>📋 Dettagli Offerta</MarketDetailTitle>
                <MarketDetailGrid>
                  <MarketDetailItem>
                    <MarketDetailLabel>Proprietario del calciatore ({selectedMarketNotification?.dati_aggiuntivi?.giocatore_nome || 'N/A'} {selectedMarketNotification?.dati_aggiuntivi?.giocatore_cognome || ''}):</MarketDetailLabel>
                    <MarketDetailValue>{selectedMarketNotification?.dati_aggiuntivi?.proprietario_destinatario || 'N/A'} della squadra {selectedMarketNotification?.dati_aggiuntivi?.squadra_destinatario || 'N/A'}</MarketDetailValue>
                  </MarketDetailItem>
                                      {selectedMarketNotification?.dati_aggiuntivi?.giocatore_scambio_nome && (
                  <MarketDetailItem>
                        <MarketDetailLabel>Proprietario del calciatore ({selectedMarketNotification?.dati_aggiuntivi?.giocatore_scambio_nome} {selectedMarketNotification?.dati_aggiuntivi?.giocatore_scambio_cognome || ''}):</MarketDetailLabel>
                        <MarketDetailValue>{selectedMarketNotification?.dati_aggiuntivi?.proprietario_mittente || 'N/A'} della squadra {selectedMarketNotification?.dati_aggiuntivi?.squadra_mittente || 'N/A'}</MarketDetailValue>
                  </MarketDetailItem>
                    )}
                  <MarketDetailItem>
                      <MarketDetailLabel>Offerta fatta da:</MarketDetailLabel>
                      <MarketDetailValue>{selectedMarketNotification?.dati_aggiuntivi?.proprietario_mittente || 'N/A'} della squadra {selectedMarketNotification?.dati_aggiuntivi?.squadra_mittente || 'N/A'}</MarketDetailValue>
                  </MarketDetailItem>
                    <MarketDetailItem>
                      <MarketDetailLabel>Ricevuta da:</MarketDetailLabel>
                      <MarketDetailValue>{selectedMarketNotification?.dati_aggiuntivi?.proprietario_destinatario || 'N/A'} della squadra {selectedMarketNotification?.dati_aggiuntivi?.squadra_destinatario || 'N/A'}</MarketDetailValue>
                    </MarketDetailItem>
                </MarketDetailGrid>
              </MarketDetailsSection>

              <MarketDetailsSection>
                <MarketDetailTitle>💰 Valori</MarketDetailTitle>
                <MarketDetailGrid>
                  <MarketDetailItem>
                    <MarketDetailLabel>Tipo di Offerta:</MarketDetailLabel>
                    <MarketDetailValue>
                      {selectedMarketNotification?.dati_aggiuntivi?.tipo_offerta === 'trasferimento' ? '🔄 Trasferimento' :
                       selectedMarketNotification?.dati_aggiuntivi?.tipo_offerta === 'prestito' ? '📤 Prestito' :
                       selectedMarketNotification?.dati_aggiuntivi?.tipo_offerta === 'scambio' ? '🔄 Scambio' :
                       selectedMarketNotification?.dati_aggiuntivi?.tipo_offerta || 'N/A'}
                    </MarketDetailValue>
                  </MarketDetailItem>
                  <MarketDetailItem>
                    <MarketDetailLabel>Valore Offerto da ({selectedMarketNotification?.dati_aggiuntivi?.squadra_mittente || 'N/A'}):</MarketDetailLabel>
                    <MarketDetailValue>FM {selectedMarketNotification?.dati_aggiuntivi?.valore ?? 0}</MarketDetailValue>
                  </MarketDetailItem>
                  <MarketDetailItem>
                    <MarketDetailLabel>Valore Richiesto da ({selectedMarketNotification?.dati_aggiuntivi?.squadra_destinatario || 'N/A'}):</MarketDetailLabel>
                    <MarketDetailValue>FM {selectedMarketNotification?.dati_aggiuntivi?.richiesta_fm ?? 0}</MarketDetailValue>
                  </MarketDetailItem>
                </MarketDetailGrid>
              </MarketDetailsSection>

              <MarketDetailsSection>
                <MarketDetailTitle>🏦 Impatto Casse Societarie</MarketDetailTitle>
                <MarketImpactGrid>
                  <MarketImpactItem>
                    <MarketImpactLabel>Squadra Mittente:</MarketImpactLabel>
                    <MarketImpactBefore>Prima: FM {selectedMarketNotification?.dati_aggiuntivi?.casse_mittente_prima ?? 'N/A'}</MarketImpactBefore>
                    <MarketImpactAfter>Dopo: FM {selectedMarketNotification?.dati_aggiuntivi?.casse_mittente_dopo ?? 'N/A'}</MarketImpactAfter>
                  </MarketImpactItem>
                  <MarketImpactItem>
                    <MarketImpactLabel>Squadra Destinataria:</MarketImpactLabel>
                    <MarketImpactBefore>Prima: FM {selectedMarketNotification?.dati_aggiuntivi?.casse_destinatario_prima ?? 'N/A'}</MarketImpactBefore>
                    <MarketImpactAfter>Dopo: FM {selectedMarketNotification?.dati_aggiuntivi?.casse_destinatario_dopo ?? 'N/A'}</MarketImpactAfter>
                  </MarketImpactItem>
                </MarketImpactGrid>
              </MarketDetailsSection>
            </MarketModalBody>

            <MarketModalFooter>
              {!offerProcessed && isPendingOffer(selectedMarketNotification) && selectedMarketNotification.tipo === 'offerta_ricevuta' ? (
                <>
              <MarketActionButton 
                $variant="danger" 
                onClick={() => handleMarketAction('rifiuta')}
                    disabled={processingMarketAction}
              >
                    {processingMarketAction ? 'Elaborazione...' : 'Rifiuta Offerta'}
              </MarketActionButton>
              <MarketActionButton 
                $variant="success" 
                onClick={() => handleMarketAction('accetta')}
                    disabled={processingMarketAction}
                  >
                    {processingMarketAction ? 'Elaborazione...' : 'Accetta Offerta'}
                  </MarketActionButton>
                </>
              ) : offerProcessed ? (
                <div style={{ 
                  textAlign: 'center', 
                  width: '100%', 
                  color: '#28a745', 
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  ✅ Offerta processata con successo!
                </div>
              ) : selectedMarketNotification.tipo === 'offerta_inviata' ? (
                <div style={{ 
                  textAlign: 'center', 
                  width: '100%', 
                  color: '#17a2b8', 
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  📤 Offerta inviata - In attesa di risposta
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  width: '100%', 
                  color: '#6c757d', 
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {selectedMarketNotification?.messaggio?.includes(' - ACCETTATA') || 
                   selectedMarketNotification?.messaggio?.includes('Hai accettato l\'offerta') ||
                   selectedMarketNotification?.messaggio?.includes('La tua offerta è stata accettata') ||
                   selectedMarketNotification?.messaggio?.includes('è stata accettata') ? 
                    '✅ Offerta già accettata' : 
                    '❌ Offerta già rifiutata'
                  }
                </div>
              )}
            </MarketModalFooter>
          </MarketModalContent>
        </MarketModal>
      )}

      {/* Modal di conferma archiviazione */}
      {showArchiveModal && (
        <MarketModal onClick={() => setShowArchiveModal(false)}>
          <MarketModalContent onClick={(e) => e.stopPropagation()}>
            <MarketModalHeader>
              <MarketModalTitle>📦 Archivia Notifiche</MarketModalTitle>
            </MarketModalHeader>
            
            <MarketModalBody>
              <p>Sei sicuro di voler archiviare queste notifiche?</p>
              <p><strong>Attenzione:</strong> Questa azione non può essere annullata.</p>
              <p>Verranno archiviate <strong>{filteredNotifications?.length || 0}</strong> notifiche.</p>
            </MarketModalBody>
            
            <MarketModalFooter>
              <MarketActionButton 
                $variant="danger" 
                onClick={() => setShowArchiveModal(false)}
                disabled={archivingNotifications}
              >
                Annulla
              </MarketActionButton>
              <MarketActionButton 
                $variant="success" 
                onClick={handleArchiveNotifications}
                disabled={archivingNotifications}
              >
                {archivingNotifications ? 'Archiviazione...' : 'Conferma Archiviazione'}
              </MarketActionButton>
            </MarketModalFooter>
          </MarketModalContent>
        </MarketModal>
      )}

      {/* Modal per gestione richieste admin */}
      {showRequestResponseModal && selectedRequest && (
        <MarketModal onClick={() => setShowRequestResponseModal(false)}>
          <MarketModalContent onClick={(e) => e.stopPropagation()}>
            <MarketModalHeader>
              <MarketModalTitle>📋 Gestione Richiesta Admin</MarketModalTitle>
              <MarketModalCloseButton onClick={() => setShowRequestResponseModal(false)}>✕</MarketModalCloseButton>
            </MarketModalHeader>
            
            <MarketModalBody>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                  Richiesta di: {selectedRequest.dati_aggiuntivi?.utente_nome || 'Utente'}
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>
                  <strong>Tipo:</strong> {selectedRequest.dati_aggiuntivi?.tipo_richiesta || 'N/A'}
                </p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>
                  <strong>Data:</strong> {formatTime(selectedRequest.created_at)}
                </p>
                {selectedRequest.dati_aggiuntivi?.descrizione && (
                  <p style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>
                    <strong>Descrizione:</strong> {selectedRequest.dati_aggiuntivi.descrizione}
                  </p>
                )}
                {selectedRequest.dati_aggiuntivi?.dettagli && (
                  <div style={{ margin: '0 0 0.5rem 0' }}>
                    <strong style={{ color: '#64748b' }}>Dettagli:</strong>
                    <pre style={{ 
                      background: '#f8f9fa', 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.9rem',
                      color: '#495057',
                      whiteSpace: 'pre-wrap',
                      margin: '0.5rem 0 0 0'
                    }}>
                      {JSON.stringify(selectedRequest.dati_aggiuntivi.dettagli, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1e293b' }}>
                  Note (opzionale):
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Inserisci una nota per la risposta..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </MarketModalBody>
            
            <MarketModalFooter>
              <MarketActionButton 
                $variant="danger" 
                onClick={() => handleAdminRequestResponse(selectedRequest, 'rifiuta')}
                disabled={processingResponse}
              >
                {processingResponse ? 'Elaborazione...' : 'Rifiuta Richiesta'}
              </MarketActionButton>
              <MarketActionButton 
                $variant="success" 
                onClick={() => handleAdminRequestResponse(selectedRequest, 'accetta')}
                disabled={processingResponse}
              >
                {processingResponse ? 'Elaborazione...' : 'Accetta Richiesta'}
              </MarketActionButton>
            </MarketModalFooter>
          </MarketModalContent>
        </MarketModal>
      )}
    </Container>
  );
};

export default NotifichePage; 