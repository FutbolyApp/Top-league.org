import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from './AuthContext';
import { login } from '../api/auth';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  margin: 0 0 1rem 0;
  color: #333;
  text-align: center;
`;

const Message = styled.p`
  color: #666;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.9rem;
  text-align: center;
`;

const TokenExpiredHandler = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useAuth();

  useEffect(() => {
    const handleTokenExpired = (event) => {
      console.log('Token expired event received:', event.detail);
      console.log('Setting showLoginModal to true');
      setShowLoginModal(true);
      setError('');
    };

    window.addEventListener('token-expired', handleTokenExpired);

    return () => {
      window.removeEventListener('token-expired', handleTokenExpired);
    };
  }, []);

  // Debug log for modal state
  useEffect(() => {
    console.log('TokenExpiredHandler - showLoginModal state:', showLoginModal);
  }, [showLoginModal]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login({
        email: loginData.email,
        password: loginData.password
      });
      
      loginUser(response.user, response.token);
      setShowLoginModal(false);
      setLoginData({ email: '', password: '' });
      
      // Reload the page to refresh all data
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleClose = () => {
    setShowLoginModal(false);
    setLoginData({ email: '', password: '' });
    setError('');
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <>
      {children}
      {showLoginModal && (
        <>
          {console.log('Rendering login modal')}
          <ModalOverlay>
            <Modal>
              <Title>🔐 Sessione Scaduta</Title>
              <Message>
                La tua sessione è scaduta. Effettua di nuovo il login per continuare.
              </Message>
              
              <Form onSubmit={handleLogin}>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={handleInputChange}
                  required
                />
                
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  required
                />
                
                {error && <ErrorMessage>{error}</ErrorMessage>}
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
                
                <Button 
                  type="button" 
                  onClick={handleClose}
                  style={{ background: '#6c757d', marginTop: '0.5rem' }}
                >
                  Vai alla pagina di login
                </Button>
              </Form>
            </Modal>
          </ModalOverlay>
        </>
      )}
    </>
  );
};

export default TokenExpiredHandler; 