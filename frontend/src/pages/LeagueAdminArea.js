import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLegaById } from '../api/leghe';
import { 
  getSubadminsByLega, 
  addSubadmin, 
  removeSubadmin,
  updateSubadminPermissions,
  getPendingChangesByLega,
  approveChange,
  rejectChange,
  getChangeHistory
} from '../api/subadmin';
import { searchUsers } from '../api/auth';
import UserAutocomplete from '../components/UserAutocomplete';

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

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  margin: 0.25rem;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &.danger {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  }
  
  &.success {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  }
  
  &.warning {
    background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
    color: #212529;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #333;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f8f9fa;
  }
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const SubadminCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #667eea;
`;

const PermissionTag = styled.span`
  background: #d4edda;
  color: #155724;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  display: inline-block;
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
  justify-content: between;
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

const ChangeDate = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const ChangeDescription = styled.div`
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const ChangeActions = styled.div`
  display: flex;
  gap: 0.5rem;
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



const LeagueAdminArea = () => {
  const { legaId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [lega, setLega] = useState(null);
  const [subadmins, setSubadmins] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [changeHistory, setChangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSubadminModal, setShowAddSubadminModal] = useState(false);
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingSubadmin, setEditingSubadmin] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({
    modifica_squadre: false,
    gestione_giocatori: false,
    gestione_tornei: false,
    modifica_impostazioni: false,
    gestione_contratti: false,
    gestione_richieste: false
  });

  const [permissions, setPermissions] = useState({
    modifica_squadre: false,
    gestione_giocatori: false,
    gestione_tornei: false,
    modifica_impostazioni: false,
    gestione_contratti: false,
    gestione_richieste: false
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [legaRes, subadminsRes, pendingRes, historyRes] = await Promise.all([
          getLegaById(legaId, token),
          getSubadminsByLega(legaId, token),
          getPendingChangesByLega(legaId, token),
          getChangeHistory(legaId, token)
        ]);
        
        setLega(legaRes?.data?.lega || legaRes?.lega);
        setSubadmins(subadminsRes?.data?.subadmins || subadminsRes?.subadmins || []);
        setPendingChanges(pendingRes?.data?.changes || pendingRes?.changes || []);
        setChangeHistory(historyRes?.data?.changes || historyRes?.changes || []);
        
        // Raccogli tutti gli ID delle squadre dalle modifiche per recuperare i dati originali
        const pendingChanges = pendingRes?.data?.changes || pendingRes?.changes || [];
        const historyChanges = historyRes?.data?.changes || historyRes?.changes || [];
        const squadraIds = new Set();
        [...pendingChanges, ...historyChanges].forEach(change => {
          if (change?.action_data && change?.action_data?.squadreModifiche) {
            Object.keys(change?.action_data?.squadreModifiche).forEach(squadraId => {
              squadraIds.add(parseInt(squadraId));
            });
          }
        });
        
        // Recupera i dati originali delle squadre
        if (squadraIds.size > 0) {
          await fetchSquadreOriginali(Array.from(squadraIds));
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token && legaId) fetchData();
  }, [token, legaId]);

  const handleAddSubadmin = () => {
    setSelectedUser('');
    setSelectedUserId(null);
    setPermissions({
      modifica_squadre: false,
      gestione_giocatori: false,
      gestione_tornei: false,
      modifica_impostazioni: false,
      gestione_contratti: false,
      gestione_richieste: false
    });
    setShowAddSubadminModal(true);
  };

  const handleSubmitSubadmin = async () => {
    if (!selectedUserId) {
      alert('Seleziona un utente');
      return;
    }

    try {
      console.log('Aggiungendo subadmin:', { legaId, selectedUserId, permissions });
      const result = await addSubadmin(legaId, selectedUserId, permissions, token);
      console.log('Risultato aggiunta subadmin:', result);
      alert('Subadmin aggiunto con successo!');
      setShowAddSubadminModal(false);
      
      // Ricarica i dati
      console.log('Ricarico lista subadmin...');
      const subadminsRes = await getSubadminsByLega(legaId, token);
      console.log('Nuova lista subadmin:', subadminsRes);
      setSubadmins(subadminsRes?.data?.subadmins || subadminsRes?.subadmins || []);
    } catch (err) {
      console.error('Errore nell\'aggiunta del subadmin:', err);
      alert(`Errore nell'aggiunta del subadmin: ${err.message}`);
    }
  };

  const handleRemoveSubadmin = async (userId) => {
    if (window.confirm('Sei sicuro di voler rimuovere questo subadmin?')) {
      try {
        await removeSubadmin(legaId, userId, token);
        alert('Subadmin rimosso con successo!');
        
        // Ricarica i dati
        const subadminsRes = await getSubadminsByLega(legaId, token);
        setSubadmins(subadminsRes?.data?.subadmins || subadminsRes?.subadmins || []);
      } catch (err) {
        alert(`Errore nella rimozione del subadmin: ${err.message}`);
      }
    }
  };

  const handleEditPermissions = (subadmin) => {
    setEditingSubadmin(subadmin);
    setEditingPermissions(subadmin.permessi);
    setShowEditPermissionsModal(true);
  };

  const handleEditPermissionChange = (permission) => {
    setEditingPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleSubmitEditPermissions = async () => {
    try {
      await updateSubadminPermissions(legaId, editingSubadmin.utente_id, editingPermissions, token);
      alert('Permessi aggiornati con successo!');
      setShowEditPermissionsModal(false);
      // Ricarica i dati
      const subadminsRes = await getSubadminsByLega(legaId, token);
      setSubadmins(subadminsRes.subadmins || []);
    } catch (err) {
      alert(`Errore nell'aggiornamento dei permessi: ${err.message}`);
    }
  };



  const handlePermissionChange = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleApproveChange = async (changeId) => {
    const adminResponse = prompt('Inserisci un commento (opzionale):');
    try {
      await approveChange(changeId, adminResponse || '', token);
      
      // Aggiorna lo stato localmente per un feedback immediato
      const changeToMove = pendingChanges.find(change => change.id === changeId);
      if (changeToMove) {
        // Rimuovi dalla lista pending e aggiungi alla history
        setPendingChanges(prev => prev?.filter(change => change.id !== changeId));
        
        // Aggiungi alla history con status "approved"
        const updatedChange = {
          ...changeToMove,
          status: 'approved',
          admin_response: adminResponse || '',
          reviewed_at: new Date().toISOString()
        };
        setChangeHistory(prev => [updatedChange, ...prev]);
      }
      
      alert('Modifica approvata con successo!');
    } catch (err) {
      alert(`Errore nell'approvazione: ${err.message}`);
    }
  };

  const handleRejectChange = async (changeId) => {
    const adminResponse = prompt('Inserisci un commento per il rifiuto:');
    if (!adminResponse) {
      alert('È necessario inserire un commento per il rifiuto');
      return;
    }
    
    try {
      await rejectChange(changeId, adminResponse, token);
      
      // Aggiorna lo stato localmente per un feedback immediato
      const changeToMove = pendingChanges.find(change => change.id === changeId);
      if (changeToMove) {
        // Rimuovi dalla lista pending e aggiungi alla history
        setPendingChanges(prev => prev?.filter(change => change.id !== changeId));
        
        // Aggiungi alla history con status "rejected"
        const updatedChange = {
          ...changeToMove,
          status: 'rejected',
          admin_response: adminResponse,
          reviewed_at: new Date().toISOString()
        };
        setChangeHistory(prev => [updatedChange, ...prev]);
      }
      
      alert('Modifica rifiutata con successo!');
    } catch (err) {
      alert(`Errore nel rifiuto: ${err.message}`);
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

  const [squadreOriginali, setSquadreOriginali] = useState({});

  // Funzione per recuperare i dati originali delle squadre
  const fetchSquadreOriginali = async (squadraIds) => {
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/squadre/original-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ squadraIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSquadreOriginali(prev => ({ ...prev, ...data.squadre }));
      } else {
        console.error('Errore risposta API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Errore recupero dati originali squadre:', error);
    }
  };

  const formatActionData = (actionData) => {
    try {
      if (typeof actionData === 'string') {
        return actionData;
      }
      
      // Funzione helper per pulire i valori null
      const cleanValue = (value) => {
        if (value === null || value === undefined || value === 'null') {
          return 'N/A';
        }
        return value;
      };
      
      if (typeof actionData === 'object' && actionData !== null) {
        // Handle specific action data structures
        if (actionData.squadreModifiche) {
          const squadreMod = Object.entries(actionData.squadreModifiche);
          const addedPlayers = actionData.addedPlayers ? Object.values(actionData.addedPlayers).flat().length : 0;
          const removedPlayers = actionData.removedPlayers ? Object.values(actionData.removedPlayers).flat().length : 0;
          
          let description = [];
          
          if (squadreMod?.length || 0 > 0) {
            description.push(`📝 Modifiche a ${squadreMod?.length || 0} squadra${squadreMod?.length || 0 > 1 ? 'e' : ''}`);
            
            // Aggiungi dettagli delle modifiche per ogni squadra con confronto DA/A
            squadreMod.forEach(([squadraId, modifiche]) => {
              if (modifiche && typeof modifiche === 'object') {
                const modificheList = Object.entries(modifiche).map(([campo, nuovoValore]) => {
                  const labels = {
                    nome: 'Nome',
                    immagine: 'Immagine',
                    casse_societarie: 'Casse Societarie',
                    club_level: 'Club Level',
                    proprietario: 'Proprietario',
                    note: 'Note'
                  };
                  
                  const squadraOriginale = squadreOriginali[squadraId];
                  if (squadraOriginale) {
                    const valoreOriginale = squadraOriginale[campo];
                    return `${labels[campo] || campo}: ${valoreOriginale} → ${nuovoValore}`;
                  } else {
                    return `${labels[campo] || campo}: ${nuovoValore}`;
                  }
                });
                if (modificheList?.length || 0 > 0) {
                  description.push(`  • Squadra ${squadraId}: ${modificheList.join(', ')}`);
                }
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
        if (actionData.modifiche && actionData.modifiche.giocatoreId && actionData.modifiche.modifiche) {
          // Struttura nested (nuova)
          const labels = {
            nome: 'Nome',
            cognome: 'Cognome',
            ruolo: 'Ruolo',
            media_voto: 'Media Voto',
            fantamedia_voto: 'Fantamedia Voto',
            squadra_reale: 'Squadra Reale',
            quotazione_iniziale: 'Quotazione Iniziale',
            costo_attuale: 'Ingaggio',
            quotazione_attuale: 'Quotazione Attuale',
            fanta_valore_mercato: 'Fanta Valore di Mercato',
            anni_contratto: 'Anni Contratto',
            prestito: 'Prestito',
            triggers: 'Triggers'
          };
          
          const modificheList = Object.entries(actionData.modifiche.modifiche).map(([campo, nuovoValore]) => {
            const valoreOriginale = cleanValue(actionData.modifiche.valoriOriginali?.[campo]) || 'N/A';
            return `${labels[campo] || campo}: ${valoreOriginale} → ${cleanValue(nuovoValore)}`;
          });
          
          // Ottieni il nome del giocatore e il ruolo dai dettagli se disponibili
          const giocatoreNome = cleanValue(actionData.modifiche.giocatore) || cleanValue(actionData.modifiche?.nome) || `ID ${actionData.modifiche.giocatoreId}` || 'Giocatore sconosciuto';
          
          // Cerca il ruolo in vari punti possibili
          let ruolo = 'N/A';
          if (actionData.modifiche.valoriOriginali?.ruolo) {
            ruolo = cleanValue(actionData.modifiche.valoriOriginali?.ruolo || 'Ruolo');
          } else if (actionData.modifiche.modifiche?.ruolo) {
            ruolo = cleanValue(actionData.modifiche.modifiche?.ruolo || 'Ruolo');
          } else if (actionData.modifiche?.ruolo || 'Ruolo') {
            ruolo = cleanValue(actionData.modifiche?.ruolo || 'Ruolo');
          }
          
          // Debug log per capire cosa sta succedendo
          console.log('Debug formatActionData - nested structure:', {
            actionData,
            giocatoreNome,
            ruolo,
            valoriOriginali: actionData.modifiche.valoriOriginali,
            modifiche: actionData.modifiche.modifiche,
            modificheList
          });
          
          return `👤 ${giocatoreNome} (${ruolo}):\n  • ${modificheList.join('\n  • ')}`;
        } else if (actionData.giocatoreId && actionData.modifiche) {
          // Struttura flat (per compatibilità)
          const labels = {
            nome: 'Nome',
            cognome: 'Cognome',
            ruolo: 'Ruolo',
            media_voto: 'Media Voto',
            fantamedia_voto: 'Fantamedia Voto',
            squadra_reale: 'Squadra Reale',
            quotazione_iniziale: 'Quotazione Iniziale',
            costo_attuale: 'Ingaggio',
            quotazione_attuale: 'Quotazione Attuale',
            fanta_valore_mercato: 'Fanta Valore di Mercato',
            anni_contratto: 'Anni Contratto',
            prestito: 'Prestito',
            triggers: 'Triggers'
          };
          
          const modificheList = Object.entries(actionData.modifiche).map(([campo, nuovoValore]) => {
            const valoreOriginale = cleanValue(actionData.valoriOriginali?.[campo]) || 'N/A';
            return `${labels[campo] || campo}: ${valoreOriginale} → ${cleanValue(nuovoValore)}`;
          });
          
          // Ottieni il nome del giocatore e il ruolo dai dettagli se disponibili
          const giocatoreNome = cleanValue(actionData.giocatore) || cleanValue(actionData?.nome) || `ID ${actionData.giocatoreId}` || 'Giocatore sconosciuto';
          const ruolo = cleanValue(actionData.valoriOriginali?.ruolo) || 'N/A';
          
          return `👤 ${giocatoreNome} (${ruolo}):\n  • ${modificheList.join('\n  • ')}`;
        }
        
        return JSON.stringify(actionData, null, 2);
      }
      
      return String(actionData || '');
    } catch (e) {
      console.error('Error formatting action data:', e);
      return typeof actionData === 'string' ? actionData : JSON.stringify(actionData);
    }
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento...</LoadingContainer>
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
        <Title>Area Admin - {lega?.nome || 'Nome'}</Title>
        <Subtitle>Gestione subadmin e approvazione modifiche</Subtitle>
      </Header>

      {/* Sezione Subadmin */}
      <Section>
        <SectionTitle>
          👥 Gestione Subadmin
          <Button onClick={handleAddSubadmin}>Aggiungi Subadmin</Button>
        </SectionTitle>
        
        {subadmins?.length || 0 > 0 ? (
          subadmins?.map(sub => (
            <SubadminCard key={sub.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4>{sub.username}</h4>
                  <p style={{ color: '#666', margin: '0.5rem 0' }}>
                    Aggiunto il: {formatDate(sub.data_nomina)}
                  </p>
                  <div>
                      {Object.entries(sub.permessi).map(([perm, value]) => {
                        if (!value) return null;
                        
                        // Mappa i nomi dei permessi per una migliore visualizzazione
                        const permLabels = {
                          modifica_squadre: 'Modifica Squadre',
                          gestione_giocatori: 'Gestione Calciatori',
                          gestione_tornei: 'Gestione Tornei',
                          modifica_impostazioni: 'Modifica Impostazioni',
                          gestione_contratti: 'Gestione Contratti',
                          gestione_richieste: 'Gestione Richieste'
                        };
                        
                        return <PermissionTag key={perm}>{permLabels[perm] || perm.replace('_', ' ')}</PermissionTag>;
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                      className="warning"
                      onClick={() => handleEditPermissions(sub)}
                    >
                      Modifica Permessi
                    </Button>
                <Button 
                  className="danger"
                  onClick={() => handleRemoveSubadmin(sub.utente_id)}
                >
                  Rimuovi
                </Button>
                  </div>
              </div>
            </SubadminCard>
          ))
        ) : (
          <EmptyContainer>Nessun subadmin assegnato a questa lega</EmptyContainer>
        )}
      </Section>

      {/* Sezione Modifiche in Attesa */}
      <Section>
        <SectionTitle>⏳ Modifiche in Attesa ({pendingChanges?.length || 0})</SectionTitle>
        
        {pendingChanges?.length || 0 > 0 ? (
          pendingChanges?.map(change => (
            <ChangeCard key={change.id}>
              <ChangeHeader>
                <ChangeType>
                  {change.action_type === 'gestione_giocatori' ? 'Gestione Calciatori' : change.action_type}
                </ChangeType>
                <ChangeDate>{formatDate(change.created_at)}</ChangeDate>
              </ChangeHeader>
              <ChangeDescription>
                <SubadminInfo>Subadmin: {change.username}</SubadminInfo>
                <strong>Lega:</strong> <LeagueLink onClick={() => navigate(`/lega/${change?.lega_id}`)}>{change?.lega_nome}</LeagueLink><br/>
                <strong>Descrizione:</strong><br/>
                <pre style={{ 
                  background: '#f8f9fa', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap',
                  margin: '0.5rem 0',
                  fontFamily: 'inherit'
                }}>
                  {formatActionData(change.action_data)}
                </pre>
              </ChangeDescription>
              <ChangeActions>
                <Button 
                  className="success"
                  onClick={() => handleApproveChange(change.id)}
                >
                  Approva
                </Button>
                <Button 
                  className="danger"
                  onClick={() => handleRejectChange(change.id)}
                >
                  Rifiuta
                </Button>
              </ChangeActions>
            </ChangeCard>
          ))
        ) : (
          <EmptyContainer>Nessuna modifica in attesa di approvazione</EmptyContainer>
        )}
      </Section>

      {/* Sezione Storico Modifiche */}
      <Section>
        <SectionTitle>📋 Storico Modifiche</SectionTitle>
        
        {changeHistory?.length || 0 > 0 ? (
          changeHistory?.map(change => (
            <ChangeCard key={change.id} style={{ 
              background: change.status === 'approved' ? '#d4edda' : '#f8d7da',
              borderColor: change.status === 'approved' ? '#c3e6cb' : '#f5c6cb'
            }}>
              <ChangeHeader>
                <ChangeType style={{ 
                  background: change.status === 'approved' ? '#28a745' : '#dc3545'
                }}>
                  {(change.action_type === 'gestione_giocatori' ? 'Gestione Calciatori' : change.action_type)} - {change.status}
                </ChangeType>
                <ChangeDate>{formatDate(change.created_at)}</ChangeDate>
              </ChangeHeader>
              <ChangeDescription>
                <SubadminInfo>Subadmin: {change.username}</SubadminInfo>
                <strong>Lega:</strong> <LeagueLink onClick={() => navigate(`/lega/${change.lega_id}`)}>{change.lega_nome}</LeagueLink><br/>
                <strong>Descrizione:</strong><br/>
                <pre style={{ 
                  background: '#f8f9fa', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap',
                  margin: '0.5rem 0',
                  fontFamily: 'inherit'
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
            </ChangeCard>
          ))
        ) : (
          <EmptyContainer>Nessuna modifica nello storico</EmptyContainer>
        )}
      </Section>

      {/* Modal Aggiungi Subadmin */}
      {showAddSubadminModal && (
        <Modal onClick={() => setShowAddSubadminModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Aggiungi Subadmin - {lega?.nome || 'Nome'}</ModalTitle>
            
            <FormGroup>
              <Label>Seleziona Utente</Label>
              <UserAutocomplete
                value={selectedUser}
                onChange={setSelectedUser}
                placeholder="Cerca utente per username..."
                token={token}
                onUserSelect={(user) => {
                  setSelectedUser(user.username);
                  setSelectedUserId(user.id);
                }}
              />
            </FormGroup>

            <FormGroup>
              <Label>Permessi</Label>
              <CheckboxGroup>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.modifica_squadre}
                    onChange={() => handlePermissionChange('modifica_squadre')}
                  />
                  Modifica Squadre
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.gestione_giocatori}
                    onChange={() => handlePermissionChange('gestione_giocatori')}
                  />
                  Gestione Calciatori
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.gestione_tornei}
                    onChange={() => handlePermissionChange('gestione_tornei')}
                  />
                  Gestione Tornei
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.modifica_impostazioni}
                    onChange={() => handlePermissionChange('modifica_impostazioni')}
                  />
                  Modifica Impostazioni
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.gestione_contratti}
                    onChange={() => handlePermissionChange('gestione_contratti')}
                  />
                  Gestione Contratti
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.gestione_richieste}
                    onChange={() => handlePermissionChange('gestione_richieste')}
                  />
                  Gestione Richieste
                </CheckboxItem>
              </CheckboxGroup>
            </FormGroup>

            <ButtonGroup>
              <Button 
                onClick={() => setShowAddSubadminModal(false)}
              >
                Annulla
              </Button>
              <Button 
                className="success"
                onClick={handleSubmitSubadmin}
              >
                Aggiungi Subadmin
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Modifica Permessi Subadmin */}
      {showEditPermissionsModal && editingSubadmin && (
        <Modal onClick={() => setShowEditPermissionsModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Modifica Permessi - {editingSubadmin.username}</ModalTitle>
            
            <FormGroup>
              <Label>Permessi</Label>
              <CheckboxGroup>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={editingPermissions.modifica_squadre}
                    onChange={() => handleEditPermissionChange('modifica_squadre')}
                  />
                  Modifica Squadre
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={editingPermissions.gestione_giocatori}
                    onChange={() => handleEditPermissionChange('gestione_giocatori')}
                  />
                  Gestione Calciatori
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={editingPermissions.gestione_tornei}
                    onChange={() => handleEditPermissionChange('gestione_tornei')}
                  />
                  Gestione Tornei
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={editingPermissions.modifica_impostazioni}
                    onChange={() => handleEditPermissionChange('modifica_impostazioni')}
                  />
                  Modifica Impostazioni
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={editingPermissions.gestione_contratti}
                    onChange={() => handleEditPermissionChange('gestione_contratti')}
                  />
                  Gestione Contratti
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={editingPermissions.gestione_richieste}
                    onChange={() => handleEditPermissionChange('gestione_richieste')}
                  />
                  Gestione Richieste
                </CheckboxItem>
              </CheckboxGroup>
            </FormGroup>

            <ButtonGroup>
              <Button 
                onClick={() => setShowEditPermissionsModal(false)}
              >
                Annulla
              </Button>
              <Button 
                className="success"
                onClick={handleSubmitEditPermissions}
              >
                Salva Permessi
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default LeagueAdminArea; 