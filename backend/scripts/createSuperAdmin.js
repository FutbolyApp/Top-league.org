import bcrypt from 'bcryptjs';
import { getDb } from '../db/postgres.js';

const db = getDb();

// Funzione per creare il SuperAdmin
async function createSuperAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    // Inserisco tutti i campi nell'ordine corretto
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO users (nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      'Futboly',
      'Admin',
      'futboly', // username
      'Roma', // provenienza
      'Roma', // squadra_cuore
      'Setup', // come_conosciuto
      'admin@topleague.com',
      hashedPassword,
      'SuperAdmin'
    );
    stmt.finalize();
    console.log('SuperAdmin creato con successo!');
    console.log('Email: admin@topleague.com');
    console.log('Username: superadmin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Errore creazione SuperAdmin:', error);
  }
}

// Funzione per creare utenti di test
async function createTestUsers() {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    const testUsers = [
      {
        nome: 'Mario',
        cognome: 'Rossi',
        username: 'mariorossi',
        provenienza: 'Milano',
        squadra_cuore: 'Inter',
        come_conosciuto: 'Amici',
        email: 'mario@test.com',
        password_hash: hashedPassword,
        ruolo: 'Utente'
      },
      {
        nome: 'Giulia',
        cognome: 'Bianchi',
        username: 'giuliabianchi',
        provenienza: 'Roma',
        squadra_cuore: 'Roma',
        come_conosciuto: 'Social Media',
        email: 'giulia@test.com',
        password_hash: hashedPassword,
        ruolo: 'Utente'
      }
    ];
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO users 
      (nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    testUsers.forEach(user => {
      stmt.run(
        user.nome,
        user.cognome,
        user.username,
        user.provenienza,
        user.squadra_cuore,
        user.come_conosciuto,
        user.email,
        user.password_hash,
        user.ruolo
      );
    });
    stmt.finalize();
    console.log('Utenti di test creati con successo!');
    console.log('Email: mario@test.com, giulia@test.com');
    console.log('Username: mariorossi, giuliabianchi');
    console.log('Password: test123');
  } catch (error) {
    console.error('Errore creazione utenti di test:', error);
  }
}

// Esegui le funzioni
createSuperAdmin().then(() => {
  createTestUsers().then(() => {
    db.close();
    console.log('Setup completato!');
  });
}); 