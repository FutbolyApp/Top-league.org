import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  margin: 1rem;
  color: #721c24;
`;

const ErrorIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const ErrorText = styled.p`
  margin: 0 0 1rem 0;
  text-align: center;
  line-height: 1.4;
`;

const RetryButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background-color: #c82333;
  }
`;

const ErrorMessage = ({ 
  title = 'Errore', 
  message = 'Si è verificato un errore imprevisto.', 
  onRetry = null,
  showRetry = true 
}) => {
  return (
    <ErrorContainer>
      <ErrorIcon>⚠️</ErrorIcon>
      <ErrorTitle>{title}</ErrorTitle>
      <ErrorText>{message}</ErrorText>
      {showRetry && onRetry && (
        <RetryButton onClick={onRetry}>
          Riprova
        </RetryButton>
      )}
    </ErrorContainer>
  );
};

export default ErrorMessage; 