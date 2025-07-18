import { getDb } from './db/postgres.js';
import bcrypt from 'bcryptjs';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    const db = getDb();
    
    if (!db) {
      console.log('❌ Database not available');
      return;
    }
    
    console.log('✅ Database connected');
    
    // Check users table
    const usersResult = await db.query('SELECT id, username, email, ruolo FROM utenti LIMIT 5');
    console.log('Users in database:', usersResult.rows);
    
    // Check if we have any users
    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in database');
      console.log('Creating a test user...');
      
      const password_hash = bcrypt.hashSync('test123', 10);
      
      const insertResult = await db.query(`
        INSERT INTO utenti (nome, cognome, username, email, password_hash, ruolo) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, username, email
      `, ['Test', 'User', 'testuser', 'test@example.com', password_hash, 'Utente']);
      
      console.log('✅ Test user created:', insertResult.rows[0]);
    } else {
      console.log('✅ Users found in database');
    }
    
    // Test login with first user
    const firstUser = usersResult.rows[0];
    if (firstUser) {
      console.log('Testing login with user:', firstUser.username);
      
      // Get user with password hash
      const userWithPassword = await db.query('SELECT * FROM utenti WHERE id = $1', [firstUser.id]);
      console.log('User found:', userWithPassword.rows[0] ? 'Yes' : 'No');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDatabase(); 