import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getLegaById, updateLega } from '../api/leghe';

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
  color: #007AFF;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  
  &:hover {
    opacity: 0.7;
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
  margin: 0 0 1rem 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormSection = styled.div`
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

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: #1d1d1f;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1d1d1f;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1d1d1f;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1d1d1f;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #007AFF;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #1d1d1f;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
`;

const Button = styled.button`
  background: #ff9500;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const CancelButton = styled.button`
  background: #e5e5e7;
  color: #1d1d1f;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #d1d1d6;
    transform: translateY(-1px);
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

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const ModificaLega = () => {
  const { token, user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [lega, setLega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    modalita: 'Classic',
    is_pubblica: true,
    password: '',
    max_squadre: 20,
    min_giocatori: 15,
    max_giocatori: 25,
    roster_ab: false,
    cantera: false,
    contratti: false,
    triggers: false
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const res = await getLegaById(id, token);
        
        // Gestione risposta flessibile - supporta sia {lega: {...}} che {...} direttamente
        const legaData = res?.lega || res || {};
        setLega(legaData);
        
        // Inizializza i dati del form
        setFormData({
          nome: legaData?.nome || 'Nome' || '',
          modalita: legaData?.modalita || 'N/A' || 'Classic',
          is_pubblica: legaData?.is_pubblica || true,
          password: legaData?.password || '',
          max_squadre: legaData?.max_squadre || 20,
          min_giocatori: legaData?.min_giocatori || 15,
          max_giocatori: legaData?.max_giocatori || 25,
          roster_ab: legaData?.roster_ab || false || false,
          cantera: legaData?.cantera || false || false,
          contratti: legaData?.contratti || false || false,
          triggers: legaData?.triggers || false || false
        });
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData?.nome?.trim()) {
      setError('Il nome della lega è obbligatorio');
      return false;
    }
    
    if (!formData?.is_pubblica && !formData?.password?.trim()) {
      setError('La password è obbligatoria per le leghe private');
      return false;
    }
    
    if (formData?.max_squadre < 1) {
      setError('Il numero massimo di squadre deve essere almeno 1');
      return false;
    }
    
    if (formData?.min_giocatori < 1) {
      setError('Il numero minimo di giocatori deve essere almeno 1');
      return false;
    }
    
    if (formData?.max_giocatori < formData?.min_giocatori) {
      setError('Il numero massimo di giocatori deve essere maggiore o uguale al minimo');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 ModificaLega: Starting handleSubmit');
    console.log('🔍 ModificaLega: Form data:', formData);
    console.log('🔍 ModificaLega: Token available:', !!token);
    
    if (!validateForm()) {
      console.log('🔍 ModificaLega: Form validation failed');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔍 ModificaLega: Calling updateLega with id:', id);
      await updateLega(id, formData, token);
      console.log('🔍 ModificaLega: updateLega successful');
      setSuccess('Lega aggiornata con successo!');
      
      // Torna alla dashboard appropriata dopo 2 secondi
      setTimeout(() => {
        if (user && user?.ruolo === 'admin') {
          navigate('/area-admin');
        } else {
          navigate('/super-admin-dashboard');
        }
      }, 2000);
      
    } catch (err) {
      console.error('🔍 ModificaLega: Error during update:', err);
      // Gestione specifica per nome duplicato
      if (err.message && err.message.includes('Nome lega duplicato')) {
        setError('Esiste già una lega con questo nome. Scegli un nome diverso.');
      } else if (err.message && err.message.includes('Esiste già una lega con questo nome')) {
        setError('Esiste già una lega con questo nome. Scegli un nome diverso.');
      } else {
        setError(err.message || 'Errore durante l\'aggiornamento della lega');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user && user?.ruolo === 'admin') {
      navigate('/area-admin');
    } else {
      navigate('/super-admin-dashboard');
    }
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento lega...</LoadingContainer>
    </Container>
  );

  if (error && !lega) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  return (
    <Container>
      <BackButton onClick={() => {
        if (user && user?.ruolo === 'admin') {
          navigate('/area-admin');
        } else {
          navigate('/super-admin-dashboard');
        }
      }}>
        ← Torna alla Dashboard
      </BackButton>
      
      <Header>
        <Title>Modifica Lega: {lega?.nome}</Title>
        {success && <SuccessMessage>{success}</SuccessMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormSection>
          <SectionTitle>Informazioni Generali</SectionTitle>
          
          <FormGroup>
            <Label>Nome Lega *</Label>
            <Input
              name="nome"
              value={formData?.nome || 'Nome'}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Modalità</Label>
            <Select
              name="modalita"
              value={formData?.modalita || ''}
              onChange={handleChange}
            >
              <option value="Serie A Classic">Serie A Classic</option>
              <option value="Serie A Mantra">Serie A Mantra</option>
              <option value="Euroleghe Classic">Euroleghe Classic</option>
              <option value="Euroleghe Mantra">Euroleghe Mantra</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Visibilità</Label>
            <Select
              name="is_pubblica"
              value={formData?.is_pubblica || false.toString()}
              onChange={handleChange}
            >
              <option value="true">Pubblica</option>
              <option value="false">Privata</option>
            </Select>
          </FormGroup>
          
          {!formData?.is_pubblica && (
            <FormGroup>
              <Label>Password (obbligatoria per leghe private) *</Label>
              <Input
                name="password"
                type="password"
                value={formData?.password || ''}
                onChange={handleChange}
                placeholder="Inserisci password per accedere"
                required={!formData?.is_pubblica}
              />
            </FormGroup>
          )}
        </FormSection>

        <FormSection>
          <SectionTitle>Configurazione Squadre</SectionTitle>
          
          <FormGroup>
            <Label>Numero Massimo Squadre</Label>
            <Input
              name="max_squadre"
              type="number"
              value={formData?.max_squadre || ''}
              onChange={handleChange}
              min="1"
              max="50"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Numero Minimo Giocatori per Squadra</Label>
            <Input
              name="min_giocatori"
              type="number"
              value={formData?.min_giocatori || ''}
              onChange={handleChange}
              min="1"
              max="50"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Numero Massimo Giocatori per Squadra</Label>
            <Input
              name="max_giocatori"
              type="number"
              value={formData?.max_giocatori || ''}
              onChange={handleChange}
              min="1"
              max="50"
            />
          </FormGroup>
        </FormSection>

        <FormSection>
          <SectionTitle>Funzionalità Avanzate</SectionTitle>
          
          <CheckboxGroup>
            <CheckboxLabel>
              <Checkbox
                name="roster_ab"
                type="checkbox"
                checked={formData?.roster_ab || false}
                onChange={handleChange}
              />
              Roster A/B
            </CheckboxLabel>
            
            <CheckboxLabel>
              <Checkbox
                name="cantera"
                type="checkbox"
                checked={formData?.cantera || false}
                onChange={handleChange}
              />
              Cantera
            </CheckboxLabel>
            
            <CheckboxLabel>
              <Checkbox
                name="contratti"
                type="checkbox"
                checked={formData?.contratti || false}
                onChange={handleChange}
              />
              Contratti
            </CheckboxLabel>
            
            <CheckboxLabel>
              <Checkbox
                name="triggers"
                type="checkbox"
                checked={formData?.triggers || false}
                onChange={handleChange}
              />
              Triggers
            </CheckboxLabel>
          </CheckboxGroup>
        </FormSection>

        <FormSection>
          <SectionTitle>🏆 Gestione Squadre</SectionTitle>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Gestisci le squadre di questa lega. Puoi modificare i dettagli di ogni squadra e i suoi giocatori.
          </p>
          
          <Button 
            type="button" 
            onClick={() => navigate(`/gestione-squadre-lega/${id}`)}
            style={{ background: '#28a745' }}
          >
            🏃‍♂️ Gestisci Squadre
          </Button>
        </FormSection>

        <ButtonGroup>
          <CancelButton type="button" onClick={handleCancel}>
            Annulla
          </CancelButton>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salva Modifiche'}
          </Button>
        </ButtonGroup>
      </Form>
    </Container>
  );
};

export default ModificaLega; 