import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getSquadreByUtente } from '../api/squadre';
import { getGiocatoriBySquadra } from '../api/giocatori';
import { createRichiestaAdmin, getRichiesteBySquadra } from '../api/richiesteAdmin';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 30px;
  text-align: center;
`;

const RequestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const RequestCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const RequestTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 10px;
`;

const RequestDescription = styled.p`
  color: #666;
  font-size: 14px;
  line-height: 1.5;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 10px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &.primary {
    background: #3498db;
    color: white;
    
    &:hover {
      background: #2980b9;
    }
  }

  &.secondary {
    background: #95a5a6;
    color: white;
    
    &:hover {
      background: #7f8c8d;
    }
  }

  &.danger {
    background: #e74c3c;
    color: white;
    
    &:hover {
      background: #c0392b;
    }
  }
`;

const PlayerSelector = styled.div`
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
`;

const PlayerItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const RemoveButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
`;

const AddButton = styled.button`
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 15px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 10px;
`;

const HistorySection = styled.div`
  margin-top: 40px;
`;

const HistoryTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 20px;
`;

const HistoryItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  
  &.pending {
    background: #f39c12;
    color: white;
  }
  
  &.accepted {
    background: #27ae60;
    color: white;
  }
  
  &.rejected {
    background: #e74c3c;
    color: white;
  }
  
  &.revision {
    background: #9b59b6;
    color: white;
  }
`;

const RichiestaAdmin = () => {
  const { token, user } = useAuth();
  const [squadre, setSquadre] = useState([]);
  const [selectedSquadra, setSelectedSquadra] = useState(null);
  const [giocatori, setGiocatori] = useState([]);
  const [richieste, setRichieste] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadSquadre();
    }
  }, [token]);

  const loadSquadre = async () => {
    try {
      const response = await getSquadreByUtente(token);
      setSquadre(response.squadre || []);
      if (response.squadre && response.squadre?.length || 0 > 0) {
        setSelectedSquadra(response.squadre[0]);
        loadGiocatori(response.squadre[0].id);
        loadRichieste(response.squadre[0].id);
      }
    } catch (error) {
      console.error('Errore caricamento squadre:', error);
    }
  };

  const loadGiocatori = async (squadra_id) => {
    try {
      const response = await getGiocatoriBySquadra(squadra_id, token);
      setGiocatori(response.giocatori || []);
    } catch (error) {
      console.error('Errore caricamento giocatori:', error);
    }
  };

  const loadRichieste = async (squadra_id) => {
    try {
      const response = await getRichiesteBySquadra(squadra_id, token);
      setRichieste(response.richieste || []);
    } catch (error) {
      console.error('Errore caricamento richieste:', error);
    }
  };

  const handleSquadraChange = (squadra) => {
    setSelectedSquadra(squadra);
    loadGiocatori(squadra.id);
    loadRichieste(squadra.id);
  };

  const openModal = (type) => {
    setModalType(type);
    setFormData({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dati_richiesta = {};

      switch (modalType) {
        case 'club_level':
          dati_richiesta.nuovo_club_level = parseInt(formData.nuovo_club_level);
          break;
        case 'trigger':
          dati_richiesta.trigger = formData.trigger;
          break;
        case 'cantera':
          dati_richiesta.giocatori_selezionati = formData.giocatori_selezionati || [];
          dati_richiesta.costi_dimezzati = {};
          dati_richiesta.dettagli_giocatori = {};
          formData?.giocatori_selezionati?.forEach(giocatore_id => {
            const giocatore = giocatori.find(gioc => gioc.id === giocatore_id);
            if (giocatore) {
              dati_richiesta.costi_dimezzati[giocatore_id] = Math.floor(giocatore.costo_attuale / 2);
              dati_richiesta.dettagli_giocatori[giocatore_id] = {
                nome: giocatore?.nome || 'Nome',
                cognome: giocatore?.cognome || '',
                ruolo: giocatore?.ruolo || 'Ruolo',
                squadra_reale: giocatore.squadra_reale,
                qi: giocatore.qi,
                qa: giocatore?.qa || 0 || giocatore.quotazione_attuale,
                costo_attuale: giocatore.costo_attuale,
                costo_dimezzato: Math.floor(giocatore.costo_attuale / 2)
              };
            }
          });
          break;
        case 'cambio_nome':
          dati_richiesta.nuovo_nome = formData.nuovo_nome;
          break;
        case 'cambio_logo':
          dati_richiesta.logo_url = formData.logo_url;
          break;
        case 'generale':
          dati_richiesta.messaggio = formData.messaggio;
          break;
        default:
          // Gestione caso di default
          break;
      }

      await createRichiestaAdmin(selectedSquadra.id, modalType, dati_richiesta, token);
      closeModal();
      loadRichieste(selectedSquadra.id);
    } catch (error) {
      console.error('Errore invio richiesta:', error);
      alert('Errore nell\'invio della richiesta');
    } finally {
      setLoading(false);
    }
  };

  const getRequestDescription = (type) => {
    switch (type) {
      case 'club_level':
        return 'Richiedi un aumento del Club Level della tua squadra';
      case 'trigger':
        return 'Richiedi l\'attivazione di un trigger specifico';
      case 'cantera':
        return 'Richiedi l\'attivazione della cantera per i tuoi giocatori';
      case 'cambio_nome':
        return 'Richiedi un cambio nome per la tua squadra';
      case 'cambio_logo':
        return 'Richiedi un cambio logo per la tua squadra';
      case 'generale':
        return 'Invia una richiesta generale all\'admin';
      default:
        return '';
    }
  };

  const getStatusText = (stato) => {
    switch (stato) {
      case 'pending':
        return 'In attesa';
      case 'accepted':
        return 'Accettata';
      case 'rejected':
        return 'Rifiutata';
      case 'revision':
        return 'In revisione';
      default:
        return stato;
    }
  };

  const getRequestDetails = (richiesta) => {
    try {
      // The backend already parses the dati_richiesta, so we don't need to parse it again
      const dati = richiesta.dati_richiesta || {};
      
      switch (richiesta.tipo_richiesta) {
        case 'cantera':
          if (dati.giocatori_selezionati && (dati.giocatori_selezionati?.length || 0) > 0) {
            const nomiGiocatori = dati.giocatori_selezionati?.map(id => {
              const giocatore = giocatori.find(gioc => gioc.id === id);
              return giocatore ? `${giocatore?.nome || 'Nome'} ${giocatore?.cognome || ''}` : `ID: ${id}`;
            }).join(', ');
            return `Richiesta Cantera per: ${nomiGiocatori}`;
          }
          return 'Richiesta Cantera';
          
        case 'cambio_nome':
          if (dati.nuovo_nome) {
            return `Richiesta cambio nome: ${dati.nuovo_nome}`;
          }
          return 'Richiesta cambio nome';
          
        case 'cambio_logo':
          if (dati.logo_url) {
            return `Richiesta cambio logo: ${dati.logo_url}`;
          }
          return 'Richiesta cambio logo';
          
        case 'club_level':
          if (dati.nuovo_club_level) {
            return `Richiesta Club Level: ${dati.nuovo_club_level}`;
          }
          return 'Richiesta Club Level';
          
        case 'trigger':
          if (dati.trigger) {
            return `Richiesta Trigger: ${dati.trigger.substring(0, 50)}${(dati.trigger?.length || 0) > 50 ? '...' : ''}`;
          }
          return 'Richiesta Trigger';
          
        case 'generale':
          if (dati.messaggio) {
            return `Richiesta Generale: ${dati.messaggio.substring(0, 50)}${(dati.messaggio?.length || 0) > 50 ? '...' : ''}`;
          }
          return 'Richiesta Generale';
          
        default:
          return richiesta?.tipo_richiesta?.replace('_', ' ').toUpperCase();
      }
    } catch (error) {
      return richiesta?.tipo_richiesta?.replace('_', ' ').toUpperCase();
    }
  };

  const handleAnnullaRichiesta = async (richiesta_id) => {
    try {
      // Chiama l'endpoint specifico per annullare la richiesta
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/richieste-admin/${richiesta_id}/annulla`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Ricarica le richieste per aggiornare lo stato
        loadRichieste(selectedSquadra.id);
      } else {
        alert('Errore nell\'annullamento della richiesta');
      }
    } catch (error) {
      console.error('Errore annullamento richiesta:', error);
      alert('Errore nell\'annullamento della richiesta');
    }
  };

  const renderModal = () => {
    if (!modalOpen) return null;

    return (
      <Modal onClick={closeModal}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>
            {modalType === 'club_level' && 'Richiesta Club Level'}
            {modalType === 'trigger' && 'Richiesta Trigger'}
            {modalType === 'cantera' && 'Richiesta Cantera'}
            {modalType === 'cambio_nome' && 'Richiesta Cambio Nome'}
            {modalType === 'cambio_logo' && 'Richiesta Cambio Logo'}
            {modalType === 'generale' && 'Richiesta Generale'}
          </ModalTitle>

          <Form onSubmit={handleSubmit}>
            {modalType === 'club_level' && (
              <>
                <div>
                  <label>Club Level Attuale: {selectedSquadra?.club_level || 0}</label>
                </div>
                <Input
                  type="number"
                  placeholder="Nuovo Club Level"
                  value={formData.nuovo_club_level || ''}
                  onChange={(e) => setFormData({...formData, nuovo_club_level: e.target.value})}
                  min={selectedSquadra?.club_level || 0}
                  required
                />
                <div style={{fontSize: '12px', color: '#666'}}>
                  <strong>Descrizione Club Level:</strong><br/>
                  I prezzi del Club Level devono essere configurati dall'admin.
                </div>
              </>
            )}

            {modalType === 'trigger' && (
              <TextArea
                placeholder="Descrivi il trigger che vuoi attivare..."
                value={formData.trigger || ''}
                onChange={(e) => setFormData({...formData, trigger: e.target.value})}
                required
              />
            )}

            {modalType === 'cantera' && (
              <div>
                <label>Seleziona i giocatori per la cantera:</label>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
                  <Select
                    value={formData.selectedPlayer || ''}
                    onChange={(e) => setFormData({...formData, selectedPlayer: e.target.value})}
                    style={{flex: 1}}
                  >
                    <option value="">Seleziona un giocatore</option>
                    {giocatori
                      .filter(g => !formData.giocatori_selezionati?.includes(g.id))
                      .map(giocatore => (
                        <option key={giocatore.id} value={giocatore.id}>
                          {giocatore?.nome || 'Nome'} {giocatore?.cognome || ''} - QA: {giocatore?.qa || 0}
                        </option>
                      ))}
                  </Select>
                  <Button 
                    type="button" 
                    className="primary" 
                    onClick={() => {
                      if (formData.selectedPlayer) {
                        const selectedIds = formData.giocatori_selezionati || [];
                        setFormData({
                          ...formData,
                          giocatori_selezionati: [...selectedIds, parseInt(formData.selectedPlayer)],
                          selectedPlayer: ''
                        });
                      }
                    }}
                    style={{padding: '8px 15px', fontSize: '12px'}}
                  >
                    Aggiungi
                  </Button>
                </div>
                
                {formData.giocatori_selezionati && (formData.giocatori_selezionati?.length || 0) > 0 && (
                  <div style={{marginTop: '15px'}}>
                    <label style={{fontWeight: 'bold', marginBottom: '10px', display: 'block'}}>
                      Giocatori selezionati:
                    </label>
                    {formData.giocatori_selezionati?.map((id, index) => {
                      const giocatore = giocatori.find(gioc => gioc.id === id);
                      return (
                        <PlayerItem key={index}>
                          <span style={{flex: 1}}>
                            {giocatore ? `${giocatore?.nome || 'Nome'} ${giocatore?.cognome || ''} - QA: ${giocatore?.qa || 0}` : `ID: ${id}`}
                          </span>
                          <RemoveButton onClick={() => {
                            const selected = formData.giocatori_selezionati || [];
                            setFormData({
                              ...formData,
                              giocatori_selezionati: selected?.filter(i => i !== id)
                            });
                          }}>Rimuovi</RemoveButton>
                        </PlayerItem>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {modalType === 'cambio_nome' && (
              <Input
                type="text"
                placeholder="Nuovo nome squadra"
                value={formData.nuovo_nome || ''}
                onChange={(e) => setFormData({...formData, nuovo_nome: e.target.value})}
                required
              />
            )}

            {modalType === 'cambio_logo' && (
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        // Crea un FormData per l'upload del file
                        const formData = new FormData();
                        formData.append('logo', file);
                        
                        // Upload del file
                        const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/upload/logo`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          },
                          body: formData
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          setFormData({...formData, logo_url: data.filename});
                        } else {
                          console.error('Errore upload logo');
                          alert('Errore nel caricamento del logo');
                        }
                      } catch (error) {
                        console.error('Errore upload logo:', error);
                        alert('Errore nel caricamento del logo');
                      }
                    }
                  }}
                  required
                />
                <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                  <strong>Note:</strong> Dimensioni massime 512x512px, formato PNG/JPG
                </div>
              </div>
            )}

            {modalType === 'generale' && (
              <TextArea
                placeholder="Descrivi la tua richiesta generale..."
                value={formData.messaggio || ''}
                onChange={(e) => setFormData({...formData, messaggio: e.target.value})}
                required
              />
            )}

            <ButtonGroup>
              <Button type="button" className="secondary" onClick={closeModal}>
                Annulla
              </Button>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? 'Invio...' : 'Invia Richiesta'}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    );
  };

  if (!selectedSquadra) {
    return (
      <Container>
        <Title>Richiesta Admin</Title>
        <p>Nessuna squadra disponibile</p>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Richiesta Admin</Title>

      <div style={{marginBottom: '20px'}}>
        <label>Squadra: </label>
        <Select
          value={selectedSquadra?.id || ''}
          onChange={(e) => {
            const squadra = squadre.find(s => s.id === parseInt(e.target.value));
            if (squadra) handleSquadraChange(squadra);
          }}
        >
          {squadre?.map(squadra => (
            <option key={squadra.id} value={squadra.id}>
              {squadra?.nome || 'Nome'}
            </option>
          ))}
        </Select>
      </div>

      <RequestGrid>
        <RequestCard onClick={() => openModal('club_level')}>
          <RequestTitle>Richiesta Club Level</RequestTitle>
          <RequestDescription>
            {getRequestDescription('club_level')}
          </RequestDescription>
        </RequestCard>

        <RequestCard onClick={() => openModal('trigger')}>
          <RequestTitle>Richiesta Trigger</RequestTitle>
          <RequestDescription>
            {getRequestDescription('trigger')}
          </RequestDescription>
        </RequestCard>

        <RequestCard onClick={() => openModal('cantera')}>
          <RequestTitle>Richiesta Cantera</RequestTitle>
          <RequestDescription>
            {getRequestDescription('cantera')}
          </RequestDescription>
        </RequestCard>

        <RequestCard onClick={() => openModal('cambio_nome')}>
          <RequestTitle>Richiesta Cambio Nome</RequestTitle>
          <RequestDescription>
            {getRequestDescription('cambio_nome')}
          </RequestDescription>
        </RequestCard>

        <RequestCard onClick={() => openModal('cambio_logo')}>
          <RequestTitle>Richiesta Cambio Logo</RequestTitle>
          <RequestDescription>
            {getRequestDescription('cambio_logo')}
          </RequestDescription>
        </RequestCard>

        <RequestCard onClick={() => openModal('generale')}>
          <RequestTitle>Richiesta Generale</RequestTitle>
          <RequestDescription>
            {getRequestDescription('generale')}
          </RequestDescription>
        </RequestCard>
      </RequestGrid>

      <HistorySection>
        <HistoryTitle>Storico Richieste</HistoryTitle>
                    {(richieste?.length || 0) === 0 ? (
          <p>Nessuna richiesta inviata</p>
        ) : (
          richieste?.map(richiesta => (
            <HistoryItem key={richiesta.id}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <strong>{getRequestDetails(richiesta)}</strong>
                  <br/>
                  <small>{new Date(richiesta.data_creazione).toLocaleString()}</small>
                </div>
                <StatusBadge className={richiesta.stato}>
                  {getStatusText(richiesta.stato)}
                </StatusBadge>
              </div>
              {richiesta.note_admin && (
                <div style={{marginTop: '10px', fontSize: '14px', color: '#666'}}>
                  <strong>Note admin:</strong> {richiesta.note_admin}
                </div>
              )}
              {richiesta.stato === 'pending' && (
                <Button type="button" className="danger" onClick={() => handleAnnullaRichiesta(richiesta.id)}>
                  Annulla Richiesta
                </Button>
              )}
            </HistoryItem>
          ))
        )}
      </HistorySection>

      {renderModal()}
    </Container>
  );
};

export default RichiestaAdmin; 