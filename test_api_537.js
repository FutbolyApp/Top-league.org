const axios = require('axios');

const API_BASE_URL = 'https://topleaguem.onrender.com/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3BsZWFndWUuY29tIiwicnVvbG8iOiJTdXBlckFkbWluIiwiaWF0IjoxNzUyOTYyMjQwLCJleHAiOjE3NTM1NjcwNDB9.-0W6ImnZKK_BlFS0NqQ9-mY-iYVa-HLtwrRpa2L-mxc';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testGiocatore537() {
  console.log('🔍 Testando giocatore 537...\n');

  try {
    // 1. Test GET giocatore 537
    console.log('1️⃣ Test GET /api/giocatori/537');
    const giocatoreResponse = await axios.get(`${API_BASE_URL}/giocatori/537`, { headers });
    console.log('✅ Giocatore trovato:', giocatoreResponse.data);
    
    const giocatore = giocatoreResponse.data?.data?.giocatore || giocatoreResponse.data?.giocatore;
    console.log('📋 Dati giocatore:', {
      id: giocatore?.id,
      nome: giocatore?.nome,
      squadra_id: giocatore?.squadra_id,
      roster: giocatore?.roster
    });

    // 2. Test GET squadra del giocatore
    if (giocatore?.squadra_id) {
      console.log('\n2️⃣ Test GET /api/squadre/' + giocatore.squadra_id);
      const squadraResponse = await axios.get(`${API_BASE_URL}/squadre/${giocatore.squadra_id}`, { headers });
      console.log('✅ Squadra trovata:', squadraResponse.data);
      
      const squadra = squadraResponse.data?.data?.squadra || squadraResponse.data?.squadra;
      console.log('📋 Dati squadra:', {
        id: squadra?.id,
        nome: squadra?.nome,
        proprietario_id: squadra?.proprietario_id
      });
    }

    // 3. Test POST contratti/impostazioni/537
    console.log('\n3️⃣ Test POST /api/contratti/impostazioni/537');
    const impostazioniData = {
      prestito: false,
      trasferimento: true,
      valorePrestito: 0,
      valoreTrasferimento: 7
    };
    
    const impostazioniResponse = await axios.post(
      `${API_BASE_URL}/contratti/impostazioni/537`,
      impostazioniData,
      { headers }
    );
    console.log('✅ Impostazioni aggiornate:', impostazioniResponse.data);

  } catch (error) {
    console.error('❌ Errore:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 404) {
      console.log('\n🔍 Analisi errore 404:');
      console.log('- Se è GET /giocatori/537: il giocatore non esiste');
      console.log('- Se è GET /squadre/:id: la squadra non esiste');
      console.log('- Se è POST /contratti/impostazioni/537: il giocatore non è autorizzato');
    }
  }
}

async function testAlternativeGiocatori() {
  console.log('\n🔍 Testando giocatori alternativi...\n');

  try {
    // Test con giocatore 1
    console.log('1️⃣ Test GET /api/giocatori/1');
    const giocatore1Response = await axios.get(`${API_BASE_URL}/giocatori/1`, { headers });
    console.log('✅ Giocatore 1 trovato:', giocatore1Response.data);
    
    const giocatore1 = giocatore1Response.data?.data?.giocatore || giocatore1Response.data?.giocatore;
    console.log('📋 Dati giocatore 1:', {
      id: giocatore1?.id,
      nome: giocatore1?.nome,
      squadra_id: giocatore1?.squadra_id,
      roster: giocatore1?.roster
    });

    // Test POST contratti/impostazioni/1
    if (giocatore1?.id) {
      console.log('\n2️⃣ Test POST /api/contratti/impostazioni/1');
      const impostazioniData = {
        prestito: false,
        trasferimento: true,
        valorePrestito: 0,
        valoreTrasferimento: 5
      };
      
      const impostazioniResponse = await axios.post(
        `${API_BASE_URL}/contratti/impostazioni/1`,
        impostazioniData,
        { headers }
      );
      console.log('✅ Impostazioni aggiornate per giocatore 1:', impostazioniResponse.data);
    }

  } catch (error) {
    console.error('❌ Errore test alternativo:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

async function testSquadreUtente() {
  console.log('\n🔍 Testando squadre dell\'utente...\n');

  try {
    // Test GET squadre utente
    console.log('1️⃣ Test GET /api/squadre/utente');
    const squadreResponse = await axios.get(`${API_BASE_URL}/squadre/utente`, { headers });
    console.log('✅ Squadre utente:', squadreResponse.data);
    
    const squadre = squadreResponse.data?.data?.squadre || squadreResponse.data?.squadre || [];
    console.log('📋 Numero squadre:', squadre.length);
    
    if (squadre.length > 0) {
      const primaSquadra = squadre[0];
      console.log('📋 Prima squadra:', {
        id: primaSquadra?.id,
        nome: primaSquadra?.nome,
        proprietario_id: primaSquadra?.proprietario_id
      });

      // Test GET giocatori della prima squadra
      console.log('\n2️⃣ Test GET /api/giocatori/squadra/' + primaSquadra.id);
      const giocatoriResponse = await axios.get(`${API_BASE_URL}/giocatori/squadra/${primaSquadra.id}`, { headers });
      console.log('✅ Giocatori squadra:', giocatoriResponse.data);
      
      const giocatori = giocatoriResponse.data?.data?.giocatori || giocatoriResponse.data?.giocatori || [];
      console.log('📋 Numero giocatori:', giocatori.length);
      
      if (giocatori.length > 0) {
        const primoGiocatore = giocatori[0];
        console.log('📋 Primo giocatore:', {
          id: primoGiocatore?.id,
          nome: primoGiocatore?.nome,
          roster: primoGiocatore?.roster
        });

        // Test POST contratti/impostazioni con primo giocatore
        console.log('\n3️⃣ Test POST /api/contratti/impostazioni/' + primoGiocatore.id);
        const impostazioniData = {
          prestito: false,
          trasferimento: true,
          valorePrestito: 0,
          valoreTrasferimento: 10
        };
        
        const impostazioniResponse = await axios.post(
          `${API_BASE_URL}/contratti/impostazioni/${primoGiocatore.id}`,
          impostazioniData,
          { headers }
        );
        console.log('✅ Impostazioni aggiornate per primo giocatore:', impostazioniResponse.data);
      }
    }

  } catch (error) {
    console.error('❌ Errore test squadre:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

async function runAllTests() {
  console.log('🚀 Iniziando test API...\n');
  
  await testGiocatore537();
  await testAlternativeGiocatori();
  await testSquadreUtente();
  
  console.log('\n✅ Test completati!');
}

runAllTests().catch(console.error); 