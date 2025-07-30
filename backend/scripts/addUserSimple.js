import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '25QQj2Fh',
  database: 'topleague_prod',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addUser() {
  try {
    console.log('Adding user admin@top-league.org...');
    
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const [result] = await pool.execute(`
      INSERT INTO users (nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email = email
    `, [
      'Admin',
      'Test', 
      'admin',
      'Roma',
      'Roma',
      'Setup',
      'admin@top-league.org',
      hashedPassword,
      'admin'
    ]);
    
    console.log('User added successfully!');
    console.log('Email: admin@top-league.org');
    console.log('Password: password');
    
  } catch (error) {
    console.error('Error adding user:', error);
  } finally {
    await pool.end();
  }
}

addUser(); 