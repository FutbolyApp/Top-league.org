import express from 'express';
import { getDb, initializeDatabase } from '../db/postgres.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Endpoint per eseguire il fix del database
router.post('/fix-database', async (req, res) => {
  console.log('🚨 DEBUG: Fixing database via endpoint');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // 1. Controlla stato attuale
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const legheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    const squadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    const giocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    
    console.log(`Current state: ${usersCount.rows[0].count} users, ${legheCount.rows[0].count} leghe, ${squadreCount.rows[0].count} squadre, ${giocatoriCount.rows[0].count} giocatori`);
    
    // 2. Trova o crea SuperAdmin
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
      console.log(`SuperAdmin created with ID: ${superAdminId}`);
    } else {
      superAdminId = superAdminResult.rows[0].id;
      console.log(`SuperAdmin found with ID: ${superAdminId}`);
      
      // Aggiorna password
      const password_hash = await bcrypt.hash('admin123', 10);
      await db.query(`
        UPDATE users 
        SET password_hash = $1 
        WHERE id = $2
      `, [password_hash, superAdminId]);
      console.log('Password updated');
    }
    
    // 3. Trova o crea lega di test
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
      console.log(`Test League created with ID: ${legaId}`);
    } else {
      legaId = legaResult.rows[0].id;
      console.log(`Test League found with ID: ${legaId}`);
    }
    
    // 4. Assegna squadre al SuperAdmin
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
        console.log(`Created squadra ${nome} with ID: ${squadraId}`);
        
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
        
        console.log(`Added 4 giocatori to ${nome}`);
      }
    } else {
      console.log(`Found ${unassignedSquadre.rows.length} unassigned squadre, assigning to SuperAdmin...`);
      
      for (const squadra of unassignedSquadre.rows) {
        await db.query(`
          UPDATE squadre 
          SET proprietario_id = $1, is_orfana = false 
          WHERE id = $2
        `, [superAdminId, squadra.id]);
        
        console.log(`Assigned squadra ${squadra.nome} to SuperAdmin`);
      }
    }
    
    // 5. Verifica finale
    const finalUsersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const finalLegheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    const finalSquadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    const finalGiocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    
    const superAdminSquadre = await db.query(`
      SELECT COUNT(*) as count 
      FROM squadre 
      WHERE proprietario_id = $1
    `, [superAdminId]);
    
    console.log('Database fix completed successfully');
    
    res.json({ 
      success: true,
      message: 'Database fixed successfully',
      stats: {
        users: finalUsersCount.rows[0].count,
        leghe: finalLegheCount.rows[0].count,
        squadre: finalSquadreCount.rows[0].count,
        giocatori: finalGiocatoriCount.rows[0].count,
        superAdminSquadre: superAdminSquadre.rows[0].count
      },
      credentials: {
        email: 'admin@topleague.com',
        password: 'admin123',
        role: 'SuperAdmin'
      }
    });
    
  } catch (error) {
    console.error('Database fix failed:', error);
    res.status(500).json({ 
      error: 'Database fix failed', 
      details: error.message 
    });
  }
});

// Endpoint per controllare lo stato del database
router.get('/database-status', async (req, res) => {
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const legheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    const squadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    const giocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    
    const superAdminResult = await db.query(`
      SELECT id, nome, cognome, email, ruolo 
      FROM users 
      WHERE ruolo = 'SuperAdmin' 
      LIMIT 1
    `);
    
    const superAdminSquadre = superAdminResult.rows.length > 0 ? await db.query(`
      SELECT COUNT(*) as count 
      FROM squadre 
      WHERE proprietario_id = $1
    `, [superAdminResult.rows[0].id]) : { rows: [{ count: 0 }] };
    
    res.json({
      database: 'connected',
      stats: {
        users: usersCount.rows[0].count,
        leghe: legheCount.rows[0].count,
        squadre: squadreCount.rows[0].count,
        giocatori: giocatoriCount.rows[0].count,
        superAdmin: superAdminResult.rows.length > 0 ? {
          id: superAdminResult.rows[0].id,
          nome: superAdminResult.rows[0].nome,
          email: superAdminResult.rows[0].email,
          squadre: superAdminSquadre.rows[0].count
        } : null
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Database status check failed', 
      details: error.message 
    });
  }
});

// Endpoint semplice per assegnare squadre al SuperAdmin
router.post('/assign-squadre', async (req, res) => {
  console.log('🔧 DEBUG: Assigning squadre to SuperAdmin');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // 1. Trova il SuperAdmin
    const superAdminResult = await db.query(`
      SELECT id, nome, cognome, email, ruolo 
      FROM users 
      WHERE ruolo = 'SuperAdmin' 
      LIMIT 1
    `);
    
    if (superAdminResult.rows.length === 0) {
      return res.status(404).json({ error: 'No SuperAdmin found' });
    }
    
    const superAdminId = superAdminResult.rows[0].id;
    console.log(`SuperAdmin found: ${superAdminResult.rows[0].nome} (ID: ${superAdminId})`);
    
    // 2. Aggiorna password
    const password_hash = await bcrypt.hash('admin123', 10);
    await db.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE id = $2
    `, [password_hash, superAdminId]);
    console.log('Password updated to admin123');
    
    // 3. Trova squadre non assegnate
    const unassignedSquadre = await db.query(`
      SELECT id, nome, lega_id 
      FROM squadre 
      WHERE proprietario_id IS NULL OR is_orfana = true
      LIMIT 10
    `);
    
    console.log(`Found ${unassignedSquadre.rows.length} unassigned squadre`);
    
    // 4. Assegna le prime 5 squadre al SuperAdmin
    const squadreToAssign = unassignedSquadre.rows.slice(0, 5);
    let assignedCount = 0;
    
    for (const squadra of squadreToAssign) {
      await db.query(`
        UPDATE squadre 
        SET proprietario_id = $1, is_orfana = false 
        WHERE id = $2
      `, [superAdminId, squadra.id]);
      
      console.log(`Assigned squadra ${squadra.nome} to SuperAdmin`);
      assignedCount++;
    }
    
    // 5. Verifica finale
    const superAdminSquadre = await db.query(`
      SELECT COUNT(*) as count 
      FROM squadre 
      WHERE proprietario_id = $1
    `, [superAdminId]);
    
    console.log('Squadre assignment completed');
    
    res.json({ 
      success: true,
      message: 'Squadre assigned successfully',
      assigned: assignedCount,
      totalSquadre: superAdminSquadre.rows[0].count,
      credentials: {
        email: 'admin@topleague.com',
        password: 'admin123',
        role: 'SuperAdmin'
      }
    });
    
  } catch (error) {
    console.error('Squadre assignment failed:', error);
    res.status(500).json({ 
      error: 'Squadre assignment failed', 
      details: error.message 
    });
  }
});

// Endpoint per eseguire query SQL dirette
router.post('/execute-sql', async (req, res) => {
  console.log('🔧 DEBUG: Executing direct SQL');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // 1. Aggiorna password SuperAdmin
    await db.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE ruolo = 'SuperAdmin'
    `, [await bcrypt.hash('admin123', 10)]);
    
    // 2. Assegna le prime 5 squadre non assegnate al SuperAdmin
    const result = await db.query(`
      UPDATE squadre 
      SET proprietario_id = (SELECT id FROM users WHERE ruolo = 'SuperAdmin' LIMIT 1), 
          is_orfana = false 
      WHERE id IN (
        SELECT id FROM squadre 
        WHERE proprietario_id IS NULL OR is_orfana = true 
        LIMIT 5
      )
    `);
    
    // 3. Conta quante squadre ha ora il SuperAdmin
    const superAdminSquadre = await db.query(`
      SELECT COUNT(*) as count 
      FROM squadre 
      WHERE proprietario_id = (SELECT id FROM users WHERE ruolo = 'SuperAdmin' LIMIT 1)
    `);
    
    console.log('Direct SQL execution completed');
    
    res.json({ 
      success: true,
      message: 'SQL executed successfully',
      squadreAssigned: result.rowCount,
      totalSquadre: superAdminSquadre.rows[0].count,
      credentials: {
        email: 'admin@topleague.com',
        password: 'admin123',
        role: 'SuperAdmin'
      }
    });
    
  } catch (error) {
    console.error('Direct SQL execution failed:', error);
    res.status(500).json({ 
      error: 'Direct SQL execution failed', 
      details: error.message 
    });
  }
});

// Endpoint GET per assegnare squadre al SuperAdmin (più semplice da testare)
router.get('/assign-squadre-get', async (req, res) => {
  console.log('🔧 DEBUG: Assigning squadre via GET');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // 1. Aggiorna password SuperAdmin
    await db.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE ruolo = 'SuperAdmin'
    `, [await bcrypt.hash('admin123', 10)]);
    
    // 2. Assegna le prime 5 squadre non assegnate al SuperAdmin
    const result = await db.query(`
      UPDATE squadre 
      SET proprietario_id = (SELECT id FROM users WHERE ruolo = 'SuperAdmin' LIMIT 1), 
          is_orfana = false 
      WHERE id IN (
        SELECT id FROM squadre 
        WHERE proprietario_id IS NULL OR is_orfana = true 
        LIMIT 5
      )
    `);
    
    // 3. Conta quante squadre ha ora il SuperAdmin
    const superAdminSquadre = await db.query(`
      SELECT COUNT(*) as count 
      FROM squadre 
      WHERE proprietario_id = (SELECT id FROM users WHERE ruolo = 'SuperAdmin' LIMIT 1)
    `);
    
    console.log('Squadre assignment via GET completed');
    
    res.json({ 
      success: true,
      message: 'Squadre assigned successfully via GET',
      squadreAssigned: result.rowCount,
      totalSquadre: superAdminSquadre.rows[0].count,
      credentials: {
        email: 'admin@topleague.com',
        password: 'admin123',
        role: 'SuperAdmin'
      }
    });
    
  } catch (error) {
    console.error('Squadre assignment via GET failed:', error);
    res.status(500).json({ 
      error: 'Squadre assignment failed', 
      details: error.message 
    });
  }
});

export default router; 