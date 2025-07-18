import { getDb } from './db/postgres.js';

async function checkUsers() {
  try {
    const db = getDb();
    if (!db) {
      console.log('Database non disponibile');
      return;
    }

    const result = await db.query('SELECT id, username, email, nome, cognome, ruolo FROM users ORDER BY id');
    
    console.log('UTENTI REGISTRATI:');
    console.log('==================');
    
    result.rows.forEach(user => {
      console.log(`ID: ${user.id} | Username: ${user.username} | Email: ${user.email} | Nome: ${user.nome} ${user.cognome} | Ruolo: ${user.ruolo}`);
    });
    
    console.log(`\nTotale utenti: ${result.rows.length}`);
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    process.exit();
  }
}

checkUsers(); 