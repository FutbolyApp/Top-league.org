import React from 'react';
import styled from 'styled-components';
import { useAuth } from './AuthContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  color: #dc2626;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const Message = styled.p`
  color: #374151;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  }
  
  &.secondary {
    background: #6b7280;
    color: white;
    
    &:hover {
      background: #4b5563;
    }
  }
  
  &.danger {
    background: #dc2626;
    color: white;
    
    &:hover {
      background: #b91c1c;
    }
  }
`;

const ConnectionErrorModal = ({ isOpen, onClose, onRetry }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleRetry = () => {
    onRetry();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>📡 Errore di Connessione</Title>
        <Message>
          Impossibile raggiungere il server. Questo può succedere quando:
          <br />• Il backend non è attivo
          <br />• La connessione internet è instabile
          <br />• Il token di autenticazione è scaduto
        </Message>
        
        <ButtonGroup>
          <Button className="primary" onClick={handleRetry}>
            🔄 Riprova
          </Button>
          <Button className="secondary" onClick={onClose}>
            ❌ Chiudi
          </Button>
          <Button className="danger" onClick={handleLogout}>
            🚪 Logout
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ConnectionErrorModal; 