import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #1d1d1f;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #86868b;
  font-size: 1.1rem;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  color: #1d1d1f;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RequestCard = styled.div`
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #f8f9fa;
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const RequestInfo = styled.div`
  flex: 1;
`;

const RequestTitle = styled.h3`
  color: #1d1d1f;
  margin-bottom: 0.5rem;
`;

const RequestDetails = styled.div`
  color: #86868b;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const RequestActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &.success {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #218838;
    }
  }
  
  &.danger {
    background: #dc3545;
    color: white;
    
    &:hover {
      background: #c82333;
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const SubadminRequestsPage = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/leghe/richieste/subadmin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel caricamento delle richieste');
      }
      
      const data = await response.json();
      setRequests(data.richieste || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, response, message = '') => {
    try {
      const res = await fetch(`http://localhost:3001/api/leghe/richieste/${requestId}/rispondi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          risposta: response,
          messaggio: message
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Errore nella risposta');
      }

      alert(`Richiesta ${response === 'accetta' ? 'accettata' : 'rifiutata'} con successo!`);
      
      // Ricarica le richieste
      fetchRequests();
    } catch (err) {
      alert(`Errore: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('it-IT');
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>Caricamento richieste...</LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Gestione Richieste</Title>
          <Subtitle>Errore: {error}</Subtitle>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Gestione Richieste</Title>
        <Subtitle>Gestisci le richieste di ingresso nelle tue leghe</Subtitle>
      </Header>

      <Section>
        <SectionTitle>
          📋 Richieste in Attesa ({requests.length})
        </SectionTitle>
        
        {requests.length > 0 ? (
          requests.map(request => (
            <RequestCard key={request.id}>
              <RequestHeader>
                <RequestInfo>
                  <RequestTitle>
                    Richiesta di ingresso - {request.lega_nome}
                  </RequestTitle>
                  <RequestDetails>
                    <strong>Utente:</strong> {request.utente_nome} ({request.utente_email})<br/>
                    <strong>Squadra:</strong> {request.squadra_nome}<br/>
                    <strong>Data richiesta:</strong> {formatDate(request.data_richiesta)}<br/>
                    {request.messaggio_richiesta && (
                      <><strong>Messaggio:</strong> {request.messaggio_richiesta}<br/></>
                    )}
                  </RequestDetails>
                </RequestInfo>
                <RequestActions>
                  <Button 
                    className="success"
                    onClick={() => handleResponse(request.id, 'accetta')}
                  >
                    Accetta
                  </Button>
                  <Button 
                    className="danger"
                    onClick={() => {
                      const message = prompt('Inserisci un messaggio per il rifiuto (opzionale):');
                      handleResponse(request.id, 'rifiuta', message);
                    }}
                  >
                    Rifiuta
                  </Button>
                </RequestActions>
              </RequestHeader>
            </RequestCard>
          ))
        ) : (
          <EmptyContainer>Nessuna richiesta in attesa</EmptyContainer>
        )}
      </Section>
    </Container>
  );
};

export default SubadminRequestsPage; 