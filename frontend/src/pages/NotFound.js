import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const NotFoundContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 900;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
`;

const ErrorTitle = styled.h2`
  font-size: 2rem;
  color: #2d3748;
  margin: 1rem 0;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: #718096;
  margin: 1rem 0 2rem 0;
  line-height: 1.6;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  &:hover {
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  
  &:hover {
    background: #667eea;
    color: white;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
`;

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
`;

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <NotFoundContainer>
      <NotFoundContent>
        <Icon>🏈</Icon>
        <ErrorCode>404</ErrorCode>
        <ErrorTitle>Pagina non trovata</ErrorTitle>
        <ErrorMessage>
          Ops! La pagina che stai cercando non esiste o è stata spostata. 
          Potrebbe essere un errore di digitazione nell'URL o la pagina è stata rimossa.
        </ErrorMessage>
        
        <ActionButtons>
          <PrimaryButton onClick={handleGoHome}>
            Torna alla Home
          </PrimaryButton>
          <SecondaryButton onClick={handleGoBack}>
            Torna indietro
          </SecondaryButton>
        </ActionButtons>
        
        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#a0aec0' }}>
          Se pensi che questo sia un errore, contatta il supporto tecnico.
        </div>
      </NotFoundContent>
    </NotFoundContainer>
  );
};

export default NotFound; 