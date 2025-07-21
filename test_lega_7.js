const axios = require('axios');

const API_BASE_URL = 'https://topleaguem.onrender.com/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3BsZWFndWUuY29tIiwicnVvbG8iOiJTdXBlckFkbWluIiwiaWF0IjoxNzUyOTYyMjQwLCJleHAiOjE3NTM1NjcwNDB9.-0W6ImnZKK_BlFS0NqQ9-mY-iYVa-HLtwrRpa2L-mxc';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testLega7() {
  console.log('🔍 Testando lega 7...\n');

  try {
    // 1. Test GET lega 7
    console.log('1️⃣ Test GET /api/leghe/7');
    const legaResponse = await axios.get(`${API_BASE_URL}/leghe/7`, { headers });
    console.log('✅ Lega trovata:', legaResponse.data);
    
    const lega = legaResponse.data?.data?.lega || legaResponse.data?.lega;
    console.log('📋 Dati lega:', {
      id: lega?.id,
      nome: lega?.nome,
      admin_id: lega?.admin_id
    });

    // 2. Test GET squadre lega 7
    console.log('\n2️⃣ Test GET /api/squadre/lega/7');
    const squadreResponse = await axios.get(`${API_BASE_URL}/squadre/lega/7`, { headers });
    console.log('✅ Squadre trovate:', squadreResponse.data);
    
    const squadre = squadreResponse.data?.data?.squadre || squadreResponse.data?.squadre || [];
    console.log('📋 Numero squadre:', squadre.length);
    
    if (squadre.length > 0) {
      console.log('📋 Prima squadra:', {
        id: squadre[0]?.id,
        nome: squadre[0]?.nome,
        proprietario_id: squadre[0]?.proprietario_id
      });
    }

  } catch (error) {
    console.error('❌ Errore:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 500) {
      console.log('\n🔍 Analisi errore 500:');
      console.log('- Errore interno del server');
      console.log('- Possibile problema nella query SQL');
      console.log('- Possibile problema di permessi');
    }
  }
}

async function testLegheAlternative() {
  console.log('\n🔍 Testando leghe alternative...\n');

  try {
    // Test con lega 6
    console.log('1️⃣ Test GET /api/leghe/6');
    const lega6Response = await axios.get(`${API_BASE_URL}/leghe/6`, { headers });
    console.log('✅ Lega 6 trovata:', lega6Response.data);
    
    const lega6 = lega6Response.data?.data?.lega || lega6Response.data?.lega;
    console.log('📋 Dati lega 6:', {
      id: lega6?.id,
      nome: lega6?.nome,
      admin_id: lega6?.admin_id
    });

    // Test GET squadre lega 6
    console.log('\n2️⃣ Test GET /api/squadre/lega/6');
    const squadre6Response = await axios.get(`${API_BASE_URL}/squadre/lega/6`, { headers });
    console.log('✅ Squadre lega 6 trovate:', squadre6Response.data);
    
    const squadre6 = squadre6Response.data?.data?.squadre || squadre6Response.data?.squadre || [];
    console.log('📋 Numero squadre lega 6:', squadre6.length);

  } catch (error) {
    console.error('❌ Errore test alternativo:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

async function testAllLeghe() {
  console.log('\n🔍 Testando tutte le leghe...\n');

  try {
    // Test GET tutte le leghe
    console.log('1️⃣ Test GET /api/leghe');
    const legheResponse = await axios.get(`${API_BASE_URL}/leghe`, { headers });
    console.log('✅ Leghe trovate:', legheResponse.data);
    
    const leghe = legheResponse.data?.data?.leghe || legheResponse.data?.leghe || [];
    console.log('📋 Numero leghe:', leghe.length);
    
    if (leghe.length > 0) {
      console.log('📋 Leghe disponibili:');
      leghe.forEach(lega => {
        console.log(`  - ID: ${lega.id}, Nome: ${lega.nome}, Admin: ${lega.admin_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Errore test leghe:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

async function runAllTests() {
  console.log('🚀 Iniziando test lega 7...\n');
  
  await testLega7();
  await testLegheAlternative();
  await testAllLeghe();
  
  console.log('\n✅ Test completati!');
}

runAllTests().catch(console.error); 