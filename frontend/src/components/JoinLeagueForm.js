import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { richiediIngresso, getSquadreDisponibili } from '../api/leghe';
import { useAuth } from './AuthContext';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Content = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const Title = styled.h2`
  color: #333;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  background: ${props => props.$secondary ? '#6c757d' : 'linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%)'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LeagueInfo = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const LeagueName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
`;

const LeagueDetails = styled.div`
  color: #666;
  font-size: 0.9rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const TeamSelectionSection = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const TeamSelectionTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1rem;
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TeamOption = styled.div`
  border: 2px solid ${props => {
    if (props.$selected) return '#FFA94D';
    if (props.$available) return '#28a745';
    return '#6c757d';
  }};
  border-radius: 6px;
  padding: 0.5rem;
  background: ${props => {
    if (props.$selected) return '#fff3e0';
    if (props.$available) return '#f8fff9';
    return '#f8f9fa';
  }};
  cursor: ${props => props.$available ? 'pointer' : 'not-allowed'};
  transition: all 0.2s;
  opacity: ${props => props.$available ? 1 : 0.6};
  
  &:hover {
    ${props => props.$available && `
      border-color: #FFA94D;
      background: #fff3e0;
    `}
  }
`;

const TeamName = styled.div`
  font-weight: 600;
  color: #333;
  font-size: 0.85rem;
  text-align: center;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TeamStatus = styled.div`
  font-size: 0.7rem;
  color: ${props => props.$available ? '#28a745' : '#6c757d'};
  font-weight: 500;
  text-align: center;
  text-transform: uppercase;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 2rem;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
`;

const JoinLeagueForm = ({ lega, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [form, setForm] = useState({
    messaggio: '',
    password: '',
    squadra_id: ''
  });
  const [squadreDisponibili, setSquadreDisponibili] = useState([]);
  const [squadreAssegnate, setSquadreAssegnate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSquadre, setLoadingSquadre] = useState(true);
  const [error, setError] = useState('');

  // Carica le squadre disponibili quando il componente si monta
  useEffect(() => {
    const loadSquadreDisponibili = async () => {
      try {
        setLoadingSquadre(true);
        const response = await getSquadreDisponibili(lega.id, token);
        setSquadreDisponibili(response.squadre_disponibili || []);
        setSquadreAssegnate(response.squadre_assegnate || []);
      } catch (err) {
        setError('Errore nel caricamento delle squadre disponibili');
        console.error('Errore nel caricamento squadre:', err);
      } finally {
        setLoadingSquadre(false);
      }
    };

    loadSquadreDisponibili();
  }, [lega.id, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.squadra_id) {
      setError('Seleziona una squadra');
      return;
    }
    if (!form.messaggio) {
      setError('Inserisci un messaggio per la tua richiesta');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        messaggio: form.messaggio,
        squadra_id: form.squadra_id
      };
      
      // Aggiungi password solo se la lega non è pubblica
      if (!lega.is_pubblica && form.password) {
        data.password = form.password;
      }

      await richiediIngresso(lega.id, data, token);
      
      const squadraSelezionata = squadreDisponibili.find(s => s.id === parseInt(form.squadra_id));
      onSuccess(`Richiesta di ingresso inviata con successo per la squadra "${squadraSelezionata?.nome}" nella lega "${lega.nome}"!`);
      onClose();
    } catch (err) {
      setError(err.message || 'Errore nell\'invio della richiesta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTeamSelect = (squadraId) => {
    setForm(prev => ({ ...prev, squadra_id: squadraId.toString() }));
  };

  if (loadingSquadre) {
    return (
      <Modal onClick={onClose}>
        <Content onClick={(e) => e.stopPropagation()}>
          <LoadingMessage>Caricamento squadre disponibili...</LoadingMessage>
        </Content>
      </Modal>
    );
  }

  const tutteLeSquadre = [...squadreDisponibili, ...squadreAssegnate];

  return (
    <Modal onClick={onClose}>
      <Content onClick={(e) => e.stopPropagation()}>
        <Title>🔗 Richiedi Ingresso - {lega?.nome}</Title>
        
        <LeagueInfo>
          <LeagueName>{lega?.nome}</LeagueName>
          <LeagueDetails>
            <span>Modalità: {lega??.modalita || '' || ''}</span>
            <span>Tipo: {lega?.is_pubblica ? 'Pubblica' : 'Privata'}</span>
            <span>Squadre: {lega?.squadre_assegnate || 0}/{lega?.numero_squadre_totali || 0}</span>
          </LeagueDetails>
        </LeagueInfo>

        <TeamSelectionSection>
          <TeamSelectionTitle>Seleziona una Squadra Disponibile *</TeamSelectionTitle>
          
          {tutteLeSquadre.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>
              Nessuna squadra in questa lega.
            </div>
          ) : (
            <TeamGrid>
              {tutteLeSquadre.map(squadra => {
                const isAvailable = squadra.is_orfana === 1;
                const isSelected = form.squadra_id === squadra.id.toString();
                
                return (
                  <TeamOption
                    key={squadra.id}
                    $selected={isSelected}
                    $available={isAvailable}
                    onClick={() => isAvailable && handleTeamSelect(squadra.id)}
                  >
                    <TeamName>{squadra.nome}</TeamName>
                    <TeamStatus $available={isAvailable}>
                      {isAvailable ? 'Disponibile' : 'Assegnata'}
                    </TeamStatus>
                  </TeamOption>
                );
              })}
            </TeamGrid>
          )}
        </TeamSelectionSection>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Messaggio di Presentazione *</Label>
            <TextArea
              name="messaggio"
              value={form.messaggio}
              onChange={handleChange}
              placeholder="Presentati e spiega perché vorresti unirti a questa lega..."
              required
            />
          </FormGroup>

          {!lega?.is_pubblica && (
            <FormGroup>
              <Label>Password Lega (se richiesta)</Label>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Inserisci la password della lega se richiesta"
              />
            </FormGroup>
          )}

          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}

          <ButtonGroup>
            <Button type="submit" disabled={loading || !form.squadra_id}>
              {loading ? 'Invio...' : 'Invia Richiesta'}
            </Button>
            <Button type="button" $secondary onClick={onClose}>
              Annulla
            </Button>
          </ButtonGroup>
        </Form>
      </Content>
    </Modal>
  );
};

export default JoinLeagueForm; 