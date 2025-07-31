const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createTestUser() {
  console.log('🧪 Creazione utente di test...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'topleagued_local'
  });
  
  try {
    // Controlla se l'utente esiste già
    const [existingUsers] = await connection.execute('SELECT id, email FROM users WHERE email = ?', ['test@example.com']);
    
    let userId;
    if (existingUsers.length > 0) {
      console.log('✅ Utente di test già esistente con ID:', existingUsers[0].id);
      userId = existingUsers[0].id;
    } else {
      // Crea un utente di test
      const passwordHash = await bcrypt.hash('password123', 10);
      
      const [result] = await connection.execute(`
        INSERT INTO users (nome, cognome, username, email, password_hash, ruolo)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['Test', 'User', 'testuser', 'test@example.com', passwordHash, 'admin']);
      
      console.log('✅ Utente di test creato con ID:', result.insertId);
      userId = result.insertId;
    }
    
    // Ora facciamo login per ottenere un token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login effettuato con successo');
      console.log('🔑 Token:', loginResult.token);
      
      // Ora testiamo la creazione lega con il token valido
      await testCreaLega(loginResult.token, userId);
    } else {
      console.log('❌ Errore login:', loginResult.error);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await connection.end();
  }
}

async function testCreaLega(token, userId) {
  console.log('🧪 Test creazione lega con token valido...');
  
  const fs = require('fs');
  const FormData = require('form-data');
  
  // Crea un file Excel di test
  const testData = `
Nome Squadra,Ruolo,Calciatore,Squadra,Costo
Milan,P,D. Maignan,Milan,50
Milan,D,T. Hernandez,Milan,45
Milan,D,F. Tomori,Milan,40
Milan,C,S. Tonali,Milan,35
Milan,A,O. Giroud,Milan,30
Crediti Residui,100
Inter,P,S. Handanovic,Inter,50
Inter,D,M. Skriniar,Inter,45
Inter,D,A. Bastoni,Inter,40
Inter,C,N. Barella,Inter,35
Inter,A,L. Martinez,Inter,30
Crediti Residui,100
  `.trim();
  
  // Scrivi il file Excel di test
  fs.writeFileSync('test-squadre.csv', testData);
  console.log('✅ File Excel di test creato');
  
  // Crea FormData
  const formData = new FormData();
  formData.append('nome', 'Test Lega');
  formData.append('modalita', 'Serie A Classic');
  formData.append('is_pubblica', 'true');
  formData.append('max_squadre', '2');
  formData.append('admin_id', userId.toString());
  formData.append('excel', fs.createReadStream('test-squadre.csv'));
  
  console.log('📤 Invio richiesta creazione lega...');
  
  try {
    const response = await fetch('http://localhost:3001/api/leghe/create', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    console.log('📥 Risposta server:', result);
    
    if (response.ok) {
      console.log('✅ Lega creata con successo!');
      console.log('🔍 ID Lega:', result.legaId);
      console.log('🔍 Squadre create:', result.squadreCreate);
      
      // Verifica che la lega sia stata creata nel database
      await verifyLegaCreated(result.legaId);
    } else {
      console.log('❌ Errore creazione lega:', result.error);
      console.log('❌ Dettagli:', result.details);
    }
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  }
  
  // Pulisci il file di test
  fs.unlinkSync('test-squadre.csv');
}

async function verifyLegaCreated(legaId) {
  console.log('🔍 Verifica creazione lega nel database...');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'topleagued_local'
  });
  
  try {
    // Verifica lega
    const [leghe] = await connection.execute('SELECT * FROM leghe WHERE id = ?', [legaId]);
    console.log('✅ Lega trovata nel database:', leghe[0]);
    
    // Verifica squadre
    const [squadre] = await connection.execute('SELECT * FROM squadre WHERE lega_id = ?', [legaId]);
    console.log('✅ Squadre trovate:', squadre.length);
    
    // Verifica giocatori
    const [giocatori] = await connection.execute('SELECT * FROM giocatori WHERE squadra_id IN (SELECT id FROM squadre WHERE lega_id = ?)', [legaId]);
    console.log('✅ Giocatori trovati:', giocatori.length);
    
  } catch (error) {
    console.error('❌ Errore verifica:', error);
  } finally {
    await connection.end();
  }
}

createTestUser(); 