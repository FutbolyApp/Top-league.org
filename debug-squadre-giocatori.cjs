#!/usr/bin/env node

// Comprehensive debug script for squadre and giocatori issues
const fetch = require('node-fetch');

const API_BASE = 'https://top-league.org/api';
const DEBUG_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInVzZXJuYW1lIjoiZnV0Ym9seSIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTczMjU5NzI5MSwiZXhwIjoxNzMyNjgzNjkxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

console.log('🔍 DEBUG SCRIPT: Testing squadre and giocatori endpoints');
console.log('=' .repeat(60));

// Test 1: Check API health
async function testApiHealth() {
  console.log('\n🔍 TEST 1: API Health Check');
  try {
    const response = await fetch(`${API_BASE}/version`);
    const data = await response.json();
    console.log('✅ API Health:', data);
  } catch (error) {
    console.error('❌ API Health Error:', error.message);
  }
}

// Test 2: Check database connection
async function testDatabaseConnection() {
  console.log('\n🔍 TEST 2: Database Connection');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Database Status:', data);
  } catch (error) {
    console.error('❌ Database Error:', error.message);
  }
}

// Test 3: Check all leghe
async function testLeghe() {
  console.log('\n🔍 TEST 3: Leghe Check');
  try {
    const response = await fetch(`${API_BASE}/leghe`, {
      headers: {
        'Authorization': `Bearer ${DEBUG_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Leghe Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Leghe found:', data.data?.length || 0);
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((lega, index) => {
        console.log(`  ${index + 1}. ID: ${lega.id}, Nome: ${lega.nome}, Squadre: ${lega.num_squadre || 'N/A'}`);
      });
    }
  } catch (error) {
    console.error('❌ Leghe Error:', error.message);
  }
}

// Test 4: Check squadre for each lega
async function testSquadre() {
  console.log('\n🔍 TEST 4: Squadre Check');
  try {
    const response = await fetch(`${API_BASE}/squadre`, {
      headers: {
        'Authorization': `Bearer ${DEBUG_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Squadre Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Squadre found:', data.data?.length || 0);
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((squadra, index) => {
        console.log(`  ${index + 1}. ID: ${squadra.id}, Nome: ${squadra.nome}, Lega: ${squadra.lega_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Squadre Error:', error.message);
  }
}

// Test 5: Check specific squadra with giocatori
async function testSquadraWithGiocatori(squadraId) {
  console.log(`\n🔍 TEST 5: Squadra ${squadraId} with Giocatori`);
  
  // Test squadra details
  try {
    const squadraResponse = await fetch(`${API_BASE}/squadre/${squadraId}`, {
      headers: {
        'Authorization': `Bearer ${DEBUG_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!squadraResponse.ok) {
      console.error(`❌ Squadra ${squadraId} Error:`, squadraResponse.status, squadraResponse.statusText);
      const errorText = await squadraResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const squadraData = await squadraResponse.json();
    console.log(`✅ Squadra ${squadraId}:`, squadraData.data?.squadra?.nome || 'Unknown');
    
    // Test giocatori for this squadra
    try {
      const giocatoriResponse = await fetch(`${API_BASE}/giocatori/squadra/${squadraId}`, {
        headers: {
          'Authorization': `Bearer ${DEBUG_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`🔍 Giocatori Response Status: ${giocatoriResponse.status} ${giocatoriResponse.statusText}`);
      
      if (!giocatoriResponse.ok) {
        console.error(`❌ Giocatori for squadra ${squadraId} Error:`, giocatoriResponse.status, giocatoriResponse.statusText);
        const errorText = await giocatoriResponse.text();
        console.error('Error details:', errorText);
        return;
      }
      
      const giocatoriData = await giocatoriResponse.json();
      console.log(`✅ Giocatori for squadra ${squadraId}:`, giocatoriData.data?.giocatori?.length || 0);
      
      if (giocatoriData.data?.giocatori && Array.isArray(giocatoriData.data.giocatori)) {
        giocatoriData.data.giocatori.forEach((giocatore, index) => {
          console.log(`  ${index + 1}. ${giocatore.nome} ${giocatore.cognome} (${giocatore.ruolo})`);
        });
      }
    } catch (giocatoriError) {
      console.error(`❌ Giocatori Error for squadra ${squadraId}:`, giocatoriError.message);
    }
    
  } catch (squadraError) {
    console.error(`❌ Squadra Error for ${squadraId}:`, squadraError.message);
  }
}

// Test 6: Check database schema
async function testDatabaseSchema() {
  console.log('\n🔍 TEST 6: Database Schema Check');
  try {
    const response = await fetch(`${API_BASE}/schema`, {
      headers: {
        'Authorization': `Bearer ${DEBUG_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Schema Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Schema check completed');
    
    // Check specific tables
    if (data.tables) {
      const giocatoriTable = data.tables.find(t => t.name === 'giocatori');
      if (giocatoriTable) {
        console.log('✅ Giocatori table found with columns:', giocatoriTable.columns.map(c => c.name));
      } else {
        console.error('❌ Giocatori table not found');
      }
      
      const squadreTable = data.tables.find(t => t.name === 'squadre');
      if (squadreTable) {
        console.log('✅ Squadre table found with columns:', squadreTable.columns.map(c => c.name));
      } else {
        console.error('❌ Squadre table not found');
      }
    }
  } catch (error) {
    console.error('❌ Schema Error:', error.message);
  }
}

// Test 7: Check specific error endpoints
async function testErrorEndpoints() {
  console.log('\n🔍 TEST 7: Error Endpoints Check');
  
  const testEndpoints = [
    '/giocatori/squadra/1',
    '/giocatori/squadra/72',
    '/giocatori/squadra/999',
    '/squadre/1',
    '/squadre/72',
    '/squadre/999'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${DEBUG_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`  Error: ${errorText}`);
      } else {
        const data = await response.json();
        console.log(`  Success: ${JSON.stringify(data).substring(0, 200)}...`);
      }
    } catch (error) {
      console.error(`  Network Error: ${error.message}`);
    }
  }
}

// Main execution
async function runDebugTests() {
  console.log('🚀 Starting comprehensive debug tests...\n');
  
  await testApiHealth();
  await testDatabaseConnection();
  await testLeghe();
  await testSquadre();
  await testSquadraWithGiocatori(72); // Test the squadra that's failing
  await testSquadraWithGiocatori(1);  // Test another squadra
  await testDatabaseSchema();
  await testErrorEndpoints();
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Debug tests completed!');
}

// Run the tests
runDebugTests().catch(console.error); 