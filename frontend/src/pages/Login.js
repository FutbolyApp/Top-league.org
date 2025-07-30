import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { login as apiLogin } from '../api/auth';

// FIXED: Enhanced styled components with better accessibility
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Logo = styled.div`
  margin-bottom: 2rem;
`;

const LogoTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin: 0;
`;

const LogoSubtitle = styled.p`
  color: #666;
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
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
  text-align: left;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
  
  &.error {
    border-color: #e74c3c;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #feb2b2;
  font-size: 0.9rem;
  text-align: left;
`;

const SuccessMessage = styled.div`
  background: #f0fff4;
  color: #22543d;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #9ae6b4;
  font-size: 0.9rem;
  text-align: left;
`;

const Divider = styled.div`
  margin: 1.5rem 0;
  color: #666;
  font-size: 0.9rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e1e5e9;
  }
  
  &::after {
    content: 'oppure';
    background: white;
    padding: 0 1rem;
    position: relative;
    z-index: 1;
  }
`;

const RegisterLink = styled.div`
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const TestCredentials = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #6c757d;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #495057;
    font-size: 0.9rem;
  }
  
  p {
    margin: 0.25rem 0;
  }
  
  code {
    background: #e9ecef;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
  }
`;

// FIXED: Enhanced Login component with comprehensive error handling
function Login() {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  // FIXED: Clear messages when form data changes
  useEffect(() => {
    if (error || success) {
      setError('');
      setSuccess('');
    }
  }, [formData.emailOrUsername, formData.password]);

  // FIXED: Enhanced client-side validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.emailOrUsername.trim()) {
      errors.emailOrUsername = 'Email o username è obbligatorio';
    } else if (formData.emailOrUsername.length < 3) {
      errors.emailOrUsername = 'Email o username deve essere di almeno 3 caratteri';
    }
    
    if (!formData.password) {
      errors.password = 'Password è obbligatoria';
    } else if (formData.password.length < 6) {
      errors.password = 'Password deve essere di almeno 6 caratteri';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // FIXED: Enhanced form submission with comprehensive error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // FIXED: Clear previous errors and validate form
    setError('');
    setSuccess('');
    setValidationErrors({});
    
    if (!validateForm()) {
      setError('Per favore correggi gli errori nel form');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔍 Login: Starting authentication process');
      
      // FIXED: Prepare credentials with validation
      const credentials = {
        email: formData.emailOrUsername.trim(),
        password: formData.password
      };
      
      console.log('🔍 Login: Attempting login with credentials:', {
        email: credentials.email,
        hasPassword: !!credentials.password
      });
      
      const response = await apiLogin(credentials);
      
      console.log('🔍 Login: Authentication successful:', {
        hasUser: !!response?.user,
        hasToken: !!response?.token,
        userId: response?.user?.id
      });
      
      // FIXED: Validate response before proceeding
      if (!response?.user || !response?.token) {
        throw new Error('Risposta di autenticazione non valida');
      }
      
      // FIXED: Login user with validated data
      loginUser(response.user, response.token);
      
      setSuccess('Accesso effettuato con successo!');
      
      // FIXED: Navigate after a brief delay to show success message
      setTimeout(() => {
        // FIXED: Check for redirect URL with validation
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl && redirectUrl.startsWith('/')) {
          console.log('🔍 Login: Redirecting to saved URL:', redirectUrl);
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          console.log('🔍 Login: Redirecting to home page');
          navigate('/');
        }
      }, 1000);
      
    } catch (err) {
      console.error('🚨 Login: Authentication error:', err);
      
      // FIXED: Enhanced error message handling
      let errorMessage = 'Errore durante il login';
      
      if (err.message) {
        if (err.message.includes('Credenziali non valide')) {
          errorMessage = 'Email o password non corretti';
        } else if (err.message.includes('Network Error') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Errore di connessione. Verifica la tua connessione internet.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Timeout della richiesta. Riprova.';
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Credenziali non autorizzate';
        } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
          errorMessage = 'Errore del server. Riprova più tardi.';
        } else if (err.message.includes('Utente non trovato')) {
          errorMessage = 'Utente non trovato. Usa le credenziali di test mostrate qui sotto.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // FIXED: Clear password on error for security
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
      
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Enhanced input change handler with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // FIXED: Clear field-specific validation errors
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // FIXED: Enhanced input blur handler for real-time validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    if (name === 'emailOrUsername' && !value.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: 'Email o username è obbligatorio'
      }));
    } else if (name === 'password' && !value) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: 'Password è obbligatoria'
      }));
    }
  };

  return (
    <Container>
      <LoginCard>
        <Logo>
          <LogoTitle>TopLeague</LogoTitle>
          <LogoSubtitle>Fantasy Football League Management</LogoSubtitle>
        </Logo>
        
        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <FormGroup>
            <Label htmlFor="emailOrUsername">Email o Username</Label>
            <Input
              type="text"
              id="emailOrUsername"
              name="emailOrUsername"
              value={formData.emailOrUsername}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Inserisci email o username"
              className={validationErrors.emailOrUsername ? 'error' : ''}
              disabled={loading}
              required
            />
            {validationErrors.emailOrUsername && (
              <ErrorMessage style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                {validationErrors.emailOrUsername}
              </ErrorMessage>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Inserisci la tua password"
              className={validationErrors.password ? 'error' : ''}
              disabled={loading}
              required
            />
            {validationErrors.password && (
              <ErrorMessage style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                {validationErrors.password}
              </ErrorMessage>
            )}
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </Form>
        
        <Divider>oppure</Divider>
        
        <RegisterLink onClick={() => navigate('/register')}>
          Non hai un account? Registrati qui
        </RegisterLink>
        
        {/* FIXED: Add test credentials helper */}
        <TestCredentials>
          <h4>🔑 Credenziali di Test</h4>
          <p>Per testare l'applicazione, usa:</p>
          <p><strong>Email:</strong> <code>admin@top-league.org</code></p>
          <p><strong>Password:</strong> <code>Borini</code></p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#6c757d' }}>
            Queste credenziali sono configurate per l'ambiente di test.
          </p>
        </TestCredentials>
      </LoginCard>
    </Container>
  );
}

export default Login; 