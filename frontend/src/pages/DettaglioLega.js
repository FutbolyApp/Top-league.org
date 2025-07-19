import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLegaById, getSquadreByLega, deleteLeague } from '../api/leghe';
import { getTorneiLega } from '../api/tornei';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: #FFA94D;
  }
`;

const Header = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const LeagueTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 1rem 0;
`;

const LeagueInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoCard = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #86868b;
  font-weight: 500;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #1d1d1f;
`;

const LeagueFeatures = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const FeatureTag = styled.span`
  background: ${props => props.$active ? '#007AFF' : '#e5e5e7'};
  color: ${props => props.$active ? 'white' : '#86868b'};
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  text-align: center;
`;

const StatTitle = styled.div`
  font-size: 0.8rem;
  color: #86868b;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d1d1f;
`;

const TeamsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 1rem 0;
`;

const FilterContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FilterLabel = styled.label`
  font-size: 0.85rem;
  font-weight: 500;
  color: #1d1d1f;
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #e5e5e7;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  color: #1d1d1f;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const TeamsTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`;

const TableHeader = styled.th`
  background: #5856d6;
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
  }
`;

const TableCell = styled.td`
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #e5e5e7;
  color: #1d1d1f;
  text-align: center;
`;

const MoneyValue = styled.span`
  font-weight: 600;
  color: #28a745;
  font-size: 0.8rem;
`;

const CostValue = styled.span`
  font-weight: 600;
  color: #dc3545;
  font-size: 0.8rem;
`;

const ViewButton = styled(Link)`
  color: #E67E22;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #D35400;
    text-decoration: underline;
  }
`;

const TeamStatus = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.$orphan ? '#ffebee' : '#e8f5e8'};
  color: ${props => props.$orphan ? '#c62828' : '#2e7d32'};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1rem;
  color: #86868b;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1rem;
  color: #dc3545;
`;

const DeleteButton = styled.button`
  background: #ff3b30;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #d70015;
    transform: translateY(-1px);
  }
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
  margin: 1rem;
`;

const ModalTitle = styled.h3`
  color: #ff3b30;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const ModalText = styled.p`
  color: #86868b;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
`;

const ModalButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &.cancel {
    background: #e5e5e7;
    color: #1d1d1f;
  }
  
  &.confirm {
    background: #ff3b30;
    color: white;
  }
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const TeamLogo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9500 0%, #e6850e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 auto;
`;

const DettaglioLega = ({ setCurrentLeague, setCurrentTeam }) => {
  const { token, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [lega, setLega] = useState(null);
  const [squadre, setSquadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [selectedTournament, setSelectedTournament] = useState('all');
  const [tournaments, setTournaments] = useState([
    { id: 'all', name: 'Tutti i Tornei' }
  ]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [resLega, resSquadre, resTornei] = await Promise.all([
          getLegaById(id, token),
          getSquadreByLega(id, token),
          getTorneiLega(id, token)
        ]);
        
        setLega(resLega.lega);
        if (setCurrentLeague) setCurrentLeague(resLega.lega);
        if (setCurrentTeam) setCurrentTeam(null);
        
        setSquadre(resSquadre.squadre);
        
        // Aggiungi i tornei reali al filtro
        const torneiReali = resTornei.tornei || [];
        const torneiOptions = [
          { id: 'all', name: 'Tutti i Tornei' },
          ...torneiReali?.map(torneo => ({
            id: torneo.id.toString(),
            name: torneo?.nome || 'Nome'
          })),
          { id: 'na', name: 'N/A (Senza Torneo)' }
        ];
        setTournaments(torneiOptions);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [id, token, setCurrentLeague, setCurrentTeam]);

  const formatMoney = (value) => {
    if (!value) return 'FM 0';
    return `FM ${value.toLocaleString()}`;
  };

  const getLeagueStats = () => {
    const totalSquadre = squadre?.length || 0;
    const squadreConProprietario = squadre?.filter(s => s.proprietario_id).length;
    const squadreOrfane = squadre?.filter(s => s.is_orfana).length;
    const valoreTotale = squadre?.reduce((sum, s) => sum + (s.valore_squadra || 0), 0);
    const casseTotali = squadre?.reduce((sum, s) => sum + (s.casse_societarie || 0), 0);
    const costoSalarialeTotale = squadre?.reduce((sum, s) => sum + (s.costo_salariale_totale || 0), 0);
    const costoSalarialeAnnual = squadre?.reduce((sum, s) => sum + (s.costo_salariale_annuale || 0), 0);

    return {
      totalSquadre,
      squadreConProprietario,
      squadreOrfane,
      valoreTotale,
      casseTotali,
      costoSalarialeTotale,
      costoSalarialeAnnual
    };
  };

  const handleDeleteLeague = async () => {
    setDeleting(true);
    try {
      await deleteLeague(id, token);
      alert('Lega eliminata con successo!');
      navigate('/');
    } catch (error) {
      alert('Errore durante l\'eliminazione: ' + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Filter teams based on selected tournament
  const filteredSquadre = selectedTournament === 'all' 
    ? squadre 
    : squadre?.filter(squadra => {
        if (selectedTournament === 'na') {
          // Mostra squadre senza torneo (N/A)
          return !squadra.tornei || squadra.tornei?.length || 0 === 0;
        } else {
          // Mostra squadre del torneo selezionato
          return squadra.tornei && squadra.tornei.some(torneo => 
            torneo.id === parseInt(selectedTournament) || torneo.id === selectedTournament
          );
        }
      });

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento lega...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  if (!lega) return (
    <Container>
      <ErrorContainer>Lega non trovata</ErrorContainer>
    </Container>
  );

  const stats = getLeagueStats();
  const isAdmin = lega && (lega.admin_id === user?.id || user?.ruolo === 'superadmin');

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <LeagueTitle>{lega?.nome || 'Nome'}</LeagueTitle>
          {isAdmin && (
            <DeleteButton onClick={() => setShowDeleteModal(true)}>
              🗑️ Cancella Lega
            </DeleteButton>
          )}
        </div>
        
        <LeagueInfo>
          <InfoCard>
            <InfoLabel>Modalità</InfoLabel>
            <InfoValue>{lega.modalita}</InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Tipo</InfoLabel>
            <InfoValue>{lega.is_pubblica ? 'Pubblica' : 'Privata'}</InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Squadre</InfoLabel>
            <InfoValue>{stats.squadreConProprietario}/{stats.totalSquadre}</InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Admin</InfoLabel>
            <InfoValue>Tu</InfoValue>
          </InfoCard>
        </LeagueInfo>

        <LeagueFeatures>
          {lega.roster_ab && <FeatureTag $active>Roster A/B</FeatureTag>}
          {lega.cantera && <FeatureTag $active>Cantera</FeatureTag>}
          {lega.contratti && <FeatureTag $active>Contratti</FeatureTag>}
          {lega.triggers && <FeatureTag $active>Triggers</FeatureTag>}
        </LeagueFeatures>
      </Header>

      <StatsGrid>
        <StatCard color="#667eea">
          <StatTitle>Monte Ingaggi Totale</StatTitle>
          <StatValue>{formatMoney(stats.valoreTotale)}</StatValue>
        </StatCard>
        <StatCard color="#28a745">
          <StatTitle>Totale Casse Societarie</StatTitle>
          <StatValue>{formatMoney(stats.casseTotali)}</StatValue>
        </StatCard>
        <StatCard color="#dc3545">
          <StatTitle>Monte Ingaggi</StatTitle>
          <StatValue>{formatMoney(stats.costoSalarialeAnnual)}</StatValue>
        </StatCard>
      </StatsGrid>

      <TeamsSection>
        <SectionTitle>Squadre della Lega</SectionTitle>
        
        <FilterContainer>
          <FilterLabel>Filtra per Torneo:</FilterLabel>
          <FilterSelect 
            value={selectedTournament} 
            onChange={(e) => setSelectedTournament(e.target.value)}
          >
            {tournaments?.map(tournament => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </FilterSelect>
        </FilterContainer>
        
        <TeamsTable>
          <Table>
            <thead>
              <tr>
                <TableHeader></TableHeader>
                <TableHeader>Nome Squadra</TableHeader>
                <TableHeader>Proprietario</TableHeader>
                <TableHeader>Club Level</TableHeader>
                <TableHeader>Torneo</TableHeader>
                <TableHeader>Ingaggi</TableHeader>
                <TableHeader>Crediti Residui</TableHeader>
                <TableHeader>Valore Attuale</TableHeader>
                <TableHeader>Giocatori</TableHeader>
              </tr>
            </thead>
            <tbody>
              {filteredSquadre?.map(squadra => (
                <tr key={squadra.id}>
                  <TableCell>
                    {squadra.logo_url ? (
                      <img 
                        src={`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/uploads/${squadra.logo_url}`} 
                        alt="Logo squadra" 
                        style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <TeamLogo>
                        {squadra?.nome || 'Nome'.charAt(0).toUpperCase()}
                      </TeamLogo>
                    )}
                  </TableCell>
                  <TableCell>
                    <ViewButton to={`/squadra/${squadra.id}`}>
                      {squadra?.nome || 'Nome'}
                    </ViewButton>
                  </TableCell>
                  <TableCell>
                    {squadra.proprietario_username ? (
                      <span style={{ color: '#28a745', fontWeight: '600' }}>
                        {squadra.proprietario_username}
                      </span>
                    ) : (
                      <span style={{ color: '#dc3545', fontStyle: 'italic' }}>
                        N/A
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{squadra.club_level || 1}</TableCell>
                  <TableCell>
                    {squadra.tornei && squadra.tornei?.length || 0 > 0 
                      ? squadra.tornei?.map(torneo => torneo?.nome || 'Nome').join(', ')
                      : "N/A"
                    }
                  </TableCell>
                  <TableCell>
                    <MoneyValue>{formatMoney(squadra.valore_squadra)}</MoneyValue>
                  </TableCell>
                  <TableCell>
                    <MoneyValue>{formatMoney(squadra.casse_societarie)}</MoneyValue>
                  </TableCell>
                  <TableCell>
                    <CostValue>{formatMoney(squadra.valore_attuale_qa || 0)}</CostValue>
                  </TableCell>
                  <TableCell>{squadra.giocatori?.length || 0}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TeamsTable>
      </TeamsSection>

      {showDeleteModal && (
        <ConfirmationModal>
          <ModalContent>
            <ModalTitle>⚠️ Conferma Eliminazione</ModalTitle>
            <ModalText>
              Sei sicuro di voler eliminare la lega <strong>"{lega?.nome || 'Nome'}"</strong>?<br />
              Questa azione è <strong>IRREVERSIBILE</strong> e eliminerà:
            </ModalText>
            <ul style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <li>Tutte le squadre della lega</li>
              <li>Tutti i giocatori</li>
              <li>Tutte le offerte e contratti</li>
              <li>Tutte le notifiche</li>
              <li>Tutti i log</li>
            </ul>
            <ModalText>
              <strong>Digita "ELIMINA" per confermare:</strong>
            </ModalText>
            <input 
              type="text" 
              placeholder="ELIMINA"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                marginBottom: '1rem',
                border: deleteConfirmation === 'ELIMINA' ? '1px solid #28a745' : '1px solid #dc3545',
                borderRadius: '4px'
              }}
            />
            <ModalButtons>
              <ModalButton 
                className="cancel" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                disabled={deleting}
              >
                Annulla
              </ModalButton>
              <ModalButton 
                className="confirm" 
                onClick={handleDeleteLeague}
                disabled={deleting || deleteConfirmation !== 'ELIMINA'}
              >
                {deleting ? 'Eliminando...' : 'Elimina Lega'}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ConfirmationModal>
      )}
    </Container>
  );
};

export default DettaglioLega; 