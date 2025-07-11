import bcrypt from 'bcryptjs';
import { getDb } from '../db/config.js';

const db = getDb();

// Funzione per svuotare la tabella users mantenendo solo il SuperAdmin
async function resetUsers() {
  try {
    console.log('🗑️ Svuotando tabella users...');
    
    // Elimina tutti gli utenti tranne il SuperAdmin
    db.run('DELETE FROM users WHERE ruolo != ?', ['SuperAdmin'], (err) => {
      if (err) {
        console.error('Errore eliminazione utenti:', err);
        return;
      }
      console.log('✅ Tabella users svuotata (SuperAdmin mantenuto)');
      
      // Ora ricrea il SuperAdmin correttamente
      createSuperAdmin();
    });
  } catch (error) {
    console.error('Errore reset utenti:', error);
  }
}

// Funzione per creare il SuperAdmin
async function createSuperAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Prima elimina il SuperAdmin esistente se presente
    db.run('DELETE FROM users WHERE ruolo = ?', ['SuperAdmin'], (err) => {
      if (err) {
        console.error('Errore eliminazione SuperAdmin esistente:', err);
        return;
      }
      
      // Ora inserisce il SuperAdmin con tutti i campi nell'ordine corretto
      const stmt = db.prepare(`
        INSERT INTO users (nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo)
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
      console.log('✅ SuperAdmin creato con successo!');
      console.log('📧 Email: admin@topleague.com');
      console.log('👤 Username: superadmin');
      console.log('🔑 Password: admin123');
      
      // Chiudi il database
      db.close();
      console.log('🎉 Reset completato!');
    });
  } catch (error) {
    console.error('Errore creazione SuperAdmin:', error);
  }
}

// Esegui il reset
resetUsers(); 