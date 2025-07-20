import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getSquadraById, updateSquadra } from '../api/squadre';
import { getGiocatoriBySquadra, deleteGiocatore, transferGiocatore } from '../api/giocatori';
import { checkUser } from '../api/auth';
import UserAutocomplete from '../components/UserAutocomplete';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 0;
`;

const Form = styled.form`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e5e7;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e5e7;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e5e7;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #007AFF;
    color: white;
    
    &:hover {
      background: #0056b3;
    }
  }
  
  &.secondary {
    background: #6c757d;
    color: white;
    
    &:hover {
      background: #545b62;
    }
  }
  
  &.success {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #218838;
    }
  }
  
  &.danger {
    background: #dc3545;
    color: white;
    
    &:hover {
      background: #c82333;
    }
  }
  
  &.warning {
    background: #ffc107;
    color: #212529;
    
    &:hover {
      background: #e0a800;
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 600;
  
  &.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  &.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  &.warning {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
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

const PlayersSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const PlayerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border: 1px solid #e5e5e7;
  border-radius: 6px;
  margin-bottom: 0.25rem;
  background: #f8f9fa;
  transition: all 0.2s;
  
  &:hover {
    background: #e9ecef;
    transform: translateY(-1px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const PlayerName = styled.span`
  font-weight: 600;
  color: #1d1d1f;
  min-width: 150px;
  font-size: 0.95rem;
`;

const PlayerRole = styled.span`
  color: #666;
  font-size: 0.85rem;
  min-width: 80px;
`;

const PlayerTeam = styled.span`
  color: #666;
  font-size: 0.85rem;
  min-width: 120px;
`;

const PlayerValue = styled.span`
  color: #007AFF;
  font-weight: 600;
  min-width: 100px;
  font-size: 0.9rem;
`;

const PlayerActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AddPlayerSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 1.5rem 0;
  text-align: center;
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
`;

// Nuovi styled components per il popup e i filtri
const PopupOverlay = styled.div`
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

const PopupContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const PopupTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #28a745;
  font-size: 1.3rem;
`;

const PopupMessage = styled.p`
  margin: 0 0 1.5rem 0;
  color: #666;
  line-height: 1.5;
`;

const PopupButton = styled.button`
  background: #007AFF;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #0056b3;
  }
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  flex: 1;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const FilterInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e5e5e7;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const FilterSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e5e5e7;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const SortButton = styled.button`
  background: ${props => props.$active ? '#007AFF' : '#f8f9fa'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 2px solid ${props => props.$active ? '#007AFF' : '#e5e5e7'};
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#0056b3' : '#e9ecef'};
  }
`;

const SortDirection = styled.span`
  margin-left: 0.5rem;
  font-size: 0.8rem;
`;

const ModificaSquadraCompleta = () => {
  const { token, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [squadra, setSquadra] = useState(null);
  const [giocatori, setGiocatori] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newOwnerUsername, setNewOwnerUsername] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [squadreLega, setSquadreLega] = useState([]);
  const [transferData, setTransferData] = useState({
    squadra_destinazione_id: '',
    costo: 0,
    ingaggio: 0,
    anni_contratto: 1
  });

  // Stati per filtri e ordinamento
  const [filters, setFilters] = useState({
    nome: '',
    ruolo: '',
    squadra_reale: '',
    ingaggio_min: '',
    ingaggio_max: '',
    costo_min: '',
    costo_max: ''
  });
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: 'asc'
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    casse_societarie: 0,
    club_level: 1,
    is_orfana: false,
    note: ''
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [squadraRes, giocatoriRes] = await Promise.all([
          getSquadraById(id, token),
          getGiocatoriBySquadra(id, token)
        ]);
        
        setSquadra(squadraRes.squadra);
        setGiocatori(giocatoriRes.giocatori || []);
        
        // Popola il form con i dati della squadra
        setFormData({
          nome: squadraRes.squadra?.nome || 'Nome' || '',
          casse_societarie: squadraRes.squadra.casse_societarie || 0,
          club_level: squadraRes.squadra.club_level || 1,
          is_orfana: squadraRes.squadra.is_orfana || false,
          note: squadraRes.squadra.note || ''
        });

        // Carica le squadre della lega per il trasferimento
        if (squadraRes.squadra.lega_id) {
          try {
            const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/squadre/lega/${squadraRes.squadra.lega_id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              const data = await response.json();
              setSquadreLega(data.squadre || []);
            }
          } catch (err) {
            console.error('Errore nel caricamento delle squadre della lega:', err);
          }
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [id, token]);

  // Funzione per ottenere il numero di giocatori di una squadra
  const getPlayerCountForTeam = async (squadraId) => {
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/giocatori/squadra/${squadraId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return data.giocatori ? data.giocatori?.length || 0 : 0;
      }
    } catch (err) {
      console.error('Errore nel conteggio giocatori:', err);
    }
    return 0;
  };

  // Funzione per ottenere il numero massimo di giocatori dalla lega
  const getMaxPlayersForLeague = () => {
    return squadra?.lega?.max_giocatori || 30;
  };

  // Funzioni per filtri e ordinamento
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getFilteredAndSortedGiocatori = () => {
    let filtered = [...giocatori];

    // Applica filtri
    if (filters?.nome) {
      filtered = filtered?.filter(g => 
        (g?.nome || 'Nome').toLowerCase().includes(filters?.nome.toLowerCase())
      );
    }

    if (filters?.ruolo) {
      filtered = filtered?.filter(g => 
        (g?.ruolo || 'Ruolo').toLowerCase().includes(filters?.ruolo.toLowerCase())
      );
    }

    if (filters.squadra_reale) {
      filtered = filtered?.filter(g => 
        g.squadra_reale && g.squadra_reale.toLowerCase().includes(filters.squadra_reale.toLowerCase())
      );
    }

    if (filters.ingaggio_min) {
      filtered = filtered?.filter(g => 
        g.salario >= parseFloat(filters.ingaggio_min)
      );
    }

    if (filters.ingaggio_max) {
      filtered = filtered?.filter(g => 
        g.salario <= parseFloat(filters.ingaggio_max)
      );
    }

    if (filters.costo_min) {
      filtered = filtered?.filter(g => 
        g.costo_attuale >= parseFloat(filters.costo_min)
      );
    }

    if (filters.costo_max) {
      filtered = filtered?.filter(g => 
        g.costo_attuale <= parseFloat(filters.costo_max)
      );
    }

    // Applica ordinamento
    if (sortConfig.field) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.field];
        let bValue = b[sortConfig.field];

        // Gestisci valori nulli/undefined
        if (aValue === null || aValue === undefined) aValue = 0;
        if (bValue === null || bValue === undefined) bValue = 0;

        // Per i campi numerici, confronta direttamente i numeri
        if (sortConfig.field === 'costo_attuale' || sortConfig.field === 'salario') {
          if (sortConfig.direction === 'asc') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        }

        // Per i campi testuali, converti in stringa per il confronto
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();

        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Validazioni
      if (!formData?.nome || 'Nome'.trim()) {
        setError('Il nome della squadra è obbligatorio');
        setSubmitting(false);
        return;
      }

      if (formData.casse_societarie < 0) {
        setError('Le casse societarie non possono essere negative');
        setSubmitting(false);
        return;
      }

      if (formData.club_level < 1 || formData.club_level > 10) {
        setError('Il club level deve essere tra 1 e 10');
        setSubmitting(false);
        return;
      }

      // Se la squadra è orfana e è stato inserito un username, verifica che esista
      if (formData.is_orfana && newOwnerUsername.trim()) {
        try {
          const userCheck = await checkUser(newOwnerUsername);
          if (!userCheck.exists) {
            setError(`L'utente "${newOwnerUsername}" non esiste nel database`);
            setSubmitting(false);
            return;
          }
        } catch (err) {
          setError(`Errore nella verifica dell'utente: ${err.message}`);
          setSubmitting(false);
          return;
        }
      }

      await updateSquadra(id, formData, token);
      setSuccess('Squadra aggiornata con successo!');
      
      // Aggiorna i dati locali
      setSquadra(prev => ({ ...prev, ...formData }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAddPlayer = () => {
    // Verifica il numero massimo di giocatori
    if (!canAddPlayer) {
      setError(`Impossibile aggiungere giocatori. Numero massimo raggiunto (${maxPlayers})`);
      return;
    }
    
    // Naviga alla pagina di creazione giocatore
    navigate(`/crea-giocatore/${id}`);
  };

  const handleDeletePlayer = async (giocatoreId, giocatoreNome) => {
    const confirmed = window.confirm(`Sei sicuro di voler eliminare il giocatore "${giocatoreNome}"? Questa azione non può essere annullata.`);
    
    if (!confirmed) return;
    
    try {
      await deleteGiocatore(giocatoreId, token);
      setSuccess(`Giocatore "${giocatoreNome}" eliminato con successo!`);
      
      // Ricarica la lista dei giocatori
      const giocatoriRes = await getGiocatoriBySquadra(id, token);
      setGiocatori(giocatoriRes.giocatori || []);
    } catch (err) {
      setError(`Errore nell'eliminazione del giocatore: ${err.message}`);
    }
  };

  const handleTransferPlayer = (giocatore) => {
    setSelectedPlayer(giocatore);
    setTransferData({
      squadra_destinazione_id: '',
      costo: giocatore.costo_attuale || 0,
      ingaggio: giocatore.salario || 0,
      anni_contratto: giocatore.anni_contratto || 1
    });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Validazioni
      if (!transferData.squadra_destinazione_id) {
        setError('Seleziona una squadra destinazione');
        setSubmitting(false);
        return;
      }

      // Verifica che la squadra destinazione non sia piena
      const selectedSquadra = squadreLega.find(s => s.id === parseInt(transferData.squadra_destinazione_id));
      const maxPlayersTransfer = getMaxPlayersForLeague();
      if (selectedSquadra && selectedSquadra.num_giocatori >= maxPlayersTransfer) {
        setError(`Numero massimo di giocatori raggiunto (${maxPlayersTransfer}). Impossibile aggiungere nuovi calciatori.`);
        setSubmitting(false);
        return;
      }

      if (transferData.costo < 0) {
        setError('Il costo deve essere un numero positivo');
        setSubmitting(false);
        return;
      }

      if (transferData.ingaggio < 0) {
        setError('L\'ingaggio deve essere un numero positivo');
        setSubmitting(false);
        return;
      }

      if (transferData.anni_contratto < 1) {
        setError('La durata del contratto deve essere almeno 1 anno');
        setSubmitting(false);
        return;
      }

      await transferGiocatore(selectedPlayer.id, transferData, token);
      
      // Mostra popup di successo
      setSuccessMessage(`Giocatore "${selectedPlayer?.nome || 'Nome'}" trasferito con successo!`);
      setShowSuccessPopup(true);
      
      // Chiudi il modal
      setShowTransferModal(false);
      setSelectedPlayer(null);
      
      // Ricarica la lista dei giocatori
      const giocatoriRes = await getGiocatoriBySquadra(id, token);
      setGiocatori(giocatoriRes.giocatori || []);
      
    } catch (err) {
      setError(`Errore nel trasferimento del giocatore: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferCancel = () => {
    setShowTransferModal(false);
    setSelectedPlayer(null);
    setTransferData({
      squadra_destinazione_id: '',
      costo: 0,
      ingaggio: 0,
      anni_contratto: 1
    });
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento squadra...</LoadingContainer>
    </Container>
  );

  if (error && !squadra) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  // Calcola il numero massimo di giocatori e se si può aggiungere
  const maxPlayers = squadra?.lega?.max_giocatori || 30;
  const canAddPlayer = giocatori?.length || 0 < maxPlayers;

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title>Modifica Squadra: {squadra?.nome}</Title>
            <Subtitle>Modifica tutti i dettagli della squadra e dei suoi giocatori</Subtitle>
            <div style={{marginTop: '1rem', fontWeight: 500, color: '#333'}}>
              Proprietario: {squadra?.proprietario_nome || 'Orfana'}
            </div>
          </div>
          <Button 
            type="button" 
            className="success"
            onClick={handleAddPlayer}
            disabled={!canAddPlayer}
            style={{ marginTop: '0.5rem' }}
          >
            + Crea Calciatore
          </Button>
        </div>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormSection>
          <SectionTitle>Informazioni Squadra</SectionTitle>
          
          <FormGroup>
            <Label>Nome Squadra *</Label>
            <Input
              name="nome"
              value={formData?.nome || 'Nome'}
              onChange={handleChange}
              placeholder="Inserisci il nome della squadra"
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Casse Societarie</Label>
            <Input
              name="casse_societarie"
              type="number"
              value={formData.casse_societarie}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Club Level</Label>
            <Select
              name="club_level"
              value={formData.club_level}
              onChange={handleChange}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>
              <input
                type="checkbox"
                name="is_orfana"
                checked={formData.is_orfana}
                onChange={handleChange}
              />
              {' '}Aggiungi nuovo Proprietario?
            </Label>
          </FormGroup>
          
          {formData.is_orfana && (
            <FormGroup>
              <Label>Username Nuovo Proprietario</Label>
              {user?.ruolo === 'superadmin' || user?.ruolo === 'SuperAdmin' ? (
                <UserAutocomplete
                  value={newOwnerUsername}
                  onChange={setNewOwnerUsername}
                  placeholder="Inizia a digitare per cercare un utente..."
                  token={token}
                  legaId={formData.lega_id}
                  onUserSelect={(selectedUser) => {
                    console.log('Utente selezionato:', selectedUser);
                  }}
                />
              ) : (
                <Input
                  name="newOwnerUsername"
                  value={newOwnerUsername}
                  onChange={(e) => setNewOwnerUsername(e.target.value)}
                  placeholder="Inserisci username del nuovo proprietario"
                />
              )}
              {user && (
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Ruolo utente: {user?.ruolo || 'Ruolo'} - Token: {token ? 'Presente' : 'Mancante'}
                </small>
              )}
              <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                {user?.ruolo === 'superadmin' || user?.ruolo === 'SuperAdmin' 
                  ? 'Digita almeno 2 caratteri per vedere i suggerimenti. Gli utenti già nella lega non saranno mostrati.'
                  : 'L\'username verrà verificato nel database prima del salvataggio'
                }
              </small>
            </FormGroup>
          )}
          
          <FormGroup>
            <Label>Note</Label>
            <TextArea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Note aggiuntive sulla squadra..."
            />
          </FormGroup>
        </FormSection>

        {error && <Message className="error">{error}</Message>}
        {success && <Message className="success">{success}</Message>}

        <ButtonGroup>
          <Button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
          <Button type="button" className="secondary" onClick={handleCancel}>
            Annulla
          </Button>
        </ButtonGroup>
      </Form>

      <PlayersSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <SectionTitle>Giocatori ({giocatori?.length || 0}/{maxPlayers})</SectionTitle>
          <Button 
            type="button" 
            className="success"
            onClick={handleAddPlayer}
            disabled={!canAddPlayer}
          >
            Aggiungi Calciatore
          </Button>
        </div>
        
        {!canAddPlayer && (
          <Message className="warning">
            Numero massimo di giocatori raggiunto ({maxPlayers}). Impossibile aggiungere nuovi calciatori.
          </Message>
        )}

        {/* Sezione Filtri */}
        {giocatori?.length || 0 > 0 && (
          <FiltersSection>
            <SectionTitle>Filtri e Ordinamento</SectionTitle>
            
            <FiltersRow>
              <FilterGroup>
                <FilterLabel>Nome Giocatore</FilterLabel>
                <FilterInput
                  type="text"
                  value={filters?.nome || ''}
                  onChange={(e) => handleFilterChange('nome', e.target.value)}
                  placeholder="Cerca per nome..."
                />
              </FilterGroup>
              
              <FilterGroup>
                <FilterLabel>Ruolo</FilterLabel>
                <FilterInput
                  type="text"
                  value={filters?.ruolo || 'Ruolo'}
                  onChange={(e) => handleFilterChange('ruolo', e.target.value)}
                  placeholder="Cerca per ruolo..."
                />
              </FilterGroup>
              
              <FilterGroup>
                <FilterLabel>Squadra Reale</FilterLabel>
                <FilterInput
                  type="text"
                  value={filters.squadra_reale}
                  onChange={(e) => handleFilterChange('squadra_reale', e.target.value)}
                  placeholder="Cerca per squadra reale..."
                />
              </FilterGroup>
            </FiltersRow>
            
            <FiltersRow>
              <FilterGroup>
                <FilterLabel>Ingaggio Minimo (FM)</FilterLabel>
                <FilterInput
                  type="number"
                  value={filters.ingaggio_min}
                  onChange={(e) => handleFilterChange('ingaggio_min', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </FilterGroup>
              
              <FilterGroup>
                <FilterLabel>Ingaggio Massimo (FM)</FilterLabel>
                <FilterInput
                  type="number"
                  value={filters.ingaggio_max}
                  onChange={(e) => handleFilterChange('ingaggio_max', e.target.value)}
                  placeholder="999999"
                  min="0"
                />
              </FilterGroup>
            </FiltersRow>
            
            <FiltersRow>
              <FilterGroup>
                <FilterLabel>Costo Calciatore Minimo (FM)</FilterLabel>
                <FilterInput
                  type="number"
                  value={filters.costo_min}
                  onChange={(e) => handleFilterChange('costo_min', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </FilterGroup>
              
              <FilterGroup>
                <FilterLabel>Costo Calciatore Massimo (FM)</FilterLabel>
                <FilterInput
                  type="number"
                  value={filters.costo_max}
                  onChange={(e) => handleFilterChange('costo_max', e.target.value)}
                  placeholder="999999"
                  min="0"
                />
              </FilterGroup>
            </FiltersRow>
            
            <FiltersRow>
              <FilterGroup>
                <FilterLabel>Ordinamento</FilterLabel>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <SortButton $active={sortConfig.field === 'nome'} onClick={() => handleSort('nome')}>
                    Nome
                    {sortConfig.field === 'nome' && (
                      <SortDirection>{sortConfig.direction === 'asc' ? '↑' : '↓'}</SortDirection>
                    )}
                  </SortButton>
                  
                  <SortButton $active={sortConfig.field === 'ruolo'} onClick={() => handleSort('ruolo')}>
                    Ruolo
                    {sortConfig.field === 'ruolo' && (
                      <SortDirection>{sortConfig.direction === 'asc' ? '↑' : '↓'}</SortDirection>
                    )}
                  </SortButton>
                  
                  <SortButton $active={sortConfig.field === 'squadra_reale'} onClick={() => handleSort('squadra_reale')}>
                    Squadra Reale
                    {sortConfig.field === 'squadra_reale' && (
                      <SortDirection>{sortConfig.direction === 'asc' ? '↑' : '↓'}</SortDirection>
                    )}
                  </SortButton>
                  
                  <SortButton $active={sortConfig.field === 'salario'} onClick={() => handleSort('salario')}>
                    Ingaggio
                    {sortConfig.field === 'salario' && (
                      <SortDirection>{sortConfig.direction === 'asc' ? '↑' : '↓'}</SortDirection>
                    )}
                  </SortButton>
                  
                  <SortButton $active={sortConfig.field === 'costo_attuale'} onClick={() => handleSort('costo_attuale')}>
                    Costo Calciatore
                    {sortConfig.field === 'costo_attuale' && (
                      <SortDirection>{sortConfig.direction === 'asc' ? '↑' : '↓'}</SortDirection>
                    )}
                  </SortButton>
                </div>
              </FilterGroup>
            </FiltersRow>
            
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Giocatori trovati: {getFilteredAndSortedGiocatori().length} di {giocatori?.length || 0}
            </div>
          </FiltersSection>
        )}
        
        {giocatori?.length || 0 === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            Nessun giocatore trovato in questa squadra.
          </p>
        ) : (
          getFilteredAndSortedGiocatori().map(giocatore => (
            <PlayerRow key={giocatore.id}>
              <PlayerInfo>
                <PlayerName>{giocatore?.nome || 'Nome'}</PlayerName>
                <PlayerRole>{giocatore?.ruolo || 'Ruolo'}</PlayerRole>
                <PlayerTeam>{giocatore.squadra_reale}</PlayerTeam>
                <PlayerValue>{giocatore?.costo_attuale?.toLocaleString() || 0} FM</PlayerValue>
              </PlayerInfo>
              
              <PlayerActions>
                <Button 
                  type="button" 
                  className="primary"
                  onClick={() => navigate(`/modifica-giocatore-completa/${giocatore.id}`)}
                >
                  Modifica
                </Button>
                <Button 
                  type="button" 
                  className="secondary"
                  onClick={() => navigate(`/giocatore/${giocatore.id}`)}
                >
                  Visualizza
                </Button>
                <Button 
                  type="button" 
                  className="warning"
                  onClick={() => handleTransferPlayer(giocatore)}
                >
                  Sposta
                </Button>
                <Button 
                  type="button" 
                  className="danger"
                  onClick={() => handleDeletePlayer(giocatore.id, giocatore?.nome || 'Nome')}
                >
                  Elimina
                </Button>
              </PlayerActions>
            </PlayerRow>
          ))
        )}
      </PlayersSection>

      {/* Modal di trasferimento */}
      {showTransferModal && selectedPlayer && (
        <Modal>
          <ModalContent>
            <ModalTitle>Trasferisci {selectedPlayer?.nome || 'Nome'}</ModalTitle>
            <ModalForm onSubmit={handleTransferSubmit}>
              <FormGroup>
                <Label>Spostare in quale squadra?</Label>
                <Select
                  value={transferData.squadra_destinazione_id}
                  onChange={(e) => setTransferData(prev => ({ ...prev, squadra_destinazione_id: e.target.value }))}
                  required
                >
                  <option value="">Seleziona squadra...</option>
                  {squadreLega
                    .filter(s => s.id !== parseInt(id)) // Escludi la squadra corrente
                    .map(squadra => {
                      const maxPlayersModal = getMaxPlayersForLeague();
                      const isFull = squadra.num_giocatori >= maxPlayersModal;
                      return (
                        <option 
                          key={squadra.id} 
                          value={squadra.id}
                          disabled={isFull}
                        >
                          {squadra?.nome || 'Nome'} (Giocatori: {squadra?.num_giocatori || 0}/{maxPlayersModal}, Casse: {squadra?.casse_societarie?.toLocaleString() || 0} FM)
                          {isFull ? ' - COMPLETA' : ''}
                        </option>
                      );
                    })
                  }
                </Select>
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Le squadre con "COMPLETA" hanno raggiunto il numero massimo di giocatori
                </small>
              </FormGroup>

              <FormGroup>
                <Label>Costo (FM)</Label>
                <Input
                  type="number"
                  value={transferData.costo}
                  onChange={(e) => setTransferData(prev => ({ ...prev, costo: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Ingaggio (FM)</Label>
                <Input
                  type="number"
                  value={transferData.ingaggio}
                  onChange={(e) => setTransferData(prev => ({ ...prev, ingaggio: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Contratto (anni)</Label>
                <Input
                  type="number"
                  value={transferData.anni_contratto}
                  onChange={(e) => setTransferData(prev => ({ ...prev, anni_contratto: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                  min="1"
                  max="10"
                  required
                />
              </FormGroup>

              {error && <Message className="error">{error}</Message>}
              {success && <Message className="success">{success}</Message>}

              <ModalButtonGroup>
                <Button type="button" className="secondary" onClick={handleTransferCancel}>
                  Annulla
                </Button>
                <Button type="submit" className="primary" disabled={submitting}>
                  {submitting ? 'Trasferimento...' : 'Trasferisci'}
                </Button>
              </ModalButtonGroup>
            </ModalForm>
          </ModalContent>
        </Modal>
      )}

      {/* Popup di successo per il trasferimento */}
      {showSuccessPopup && (
        <PopupOverlay onClick={() => setShowSuccessPopup(false)}>
          <PopupContent onClick={(e) => e.stopPropagation()}>
            <PopupTitle>Trasferimento Completato</PopupTitle>
            <PopupMessage>{successMessage}</PopupMessage>
            <PopupButton onClick={() => setShowSuccessPopup(false)}>
              OK
            </PopupButton>
          </PopupContent>
        </PopupOverlay>
      )}
    </Container>
  );
};

export default ModificaSquadraCompleta; 