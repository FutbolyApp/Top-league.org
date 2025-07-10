import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: #FFA94D;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 8px 12px;
  background: ${props => props.$highlight ? '#007bff' : '#f8f9fa'};
  color: ${props => props.$highlight ? 'white' : '#666'};
  border-radius: 6px;
  min-width: 60px;
  font-size: 12px;
`;

const StatNumber = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 2px;
`;

const StatLabel = styled.div`
  font-size: 10px;
  opacity: 0.8;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  min-width: 120px;
`;

const DateFilterContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$variant === 'danger' ? '#dc3545' : '#007bff'};
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$variant === 'danger' ? '#c82333' : '#0056b3'};
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const NotificheGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const NotificaCard = styled.div`
  background: ${props => {
    // Colore arancione per notifiche di mercato
    if (props.$isMarketNotification) {
      return '#fff3cd';
    }
    return 'white';
  }};
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  border-left: 3px solid ${props => {
    switch (props.$tipo) {
      case 'richiesta_ingresso': return '#28a745';
      case 'trasferimento': return '#ffc107';
      case 'prestito': return '#17a2b8';
      case 'pagamento': return '#dc3545';
      case 'risposta_richiesta': return '#6f42c1';
      case 'richiesta_admin': return '#fd7e14';
      case 'risposta_richiesta_admin': return '#6f42c1';
      case 'offerta': return '#20c997';
      case 'sistema': return '#6c757d';
      default: return '#6c757d';
    }
  }};
  transition: transform 0.2s ease;
  opacity: ${props => props.$read ? 0.7 : 1};
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const NotificaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const NotificaTipo = styled.div`
  font-weight: 600;
  color: ${props => {
    switch (props.$tipo) {
      case 'richiesta_ingresso': return '#28a745';
      case 'trasferimento': return '#ffc107';
      case 'prestito': return '#17a2b8';
      case 'pagamento': return '#dc3545';
      case 'risposta_richiesta': return '#6f42c1';
      case 'richiesta_admin': return '#fd7e14';
      case 'risposta_richiesta_admin': return '#6f42c1';
      case 'offerta': return '#20c997';
      case 'sistema': return '#6c757d';
      default: return '#6c757d';
    }
  }};
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NotificaData = styled.div`
  font-size: 11px;
  color: #666;
`;

const NotificaMessaggio = styled.div`
  margin-bottom: 8px;
  line-height: 1.4;
  color: #333;
  font-size: 13px;
`;

const NotificaDettagli = styled.div`
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
`;

const NotificaAzioni = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
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

const ArchiveButton = styled(ActionButton)`
  background: #6c757d;
  color: white;
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #5a6268;
  }
`;

const NotifichePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('tutte');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [notificationsPerPage] = useState(6);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [selectedMarketNotification, setSelectedMarketNotification] = useState(null);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [processingMarketAction, setProcessingMarketAction] = useState(false);
  const [offerProcessed, setOfferProcessed] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivingNotifications, setArchivingNotifications] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    loadNotifications();
  }, [user, token]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/notifiche', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const notifiche = data.notifiche || [];
        
        // Normalizza le notifiche per gestire entrambi i campi (letta e letto)
        const notificheNormalizzate = notifiche.map(n => {
          let dati_aggiuntivi = {};
          
          if (n.dati_aggiuntivi) {
            try {
              // Se è già un oggetto, usalo direttamente
              if (typeof n.dati_aggiuntivi === 'object') {
                dati_aggiuntivi = n.dati_aggiuntivi;
              } else {
                // Altrimenti prova a parsarlo come JSON
                dati_aggiuntivi = JSON.parse(n.dati_aggiuntivi);
              }
            } catch (error) {
              console.error('Errore parsing dati_aggiuntivi per notifica:', n.id, error);
              dati_aggiuntivi = {};
            }
          }
          
          return {
            ...n,
            letta: n.letta || n.letto === 1,
            dati_aggiuntivi: dati_aggiuntivi
          };
        });
        
        setNotifications(notificheNormalizzate);
        setDisplayedNotifications(notificheNormalizzate.slice(0, notificationsPerPage));
        setCurrentPage(1);
      } else {
        setError('Errore nel caricamento delle notifiche');
      }
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:3001/api/notifiche/${notificationId}/letta`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, letta: true, letto: 1 } : n)
      );
      setDisplayedNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, letta: true, letto: 1 } : n)
      );
    } catch (error) {
      console.error('Errore marcatura notifica come letta:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('http://localhost:3001/api/notifiche/tutte-lette', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, letta: true, letto: 1 }))
      );
      setDisplayedNotifications(prev => 
        prev.map(n => ({ ...n, letta: true, letto: 1 }))
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
        navigate('/gestione-richieste-admin');
        break;
      case 'risposta_richiesta_admin':
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
    return notifications.filter(notification => {
      // Filtro per tipo
      if (filter === 'tutte') {
        // Continua con altri filtri
      } else if (filter === 'non_lette' && notification.letta) return false;
      else if (filter === 'lette' && !notification.letta) return false;
      else if (filter === 'richieste' && !notification.tipo.includes('richiesta')) return false;
      else if (filter === 'trasferimenti' && !['trasferimento', 'prestito', 'scambio'].includes(notification.tipo)) return false;
      else if (filter === 'pagamenti' && !notification.tipo.includes('pagamento')) return false;
      else if (filter === 'offerte' && !notification.tipo.includes('offerta')) return false;
      else if (filter === 'admin' && !notification.tipo.includes('admin')) return false;
      else if (filter !== 'tutte') return false;

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
  }, [notifications, filter, selectedMonth, selectedYear]);

  // Aggiorna le notifiche visualizzate quando cambiano i filtri
  useEffect(() => {
    const newDisplayed = filteredNotifications.slice(0, notificationsPerPage);
    setDisplayedNotifications(newDisplayed);
    setCurrentPage(1);
  }, [filteredNotifications, notificationsPerPage]);

  const unreadCount = notifications.filter(n => !n.letta).length;
  const readCount = notifications.filter(n => n.letta).length;

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
      const response = await fetch(`http://localhost:3001/api/offerte/${action}/${offerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Offerta ${action === 'accetta' ? 'accettata' : 'rifiutata'} con successo!`);
        setOfferProcessed(true);
        
        // Aggiorna la notifica locale per riflettere il nuovo stato
        setNotifications(prev => 
          prev.map(n => 
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
        const errorData = await response.json();
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
      const notificaIds = filteredNotifications.map(n => n.id);
      
      if (notificaIds.length === 0) {
        alert('Nessuna notifica da archiviare');
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/notifiche/archivia', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notifica_ids: notificaIds })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Archiviate ${result.archiviate} notifiche con successo!`);
        setShowArchiveModal(false);
        loadNotifications(); // Ricarica le notifiche
      } else {
        const errorData = await response.json();
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
        <div style={{ color: 'red', textAlign: 'center', padding: '40px 20px' }}>
          {error}
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

        {months.length > 1 && (
          <DateFilterContainer>
            <FilterSelect value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </FilterSelect>
            
            <FilterSelect value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map(year => (
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

      {filteredNotifications.length === 0 ? (
        <EmptyState>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
          <div>Nessuna notifica trovata</div>
        </EmptyState>
      ) : (
        <>
          <NotificheGrid>
            {displayedNotifications.map(notification => (
              <NotificaCard 
                key={notification.id} 
                $tipo={notification.tipo}
                $read={notification.letta}
                $isMarketNotification={isMarketNotification(notification)}
                onClick={() => handleNotificationClick(notification)}
              >
                <NotificaHeader>
                  <NotificaTipo $tipo={notification.tipo}>
                    {getNotificationTitle(notification.tipo)}
                  </NotificaTipo>
                  <NotificaData>
                    {formatTime(notification.data_creazione)}
                  </NotificaData>
                </NotificaHeader>
                
                <NotificaMessaggio>
                  {notification.messaggio}
                </NotificaMessaggio>
                
                {getNotificationDetails(notification) && (
                  <NotificaDettagli>
                    {getNotificationDetails(notification)}
                  </NotificaDettagli>
                )}
                
                <NotificaAzioni>
                  <div>
                    {!notification.letta && (
                      <ActionButton 
                        $variant="danger" 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        Segna come letta
                      </ActionButton>
                    )}
                    {notification.letta && !isPendingOffer(notification) && (
                      <div style={{ color: '#28a745', fontSize: '11px' }}>
                        ✅ Letta
                      </div>
                    )}
                    {isPendingOffer(notification) && (
                      <div style={{ fontSize: '11px', color: '#ffc107' }}>
                        ⏳ In attesa di risposta
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Clicca per aprire
                  </div>
                </NotificaAzioni>
              </NotificaCard>
            ))}
          </NotificheGrid>

          {displayedNotifications.length < filteredNotifications.length && (
            <LoadMoreButton onClick={handleLoadMore}>
              Mostra di più ({filteredNotifications.length - displayedNotifications.length} rimanenti)
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
                    <MarketDetailLabel>Proprietario del calciatore ({selectedMarketNotification.dati_aggiuntivi?.giocatore_nome || 'N/A'} {selectedMarketNotification.dati_aggiuntivi?.giocatore_cognome || ''}):</MarketDetailLabel>
                    <MarketDetailValue>{selectedMarketNotification.dati_aggiuntivi?.proprietario_destinatario || 'N/A'} della squadra {selectedMarketNotification.dati_aggiuntivi?.squadra_destinatario || 'N/A'}</MarketDetailValue>
                  </MarketDetailItem>
                                      {selectedMarketNotification.dati_aggiuntivi?.giocatore_scambio_nome && (
                  <MarketDetailItem>
                        <MarketDetailLabel>Proprietario del calciatore ({selectedMarketNotification.dati_aggiuntivi.giocatore_scambio_nome} {selectedMarketNotification.dati_aggiuntivi.giocatore_scambio_cognome || ''}):</MarketDetailLabel>
                        <MarketDetailValue>{selectedMarketNotification.dati_aggiuntivi.proprietario_mittente || 'N/A'} della squadra {selectedMarketNotification.dati_aggiuntivi.squadra_mittente || 'N/A'}</MarketDetailValue>
                  </MarketDetailItem>
                    )}
                  <MarketDetailItem>
                      <MarketDetailLabel>Offerta fatta da:</MarketDetailLabel>
                      <MarketDetailValue>{selectedMarketNotification.dati_aggiuntivi?.proprietario_mittente || 'N/A'} della squadra {selectedMarketNotification.dati_aggiuntivi?.squadra_mittente || 'N/A'}</MarketDetailValue>
                  </MarketDetailItem>
                    <MarketDetailItem>
                      <MarketDetailLabel>Ricevuta da:</MarketDetailLabel>
                      <MarketDetailValue>{selectedMarketNotification.dati_aggiuntivi?.proprietario_destinatario || 'N/A'} della squadra {selectedMarketNotification.dati_aggiuntivi?.squadra_destinatario || 'N/A'}</MarketDetailValue>
                    </MarketDetailItem>
                </MarketDetailGrid>
              </MarketDetailsSection>

              <MarketDetailsSection>
                <MarketDetailTitle>💰 Valori</MarketDetailTitle>
                <MarketDetailGrid>
                  <MarketDetailItem>
                    <MarketDetailLabel>Tipo di Offerta:</MarketDetailLabel>
                    <MarketDetailValue>
                      {selectedMarketNotification.dati_aggiuntivi?.tipo_offerta === 'trasferimento' ? '🔄 Trasferimento' :
                       selectedMarketNotification.dati_aggiuntivi?.tipo_offerta === 'prestito' ? '📤 Prestito' :
                       selectedMarketNotification.dati_aggiuntivi?.tipo_offerta === 'scambio' ? '🔄 Scambio' :
                       selectedMarketNotification.dati_aggiuntivi?.tipo_offerta || 'N/A'}
                    </MarketDetailValue>
                  </MarketDetailItem>
                  <MarketDetailItem>
                    <MarketDetailLabel>Valore Offerto da ({selectedMarketNotification.dati_aggiuntivi?.squadra_mittente || 'N/A'}):</MarketDetailLabel>
                    <MarketDetailValue>FM {selectedMarketNotification.dati_aggiuntivi?.valore ?? 0}</MarketDetailValue>
                  </MarketDetailItem>
                  <MarketDetailItem>
                    <MarketDetailLabel>Valore Richiesto da ({selectedMarketNotification.dati_aggiuntivi?.squadra_destinatario || 'N/A'}):</MarketDetailLabel>
                    <MarketDetailValue>FM {selectedMarketNotification.dati_aggiuntivi?.richiesta_fm ?? 0}</MarketDetailValue>
                  </MarketDetailItem>
                </MarketDetailGrid>
              </MarketDetailsSection>

              <MarketDetailsSection>
                <MarketDetailTitle>🏦 Impatto Casse Societarie</MarketDetailTitle>
                <MarketImpactGrid>
                  <MarketImpactItem>
                    <MarketImpactLabel>Squadra Mittente:</MarketImpactLabel>
                    <MarketImpactBefore>Prima: FM {selectedMarketNotification.dati_aggiuntivi?.casse_mittente_prima ?? 'N/A'}</MarketImpactBefore>
                    <MarketImpactAfter>Dopo: FM {selectedMarketNotification.dati_aggiuntivi?.casse_mittente_dopo ?? 'N/A'}</MarketImpactAfter>
                  </MarketImpactItem>
                  <MarketImpactItem>
                    <MarketImpactLabel>Squadra Destinataria:</MarketImpactLabel>
                    <MarketImpactBefore>Prima: FM {selectedMarketNotification.dati_aggiuntivi?.casse_destinatario_prima ?? 'N/A'}</MarketImpactBefore>
                    <MarketImpactAfter>Dopo: FM {selectedMarketNotification.dati_aggiuntivi?.casse_destinatario_dopo ?? 'N/A'}</MarketImpactAfter>
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
                  {selectedMarketNotification.messaggio.includes(' - ACCETTATA') || 
                   selectedMarketNotification.messaggio.includes('Hai accettato l\'offerta') ||
                   selectedMarketNotification.messaggio.includes('La tua offerta è stata accettata') ||
                   selectedMarketNotification.messaggio.includes('è stata accettata') ? 
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
              <p>Verranno archiviate <strong>{filteredNotifications.length}</strong> notifiche.</p>
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
    </Container>
  );
};

export default NotifichePage; 