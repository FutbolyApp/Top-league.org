import { getDb, initializeDatabase } from './db/postgres.js';
import bcrypt from 'bcryptjs';

async function simpleFix() {
  console.log('🔧 SIMPLE DATABASE FIX');
  console.log('======================');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ DATABASE: Not available');
      return;
    }
    
    console.log('✅ DATABASE: Connected');
    
    // 1. Trova il SuperAdmin
    console.log('\n👑 FINDING SUPERADMIN...');
    const superAdminResult = await db.query(`
      SELECT id, nome, cognome, email, ruolo 
      FROM users 
      WHERE ruolo = 'SuperAdmin' 
      LIMIT 1
    `);
    
    if (superAdminResult.rows.length === 0) {
      console.error('❌ No SuperAdmin found');
      return;
    }
    
    const superAdminId = superAdminResult.rows[0].id;
    console.log(`✅ SuperAdmin found: ${superAdminResult.rows[0].nome} (ID: ${superAdminId})`);
    
    // 2. Aggiorna password
    const password_hash = await bcrypt.hash('admin123', 10);
    await db.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE id = $2
    `, [password_hash, superAdminId]);
    console.log('✅ Password updated to admin123');
    
    // 3. Trova squadre non assegnate
    console.log('\n⚽ FINDING UNASSIGNED SQUADRE...');
    const unassignedSquadre = await db.query(`
      SELECT id, nome, lega_id 
      FROM squadre 
      WHERE proprietario_id IS NULL OR is_orfana = true
      LIMIT 10
    `);
    
    console.log(`Found ${unassignedSquadre.rows.length} unassigned squadre`);
    
    // 4. Assegna le prime 5 squadre al SuperAdmin
    console.log('\n🔧 ASSIGNING SQUADRE TO SUPERADMIN...');
    const squadreToAssign = unassignedSquadre.rows.slice(0, 5);
    
    for (const squadra of squadreToAssign) {
      await db.query(`
        UPDATE squadre 
        SET proprietario_id = $1, is_orfana = false 
        WHERE id = $2
      `, [superAdminId, squadra.id]);
      
      console.log(`✅ Assigned squadra ${squadra.nome} to SuperAdmin`);
    }
    
    // 5. Verifica finale
    console.log('\n🔍 FINAL VERIFICATION:');
    const superAdminSquadre = await db.query(`
      SELECT COUNT(*) as count 
      FROM squadre 
      WHERE proprietario_id = $1
    `, [superAdminId]);
    
    console.log(`SuperAdmin now has ${superAdminSquadre.rows[0].count} squadre`);
    
    console.log('\n✅ SIMPLE FIX COMPLETED');
    console.log('🎯 CREDENZIALI:');
    console.log('  Email: admin@topleague.com');
    console.log('  Password: admin123');
    console.log('  Squadre assegnate: ' + superAdminSquadre.rows[0].count);
    
  } catch (error) {
    console.error('❌ SIMPLE FIX FAILED:', error);
  }
}

simpleFix(); 