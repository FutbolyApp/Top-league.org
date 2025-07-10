import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getRichiestePendingByLega, gestisciRichiesta } from '../api/richiesteAdmin';
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

const RequestCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const RequestTitle = styled.h3`
  color: #2c3e50;
  margin: 0;
`;

const RequestMeta = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 15px;
`;

const RequestData = styled.div`
  background: #f8f9fa;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 15px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &.accept {
    background: #27ae60;
    color: white;
    
    &:hover {
      background: #229954;
    }
  }

  &.reject {
    background: #e74c3c;
    color: white;
    
    &:hover {
      background: #c0392b;
    }
  }

  &.revision {
    background: #f39c12;
    color: white;
    
    &:hover {
      background: #e67e22;
    }
  }
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
`;

const ModalTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 20px;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const GestioneRichiesteAdmin = () => {
  const { legaId } = useParams();
  const { token } = useAuth();
  const [richieste, setRichieste] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRichiesta, setSelectedRichiesta] = useState(null);
  const [modalAction, setModalAction] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (token && legaId) {
      loadRichieste();
    }
  }, [token, legaId]);

  const loadRichieste = async () => {
    try {
      setLoading(true);
      const response = await getRichiestePendingByLega(legaId, token);
      setRichieste(response.richieste || []);
    } catch (error) {
      console.error('Errore caricamento richieste:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (richiesta, action) => {
    setSelectedRichiesta(richiesta);
    setModalAction(action);
    setFormData({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRichiesta(null);
    setModalAction('');
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await gestisciRichiesta(
        selectedRichiesta.id,
        modalAction,
        formData.note_admin || '',
        formData.valore_costo || 0,
        token
      );
      
      closeModal();
      loadRichieste(); // Ricarica le richieste
    } catch (error) {
      console.error('Errore gestione richiesta:', error);
      alert('Errore nella gestione della richiesta');
    }
  };

  const getRequestTypeText = (type) => {
    switch (type) {
      case 'club_level':
        return 'Club Level';
      case 'trigger':
        return 'Trigger';
      case 'cantera':
        return 'Cantera';
      case 'cambio_nome':
        return 'Cambio Nome';
      case 'cambio_logo':
        return 'Cambio Logo';
      case 'generale':
        return 'Generale';
      default:
        return type;
    }
  };

  const renderRequestData = (richiesta) => {
    const dati = richiesta.dati_richiesta || {};
    
    switch (richiesta.tipo_richiesta) {
      case 'club_level':
        return (
          <div>
            <strong>Nuovo Club Level:</strong> {dati.nuovo_club_level}
          </div>
        );
      case 'trigger':
        return (
          <div>
            <strong>Trigger richiesto:</strong> {dati.trigger}
          </div>
        );
      case 'cantera':
        return (
          <div>
            <strong>Giocatori selezionati:</strong>
            <ul>
              {dati.giocatori_selezionati?.map(id => {
                const giocatore = richiesta.giocatori?.find(g => g.id === id);
                return (
                  <li key={id}>
                    {giocatore ? `${giocatore.nome} ${giocatore.cognome}` : `ID: ${id}`}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      case 'cambio_nome':
        return (
          <div>
            <strong>Nuovo nome:</strong> {dati.nuovo_nome}
          </div>
        );
      case 'cambio_logo':
        return (
          <div>
            <strong>Nuovo Logo:</strong>
            <div style={{ marginTop: '10px' }}>
              <img 
                src={`http://localhost:3001/uploads/${dati.logo_url}`} 
                alt="Nuovo logo" 
                style={{ 
                  maxWidth: '100px', 
                  maxHeight: '100px', 
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none', color: '#666', fontSize: '12px' }}>
                Immagine non disponibile: {dati.logo_url}
              </div>
            </div>
          </div>
        );
      case 'generale':
        return (
          <div>
            <strong>Messaggio:</strong> {dati.messaggio}
          </div>
        );
      default:
        return <div>Dati non disponibili</div>;
    }
  };

  const renderModal = () => {
    if (!modalOpen || !selectedRichiesta) return null;

    return (
      <Modal onClick={closeModal}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>
            {modalAction === 'accepted' && 'Accetta Richiesta'}
            {modalAction === 'rejected' && 'Rifiuta Richiesta'}
            {modalAction === 'revision' && 'Metti in Revisione'}
          </ModalTitle>

          <Form onSubmit={handleSubmit}>
            <div>
              <strong>Tipo:</strong> {getRequestTypeText(selectedRichiesta.tipo_richiesta)}
            </div>
            <div>
              <strong>Squadra:</strong> {selectedRichiesta.squadra_nome}
            </div>
            <div>
              <strong>Proprietario:</strong> {selectedRichiesta.proprietario_username}
            </div>
            <div>
              <strong>Data richiesta:</strong> {new Date(selectedRichiesta.data_creazione).toLocaleString()}
            </div>

            <RequestData>
              {renderRequestData(selectedRichiesta)}
            </RequestData>

            {(selectedRichiesta.tipo_richiesta === 'club_level' || selectedRichiesta.tipo_richiesta === 'trigger') && (
              <Input
                type="number"
                placeholder="Valore costo (FM)"
                value={formData.valore_costo || ''}
                onChange={(e) => setFormData({...formData, valore_costo: e.target.value})}
                required
              />
            )}

            <TextArea
              placeholder="Note (opzionale)"
              value={formData.note_admin || ''}
              onChange={(e) => setFormData({...formData, note_admin: e.target.value})}
            />

            <ButtonGroup>
              <Button type="button" onClick={closeModal}>
                Annulla
              </Button>
              <Button 
                type="submit"
                className={modalAction}
              >
                {modalAction === 'accepted' && 'Accetta'}
                {modalAction === 'rejected' && 'Rifiuta'}
                {modalAction === 'revision' && 'Metti in Revisione'}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    );
  };

  if (loading) {
    return (
      <Container>
        <Title>Gestione Richieste Admin</Title>
        <div>Caricamento...</div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Gestione Richieste Admin</Title>

      {richieste.length === 0 ? (
        <EmptyState>
          <h3>Nessuna richiesta in attesa</h3>
          <p>Non ci sono richieste pendenti per questa lega.</p>
        </EmptyState>
      ) : (
        richieste.map(richiesta => (
          <RequestCard key={richiesta.id}>
            <RequestHeader>
              <RequestTitle>
                {getRequestTypeText(richiesta.tipo_richiesta)} - {richiesta.squadra_nome}
              </RequestTitle>
              <RequestMeta>
                Richiesto da: {richiesta.proprietario_username} il {new Date(richiesta.data_creazione).toLocaleString()}
              </RequestMeta>
            </RequestHeader>

            <RequestData>
              {renderRequestData(richiesta)}
            </RequestData>

            <ActionButtons>
              <Button 
                className="accept"
                onClick={() => openModal(richiesta, 'accepted')}
              >
                ✅ Accetta
              </Button>
              <Button 
                className="revision"
                onClick={() => openModal(richiesta, 'revision')}
              >
                🔄 Revisione
              </Button>
              <Button 
                className="reject"
                onClick={() => openModal(richiesta, 'rejected')}
              >
                ❌ Rifiuta
              </Button>
            </ActionButtons>
          </RequestCard>
        ))
      )}

      {renderModal()}
    </Container>
  );
};

export default GestioneRichiesteAdmin; 