#!/usr/bin/env node

// Debug script per il 500 Internal Server Error su POST /api/leghe/create
const fs = require('fs');

// Simula il payload esatto del frontend
async function debug500Error() {
  console.log('🔍 DEBUG 500 Internal Server Error - POST /api/leghe/create');
  console.log('=' .repeat(60));
  
  // 1. Test con JSON (come fa il frontend quando non ha file)
  console.log('\n📋 Test 1: JSON payload (senza file)');
  try {
    const jsonPayload = {
      nome: 'Test Lega Debug',
      modalita: 'Serie A Classic',
      is_pubblica: true,
      password: '',
      max_squadre: '20',
      min_giocatori: '0',
      max_giocatori: '0',
      roster_ab: false,
      cantera: false,
      contratti: false,
      triggers: false,
      fantacalcio_url: '',
      fantacalcio_username: '',
      fantacalcio_password: '',
      scraping_automatico: false,
      admin_id: '1'
    };
    
    const response1 = await fetch('https://www.top-league.org/api/leghe/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_token_for_debug'
      },
      body: JSON.stringify(jsonPayload)
    });
    
    console.log('Status:', response1.status);
    console.log('Headers:', Object.fromEntries(response1.headers.entries()));
    const data1 = await response1.text();
    console.log('Response:', data1);
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
  
  // 2. Test con FormData (come fa il frontend con file)
  console.log('\n📋 Test 2: FormData payload (con file Excel)');
  try {
    // Crea un file Excel di test
    const testExcelPath = './debug-test.xlsx';
    const testExcelContent = Buffer.from('dummy excel content for debug');
    fs.writeFileSync(testExcelPath, testExcelContent);
    
    const formData = new FormData();
    
    // Aggiungi tutti i campi che il frontend invia
    formData.append('nome', 'Test Lega Debug FormData');
    formData.append('modalita', 'Serie A Classic');
    formData.append('is_pubblica', 'true');
    formData.append('password', '');
    formData.append('max_squadre', '20');
    formData.append('min_giocatori', '0');
    formData.append('max_giocatori', '0');
    formData.append('roster_ab', 'false');
    formData.append('cantera', 'false');
    formData.append('contratti', 'false');
    formData.append('triggers', 'false');
    formData.append('fantacalcio_url', '');
    formData.append('fantacalcio_username', '');
    formData.append('fantacalcio_password', '');
    formData.append('scraping_automatico', 'false');
    formData.append('admin_id', '1');
    
    // Aggiungi il file Excel
    formData.append('excel', fs.createReadStream(testExcelPath), {
      filename: 'debug-test.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    console.log('📋 FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${typeof value === 'object' ? 'File' : value}`);
    }
    
    const response2 = await fetch('https://www.top-league.org/api/leghe/create', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer fake_token_for_debug'
      }
    });
    
    console.log('Status:', response2.status);
    console.log('Headers:', Object.fromEntries(response2.headers.entries()));
    const data2 = await response2.text();
    console.log('Response:', data2);
    
    // Pulisci il file di test
    if (fs.existsSync(testExcelPath)) {
      fs.unlinkSync(testExcelPath);
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  // 3. Test con payload minimo
  console.log('\n📋 Test 3: Payload minimo');
  try {
    const minimalPayload = {
      nome: 'Test Minimo',
      modalita: 'Serie A Classic'
    };
    
    const response3 = await fetch('https://www.top-league.org/api/leghe/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_token_for_debug'
      },
      body: JSON.stringify(minimalPayload)
    });
    
    console.log('Status:', response3.status);
    const data3 = await response3.text();
    console.log('Response:', data3);
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
  
  // 4. Test senza token (dovrebbe dare 401)
  console.log('\n📋 Test 4: Senza token (dovrebbe dare 401)');
  try {
    const response4 = await fetch('https://www.top-league.org/api/leghe/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Test Senza Token',
        modalita: 'Serie A Classic'
      })
    });
    
    console.log('Status:', response4.status);
    const data4 = await response4.text();
    console.log('Response:', data4);
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }
  
  console.log('\n✅ Debug tests completed');
  console.log('\n📊 SUMMARY:');
  console.log('- Se tutti i test danno 401: Il server funziona correttamente');
  console.log('- Se qualche test dà 500: C\'è un problema specifico');
  console.log('- Se qualche test dà 400: C\'è un problema di validazione');
}

// Esegui il debug
debug500Error().catch(console.error); 