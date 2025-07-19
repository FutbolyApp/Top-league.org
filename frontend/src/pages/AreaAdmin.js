import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { getAllLegheAdmin, getRichiesteAdmin, rispondiRichiesta } from '../api/leghe';
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

// Modal components for admin requests
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  color: #1e293b;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.5rem;
  
  &:hover {
    color: #1e293b;
  }
`;

const RequestCard = styled.div`
  background: ${props => props.$answered ? '#f8fafc' : 'white'};
  border: 1px solid ${props => props.$answered ? '#e2e8f0' : '#d1d5db'};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$answered ? '#f1f5f9' : '#f8fafc'};
  }
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const RequestTitle = styled.h4`
  color: ${props => props.$color || '#1e293b'};
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

const RequestStatus = styled.span`
  background: ${props => props.$color};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const RequestDetails = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const RequestMessage = styled.div`
  color: #374151;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 4px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const PaginationButton = styled.button`
  background: ${props => props.$active ? '#3b82f6' : 'white'};
  color: ${props => props.$active ? 'white' : '#374151'};
  border: 1px solid ${props => props.$active ? '#3b82f6' : '#d1d5db'};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: ${props => props.$active ? '#2563eb' : '#f8fafc'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResponseForm = styled.div`
  margin-top: 1rem;
`;

const ResponseTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ResponseButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: flex-end;
`;

const ShowMoreButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
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
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [leghe, setLeghe] = useState([]);
  const [richieste, setRichieste] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Stati per i popup delle richieste admin
  const [showAllRequestsModal, setShowAllRequestsModal] = useState(false);
  const [showRequestResponseModal, setShowRequestResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [processingResponse, setProcessingResponse] = useState(false);
  
  // Stati per la paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(5);
  
  // Stati per le richieste mostrate (massimo 3)
  const [displayedRequests, setDisplayedRequests] = useState([]);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Carica le leghe dell'admin
      const legheData = await getAllLegheAdmin(token);
      setLeghe(legheData.leghe || []);
      
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
      if (leghe && leghe?.length || 0 > 0) {
        await Promise.all(
          leghe?.map(async (lega) => {
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
  }, [token]);

  // Aggiorna le richieste mostrate quando cambiano le richieste
  useEffect(() => {
    // Mostra solo le prime 3 richieste
    setDisplayedRequests(richieste.slice(0, 3));
  }, [richieste]);

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
        
        // Ricarica i dati
        await loadAdminData();
        
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

  // Funzione per calcolare le richieste paginate
  const getPaginatedRequests = () => {
    const startIndex = (currentPage - 1) * requestsPerPage;
    const endIndex = startIndex + requestsPerPage;
    return richieste.slice(startIndex, endIndex);
  };

  // Funzione per ottenere lo stato della richiesta
  const getRequestStatus = (richiesta) => {
    if (richiesta.stato === 'accepted') return { text: 'Richiesta Confermata', color: '#10b981' };
    if (richiesta.stato === 'rejected') return { text: 'Richiesta Rifiutata', color: '#ef4444' };
    if (richiesta.stato === 'revision') return { text: 'In Revisione', color: '#f59e0b' };
    return { text: 'In Attesa', color: '#6b7280' };
  };

  // Funzione per ottenere il colore della richiesta basato sullo stato
  const getRequestColor = (richiesta) => {
    const status = getRequestStatus(richiesta);
    if (status.text === 'In Attesa') return '#1e293b';
    return '#9ca3af'; // Grigio per richieste risposte
  };

  // Removed excessive notification refresh - handled by NotificationSystem



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

  // Funzione per formattare il tipo di richiesta in modo leggibile
  const formatRequestType = (requestType) => {
    if (!requestType) return 'N/A';
    
    const typeMap = {
      'club_level': 'Club Level',
      'acquisto_giocatore': 'Acquisto Giocatore',
      'vendita_giocatore': 'Vendita Giocatore',
      'scambio_giocatori': 'Scambio Giocatori',
      'trasferimento_giocatore': 'Trasferimento Giocatore',
      'modifica_roster': 'Modifica Roster',
      'richiesta_ingresso': 'Richiesta Ingresso',
      'richiesta_admin': 'Richiesta Admin',
      'admin': 'Richiesta Admin',
      'user': 'Richiesta Ingresso'
    };
    
    return typeMap[requestType] || requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Funzione per formattare i dettagli della richiesta in modo leggibile
  const formatRequestDetails = (datiRichiesta) => {
    if (!datiRichiesta) return null;
    
    try {
      // Se è una stringa JSON, parsala
      const data = typeof datiRichiesta === 'string' ? JSON.parse(datiRichiesta) : datiRichiesta;
      
      const details = [];
      
      // Gestisci i diversi tipi di dettagli
      if (data.nuovo_club_level !== undefined) {
        details.push(`Nuovo Club Level: ${data.nuovo_club_level}`);
      }
      
      if (data.giocatore_nome) {
        details.push(`Giocatore: ${data.giocatore_nome}`);
      }
      
      if (data.squadra_destinatario) {
        details.push(`Squadra Destinatario: ${data.squadra_destinatario}`);
      }
      
      if (data.valore_costo !== undefined) {
        details.push(`Valore: ${data.valore_costo} FM`);
      }
      
      if (data.squadra_mittente) {
        details.push(`Squadra Mittente: ${data.squadra_mittente}`);
      }
      
      if (data.giocatore_offerto) {
        details.push(`Giocatore Offerto: ${data.giocatore_offerto}`);
      }
      
      if (data.giocatore_richiesto) {
        details.push(`Giocatore Richiesto: ${data.giocatore_richiesto}`);
      }
      
      if (data.motivo) {
        details.push(`Motivo: ${data.motivo}`);
      }
      
      // Gestisci i costi dimezzati per le richieste cantera
      if (data.costi_dimezzati && typeof data.costi_dimezzati === 'object') {
        const costiEntries = Object.entries(data.costi_dimezzati);
        if (costiEntries?.length || 0 > 0) {
          details.push(`Giocatori Selezionati: ${data.giocatori_selezionati ? data.giocatori_selezionati?.length || 0 : 0}`);
          details.push(`Costi Dimezzati: ${costiEntries?.length || 0} giocatori`);
          
          // Aggiungi dettagli completi per ogni giocatore se disponibili
          if (data.dettagli_giocatori && typeof data.dettagli_giocatori === 'object') {
            Object.entries(data.dettagli_giocatori).forEach(([giocatoreId, dettagli]) => {
              details.push(`  • ${dettagli?.nome || 'Nome'} ${dettagli?.cognome || ''} (${dettagli?.ruolo || 'Ruolo'})`);
              details.push(`    Squadra Reale: ${dettagli.squadra_reale}`);
              details.push(`    QA: ${dettagli?.qa || 0}`);
              details.push(`    QI: ${dettagli.qi}`);
              details.push(`    Ingaggio Attuale: ${dettagli.costo_attuale} FM`);
              details.push(`    Ingaggio Cantera: ${dettagli.costo_dimezzato} FM`);
            });
          } else {
            // Fallback per richieste esistenti senza dettagli
            if (data.giocatori_selezionati && Array.isArray(data.giocatori_selezionati)) {
              data.giocatori_selezionati.forEach((giocatoreId, index) => {
                const costoDimezzato = data.costi_dimezzati[giocatoreId];
                if (costoDimezzato !== undefined) {
                  details.push(`  • Giocatore ${index + 1}: ${costoDimezzato} FM`);
                }
              });
            }
          }
        }
      }
      
      // Se non abbiamo mappato nessun campo specifico, mostra tutti i campi
      if ((details?.length || 0) === 0) {
        Object.entries(data).forEach(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (typeof value === 'object' && value !== null) {
            details.push(`${formattedKey}: ${JSON.stringify(value)}`);
          } else {
            details.push(`${formattedKey}: ${value}`);
          }
        });
      }
      
      return details;
    } catch (error) {
      console.error('Errore parsing dettagli richiesta:', error);
      return [`Dettagli: ${datiRichiesta}`];
    }
  };

  const handleGestioneTornei = (legaId) => {
    navigate(`/gestione-tornei/${legaId}`);
  };

  const handleScrapingManager = (legaId) => {
    navigate(`/scraping-manager/${legaId}`);
  };

  const handleGestioneSubadmin = async (legaId) => {
    navigate(`/league-admin/${legaId}`);
  };

  // Calcola statistiche
  const totalLeghe = leghe?.length || 0;
  const totalSquadre = leghe?.reduce((sum, lega) => sum + (lega.squadre_assegnate || 0), 0);
  const totalRichieste = richieste?.length || 0;

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
            <StatNumber $color="#f59e0b">{leghe?.reduce((sum, lega) => sum + (lega.numero_tornei || 0), 0)}</StatNumber>
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
            
            {(leghe?.length || 0) === 0 ? (
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
                  {leghe?.map(lega => (
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
                          {lega?.nome || 'Nome'}
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
                        <TypeBadge $public={lega?.is_pubblica || false}>
                          {lega?.is_pubblica ? 'Pubblica' : 'Privata'}
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
                📋 Richieste Admin
                <Badge $color="#ef4444">{totalRichieste}</Badge>
              </SectionTitle>
            </SectionHeader>
            
            {(richieste?.length || 0) === 0 ? (
              <EmptyState>
                <EmptyIcon>📭</EmptyIcon>
                <EmptyTitle>Nessuna richiesta</EmptyTitle>
                <EmptyText>Non ci sono richieste admin in attesa.</EmptyText>
              </EmptyState>
            ) : (
              <div>
                {/* Mostra solo le prime 3 richieste */}
                {displayedRequests?.map(richiesta => {
                  const status = getRequestStatus(richiesta);
                  const isAnswered = richiesta.stato !== 'pending';
                  
                  return (
                    <RequestCard 
                      key={richiesta.id} 
                      $answered={isAnswered}
                      onClick={() => openResponseModal(richiesta)}
                    >
                    <RequestHeader>
                        <RequestTitle $color={getRequestColor(richiesta)}>
                          {richiesta.tipo_richiesta === 'admin' ? 'Richiesta Admin' : 'Richiesta Ingresso'}
                        </RequestTitle>
                        <RequestStatus $color={status.color}>
                          {status.text}
                        </RequestStatus>
                    </RequestHeader>
                    
                    <RequestDetails>
                        <div><strong>Lega:</strong> {richiesta.lega_nome}</div>
                        <div><strong>Squadra:</strong> {richiesta.squadra_nome}</div>
                        <div><strong>Utente:</strong> {richiesta.utente_nome || 'N/A'}</div>
                        <div><strong>Email:</strong> {richiesta.utente_email || 'N/A'}</div>
                        <div><strong>Data:</strong> {formatDate(richiesta.data_creazione || richiesta.data_richiesta)}</div>
                        {richiesta.tipo_richiesta_richiesta && (
                          <div><strong>Tipo Richiesta:</strong> {formatRequestType(richiesta.tipo_richiesta_richiesta)}</div>
                      )}
                    </RequestDetails>
                    
                      {richiesta.messaggio && (
                        <RequestMessage>
                          <strong>Messaggio:</strong> {richiesta.messaggio}
                        </RequestMessage>
                      )}
                      
                      {richiesta.dati_richiesta && (
                        <RequestMessage>
                          <strong>Dettagli Richiesta:</strong>
                          <div style={{ marginTop: '0.5rem' }}>
                            {formatRequestDetails(richiesta.dati_richiesta)?.map((detail, index) => (
                              <div key={index} style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.25rem' }}>
                                {detail}
                              </div>
                            ))}
                          </div>
                        </RequestMessage>
                      )}
                    </RequestCard>
                  );
                })}
                
                {/* Pulsante "MOSTRA ALTRO" se ci sono più di 3 richieste */}
                {richieste?.length || 0 > 3 && (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <ShowMoreButton onClick={() => setShowAllRequestsModal(true)}>
                      MOSTRA ALTRO ({richieste?.length || 0 - 3} rimanenti)
                    </ShowMoreButton>
                  </div>
                )}
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
                {leghe?.map(lega => (
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
                      {lega?.nome || 'Nome'}
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

      {/* Popup per mostrare tutte le richieste */}
      {showAllRequestsModal && (
        <Modal onClick={() => setShowAllRequestsModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Tutte le Richieste Admin</ModalTitle>
              <ModalCloseButton onClick={() => setShowAllRequestsModal(false)}>✕</ModalCloseButton>
            </ModalHeader>
            
            <div>
              {getPaginatedRequests().map(richiesta => {
                const status = getRequestStatus(richiesta);
                const isAnswered = richiesta.stato !== 'pending';
                
                return (
                  <RequestCard 
                    key={richiesta.id} 
                    $answered={isAnswered}
                    onClick={() => openResponseModal(richiesta)}
                  >
                    <RequestHeader>
                      <RequestTitle $color={getRequestColor(richiesta)}>
                        {richiesta.tipo_richiesta === 'admin' ? 'Richiesta Admin' : 'Richiesta Ingresso'}
                      </RequestTitle>
                      <RequestStatus $color={status.color}>
                        {status.text}
                      </RequestStatus>
                    </RequestHeader>
                    
                    <RequestDetails>
                      <div><strong>Lega:</strong> {richiesta.lega_nome}</div>
                      <div><strong>Squadra:</strong> {richiesta.squadra_nome}</div>
                      <div><strong>Utente:</strong> {richiesta.utente_nome || 'N/A'}</div>
                      <div><strong>Email:</strong> {richiesta.utente_email || 'N/A'}</div>
                      <div><strong>Data:</strong> {formatDate(richiesta.data_creazione || richiesta.data_richiesta)}</div>
                      {richiesta.tipo_richiesta_richiesta && (
                        <div><strong>Tipo Richiesta:</strong> {formatRequestType(richiesta.tipo_richiesta_richiesta)}</div>
                      )}
                    </RequestDetails>
                    
                    {richiesta.messaggio && (
                      <RequestMessage>
                        <strong>Messaggio:</strong> {richiesta.messaggio}
                      </RequestMessage>
                    )}
                    
                    {richiesta.dati_richiesta && (
                      <RequestMessage>
                        <strong>Dettagli Richiesta:</strong>
                        <div style={{ marginTop: '0.5rem' }}>
                          {formatRequestDetails(richiesta.dati_richiesta)?.map((detail, index) => (
                            <div key={index} style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.25rem' }}>
                              {detail}
                            </div>
                          ))}
                        </div>
                      </RequestMessage>
                    )}
                  </RequestCard>
                );
              })}
              
              {/* Paginazione */}
              {richieste?.length || 0 > requestsPerPage && (
                <PaginationContainer>
                  <PaginationButton
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Precedente
                  </PaginationButton>
                  
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Pagina {currentPage} di {Math.ceil(richieste?.length || 0 / requestsPerPage)}
                  </span>
                  
                  <PaginationButton
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(richieste?.length || 0 / requestsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(richieste?.length || 0 / requestsPerPage)}
                  >
                    Successiva →
                  </PaginationButton>
                </PaginationContainer>
              )}
            </div>
          </ModalContent>
        </Modal>
      )}

      {/* Popup per gestire la risposta alla richiesta */}
      {showRequestResponseModal && selectedRequest && (
        <Modal onClick={() => setShowRequestResponseModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Gestisci Richiesta Admin</ModalTitle>
              <ModalCloseButton onClick={() => setShowRequestResponseModal(false)}>✕</ModalCloseButton>
            </ModalHeader>
            
            <div>
              <RequestCard $answered={false}>
                <RequestHeader>
                  <RequestTitle>
                    {selectedRequest.tipo_richiesta === 'admin' ? 'Richiesta Admin' : 'Richiesta Ingresso'}
                  </RequestTitle>
                  <RequestStatus $color="#6b7280">In Attesa</RequestStatus>
                </RequestHeader>
                
                <RequestDetails>
                  <div><strong>Lega:</strong> {selectedRequest.lega_nome}</div>
                  <div><strong>Squadra:</strong> {selectedRequest.squadra_nome}</div>
                  <div><strong>Utente:</strong> {selectedRequest.utente_nome || 'N/A'}</div>
                  <div><strong>Email:</strong> {selectedRequest.utente_email || 'N/A'}</div>
                  <div><strong>Data:</strong> {formatDate(selectedRequest.data_creazione || selectedRequest.data_richiesta)}</div>
                  {selectedRequest.tipo_richiesta_richiesta && (
                    <div><strong>Tipo Richiesta:</strong> {formatRequestType(selectedRequest.tipo_richiesta_richiesta)}</div>
                  )}
                </RequestDetails>
                
                {selectedRequest.messaggio && (
                  <RequestMessage>
                    <strong>Messaggio:</strong> {selectedRequest.messaggio}
                  </RequestMessage>
                )}
                
                {selectedRequest.dati_richiesta && (
                  <RequestMessage>
                    <strong>Dettagli Richiesta:</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      {formatRequestDetails(selectedRequest.dati_richiesta)?.map((detail, index) => (
                        <div key={index} style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.25rem' }}>
                          {detail}
                        </div>
                      ))}
                    </div>
                  </RequestMessage>
                )}
              </RequestCard>
              
              <ResponseForm>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Messaggio di risposta (opzionale):
                </label>
                <ResponseTextarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Inserisci un messaggio per l'utente..."
                />
              </ResponseForm>
              
              <ResponseButtons>
                <ActionButton
                  $variant="danger"
                  onClick={() => handleAdminRequestResponse(selectedRequest, 'rifiuta')}
                  disabled={processingResponse}
                >
                  {processingResponse ? 'Elaborazione...' : 'Rifiuta'}
                </ActionButton>
                <ActionButton
                  $variant="success"
                  onClick={() => handleAdminRequestResponse(selectedRequest, 'accetta')}
                  disabled={processingResponse}
                >
                  {processingResponse ? 'Elaborazione...' : 'Accetta'}
                </ActionButton>
              </ResponseButtons>
            </div>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default AreaAdmin; 