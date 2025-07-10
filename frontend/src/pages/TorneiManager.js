import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getTorneiLega, getDettaglioTorneo, calcolaGiornata, aggiornaClassifica } from '../api/tornei';

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
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
`;

const CardTitle = styled.h3`
  color: #333;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const Badge = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'giocata': return '#28a745';
      case 'programmata': return '#ffc107';
      case 'in_corso': return '#17a2b8';
      default: return '#6c757d';
    }
  }};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const TorneiManager = () => {
  const { legaId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tornei, setTornei] = useState([]);
  const [selectedTorneo, setSelectedTorneo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [giornata, setGiornata] = useState(1);

  useEffect(() => {
    loadTornei();
  }, [legaId]);

  const loadTornei = async () => {
    try {
      const response = await getTorneiLega(legaId, token);
      setTornei(response.tornei);
    } catch (error) {
      console.error('Errore caricamento tornei:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDettaglioTorneo = async (torneoId) => {
    try {
      const response = await getDettaglioTorneo(torneoId, token);
      setSelectedTorneo(response);
    } catch (error) {
      console.error('Errore caricamento dettaglio torneo:', error);
    }
  };

  const handleCalcolaGiornata = async () => {
    if (!selectedTorneo) return;
    
    try {
      await calcolaGiornata(selectedTorneo.torneo.id, giornata, token);
      await loadDettaglioTorneo(selectedTorneo.torneo.id);
      alert(`Giornata ${giornata} calcolata con successo!`);
    } catch (error) {
      alert('Errore nel calcolo della giornata');
    }
  };

  const handleAggiornaClassifica = async () => {
    if (!selectedTorneo) return;
    
    try {
      await aggiornaClassifica(selectedTorneo.torneo.id, token);
      await loadDettaglioTorneo(selectedTorneo.torneo.id);
      alert('Classifica aggiornata con successo!');
    } catch (error) {
      alert('Errore nell\'aggiornamento della classifica');
    }
  };

  const creaNuovoTorneo = () => {
    navigate(`/lega/${legaId}/nuovo-torneo`);
  };

  if (loading) {
    return <Container>Caricamento tornei...</Container>;
  }

  return (
    <Container>
      <Header>
        <Title>🏆 Gestione Tornei</Title>
        <Button onClick={creaNuovoTorneo}>Nuovo Torneo</Button>
      </Header>

      <Grid>
        <Card>
          <CardTitle>📋 Lista Tornei</CardTitle>
          {tornei.length === 0 ? (
            <p>Nessun torneo creato</p>
          ) : (
            <div>
              {tornei.map(torneo => (
                <div 
                  key={torneo.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    backgroundColor: selectedTorneo?.torneo.id === torneo.id ? '#f8f9fa' : 'white'
                  }}
                  onClick={() => loadDettaglioTorneo(torneo.id)}
                >
                  <h4>{torneo.nome}</h4>
                  <p>Tipo: {torneo.tipo}</p>
                  <p>Stato: <Badge $status={torneo.stato}>{torneo.stato}</Badge></p>
                  <p>Giornate: {torneo.partite_giocate || 0}/{torneo.partite_totali || 0}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {selectedTorneo && (
          <Card>
            <CardTitle>📊 {selectedTorneo.torneo.nome}</CardTitle>
            
            <div style={{ marginBottom: '1rem' }}>
              <Form>
                <label>Giornata:</label>
                <Input
                  type="number"
                  min="1"
                  value={giornata}
                  onChange={(e) => setGiornata(parseInt(e.target.value))}
                />
                <Button type="button" onClick={handleCalcolaGiornata}>
                  Calcola Giornata
                </Button>
              </Form>
              
              <Button onClick={handleAggiornaClassifica} style={{ marginRight: '1rem' }}>
                Aggiorna Classifica
              </Button>
            </div>

            <div>
              <h4>🏆 Classifica</h4>
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
                  {selectedTorneo.classifica.map((squadra, index) => (
                    <Tr key={squadra.id}>
                      <Td>{index + 1}</Td>
                      <Td>{squadra.nome}</Td>
                      <Td>{squadra.punti_campionato}</Td>
                      <Td>{squadra.gol_fatti}</Td>
                      <Td>{squadra.gol_subiti}</Td>
                      <Td>{squadra.differenza_reti}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h4>📅 Calendario</h4>
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
                  {selectedTorneo.calendario.map(partita => (
                    <Tr key={partita.id}>
                      <Td>{partita.giornata}</Td>
                      <Td>{partita.squadra_casa_nome}</Td>
                      <Td>
                        {partita.stato === 'giocata' 
                          ? `${partita.gol_casa} - ${partita.gol_trasferta}`
                          : '-'
                        }
                      </Td>
                      <Td>{partita.squadra_trasferta_nome}</Td>
                      <Td>
                        <Badge $status={partita.stato}>{partita.stato}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        )}
      </Grid>
    </Container>
  );
};

export default TorneiManager; 