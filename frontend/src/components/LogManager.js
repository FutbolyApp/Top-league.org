import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { api } from '../api/config.js';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 14px;
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 14px;
`;

const LogTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  color: #333;
`;

const ActionBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.action) {
      case 'trasferimento': return '#e8f5e8';
      case 'prestito': return '#fff3e0';
      case 'rinnovo': return '#f3e5f5';
      case 'pagamento': return '#e3f2fd';
      case 'modifica': return '#fff8e1';
      case 'creazione': return '#f1f8e9';
      case 'eliminazione': return '#ffebee';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.action) {
      case 'trasferimento': return '#2e7d32';
      case 'prestito': return '#e65100';
      case 'rinnovo': return '#7b1fa2';
      case 'pagamento': return '#1565c0';
      case 'modifica': return '#f57c00';
      case 'creazione': return '#388e3c';
      case 'eliminazione': return '#c62828';
      default: return '#666';
    }
  }};
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #333;
`;

const UserRole = styled.span`
  font-size: 12px;
  color: #666;
`;

const DetailsButton = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #1976D2;
    transform: translateY(-1px);
  }
`;

const ExportButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #45a049;
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
`;

const PageButton = styled.button`
  background: ${props => props.$active ? '#ff8c42' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? '#ff8c42' : '#f5f5f5'};
  }
`;

const LogManager = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    lega: 'tutte',
    azione: 'tutte',
    utente: 'tutti',
    dataInizio: '',
    dataFine: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [leghe, setLeghe] = useState([]);
  const [utenti, setUtenti] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchLeghe();
    fetchUtenti();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        ...filters
      });
      
      const data = await api.get(`/log?${params}`, token);
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeghe = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await api.get('/leghe', token);
      setLeghe(data.leghe || []);
    } catch (error) {
      console.error('Errore nel caricamento leghe:', error);
    }
  };

  const fetchUtenti = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await api.get('/utenti', token);
      setUtenti(data.utenti || []);
    } catch (error) {
      console.error('Errore nel caricamento utenti:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(filters);
    
    api.get(`/log/export?${params}`, token)
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `log_topleague_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    })
    .catch(error => {
      console.error('Errore nell\'esportazione:', error);
    });
  };

  const getActionLabel = (azione) => {
    const actionMap = {
      'trasferimento': 'Trasferimento',
      'prestito': 'Prestito',
      'rinnovo': 'Rinnovo Contratto',
      'pagamento': 'Pagamento',
      'modifica': 'Modifica',
      'creazione': 'Creazione',
      'eliminazione': 'Eliminazione'
    };
    return actionMap[azione] || azione;
  };

  const getActionIcon = (azione) => {
    const iconMap = {
      'trasferimento': '🔄',
      'prestito': '📋',
      'rinnovo': '📝',
      'pagamento': '💰',
      'modifica': '✏️',
      'creazione': '➕',
      'eliminazione': '🗑️'
    };
    return iconMap[azione] || '📢';
  };

  if (loading) {
    return (
      <Container>
        <div>Caricamento log...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ color: 'red' }}>{error}</div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📋 Log Sistema</Title>
        <ExportButton onClick={handleExport}>
          📊 Esporta CSV
        </ExportButton>
      </Header>

      <FilterContainer>
        <FilterSelect 
          value={filters.lega} 
          onChange={(e) => handleFilterChange('lega', e.target.value)}
        >
          <option value="tutte">Tutte le leghe</option>
          {leghe.map(lega => (
            <option key={lega.id} value={lega.id}>
              {lega.nome}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect 
          value={filters.azione} 
          onChange={(e) => handleFilterChange('azione', e.target.value)}
        >
          <option value="tutte">Tutte le azioni</option>
          <option value="trasferimento">Trasferimenti</option>
          <option value="prestito">Prestiti</option>
          <option value="rinnovo">Rinnovi</option>
          <option value="pagamento">Pagamenti</option>
          <option value="modifica">Modifiche</option>
          <option value="creazione">Creazioni</option>
          <option value="eliminazione">Eliminazioni</option>
        </FilterSelect>

        <FilterSelect 
          value={filters.utente} 
          onChange={(e) => handleFilterChange('utente', e.target.value)}
        >
          <option value="tutti">Tutti gli utenti</option>
          {utenti.map(utente => (
            <option key={utente.id} value={utente.id}>
              {utente.nome} {utente.cognome}
            </option>
          ))}
        </FilterSelect>

        <DateInput
          type="date"
          value={filters.dataInizio}
          onChange={(e) => handleFilterChange('dataInizio', e.target.value)}
          placeholder="Data inizio"
        />

        <DateInput
          type="date"
          value={filters.dataFine}
          onChange={(e) => handleFilterChange('dataFine', e.target.value)}
          placeholder="Data fine"
        />
      </FilterContainer>

      {logs.length === 0 ? (
        <EmptyState>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <div>Nessun log trovato</div>
        </EmptyState>
      ) : (
        <>
          <LogTable>
            <thead>
              <tr>
                <Th>Data/Ora</Th>
                <Th>Azione</Th>
                <Th>Utente</Th>
                <Th>Lega</Th>
                <Th>Dettagli</Th>
                <Th>Azioni</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <Td>
                    {new Date(log.data_azione).toLocaleString('it-IT')}
                  </Td>
                  <Td>
                    <ActionBadge action={log.azione}>
                      {getActionIcon(log.azione)} {getActionLabel(log.azione)}
                    </ActionBadge>
                  </Td>
                  <Td>
                    {log.utente_nome ? (
                      <UserInfo>
                        <UserName>{log.utente_nome} {log.utente_cognome}</UserName>
                        <UserRole>{log.utente_ruolo}</UserRole>
                      </UserInfo>
                    ) : (
                      'Sistema'
                    )}
                  </Td>
                  <Td>
                    {log.lega_nome || 'N/A'}
                  </Td>
                  <Td>
                    <div style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
                      {log.dettagli}
                    </div>
                  </Td>
                  <Td>
                    <DetailsButton onClick={() => console.log('Dettagli log:', log)}>
                      👁️ Dettagli
                    </DetailsButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </LogTable>

          <Pagination>
            <PageButton 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              ← Precedente
            </PageButton>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PageButton
                key={page}
                $active={page === currentPage}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </PageButton>
            ))}
            
            <PageButton 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Successiva →
            </PageButton>
          </Pagination>
        </>
      )}
    </Container>
  );
};

export default LogManager; 