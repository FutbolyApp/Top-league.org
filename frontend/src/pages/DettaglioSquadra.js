import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getSquadraById, joinSquadra, getSquadreByUtente } from '../api/squadre';
import { getLegaById } from '../api/leghe';
import { getGiocatoriBySquadra } from '../api/giocatori';
import { splitRoles, getRoleClass } from '../utils/roleUtils';

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

const TeamTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 1rem 0;
`;

const TeamInfo = styled.div`
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

const TeamStatus = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${props => props.$orphan ? '#ffebee' : '#e8f5e8'};
  color: ${props => props.$orphan ? '#c62828' : '#2e7d32'};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
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

const PlayersSection = styled.div`
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

const PlayersTable = styled.div`
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
`;

const TableCell = styled.td`
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #e5e5e7;
  color: #1d1d1f;
  text-align: center;
`;

const PlayerName = styled.div`
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 0.25rem;
`;

const PlayerRole = styled.span`
  .ruolo-badge {
    display: inline-block;
    padding: 2px 6px;
    margin: 1px;
    border-radius: 5px;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    min-width: 18px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    border: 1px solid rgba(255,255,255,0.18);
    transition: all 0.2s ease;
  }
  
  .ruolo-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.13);
  }
  
  .ruolo-badge:last-child {
    margin-right: 0;
  }
  
  /* Ruoli Serie A Classic */
  .ruolo-p { 
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
    color: white; 
    border-color: #e65100;
  }
  
  .ruolo-d { 
    background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); 
    color: white; 
    border-color: #2e7d32;
  }
  
  .ruolo-c { 
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); 
    color: white; 
    border-color: #1565c0;
  }
  
  .ruolo-a { 
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
    color: white; 
    border-color: #c62828;
  }
  
  /* Ruoli Euroleghe Mantra */
  /* Portieri - Arancione (come P) */
  .ruolo-por { 
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); 
    color: white; 
    border-color: #e65100;
  }
  
  /* Difensori - Palette di verdi */
  .ruolo-dc { 
    background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); 
    color: white; 
    border-color: #0d4f14;
  }
  
  .ruolo-dd { 
    background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%); 
    color: white; 
    border-color: #1b5e20;
  }
  
  .ruolo-ds { 
    background: linear-gradient(135deg, #43a047 0%, #388e3c 100%); 
    color: white; 
    border-color: #2e7d32;
  }
  
  /* Centrocampisti - Palette di blu */
  .ruolo-b { 
    background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%); 
    color: white; 
    border-color: #002171;
  }
  
  .ruolo-e { 
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); 
    color: white; 
    border-color: #0d47a1;
  }
  
  .ruolo-m { 
    background: linear-gradient(135deg, #1e88e5 0%, #1976d2 100%); 
    color: white; 
    border-color: #1565c0;
  }
  
  /* Viola per W e T */
  .ruolo-t { 
    background: linear-gradient(135deg, #8e24aa 0%, #7b1fa2 100%); 
    color: white; 
    border-color: #6a0080;
  }
  
  .ruolo-w { 
    background: linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%); 
    color: white; 
    border-color: #6a0080;
  }
  
  /* Attaccanti - Palette di rossi */
  .ruolo-a { 
    background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); 
    color: white; 
    border-color: #8e0000;
  }
  
  .ruolo-pc { 
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); 
    color: white; 
    border-color: #b71c1c;
  }
  
  /* Fallback */
  .ruolo-default { 
    background: linear-gradient(135deg, #757575 0%, #616161 100%); 
    color: white; 
    border-color: #424242;
  }
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

const JoinButton = styled.button`
  background: #ff9500;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  
  &:hover {
    background: #e6850e;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
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

const PlayerLogo = styled.div`
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

const DettaglioSquadra = ({ setCurrentLeague, setCurrentTeam }) => {
  const { token, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [squadra, setSquadra] = useState(null);
  const [lega, setLega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'ruolo', direction: 'asc' });
  const [userSquadre, setUserSquadre] = useState([]);
  const [hasSquadraInLega, setHasSquadraInLega] = useState(false);

  // Enhanced function to load squad data with robust error handling
  const fetchSquadra = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 [DettaglioSquadra] Inizio caricamento squadra ID:', id);
      console.log('🔍 [DettaglioSquadra] Token disponibile:', !!token);
      
      const res = await getSquadraById(id, token);
      console.log('🔍 [DettaglioSquadra] Risposta API squadra:', res);
      
      // Enhanced response validation
      if (!res || !res.ok) {
        console.error('🚨 [DettaglioSquadra] API error:', {
          endpoint: `/squadre/${id}`,
          status: res?.status,
          error: res?.error,
          data: res?.data
        });
        throw new Error(res?.error || 'Errore nel caricamento della squadra');
      }
      
      // Gestisci sia la risposta diretta che quella wrappata
      const squadraData = res?.data?.squadra || res?.squadra;
      
      if (!squadraData) {
        console.error('🚨 [DettaglioSquadra] Squadra data not found in response:', res);
        throw new Error('Dati squadra non trovati');
      }
      
      console.log('🔍 [DettaglioSquadra] Squadra caricata:', {
        id: squadraData.id,
        nome: squadraData.nome,
        lega_id: squadraData.lega_id
      });
      
      setSquadra(squadraData);
      if (setCurrentTeam) setCurrentTeam(squadraData);
      
      // Enhanced giocatori loading with robust error handling
      if (squadraData?.id) {
        try {
          console.log('🔍 [DettaglioSquadra] Inizio caricamento giocatori per squadra ID:', squadraData.id);
          
          const giocatoriRes = await getGiocatoriBySquadra(squadraData.id, token);
          console.log('🔍 [DettaglioSquadra] Risposta API giocatori completa:', giocatoriRes);
          console.log('🔍 [DettaglioSquadra] Tipo di risposta:', typeof giocatoriRes);
          console.log('🔍 [DettaglioSquadra] È array?', Array.isArray(giocatoriRes));
          
          // Enhanced data extraction with fallback
          let giocatori = [];
          
          if (giocatoriRes && giocatoriRes.ok && giocatoriRes.data) {
            // Se la risposta ha la struttura { ok: true, data: { giocatori: [...] } }
            giocatori = giocatoriRes.data.giocatori || giocatoriRes.data || [];
            console.log('🔍 [DettaglioSquadra] Estratto da giocatoriRes.data:', giocatori);
          } else if (giocatoriRes && giocatoriRes.giocatori) {
            // Se la risposta ha la struttura { giocatori: [...] }
            giocatori = giocatoriRes.giocatori;
            console.log('🔍 [DettaglioSquadra] Estratto da giocatoriRes.giocatori:', giocatori);
          } else if (Array.isArray(giocatoriRes)) {
            // Se la risposta è direttamente un array
            giocatori = giocatoriRes;
            console.log('🔍 [DettaglioSquadra] Estratto diretto (array):', giocatori);
          } else {
            console.log('🔍 [DettaglioSquadra] Nessun dato valido trovato, usando array vuoto:', giocatoriRes);
            giocatori = [];
          }
          
          // Ensure giocatori is always an array
          if (!Array.isArray(giocatori)) {
            console.warn('🔍 [DettaglioSquadra] Giocatori non è un array, convertendo:', giocatori);
            giocatori = [];
          }
          
          console.log('🔍 [DettaglioSquadra] Giocatori finali estratti:', giocatori);
          console.log('🔍 [DettaglioSquadra] Numero giocatori:', giocatori.length);
          
          setSquadra(prevSquadra => ({
            ...prevSquadra,
            giocatori: giocatori
          }));
          
        } catch (err) {
          console.error('🚨 [DettaglioSquadra] Errore nel caricamento giocatori:', {
            error: err.message,
            stack: err.stack,
            squadraId: squadraData.id,
            endpoint: `/giocatori/squadra/${squadraData.id}`
          });
          
          // Enhanced error handling with specific messages
          if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            setError('Errore di connessione. Verifica la tua connessione e riprova.');
          } else if (err.message.includes('401') || err.message.includes('Token')) {
            setError('Sessione scaduta. Effettua di nuovo il login.');
          } else if (err.message.includes('500') || err.message.includes('Errore DB')) {
            setError('Impossibile caricare i calciatori, riprova più tardi.');
          } else {
            setError(`Errore nel caricamento giocatori: ${err.message}`);
          }
          
          // Set empty array as fallback
          setSquadra(prevSquadra => ({
            ...prevSquadra,
            giocatori: []
          }));
        }
      }
      
      // Enhanced lega loading
      if (squadraData?.lega_id) {
        try {
          const legaRes = await getLegaById(squadraData.lega_id, token);
          const lega = legaRes?.data?.lega || legaRes?.lega;
          setLega(lega);
          if (setCurrentLeague) setCurrentLeague(lega);
          
          // Enhanced user squadre loading
          const squadreRes = await getSquadreByUtente(token);
          const squadre = squadreRes?.data?.squadre || squadreRes?.squadre || [];
          setUserSquadre(squadre);
          
          // Verifica se l'utente ha già una squadra in questa lega
          const hasSquadra = squadre?.some(s => s?.lega_id === squadraData?.lega_id);
          setHasSquadraInLega(hasSquadra);
          
        } catch (err) {
          console.error('🚨 [DettaglioSquadra] Errore nel caricamento lega/squadre utente:', err);
          // Don't set error for this, as it's not critical
        }
      }
      
    } catch (err) {
      console.error('🚨 [DettaglioSquadra] Errore generale:', {
        error: err.message,
        stack: err.stack,
        squadraId: id,
        endpoint: `/squadre/${id}`
      });
      
      // Enhanced error handling
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Errore di connessione. Verifica la tua connessione e riprova.');
      } else if (err.message.includes('401') || err.message.includes('Token')) {
        setError('Sessione scaduta. Effettua di nuovo il login.');
      } else if (err.message.includes('404')) {
        setError('Squadra non trovata.');
      } else if (err.message.includes('500') || err.message.includes('Errore DB')) {
        setError('Errore del server. Riprova più tardi.');
      } else {
        setError(err.message || 'Errore nel caricamento della squadra');
      }
    } finally {
      setLoading(false);
    }
  }, [id, token, setCurrentLeague, setCurrentTeam]);

  useEffect(() => {
    if (token) fetchSquadra();
  }, [fetchSquadra]);

  const formatMoney = (value) => {
    if (!value && value !== 0) return 'FM 0';
    // Converti sempre in numero per evitare concatenazioni
    const numValue = parseFloat(value) || 0;
    return `FM ${numValue.toLocaleString()}`;
  };

  const getTeamStats = () => {
    if (!squadra) return {};
    // Usa la funzione getGiocatoriArr per estrarre correttamente i giocatori
    const giocatoriArr = getGiocatoriArr();
    // Valore Squadra: somma di quotazione_attuale di tutti i giocatori
    const valoreSquadra = giocatoriArr.reduce((sum, g) => sum + (g.quotazione_attuale || 0), 0) || 0;
    // Casse Societarie: dalla squadra con controllo di sicurezza
    const casseSocietarie = squadra?.casse_societarie || 0;
    // Ingaggio totale: somma di costo_attuale di tutti i giocatori
    const ingaggioTotale = giocatoriArr.reduce((sum, g) => sum + (g.costo_attuale || 0), 0) || 0;
    return {
      valoreSquadra,
      casseSocietarie,
      ingaggioTotale
    };
  };

  // Funzione per ordinare i giocatori per ruolo
  const sortPlayersByRole = (players) => {
    if (!players) return [];
    
    const isMantra = (lega?.modalita || '').includes('Mantra');
    
    // Definizione dell'ordine dei ruoli
    const roleOrder = isMantra 
      ? ['P', 'Por', 'D', 'Dc', 'B', 'Dd', 'Ds', 'E', 'M', 'C', 'T', 'W', 'A', 'Pc'] // Mantra
      : ['P', 'Por', 'D', 'Dc', 'B', 'Dd', 'Ds', 'E', 'M', 'C', 'T', 'W', 'A', 'Pc']; // Classic
    
    return [...players].sort((a, b) => {
      const roleA = a?.ruolo || 'Ruolo' || '';
      const roleB = b?.ruolo || 'Ruolo' || '';
      
      // Per Euroleghe Mantra, mappa i ruoli complessi ai ruoli base
      let mappedRoleA = roleA;
      let mappedRoleB = roleB;
      
      if (isMantra) {
        // Per ruoli multipli, prendi il primo ruolo
        const firstRoleA = roleA.split(';')[0];
        const firstRoleB = roleB.split(';')[0];
        
        mappedRoleA = firstRoleA;
        mappedRoleB = firstRoleB;
      }
      
      const indexA = roleOrder.indexOf(mappedRoleA);
      const indexB = roleOrder.indexOf(mappedRoleB);
      
      // Se entrambi i ruoli sono nell'ordine definito, ordina per posizione
      if (indexA !== -1 && indexB !== -1) {
        if (indexA === indexB) {
          // Se hanno lo stesso ruolo base, ordina per il ruolo completo
          return roleA.localeCompare(roleB);
        }
        return indexA - indexB;
      }
      
      // Se solo uno è nell'ordine definito, metti quello definito prima
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Se nessuno è nell'ordine definito, ordina alfabeticamente
      return roleA.localeCompare(roleB);
    });
  };

  // Funzione per ottenere la freccia di ordinamento
  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // Funzione per gestire l'ordinamento cliccabile
  const handleSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        // Torna all'ordinamento per ruolo
        setSortConfig({ key: 'ruolo', direction: 'asc' });
        return;
      }
    }
    
    setSortConfig({ key, direction });
  };

  // Funzione per ottenere l'array dei giocatori in modo sicuro
  const getGiocatoriArr = () => {
    if (!squadra) return [];
    
    // Gestione completa di tutti i possibili formati
    if (Array.isArray(squadra.giocatori)) {
      return squadra.giocatori;
    }
    
    if (squadra.giocatori && Array.isArray(squadra.giocatori.giocatori)) {
      return squadra.giocatori.giocatori;
    }
    
    if (squadra.giocatori && squadra.giocatori.data && Array.isArray(squadra.giocatori.data)) {
      return squadra.giocatori.data;
    }
    
    if (squadra.giocatori && squadra.giocatori.data && Array.isArray(squadra.giocatori.data.giocatori)) {
      return squadra.giocatori.data.giocatori;
    }
    
    return [];
  };

  // Funzione per ordinare i giocatori
  const getSortedPlayers = () => {
    const giocatoriArr = getGiocatoriArr();
    if (!giocatoriArr.length) return [];
    
    let sortedPlayers = [...giocatoriArr];
    
    if (sortConfig.key === 'ruolo') {
      return sortPlayersByRole(sortedPlayers);
    }
    
    sortedPlayers.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'nome':
          aValue = `${a?.nome || 'Nome'} ${a?.cognome || ''}`.toLowerCase();
          bValue = `${b?.nome || 'Nome'} ${b?.cognome || ''}`.toLowerCase();
          break;
        case 'ruolo':
          // Per l'ordinamento per ruolo, usa la logica speciale
          const isMantra = (lega?.modalita || '').includes('Mantra');
          const roleOrder = isMantra 
            ? ['P', 'Por', 'D', 'Dc', 'B', 'Dd', 'Ds', 'E', 'M', 'C', 'T', 'W', 'A', 'Pc']
            : ['P', 'Por', 'D', 'Dc', 'B', 'Dd', 'Ds', 'E', 'M', 'C', 'T', 'W', 'A', 'Pc'];
          
          const roleA = a?.ruolo || 'Ruolo' || '';
          const roleB = b?.ruolo || 'Ruolo' || '';
          
          // Per Euroleghe Mantra, mappa i ruoli complessi ai ruoli base
          let mappedRoleA = roleA;
          let mappedRoleB = roleB;
          
          if (isMantra) {
            // Per ruoli multipli, prendi il primo ruolo
            const firstRoleA = roleA.split(';')[0];
            const firstRoleB = roleB.split(';')[0];
            
            mappedRoleA = firstRoleA;
            mappedRoleB = firstRoleB;
          }
          
          const indexA = roleOrder.indexOf(mappedRoleA);
          const indexB = roleOrder.indexOf(mappedRoleB);
          
          if (indexA !== -1 && indexB !== -1) {
            if (indexA === indexB) {
              // Se hanno lo stesso ruolo base, ordina per il ruolo completo
              return sortConfig.direction === 'asc' 
                ? roleA.localeCompare(roleB)
                : roleB.localeCompare(roleA);
            }
            return sortConfig.direction === 'asc' ? indexA - indexB : indexB - indexA;
          }
          
          if (indexA !== -1) return sortConfig.direction === 'asc' ? -1 : 1;
          if (indexB !== -1) return sortConfig.direction === 'asc' ? 1 : -1;
          
          return sortConfig.direction === 'asc' 
            ? roleA.localeCompare(roleB)
            : roleB.localeCompare(roleA);
        case 'r':
          aValue = a.r || 0;
          bValue = b.r || 0;
          break;
        case 'fr':
          aValue = a.fr || 0;
          bValue = b.fr || 0;
          break;
        case 'squadra_reale':
          aValue = a.squadra_reale || '';
          bValue = b.squadra_reale || '';
          break;
        case 'qi':
          aValue = a.qi || 0;
          bValue = b.qi || 0;
          break;
        case 'ingaggio':
          aValue = a.costo_attuale || 0;
          bValue = b.costo_attuale || 0;
          break;
        case 'qa':
          aValue = a.quotazione_attuale || 0;
          bValue = b.quotazione_attuale || 0;
          break;
        case 'fvmp':
          aValue = a.fv_mp || 0;
          bValue = b.fv_mp || 0;
          break;
        case 'anni_contratto':
          aValue = a.anni_contratto || 0;
          bValue = b.anni_contratto || 0;
          break;
        case 'prestito':
          aValue = a.prestito ? 1 : 0;
          bValue = b.prestito ? 1 : 0;
          break;
        case 'triggers':
          aValue = a.triggers || '';
          bValue = b.triggers || '';
          break;
        case 'roster':
          aValue = a.roster || '';
          bValue = b.roster || '';
          break;
        case 'stato_trasferimento':
          aValue = a.stato_trasferimento || '';
          bValue = b.stato_trasferimento || '';
          break;
        case 'stato_prestito':
          aValue = a.stato_prestito || '';
          bValue = b.stato_prestito || '';
          break;
        case 'cantera':
          aValue = a.cantera ? 'Sì' : 'No';
          bValue = b.cantera ? 'Sì' : 'No';
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortedPlayers;
  };

  async function handleJoin() {
    if (!squadra.is_orfana) return;
    
    if (!showRequestForm) {
      setShowRequestForm(true);
      return;
    }
    
    if (!requestMessage.trim()) {
      setError('Inserisci un messaggio per la tua richiesta');
      return;
    }
    
    setJoining(true);
    setError(null);
    
    try {
      await joinSquadra(squadra.id, token, { messaggio: requestMessage });
      setShowRequestForm(false);
      setRequestMessage('');
      // Ricarica i dati della squadra
      const res = await getSquadraById(id, token);
      const squadraData = res?.data?.squadra || res?.squadra;
      setSquadra(squadraData);
    } catch (err) {
      setError(err.message);
    }
    setJoining(false);
  }

  // Funzione per verificare se l'utente può modificare la squadra
  const canEditSquadra = () => {
    if (!user || !lega || !squadra) return false;
    
    // Superadmin può modificare tutto
    if (user?.ruolo || 'Ruolo' === 'superadmin') return true;
    
    // Admin della lega può modificare le squadre della sua lega
    if (user?.ruolo || 'Ruolo' === 'admin' && lega.admin_id === user.id) return true;
    
    // Subadmin può modificare (assumendo che i subadmin abbiano permessi di modifica)
    if (user?.ruolo || 'Ruolo' === 'subadmin') return true;
    
    return false;
  };

  // Funzione per gestire la modifica
  const handleEdit = () => {
    // Per ora naviga a una pagina di modifica (da implementare)
    navigate(`/modifica-squadra/${squadra.id}`);
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento squadra...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  if (!squadra) return (
    <Container>
      <ErrorContainer>Squadra non trovata</ErrorContainer>
    </Container>
  );

  const stats = getTeamStats();

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          {squadra.logo_url ? (
            <img 
              src={`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/uploads/${squadra.logo_url}`} 
              alt="Logo squadra" 
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff9500 0%, #e6850e 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '700',
              border: '2px solid #e5e5e7'
            }}>
              {squadra?.nome || 'Nome'.charAt(0).toUpperCase()}
            </div>
          )}
          <TeamTitle>{squadra?.nome || 'Nome'}</TeamTitle>
        </div>
        
        <TeamInfo>
          <InfoCard>
            <InfoLabel>Club Level</InfoLabel>
            <InfoValue>{squadra.club_level || 1}</InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Lega</InfoLabel>
            <InfoValue>{lega?.nome || 'N/A'}</InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Torneo</InfoLabel>
            <InfoValue>{squadra.torneo || 'N/A'}</InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Giocatori</InfoLabel>
            <InfoValue>{stats.totalPlayers}</InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Proprietario</InfoLabel>
            <InfoValue>
              {squadra.proprietario_username ? (
                <span style={{ color: '#28a745', fontWeight: '600' }}>
                  {squadra.proprietario_username}
                </span>
              ) : (
                <span style={{ color: '#dc3545', fontStyle: 'italic' }}>
                  N/A
                </span>
              )}
            </InfoValue>
          </InfoCard>
          <InfoCard>
            <InfoLabel>Stato</InfoLabel>
            <InfoValue>
              <TeamStatus $orphan={squadra.is_orfana}>
                {squadra.is_orfana ? 'Non Assegnata' : 'Assegnata'}
              </TeamStatus>
            </InfoValue>
          </InfoCard>
        </TeamInfo>

        {squadra.is_orfana && !hasSquadraInLega && (
          <JoinButton onClick={handleJoin} disabled={joining}>
            {joining ? 'Unione in corso...' : 'Unisciti a questa squadra'}
          </JoinButton>
        )}
        
        {canEditSquadra() && (
          <JoinButton 
            onClick={handleEdit}
            style={{ 
              marginLeft: '1rem'
            }}
          >
            Modifica Squadra
          </JoinButton>
        )}
      </Header>

      {/* Form di richiesta */}
      {showRequestForm && squadra.is_orfana && !hasSquadraInLega && (
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#495057' }}>
            Richiesta di unione alla squadra
          </h3>
          <p style={{ marginBottom: '1rem', color: '#6c757d', fontSize: '0.9rem' }}>
            Invia una richiesta all'admin della lega per unirti a questa squadra. 
            L'admin riceverà una notifica e potrà accettare o rifiutare la tua richiesta.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' }}>
              Messaggio per l'admin:
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Spiega perché vuoi unirti a questa squadra..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          
          {error && (
            <div style={{
              color: '#dc3545',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleJoin}
              disabled={joining || !requestMessage.trim()}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: joining || !requestMessage.trim() ? 'not-allowed' : 'pointer',
                opacity: joining || !requestMessage.trim() ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              {joining ? 'Invio in corso...' : 'Invia Richiesta'}
            </button>
            
            <button
              onClick={() => {
                setShowRequestForm(false);
                setRequestMessage('');
                setError(null);
              }}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <StatsGrid>
        <StatCard>
          <StatTitle>Valore Squadra</StatTitle>
          <StatValue>{formatMoney(stats.valoreSquadra)}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Casse Societarie</StatTitle>
          <StatValue>{formatMoney(stats.casseSocietarie)}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Ingaggio Totale</StatTitle>
          <StatValue>{formatMoney(stats.ingaggioTotale)}</StatValue>
        </StatCard>
      </StatsGrid>

      <PlayersSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <SectionTitle>Giocatori della Squadra</SectionTitle>
          <button 
            onClick={fetchSquadra}
            style={{
              background: '#5856d6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            🔄 Aggiorna Dati
          </button>
        </div>
        
        {!getGiocatoriArr().length ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#86868b' }}>
            Nessun giocatore in questa squadra
          </div>
        ) : (
          <PlayersTable>
            <Table>
              <thead>
                <tr>
                  <TableHeader onClick={() => handleSort('nome')}>
                    Giocatore{getSortArrow('nome')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('ruolo')}>
                    Ruolo{getSortArrow('ruolo')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('r')}>
                    M{getSortArrow('r')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('fr')}>
                    FaM{getSortArrow('fr')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('squadra_reale')}>
                    Squadra Reale{getSortArrow('squadra_reale')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('cantera')}>
                    Cantera{getSortArrow('cantera')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('ingaggio')}>
                    Ingaggio{getSortArrow('ingaggio')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('qi')}>
                    QI{getSortArrow('qi')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('qa')}>
                    QA{getSortArrow('qa')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('fvmp')}>
                    FVMp{getSortArrow('fvmp')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('anni_contratto')}>
                    Anni Contratto{getSortArrow('anni_contratto')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('triggers')}>
                    Triggers{getSortArrow('triggers')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('roster')}>
                    Roster{getSortArrow('roster')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('stato_trasferimento')}>
                    St.Trasf{getSortArrow('stato_trasferimento')}
                  </TableHeader>
                  <TableHeader onClick={() => handleSort('stato_prestito')}>
                    St.Prest{getSortArrow('stato_prestito')}
                  </TableHeader>
                </tr>
              </thead>
              <tbody>
                {getSortedPlayers().map(giocatore => (
                  <tr 
                    key={giocatore.id}
                    style={{
                      backgroundColor: (() => {
                        if (giocatore.squadra_prestito_id) {
                          // Giocatore in prestito da un'altra squadra (giallo chiaro)
                          return '#fffbf0';
                        } else if (giocatore.valore_prestito > 0 || giocatore.valore_trasferimento > 0) {
                          // Giocatore della squadra corrente disponibile al prestito/trasferimento (viola molto chiaro)
                          return '#faf5ff';
                        } else {
                          return 'transparent';
                        }
                      })()
                    }}
                  >
                    <TableCell>
                      <ViewButton to={`/giocatore/${giocatore.id}`}>
                        {giocatore?.nome || 'Nome'} {giocatore?.cognome || ''}
                      </ViewButton>
                    </TableCell>
                    <TableCell>
                      <PlayerRole>
                        {splitRoles(giocatore?.ruolo || 'Ruolo').map((ruolo, index) => (
                          <span key={index} className={`ruolo-badge ${getRoleClass(ruolo)}`}>
                            {ruolo}
                          </span>
                        ))}
                      </PlayerRole>
                    </TableCell>
                    <TableCell>{giocatore.r || '-'}</TableCell>
                    <TableCell>{giocatore.fr || '-'}</TableCell>
                    <TableCell>{giocatore.squadra_reale}</TableCell>
                    <TableCell>{giocatore.cantera ? '✔' : '-'}</TableCell>
                    <TableCell>
                      <CostValue>{formatMoney(giocatore.costo_attuale)}</CostValue>
                    </TableCell>
                    <TableCell>{giocatore.qi || '-'}</TableCell>
                    <TableCell>
                      <MoneyValue>{giocatore.quotazione_attuale || '-'}</MoneyValue>
                    </TableCell>
                    <TableCell>{giocatore.fv_mp || '-'}</TableCell>
                    <TableCell>{giocatore.anni_contratto || 0}</TableCell>
                    <TableCell>{giocatore.triggers || '-'}</TableCell>
                    <TableCell>
                      <span style={{
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        backgroundColor: giocatore.roster === 'A' ? '#dbeafe' : '#fef3c7',
                        color: giocatore.roster === 'A' ? '#1e40af' : '#92400e'
                      }}>
                        {giocatore.roster || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {giocatore.valore_trasferimento > 0 ? (
                        <div style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '2px' }}>Costo Trasferimento</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#dc3545' }}>
                            ({formatMoney(giocatore.valore_trasferimento)})
                          </div>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        if (giocatore.squadra_prestito_id) {
                          // Giocatore in prestito da un'altra squadra
                          return (
                            <div style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '2px' }}>In Prestito da</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#28a745' }}>
                                {giocatore.squadra_prestito_nome || 'Sconosciuta'}
                              </div>
                            </div>
                          );
                        } else if (giocatore.valore_prestito > 0) {
                          // Giocatore della squadra corrente disponibile al prestito
                          return (
                            <div style={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
                              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '2px' }}>Costo Prestito</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#28a745' }}>
                                ({formatMoney(giocatore.valore_prestito)})
                              </div>
                            </div>
                          );
                        } else {
                          return '-';
                        }
                      })()}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </PlayersTable>
        )}
      </PlayersSection>
    </Container>
  );
};

export default DettaglioSquadra; 