import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getSquadraById, getGiocatoriSquadra } from '../api/squadre';
import { getBilancioSquadra, getTransazioniSquadra, getReportFinanziario } from '../api/finanze';
import { getNotificheUtente } from '../api/notifiche';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
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

const Metric = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: ${props => props.highlight ? '#f8f9fa' : 'transparent'};
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

const MetricLabel = styled.span`
  font-weight: 600;
  color: #333;
`;

const MetricValue = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => {
    if (props.positive) return '#28a745';
    if (props.negative) return '#dc3545';
    return '#333';
  }};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #FFA94D 0%, #FF8C42 100%);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const Chart = styled.div`
  height: 200px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-style: italic;
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

const Badge = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'attivo': return '#28a745';
      case 'infortunato': return '#ffc107';
      case 'squalificato': return '#dc3545';
      default: return '#6c757d';
    }
  }};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
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
`;

const NotificationItem = styled.div`
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: ${props => props.read ? '#f8f9fa' : 'white'};
  cursor: pointer;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const DashboardAvanzata = () => {
  const { squadraId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [squadra, setSquadra] = useState(null);
  const [giocatori, setGiocatori] = useState([]);
  const [bilancio, setBilancio] = useState(null);
  const [transazioni, setTransazioni] = useState([]);
  const [report, setReport] = useState(null);
  const [notifiche, setNotifiche] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [squadraId]);

  const loadDashboardData = async () => {
    try {
      const [
        squadraData,
        giocatoriData,
        bilancioData,
        transazioniData,
        reportData,
        notificheData
      ] = await Promise.all([
        getSquadraById(squadraId, token),
        getGiocatoriSquadra(squadraId, token),
        getBilancioSquadra(squadraId, token),
        getTransazioniSquadra(squadraId, token),
        getReportFinanziario(squadraId, token),
        getNotificheUtente(token)
      ]);

      setSquadra(squadraData?.data?.squadra || squadraData?.squadra);
      setGiocatori(giocatoriData?.data?.giocatori || giocatoriData?.giocatori);
      setBilancio(bilancioData?.data?.bilancio || bilancioData?.bilancio);
      setTransazioni(transazioniData?.data?.transazioni || transazioniData?.transazioni);
      setReport(reportData?.data || reportData);
      setNotifiche(notificheData?.data?.notifiche || notificheData?.notifiche);
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamStats = () => {
    if (!giocatori?.length || 0) return {};

    const stats = {
      totale_valore: giocatori?.reduce((sum, g) => sum + (g.valore_mercato || 0), 0),
      attaccanti: giocatori?.filter(g => (g?.ruolo || 'Ruolo') === 'A').length,
      centrocampisti: giocatori?.filter(g => (g?.ruolo || 'Ruolo') === 'C').length,
      difensori: giocatori?.filter(g => (g?.ruolo || 'Ruolo') === 'D').length,
      portieri: giocatori?.filter(g => (g?.ruolo || 'Ruolo') === 'P').length,
      infortunati: giocatori?.filter(g => g.stato === 'infortunato').length,
      squalificati: giocatori?.filter(g => g.stato === 'squalificato').length
    };

    return stats;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return <Container>Caricamento dashboard...</Container>;
  }

  const teamStats = calculateTeamStats();

  return (
    <Container>
      <Header>
        <Title>📊 Dashboard - {squadra?.nome}</Title>
        <Button onClick={() => navigate(`/squadra/${squadraId}/gestione`)}>
          Gestione Squadra
        </Button>
      </Header>

      <Grid>
        {/* Bilancio e Finanze */}
        <Card>
          <CardTitle>💰 Bilancio</CardTitle>
          <Metric highlight>
            <MetricLabel>Budget Iniziale</MetricLabel>
            <MetricValue>{formatCurrency(bilancio?.budget_iniziale || 0)}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Entrate Totali</MetricLabel>
            <MetricValue positive>{formatCurrency(bilancio?.entrate_totali || 0)}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Uscite Totali</MetricLabel>
            <MetricValue negative>{formatCurrency(bilancio?.uscite_totali || 0)}</MetricValue>
          </Metric>
          <Metric highlight>
            <MetricLabel>Bilancio Attuale</MetricLabel>
            <MetricValue positive={bilancio?.bilancio_attuale >= 0} negative={bilancio?.bilancio_attuale < 0}>
              {formatCurrency(bilancio?.bilancio_attuale || 0)}
            </MetricValue>
          </Metric>
          
          {bilancio && (
            <ProgressBar>
              <ProgressFill percentage={Math.min(100, (bilancio.bilancio_attuale / bilancio.budget_iniziale) * 100)} />
            </ProgressBar>
          )}
        </Card>

        {/* Statistiche Squadra */}
        <Card>
          <CardTitle>⚽ Statistiche Squadra</CardTitle>
          <Metric>
            <MetricLabel>Giocatori Totali</MetricLabel>
            <MetricValue>{giocatori?.length || 0}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Valore Mercato</MetricLabel>
            <MetricValue>{formatCurrency(teamStats.totale_valore)}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Infortunati</MetricLabel>
            <MetricValue negative={teamStats.infortunati > 0}>{teamStats.infortunati}</MetricValue>
          </Metric>
        </Card>

        {/* Distribuzione Ruoli */}
        <Card>
          <CardTitle>👥 Distribuzione Ruoli</CardTitle>
          <Metric>
            <MetricLabel>Portieri</MetricLabel>
            <MetricValue>{teamStats.portieri}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Difensori</MetricLabel>
            <MetricValue>{teamStats.difensori}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Centrocampisti</MetricLabel>
            <MetricValue>{teamStats.centrocampisti}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Attaccanti</MetricLabel>
            <MetricValue>{teamStats.attaccanti}</MetricValue>
          </Metric>
        </Card>

        {/* Ultime Transazioni */}
        <Card>
          <CardTitle>💳 Ultime Transazioni</CardTitle>
          {transazioni.slice(0, 5).map(transazione => (
            <Metric key={transazione.id}>
              <div>
                <div style={{ fontWeight: 600 }}>{transazione.descrizione}</div>
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  {new Date(transazione.data_transazione).toLocaleDateString('it-IT')}
                </div>
              </div>
              <MetricValue positive={transazione.tipo === 'entrata'} negative={transazione.tipo === 'uscita'}>
                {transazione.tipo === 'entrata' ? '+' : '-'}{formatCurrency(transazione.importo)}
              </MetricValue>
            </Metric>
          ))}
        </Card>
      </Grid>

      {/* Grafici e Report */}
      <Grid>
        <Card>
          <CardTitle>📈 Andamento Finanziario</CardTitle>
          <Chart>
            Grafico andamento entrate/uscite (implementare con libreria grafici)
          </Chart>
        </Card>

        <Card>
          <CardTitle>📊 Spese per Categoria</CardTitle>
          <Chart>
            Grafico a torta spese per categoria (implementare con libreria grafici)
          </Chart>
        </Card>
      </Grid>

      {/* Tabella Giocatori */}
      <Card>
        <CardTitle>👤 Rosa Squadra</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Ruolo</Th>
              <Th>Valore</Th>
              <Th>Stato</Th>
              <Th>Contratto</Th>
            </tr>
          </thead>
          <tbody>
            {giocatori?.map(giocatore => (
              <tr key={giocatore.id}>
                <Td>{giocatore?.nome || 'Nome'}</Td>
                <Td>{giocatore?.ruolo || 'Ruolo'}</Td>
                <Td>{formatCurrency(giocatore.valore_mercato)}</Td>
                <Td>
                  <Badge $status={giocatore.stato}>{giocatore.stato}</Badge>
                </Td>
                <Td>{giocatore.scadenza_contratto}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Notifiche Recenti */}
      <Card>
        <CardTitle>🔔 Notifiche Recenti</CardTitle>
        {notifiche.slice(0, 5).map(notifica => (
          <NotificationItem key={notifica.id} read={notifica.letta}>
            <div style={{ fontWeight: 600 }}>{notifica.titolo}</div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              {notifica.messaggio}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
              {new Date(notifica.data_creazione).toLocaleDateString('it-IT')}
            </div>
          </NotificationItem>
        ))}
      </Card>
    </Container>
  );
};

export default DashboardAvanzata; 