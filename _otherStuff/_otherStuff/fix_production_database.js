import { getDb, initializeDatabase } from './db/postgres.js';
import bcrypt from 'bcryptjs';

async function fixProductionDatabase() {
  console.log('🚨 FIXING PRODUCTION DATABASE');
  console.log('==============================');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ DATABASE: Not available');
      return;
    }
    
    console.log('✅ DATABASE: Connected');
    
    // 1. CONTROLLA LO STATO ATTUALE
    console.log('\n🔍 CURRENT STATE:');
    
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const legheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    const squadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    const giocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    
    console.log(`  Users: ${usersCount.rows[0].count}`);
    console.log(`  Leghe: ${legheCount.rows[0].count}`);
    console.log(`  Squadre: ${squadreCount.rows[0].count}`);
    console.log(`  Giocatori: ${giocatoriCount.rows[0].count}`);
    
    // 2. TROVA O CREA SUPERADMIN
    console.log('\n👑 FINDING/CREATING SUPERADMIN...');
    let superAdminResult = await db.query(`
      SELECT id, nome, cognome, email, ruolo 
      FROM users 
      WHERE ruolo = 'SuperAdmin' 
      LIMIT 1
    `);
    
    let superAdminId;
    if (superAdminResult.rows.length === 0) {
      console.log('Creating new SuperAdmin...');
      const password_hash = await bcrypt.hash('admin123', 10);
      
      superAdminResult = await db.query(`
        INSERT INTO users (nome, cognome, username, email, password_hash, ruolo)
        VALUES ('Admin', 'Test', 'admin', 'admin@topleague.com', $1, 'SuperAdmin')
        RETURNING id
      `, [password_hash]);
      
      superAdminId = superAdminResult.rows[0].id;
      console.log(`✅ SuperAdmin created with ID: ${superAdminId}`);
    } else {
      superAdminId = superAdminResult.rows[0].id;
      console.log(`✅ SuperAdmin found with ID: ${superAdminId}`);
      
      // Aggiorna password se necessario
      const password_hash = await bcrypt.hash('admin123', 10);
      await db.query(`
        UPDATE users 
        SET password_hash = $1 
        WHERE id = $2
      `, [password_hash, superAdminId]);
      console.log('✅ Password updated');
    }
    
    // 3. TROVA O CREA LEGA DI TEST
    console.log('\n🏆 FINDING/CREATING TEST LEAGUE...');
    let legaResult = await db.query(`
      SELECT id, nome, admin_id 
      FROM leghe 
      WHERE nome = 'Test League' 
      LIMIT 1
    `);
    
    let legaId;
    if (legaResult.rows.length === 0) {
      console.log('Creating new Test League...');
      legaResult = await db.query(`
        INSERT INTO leghe (nome, admin_id, is_pubblica, modalita, max_squadre)
        VALUES ('Test League', $1, true, 'Classic Serie A', 20)
        RETURNING id
      `, [superAdminId]);
      
      legaId = legaResult.rows[0].id;
      console.log(`✅ Test League created with ID: ${legaId}`);
    } else {
      legaId = legaResult.rows[0].id;
      console.log(`✅ Test League found with ID: ${legaId}`);
    }
    
    // 4. ASSEGNA SQUADRE AL SUPERADMIN
    console.log('\n⚽ ASSIGNING SQUADRE TO SUPERADMIN...');
    
    // Trova squadre non assegnate
    const unassignedSquadre = await db.query(`
      SELECT id, nome, lega_id 
      FROM squadre 
      WHERE (proprietario_id IS NULL OR is_orfana = true) 
      AND lega_id = $1
      LIMIT 5
    `, [legaId]);
    
    if (unassignedSquadre.rows.length === 0) {
      console.log('No unassigned squadre found, creating new ones...');
      
      const squadreNomi = ['Milan', 'Inter', 'Juventus', 'Roma', 'Napoli'];
      
      for (const nome of squadreNomi) {
        const squadraResult = await db.query(`
          INSERT INTO squadre (nome, lega_id, proprietario_id, is_orfana, casse_societarie, valore_squadra, club_level)
          VALUES ($1, $2, $3, false, 1000000, 50000000, 1)
          RETURNING id
        `, [nome, legaId, superAdminId]);
        
        const squadraId = squadraResult.rows[0].id;
        console.log(`✅ Created squadra ${nome} with ID: ${squadraId}`);
        
        // Aggiungi giocatori
        const giocatori = [
          { nome: 'Portiere', ruolo: 'P', squadra_reale: 'Test FC', costo: 1000000 },
          { nome: 'Difensore', ruolo: 'D', squadra_reale: 'Test FC', costo: 2000000 },
          { nome: 'Centrocampista', ruolo: 'C', squadra_reale: 'Test FC', costo: 3000000 },
          { nome: 'Attaccante', ruolo: 'A', squadra_reale: 'Test FC', costo: 4000000 }
        ];
        
        for (const giocatore of giocatori) {
          await db.query(`
            INSERT INTO giocatori (nome, ruolo, squadra_reale, costo_attuale, quotazione_attuale, squadra_id, lega_id)
            VALUES ($1, $2, $3, $4, $4, $5, $6)
          `, [giocatore.nome, giocatore.ruolo, giocatore.squadra_reale, giocatore.costo, squadraId, legaId]);
        }
        
        console.log(`✅ Added 4 giocatori to ${nome}`);
      }
    } else {
      console.log(`Found ${unassignedSquadre.rows.length} unassigned squadre, assigning to SuperAdmin...`);
      
      for (const squadra of unassignedSquadre.rows) {
        await db.query(`
          UPDATE squadre 
          SET proprietario_id = $1, is_orfana = false 
          WHERE id = $2
        `, [superAdminId, squadra.id]);
        
        console.log(`✅ Assigned squadra ${squadra.nome} to SuperAdmin`);
      }
    }
    
    // 5. VERIFICA FINALE
    console.log('\n🔍 FINAL VERIFICATION:');
    
    const finalUsersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const finalLegheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    const finalSquadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    const finalGiocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    
    const superAdminSquadre = await db.query(`
      SELECT COUNT(*) as count 
      FROM squadre 
      WHERE proprietario_id = $1
    `, [superAdminId]);
    
    console.log(`  Users: ${finalUsersCount.rows[0].count}`);
    console.log(`  Leghe: ${finalLegheCount.rows[0].count}`);
    console.log(`  Squadre: ${finalSquadreCount.rows[0].count}`);
    console.log(`  Giocatori: ${finalGiocatoriCount.rows[0].count}`);
    console.log(`  SuperAdmin Squadre: ${superAdminSquadre.rows[0].count}`);
    
    console.log('\n✅ PRODUCTION DATABASE FIXED');
    console.log('🎯 CREDENZIALI DI TEST:');
    console.log('  Email: admin@topleague.com');
    console.log('  Password: admin123');
    console.log('  Role: SuperAdmin');
    console.log('  Squadre assegnate: ' + superAdminSquadre.rows[0].count);
    
  } catch (error) {
    console.error('❌ PRODUCTION FIX FAILED:', error);
  }
}

fixProductionDatabase(); 