import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLegaById } from '../api/leghe';
import { getSquadreByLega } from '../api/squadre';
import { getGiocatoriBySquadra } from '../api/giocatori';
import { createPendingChange } from '../api/subadmin';
import { splitRoles, getRoleClass } from '../utils/roleUtils';

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

const RequestModeBanner = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  color: #856404;
  text-align: center;
  font-weight: 600;
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

// Tabella squadre
const TeamsTable = styled.div`
  overflow-x: auto;
`;

// Commento sui campi giocatore:
// r = Media Voto
// fr = Fantamedia Voto  
// qi = Quotazione Iniziale
// qa = Quotazione Attuale
// fvmp = Fanta Valore di Mercato

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`;

const TableHeader = styled.th`
  background: #5856d6;
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: center;
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
`;

const TableCell = styled.td`
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #e5e5e7;
  color: #1d1d1f;
  text-align: center;
`;

const TeamName = styled.div`
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #007AFF;
  }
`;

const TeamOwner = styled.div`
  font-size: 0.75rem;
  color: #86868b;
`;

const MoneyValue = styled.span`
  font-weight: 600;
  color: #28a745;
`;

const FMValue = styled.span`
  font-weight: 600;
  color: #007AFF;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #007AFF;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: #f0f0f0;
  }
`;

// Sezione giocatori espandibile
const PlayersSection = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  margin: 0.5rem 0;
  overflow: hidden;
  transition: all 0.3s ease;
`;

const PlayersHeader = styled.div`
  background: #e9ecef;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    background: #dee2e6;
  }
`;

const PlayersTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.1rem;
`;

const PlayersCount = styled.span`
  background: #007AFF;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const PlayersContent = styled.div`
  padding: 1rem;
  max-height: ${props => props.$expanded ? 'none' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
`;

const PlayersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
`;

const PlayerRow = styled.tr`
  &:hover {
    background: #f0f0f0;
  }
`;

const PlayerCell = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid #e5e5e7;
  color: #1d1d1f;
  text-align: center;
`;

const PlayerName = styled.div`
  font-weight: 600;
  color: #1d1d1f;
`;

const PlayerRole = styled.span`
  .ruolo-badge {
    display: inline-block;
    padding: 2px 6px;
    margin: 1px;
    border-radius: 5px;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    min-width: 18px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    border: 1px solid rgba(255,255,255,0.18);
    transition: all 0.2s ease;
  }
  
  .ruolo-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.13);
  }
`;

const EditButton = styled.button`
  background: #007AFF;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
  
  &:hover {
    background: #0056b3;
  }
`;

// Pulsanti flottanti
const FloatingButtons = styled.div`
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
`;

const FloatingButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  
  &.scroll-top {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #218838;
    }
  }
  
  &.close-players {
    background: #dc3545;
    color: white;
    
    &:hover {
      background: #c82333;
    }
  }
`;

// Modal per modifica giocatore
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
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &.primary {
    background: #007AFF;
    color: white;
    
    &:hover {
      background: #0056b3;
    }
  }
  
  &.secondary {
    background: #6c757d;
    color: white;
  
  &:hover {
      background: #545b62;
    }
  }
  
  &.success {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #218838;
    }
  }
`;

const SubmitButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 2rem;
  width: 100%;
  
  &:hover {
    background: #218838;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const RequestGiocatoriModification = () => {
  const { legaId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [lega, setLega] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [giocatoriPerSquadra, setGiocatoriPerSquadra] = useState({});
  const [expandedSquadre, setExpandedSquadre] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal per modifica giocatore
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerModifications, setPlayerModifications] = useState({});
  
  // Modifiche temporanee
  const [modifications, setModifications] = useState({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [legaRes, squadreRes] = await Promise.all([
          getLegaById(legaId, token),
          getSquadreByLega(legaId, token)
        ]);
        
        setLega(legaRes.lega);
        setSquadre(squadreRes.squadre || []);
        
        // Carica i giocatori per ogni squadra
        const giocatoriData = {};
        for (const squadra of squadreRes.squadre || []) {
          try {
            const giocatoriRes = await getGiocatoriBySquadra(squadra.id, token);
            giocatoriData[squadra.id] = giocatoriRes.giocatori || [];
          } catch (err) {
            console.error(`Errore caricamento giocatori squadra ${squadra.id}:`, err);
            giocatoriData[squadra.id] = [];
          }
        }
        setGiocatoriPerSquadra(giocatoriData);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token && legaId) fetchData();
  }, [token, legaId]);

  const toggleSquadra = (squadraId) => {
    setExpandedSquadre(prev => ({
      ...prev,
      [squadraId]: !prev[squadraId]
    }));
  };

  const closeAllPlayers = () => {
    setExpandedSquadre({});
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditPlayer = (giocatore) => {
    setEditingPlayer(giocatore);
    setPlayerModifications({});
    setShowModal(true);
  };

  const handlePlayerModification = (field, value) => {
    setPlayerModifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePlayerModification = () => {
    if (!editingPlayer) return;
    
    const squadraId = editingPlayer.squadra_id;
    const giocatoreId = editingPlayer.id;
    
    setModifications(prev => ({
      ...prev,
      [squadraId]: {
        ...prev[squadraId],
      [giocatoreId]: {
          ...prev[squadraId]?.[giocatoreId],
          ...playerModifications
        }
      }
    }));
    
    setShowModal(false);
    setEditingPlayer(null);
    setPlayerModifications({});
  };

  const handleCancelPlayerModification = () => {
    setShowModal(false);
    setEditingPlayer(null);
    setPlayerModifications({});
  };

  const removePlayerModification = (squadraId, giocatoreId) => {
    setModifications(prev => {
      const newMods = { ...prev };
      if (newMods[squadraId]) {
        delete newMods[squadraId][giocatoreId];
        if (Object.keys(newMods[squadraId]).length === 0) {
          delete newMods[squadraId];
        }
      }
      return newMods;
    });
  };

  const handleSubmitRequest = async () => {
    try {
      // Crea una richiesta per ogni giocatore modificato
      const requests = [];
      
      for (const [squadraId, giocatoriMods] of Object.entries(modifications)) {
        for (const [giocatoreId, modifiche] of Object.entries(giocatoriMods)) {
          const giocatore = giocatoriPerSquadra[squadraId]?.find(g => g.id === giocatoreId);
          if (giocatore) {
            const squadra = squadre.find(s => s.id === parseInt(squadraId) || s.id === squadraId);
            
            // Debug log per capire cosa sta succedendo
            console.log('Debug createPendingChange:', {
              squadraId,
              squadra,
              giocatore,
              modifiche
            });
            
            requests.push({
        legaId: parseInt(legaId),
        tipo: 'gestione_giocatori',
              modifiche: {
                giocatoreId: parseInt(giocatoreId),
                giocatore: giocatore.nome + ' ' + giocatore.cognome,
                squadra: squadra?.nome || 'N/A',
                modifiche: modifiche,
                valoriOriginali: {
                  nome: giocatore.nome,
                  cognome: giocatore.cognome,
                  ruolo: giocatore.ruolo,
                  media_voto: giocatore.media_voto,
                  fantamedia_voto: giocatore.fantamedia_voto,
                  squadra_reale: giocatore.squadra_reale,
                  eta: giocatore.eta,
                  quotazione_iniziale: giocatore.quotazione_iniziale,
                  costo_attuale: giocatore.costo_attuale,
                  quotazione_attuale: giocatore.qa,
                  fanta_valore_mercato: giocatore.fvm,
                  anni_contratto: giocatore.anni_contratto,
                  prestito: giocatore.prestito,
                  triggers: giocatore.triggers
                }
              },
              descrizione: `Modifica giocatore ${giocatore.nome} ${giocatore.cognome}`,
        dettagli: {
                giocatore: giocatore.nome + ' ' + giocatore.cognome,
                modifiche: Object.keys(modifiche)
              }
            });
          }
        }
      }
      
      // Invia tutte le richieste
      for (const request of requests) {
        await createPendingChange(request, token);
      }
      
      alert(`${requests.length} richieste di modifica inviate con successo!`);
      navigate('/subadmin-area');
    } catch (err) {
      alert('Errore nell\'invio delle richieste: ' + err.message);
    }
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const hasModifications = () => {
    return Object.keys(modifications).length > 0;
  };

  const getModificationCount = () => {
    let count = 0;
    for (const squadraMods of Object.values(modifications)) {
      count += Object.keys(squadraMods).length;
    }
    return count;
  };

  // Funzione per ordinare i giocatori per ruolo
  const sortPlayersByRole = (players) => {
    if (!players) return [];
    
    const isMantra = lega?.modalita?.includes('Mantra');
    
    // Definizione dell'ordine dei ruoli
    const roleOrder = isMantra 
      ? ['Por', 'Ds', 'Dc', 'Dd', 'B', 'E', 'M', 'C', 'T', 'W', 'A', 'Pc'] // Mantra
      : ['P', 'D', 'C', 'A']; // Classic
    
    return [...players].sort((a, b) => {
      const roleA = a.ruolo || '';
      const roleB = b.ruolo || '';
      
      // Per Euroleghe Mantra, mappa i ruoli complessi ai ruoli base
      let mappedRoleA = roleA;
      let mappedRoleB = roleB;
      
      if (isMantra) {
        // Per ruoli multipli, prendi il primo ruolo
        const firstRoleA = roleA.split(';')[0];
        const firstRoleB = roleB.split(';')[0];
        
        mappedRoleA = firstRoleA;
        mappedRoleB = firstRoleB;
      }
      
      const indexA = roleOrder.indexOf(mappedRoleA);
      const indexB = roleOrder.indexOf(mappedRoleB);
      
      // Se entrambi i ruoli sono nell'ordine definito, ordina per posizione
      if (indexA !== -1 && indexB !== -1) {
        if (indexA === indexB) {
          // Se hanno lo stesso ruolo base, ordina per il ruolo completo
          return roleA.localeCompare(roleB);
        }
        return indexA - indexB;
      }
      
      // Se solo uno è nell'ordine definito, metti quello definito prima
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Se nessuno è nell'ordine definito, ordina alfabeticamente
      return roleA.localeCompare(roleB);
    });
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento dati lega...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <div style={{ color: '#dc3545', textAlign: 'center', padding: '2rem' }}>
        Errore: {error}
      </div>
    </Container>
  );

  return (
    <Container>
      <Header>
        <Title>Richiesta Modifica Giocatori</Title>
        <Subtitle>Lega: {lega?.nome}</Subtitle>
      </Header>

      <RequestModeBanner>
        📝 Modalità Richiesta: Le modifiche verranno inviate all'amministratore della lega per approvazione
      </RequestModeBanner>

      <Section>
        <SectionTitle>🏆 Squadre della Lega</SectionTitle>
        
        <TeamsTable>
          <Table>
            <thead>
              <tr>
                <TableHeader>Squadra</TableHeader>
                <TableHeader>Proprietario</TableHeader>
                <TableHeader>Giocatori</TableHeader>
                <TableHeader>Valore Roster</TableHeader>
                <TableHeader>Budget</TableHeader>
                <TableHeader>Azioni</TableHeader>
              </tr>
            </thead>
            <tbody>
              {squadre.map(squadra => (
                <React.Fragment key={squadra.id}>
                  <tr>
                    <TableCell>
                      <TeamName onClick={() => toggleSquadra(squadra.id)}>{squadra.nome}</TeamName>
                      <TeamOwner>{squadra.proprietario || 'N/A'}</TeamOwner>
                    </TableCell>
                    <TableCell>{squadra.proprietario || 'N/A'}</TableCell>
                    <TableCell>{giocatoriPerSquadra[squadra.id]?.length || 0}</TableCell>
                    <TableCell>
                      <MoneyValue>
                        {formatMoney(giocatoriPerSquadra[squadra.id]?.reduce((sum, g) => sum + (g.valore || 0), 0) || 0)}
                      </MoneyValue>
                    </TableCell>
                    <TableCell>
                      <MoneyValue>{formatMoney(squadra.budget || 0)}</MoneyValue>
                    </TableCell>
                    <TableCell>
                      <ExpandButton onClick={() => toggleSquadra(squadra.id)}>
                        {expandedSquadre[squadra.id] ? '▼' : '▶'}
                      </ExpandButton>
                    </TableCell>
                  </tr>
                  {expandedSquadre[squadra.id] && (
                    <tr>
                      <TableCell colSpan="6" style={{ padding: 0 }}>
                        <PlayersSection>
                          <PlayersHeader>
                            <PlayersTitle>Giocatori di {squadra.nome}</PlayersTitle>
                            <PlayersCount>{giocatoriPerSquadra[squadra.id]?.length || 0}</PlayersCount>
                          </PlayersHeader>
                          <PlayersContent $expanded={expandedSquadre[squadra.id]}>
                            <PlayersTable>
                              <thead>
                                <tr>
                                  <TableHeader>Giocatore</TableHeader>
                                  <TableHeader>Ruolo</TableHeader>
                                  <TableHeader>M</TableHeader>
                                  <TableHeader>FaM</TableHeader>
                                  <TableHeader>Squadra Reale</TableHeader>
                                  <TableHeader>Cantera</TableHeader>
                                  <TableHeader>QI</TableHeader>
                                  <TableHeader>Ingaggio</TableHeader>
                                  <TableHeader>QA</TableHeader>
                                  <TableHeader>FVMp</TableHeader>
                                  <TableHeader>Anni Contratto</TableHeader>
                                  <TableHeader>Prestito</TableHeader>
                                  <TableHeader>Triggers</TableHeader>
                                  <TableHeader>Azioni</TableHeader>
                                </tr>
                              </thead>
                              <tbody>
                                {sortPlayersByRole(giocatoriPerSquadra[squadra.id] || []).map(giocatore => (
                                  <PlayerRow key={giocatore.id}>
                                    <PlayerCell>
              <PlayerName>{giocatore.nome} {giocatore.cognome}</PlayerName>
                                    </PlayerCell>
                                    <PlayerCell>
                                      <PlayerRole>
                                        {splitRoles(giocatore.ruolo).map((ruolo, index) => (
                                          <span
                                            key={index}
                                            className={`ruolo-badge ${getRoleClass(ruolo)}`}
                                          >
                                            {ruolo}
                                          </span>
                                        ))}
                                      </PlayerRole>
                                    </PlayerCell>
                                    <PlayerCell>{giocatore.r || 'N/A'}</PlayerCell>
                                    <PlayerCell>{giocatore.fr || 'N/A'}</PlayerCell>
                                    <PlayerCell>{giocatore.squadra_reale || 'N/A'}</PlayerCell>
                                    <PlayerCell>{giocatore.cantera ? '✔' : '-'}</PlayerCell>
                                    <PlayerCell>{giocatore.qi || 'N/A'}</PlayerCell>
                                    <PlayerCell>
                                      <FMValue>FM {giocatore.costo_attuale || 0}</FMValue>
                                    </PlayerCell>
                                    <PlayerCell>{giocatore.qa || 'N/A'}</PlayerCell>
                                    <PlayerCell>{giocatore.fvmp || 'N/A'}</PlayerCell>
                                    <PlayerCell>{giocatore.anni_contratto || 'N/A'}</PlayerCell>
                                    <PlayerCell>{giocatore.prestito || 'N/A'}</PlayerCell>
                                    <PlayerCell>{giocatore.triggers || 'N/A'}</PlayerCell>
                                    <PlayerCell>
                                      <EditButton onClick={() => handleEditPlayer(giocatore)}>
                                        Modifica
                                      </EditButton>
                                    </PlayerCell>
                                  </PlayerRow>
                                ))}
                              </tbody>
                            </PlayersTable>
                          </PlayersContent>
                        </PlayersSection>
                      </TableCell>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </TeamsTable>
      </Section>

      {/* Pulsanti flottanti */}
      {Object.keys(expandedSquadre).length > 0 && (
        <FloatingButtons>
          <FloatingButton className="scroll-top" onClick={scrollToTop} title="Torna in cima">
            ↑
          </FloatingButton>
          <FloatingButton className="close-players" onClick={closeAllPlayers} title="Chiudi tutte le liste">
            ✕
          </FloatingButton>
        </FloatingButtons>
      )}

      {/* Modal modifica giocatore */}
      {showModal && editingPlayer && (
        <Modal onClick={handleCancelPlayerModification}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              Modifica Giocatore: {editingPlayer.nome} {editingPlayer.cognome}
              <CloseButton onClick={handleCancelPlayerModification}>×</CloseButton>
            </ModalTitle>
            
            <FormGrid>
              <FormGroup>
                <Label>Nome</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.nome}
                  onChange={(e) => handlePlayerModification('nome', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Cognome</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.cognome}
                  onChange={(e) => handlePlayerModification('cognome', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Ruolo</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.ruolo}
                  onChange={(e) => handlePlayerModification('ruolo', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Media Voto</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.media_voto}
                  onChange={(e) => handlePlayerModification('media_voto', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Fantamedia Voto</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.fantamedia_voto}
                  onChange={(e) => handlePlayerModification('fantamedia_voto', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Squadra Reale</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.squadra_reale}
                  onChange={(e) => handlePlayerModification('squadra_reale', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    defaultChecked={editingPlayer.cantera}
                    onChange={(e) => handlePlayerModification('cantera', e.target.checked)}
                  />
                  Calciatore Cantera
                </Label>
              </FormGroup>
              
              <FormGroup>
                <Label>Quotazione Iniziale</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.quotazione_iniziale}
                  onChange={(e) => handlePlayerModification('quotazione_iniziale', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Ingaggio</Label>
                <Input
                  type="number"
                  defaultValue={editingPlayer.costo_attuale}
                  onChange={(e) => handlePlayerModification('costo_attuale', parseFloat(e.target.value))}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Quotazione Attuale</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.qa}
                  onChange={(e) => handlePlayerModification('quotazione_attuale', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Fanta Valore di Mercato</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.fvm}
                  onChange={(e) => handlePlayerModification('fanta_valore_mercato', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Anni Contratto</Label>
                <Input
                  type="number"
                  defaultValue={editingPlayer.anni_contratto}
                  onChange={(e) => handlePlayerModification('anni_contratto', parseInt(e.target.value))}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Prestito</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.prestito}
                  onChange={(e) => handlePlayerModification('prestito', e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Triggers</Label>
                <Input
                  type="text"
                  defaultValue={editingPlayer.triggers}
                  onChange={(e) => handlePlayerModification('triggers', e.target.value)}
                />
              </FormGroup>
            </FormGrid>
            
            <ButtonGroup>
              <Button className="secondary" onClick={handleCancelPlayerModification}>
                Annulla
              </Button>
              <Button className="success" onClick={handleSavePlayerModification}>
                Richiedi
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Pulsante invio richieste */}
      {hasModifications() && (
        <Section>
          <SectionTitle>📋 Modifiche in Attesa ({getModificationCount()})</SectionTitle>
          
          {Object.entries(modifications).map(([squadraId, giocatoriMods]) => {
            const squadra = squadre.find(s => s.id === squadraId);
            return (
              <div key={squadraId} style={{ marginBottom: '1rem' }}>
                <h4>{squadra?.nome}</h4>
                {Object.entries(giocatoriMods).map(([giocatoreId, modifiche]) => {
                  const giocatore = giocatoriPerSquadra[squadraId]?.find(g => g.id === giocatoreId);
                  return (
                    <div key={giocatoreId} style={{ 
                      background: '#f8f9fa', 
                      padding: '0.5rem', 
                      margin: '0.25rem 0',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>
                        {giocatore?.nome} {giocatore?.cognome} - 
                        {Object.entries(modifiche).map(([campo, valore]) => {
                          const labels = {
                            nome: 'Nome',
                            cognome: 'Cognome',
                            ruolo: 'Ruolo',
                            media_voto: 'Media Voto',
                            fantamedia_voto: 'Fantamedia Voto',
                            squadra_reale: 'Squadra Reale',
                            cantera: 'Cantera',
                            quotazione_iniziale: 'Quotazione Iniziale',
                            costo_attuale: 'Ingaggio',
                            quotazione_attuale: 'Quotazione Attuale',
                            fanta_valore_mercato: 'Fanta Valore di Mercato',
                            anni_contratto: 'Anni Contratto',
                            prestito: 'Prestito',
                            triggers: 'Triggers'
                          };
                          return ` ${labels[campo] || campo}: ${valore}`;
                        }).join(', ')}
                      </span>
                      <Button 
                className="secondary"
                        onClick={() => removePlayerModification(squadraId, giocatoreId)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Rimuovi
                      </Button>
            </div>
                  );
                })}
        </div>
            );
          })}
          
          <SubmitButton onClick={handleSubmitRequest}>
            Richiedi Modifiche ({getModificationCount()})
        </SubmitButton>
        </Section>
      )}
    </Container>
  );
};

export default RequestGiocatoriModification; 
