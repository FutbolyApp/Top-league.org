import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
// getUserLeghe, getSquadreByUtente, getNotificheUtente imports removed as they're not used
import { getMovimentiMercato } from '../api/offerte';
import { 
  getSquadreUtenteShared, 
  getNotificheShared, 
  getLegheUserShared 
} from '../api/sharedApi';
// DefaultLogo import removed as it's not used

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

// Stili per la landing page calcistica
const HeroSection = styled.div`
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  color: white;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="90" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
    opacity: 0.3;
  }
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const CTAButton = styled(Link)`
  background: ${props => props.$primary ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' : 'rgba(255,255,255,0.2)'};
  color: white;
  padding: 1rem 2rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.$primary ? 'transparent' : 'rgba(255,255,255,0.3)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    background: ${props => props.$primary ? 'linear-gradient(135deg, #e55a2b 0%, #e0851a 100%)' : 'rgba(255,255,255,0.3)'};
  }
  
  @media (max-width: 768px) {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }
`;

const BannerImg = styled.img`
  width: 100%;
  max-width: 600px;
  margin: 0 auto 1.5rem auto;
  display: block;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
`;

const SmallCTAButton = styled(Link)`
  background: ${props => props.$primary ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%)'};
  color: white;
  padding: 0.7rem 1.5rem;
  border-radius: 30px;
  min-width: 160px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-align: center;
  display: inline-block;
  font-weight: 600;
  font-size: 1.05rem;
  border: none;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
  &:hover {
    filter: brightness(0.95);
    transform: translateY(-2px);
  }
`;

// FeaturesSection, FeatureCard, FeatureIcon, FeatureTitle, FeatureDescription, StatsSection, StatsGrid, StatItem, StatNumber, StatLabel components removed as they're not used

// Stili per la scheda espandibile
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
  margin-top: 1.5rem;
`;

const MarketTitle = styled.h4`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
`;

const MovementItem = styled.div`
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: #666;
  border-left: 3px solid #6f42c1;
`;

// Stili per utenti autenticati (mantenuti dal codice originale)
const Header = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1rem;
  }
`;

const WelcomeTitle = styled.h1`
  color: #1d1d1f;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #86868b;
  font-size: 0.9rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.8rem;
  }
`;

const UserName = styled.span`
  font-weight: 600;
  color: #1d1d1f;
`;

const ActionsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  justify-content: center;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// ActionsGrid, ActionCard components removed as they're not used

// ActionIcon, ActionTitle, ActionDescription components removed as they're not used

const Section = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SectionTitle = styled.h2`
  color: #1d1d1f;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
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
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  
  &:hover {
    background: #4a4ac7;
  }
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
  }
  
  ${props => props.$sortable && `
    &::after {
      content: '${props.$sortDirection === 'asc' ? '▲' : props.$sortDirection === 'desc' ? '▼' : '↕'}';
      position: absolute;
      right: 0.5rem;
      color: white;
      font-size: 0.8rem;
    }
  `}
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #e5e5e7;
  font-size: 0.9rem;
`;

const StyledLink = styled(Link)`
  color: #5856d6;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => props.$status === 'pubblica' && `
    background: #d4edda;
    color: #155724;
  `}
  
  ${props => props.$status === 'privata' && `
    background: #f8d7da;
    color: #721c24;
  `}
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

const ActionsGridCentered = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
  width: 100%;
  margin-bottom: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.7rem;
    width: 100%;
  }
`;

const ManagerButton = styled.button`
  background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);
  color: white;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #0056b3 0%, #007AFF 100%);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 1rem;
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.3rem 0.8rem;
    font-size: 0.85rem;
  }
`;

const MoneyValue = styled.span`
  font-weight: 600;
  color: #28a745;
`;

// --- INIZIO: COMPONENTI PER IL BOOKMARK MOBILE ---
const BookmarkButton = styled.button`
  display: none;
  @media (max-width: 768px) {
    display: block;
    margin: 1.5rem auto 0 auto;
    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
    color: white;
    border: none;
    border-radius: 30px;
    padding: 0.9rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      filter: brightness(0.95);
      transform: translateY(-2px);
    }
  }
`;

const BookmarkModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;
const BookmarkModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  max-width: 350px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.18);
`;
const BookmarkModalTitle = styled.h3`
  color: #ff6b35;
  margin-bottom: 1rem;
`;
const BookmarkModalText = styled.p`
  color: #333;
  font-size: 1.05rem;
  margin-bottom: 1.5rem;
`;
const BookmarkModalClose = styled.button`
  background: #eee;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  &:hover { background: #ddd; }
`;
// --- FINE: COMPONENTI PER IL BOOKMARK MOBILE ---

const Home = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [legheAdmin, setLegheAdmin] = useState([]);
  const [squadre, setSquadre] = useState([]);
  const [notifiche, setNotifiche] = useState([]);
  const [sortFieldLeghe, setSortFieldLeghe] = useState('nome');
  const [sortDirectionLeghe, setSortDirectionLeghe] = useState('asc');
  const [sortFieldSquadre, setSortFieldSquadre] = useState('nome');
  const [sortDirectionSquadre, setSortDirectionSquadre] = useState('asc');
  
  // Stati per la scheda espandibile
  const [expandedSquadra, setExpandedSquadra] = useState(null);
  const [movimenti, setMovimenti] = useState([]);

  // --- INIZIO: LOGICA BOOKMARK MOBILE ---
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [os, setOs] = useState(null);
  useEffect(() => {
    // Rileva il sistema operativo mobile
    const ua = window.navigator.userAgent;
    if (/android/i.test(ua)) setOs('android');
    else if (/iphone|ipad|ipod/i.test(ua)) setOs('ios');
    else setOs(null);
  }, []);
  // --- FINE: LOGICA BOOKMARK MOBILE ---

  useEffect(() => {
    const loadData = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Carica leghe admin
        const legheRes = await getLegheUserShared(token, user.id);
        setLegheAdmin(legheRes?.data?.leghe || legheRes?.leghe || []);
        
        // Carica squadre dell'utente
        const squadreRes = await getSquadreUtenteShared(token, user.id);
        setSquadre(squadreRes?.data?.squadre || squadreRes?.squadre || []);
        
        // Carica notifiche
        const notificheRes = await getNotificheShared(token, user.id);
        setNotifiche(notificheRes?.data?.notifiche || notificheRes?.notifiche || []);
        
        // Carica movimenti di mercato per tutte le squadre
        const squadreData = squadreRes?.data?.squadre || squadreRes?.squadre || [];
        const movimentiPromises = squadreData?.map(squadra => 
          getMovimentiMercato(squadra.lega_id, token)
        ) || [];
        
        const movimentiResults = await Promise.all(movimentiPromises);
        const allMovimenti = movimentiResults.flatMap(res => res?.data?.movimenti || res?.movimenti || []);
        setMovimenti(allMovimenti);
        
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    
    loadData();
  }, [user, token]);

  // Funzione per gestire l'ordinamento delle leghe
  const handleSortLeghe = (field) => {
    if (sortFieldLeghe === field) {
      setSortDirectionLeghe(sortDirectionLeghe === 'asc' ? 'desc' : 'asc');
    } else {
      setSortFieldLeghe(field);
      setSortDirectionLeghe('asc');
    }
  };

  // Funzione per gestire l'ordinamento delle squadre
// handleSortSquadre function removed as it's not used

  // Funzione per ordinare le leghe
  const sortLeghe = (legheToSort) => {
    return [...legheToSort].sort((a, b) => {
      let aValue = a[sortFieldLeghe];
      let bValue = b[sortFieldLeghe];
      
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (sortDirectionLeghe === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  // Funzione per ordinare le squadre
  const sortSquadre = (squadreToSort) => {
    return squadreToSort.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortFieldSquadre) {
        case 'nome':
          aValue = a?.nome || 'Nome' || '';
          bValue = b?.nome || 'Nome' || '';
          break;
        case 'club_level':
          aValue = a.club_level || 1;
          bValue = b.club_level || 1;
          break;
        case 'casse_societarie':
          aValue = a.casse_societarie || 0;
          bValue = b.casse_societarie || 0;
          break;
        default:
          aValue = a?.nome || 'Nome' || '';
          bValue = b?.nome || 'Nome' || '';
      }
      
      if (sortDirectionSquadre === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Funzioni helper per la scheda espandibile
  const formatMoney = (value) => {
    if (!value) return 'FM 0';
    return `FM ${value.toLocaleString()}`;
  };

  const getNotificheCount = (squadraId) => {
    return notifiche?.filter(n => n.squadra_id === squadraId).length;
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

  // Se l'utente non è autenticato, mostra la landing page calcistica
  if (!user || !token) {
    return (
      <Container>
        <HeroSection>
          <HeroTitle>TopLeague</HeroTitle>
          <HeroSubtitle>
            La piattaforma definitiva per gestire il tuo Fantacalcio con stile professionale
          </HeroSubtitle>
          <CTAButtons>
            <CTAButton to="/login" $primary>
              Login
            </CTAButton>
            <CTAButton to="/register">
              Registrati
            </CTAButton>
          </CTAButtons>
          {/* --- PULSANTE BOOKMARK SOLO MOBILE --- */}
          <BookmarkButton onClick={() => setShowBookmarkModal(true)}>
            📲 Salva nella Home
          </BookmarkButton>
        </HeroSection>
        {/* --- MODAL ISTRUZIONI --- */}
        {showBookmarkModal && (
          <BookmarkModalOverlay onClick={() => setShowBookmarkModal(false)}>
            <BookmarkModalContent onClick={e => e.stopPropagation()}>
              <BookmarkModalTitle>Aggiungi a Home</BookmarkModalTitle>
              {os === 'ios' ? (
                <BookmarkModalText>
                  Su <b>iPhone/iPad</b>:<br />
                  Premi il pulsante <b>Condividi</b> <span style={{fontSize:'1.3em'}}>⤴️</span> in basso e poi <b>"Aggiungi a Home"</b>.<br /><br />
                  <img src="https://developer.apple.com/design/human-interface-guidelines/images/intro/intro-share-action_2x.png" alt="share" style={{width:60,margin:'0.5em auto'}} />
                </BookmarkModalText>
              ) : os === 'android' ? (
                <BookmarkModalText>
                  Su <b>Android</b>:<br />
                  Premi il menu <b>⋮</b> in alto a destra e poi <b>"Aggiungi a schermata Home"</b>.<br /><br />
                  <img src="https://i.imgur.com/2yQF1Qp.png" alt="android add" style={{width:60,margin:'0.5em auto'}} />
                </BookmarkModalText>
              ) : (
                <BookmarkModalText>
                  Usa questa funzione da un dispositivo mobile per aggiungere TopLeague alla schermata Home!
                </BookmarkModalText>
              )}
              <BookmarkModalClose onClick={() => setShowBookmarkModal(false)}>Chiudi</BookmarkModalClose>
            </BookmarkModalContent>
          </BookmarkModalOverlay>
        )}
      </Container>
    );
  }

  // Se l'utente è autenticato, mostra la dashboard normale
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

  const sortedLegheAdmin = sortLeghe(legheAdmin).slice(0, 3);
  const sortedSquadre = sortSquadre(squadre).slice(0, 3);

  return (
    <Container>
      <Header>
        <WelcomeTitle>Benvenuto in TopLeague</WelcomeTitle>
        <UserInfo>
          <UserName>{user?.nome} {user?.cognome}</UserName>
          <span>•</span>
          <span>{user?.email}</span>
        </UserInfo>
      </Header>

      <ActionsSection>
        <div style={{width: '100%'}}>
          <BannerImg src={process.env.NODE_ENV === 'development' ? '/TLprova.png' : 'https://topleague-frontend-new.onrender.com/TLprova.png'} alt="TopLeague" />
          <ActionsGridCentered>
            <SmallCTAButton to="/crea-lega" $primary>
              Crea Lega
            </SmallCTAButton>
            <SmallCTAButton to="/unisciti-lega">
              Unisciti a Lega
            </SmallCTAButton>
          </ActionsGridCentered>
        </div>
      </ActionsSection>

      {/* Area Manager con scheda espandibile */}
      {squadre?.length || 0 > 0 && (
        <Section>
          <SectionTitle>Area Manager</SectionTitle>
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
              {sortedSquadre?.map(squadra => {
                // Controllo di sicurezza per squadra
                if (!squadra) {
                  console.warn('🔍 Home: Squadra undefined, skipping');
                  return null;
                }
                
                const movimentiLega = getMovimentiByLega(squadra.lega_id);
                const notificheCount = getNotificheCount(squadra.id);
                const isExpanded = expandedSquadra === squadra.id;
                let valoreAttuale = 0;
                let ingaggi = 0;
                let numGiocatori = 0;
                if (Array.isArray(squadra?.giocatori) && (squadra.giocatori?.length || 0) > 0) {
                  valoreAttuale = squadra.giocatori?.reduce((sum, g) => sum + (parseInt(g?.quotazione_attuale) || 0), 0);
                  ingaggi = squadra.giocatori?.reduce((sum, g) => sum + (parseInt(g?.costo_attuale) || 0), 0);
                  numGiocatori = squadra.giocatori?.length || 0;
                } else if (typeof squadra?.numero_giocatori === 'number') {
                  numGiocatori = squadra.numero_giocatori;
                }
                const maxGiocatori = squadra?.max_giocatori || 30;
                const logoUrl = squadra.logo_url;
                const torneoNome = squadra.torneo_nome || 'N/A';
                const casseSocietarie = squadra?.casse_societarie || 0;
                
                return (
                  <React.Fragment key={squadra.id}>
                    <tr>
                      <Td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {logoUrl ? (
                          <img src={`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/uploads/${logoUrl}`} alt="logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#eee' }} />
                        ) : (
                          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0U1RTVFNyIgc3Ryb2tlLXdpZHRoPSIxIi8+CjxwYXRoIGQ9Ik0xNiA4QzE4LjIwOTEgOCAyMCA5Ljc5MDg2IDIwIDEyQzIwIDE0LjIwOTEgMTguMjA5MSAxNiAxNiAxNkMxMy43OTA5IDE2IDEyIDE0LjIwOTEgMTIgMTJDMTIgOS43OTA4NiAxMy43OTA5IDggMTYgOFoiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTggMjRDMTAuMjA5MSAyNCAxMiAyMi4yMDkxIDEyIDIwQzEyIDE3Ljc5MDkgMTAuMjA5MSAxNiA4IDE2QzUuNzkwODYgMTYgNCAxNy43OTA5IDQgMjBDNCAyMi4yMDkxIDUuNzkwODYgMjQgOCAyNFoiIGZpbGw9IiM5OTk5OTkiLz4KPHBhdGggZD0iTTI0IDI0QzI2LjIwOTEgMjQgMjggMjIuMjA5MSAyOCAyMEMyOCAxNy43OTA5IDI2LjIwOTEgMTYgMjQgMTZDMjEuNzkwOSAxNiAyMCAxNy43OTA5IDIwIDIwQzIwIDIyLjIwOTEgMjEuNzkwOSAyNCAyNCAyNFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+" alt="logo" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#eee' }} />
                        )}
                        <span style={{ fontWeight: 600, cursor: 'pointer', color: '#FF8C42' }} onClick={() => navigate(`/gestione-squadra/${squadra.lega_id}`)}>{squadra?.nome || 'Nome'}</span>
                      </Td>
                      <Td>{squadra.club_level || 1}</Td>
                      <Td>{torneoNome}</Td>
                      <Td>FM {ingaggi.toLocaleString()}</Td>
                      <Td><MoneyValue>{casseSocietarie.toLocaleString() || 0} FM</MoneyValue></Td>
                      <Td>FM {valoreAttuale.toLocaleString()}</Td>
                      <Td>{numGiocatori}/{maxGiocatori}</Td>
                      <Td>
                        <ManagerButton onClick={() => handleToggleExpanded(squadra.id)}>
                          {isExpanded ? 'Chiudi' : 'Gestisci'}
                        </ManagerButton>
                      </Td>
                    </tr>
                    {isExpanded && (
                      <ExpandedRow>
                        <ExpandedCell colSpan="8">
                          <ExpandedContent>
                            <ActionButtons>
                              <ActionButton 
                                onClick={() => navigate(`/gestione-squadra/${squadra.lega_id}`)}
                              >
                                Visualizza
                              </ActionButton>
                              <ActionButton 
                                onClick={() => navigate(`/notifiche?squadra=${squadra.id}`)}
                              >
                                Notifiche ({notificheCount})
                              </ActionButton>
                              <ActionButton 
                                onClick={() => navigate(`/proponi-offerta?squadra=${squadra.id}`)}
                              >
                                Proponi Offerta
                              </ActionButton>
                              <ActionButton 
                                onClick={() => navigate(`/richiesta-admin?squadra=${squadra.id}`)}
                              >
                                Richiesta Admin
                              </ActionButton>
                              <ActionButton 
                                onClick={() => navigate(`/log-squadra/${squadra.id}`)}
                              >
                                Log
                              </ActionButton>
                            </ActionButtons>

                            <MarketMovements>
                              <MarketTitle>📢 Ultime 5 Notifiche</MarketTitle>
                              {notifiche?.filter(n => n.squadra_id === squadra.id).slice(0, 5).length === 0 ? (
                                <MovementItem>Nessuna notifica recente</MovementItem>
                              ) : (
                                notifiche?.filter(n => n.squadra_id === squadra.id).slice(0, 5).map((notifica, index) => (
                                  <MovementItem key={index}>
                                    {notifica.titolo}: {notifica.messaggio} - {new Date(notifica.created_at).toLocaleDateString()}
                                  </MovementItem>
                                ))
                              )}
                            </MarketMovements>

                            <MarketMovements>
                              <MarketTitle>📈 Ultimi 5 Movimenti di Mercato</MarketTitle>
                              {(movimentiLega?.length || 0) === 0 ? (
                                <MovementItem>Nessun movimento recente</MovementItem>
                              ) : (
                                movimentiLega?.map((movimento, index) => (
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
        </Section>
      )}

      {/* Area Admin originale */}
      {(legheAdmin?.length || 0) > 0 && (
        <Section>
          <SectionTitle>Area Admin</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldLeghe === 'nome' ? sortDirectionLeghe : null}
                  onClick={() => handleSortLeghe('nome')}
                >
                  Nome Lega
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldLeghe === 'modalita' ? sortDirectionLeghe : null}
                  onClick={() => handleSortLeghe('modalita')}
                >
                  Modalità
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldLeghe === 'is_pubblica' ? sortDirectionLeghe : null}
                  onClick={() => handleSortLeghe('is_pubblica')}
                >
                  Tipo
                </Th>
                <Th 
                  $sortable 
                  $sortDirection={sortFieldLeghe === 'squadre_assegnate' ? sortDirectionLeghe : null}
                  onClick={() => handleSortLeghe('squadre_assegnate')}
                >
                  Squadre
                </Th>
              </tr>
            </thead>
            <tbody>
              {sortedLegheAdmin?.map(lega => (
                <tr key={lega.id}>
                  <Td>
                    <StyledLink to={`/lega/${lega.id}`}>
                      {lega?.nome || 'Nome'}
                    </StyledLink>
                  </Td>
                  <Td>{lega?.modalita || 'N/A'}</Td>
                  <Td>
                    <StatusBadge $status={lega?.is_pubblica || false? 'pubblica' : 'privata'}>
                      {lega?.is_pubblica || false? 'Pubblica' : 'Privata'}
                    </StatusBadge>
                  </Td>
                  <Td>{lega.squadre_assegnate || 0}/{lega.numero_squadre_totali || 0}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>
      )}

      {(notifiche?.length || 0) > 0 && (
        <Section>
          <SectionTitle>Notifiche Recenti</SectionTitle>
          {notifiche.slice(0, 5).map(notifica => (
            <div key={notifica.id} style={{ 
              padding: '1rem', 
              borderBottom: '1px solid #e5e5e7',
              backgroundColor: notifica.letta ? 'transparent' : '#f8f9fa'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                {notifica.titolo}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                {notifica.messaggio}
              </div>
              <div style={{ color: '#999', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {new Date(notifica.created_at).toLocaleDateString('it-IT')}
              </div>
            </div>
          ))}
        </Section>
      )}
    </Container>
  );
};

export default Home; 