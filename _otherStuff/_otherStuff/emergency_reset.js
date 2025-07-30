import { getDb, initializeDatabase } from './db/postgres.js';
import bcrypt from 'bcryptjs';

async function emergencyReset() {
  console.log('🚨 EMERGENCY DATABASE RESET');
  console.log('===========================');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ DATABASE: Not available');
      return;
    }
    
    console.log('✅ DATABASE: Connected');
    
    // 1. PULISCI TUTTO
    console.log('\n🧹 CLEANING DATABASE...');
    
    const tablesToClean = [
      'partite', 'tornei_squadre', 'tornei', 'giocatori', 'squadre', 
      'richieste_ingresso', 'notifiche', 'subadmin', 'pending_changes', 'leghe', 'users'
    ];
    
    for (const table of tablesToClean) {
      try {
        await db.query(`DELETE FROM ${table}`);
        console.log(`  ✅ Cleaned ${table}`);
      } catch (error) {
        console.log(`  ⚠️ Could not clean ${table}: ${error.message}`);
      }
    }
    
    // 2. RICREA SUPERADMIN
    console.log('\n👑 CREATING SUPERADMIN...');
    const password_hash = await bcrypt.hash('admin123', 10);
    
    const superAdminResult = await db.query(`
      INSERT INTO users (nome, cognome, username, email, password_hash, ruolo)
      VALUES ('Admin', 'Test', 'admin', 'admin@topleague.com', $1, 'SuperAdmin')
      RETURNING id
    `, [password_hash]);
    
    const superAdminId = superAdminResult.rows[0].id;
    console.log(`✅ SuperAdmin created with ID: ${superAdminId}`);
    
    // 3. CREA LEGA DI TEST
    console.log('\n🏆 CREATING TEST LEAGUE...');
    const legaResult = await db.query(`
      INSERT INTO leghe (nome, admin_id, is_pubblica, modalita, max_squadre)
      VALUES ('Test League', $1, true, 'Classic Serie A', 20)
      RETURNING id
    `, [superAdminId]);
    
    const legaId = legaResult.rows[0].id;
    console.log(`✅ Test League created with ID: ${legaId}`);
    
    // 4. CREA SQUADRE DI TEST
    console.log('\n⚽ CREATING TEST SQUADRE...');
    const squadreNomi = ['Milan', 'Inter', 'Juventus', 'Roma', 'Napoli'];
    
    for (let i = 0; i < squadreNomi.length; i++) {
      const squadraResult = await db.query(`
        INSERT INTO squadre (nome, lega_id, proprietario_id, is_orfana, casse_societarie, valore_squadra, club_level)
        VALUES ($1, $2, $3, false, 1000000, 50000000, 1)
        RETURNING id
      `, [squadreNomi[i], legaId, superAdminId]);
      
      const squadraId = squadraResult.rows[0].id;
      console.log(`✅ Squadra ${squadreNomi[i]} created with ID: ${squadraId}`);
      
      // 5. CREA GIOCATORI PER OGNI SQUADRA
      const giocatoriPerSquadra = [
        { nome: 'Portiere', ruolo: 'P', squadra_reale: 'Test FC', costo: 1000000 },
        { nome: 'Difensore', ruolo: 'D', squadra_reale: 'Test FC', costo: 2000000 },
        { nome: 'Centrocampista', ruolo: 'C', squadra_reale: 'Test FC', costo: 3000000 },
        { nome: 'Attaccante', ruolo: 'A', squadra_reale: 'Test FC', costo: 4000000 }
      ];
      
      for (const giocatore of giocatoriPerSquadra) {
        await db.query(`
          INSERT INTO giocatori (nome, ruolo, squadra_reale, costo_attuale, quotazione_attuale, squadra_id, lega_id)
          VALUES ($1, $2, $3, $4, $4, $5, $6)
        `, [giocatore.nome, giocatore.ruolo, giocatore.squadra_reale, giocatore.costo, squadraId, legaId]);
      }
      
      console.log(`✅ Added 4 giocatori to ${squadreNomi[i]}`);
    }
    
    // 6. CREA NOTIFICHE DI TEST
    console.log('\n📢 CREATING TEST NOTIFICHE...');
    await db.query(`
      INSERT INTO notifiche (utente_id, lega_id, titolo, messaggio, tipo)
      VALUES ($1, $2, 'Benvenuto!', 'Benvenuto nella lega di test!', 'info')
    `, [superAdminId, legaId]);
    
    console.log('✅ Test notifica created');
    
    // 7. VERIFICA FINALE
    console.log('\n🔍 FINAL VERIFICATION:');
    
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const legheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    const squadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    const giocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    const notificheCount = await db.query('SELECT COUNT(*) as count FROM notifiche');
    
    console.log(`  Users: ${usersCount.rows[0].count}`);
    console.log(`  Leghe: ${legheCount.rows[0].count}`);
    console.log(`  Squadre: ${squadreCount.rows[0].count}`);
    console.log(`  Giocatori: ${giocatoriCount.rows[0].count}`);
    console.log(`  Notifiche: ${notificheCount.rows[0].count}`);
    
    console.log('\n✅ EMERGENCY RESET COMPLETED');
    console.log('🎯 CREDENZIALI DI TEST:');
    console.log('  Email: admin@topleague.com');
    console.log('  Password: admin123');
    console.log('  Role: SuperAdmin');
    
  } catch (error) {
    console.error('❌ EMERGENCY RESET FAILED:', error);
  }
}

emergencyReset(); 