import { getDb, initializeDatabase } from './db/postgres.js';

// Set DATABASE_URL for online environment
process.env.DATABASE_URL = "postgresql://topleague_db_user:topleague_db_password@localhost:5432/topleague_db?sslmode=disable";

async function testOnlineAdminRequests() {
  try {
    console.log('🔍 Testing online admin requests and notifications...');
    console.log('📊 DATABASE_URL:', process.env.DATABASE_URL);
    
    // Initialize database
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ Database connection failed');
      return;
    }
    
    // Check users
    const usersResult = await db.query('SELECT id, nome, cognome, email, ruolo FROM users ORDER BY id LIMIT 10');
    console.log('👥 Users found:', usersResult.rows.length);
    usersResult.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}, Nome: ${user.nome} ${user.cognome}, Email: ${user.email}, Ruolo: ${user.ruolo}`);
    });
    
    // Check leghe
    const legheResult = await db.query('SELECT id, nome, admin_id FROM leghe ORDER BY id LIMIT 10');
    console.log('🏆 Leagues found:', legheResult.rows.length);
    legheResult.rows.forEach((lega, index) => {
      console.log(`  ${index + 1}. ID: ${lega.id}, Nome: ${lega.nome}, Admin ID: ${lega.admin_id}`);
    });
    
    // Check squadre
    const squadreResult = await db.query(`
      SELECT s.id, s.nome, s.lega_id, s.proprietario_id, l.nome as lega_nome, u.nome as proprietario_nome
      FROM squadre s
      JOIN leghe l ON s.lega_id = l.id
      LEFT JOIN users u ON s.proprietario_id = u.id
      ORDER BY s.id
      LIMIT 10
    `);
    console.log('⚽ Squadre found:', squadreResult.rows.length);
    squadreResult.rows.forEach((squadra, index) => {
      console.log(`  ${index + 1}. ID: ${squadra.id}, Nome: ${squadra.nome}, Lega: ${squadra.lega_nome}, Proprietario: ${squadra.proprietario_nome || 'N/A'}`);
    });
    
    // Check richieste_admin table
    const richiesteResult = await db.query(`
      SELECT ra.*, s.nome as squadra_nome, l.nome as lega_nome, u.nome as utente_nome
      FROM richieste_admin ra
      JOIN squadre s ON ra.squadra_id = s.id
      JOIN leghe l ON s.lega_id = l.id
      LEFT JOIN users u ON s.proprietario_id = u.id
      WHERE ra.stato = 'pending'
      ORDER BY ra.data_creazione DESC
    `);
    
    console.log('📋 Admin requests found:', richiesteResult.rows.length);
    richiesteResult.rows.forEach((richiesta, index) => {
      console.log(`  ${index + 1}. ID: ${richiesta.id}, Tipo: ${richiesta.tipo_richiesta}, Squadra: ${richiesta.squadra_nome}, Lega: ${richiesta.lega_nome}, Utente: ${richiesta.utente_nome || 'N/A'}`);
    });
    
    // Check notifications for admin requests
    const notificheResult = await db.query(`
      SELECT n.*, u.nome as utente_nome
      FROM notifiche n
      JOIN users u ON n.utente_id = u.id
      WHERE n.tipo LIKE '%admin%'
      ORDER BY n.data_creazione DESC
    `);
    
    console.log('🔔 Admin notifications found:', notificheResult.rows.length);
    notificheResult.rows.forEach((notifica, index) => {
      console.log(`  ${index + 1}. ID: ${notifica.id}, Tipo: ${notifica.tipo}, Messaggio: ${notifica.messaggio}, Utente: ${notifica.utente_nome}, Data: ${notifica.data_creazione}`);
    });
    
    // Check all notifications
    const allNotificheResult = await db.query(`
      SELECT n.*, u.nome as utente_nome
      FROM notifiche n
      JOIN users u ON n.utente_id = u.id
      ORDER BY n.data_creazione DESC
      LIMIT 10
    `);
    
    console.log('🔔 All notifications (latest 10):', allNotificheResult.rows.length);
    allNotificheResult.rows.forEach((notifica, index) => {
      console.log(`  ${index + 1}. ID: ${notifica.id}, Tipo: ${notifica.tipo}, Messaggio: ${notifica.messaggio}, Utente: ${notifica.utente_nome}, Data: ${notifica.data_creazione}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing online admin requests:', error);
  }
}

testOnlineAdminRequests(); 