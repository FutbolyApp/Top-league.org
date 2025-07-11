import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
`;

const Title = styled.h1`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #5a6268;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  min-width: 120px;
`;

const DateInput = styled.input`
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #007bff;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #0056b3;
  }
`;

const LogTable = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const LogHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 100px 150px 200px;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  font-size: 13px;
  color: #495057;
`;

const LogRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 100px 150px 200px;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f4;
  font-size: 13px;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const LogCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const LogTitle = styled.div`
  font-weight: 600;
  color: #333;
`;

const LogDescription = styled.div`
  color: #666;
  font-size: 12px;
`;

const LogDetails = styled.div`
  color: #888;
  font-size: 11px;
  font-style: italic;
`;

const LogCategoria = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  
  background: ${props => {
    switch (props.categoria) {
      case 'trasferimento': return '#e3f2fd';
      case 'contratto': return '#f3e5f5';
      case 'offerta': return '#fff3e0';
      case 'richiesta_admin': return '#e8f5e8';
      case 'pagamento': return '#fce4ec';
      case 'rinnovo': return '#e0f2f1';
      case 'sistema': return '#f5f5f5';
      case 'torneo': return '#fff8e1';
      case 'finanza': return '#f1f8e9';
      default: return '#f5f5f5';
    }
  }};
  
  color: ${props => {
    switch (props.categoria) {
      case 'trasferimento': return '#1565c0';
      case 'contratto': return '#7b1fa2';
      case 'offerta': return '#e65100';
      case 'richiesta_admin': return '#2e7d32';
      case 'pagamento': return '#c2185b';
      case 'rinnovo': return '#00695c';
      case 'sistema': return '#666';
      case 'torneo': return '#f57c00';
      case 'finanza': return '#33691e';
      default: return '#666';
    }
  }};
`;

const LogTipo = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  
  background: ${props => {
    switch (props.tipo) {
      case 'giocatore_acquistato': return '#e8f5e8';
      case 'giocatore_venduto': return '#ffebee';
      case 'offerta_ricevuta': return '#fff3e0';
      case 'offerta_inviata': return '#e3f2fd';
      case 'offerta_accettata': return '#e8f5e8';
      case 'offerta_rifiutata': return '#ffebee';
      case 'contratto_firmato': return '#f3e5f5';
      case 'pagamento_effettuato': return '#e0f2f1';
      case 'richiesta_admin_inviata': return '#fff8e1';
      case 'richiesta_admin_approvata': return '#e8f5e8';
      case 'richiesta_admin_rifiutata': return '#ffebee';
      default: return '#f5f5f5';
    }
  }};
  
  color: ${props => {
    switch (props.tipo) {
      case 'giocatore_acquistato': return '#2e7d32';
      case 'giocatore_venduto': return '#c62828';
      case 'offerta_ricevuta': return '#e65100';
      case 'offerta_inviata': return '#1565c0';
      case 'offerta_accettata': return '#2e7d32';
      case 'offerta_rifiutata': return '#c62828';
      case 'contratto_firmato': return '#7b1fa2';
      case 'pagamento_effettuato': return '#00695c';
      case 'richiesta_admin_inviata': return '#f57c00';
      case 'richiesta_admin_approvata': return '#2e7d32';
      case 'richiesta_admin_rifiutata': return '#c62828';
      default: return '#666';
    }
  }};
`;

const LogDate = styled.div`
  color: #666;
  font-size: 12px;
`;

const LogUser = styled.div`
  color: #666;
  font-size: 12px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #dc3545;
`;

const LogSquadraPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { squadraId } = useParams();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtri, setFiltri] = useState({
    categoria: '',
    tipo_evento: '',
    data_inizio: '',
    data_fine: ''
  });

  useEffect(() => {
    if (!user || !token || !squadraId) {
      navigate('/login');
      return;
    }
    loadLogs();
  }, [user, token, squadraId, filtri]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtri.categoria) params.append('categoria', filtri.categoria);
      if (filtri.tipo_evento) params.append('tipo_evento', filtri.tipo_evento);
      if (filtri.data_inizio) params.append('data_inizio', filtri.data_inizio);
      if (filtri.data_fine) params.append('data_fine', filtri.data_fine);
      
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/log-squadra/${squadraId}?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Errore nel caricamento dei log');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoriaLabel = (categoria) => {
    const labels = {
      'trasferimento': 'Trasferimento',
      'contratto': 'Contratto',
      'offerta': 'Offerta',
      'richiesta_admin': 'Richiesta Admin',
      'pagamento': 'Pagamento',
      'rinnovo': 'Rinnovo',
      'sistema': 'Sistema',
      'torneo': 'Torneo',
      'finanza': 'Finanza'
    };
    return labels[categoria] || categoria;
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      'giocatore_acquistato': 'Giocatore Acquistato',
      'giocatore_venduto': 'Giocatore Venduto',
      'giocatore_prestato': 'Giocatore Prestato',
      'giocatore_restituito': 'Giocatore Restituito',
      'offerta_ricevuta': 'Offerta Ricevuta',
      'offerta_inviata': 'Offerta Inviata',
      'offerta_accettata': 'Offerta Accettata',
      'offerta_rifiutata': 'Offerta Rifiutata',
      'contratto_firmato': 'Contratto Firmato',
      'contratto_rinnovato': 'Contratto Rinnovato',
      'contratto_scaduto': 'Contratto Scaduto',
      'pagamento_effettuato': 'Pagamento Effettuato',
      'pagamento_ricevuto': 'Pagamento Ricevuto',
      'richiesta_admin_inviata': 'Richiesta Admin Inviata',
      'richiesta_admin_approvata': 'Richiesta Admin Approvata',
      'richiesta_admin_rifiutata': 'Richiesta Admin Rifiutata',
      'squadra_creata': 'Squadra Creata',
      'squadra_modificata': 'Squadra Modificata',
      'iscrizione_torneo': 'Iscrizione Torneo',
      'vittoria_partita': 'Vittoria Partita',
      'sconfitta_partita': 'Sconfitta Partita',
      'pareggio_partita': 'Pareggio Partita',
      'casse_aggiornate': 'Casse Aggiornate',
      'bonus_ricevuto': 'Bonus Ricevuto',
      'penale_pagata': 'Penale Pagata'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>Caricamento log squadra...</LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>Errore: {error}</ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <Title>📋 Log Squadra</Title>
      </Header>

      <FilterContainer>
        <FilterSelect 
          value={filtri.categoria} 
          onChange={(e) => setFiltri(prev => ({ ...prev, categoria: e.target.value }))}
        >
          <option value="">Tutte le categorie</option>
          <option value="trasferimento">Trasferimenti</option>
          <option value="contratto">Contratti</option>
          <option value="offerta">Offerte</option>
          <option value="richiesta_admin">Richieste Admin</option>
          <option value="pagamento">Pagamenti</option>
          <option value="rinnovo">Rinnovi</option>
          <option value="sistema">Sistema</option>
          <option value="torneo">Tornei</option>
          <option value="finanza">Finanza</option>
        </FilterSelect>

        <FilterSelect 
          value={filtri.tipo_evento} 
          onChange={(e) => setFiltri(prev => ({ ...prev, tipo_evento: e.target.value }))}
        >
          <option value="">Tutti i tipi</option>
          <option value="giocatore_acquistato">Giocatore Acquistato</option>
          <option value="giocatore_venduto">Giocatore Venduto</option>
          <option value="offerta_ricevuta">Offerta Ricevuta</option>
          <option value="offerta_inviata">Offerta Inviata</option>
          <option value="offerta_accettata">Offerta Accettata</option>
          <option value="offerta_rifiutata">Offerta Rifiutata</option>
          <option value="contratto_firmato">Contratto Firmato</option>
          <option value="pagamento_effettuato">Pagamento Effettuato</option>
          <option value="richiesta_admin_inviata">Richiesta Admin Inviata</option>
          <option value="richiesta_admin_approvata">Richiesta Admin Approvata</option>
          <option value="richiesta_admin_rifiutata">Richiesta Admin Rifiutata</option>
        </FilterSelect>

        <DateInput 
          type="date" 
          value={filtri.data_inizio}
          onChange={(e) => setFiltri(prev => ({ ...prev, data_inizio: e.target.value }))}
          placeholder="Data inizio"
        />

        <DateInput 
          type="date" 
          value={filtri.data_fine}
          onChange={(e) => setFiltri(prev => ({ ...prev, data_fine: e.target.value }))}
          placeholder="Data fine"
        />

        <ActionButton onClick={loadLogs}>
          🔄 Aggiorna
        </ActionButton>
      </FilterContainer>

      {logs.length === 0 ? (
        <EmptyState>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
          <div>Nessun log trovato</div>
        </EmptyState>
      ) : (
        <LogTable>
          <LogHeader>
            <div>Evento</div>
            <div>Categoria</div>
            <div>Tipo</div>
            <div>Data</div>
            <div>Utente</div>
          </LogHeader>
          
          {logs.map(log => (
            <LogRow key={log.id}>
              <LogCell>
                <LogTitle>{log.titolo}</LogTitle>
                <LogDescription>{log.descrizione}</LogDescription>
                {log.dati_aggiuntivi && (
                  <LogDetails>
                    {Object.entries(log.dati_aggiuntivi)
                      .filter(([key, value]) => value && key !== 'offerta_id')
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(' • ')}
                  </LogDetails>
                )}
              </LogCell>
              
              <LogCell>
                <LogCategoria categoria={log.categoria}>
                  {getCategoriaLabel(log.categoria)}
                </LogCategoria>
              </LogCell>
              
              <LogCell>
                <LogTipo tipo={log.tipo_evento}>
                  {getTipoLabel(log.tipo_evento)}
                </LogTipo>
              </LogCell>
              
              <LogCell>
                <LogDate>{formatDate(log.data_evento)}</LogDate>
              </LogCell>
              
              <LogCell>
                <LogUser>
                  {log.utente_nome} {log.utente_cognome}
                </LogUser>
              </LogCell>
            </LogRow>
          ))}
        </LogTable>
      )}
    </Container>
  );
};

export default LogSquadraPage; 