import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLegaById } from '../api/leghe';
import { getSquadreByLega } from '../api/squadre';
import { getGiocatoriByLega } from '../api/giocatori';
import { createPendingChange } from '../api/subadmin';
import { api } from '../api/config.js';

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

const SquadCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  overflow: hidden;
  
  ${props => props.$isModified && `
    border-color: #28a745;
    background: #d4edda;
  `}
`;

const SquadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  background: ${props => props.$isOpen ? '#e3f2fd' : '#f8f9fa'};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$isOpen ? '#e3f2fd' : '#e9ecef'};
  }
`;

const SquadName = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SquadInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SquadStats = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const ExpandIcon = styled.span`
  font-size: 1.2rem;
  transition: transform 0.3s ease;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const SquadContent = styled.div`
  padding: 0;
  max-height: ${props => props.$isOpen ? '2000px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: ${props => props.$isOpen ? '1' : '0'};
`;

const SquadForm = styled.div`
  padding: 1.5rem;
  background: white;
  border-top: 1px solid #e9ecef;
`;

const ModifiedBadge = styled.span`
  background: #28a745;
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FieldLabel = styled.label`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const FieldInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
`;

const FieldTextarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
`;

const FieldSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
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
  font-size: 0.8rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const PlayerSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
`;

const PlayerList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const PlayerCard = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  
  ${props => props.$isModified && `
    border-color: #28a745;
    background: #d4edda;
  `}
  
  ${props => props.$isRemoved && `
    border-color: #dc3545;
    background: #f8d7da;
    opacity: 0.6;
  `}
`;

const PlayerName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const PlayerInfo = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
`;

const RequestSquadreModification = () => {
  const { legaId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [lega, setLega] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [giocatori, setGiocatori] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modifications, setModifications] = useState({
    squadreModifiche: {},
    addedPlayers: {},
    removedPlayers: {}
  });
  const [openSquad, setOpenSquad] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Verifica i permessi del subadmin
        const subadminRes = await api.get(`/subadmin/check/${legaId}`, token);
        const subadminData = subadminRes.data;
        
        if (!subadminData.isSubadmin) {
          setError('Non hai i permessi per modificare questa lega');
          setLoading(false);
          return;
        }
        
        setPermissions(subadminData.permissions || {});

        // Carica i dati della lega
        const [legaRes, squadreRes, giocatoriRes] = await Promise.all([
          getLegaById(legaId, token),
          getSquadreByLega(legaId, token),
          getGiocatoriByLega(legaId, token)
        ]);
        
        setLega(legaRes.lega);
        setSquadre(squadreRes.squadre || []);
        setGiocatori(giocatoriRes.giocatori || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token && legaId) fetchData();
  }, [token, legaId]);

  const handleSquadModification = (squadraId, field, value) => {
    setModifications(prev => ({
      ...prev,
      squadreModifiche: {
        ...prev.squadreModifiche,
        [squadraId]: {
          ...prev.squadreModifiche[squadraId],
          [field]: value
        }
      }
    }));
  };

  const handleAddPlayer = (squadraId, giocatoreId) => {
    setModifications(prev => ({
      ...prev,
      addedPlayers: {
        ...prev.addedPlayers,
        [squadraId]: [...(prev.addedPlayers[squadraId] || []), giocatoreId]
      }
    }));
  };

  const handleRemovePlayer = (squadraId, giocatoreId) => {
    setModifications(prev => ({
      ...prev,
      removedPlayers: {
        ...prev.removedPlayers,
        [squadraId]: [...(prev.removedPlayers[squadraId] || []), giocatoreId]
      }
    }));
  };

  const isSquadModified = (squadraId) => {
    return modifications.squadreModifiche[squadraId] && Object.keys(modifications.squadreModifiche[squadraId]).length > 0;
  };

  const isPlayerModified = (squadraId, giocatoreId) => {
    const added = modifications.addedPlayers[squadraId] || [];
    const removed = modifications.removedPlayers[squadraId] || [];
    return added.includes(giocatoreId) || removed.includes(giocatoreId);
  };

  const isPlayerRemoved = (squadraId, giocatoreId) => {
    const removed = modifications.removedPlayers[squadraId] || [];
    return removed.includes(giocatoreId);
  };

  const getModifiedValue = (squadraId, field, originalValue) => {
    return modifications.squadreModifiche[squadraId]?.[field] !== undefined 
      ? modifications.squadreModifiche[squadraId][field] 
      : originalValue;
  };

  const handleSquadToggle = (squadraId) => {
    setOpenSquad(openSquad === squadraId ? null : squadraId);
  };

  const getAvailablePlayers = (squadraId) => {
    const squadra = squadre.find(s => s.id === squadraId);
    const currentPlayers = squadra?.giocatori || [];
    const addedPlayers = modifications.addedPlayers[squadraId] || [];
    const removedPlayers = modifications.removedPlayers[squadraId] || [];
    
    return giocatori.filter(g => 
      !currentPlayers.some(p => p.id === g.id) && 
      !addedPlayers.includes(g.id) &&
      !removedPlayers.includes(g.id)
    );
  };

  const handleSubmitRequest = async () => {
    try {
      const requestData = {
        legaId: parseInt(legaId),
        tipo: 'modifica_squadre',
        modifiche: modifications,
        descrizione: `Richiesta modifica squadre per la lega ${lega.nome}`,
        dettagli: {
          squadreModificate: Object.keys(modifications.squadreModifiche).length,
          giocatoriAggiunti: Object.values(modifications.addedPlayers).flat().length,
          giocatoriRimossi: Object.values(modifications.removedPlayers).flat().length
        }
      };

      await createPendingChange(requestData, token);
      alert('Richiesta inviata con successo! L\'amministratore della lega esaminerà le tue modifiche.');
      navigate(`/subadmin-area`);
    } catch (err) {
      alert('Errore nell\'invio della richiesta: ' + err.message);
    }
  };

  const hasModifications = () => {
    return Object.keys(modifications.squadreModifiche).length > 0 || 
           Object.keys(modifications.addedPlayers).length > 0 || 
           Object.keys(modifications.removedPlayers).length > 0;
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento dati squadre...</LoadingContainer>
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
        <Title>Richiesta Modifica Squadre</Title>
        <Subtitle>Lega: {lega?.nome}</Subtitle>
      </Header>

      <RequestModeBanner>
        🔄 Modalità Richiesta - Le modifiche verranno inviate all'amministratore della lega per approvazione
      </RequestModeBanner>

      <Section>
        <SectionTitle>🏆 Gestione Squadre</SectionTitle>
        
        {squadre.map(squadra => {
          const isOpen = openSquad === squadra.id;
          const giocatoriCount = squadra.giocatori?.length || 0;
          
          return (
            <SquadCard key={squadra.id} $isModified={isSquadModified(squadra.id)}>
              <SquadHeader 
                $isOpen={isOpen}
                onClick={() => handleSquadToggle(squadra.id)}
              >
                <SquadName>
                  {isSquadModified(squadra.id) && <span style={{ color: '#28a745' }}>●</span>}
                  {squadra.nome}
                </SquadName>
                <SquadInfo>
                  <SquadStats>
                    {giocatoriCount} giocatori • Level {squadra.club_level || 1}
                  </SquadStats>
                  {isSquadModified(squadra.id) && <ModifiedBadge>Modificata</ModifiedBadge>}
                  <ExpandIcon $isOpen={isOpen}>▼</ExpandIcon>
                </SquadInfo>
              </SquadHeader>
              
              <SquadContent $isOpen={isOpen}>
                <SquadForm>
                  <FormGrid>
                    <FieldGroup>
                      <FieldLabel>Nome Squadra</FieldLabel>
                      <FieldInput
                        type="text"
                        value={getModifiedValue(squadra.id, 'nome', squadra.nome)}
                        onChange={(e) => handleSquadModification(squadra.id, 'nome', e.target.value)}
                      />
                    </FieldGroup>
                    
                    <FieldGroup>
                      <FieldLabel>Immagine URL</FieldLabel>
                      <FieldInput
                        type="text"
                        value={getModifiedValue(squadra.id, 'immagine', squadra.immagine || '')}
                        onChange={(e) => handleSquadModification(squadra.id, 'immagine', e.target.value)}
                        placeholder="https://esempio.com/immagine.jpg"
                      />
                    </FieldGroup>
                    
                    <FieldGroup>
                      <FieldLabel>Casse Societarie</FieldLabel>
                      <FieldInput
                        type="number"
                        value={getModifiedValue(squadra.id, 'casse_societarie', squadra.casse_societarie || 0)}
                        onChange={(e) => handleSquadModification(squadra.id, 'casse_societarie', parseInt(e.target.value))}
                      />
                    </FieldGroup>
                    
                    <FieldGroup>
                      <FieldLabel>Club Level</FieldLabel>
                      <FieldSelect
                        value={getModifiedValue(squadra.id, 'club_level', squadra.club_level || 1)}
                        onChange={(e) => handleSquadModification(squadra.id, 'club_level', parseInt(e.target.value))}
                      >
                        <option value={1}>Level 1</option>
                        <option value={2}>Level 2</option>
                        <option value={3}>Level 3</option>
                        <option value={4}>Level 4</option>
                        <option value={5}>Level 5</option>
                      </FieldSelect>
                    </FieldGroup>
                    
                    <FieldGroup>
                      <FieldLabel>Proprietario</FieldLabel>
                      <FieldInput
                        type="text"
                        value={getModifiedValue(squadra.id, 'proprietario', squadra.proprietario || '')}
                        onChange={(e) => handleSquadModification(squadra.id, 'proprietario', e.target.value)}
                      />
                    </FieldGroup>
                    
                    <FieldGroup>
                      <FieldLabel>Note</FieldLabel>
                      <FieldTextarea
                        value={getModifiedValue(squadra.id, 'note', squadra.note || '')}
                        onChange={(e) => handleSquadModification(squadra.id, 'note', e.target.value)}
                        placeholder="Note aggiuntive sulla squadra..."
                      />
                    </FieldGroup>
                  </FormGrid>
                  
                  <div>
                    <ActionButton 
                      className="secondary"
                      onClick={() => {
                        setModifications(prev => {
                          const newMods = { ...prev };
                          delete newMods.squadreModifiche[squadra.id];
                          return newMods;
                        });
                      }}
                      disabled={!isSquadModified(squadra.id)}
                    >
                      Annulla Modifiche Squadra
                    </ActionButton>
                  </div>

                  {/* Sezione Giocatori - solo se il subadmin ha il permesso gestione_giocatori */}
                  {permissions.gestione_giocatori && (
                    <PlayerSection>
                      <h4>👥 Gestione Giocatori</h4>
                      
                      <div>
                        <h5>Giocatori Attuali:</h5>
                        <PlayerList>
                          {squadra.giocatori?.map(giocatore => (
                            <PlayerCard 
                              key={giocatore.id}
                              $isModified={isPlayerModified(squadra.id, giocatore.id)}
                              $isRemoved={isPlayerRemoved(squadra.id, giocatore.id)}
                            >
                              <PlayerName>{giocatore.nome} {giocatore.cognome}</PlayerName>
                              <PlayerInfo>Ruolo: {giocatore.ruolo}</PlayerInfo>
                              <PlayerInfo>Valore: {giocatore.valore}</PlayerInfo>
                              {!isPlayerRemoved(squadra.id, giocatore.id) && (
                                <ActionButton 
                                  className="danger"
                                  onClick={() => handleRemovePlayer(squadra.id, giocatore.id)}
                                >
                                  Rimuovi
                                </ActionButton>
                              )}
                              {isPlayerRemoved(squadra.id, giocatore.id) && (
                                <ActionButton 
                                  className="success"
                                  onClick={() => {
                                    setModifications(prev => ({
                                      ...prev,
                                      removedPlayers: {
                                        ...prev.removedPlayers,
                                        [squadra.id]: prev.removedPlayers[squadra.id].filter(id => id !== giocatore.id)
                                      }
                                    }));
                                  }}
                                >
                                  Ripristina
                                </ActionButton>
                              )}
                            </PlayerCard>
                          ))}
                        </PlayerList>
                      </div>

                      <div style={{ marginTop: '2rem' }}>
                        <h5>Giocatori Disponibili:</h5>
                        <PlayerList>
                          {getAvailablePlayers(squadra.id).map(giocatore => (
                            <PlayerCard key={giocatore.id}>
                              <PlayerName>{giocatore.nome} {giocatore.cognome}</PlayerName>
                              <PlayerInfo>Ruolo: {giocatore.ruolo}</PlayerInfo>
                              <PlayerInfo>Valore: {giocatore.valore}</PlayerInfo>
                              <ActionButton 
                                className="success"
                                onClick={() => handleAddPlayer(squadra.id, giocatore.id)}
                              >
                                Aggiungi
                              </ActionButton>
                            </PlayerCard>
                          ))}
                        </PlayerList>
                      </div>
                    </PlayerSection>
                  )}
                </SquadForm>
              </SquadContent>
            </SquadCard>
          );
        })}
      </Section>

      <Section>
        <SectionTitle>📋 Riepilogo Modifiche</SectionTitle>
        <div>
          <p><strong>Squadre modificate:</strong> {Object.keys(modifications.squadreModifiche).length}</p>
          {permissions.gestione_giocatori && (
            <>
              <p><strong>Giocatori da aggiungere:</strong> {Object.values(modifications.addedPlayers).flat().length}</p>
              <p><strong>Giocatori da rimuovere:</strong> {Object.values(modifications.removedPlayers).flat().length}</p>
            </>
          )}
        </div>
      </Section>

      <div style={{ textAlign: 'center' }}>
        <SubmitButton 
          onClick={handleSubmitRequest}
          disabled={!hasModifications()}
        >
          {hasModifications() ? '📤 Invia Richiesta Modifiche' : 'Nessuna modifica da inviare'}
        </SubmitButton>
      </div>
    </Container>
  );
};

export default RequestSquadreModification; 