import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getSquadreByUtente } from '../api/squadre';
import { getNotificheByUtente } from '../api/notifiche';
import { getMovimentiMercato } from '../api/offerte';
import { 
  getSquadreUtenteShared, 
  getNotificheShared 
} from '../api/sharedApi';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
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
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h1`
  color: #333;
  margin: 0;
  font-size: 2rem;
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TeamsTable = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #5856d6;
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: left;
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

const Td = styled.td`
  padding: 1rem 0.5rem;
  border-bottom: 1px solid #dee2e6;
  color: #333;
  vertical-align: middle;
`;

const TeamName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 1rem;
`;

const LeagueName = styled.div`
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
`;

const SelectButton = styled.button`
  background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 0.8rem;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const ExpandedRow = styled.tr`
  background: #f8f9fa;
`;

const ExpandedCell = styled.td`
  padding: 0;
  border-bottom: 1px solid #dee2e6;
`;

const ExpandedContent = styled.div`
  padding: 1.5rem;
`;

const TeamStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
`;

const MoneyValue = styled.span`
  font-weight: 600;
  color: #28a745;
`;

const CostValue = styled.span`
  font-weight: 600;
  color: #dc3545;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%);
  color: white;
  border: none;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const MarketMovements = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const MarketTitle = styled.h4`
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
`;

const MovementItem = styled.div`
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
  color: #333;
  
  &:last-child {
    border-bottom: none;
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
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #666;
  text-align: center;
`;

const DefaultLogo = null;

const AreaManager = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [squadre, setSquadre] = useState([]);
  const [notifiche, setNotifiche] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSquadra, setExpandedSquadra] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        console.log('🔍 AreaManager: Starting fetchData');
        console.log('🔍 AreaManager: Token available:', !!token);
        console.log('🔍 AreaManager: User ID:', user?.id);
        
        const [squadreRes, notificheRes] = await Promise.all([
          getSquadreUtenteShared(token, user.id),
          getNotificheShared(token, user.id)
        ]);
        
        console.log('🔍 AreaManager: Squadre response:', squadreRes);
        console.log('🔍 AreaManager: Notifiche response:', notificheRes);
        
        // Gestisci sia il formato {ok: true, data: {...}} che il formato diretto
        const squadreData = squadreRes.data ? squadreRes.data : squadreRes;
        const notificheData = notificheRes.data ? notificheRes.data : notificheRes;
        
        setSquadre(squadreData.squadre || []);
        setNotifiche(notificheData.notifiche || []);
        
        console.log('🔍 AreaManager: Squadre set:', squadreData.squadre?.length || 0);
        console.log('🔍 AreaManager: Notifiche set:', notificheData.notifiche?.length || 0);
        
        // Carica movimenti di mercato per ogni lega
        const movimentiPromises = squadreData.squadre?.map(squadra => 
          getMovimentiMercato(squadra.lega_id, token)
        ) || [];
        
        const movimentiResults = await Promise.all(movimentiPromises);
        const allMovimenti = movimentiResults.flatMap(res => res.movimenti || []);
        setMovimenti(allMovimenti);
        
        console.log('🔍 AreaManager: Movimenti loaded:', allMovimenti.length);
      } catch (err) {
        console.error('❌ AreaManager: Error in fetchData:', err);
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [token]);

  const formatMoney = (value) => {
    if (!value) return 'FM 0';
    return `FM ${value.toLocaleString()}`;
  };

  const getNotificheCount = (squadraId) => {
    return notifiche.filter(n => n.squadra_id === squadraId).length;
  };

  const getMovimentiByLega = (legaId) => {
    return movimenti
      .filter(m => m.lega_id === legaId)
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 5);
  };

  const handleToggleExpanded = (squadraId) => {
    setExpandedSquadra(expandedSquadra === squadraId ? null : squadraId);
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento area manager...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <HeaderLeft>
          <Title>👑 Area Manager</Title>
        </HeaderLeft>
      </Header>

      {squadre.length === 0 ? (
        <EmptyContainer>
          <div>
            <h3>Nessuna squadra trovata</h3>
            <p>Non hai ancora squadre assegnate. Unisciti a una lega per iniziare!</p>
          </div>
        </EmptyContainer>
      ) : (
        <TeamsTable>
          <Table>
            <thead>
              <tr>
                <Th>Squadra</Th>
                <Th>Club Level</Th>
                <Th>Torneo</Th>
                <Th>Ingaggi</Th>
                <Th>Crediti Residui</Th>
                <Th>Valore Attuale</Th>
                <Th>Giocatori</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {squadre.map(squadra => {
                const movimentiLega = getMovimentiByLega(squadra.lega_id);
                const notificheCount = getNotificheCount(squadra.id);
                const isExpanded = expandedSquadra === squadra.id;
                let valoreAttuale = 0;
                let ingaggi = 0;
                let numGiocatori = 0;
                if (Array.isArray(squadra?.giocatori) && squadra?.giocatori?.length > 0) {
                  valoreAttuale = squadra.giocatori.reduce((sum, g) => sum + (parseInt(g?.quotazione_attuale) || 0), 0);
                  ingaggi = squadra.giocatori.reduce((sum, g) => sum + (parseInt(g?.costo_attuale) || 0), 0);
                  numGiocatori = squadra.giocatori.length;
                } else if (typeof squadra?.numero_giocatori === 'number') {
                  numGiocatori = squadra.numero_giocatori;
                }
                const maxGiocatori = squadra?.max_giocatori || 30;
                const logoUrl = squadra.logo_url;
                const torneoNome = squadra.torneo_nome || 'N/A';
                return (
                  <React.Fragment key={squadra.id}>
                    <tr>
                      <Td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {logoUrl ? (
                          <img 
                            src={`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/uploads/${logoUrl}`} 
                            alt="logo" 
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#eee' }} 
                          />
                        ) : (
                          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0U1RTVFNyIgc3Ryb2tlLXdpZHRoPSIxIi8+CjxwYXRoIGQ9Ik0xNiA4QzE4LjIwOTEgOCAyMCA5Ljc5MDg2IDIwIDEyQzIwIDE0LjIwOTEgMTguMjA5MSAxNiAxNiAxNkMxMy43OTA5IDE2IDEyIDE0LjIwOTEgMTIgMTJDMTIgOS43OTA4NiAxMy43OTA5IDggMTYgOFoiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTggMjRDMTAuMjA5MSAyNCAxMiAyMi4yMDkxIDEyIDIwQzEyIDE3Ljc5MDkgMTAuMjA5MSAxNiA4IDE2QzUuNzkwODYgMTYgNCAxNy43OTA5IDQgMjBDNCAyMi4yMDkxIDUuNzkwODYgMjQgOCAyNFoiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTI0IDI0QzI2LjIwOTEgMjQgMjggMjIuMjA5MSAyOCAyMEMyOCAxNy43OTA5IDI2LjIwOTEgMTYgMjQgMTZDMjEuNzkwOSAxNiAyMCAxNy43OTA5IDIwIDIwQzIwIDIyLjIwOTEgMjEuNzkwOSAyNCAyNCAyNFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+" alt="logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#eee' }} />
                        )}
                        <span style={{ fontWeight: 600, cursor: 'pointer', color: '#FF8C42' }} onClick={() => navigate(`/gestione-squadra/${squadra.lega_id}`)}>{squadra.nome}</span>
                      </Td>
                      <Td>{squadra.club_level || 1}</Td>
                      <Td>{torneoNome}</Td>
                      <Td>FM {ingaggi.toLocaleString()}</Td>
                      <Td><MoneyValue>{squadra.casse_societarie?.toLocaleString() || 0} FM</MoneyValue></Td>
                      <Td>FM {valoreAttuale.toLocaleString()}</Td>
                      <Td>{numGiocatori}/{maxGiocatori}</Td>
                      <Td>
                        <SelectButton onClick={() => handleToggleExpanded(squadra.id)}>
                          {isExpanded ? 'Chiudi' : 'Gestisci'}
                        </SelectButton>
                      </Td>
                    </tr>
                    {isExpanded && (
                      <ExpandedRow>
                        <ExpandedCell colSpan="8">
                          <ExpandedContent>
                            <ActionButtons>
                              <ActionButton 
                                type="visualizza"
                                onClick={() => navigate(`/gestione-squadra/${squadra.lega_id}`)}
                              >
                                Visualizza
                              </ActionButton>
                              <ActionButton 
                                type="notifiche"
                                onClick={() => navigate(`/notifiche?squadra=${squadra.id}`)}
                              >
                                Notifiche ({notificheCount})
                              </ActionButton>
                              <ActionButton 
                                type="offerta"
                                onClick={() => navigate(`/proponi-offerta?squadra=${squadra.id}`)}
                              >
                                Proponi Offerta
                              </ActionButton>
                              <ActionButton 
                                type="admin"
                                onClick={() => navigate(`/richiesta-admin?squadra=${squadra.id}`)}
                              >
                                Richiesta Admin
                              </ActionButton>
                              <ActionButton 
                                type="log"
                                onClick={() => navigate(`/log-squadra/${squadra.id}`)}
                              >
                                Log
                              </ActionButton>
                            </ActionButtons>

                            <MarketMovements>
                              <MarketTitle>📢 Ultime 5 Notifiche</MarketTitle>
                              {notifiche.filter(n => n.squadra_id === squadra.id).slice(0, 5).length === 0 ? (
                                <MovementItem>Nessuna notifica recente</MovementItem>
                              ) : (
                                notifiche.filter(n => n.squadra_id === squadra.id).slice(0, 5).map((notifica, index) => (
                                  <MovementItem key={index}>
                                    {notifica.titolo}: {notifica.messaggio} - {new Date(notifica.created_at).toLocaleDateString()}
                                  </MovementItem>
                                ))
                              )}
                            </MarketMovements>

                            <MarketMovements>
                              <MarketTitle>📈 Ultimi 5 Movimenti di Mercato</MarketTitle>
                              {movimentiLega.length === 0 ? (
                                <MovementItem>Nessun movimento recente</MovementItem>
                              ) : (
                                movimentiLega.map((movimento, index) => (
                                  <MovementItem key={index}>
                                    {movimento.giocatore_nome} si è {movimento.tipo === 'trasferimento' ? 'trasferito' : 'prestato'} da {movimento.squadra_mittente} a {movimento.squadra_destinataria} il {new Date(movimento.data).toLocaleDateString()} per {formatMoney(movimento.valore)}
                                  </MovementItem>
                                ))
                              )}
                            </MarketMovements>
                          </ExpandedContent>
                        </ExpandedCell>
                      </ExpandedRow>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </TeamsTable>
      )}
    </Container>
  );
};

export default AreaManager; 