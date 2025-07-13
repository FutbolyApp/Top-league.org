import bcrypt from 'bcryptjs';
import { getDb } from '../db/postgres.js';

// Funzione per svuotare la tabella users mantenendo solo il SuperAdmin
async function resetUsers() {
  try {
    console.log('🗑️ Svuotando tabella users...');
    
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    // Elimina tutti gli utenti tranne il SuperAdmin
    await db.query('DELETE FROM users WHERE ruolo != $1', ['SuperAdmin']);
    console.log('✅ Tabella users svuotata (SuperAdmin mantenuto)');
    
    // Ora ricrea il SuperAdmin correttamente
    await createSuperAdmin();
  } catch (error) {
    console.error('Errore reset utenti:', error);
  }
}

// Funzione per creare il SuperAdmin
async function createSuperAdmin() {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Prima elimina il SuperAdmin esistente se presente
    await db.query('DELETE FROM users WHERE ruolo = $1', ['SuperAdmin']);
    
    // Ora inserisce il SuperAdmin con tutti i campi nell'ordine corretto
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
    
    console.log('✅ SuperAdmin creato con successo!');
    console.log('📧 Email: admin@topleague.com');
    console.log('👤 Username: superadmin');
    console.log('🔑 Password: admin123');
    
    console.log('🎉 Reset completato!');
  } catch (error) {
    console.error('Errore creazione SuperAdmin:', error);
  }
}

// Esegui il reset
resetUsers(); 