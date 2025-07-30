import React from 'react';
import styled from 'styled-components';

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  min-height: ${props => props.fullHeight ? '100vh' : '200px'};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-left: 1rem;
  color: #6c757d;
  font-size: 1rem;
`;

const LoadingSpinner = ({ message = 'Caricamento...', fullHeight = false }) => {
  return (
    <SpinnerContainer fullHeight={fullHeight}>
      <Spinner />
      <LoadingText>{message}</LoadingText>
    </SpinnerContainer>
  );
};

export default LoadingSpinner; 