import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getTorneiLega, createTorneo, updateTorneo, deleteTorneo } from '../api/tornei';
import { getSquadreByLega } from '../api/squadre';

// Animazioni
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  color: #2d3748;
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Stats = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  text-align: center;
  min-width: 120px;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const BackButton = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  margin-bottom: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
  }
  
  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${fadeIn} 0.6s ease-out;
`;

const AnimatedCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${slideIn} 0.4s ease-out;
`;

const CardTitle = styled.h3`
  color: #2d3748;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TorneiGrid = styled.div`
  display: grid;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const TorneoCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }
`;

const TorneoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const TorneoName = styled.h4`
  color: #2d3748;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const TorneoStatus = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'in_corso': return 'linear-gradient(135deg, #48bb78, #38a169)';
      case 'programmato': return 'linear-gradient(135deg, #ed8936, #dd6b20)';
      case 'completato': return 'linear-gradient(135deg, #718096, #4a5568)';
      default: return 'linear-gradient(135deg, #718096, #4a5568)';
    }
  }};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TorneoInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: #718096;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 0.9rem;
  color: #2d3748;
  font-weight: 600;
`;

const TorneoActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
  min-width: 200px;
`;

const ActionButton = styled.button`
  background: ${props => props.$variant === 'danger' ? 'linear-gradient(135deg, #f56565, #e53e3e)' : 
    props.$variant === 'primary' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 
    'linear-gradient(135deg, #718096, #4a5568)'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  white-space: nowrap;
  min-width: 80px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormSection = styled.div`
  background: #f7fafc;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h4`
  color: #2d3748;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &::after {
    content: ${props => props.required ? '"*"' : '""'};
    color: #e53e3e;
    margin-left: 0.25rem;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &.error {
    border-color: #e53e3e;
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &.error {
    border-color: #e53e3e;
    box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: all 0.2s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const SquadreContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: white;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
`;

const SquadreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
`;

const SquadreCount = styled.span`
  font-size: 0.9rem;
  color: #667eea;
  font-weight: 600;
  background: #edf2f7;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.75rem 0;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f7fafc;
  }
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
`;

const CheckboxLabel = styled.label`
  cursor: pointer;
  font-size: 0.95rem;
  color: #2d3748;
  font-weight: 500;
  flex: 1;
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
  }
  
  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CancelButton = styled.button`
  background: linear-gradient(135deg, #718096, #4a5568);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(113, 128, 150, 0.4);
  }
`;

const Message = styled.div`
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ErrorMessage = styled(Message)`
  background: linear-gradient(135deg, #fed7d7, #feb2b2);
  color: #c53030;
  border: 1px solid #feb2b2;
`;

const SuccessMessage = styled(Message)`
  background: linear-gradient(135deg, #c6f6d5, #9ae6b4);
  color: #22543d;
  border: 1px solid #9ae6b4;
`;

const WarningMessage = styled(Message)`
  background: linear-gradient(135deg, #fef5e7, #fbd38d);
  color: #744210;
  border: 1px solid #fbd38d;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: white;
  margin: 3rem 0;
  animation: ${pulse} 2s infinite;
`;

const EmptyState = styled.div`
  text-align: center;
  margin: 3rem 0;
  color: #718096;
  
  h3 {
    color: #2d3748;
    margin-bottom: 0.5rem;
  }
`;

const GestioneTornei = () => {
  const { legaId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tornei, setTornei] = useState([]);
  const [squadre, setSquadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTorneo, setEditingTorneo] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'campionato',
    formato: 'girone_unico',
    giornate_totali: 1,
    data_inizio: '',
    descrizione: '',
    squadre_partecipanti: [],
    informazioni_utente: ''
  });

  useEffect(() => {
    loadData();
  }, [legaId, loadData]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [torneiRes, squadreRes] = await Promise.all([
        getTorneiLega(legaId, token),
        getSquadreByLega(legaId, token)
      ]);
      setTornei(torneiRes.tornei || []);
      setSquadre(squadreRes.squadre || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setErrorMessage('Errore nel caricamento dei dati. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, [legaId, token]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Il nome del torneo è obbligatorio';
    }
    
    if (!formData.data_inizio) {
      newErrors.data_inizio = 'La data di inizio è obbligatoria';
    }
    
    if (formData.giornate_totali < 1) {
      newErrors.giornate_totali = 'Le giornate totali devono essere almeno 1';
    }
    
    if (formData.squadre_partecipanti.length < 2) {
      newErrors.squadre_partecipanti = 'Seleziona almeno 2 squadre per il torneo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrorMessage('');
    setSuccessMessage('');
    setWarningMessage('');
    
    if (!validateForm()) {
      setErrorMessage('Correggi gli errori nel form prima di procedere.');
      return;
    }
    
    try {
      const torneoData = {
        ...formData,
        lega_id: legaId,
        squadre_partecipanti: formData.squadre_partecipanti
      };

      if (editingTorneo) {
        await updateTorneo(editingTorneo.id, torneoData, token);
        setSuccessMessage('Torneo aggiornato con successo!');
      } else {
        await createTorneo(torneoData, token);
        setSuccessMessage('Torneo creato con successo!');
      }
      
      setShowForm(false);
      setEditingTorneo(null);
      resetForm();
      await loadData();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Errore salvataggio torneo:', error);
      setErrorMessage('Errore nel salvataggio del torneo. Riprova più tardi.');
    }
  };

  const handleEdit = (torneo) => {
    setEditingTorneo(torneo);
    setFormData({
      nome: torneo.nome || '',
      tipo: torneo.tipo || 'campionato',
      formato: torneo.formato || 'girone_unico',
      giornate_totali: torneo.giornate_totali || 1,
      data_inizio: torneo.data_inizio ? torneo.data_inizio.split('T')[0] : '',
      descrizione: torneo.descrizione || '',
      squadre_partecipanti: torneo.squadre_partecipanti?.map(s => s.id) || [],
      informazioni_utente: torneo.informazioni_utente || ''
    });
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (torneoId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo torneo? Questa azione non può essere annullata.')) {
      return;
    }
    
    try {
      await deleteTorneo(torneoId, token);
      setSuccessMessage('Torneo eliminato con successo!');
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Errore eliminazione torneo:', error);
      setErrorMessage('Errore nell\'eliminazione del torneo. Riprova più tardi.');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'campionato',
      formato: 'girone_unico',
      giornate_totali: 1,
      data_inizio: '',
      descrizione: '',
      squadre_partecipanti: [],
      informazioni_utente: ''
    });
    setErrors({});
  };

  const handleSquadraToggle = (squadraId) => {
    setFormData(prev => ({
      ...prev,
      squadre_partecipanti: prev.squadre_partecipanti.includes(squadraId)
        ? prev.squadre_partecipanti.filter(id => id !== squadraId)
        : [...prev.squadre_partecipanti, squadraId]
    }));
    
    if (formData.squadre_partecipanti.length >= 1) {
      setErrors(prev => ({ ...prev, squadre_partecipanti: undefined }));
    }
  };

  const handleShowForm = () => {
    if (squadre.length === 0) {
      setWarningMessage('Non ci sono squadre disponibili in questa lega. Crea prima delle squadre.');
      return;
    }
    setShowForm(true);
    setEditingTorneo(null);
    resetForm();
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Caricamento tornei...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Content>
        <BackButton onClick={() => navigate(-1)}>
          ← Torna Indietro
        </BackButton>
        <Header>
          <div>
            <Title>Gestione Tornei</Title>
            <p style={{ color: '#718096', margin: '0.5rem 0 0 0' }}>
              Crea e gestisci i tornei della tua lega
            </p>
          </div>
          <Stats>
            <StatCard>
              <StatNumber>{tornei.length}</StatNumber>
              <StatLabel>Tornei</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>{squadre.length}</StatNumber>
              <StatLabel>Squadre</StatLabel>
            </StatCard>
          </Stats>
        </Header>

        {errorMessage && (
          <ErrorMessage>
            <span>⚠️</span>
            {errorMessage}
          </ErrorMessage>
        )}
        
        {successMessage && (
          <SuccessMessage>
            <span>✅</span>
            {successMessage}
          </SuccessMessage>
        )}
        
        {warningMessage && (
          <WarningMessage>
            <span>⚠️</span>
            {warningMessage}
          </WarningMessage>
        )}

        <Grid>
          {/* Lista Tornei */}
          <Card>
            <CardTitle>
              Tornei Esistenti
            </CardTitle>
            
            {tornei.length === 0 ? (
              <EmptyState>
                <h3>Nessun torneo creato</h3>
                <p>Crea il tuo primo torneo per iniziare a competere!</p>
                <CreateButton onClick={handleShowForm} disabled={squadre.length === 0}>
                  Crea Primo Torneo
                </CreateButton>
              </EmptyState>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: '#718096', fontSize: '0.9rem' }}>
                    {tornei.length} torneo{tornei.length !== 1 ? 'i' : ''} trovato{tornei.length !== 1 ? 'i' : ''}
                  </span>
                  <CreateButton onClick={handleShowForm} disabled={squadre.length === 0}>
                    + Nuovo Torneo
                  </CreateButton>
                </div>
                
                <TorneiGrid>
                  {tornei.map(torneo => (
                    <TorneoCard key={torneo.id}>
                      <TorneoHeader>
                        <TorneoName>{torneo.nome}</TorneoName>
                        <TorneoStatus $status={torneo.stato}>
                          {torneo.stato === 'in_corso' && 'In Corso'}
                          {torneo.stato === 'programmato' && 'Programmato'}
                          {torneo.stato === 'completato' && 'Completato'}
                        </TorneoStatus>
                      </TorneoHeader>
                      
                      {torneo.descrizione && (
                        <p style={{ color: '#718096', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                          {torneo.descrizione}
                        </p>
                      )}
                      
                      <TorneoInfo>
                        <InfoItem>
                          <InfoLabel>Tipo</InfoLabel>
                          <InfoValue>{torneo.tipo}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                          <InfoLabel>Formato</InfoLabel>
                          <InfoValue>{torneo.formato}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                          <InfoLabel>Giornate</InfoLabel>
                          <InfoValue>{torneo.giornate_totali}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                          <InfoLabel>Squadre</InfoLabel>
                          <InfoValue>{torneo.squadre_partecipanti?.length || 0}</InfoValue>
                        </InfoItem>
                      </TorneoInfo>
                      
                      <TorneoActions>
                        <ActionButton onClick={() => navigate(`/torneo/${torneo.id}`)}>
                          Visualizza
                        </ActionButton>
                        <ActionButton $variant="primary" onClick={() => handleEdit(torneo)}>
                          Modifica
                        </ActionButton>
                        <ActionButton 
                          $variant="danger"
                          onClick={() => handleDelete(torneo.id)}
                        >
                          Elimina
                        </ActionButton>
                      </TorneoActions>
                    </TorneoCard>
                  ))}
                </TorneiGrid>
              </>
            )}
          </Card>

          {/* Form Creazione/Modifica */}
          {showForm && (
            <AnimatedCard>
              <CardTitle>
                {editingTorneo ? 'Modifica Torneo' : 'Nuovo Torneo'}
              </CardTitle>
              
              <Form onSubmit={handleSubmit}>
                <FormSection>
                  <SectionTitle>
                    Informazioni Base
                  </SectionTitle>
                  
                  <FormGrid>
                    <FormGroup>
                      <Label required>Nome Torneo</Label>
                      <Input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        className={errors.nome ? 'error' : ''}
                        placeholder="Es: Campionato 2024"
                      />
                      {errors.nome && <div style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{errors.nome}</div>}
                    </FormGroup>

                    <FormGroup>
                      <Label required>Data Inizio</Label>
                      <Input
                        type="date"
                        value={formData.data_inizio}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_inizio: e.target.value }))}
                        className={errors.data_inizio ? 'error' : ''}
                      />
                      {errors.data_inizio && <div style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{errors.data_inizio}</div>}
                    </FormGroup>
                  </FormGrid>

                  <FormGroup>
                    <Label>Descrizione</Label>
                    <Textarea
                      value={formData.descrizione}
                      onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                      placeholder="Descrizione del torneo..."
                    />
                  </FormGroup>
                </FormSection>

                <FormSection>
                  <SectionTitle>
                    Configurazione
                  </SectionTitle>
                  
                  <FormGrid>
                    <FormGroup>
                      <Label>Tipo Torneo</Label>
                      <Select
                        value={formData.tipo}
                        onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                      >
                        <option value="campionato">Campionato</option>
                        <option value="coppa">Coppa</option>
                        <option value="amichevole">Amichevole</option>
                        <option value="playoff">Playoff</option>
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <Label>Formato</Label>
                      <Select
                        value={formData.formato}
                        onChange={(e) => setFormData(prev => ({ ...prev, formato: e.target.value }))}
                      >
                        <option value="girone_unico">Girone Unico</option>
                        <option value="andata_ritorno">Andata e Ritorno</option>
                        <option value="eliminazione">Eliminazione Diretta</option>
                        <option value="misto">Misto</option>
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <Label required>Giornate Totali</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.giornate_totali}
                        onChange={(e) => setFormData(prev => ({ ...prev, giornate_totali: parseInt(e.target.value) }))}
                        className={errors.giornate_totali ? 'error' : ''}
                      />
                      {errors.giornate_totali && <div style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{errors.giornate_totali}</div>}
                    </FormGroup>
                  </FormGrid>
                </FormSection>

                <FormSection>
                  <SectionTitle>
                    Squadre Partecipanti
                  </SectionTitle>
                  
                  <SquadreContainer>
                    <SquadreHeader>
                      <span>Squadre disponibili</span>
                      <SquadreCount>
                        {formData.squadre_partecipanti.length} selezionate di {squadre.length}
                      </SquadreCount>
                    </SquadreHeader>
                    {squadre.map(squadra => (
                      <CheckboxContainer key={squadra.id}>
                        <Checkbox
                          type="checkbox"
                          id={`squadra-${squadra.id}`}
                          checked={formData.squadre_partecipanti.includes(squadra.id)}
                          onChange={() => handleSquadraToggle(squadra.id)}
                        />
                        <CheckboxLabel htmlFor={`squadra-${squadra.id}`}>
                          {squadra.nome}
                          {squadra.proprietario_username && (
                            <span style={{ color: '#718096', fontSize: '0.8rem' }}>
                              {' '}({squadra.proprietario_username})
                            </span>
                          )}
                        </CheckboxLabel>
                      </CheckboxContainer>
                    ))}
                  </SquadreContainer>
                  {errors.squadre_partecipanti && (
                    <div style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{errors.squadre_partecipanti}</div>
                  )}
                </FormSection>

                <FormSection>
                  <SectionTitle>
                    Informazioni Utenti
                  </SectionTitle>
                  
                  <FormGroup>
                    <Label>Informazioni per gli Utenti</Label>
                    <Textarea
                      value={formData.informazioni_utente}
                      onChange={(e) => setFormData(prev => ({ ...prev, informazioni_utente: e.target.value }))}
                      placeholder="Informazioni che verranno mostrate agli utenti quando visualizzano il torneo..."
                    />
                  </FormGroup>
                </FormSection>

                <FormActions>
                  <CancelButton 
                    type="button" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingTorneo(null);
                      resetForm();
                      setErrorMessage('');
                      setSuccessMessage('');
                      setWarningMessage('');
                    }}
                  >
                    Annulla
                  </CancelButton>
                  <SubmitButton 
                    type="submit"
                    disabled={formData.squadre_partecipanti.length < 2}
                  >
                    {editingTorneo ? 'Aggiorna Torneo' : 'Crea Torneo'}
                  </SubmitButton>
                </FormActions>
              </Form>
            </AnimatedCard>
          )}
        </Grid>
      </Content>
    </Container>
  );
};

export default GestioneTornei; 