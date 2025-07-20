import { getDb, initializeDatabase } from './db/postgres.js';

async function assignSquadreToSuperAdmin() {
  console.log('🔧 ASSIGNING SQUADRE TO SUPERADMIN');
  console.log('===================================');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ Database not available');
      return;
    }
    
    console.log('✅ Database connected');
    
    // 1. Trova il SuperAdmin
    console.log('\n🔍 Finding SuperAdmin...');
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
    
    const superAdmin = superAdminResult.rows[0];
    console.log(`✅ SuperAdmin found: ${superAdmin.nome} ${superAdmin.cognome} (ID: ${superAdmin.id})`);
    
    // 2. Trova le leghe
    console.log('\n🔍 Finding leghe...');
    const legheResult = await db.query(`
      SELECT id, nome, admin_id 
      FROM leghe 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (legheResult.rows.length === 0) {
      console.error('❌ No leghe found');
      return;
    }
    
    console.log(`✅ Found ${legheResult.rows.length} leghe:`);
    legheResult.rows.forEach(lega => {
      console.log(`  - ${lega.nome} (ID: ${lega.id}) - Admin: ${lega.admin_id}`);
    });
    
    // 3. Trova squadre non assegnate
    console.log('\n🔍 Finding unassigned squadre...');
    const squadreResult = await db.query(`
      SELECT s.id, s.nome, s.lega_id, s.proprietario_id, l.nome as lega_nome
      FROM squadre s
      LEFT JOIN leghe l ON s.lega_id = l.id
      WHERE s.proprietario_id IS NULL OR s.is_orfana = true
      ORDER BY s.lega_id, s.nome
      LIMIT 10
    `);
    
    if (squadreResult.rows.length === 0) {
      console.error('❌ No unassigned squadre found');
      return;
    }
    
    console.log(`✅ Found ${squadreResult.rows.length} unassigned squadre:`);
    squadreResult.rows.forEach(squadra => {
      console.log(`  - ${squadra.nome} (ID: ${squadra.id}) - Lega: ${squadra.lega_nome} - Proprietario: ${squadra.proprietario_id}`);
    });
    
    // 4. Assegna le prime 3 squadre al SuperAdmin
    console.log('\n🔧 Assigning squadre to SuperAdmin...');
    const squadreToAssign = squadreResult.rows.slice(0, 3);
    
    for (const squadra of squadreToAssign) {
      try {
        await db.query(`
          UPDATE squadre 
          SET proprietario_id = $1, is_orfana = false 
          WHERE id = $2
        `, [superAdmin.id, squadra.id]);
        
        console.log(`✅ Assigned squadra ${squadra.nome} to SuperAdmin`);
      } catch (error) {
        console.error(`❌ Error assigning squadra ${squadra.nome}:`, error.message);
      }
    }
    
    // 5. Verifica le assegnazioni
    console.log('\n🔍 Verifying assignments...');
    const assignedSquadre = await db.query(`
      SELECT s.id, s.nome, s.lega_id, s.proprietario_id, l.nome as lega_nome
      FROM squadre s
      LEFT JOIN leghe l ON s.lega_id = l.id
      WHERE s.proprietario_id = $1
      ORDER BY s.nome
    `, [superAdmin.id]);
    
    console.log(`✅ SuperAdmin now has ${assignedSquadre.rows.length} squadre:`);
    assignedSquadre.rows.forEach(squadra => {
      console.log(`  - ${squadra.nome} (ID: ${squadra.id}) - Lega: ${squadra.lega_nome}`);
    });
    
    // 6. Conta giocatori per ogni squadra
    console.log('\n🔍 Counting giocatori per squadra...');
    for (const squadra of assignedSquadre.rows) {
      const giocatoriResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM giocatori 
        WHERE squadra_id = $1
      `, [squadra.id]);
      
      console.log(`  - ${squadra.nome}: ${giocatoriResult.rows[0].count} giocatori`);
    }
    
    console.log('\n✅ ASSIGNMENT COMPLETED');
    console.log(`SuperAdmin ${superAdmin.nome} now has ${assignedSquadre.rows.length} squadre assigned`);
    
  } catch (error) {
    console.error('❌ ASSIGNMENT FAILED:', error);
  }
}

assignSquadreToSuperAdmin(); 