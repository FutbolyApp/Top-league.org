import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getSquadraById } from '../api/squadre';
import { createGiocatore } from '../api/giocatori';

const Container = styled.div`
  max-width: 800px;
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

const CreaGiocatore = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [squadra, setSquadra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    ruolo: '',
    squadra_reale: '',
    costo_attuale: 0,
    valore_mercato: 0,
    eta: 0,
    nazionalita: '',
    piede: '',
    altezza: 0,
    peso: 0,
    note: ''
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const squadraRes = await getSquadraById(id, token);
        setSquadra(squadraRes.squadra);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (token) fetchData();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Validazioni
      if (!formData.nome.trim()) {
        setError('Il nome del giocatore è obbligatorio');
        setSubmitting(false);
        return;
      }

      if (!formData.ruolo.trim()) {
        setError('Il ruolo del giocatore è obbligatorio');
        setSubmitting(false);
        return;
      }

      if (formData.costo_attuale < 0) {
        setError('Il costo attuale non può essere negativo');
        setSubmitting(false);
        return;
      }

      if (formData.valore_mercato < 0) {
        setError('Il valore di mercato non può essere negativo');
        setSubmitting(false);
        return;
      }

      if (formData.eta < 0 || formData.eta > 100) {
        setError('L\'età deve essere tra 0 e 100');
        setSubmitting(false);
        return;
      }

      // Crea il giocatore
      await createGiocatore({
        ...formData,
        lega_id: squadra.lega_id,
        squadra_id: id
      }, token);

      setSuccess('Giocatore creato con successo!');
      
      // Redirect dopo 2 secondi
      setTimeout(() => {
        navigate(`/modifica-squadra-completa/${id}`);
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/modifica-squadra-completa/${id}`);
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

  return (
    <Container>
      <BackButton onClick={() => navigate(`/modifica-squadra-completa/${id}`)}>
        ← Torna alla squadra
      </BackButton>
      
      <Header>
        <Title>Aggiungi Nuovo Giocatore</Title>
        <Subtitle>Squadra: {squadra?.nome}</Subtitle>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormSection>
          <SectionTitle>Informazioni Base</SectionTitle>
          
          <FormGroup>
            <Label>Nome Completo *</Label>
            <Input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Inserisci il nome completo"
              required
            />
          </FormGroup>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <Label>Ruolo *</Label>
              <Select
                name="ruolo"
                value={formData.ruolo}
                onChange={handleChange}
                required
              >
                <option value="">Seleziona ruolo</option>
                <option value="P">Portiere</option>
                <option value="D">Difensore</option>
                <option value="C">Centrocampista</option>
                <option value="A">Attaccante</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Squadra Reale</Label>
              <Input
                name="squadra_reale"
                value={formData.squadra_reale}
                onChange={handleChange}
                placeholder="Es. Juventus"
              />
            </FormGroup>
          </div>
        </FormSection>

        <FormSection>
          <SectionTitle>Valori Economici</SectionTitle>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <Label>Costo Attuale (€)</Label>
              <Input
                name="costo_attuale"
                type="number"
                value={formData.costo_attuale}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Valore di Mercato (€)</Label>
              <Input
                name="valore_mercato"
                type="number"
                value={formData.valore_mercato}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
            </FormGroup>
          </div>
        </FormSection>

        <FormSection>
          <SectionTitle>Caratteristiche Fisiche</SectionTitle>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <FormGroup>
              <Label>Età</Label>
              <Input
                name="eta"
                type="number"
                value={formData.eta}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Altezza (cm)</Label>
              <Input
                name="altezza"
                type="number"
                value={formData.altezza}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Peso (kg)</Label>
              <Input
                name="peso"
                type="number"
                value={formData.peso}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />
            </FormGroup>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <Label>Nazionalità</Label>
              <Input
                name="nazionalita"
                value={formData.nazionalita}
                onChange={handleChange}
                placeholder="Es. Italiana"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Piede Preferito</Label>
              <Select
                name="piede"
                value={formData.piede}
                onChange={handleChange}
              >
                <option value="">Seleziona</option>
                <option value="Destro">Destro</option>
                <option value="Sinistro">Sinistro</option>
                <option value="Ambidestro">Ambidestro</option>
              </Select>
            </FormGroup>
          </div>
        </FormSection>

        <FormSection>
          <SectionTitle>Note Aggiuntive</SectionTitle>
          
          <FormGroup>
            <Label>Note</Label>
            <TextArea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Note aggiuntive sul giocatore..."
            />
          </FormGroup>
        </FormSection>

        {error && <Message className="error">{error}</Message>}
        {success && <Message className="success">{success}</Message>}

        <ButtonGroup>
          <Button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Creazione...' : 'Crea Giocatore'}
          </Button>
          <Button type="button" className="secondary" onClick={handleCancel}>
            Annulla
          </Button>
        </ButtonGroup>
      </Form>
    </Container>
  );
};

export default CreaGiocatore; 