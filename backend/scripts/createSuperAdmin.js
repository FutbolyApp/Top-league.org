import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica le variabili d'ambiente dal file env.local
dotenv.config({ path: path.join(__dirname, '../env.local') });

const db = getDb();

// Funzione per creare il SuperAdmin
async function createSuperAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Verifica se l'utente esiste già
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@topleague.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('SuperAdmin già esistente!');
      return;
    }

    // Inserisci il SuperAdmin
    await db.query(`
      INSERT INTO users (nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      'Futboly',
      'Admin',
      'futboly', // username
      'Roma', // provenienza
      'Roma', // squadra_cuore
      'Setup', // come_conosciuto
      'admin@topleague.com',
      hashedPassword,
      'SuperAdmin'
    ]);

    console.log('SuperAdmin creato con successo!');
    console.log('Email: admin@topleague.com');
    console.log('Username: futboly');
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

    for (const user of testUsers) {
      // Verifica se l'utente esiste già
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`Utente ${user.email} già esistente!`);
        continue;
      }

      // Inserisci l'utente
      await db.query(`
        INSERT INTO users 
        (nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        user.nome,
        user.cognome,
        user.username,
        user.provenienza,
        user.squadra_cuore,
        user.come_conosciuto,
        user.email,
        user.password_hash,
        user.ruolo
      ]);
    }

    console.log('Utenti di test creati con successo!');
    console.log('Email: mario@test.com, giulia@test.com');
    console.log('Username: mariorossi, giuliabianchi');
    console.log('Password: test123');
  } catch (error) {
    console.error('Errore creazione utenti di test:', error);
  }
}

// Esegui le funzioni
async function main() {
  try {
    await createSuperAdmin();
    await createTestUsers();
    console.log('Setup completato!');
  } catch (error) {
    console.error('Errore durante il setup:', error);
  }
}

main(); 