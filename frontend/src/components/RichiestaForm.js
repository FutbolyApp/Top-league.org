import React, { useState } from 'react';
import styled from 'styled-components';
import { createNotificaAdmin } from '../api/notifiche';
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
  max-width: 500px;
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

const RichiestaForm = ({ lega, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [form, setForm] = useState({
    tipo: '',
    messaggio: '',
    giocatore_id: '',
    squadra_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tipiRichiesta = [
    { value: 'richiesta_trasferimento', label: 'Richiesta Trasferimento' },
    { value: 'richiesta_club', label: 'Richiesta Club Level' },
    { value: 'richiesta_rinnovo', label: 'Richiesta Rinnovo Contratto' },
    { value: 'richiesta_pagamento', label: 'Richiesta Pagamento' },
    { value: 'richiesta_generale', label: 'Richiesta Generale' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tipo || !form.messaggio) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createNotificaAdmin(
        lega.id,
        form.tipo,
        form.messaggio,
        form.giocatore_id || null,
        form.squadra_id || null,
        token
      );
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Modal onClick={onClose}>
      <Content onClick={(e) => e.stopPropagation()}>
        <Title>📝 Nuova Richiesta - {lega?.nome}</Title>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Tipo di Richiesta *</Label>
            <Select name="tipo" value={form.tipo} onChange={handleChange} required>
              <option value="">Seleziona tipo richiesta</option>
              {tipiRichiesta.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Messaggio *</Label>
            <TextArea
              name="messaggio"
              value={form.messaggio}
              onChange={handleChange}
              placeholder="Descrivi la tua richiesta in dettaglio..."
              required
            />
          </FormGroup>

          {form.tipo === 'richiesta_trasferimento' && (
            <FormGroup>
              <Label>ID Giocatore (opzionale)</Label>
              <input
                type="number"
                name="giocatore_id"
                value={form.giocatore_id}
                onChange={handleChange}
                placeholder="ID del giocatore per il trasferimento"
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </FormGroup>
          )}

          {form.tipo === 'richiesta_club' && (
            <FormGroup>
              <Label>ID Squadra (opzionale)</Label>
              <input
                type="number"
                name="squadra_id"
                value={form.squadra_id}
                onChange={handleChange}
                placeholder="ID della squadra per il club level"
                style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </FormGroup>
          )}

          {error && (
            <div style={{ color: '#dc3545', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <ButtonGroup>
            <Button type="submit" disabled={loading}>
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

export default RichiestaForm; 