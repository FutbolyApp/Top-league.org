import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { register as apiRegister, checkAvailability } from '../api/auth';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RegisterCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 600px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LogoTitle = styled.h1`
  color: #5856d6;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  margin-bottom: 0.5rem;
`;

const LogoSubtitle = styled.p`
  color: #86868b;
  margin: 0;
  font-size: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #1d1d1f;
  font-weight: 600;
  font-size: 0.9rem;
`;

const Required = styled.span`
  color: #dc3545;
  margin-left: 4px;
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
    border-color: #5856d6;
  }
  
  &::placeholder {
    color: #86868b;
  }
  
  &.valid {
    border-color: #28a745;
  }
  
  &.invalid {
    border-color: #dc3545;
  }
  
  &.checking {
    border-color: #ffc107;
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
    border-color: #5856d6;
  }
`;

const Button = styled.button`
  background: #5856d6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #4a4ac4;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  font-size: 0.9rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #c3e6cb;
  font-size: 0.9rem;
  text-align: center;
`;

const LoginLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 1.5rem;
  color: #5856d6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #4a4ac4;
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: #86868b;
  font-size: 0.9rem;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e5e7;
  }
  
  &::before {
    margin-right: 1rem;
  }
  
  &::after {
    margin-left: 1rem;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h3`
  color: #1d1d1f;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
`;

const ValidationMessage = styled.div`
  font-size: 0.8rem;
  margin-top: 0.25rem;
  
  &.valid {
    color: #28a745;
  }
  
  &.invalid {
    color: #dc3545;
  }
  
  &.checking {
    color: #ffc107;
  }
`;

function Register() {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    username: '',
    email: '',
    password: '',
    confermaPassword: '',
    provenienza: '',
    squadra_cuore: '',
    come_conosciuto: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState({
    email: { status: 'neutral', message: '' },
    username: { status: 'neutral', message: '' }
  });
  const navigate = useNavigate();

  // Debounce per le validazioni
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email && formData.email.includes('@')) {
        checkEmailAvailability(formData.email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username && formData.username.length >= 3) {
        checkUsernameAvailability(formData.username);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const checkEmailAvailability = async (email) => {
    setValidation(prev => ({
      ...prev,
      email: { status: 'checking', message: 'Verificando disponibilità...' }
    }));

    try {
      const response = await checkAvailability({ email });
      setValidation(prev => ({
        ...prev,
        email: { 
          status: response.email.available ? 'valid' : 'invalid', 
          message: response.email.message 
        }
      }));
    } catch (err) {
      setValidation(prev => ({
        ...prev,
        email: { status: 'neutral', message: '' }
      }));
    }
  };

  const checkUsernameAvailability = async (username) => {
    setValidation(prev => ({
      ...prev,
      username: { status: 'checking', message: 'Verificando disponibilità...' }
    }));

    try {
      const response = await checkAvailability({ username });
      setValidation(prev => ({
        ...prev,
        username: { 
          status: response.username.available ? 'valid' : 'invalid', 
          message: response.username.message 
        }
      }));
    } catch (err) {
      setValidation(prev => ({
        ...prev,
        username: { status: 'neutral', message: '' }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validazioni
    if (formData.password !== formData.confermaPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    // Verifica che email e username siano validi
    if (validation.email.status !== 'valid') {
      setError('Email non valida o già in uso');
      return;
    }

    if (validation.username.status !== 'valid') {
      setError('Username non valido o già in uso');
      return;
    }

    setLoading(true);

    try {
      const { confermaPassword, ...dataToSend } = formData;
      await apiRegister(dataToSend);
      setSuccess('Registrazione completata con successo! Reindirizzamento al login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container>
      <RegisterCard>
        <Logo>
          <LogoTitle>TopLeague</LogoTitle>
          <LogoSubtitle>Registrazione</LogoSubtitle>
        </Logo>
        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <Row>
            <FormGroup>
              <Label htmlFor="nome">
                Nome<Required>*</Required>
              </Label>
              <Input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Il tuo nome"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="cognome">
                Cognome<Required>*</Required>
              </Label>
              <Input
                type="text"
                id="cognome"
                name="cognome"
                value={formData.cognome}
                onChange={handleChange}
                placeholder="Il tuo cognome"
                required
              />
            </FormGroup>
          </Row>

          <FormGroup>
            <Label htmlFor="username">
              Username<Required>*</Required>
            </Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Scegli un username"
              className={validation.username.status}
              required
            />
            {validation.username.message && (
              <ValidationMessage className={validation.username.status}>
                {validation.username.message}
              </ValidationMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">
              Email<Required>*</Required>
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="La tua email"
              className={validation.email.status}
              required
            />
            {validation.email.message && (
              <ValidationMessage className={validation.email.status}>
                {validation.email.message}
              </ValidationMessage>
            )}
          </FormGroup>

          <Row>
            <FormGroup>
              <Label htmlFor="password">
                Password<Required>*</Required>
              </Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Scegli una password"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="confermaPassword">
                Conferma Password<Required>*</Required>
              </Label>
              <Input
                type="password"
                id="confermaPassword"
                name="confermaPassword"
                value={formData.confermaPassword}
                onChange={handleChange}
                placeholder="Conferma la password"
                required
              />
            </FormGroup>
          </Row>

          <FormGroup>
            <Label htmlFor="provenienza">Provenienza</Label>
            <Input
              type="text"
              id="provenienza"
              name="provenienza"
              value={formData.provenienza}
              onChange={handleChange}
              placeholder="La tua città/regione"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="squadra_cuore">Squadra del Cuore</Label>
            <Input
              type="text"
              id="squadra_cuore"
              name="squadra_cuore"
              value={formData.squadra_cuore}
              onChange={handleChange}
              placeholder="La tua squadra preferita"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="come_conosciuto">Come ci hai conosciuto</Label>
            <Select
              id="come_conosciuto"
              name="come_conosciuto"
              value={formData.come_conosciuto}
              onChange={handleChange}
            >
              <option value="">Seleziona un'opzione</option>
              <option value="Presidente di Lega">Presidente di Lega</option>
              <option value="Amico">Amico</option>
              <option value="Radio">Radio</option>
              <option value="Podcast">Podcast</option>
              <option value="Instagram">Instagram</option>
              <option value="Twitter">Twitter</option>
              <option value="Facebook">Facebook</option>
              <option value="Altro">Altro</option>
            </Select>
          </FormGroup>

          <Button type="submit" disabled={loading || validation.email.status !== 'valid' || validation.username.status !== 'valid'}>
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </Button>
          
          <Divider>oppure</Divider>
          
          <LoginLink to="/login">
            Hai già un account? Fai login qui
          </LoginLink>
        </Form>
      </RegisterCard>
    </Container>
  );
}

export default Register; 