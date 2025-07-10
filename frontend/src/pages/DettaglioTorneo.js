import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getDettaglioTorneo } from '../api/tornei';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
`;

const Title = styled.h1`
  color: #333;
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
`;

const Button = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #5a6268;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
`;

const CardTitle = styled.h3`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: #333;
  font-weight: 600;
`;

const Badge = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'in_corso': return '#28a745';
      case 'programmato': return '#ffc107';
      case 'completato': return '#6c757d';
      default: return '#6c757d';
    }
  }};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  color: #333;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  margin: 3rem 0;
`;

const EmptyState = styled.div`
  text-align: center;
  margin: 3rem 0;
  color: #666;
`;

const DettaglioTorneo = () => {
  const { torneoId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [torneo, setTorneo] = useState(null);
  const [classifica, setClassifica] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTorneo();
  }, [torneoId]);

  const loadTorneo = async () => {
    try {
      setLoading(true);
      const response = await getDettaglioTorneo(torneoId, token);
      setTorneo(response.torneo);
      setClassifica(response.classifica || []);
      setCalendario(response.calendario || []);
    } catch (error) {
      console.error('Errore caricamento torneo:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Caricamento torneo...</LoadingMessage>
      </Container>
    );
  }

  if (!torneo) {
    return (
      <Container>
        <EmptyState>
          <h3>Torneo non trovato</h3>
          <p>Il torneo richiesto non esiste o non hai i permessi per visualizzarlo.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>{torneo.nome}</Title>
        <Button onClick={() => navigate(-1)}>
          Indietro
        </Button>
      </Header>

      <Grid>
        {/* Informazioni Torneo */}
        <Card>
          <CardTitle>
            Informazioni Torneo
            <Badge $status={torneo.stato}>
              {torneo.stato === 'in_corso' && 'In Corso'}
              {torneo.stato === 'programmato' && 'Programmato'}
              {torneo.stato === 'completato' && 'Completato'}
            </Badge>
          </CardTitle>
          
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Tipo</InfoLabel>
              <InfoValue>{torneo.tipo}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Formato</InfoLabel>
              <InfoValue>{torneo.formato}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Giornate Totali</InfoLabel>
              <InfoValue>{torneo.giornate_totali}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Data Inizio</InfoLabel>
              <InfoValue>{formatDate(torneo.data_inizio)}</InfoValue>
            </InfoItem>
          </InfoGrid>

          {torneo.descrizione && (
            <div style={{ marginBottom: '1rem' }}>
              <InfoLabel>Descrizione</InfoLabel>
              <div style={{ marginTop: '0.25rem', color: '#333', lineHeight: '1.5' }}>
                {torneo.descrizione}
              </div>
            </div>
          )}

          {torneo.informazioni_utente && (
            <div>
              <InfoLabel>Informazioni per gli Utenti</InfoLabel>
              <div style={{ marginTop: '0.25rem', color: '#333', lineHeight: '1.5', padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
                {torneo.informazioni_utente}
              </div>
            </div>
          )}
        </Card>

        {/* Squadre Partecipanti */}
        <Card>
          <CardTitle>
            Squadre Partecipanti
            <span style={{ 
              background: '#007bff', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '12px', 
              fontSize: '0.8rem' 
            }}>
              {torneo.squadre_partecipanti?.length || 0}
            </span>
          </CardTitle>
          
          {torneo.squadre_partecipanti && torneo.squadre_partecipanti.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Squadra</Th>
                  <Th>Proprietario</Th>
                </tr>
              </thead>
              <tbody>
                {torneo.squadre_partecipanti.map(squadra => (
                  <Tr key={squadra.id}>
                    <Td>
                      <strong>{squadra.nome}</strong>
                    </Td>
                    <Td>
                      {squadra.proprietario_username || 'N/A'}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState>
              <p>Nessuna squadra iscritta al torneo</p>
            </EmptyState>
          )}
        </Card>

        {/* Classifica */}
        <Card>
          <CardTitle>
            Classifica
            <span style={{ 
              background: '#28a745', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '12px', 
              fontSize: '0.8rem' 
            }}>
              {classifica.length}
            </span>
          </CardTitle>
          
          {classifica.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Pos</Th>
                  <Th>Squadra</Th>
                  <Th>Punti</Th>
                  <Th>GF</Th>
                  <Th>GS</Th>
                  <Th>DR</Th>
                </tr>
              </thead>
              <tbody>
                {classifica.map((squadra, index) => (
                  <Tr key={squadra.id}>
                    <Td>
                      <strong>{index + 1}</strong>
                    </Td>
                    <Td>
                      <strong>{squadra.nome}</strong>
                    </Td>
                    <Td>{squadra.punti_campionato}</Td>
                    <Td>{squadra.gol_fatti}</Td>
                    <Td>{squadra.gol_subiti}</Td>
                    <Td>{squadra.differenza_reti}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState>
              <p>Classifica non ancora disponibile</p>
            </EmptyState>
          )}
        </Card>

        {/* Calendario */}
        <Card>
          <CardTitle>
            Calendario
            <span style={{ 
              background: '#ffc107', 
              color: 'white', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '12px', 
              fontSize: '0.8rem' 
            }}>
              {calendario.length}
            </span>
          </CardTitle>
          
          {calendario.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Giornata</Th>
                  <Th>Casa</Th>
                  <Th>Risultato</Th>
                  <Th>Trasferta</Th>
                  <Th>Stato</Th>
                </tr>
              </thead>
              <tbody>
                {calendario.map(partita => (
                  <Tr key={partita.id}>
                    <Td>
                      <strong>{partita.giornata}</strong>
                    </Td>
                    <Td>{partita.squadra_casa_nome}</Td>
                    <Td>
                      {partita.gol_casa !== null && partita.gol_trasferta !== null 
                        ? `${partita.gol_casa} - ${partita.gol_trasferta}`
                        : 'vs'
                      }
                    </Td>
                    <Td>{partita.squadra_trasferta_nome}</Td>
                    <Td>
                      <Badge $status={partita.stato}>
                        {partita.stato === 'giocata' && 'Giocata'}
                        {partita.stato === 'programmata' && 'Programmata'}
                        {partita.stato === 'in_corso' && 'In Corso'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState>
              <p>Calendario non ancora generato</p>
            </EmptyState>
          )}
        </Card>
      </Grid>
    </Container>
  );
};

export default DettaglioTorneo; 