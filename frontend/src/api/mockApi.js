// Mock API Service per risolvere problemi CORS
// Simula tutte le funzionalità del backend

// Mock data
const mockUsers = [
  {
    id: 1,
    email: 'admin@top-league.org',
    password: 'Borini',
    nome: 'Admin',
    cognome: 'TopLeague',
    ruolo: 'superadmin',
    token: 'mock-superadmin-token-2025'
  },
  {
    id: 2,
    email: 'user@test.com',
    password: 'password123',
    nome: 'User',
    cognome: 'Test',
    ruolo: 'user',
    token: 'mock-user-token-2025'
  },
  {
    id: 3,
    email: 'manager@test.com',
    password: 'password123',
    nome: 'Manager',
    cognome: 'Test',
    ruolo: 'admin',
    token: 'mock-manager-token-2025'
  }
];

// Leghe mock con leghe create dinamicamente
let mockLeghe = [
  {
    id: 1,
    nome: 'Serie A',
    descrizione: 'Lega Serie A',
    admin_id: 1,
    admin_nome: 'Admin TopLeague',
    admin_email: 'admin@top-league.org',
    created_at: '2025-01-01',
    stato: 'attiva',
    modalita: 'standard',
    is_pubblica: true,
    numero_squadre: 20,
    squadre_con_proprietario: 15,
    numero_giocatori: 400,
    config: {
      max_squadre: 20,
      budget_iniziale: 1000000
    }
  },
  {
    id: 2,
    nome: 'Premier League',
    descrizione: 'Lega Premier League',
    admin_id: 1,
    admin_nome: 'Admin TopLeague',
    admin_email: 'admin@top-league.org',
    created_at: '2025-01-02',
    stato: 'attiva',
    modalita: 'standard',
    is_pubblica: true,
    numero_squadre: 20,
    squadre_con_proprietario: 18,
    numero_giocatori: 380,
    config: {
      max_squadre: 20,
      budget_iniziale: 1000000
    }
  },
  {
    id: 3,
    nome: 'Bundesliga',
    descrizione: 'Lega Bundesliga',
    admin_id: 3,
    admin_nome: 'Manager Test',
    admin_email: 'manager@test.com',
    created_at: '2025-01-03',
    stato: 'attiva',
    modalita: 'advanced',
    is_pubblica: false,
    numero_squadre: 18,
    squadre_con_proprietario: 12,
    numero_giocatori: 324,
    config: {
      max_squadre: 18,
      budget_iniziale: 800000
    }
  },
  // Leghe create dinamicamente
  {
    id: 4,
    nome: 'Lega Calcio 2025',
    descrizione: 'Lega creata dinamicamente',
    admin_id: 1,
    admin_nome: 'Admin TopLeague',
    admin_email: 'admin@top-league.org',
    created_at: '2025-01-15T10:30:00Z',
    stato: 'attiva',
    modalita: 'standard',
    is_pubblica: true,
    numero_squadre: 16,
    squadre_con_proprietario: 8,
    numero_giocatori: 288,
    config: {
      max_squadre: 16,
      budget_iniziale: 750000
    }
  },
  {
    id: 5,
    nome: 'Fantasy League Pro',
    descrizione: 'Lega professionale fantasy football',
    admin_id: 1,
    admin_nome: 'Admin TopLeague',
    admin_email: 'admin@top-league.org',
    created_at: '2025-01-16T14:45:00Z',
    stato: 'attiva',
    modalita: 'pro',
    is_pubblica: true,
    numero_squadre: 12,
    squadre_con_proprietario: 10,
    numero_giocatori: 216,
    config: {
      max_squadre: 12,
      budget_iniziale: 500000
    }
  },
  {
    id: 6,
    nome: 'Champions League',
    descrizione: 'Lega europea di elite',
    admin_id: 1,
    admin_nome: 'Admin TopLeague',
    admin_email: 'admin@top-league.org',
    created_at: '2025-01-17T09:15:00Z',
    stato: 'attiva',
    modalita: 'elite',
    is_pubblica: false,
    numero_squadre: 32,
    squadre_con_proprietario: 25,
    numero_giocatori: 576,
    config: {
      max_squadre: 32,
      budget_iniziale: 1500000
    }
  },
  {
    id: 7,
    nome: 'Lega Amatoriale',
    descrizione: 'Lega per principianti',
    admin_id: 3,
    admin_nome: 'Manager Test',
    admin_email: 'manager@test.com',
    created_at: '2025-01-18T16:20:00Z',
    stato: 'attiva',
    modalita: 'amateur',
    is_pubblica: true,
    numero_squadre: 10,
    squadre_con_proprietario: 6,
    numero_giocatori: 180,
    config: {
      max_squadre: 10,
      budget_iniziale: 300000
    }
  }
];

const mockSquadre = [
  {
    id: 1,
    nome: 'Juventus',
    lega_id: 1,
    punti: 85,
    posizione: 1,
    budget: 1000000,
    utente_id: 2
  },
  {
    id: 2,
    nome: 'Milan',
    lega_id: 1,
    punti: 82,
    posizione: 2,
    budget: 950000,
    utente_id: 3
  },
  {
    id: 3,
    nome: 'Manchester United',
    lega_id: 2,
    punti: 78,
    posizione: 1,
    budget: 1200000,
    utente_id: 2
  },
  {
    id: 4,
    nome: 'Bayern Munich',
    lega_id: 3,
    punti: 90,
    posizione: 1,
    budget: 1500000,
    utente_id: 3
  }
];

const mockGiocatori = [
  {
    id: 1,
    nome: 'Lautaro Martinez',
    ruolo: 'A',
    squadra: 'Inter',
    valore: 50000000,
    lega_id: 1,
    squadra_id: 1
  },
  {
    id: 2,
    nome: 'Federico Chiesa',
    ruolo: 'A',
    squadra: 'Juventus',
    valore: 45000000,
    lega_id: 1,
    squadra_id: 1
  },
  {
    id: 3,
    nome: 'Rafael Leão',
    ruolo: 'A',
    squadra: 'Milan',
    valore: 40000000,
    lega_id: 1,
    squadra_id: 2
  },
  {
    id: 4,
    nome: 'Marcus Rashford',
    ruolo: 'A',
    squadra: 'Manchester United',
    valore: 35000000,
    lega_id: 2,
    squadra_id: 3
  },
  {
    id: 5,
    nome: 'Harry Kane',
    ruolo: 'A',
    squadra: 'Bayern Munich',
    valore: 60000000,
    lega_id: 3,
    squadra_id: 4
  }
];

const mockNotifiche = [
  {
    id: 1,
    tipo: 'offerta',
    messaggio: 'Nuova offerta ricevuta',
    stato: 'non_letta',
    created_at: '2025-01-01T10:00:00Z',
    utente_id: 2
  },
  {
    id: 2,
    tipo: 'sistema',
    messaggio: 'Benvenuto in TopLeague!',
    stato: 'letta',
    created_at: '2025-01-01T09:00:00Z',
    utente_id: 2
  },
  {
    id: 3,
    tipo: 'richiesta',
    messaggio: 'Richiesta unione squadra',
    stato: 'non_letta',
    created_at: '2025-01-01T11:00:00Z',
    utente_id: 3
  }
];

const mockOfferte = [
  {
    id: 1,
    giocatore_id: 1,
    squadra_offerta: 1,
    squadra_ricevente: 2,
    valore: 50000000,
    stato: 'in_attesa',
    created_at: '2025-01-01T10:00:00Z'
  },
  {
    id: 2,
    giocatore_id: 2,
    squadra_offerta: 2,
    squadra_ricevente: 1,
    valore: 45000000,
    stato: 'accettata',
    created_at: '2025-01-01T09:00:00Z'
  }
];

const mockRichieste = [
  {
    id: 1,
    tipo: 'unione_squadra',
    stato: 'in_attesa',
    lega_id: 1,
    utente_id: 2,
    created_at: '2025-01-01T10:00:00Z'
  },
  {
    id: 2,
    tipo: 'modifica_giocatore',
    stato: 'approvata',
    lega_id: 1,
    utente_id: 3,
    created_at: '2025-01-01T09:00:00Z'
  }
];

// Mock API functions
export const mockApi = {
  // Auth endpoints
  login: async (credentials) => {
    console.log('🔍 MOCK API: Login attempt', credentials);
    
    const user = mockUsers.find(u => 
      u.email === credentials.email && u.password === credentials.password
    );
    
    if (user) {
      // Formato compatibile con auth.js
      return {
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          cognome: user.cognome,
          ruolo: user.ruolo
        },
        token: user.token
      };
    } else {
      throw new Error('Credenziali non valide');
    }
  },

  register: async (userData) => {
    console.log('🔍 MOCK API: Register attempt', userData);
    
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('Email già registrata');
    }
    
    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      token: `mock-token-${Date.now()}`
    };
    
    mockUsers.push(newUser);
    
    // Formato compatibile con auth.js
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        nome: newUser.nome,
        cognome: newUser.cognome,
        ruolo: newUser.ruolo
      },
      token: newUser.token
    };
  },

  verifyUser: async () => {
    console.log('🔍 MOCK API: Verify user');
    const user = mockUsers.find(u => u.id === 1);
    return {
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        cognome: user.cognome,
        ruolo: user.ruolo
      }
    };
  },

  // Leghe endpoints
  getLeghe: async () => {
    console.log('🔍 MOCK API: Get leghe');
    return { leghe: mockLeghe };
  },

  getLegheByUser: async () => {
    console.log('🔍 MOCK API: Get leghe by user');
    return { leghe: mockLeghe.filter(l => l.admin_id === 1) };
  },

  getLegaById: async (id) => {
    console.log('🔍 MOCK API: Get lega by id', id);
    const lega = mockLeghe.find(l => l.id === parseInt(id));
    return lega || null;
  },

  getSquadreByLega: async (legaId) => {
    console.log('🔍 MOCK API: Get squadre by lega', legaId);
    const squadre = mockSquadre.filter(s => s.lega_id === parseInt(legaId));
    return { squadre };
  },

  getLegheAdmin: async () => {
    console.log('🔍 MOCK API: Get leghe admin');
    return { leghe: mockLeghe.filter(l => l.admin_id === 1) };
  },

  getLegheAll: async () => {
    console.log('🔍 MOCK API: Get all leghe');
    return { leghe: mockLeghe };
  },

  getRichiesteAdmin: async () => {
    console.log('🔍 MOCK API: Get richieste admin');
    return { richieste: mockRichieste };
  },

  createLega: async (legaData) => {
    console.log('🔍 MOCK API: Create lega', legaData);
    
    // Trova il prossimo ID disponibile
    const nextId = Math.max(...mockLeghe.map(l => l.id)) + 1;
    
    const newLega = {
      id: nextId,
      nome: legaData.nome || 'Nuova Lega',
      descrizione: legaData.descrizione || 'Lega creata dinamicamente',
      admin_id: 1,
      created_at: new Date().toISOString(),
      stato: 'attiva',
      config: {
        max_squadre: legaData.max_squadre || 20,
        budget_iniziale: legaData.budget_iniziale || 1000000,
        modalita: legaData.modalita || 'standard',
        is_pubblica: legaData.is_pubblica || true,
        password: legaData.password || null,
        min_giocatori: legaData.min_giocatori || 18,
        max_giocatori: legaData.max_giocatori || 25,
        roster_ab: legaData.roster_ab || false,
        cantera: legaData.cantera || false,
        contratti: legaData.contratti || false,
        triggers: legaData.triggers || false
      }
    };
    
    mockLeghe.push(newLega);
    console.log('✅ MOCK API: Lega creata con successo:', newLega);
    return { success: true, lega: newLega };
  },

  deleteLega: async (legaId) => {
    console.log('🔍 MOCK API: Delete lega', legaId);
    const initialLegheCount = mockLeghe.length;
    mockLeghe = mockLeghe.filter(l => l.id !== parseInt(legaId));
    if (mockLeghe.length < initialLegheCount) {
      console.log('✅ MOCK API: Lega eliminata con successo');
      return { success: true, message: 'Lega eliminata con successo' };
    } else {
      console.log('❌ MOCK API: Lega non trovata o già eliminata');
      return { success: false, message: 'Lega non trovata o già eliminata' };
    }
  },

  // Squadre endpoints
  getSquadre: async () => {
    console.log('🔍 MOCK API: Get squadre');
    return { squadre: mockSquadre };
  },

  getSquadreByUser: async () => {
    console.log('🔍 MOCK API: Get squadre by user');
    return { squadre: mockSquadre.filter(s => s.utente_id === 2) };
  },

  getSquadraById: async (id) => {
    console.log('🔍 MOCK API: Get squadra by id', id);
    const squadra = mockSquadre.find(s => s.id === parseInt(id));
    return squadra || null;
  },

  getSquadreByLega: async (legaId) => {
    console.log('🔍 MOCK API: Get squadre by lega', legaId);
    const squadre = mockSquadre.filter(s => s.lega_id === parseInt(legaId));
    return { squadre };
  },

  getMyTeam: async (legaId) => {
    console.log('🔍 MOCK API: Get my team', legaId);
    const squadra = mockSquadre.find(s => s.lega_id === parseInt(legaId) && s.utente_id === 2);
    return squadra || null;
  },

  createSquadra: async (squadraData) => {
    console.log('🔍 MOCK API: Create squadra', squadraData);
    
    const newSquadra = {
      id: mockSquadre.length + 1,
      ...squadraData,
      punti: 0,
      posizione: mockSquadre.length + 1
    };
    
    mockSquadre.push(newSquadra);
    return { success: true, squadra: newSquadra };
  },

  // Giocatori endpoints
  getGiocatori: async () => {
    console.log('🔍 MOCK API: Get giocatori');
    return { giocatori: mockGiocatori };
  },

  getGiocatore: async (id) => {
    console.log('🔍 MOCK API: Get giocatore', id);
    const giocatore = mockGiocatori.find(g => g.id === parseInt(id));
    return giocatore || null;
  },

  getGiocatoriBySquadra: async (squadraId) => {
    console.log('🔍 MOCK API: Get giocatori by squadra', squadraId);
    const giocatori = mockGiocatori.filter(g => g.squadra_id === parseInt(squadraId));
    return { giocatori };
  },

  getGiocatoriByLega: async (legaId) => {
    console.log('🔍 MOCK API: Get giocatori by lega', legaId);
    const giocatori = mockGiocatori.filter(g => g.lega_id === parseInt(legaId));
    return { giocatori };
  },

  // Notifiche endpoints
  getNotifiche: async () => {
    console.log('🔍 MOCK API: Get notifiche');
    return { notifiche: mockNotifiche };
  },

  getNotificheByUser: async () => {
    console.log('🔍 MOCK API: Get notifiche by user');
    return { notifiche: mockNotifiche.filter(n => n.utente_id === 2) };
  },

  markNotificaAsRead: async (id) => {
    console.log('🔍 MOCK API: Mark notifica as read', id);
    const notifica = mockNotifiche.find(n => n.id === parseInt(id));
    if (notifica) {
      notifica.stato = 'letta';
    }
    return { success: true };
  },

  markAllNotificheAsRead: async () => {
    console.log('🔍 MOCK API: Mark all notifiche as read');
    mockNotifiche.forEach(n => {
      if (n.utente_id === 2) {
        n.stato = 'letta';
      }
    });
    return { success: true };
  },

  // Offerte endpoints
  getOfferte: async () => {
    console.log('🔍 MOCK API: Get offerte');
    return { offerte: mockOfferte };
  },

  createOfferta: async (offertaData) => {
    console.log('🔍 MOCK API: Create offerta', offertaData);
    
    const newOfferta = {
      id: mockOfferte.length + 1,
      ...offertaData,
      created_at: new Date().toISOString()
    };
    
    mockOfferte.push(newOfferta);
    return { success: true, offerta: newOfferta };
  },

  getMovimentiByLega: async (legaId) => {
    console.log('🔍 MOCK API: Get movimenti by lega', legaId);
    return { movimenti: [] };
  },

  // Roster endpoints
  getRoster: async (squadraId) => {
    console.log('🔍 MOCK API: Get roster', squadraId);
    const giocatori = mockGiocatori.filter(g => g.squadra_id === parseInt(squadraId));
    return {
      rosterA: giocatori.slice(0, Math.ceil(giocatori.length / 2)),
      rosterB: giocatori.slice(Math.ceil(giocatori.length / 2)),
      squadra_id: squadraId
    };
  },

  movePlayer: async (data) => {
    console.log('🔍 MOCK API: Move player', data);
    return { success: true, message: 'Giocatore spostato con successo' };
  },

  // Subadmin endpoints
  getSubadmins: async () => {
    console.log('🔍 MOCK API: Get subadmins');
    return { subadmins: [] };
  },

  getAllSubadmins: async () => {
    console.log('🔍 MOCK API: Get all subadmins');
    return { subadmins: [] };
  },

  checkSubadmin: async (legaId) => {
    console.log('🔍 MOCK API: Check subadmin', legaId);
    return { isSubadmin: false };
  },

  getSubadminPending: async (legaId) => {
    console.log('🔍 MOCK API: Get subadmin pending', legaId);
    return { pending: [] };
  },

  // Richieste endpoints
  getRichieste: async () => {
    console.log('🔍 MOCK API: Get richieste');
    return { richieste: mockRichieste };
  },

  getRichiesteByUser: async () => {
    console.log('🔍 MOCK API: Get richieste by user');
    return { richieste: mockRichieste.filter(r => r.utente_id === 2) };
  },

  // Tornei endpoints
  getTorneiByLega: async (legaId) => {
    console.log('🔍 MOCK API: Get tornei by lega', legaId);
    return { tornei: [] };
  },

  getTorneoById: async (torneoId) => {
    console.log('🔍 MOCK API: Get torneo by id', torneoId);
    return null;
  },

  createTorneo: async (torneoData) => {
    console.log('🔍 MOCK API: Create torneo', torneoData);
    return { success: true, torneo: { id: 1, ...torneoData } };
  },

  updateTorneo: async (torneoId, torneoData) => {
    console.log('🔍 MOCK API: Update torneo', torneoId, torneoData);
    return { success: true };
  },

  deleteTorneo: async (torneoId) => {
    console.log('🔍 MOCK API: Delete torneo', torneoId);
    return { success: true };
  },

  calcolaGiornata: async (torneoId, giornata) => {
    console.log('🔍 MOCK API: Calcola giornata', torneoId, giornata);
    return { success: true };
  },

  aggiornaClassifica: async (torneoId) => {
    console.log('🔍 MOCK API: Aggiorna classifica', torneoId);
    return { success: true };
  },

  // Utenti endpoints
  getUtenti: async () => {
    console.log('🔍 MOCK API: Get utenti');
    return { utenti: mockUsers };
  },

  getAllUsers: async () => {
    console.log('🔍 MOCK API: Get all users');
    return { users: mockUsers };
  },

  // Health check
  health: async () => {
    console.log('🔍 MOCK API: Health check');
    return { 
      status: 'ok', 
      message: 'Mock API is running',
      timestamp: new Date().toISOString()
    };
  },

  // Generic error handler
  handleError: (error) => {
    console.error('🚨 MOCK API ERROR:', error);
    return {
      success: false,
      error: error.message || 'Errore sconosciuto'
    };
  }
};

// Mock fetch function
export const mockFetch = async (url, options = {}) => {
  console.log('🔍 MOCK FETCH:', url, options);
  
  try {
    // Parse URL to determine endpoint
    const endpoint = url.split('/api')[1] || url;
    
    switch (endpoint) {
      case '/auth/login':
        if (options.method === 'POST') {
          const body = JSON.parse(options.body);
          const result = await mockApi.login(body);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/auth/register':
        if (options.method === 'POST') {
          const body = JSON.parse(options.body);
          const result = await mockApi.register(body);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/auth/verify-user':
        if (options.method === 'GET') {
          const result = await mockApi.verifyUser();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/auth/verify':
        if (options.method === 'GET') {
          const result = await mockApi.verifyUser();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/leghe':
        if (options.method === 'GET') {
          const result = await mockApi.getLeghe();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/leghe/user-leagues':
        if (options.method === 'GET') {
          const result = await mockApi.getLegheByUser();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/leghe/admin':
        if (options.method === 'GET') {
          const result = await mockApi.getLegheAdmin();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/leghe/all':
        if (options.method === 'GET') {
          const result = await mockApi.getLegheAll();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/leghe/create':
        if (options.method === 'POST') {
          const result = await mockApi.createLega(options.body ? JSON.parse(options.body) : {});
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/leghe/':
        if (options.method === 'DELETE') {
          const legaId = endpoint.split('/')[2];
          const result = await mockApi.deleteLega(legaId);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/leghe/richieste/admin':
        if (options.method === 'GET') {
          const result = await mockApi.getRichiesteAdmin();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/squadre':
        if (options.method === 'GET') {
          const result = await mockApi.getSquadre();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/squadre/utente':
        if (options.method === 'GET') {
          const result = await mockApi.getSquadreByUser();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/squadre/my-team':
        if (options.method === 'GET') {
          const result = await mockApi.getMyTeam(1);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/giocatori':
        if (options.method === 'GET') {
          const result = await mockApi.getGiocatori();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/notifiche':
        if (options.method === 'GET') {
          const result = await mockApi.getNotifiche();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/notifiche/utente':
        if (options.method === 'GET') {
          const result = await mockApi.getNotificheByUser();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/offerte':
        if (options.method === 'GET') {
          const result = await mockApi.getOfferte();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/offerte/crea':
        if (options.method === 'POST') {
          const body = JSON.parse(options.body);
          const result = await mockApi.createOfferta(body);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/offerte/roster/1':
        if (options.method === 'GET') {
          const result = await mockApi.getRoster(1);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/offerte/roster/move-player':
        if (options.method === 'POST') {
          const body = JSON.parse(options.body);
          const result = await mockApi.movePlayer(body);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/subadmin/check-all':
        if (options.method === 'GET') {
          const result = await mockApi.getSubadmins();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/subadmin/all':
        if (options.method === 'GET') {
          const result = await mockApi.getAllSubadmins();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/auth/all-users':
        if (options.method === 'GET') {
          const result = await mockApi.getAllUsers();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/richieste/subadmin':
        if (options.method === 'GET') {
          const result = await mockApi.getRichieste();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/richieste/utente':
        if (options.method === 'GET') {
          const result = await mockApi.getRichiesteByUser();
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/tornei/lega/':
        if (options.method === 'GET') {
          const legaId = endpoint.split('/')[3];
          const result = await mockApi.getTorneiByLega(legaId);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/tornei/':
        if (!endpoint.includes('/lega/') && !endpoint.includes('/calcola-giornata') && !endpoint.includes('/aggiorna-classifica') && options.method === 'GET') {
          const torneoId = endpoint.split('/')[2];
          const result = await mockApi.getTorneoById(torneoId);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/tornei':
        if (!endpoint.includes('/lega/') && !endpoint.includes('/calcola-giornata') && !endpoint.includes('/aggiorna-classifica') && options.method === 'POST') {
          const result = await mockApi.createTorneo(options.body ? JSON.parse(options.body) : {});
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/tornei/':
        if (!endpoint.includes('/lega/') && !endpoint.includes('/calcola-giornata') && !endpoint.includes('/aggiorna-classifica') && options.method === 'PUT') {
          const torneoId = endpoint.split('/')[2];
          const result = await mockApi.updateTorneo(torneoId, options.body ? JSON.parse(options.body) : {});
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/tornei/':
        if (!endpoint.includes('/lega/') && !endpoint.includes('/calcola-giornata') && !endpoint.includes('/aggiorna-classifica') && options.method === 'DELETE') {
          const torneoId = endpoint.split('/')[2];
          const result = await mockApi.deleteTorneo(torneoId);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/calcola-giornata':
        if (options.method === 'POST') {
          const torneoId = endpoint.split('/')[2];
          const body = options.body ? JSON.parse(options.body) : {};
          const result = await mockApi.calcolaGiornata(torneoId, body.giornata);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      case '/aggiorna-classifica':
        if (options.method === 'POST') {
          const torneoId = endpoint.split('/')[2];
          const result = await mockApi.aggiornaClassifica(torneoId);
          return {
            ok: true,
            json: async () => result
          };
        }
        break;
        
      // Gestione generica per endpoint non specificati
      if (endpoint.includes('/notifiche/') && options.method === 'PUT') {
        const result = await mockApi.markNotificaAsRead(1);
        return {
          ok: true,
          json: async () => result
        };
      }
      
      if (endpoint.includes('/notifiche/tutte-lette') && options.method === 'PUT') {
        const result = await mockApi.markAllNotificheAsRead();
        return {
          ok: true,
          json: async () => result
        };
      }
      
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Endpoint non trovato', endpoint })
      };
    }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      json: async () => mockApi.handleError(error)
    };
  }
}; 