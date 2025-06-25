import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getSquadreDisponibili } from '../api/leghe';
import { assignTeamToUser } from '../api/squadre';
import { useAuth } from './AuthContext';

const ModalOverlay = styled.div`
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
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #333;
  font-size: 1.5rem;
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

const ModalBody = styled.div`
  margin-bottom: 1.5rem;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const TeamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const TeamOption = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 2px solid ${props => props.$selected ? '#007AFF' : '#eee'};
  border-radius: 8px;
  background: ${props => props.$selected ? '#f0f8ff' : 'white'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #007AFF;
    background: #f0f8ff;
  }
`;

const TeamName = styled.span`
  font-weight: 600;
  color: #333;
`;

const TeamStatus = styled.span`
  font-size: 0.8rem;
  color: #666;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #6c757d;
  color: white;
  
  &:hover:not(:disabled) {
    background: #5a6268;
  }
`;

const SelectButton = styled(Button)`
  background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);
  color: white;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
`;

const LoadingMessage = styled.div`
  color: #666;
  text-align: center;
  padding: 2rem;
`;

const AdminTeamSelector = ({ lega, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [squadre, setSquadre] = useState([]);
  const [selectedSquadra, setSelectedSquadra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSquadreDisponibili = async () => {
      try {
        setLoading(true);
        const response = await getSquadreDisponibili(lega.id, token);
        setSquadre(response.squadre_disponibili || []);
      } catch (err) {
        setError('Errore nel caricamento delle squadre disponibili');
        console.error('Errore nel caricamento squadre:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSquadreDisponibili();
  }, [lega.id, token]);

  const handleSelectTeam = async () => {
    if (!selectedSquadra) return;

    try {
      setSubmitting(true);
      setError('');
      
      await assignTeamToUser(selectedSquadra.id, token);
      
      onSuccess(`Squadra "${selectedSquadra.nome}" assegnata con successo!`);
      
      // Chiudi il popup dopo l'assegnazione
      onClose();
    } catch (err) {
      setError('Errore nell\'assegnazione della squadra: ' + (err.message || 'Errore sconosciuto'));
      console.error('Errore assegnazione squadra:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ModalOverlay>
        <ModalContent>
          <LoadingMessage>Caricamento squadre disponibili...</LoadingMessage>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Seleziona Squadra - {lega.nome}</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <ModalBody>
          <Description>
            Come amministratore di questa lega, puoi scegliere direttamente una squadra disponibile senza inviare richieste.
          </Description>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {squadre.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              Nessuna squadra disponibile in questa lega.
            </div>
          ) : (
            <TeamList>
              {squadre.map(squadra => (
                <TeamOption
                  key={squadra.id}
                  $selected={selectedSquadra?.id === squadra.id}
                  onClick={() => setSelectedSquadra(squadra)}
                >
                  <TeamName>{squadra.nome}</TeamName>
                  <TeamStatus>Disponibile</TeamStatus>
                </TeamOption>
              ))}
            </TeamList>
          )}
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose} disabled={submitting}>
            Annulla
          </CancelButton>
          <SelectButton 
            onClick={handleSelectTeam} 
            disabled={!selectedSquadra || submitting}
          >
            {submitting ? 'Assegnazione...' : 'Assegna Squadra'}
          </SelectButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AdminTeamSelector; 