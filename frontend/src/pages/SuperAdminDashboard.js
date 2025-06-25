import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getAllLegheAdmin, deleteLeague } from '../api/leghe';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LeaguesSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: #333;
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LeaguesTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e9ecef;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  margin: 0.25rem;
  font-size: 0.9rem;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &.danger {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  }
  
  &.success {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  }
  
  &.warning {
    background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
    color: #212529;
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  
  &.public {
    background: #d4edda;
    color: #155724;
  }
  
  &.private {
    background: #f8d7da;
    color: #721c24;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #dc3545;
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [leghe, setLeghe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLeghe() {
      setLoading(true);
      setError('');
      try {
        const res = await getAllLegheAdmin(token);
        setLeghe(res.leghe);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchLeghe();
  }, [token]);

  const handleEditLega = (legaId) => {
    navigate(`/super-admin/lega/${legaId}/edit`);
  };

  const handleDeleteLega = async (legaId, legaNome) => {
    if (window.confirm(`Sei sicuro di voler eliminare la lega "${legaNome}"? Questa azione non può essere annullata.`)) {
      try {
        await deleteLeague(legaId, token);
        setLeghe(leghe.filter(lega => lega.id !== legaId));
        alert('Lega eliminata con successo!');
      } catch (err) {
        alert(`Errore nell'eliminazione: ${err.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento dashboard...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  const totalLeghe = leghe.length;
  const totalSquadre = leghe.reduce((sum, lega) => sum + (lega.numero_squadre || 0), 0);
  const totalGiocatori = leghe.reduce((sum, lega) => sum + (lega.numero_giocatori || 0), 0);
  const leghePubbliche = leghe.filter(lega => lega.is_pubblica).length;

  return (
    <Container>
      <Header>
        <Title>👑 SuperAdmin Dashboard</Title>
        <Subtitle>Pannello di controllo completo per la gestione del sistema</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber>{totalLeghe}</StatNumber>
          <StatLabel>Leghe Totali</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{totalSquadre}</StatNumber>
          <StatLabel>Squadre Totali</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{totalGiocatori}</StatNumber>
          <StatLabel>Giocatori Totali</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{leghePubbliche}</StatNumber>
          <StatLabel>Leghe Pubbliche</StatLabel>
        </StatCard>
      </StatsGrid>

      <LeaguesSection>
        <SectionTitle>🏆 Gestione Leghe</SectionTitle>
        
        {leghe.length === 0 ? (
          <EmptyContainer>
            <h3>Nessuna lega trovata</h3>
            <p>Non ci sono ancora leghe nel sistema.</p>
          </EmptyContainer>
        ) : (
          <LeaguesTable>
            <Table>
              <thead>
                <tr>
                  <Th>Nome Lega</Th>
                  <Th>Proprietario</Th>
                  <Th>Modalità</Th>
                  <Th>Stato</Th>
                  <Th>Squadre</Th>
                  <Th>Giocatori</Th>
                  <Th>Data Creazione</Th>
                  <Th>Azioni</Th>
                </tr>
              </thead>
              <tbody>
                {leghe.map(lega => (
                  <Tr key={lega.id}>
                    <Td>
                      <strong>{lega.nome}</strong>
                    </Td>
                    <Td>
                      <div>
                        <div><strong>{lega.admin_nome || 'N/A'}</strong></div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {lega.admin_email || 'N/A'}
                        </div>
                      </div>
                    </Td>
                    <Td>{lega.modalita}</Td>
                    <Td>
                      <StatusBadge className={lega.is_pubblica ? 'public' : 'private'}>
                        {lega.is_pubblica ? 'Pubblica' : 'Privata'}
                      </StatusBadge>
                    </Td>
                    <Td>{lega.numero_squadre || 0}</Td>
                    <Td>{lega.numero_giocatori || 0}</Td>
                    <Td>{formatDate(lega.created_at)}</Td>
                    <Td>
                      <ActionButton 
                        className="warning"
                        onClick={() => handleEditLega(lega.id)}
                      >
                        ✏️ Modifica
                      </ActionButton>
                      <ActionButton 
                        className="danger"
                        onClick={() => handleDeleteLega(lega.id, lega.nome)}
                      >
                        🗑️ Elimina
                      </ActionButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </LeaguesTable>
        )}
      </LeaguesSection>
    </Container>
  );
};

export default SuperAdminDashboard;
