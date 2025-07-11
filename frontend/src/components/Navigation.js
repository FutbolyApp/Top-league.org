import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationSystem';
import { checkSubadmin } from '../api/subadmin';
import { useSubadminNotifications } from '../hooks/useSubadminNotifications';
import { 
  getRichiesteAdminShared, 
  verifyUserShared, 
  checkSubadminShared 
} from '../api/sharedApi.js';

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
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #5856d6;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  backdrop-filter: blur(10px);
  transition: opacity 0.3s ease;
  opacity: ${props => props.$isOpen ? 1 : 0};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenuContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-height: 100vh;
  overflow-y: auto;
  transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e5e7;
  margin-bottom: 1rem;
`;

const MobileMenuClose = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #5856d6;
`;

const MobileNavLink = styled(Link)`
  display: block;
  width: 100%;
  padding: 1rem 1.5rem;
  color: #1d1d1f;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  background: white;
  border: none;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  text-align: left;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &.active {
    background: linear-gradient(135deg, #5856d6 0%, #7c3aed 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(88, 86, 214, 0.3);
  }
`;

const MobileUserInfo = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const MobileUserActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const MobileActionButton = styled.button`
  width: 100%;
  background: white;
  color: #1d1d1f;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &.logout {
    color: #ff3b30;
    background: #fff5f5;
    
    &:hover {
      background: #fed7d7;
    }
  }
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          const data = await getRichiesteAdminShared(token, user.id);
          // L'API restituisce { richieste: [...] }, quindi contiamo le richieste
          setPendingAdminRequests(data.richieste ? data.richieste.length : 0);
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
          const data = await checkSubadminShared(token);
          setIsSubadmin(data.isSubadmin || false);
          setSubadminLeagues(data.leagues || []);
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navigateAndCloseMenu = (path) => {
    navigate(path);
    // Chiudi il menu con un piccolo delay per permettere l'animazione
    setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 100);
  };

  const renderNavLinks = () => (
    <>
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
    </>
  );

  return (
    <>
      <Nav>
        <NavContainer>
          <Logo to="/">
            TopLeague
          </Logo>
          
          <NavMenu>
            {renderNavLinks()}
          </NavMenu>

          <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)}>
            ☰
          </MobileMenuButton>

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

      {/* Mobile Menu */}
      <MobileMenu $isOpen={isMobileMenuOpen} onClick={closeMobileMenu}>
        <MobileMenuContent $isOpen={isMobileMenuOpen} onClick={(e) => e.stopPropagation()}>
          <MobileMenuHeader>
            <Logo to="/" onClick={closeMobileMenu}>
              TopLeague
            </Logo>
            <MobileMenuClose onClick={closeMobileMenu}>
              ✕
            </MobileMenuClose>
          </MobileMenuHeader>

          {user && (
            <MobileUserInfo>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {user.username || user.nome}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {user.email}
              </div>
            </MobileUserInfo>
          )}

          {/* Menu Navigation Links - iOS Style */}
          <div style={{ marginBottom: '1rem' }}>
            <MobileNavLink 
              to="/" 
              className={isActive('/') ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              Home
            </MobileNavLink>
            
            <MobileNavLink 
              to="/leghe" 
              className={isActive('/leghe') ? 'active' : ''}
              onClick={closeMobileMenu}
            >
              Leghe
            </MobileNavLink>
            
            {user && (
              <>
                <MobileNavLink 
                  to="/area-manager" 
                  className={isActive('/area-manager') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Area Manager
                </MobileNavLink>
                
                {isAdmin && (
                  <MobileNavLink 
                    to="/area-admin" 
                    className={isActive('/area-admin') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Area Admin
                    {pendingAdminRequests > 0 && (
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
                        marginLeft: 'auto'
                      }}>
                        {pendingAdminRequests > 9 ? '9+' : pendingAdminRequests}
                      </span>
                    )}
                  </MobileNavLink>
                )}
                
                {isSuperAdmin && (
                  <MobileNavLink 
                    to="/super-admin-dashboard" 
                    className={isActive('/super-admin-dashboard') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Super Admin
                  </MobileNavLink>
                )}
                
                {isSubadmin && (
                  <MobileNavLink 
                    to="/subadmin-area" 
                    className={isActive('/subadmin-area') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Subadmin
                    {(() => {
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
                          marginLeft: 'auto'
                        }}>
                          {unreadSubadminNotifications.length > 9 ? '9+' : unreadSubadminNotifications.length}
                        </span>
                      );
                    })()}
                  </MobileNavLink>
                )}
              </>
            )}
          </div>

          {user ? (
            <MobileUserActions>
              <MobileActionButton onClick={() => {
                navigateAndCloseMenu('/notifiche');
              }}>
                Notifiche
                {(() => {
                  const unreadCount = notifications.filter(n => !n.letto || n.letto === 0).length;
                  return unreadCount > 0 && (
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
                      fontWeight: '600'
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  );
                })()}
              </MobileActionButton>
              
              <MobileActionButton onClick={() => {
                refreshUserData();
                closeMobileMenu();
              }}>
                Aggiorna Dati
              </MobileActionButton>
              
              <MobileActionButton 
                className="logout"
                onClick={() => {
                  logoutUser();
                  navigate('/');
                  closeMobileMenu();
                }}
              >
                Logout
              </MobileActionButton>
            </MobileUserActions>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <MobileNavLink to="/login" onClick={closeMobileMenu}>
                Login
              </MobileNavLink>
              <MobileNavLink to="/register" onClick={closeMobileMenu}>
                Registrati
              </MobileNavLink>
            </div>
          )}
        </MobileMenuContent>
      </MobileMenu>
    </>
  );
};

export default Navigation; 