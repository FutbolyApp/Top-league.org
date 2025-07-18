import bcrypt from 'bcryptjs';

async function createProductionUser() {
  try {
    console.log('Creating test user in production database...');
    
    const response = await fetch('https://topleaguem.onrender.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: 'Test',
        cognome: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123',
        provenienza: 'Test',
        squadra_cuore: 'Test Team',
        come_conosciuto: 'Test',
        ruolo: 'Utente'
      }),
    });
    
    const data = await response.json();
    console.log('Registration response:', data);
    
    if (response.ok) {
      console.log('✅ Test user created successfully');
      
      // Test login
      console.log('Testing login...');
      const loginResponse = await fetch('https://topleaguem.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'test123'
        }),
      });
      
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginResponse.ok) {
        console.log('✅ Login successful');
        console.log('Token:', loginData.token ? 'Present' : 'Missing');
        console.log('User:', loginData.user ? 'Present' : 'Missing');
      } else {
        console.log('❌ Login failed:', loginData.error);
      }
    } else {
      console.log('❌ User creation failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createProductionUser(); 