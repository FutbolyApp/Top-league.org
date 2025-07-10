import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationSystem';
import { checkSubadmin } from '../api/subadmin';
import { useSubadminNotifications } from '../hooks/useSubadminNotifications';

const Nav = styled.nav`
  background: white;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-bottom: 1px solid #e5e5e7;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  color: #5856d6;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  color: #86868b;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
    color: #5856d6;
  }
  
  &.active {
    background-color: #5856d6;
    color: white;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: inline-block;
`;

const UserButton = styled.button`
  background: none;
  border: none;
  color: #86868b;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  
  &:hover {
    background-color: #f8f9fa;
    color: #5856d6;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-width: 180px;
  z-index: 1000;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  border: 1px solid #e5e5e7;
`;

const DropdownItem = styled(Link)`
  display: block;
  padding: 0.75rem 1rem;
  color: #1d1d1f;
  text-decoration: none;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.85rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const LogoutButton = styled.button`
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #ff3b30;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.85rem;
  
  &:hover {
    background-color: #f8f9fa;
  }
`;

const UserInfo = styled.span`
  color: #86868b;
  font-size: 0.85rem;
  font-weight: 500;
`;

const LogoutLink = styled(Link)`
  background: #ff3b30;
  color: white;
  text-decoration: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: #d70015;
    transform: translateY(-1px);
  }
`;

const Navigation = () => {
  const { user, token, logoutUser, refreshUserData } = useAuth();
  const { notifications, markSubadminRequestsAsRead } = useNotification();
  const { pendingChanges: subadminPendingChanges } = useSubadminNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingAdminRequests, setPendingAdminRequests] = useState(0);
  const [isSubadmin, setIsSubadmin] = useState(false);
  const [subadminLeagues, setSubadminLeagues] = useState([]);

  const isAdmin = user && (
    user.ruolo === 'admin' ||
    user.ruolo === 'superadmin' ||
    user.ruolo === 'SuperAdmin' ||
    (user.leghe_admin && user.leghe_admin.length > 0)
  );

  const isSuperAdmin = user && (
    user.ruolo === 'superadmin' ||
    user.ruolo === 'SuperAdmin'
  );

  // Controllo automatico dei dati utente
  useEffect(() => {
    if (user && token) {
      // Se l'utente ha un ruolo che dovrebbe avere leghe_admin ma non le ha
      const shouldHaveLeagues = user.ruolo === 'admin' || user.ruolo === 'superadmin' || user.ruolo === 'SuperAdmin';
      const hasIncompleteData = shouldHaveLeagues && (!user.leghe_admin || user.leghe_admin.length === 0);
      
      if (hasIncompleteData) {
        console.log('Detected incomplete user data, refreshing...');
        refreshUserData();
      }
    }
  }, [user, token, refreshUserData]);

  // Fetch pending admin requests count
  useEffect(() => {
    const fetchPendingAdminRequests = async () => {
      if (user && token && isAdmin) {
        try {
          const response = await fetch('http://localhost:3001/api/leghe/richieste/admin', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            // L'API restituisce { richieste: [...] }, quindi contiamo le richieste
            setPendingAdminRequests(data.richieste ? data.richieste.length : 0);
          } else if (response.status === 401) {
            console.warn('Utente non autorizzato per accedere alle richieste admin');
            setPendingAdminRequests(0);
          } else if (response.status === 403) {
            console.warn('Accesso negato: richiesti privilegi admin');
            setPendingAdminRequests(0);
          } else {
            console.error('Errore nel recupero richieste admin pendenti:', response.status);
            setPendingAdminRequests(0);
          }
        } catch (error) {
          console.error('Errore nel recupero richieste admin pendenti:', error);
          setPendingAdminRequests(0);
        }
      } else {
        setPendingAdminRequests(0);
      }
    };

    fetchPendingAdminRequests();
  }, [user, token, isAdmin]);

  // Verifica se l'utente è subadmin
  useEffect(() => {
    const checkSubadminStatus = async () => {
      if (user && token) {
        try {
          // Chiamata API per verificare se l'utente è subadmin di qualche lega
          const response = await fetch('http://localhost:3001/api/subadmin/check-all', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setIsSubadmin(data.isSubadmin || false);
            setSubadminLeagues(data.leagues || []);
          } else if (response.status === 401) {
            console.warn('Utente non autorizzato per verificare status subadmin');
            setIsSubadmin(false);
            setSubadminLeagues([]);
          } else if (response.status === 403) {
            console.warn('Accesso negato per verificare status subadmin');
            setIsSubadmin(false);
            setSubadminLeagues([]);
          } else {
            console.error('Errore nel controllo subadmin:', response.status);
            setIsSubadmin(false);
            setSubadminLeagues([]);
          }
        } catch (error) {
          console.error('Errore nel controllo subadmin:', error);
          setIsSubadmin(false);
          setSubadminLeagues([]);
        }
      } else {
        setIsSubadmin(false);
        setSubadminLeagues([]);
      }
    };

    checkSubadminStatus();
  }, [user, token]);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Nav>
      <NavContainer>
        <Logo to="/">
          TopLeague
        </Logo>
        
        <NavMenu>
          <NavLink to="/" className={isActive('/') ? 'active' : ''}>
            Home
          </NavLink>
          <NavLink to="/leghe" className={isActive('/leghe') ? 'active' : ''}>
            Leghe
          </NavLink>
          
          {user && (
            <>
              <NavLink to="/area-manager" className={isActive('/area-manager') ? 'active' : ''}>
                Area Manager
              </NavLink>
              
              {isAdmin && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <NavLink to="/area-admin" className={isActive('/area-admin') ? 'active' : ''}>
                    Area Admin
                    {(() => {
                      // Usa il conteggio delle richieste pendenti invece delle notifiche non lette
                      return pendingAdminRequests > 0 && (
                        <span style={{
                          background: '#ff3b30',
                          color: 'white',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          marginLeft: '0.5rem'
                        }}>
                          {pendingAdminRequests > 9 ? '9+' : pendingAdminRequests}
                        </span>
                      );
                    })()}
                  </NavLink>
                </div>
              )}
              
              {isSuperAdmin && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                <NavLink to="/super-admin-dashboard" className={isActive('/super-admin-dashboard') ? 'active' : ''}>
                  Super Admin
                </NavLink>
                </div>
              )}
              
              {isSubadmin && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <NavLink to="/subadmin-area" className={isActive('/subadmin-area') ? 'active' : ''}>
                    Subadmin
                    {(() => {
                      // Conta solo le notifiche non lette per subadmin (NON le modifiche in attesa)
                      const unreadSubadminNotifications = notifications.filter(n => 
                        (n.tipo === 'subadmin_request' || n.tipo === 'subadmin_response' || n.tipo === 'richiesta_ingresso') && 
                        (!n.letto || n.letto === 0)
                      );
                      
                      return unreadSubadminNotifications.length > 0 && (
                      <span style={{
                        background: '#ff3b30',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        marginLeft: '0.5rem'
                      }}>
                          {unreadSubadminNotifications.length > 9 ? '9+' : unreadSubadminNotifications.length}
                      </span>
                      );
                    })()}
                  </NavLink>
                </div>
              )}
            </>
          )}
        </NavMenu>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Icona Notifiche */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => navigate('/notifiche')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#86868b',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                title="Notifiche"
              >
                🔔
                {(() => {
                  const unreadCount = notifications.filter(n => !n.letto || n.letto === 0).length;
                  return unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#ff3b30',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      border: '2px solid white'
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  );
                })()}
              </button>
            </div>
            
            <UserInfo>
              {user.username || user.nome}
            </UserInfo>
            <button 
              onClick={refreshUserData}
              style={{
                background: 'none',
                border: '1px solid #5856d6',
                color: '#5856d6',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Aggiorna dati utente"
            >
              🔄
            </button>
            <LogoutLink 
              to="/" 
              onClick={() => {
                logoutUser();
                navigate('/');
              }}
            >
              Logout
            </LogoutLink>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NavLink to="/login" className={isActive('/login') ? 'active' : ''}>
              Login
            </NavLink>
            <NavLink to="/register" className={isActive('/register') ? 'active' : ''}>
              Registrati
            </NavLink>
          </div>
        )}
      </NavContainer>
    </Nav>
  );
};

export default Navigation; 