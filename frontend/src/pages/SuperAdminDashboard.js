import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getAllLegheAdmin, deleteLeague } from '../api/leghe';
import { getAllSubadmins, addSubadmin, removeSubadmin } from '../api/subadmin';
import { searchUsers } from '../api/auth';
import UserAutocomplete from '../components/UserAutocomplete';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LeaguesSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const UsersSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: #333;
  margin: 0 0 2rem 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LeaguesTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e9ecef;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  margin: 0.25rem;
  font-size: 0.9rem;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &.danger {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  }
  
  &.success {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  }
  
  &.warning {
    background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
    color: #212529;
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  
  &.public {
    background: #d4edda;
    color: #155724;
  }
  
  &.private {
    background: #f8d7da;
    color: #721c24;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: #dc3545;
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #333;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e5e7;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e5e7;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
  
  &:hover {
    background: #f8f9fa;
  }
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const SubadminSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
`;

const SubadminCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #667eea;
`;

const PermissionTag = styled.span`
  background: #d4edda;
  color: #155724;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  display: inline-block;
`;

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [leghe, setLeghe] = useState([]);
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSubadminModal, setShowAddSubadminModal] = useState(false);
  const [selectedLega, setSelectedLega] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [permissions, setPermissions] = useState({
    modifica_squadre: false,
    gestione_giocatori: false,
    gestione_tornei: false,
    modifica_impostazioni: false,
    gestione_contratti: false
  });
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    ruolo: 'Utente'
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      
      // Verifica che l'utente sia SuperAdmin
      if (!token) {
        setError('Token di autenticazione mancante. Effettua il login.');
        setLoading(false);
        return;
      }

      try {
        const [legheRes, subadminsRes] = await Promise.all([
          getAllLegheAdmin(token),
          getAllSubadmins(token)
        ]);
        setLeghe(legheRes.data.leghe);
        setSubadmins(subadminsRes.data.subadmins || []);
        
        // Carica utenti separatamente con gestione errori migliorata
        try {
          const usersResponse = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/auth/all-users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(usersData);
          } else if (usersResponse.status === 401) {
            console.warn('Utente non autorizzato per accedere agli utenti');
            setUsers([]);
          } else if (usersResponse.status === 403) {
            console.warn('Accesso negato: richiesti privilegi SuperAdmin');
            setUsers([]);
          } else {
            console.error('Errore nel caricamento utenti:', usersResponse.status);
            setUsers([]);
          }
        } catch (usersErr) {
          console.error('Errore caricamento utenti:', usersErr);
          setUsers([]);
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    
    if (token) {
      fetchData();
    } else {
      setLoading(false);
      setError('Effettua il login per accedere alla dashboard SuperAdmin');
    }
  }, [token]);

  const handleEditLega = (legaId) => {
    navigate(`/super-admin/lega/${legaId}/edit`);
  };

  const handleDeleteLega = async (legaId, legaNome) => {
    if (window.confirm(`Sei sicuro di voler eliminare la lega "${legaNome}"? Questa azione non può essere annullata.`)) {
      try {
        await deleteLeague(legaId, token);
        setLeghe(leghe?.filter(lega => lega.id !== legaId));
        alert('Lega eliminata con successo!');
      } catch (err) {
        alert(`Errore nell'eliminazione: ${err.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddSubadmin = (lega) => {
    setSelectedLega(lega);
    setSelectedUser('');
    setSelectedUserId(null);
    setPermissions({
      modifica_squadre: false,
      gestione_giocatori: false,
      gestione_tornei: false,
      modifica_impostazioni: false,
      gestione_contratti: false
    });
    setShowAddSubadminModal(true);
  };

  const handleSubmitSubadmin = async () => {
    if (!selectedUserId || !selectedLega) {
      alert('Seleziona un utente e una lega');
      return;
    }

    try {
      await addSubadmin(selectedLega.id, selectedUserId, permissions, token);
      alert('Subadmin aggiunto con successo!');
      setShowAddSubadminModal(false);
      
      // Ricarica i dati
      const subadminsRes = await getAllSubadmins(token);
      setSubadmins(subadminsRes.data.subadmins || []);
    } catch (err) {
      alert(`Errore nell'aggiunta del subadmin: ${err.message}`);
    }
  };

  const handleRemoveSubadmin = async (legaId, userId) => {
    if (window.confirm('Sei sicuro di voler rimuovere questo subadmin?')) {
      try {
        await removeSubadmin(legaId, userId, token);
        alert('Subadmin rimosso con successo!');
        
        // Ricarica i dati
        const subadminsRes = await getAllSubadmins(token);
        setSubadmins(subadminsRes.data.subadmins || []);
      } catch (err) {
        alert(`Errore nella rimozione del subadmin: ${err.message}`);
      }
    }
  };

  const handlePermissionChange = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const getSubadminsForLega = (legaId) => {
    return subadmins?.filter(sub => sub.lega_id === legaId);
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      
      if (!token) {
        console.warn('Token mancante per caricamento utenti');
        setUsers([]);
        return;
      }
      
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/auth/all-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const users = await response.json();
        setUsers(users);
      } else if (response.status === 401) {
        console.warn('Utente non autorizzato per accedere agli utenti');
        setUsers([]);
      } else if (response.status === 403) {
        console.warn('Accesso negato: richiesti privilegi SuperAdmin');
        setUsers([]);
      } else {
        console.error('Errore nel caricamento utenti:', response.status);
        setUsers([]);
      }
    } catch (err) {
      console.error('Errore nel caricamento utenti:', err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUserForEdit(user);
    setUserFormData({
      username: user.username,
      email: user.email,
      ruolo: user?.ruolo || 'Ruolo'
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'utente "${username}"? Questa azione non può essere annullata.`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert(`Utente "${username}" eliminato con successo!`);
        // Ricarica la lista utenti
        await fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Errore nell'eliminazione: ${errorData.error || 'Errore sconosciuto'}`);
      }
    } catch (err) {
      console.error('Errore nell\'eliminazione utente:', err);
      alert(`Errore nell'eliminazione: ${err.message}`);
    }
  };

  const handleSubmitUser = async () => {
    try {
      if (!userFormData.username || !userFormData.email || !userFormData?.ruolo || 'Ruolo') {
        alert('Compila tutti i campi obbligatori');
        return;
      }

      if (selectedUserForEdit) {
        // Aggiorna utente esistente
        const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/superadmin/users/${selectedUserForEdit.id}/role`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ruolo: userFormData?.ruolo || 'Ruolo'
          })
        });

        if (response.ok) {
          alert('Utente aggiornato con successo!');
          setShowUserModal(false);
          await fetchUsers(); // Ricarica la lista
        } else {
          const errorData = await response.json();
          alert(`Errore nell'aggiornamento: ${errorData.error || 'Errore sconosciuto'}`);
        }
      } else {
        // Crea nuovo utente
        const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: userFormData.username,
            cognome: userFormData.username,
            username: userFormData.username,
            email: userFormData.email,
            password: 'password123', // Password temporanea
            ruolo: userFormData?.ruolo || 'Ruolo'
          })
        });

        if (response.ok) {
          alert('Utente creato con successo!');
          setShowUserModal(false);
          await fetchUsers(); // Ricarica la lista
        } else {
          const errorData = await response.json();
          alert(`Errore nella creazione: ${errorData.error || 'Errore sconosciuto'}`);
        }
      }
    } catch (err) {
      console.error('Errore nel salvataggio utente:', err);
      alert(`Errore nel salvataggio: ${err.message}`);
    }
  };

  if (loading) return (
    <Container>
      <LoadingContainer>Caricamento dashboard...</LoadingContainer>
    </Container>
  );

  if (error) return (
    <Container>
      <ErrorContainer>Errore: {error}</ErrorContainer>
    </Container>
  );

  const totalLeghe = leghe?.length || 0;
  const totalSquadre = leghe?.reduce((sum, lega) => sum + (lega.numero_squadre || 0), 0) || 0;
  const totalSquadreAssegnate = leghe?.reduce((sum, lega) => sum + (lega.squadre_con_proprietario || 0), 0) || 0;
  const totalGiocatori = leghe?.reduce((sum, lega) => sum + (lega.numero_giocatori || 0), 0) || 0;
  const leghePubbliche = leghe?.filter(lega => lega.is_pubblica).length || 0;

  return (
    <Container>
      <Header>
        <Title>👑 SuperAdmin Dashboard</Title>
        <Subtitle>Pannello di controllo completo per la gestione del sistema</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber>{totalLeghe}</StatNumber>
          <StatLabel>Leghe Totali</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{totalSquadreAssegnate}/{totalSquadre}</StatNumber>
          <StatLabel>Squadre Assegnate/Totali</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{totalGiocatori}</StatNumber>
          <StatLabel>Giocatori Totali</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{leghePubbliche}</StatNumber>
          <StatLabel>Leghe Pubbliche</StatLabel>
        </StatCard>
      </StatsGrid>

      <LeaguesSection>
        <SectionTitle>🏆 Gestione Leghe</SectionTitle>
        
        {!leghe || leghe?.length || 0 === 0 ? (
          <EmptyContainer>
            <h3>Nessuna lega trovata</h3>
            <p>Non ci sono ancora leghe nel sistema.</p>
          </EmptyContainer>
        ) : (
          <LeaguesTable>
            <Table>
              <thead>
                <tr>
                  <Th>Nome Lega</Th>
                  <Th>Proprietario</Th>
                  <Th>Modalità</Th>
                  <Th>Stato</Th>
                  <Th>Squadre (Assegnate/Totali)</Th>
                  <Th>Giocatori</Th>
                  <Th>Subadmin</Th>
                  <Th>Data Creazione</Th>
                  <Th>Azioni</Th>
                </tr>
              </thead>
              <tbody>
                {leghe?.map(lega => (
                  <Tr key={lega.id}>
                    <Td>
                      <strong>{lega?.nome || 'Nome'}</strong>
                    </Td>
                    <Td>
                      <div>
                        <div><strong>{lega.admin_nome || 'N/A'}</strong></div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {lega.admin_email || 'N/A'}
                        </div>
                      </div>
                    </Td>
                    <Td>{lega.modalita}</Td>
                    <Td>
                      <StatusBadge className={lega.is_pubblica ? 'public' : 'private'}>
                        {lega.is_pubblica ? 'Pubblica' : 'Privata'}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <strong>{lega.squadre_con_proprietario || 0}/{lega.numero_squadre || 0}</strong>
                      {lega.numero_squadre > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                          {Math.round(((lega.squadre_con_proprietario || 0) / lega.numero_squadre) * 100)}% assegnate
                        </div>
                      )}
                    </Td>
                    <Td>{lega.numero_giocatori || 0}</Td>
                    <Td>
                      {getSubadminsForLega(lega.id).length > 0 ? (
                        <div>
                          {getSubadminsForLega(lega.id).map(sub => (
                            <div key={sub.id} style={{ marginBottom: '0.5rem' }}>
                              <strong>{sub.username}</strong>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                {Object.keys(sub.permessi).filter(p => sub.permessi[p]).length} permessi
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#666', fontStyle: 'italic' }}>Nessuno</span>
                      )}
                    </Td>
                    <Td>{formatDate(lega.created_at)}</Td>
                    <Td>
                      <ActionButton 
                        className="warning"
                        onClick={() => handleEditLega(lega.id)}
                      >
                        ✏️ Modifica
                      </ActionButton>
                      <ActionButton 
                        className="success"
                        onClick={() => handleAddSubadmin(lega)}
                      >
                        👥 Aggiungi Subadmin
                      </ActionButton>
                      <ActionButton 
                        className="info"
                        onClick={() => navigate(`/gestione-roster-admin/${lega.id}`)}
                      >
                        📊 Gestione Roster
                      </ActionButton>
                      <ActionButton 
                        className="danger"
                        onClick={() => handleDeleteLega(lega.id, lega?.nome || 'Nome')}
                      >
                        🗑️ Elimina
                      </ActionButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </LeaguesTable>
        )}
      </LeaguesSection>

      <UsersSection>
        <SectionTitle>
          👥 Gestione Utenti
          <ActionButton 
            className="success"
            onClick={() => {
              setSelectedUserForEdit(null);
              setUserFormData({
                username: '',
                email: '',
                ruolo: 'Utente'
              });
              setShowUserModal(true);
            }}
            style={{ marginLeft: '1rem' }}
          >
            ➕ Aggiungi Utente
          </ActionButton>
        </SectionTitle>
        
        {usersLoading ? (
          <LoadingContainer>Caricamento utenti...</LoadingContainer>
        ) : !users || users?.length || 0 === 0 ? (
          <EmptyContainer>
            <h3>Nessun utente trovato</h3>
            <p>Non ci sono ancora utenti nel sistema.</p>
          </EmptyContainer>
        ) : (
          <LeaguesTable>
            <Table>
              <thead>
                <tr>
                  <Th>Username</Th>
                  <Th>Email</Th>
                  <Th>Ruolo</Th>
                  <Th>Data Registrazione</Th>
                  <Th>Azioni</Th>
                </tr>
              </thead>
              <tbody>
                {users?.map(user => (
                  <Tr key={user.id}>
                    <Td>
                      <strong>{user.username}</strong>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <StatusBadge className={user?.ruolo || 'Ruolo' === 'SuperAdmin' ? 'public' : 'private'}>
                        {user?.ruolo || 'Ruolo'}
                      </StatusBadge>
                    </Td>
                    <Td>{formatDate(user.created_at)}</Td>
                    <Td>
                      <ActionButton 
                        className="warning"
                        onClick={() => handleEditUser(user)}
                      >
                        ✏️ Modifica
                      </ActionButton>
                      <ActionButton 
                        className="danger"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                      >
                        🗑️ Elimina
                      </ActionButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </LeaguesTable>
        )}
      </UsersSection>

      {/* Modal Aggiungi Subadmin */}
      {showAddSubadminModal && (
        <Modal onClick={() => setShowAddSubadminModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Aggiungi Subadmin - {selectedLega?.nome}</ModalTitle>
            
            <FormGroup>
              <Label>Seleziona Utente</Label>
              <UserAutocomplete
                value={selectedUser}
                onChange={setSelectedUser}
                placeholder="Cerca utente per username..."
                token={token}
                onUserSelect={(user) => {
                  setSelectedUser(user.username);
                  setSelectedUserId(user.id);
                }}
              />
            </FormGroup>

            <FormGroup>
              <Label>Permessi</Label>
              <CheckboxGroup>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.modifica_squadre}
                    onChange={() => handlePermissionChange('modifica_squadre')}
                  />
                  Modifica Squadre
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.gestione_giocatori}
                    onChange={() => handlePermissionChange('gestione_giocatori')}
                  />
                  Gestione Giocatori
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.gestione_tornei}
                    onChange={() => handlePermissionChange('gestione_tornei')}
                  />
                  Gestione Tornei
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.modifica_impostazioni}
                    onChange={() => handlePermissionChange('modifica_impostazioni')}
                  />
                  Modifica Impostazioni
                </CheckboxItem>
                <CheckboxItem>
                  <input
                    type="checkbox"
                    checked={permissions.gestione_contratti}
                    onChange={() => handlePermissionChange('gestione_contratti')}
                  />
                  Gestione Contratti
                </CheckboxItem>
              </CheckboxGroup>
            </FormGroup>

            <ButtonGroup>
              <ActionButton 
                className="secondary"
                onClick={() => setShowAddSubadminModal(false)}
              >
                Annulla
              </ActionButton>
              <ActionButton 
                className="success"
                onClick={handleSubmitSubadmin}
              >
                Aggiungi Subadmin
              </ActionButton>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Modifica Utente */}
      {showUserModal && (
        <Modal onClick={() => setShowUserModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {selectedUserForEdit ? 'Modifica Utente' : 'Nuovo Utente'}
            </ModalTitle>
            
            <FormGroup>
              <Label>Username</Label>
              <Input
                type="text"
                value={userFormData.username}
                onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Inserisci username"
              />
            </FormGroup>

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Inserisci email"
              />
            </FormGroup>

            <FormGroup>
              <Label>Ruolo</Label>
              <Select
                value={userFormData?.ruolo || 'Ruolo'}
                onChange={(e) => setUserFormData(prev => ({ ...prev, ruolo: e.target.value }))}
              >
                <option value="Utente">Utente</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">SuperAdmin</option>
              </Select>
            </FormGroup>

            <ButtonGroup>
              <ActionButton 
                className="secondary"
                onClick={() => setShowUserModal(false)}
              >
                Annulla
              </ActionButton>
              <ActionButton 
                className="success"
                onClick={handleSubmitUser}
              >
                {selectedUserForEdit ? 'Aggiorna' : 'Crea'} Utente
              </ActionButton>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default SuperAdminDashboard;
