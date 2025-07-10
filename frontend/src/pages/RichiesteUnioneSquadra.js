import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRichiesteUnioneSquadra, rispondiRichiestaUnioneSquadra } from '../api/squadre';
import { useAuth } from '../components/AuthContext';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #333;
  margin: 0;
`;

const BackButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #5a6268;
  }
`;

const RichiesteGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const RichiestaCard = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const RichiestaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const RichiestaInfo = styled.div`
  flex: 1;
`;

const RichiestaTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #333;
`;

const RichiestaMeta = styled.div`
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const RichiestaStato = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  ${props => {
    switch (props.stato) {
      case 'in_attesa': return 'background: #fff3cd; color: #856404;';
      case 'accettata': return 'background: #d4edda; color: #155724;';
      case 'rifiutata': return 'background: #f8d7da; color: #721c24;';
      default: return 'background: #e2e3e5; color: #383d41;';
    }
  }}
`;

const RichiestaMessaggio = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  font-style: italic;
  color: #495057;
`;

const RichiestaActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  
  ${props => {
    if (props.$variant === 'accept') {
      return `
        background: #28a745;
        color: white;
        &:hover { background: #218838; }
      `;
    } else if (props.$variant === 'reject') {
      return `
        background: #dc3545;
        color: white;
        &:hover { background: #c82333; }
      `;
    } else {
      return `
        background: #6c757d;
        color: white;
        &:hover { background: #5a6268; }
      `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

const ErrorContainer = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
`;

const RichiesteUnioneSquadra = () => {
  const { legaId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [richieste, setRichieste] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    fetchRichieste();
  }, [legaId]);

  const fetchRichieste = async () => {
    try {
      setLoading(true);
      const response = await getRichiesteUnioneSquadra(legaId, token);
      setRichieste(response.richieste || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRisposta = async (richiestaId, risposta) => {
    try {
      setResponding(richiestaId);
      await rispondiRichiestaUnioneSquadra(richiestaId, risposta, '', token);
      await fetchRichieste();
    } catch (err) {
      setError(err.message);
    } finally {
      setResponding(null);
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

  return (
    <Container>
      <Header>
        <Title>Richieste di Unione Squadra</Title>
        <BackButton onClick={() => navigate(-1)}>
          ← Torna indietro
        </BackButton>
      </Header>

      {error && (
        <ErrorContainer>
          Errore: {error}
        </ErrorContainer>
      )}

      {richieste.length === 0 ? (
        <EmptyState>
          <h3>Nessuna richiesta di unione squadra</h3>
          <p>Non ci sono richieste in attesa di risposta.</p>
        </EmptyState>
      ) : (
        <RichiesteGrid>
          {richieste.map(richiesta => (
            <RichiestaCard key={richiesta.id}>
              <RichiestaHeader>
                <RichiestaInfo>
                  <RichiestaTitle>
                    Richiesta di {richiesta.utente_username || richiesta.utente_nome}
                  </RichiestaTitle>
                  <RichiestaMeta>
                    <strong>Squadra:</strong> {richiesta.squadra_nome} | 
                    <strong> Lega:</strong> {richiesta.lega_nome} | 
                    <strong> Data:</strong> {formatDate(richiesta.data_richiesta)}
                  </RichiestaMeta>
                  <RichiestaStato stato={richiesta.stato}>
                    {richiesta.stato === 'in_attesa' && 'In attesa'}
                    {richiesta.stato === 'accettata' && 'Accettata'}
                    {richiesta.stato === 'rifiutata' && 'Rifiutata'}
                  </RichiestaStato>
                </RichiestaInfo>
              </RichiestaHeader>

              {richiesta.messaggio_richiesta && (
                <RichiestaMessaggio>
                  <strong>Messaggio:</strong> {richiesta.messaggio_richiesta}
                </RichiestaMessaggio>
              )}

              {richiesta.messaggio_risposta && (
                <RichiestaMessaggio>
                  <strong>Risposta:</strong> {richiesta.messaggio_risposta}
                </RichiestaMessaggio>
              )}

              {richiesta.stato === 'in_attesa' && (
                <RichiestaActions>
                  <ActionButton
                    $variant="accept"
                    onClick={() => handleRisposta(richiesta.id, 'accetta')}
                    disabled={responding === richiesta.id}
                  >
                    {responding === richiesta.id ? 'Accettazione...' : 'Accetta'}
                  </ActionButton>
                  <ActionButton
                    $variant="reject"
                    onClick={() => handleRisposta(richiesta.id, 'rifiuta')}
                    disabled={responding === richiesta.id}
                  >
                    {responding === richiesta.id ? 'Rifiuto...' : 'Rifiuta'}
                  </ActionButton>
                </RichiestaActions>
              )}
            </RichiestaCard>
          ))}
        </RichiesteGrid>
      )}
    </Container>
  );
};

export default RichiesteUnioneSquadra; 