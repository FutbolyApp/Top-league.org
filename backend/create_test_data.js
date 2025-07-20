import { getDb, initializeDatabase } from './db/postgres.js';
import { createSquadra } from './models/squadra.js';
import { createGiocatore } from './models/giocatore.js';

async function createTestData() {
  console.log('🧪 Creating test data...');
  
  try {
    await initializeDatabase();
    const db = getDb();
    
    if (!db) {
      console.error('❌ Database not available');
      return;
    }
    
    console.log('✅ Database connected');
    
    // 1. Crea un utente di test se non esiste
    const bcrypt = await import('bcryptjs');
    const password_hash = await bcrypt.default.hash('admin123', 10);
    
    const userResult = await db.query(`
      INSERT INTO users (nome, cognome, username, email, password_hash, ruolo)
      VALUES ('Admin', 'Test', 'admin', 'admin@topleague.com', $1, 'SuperAdmin')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [password_hash]);
    
    let userId = userResult.rows[0]?.id;
    console.log('👤 User ID:', userId);
    
    if (!userId) {
      // Se l'utente esiste già, prendi il suo ID
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', ['admin@topleague.com']);
      userId = existingUser.rows[0]?.id;
    }
    
    // 2. Crea una lega di test
    const legaResult = await db.query(`
      INSERT INTO leghe (nome, descrizione, admin_id, modalita, max_squadre, is_pubblica, password)
      VALUES ('TopLeague Test', 'Lega di test per verificare il funzionamento', $1, 'Classic Serie A', 20, true, null)
      ON CONFLICT (nome) DO NOTHING
      RETURNING id
    `, [userId]);
    
    let legaId = legaResult.rows[0]?.id;
    console.log('🏆 Lega ID:', legaId);
    
    if (!legaId) {
      // Se la lega esiste già, prendi il suo ID
      const existingLega = await db.query('SELECT id FROM leghe WHERE nome = $1', ['TopLeague Test']);
      legaId = existingLega.rows[0]?.id;
    }
    
    // 3. Crea squadre di test
    const squadre = [
      { nome: 'Juventus', casse_societarie: 1000000, valore_squadra: 5000000 },
      { nome: 'Inter', casse_societarie: 1200000, valore_squadra: 6000000 },
      { nome: 'Milan', casse_societarie: 800000, valore_squadra: 4000000 },
      { nome: 'Napoli', casse_societarie: 900000, valore_squadra: 4500000 },
      { nome: 'Roma', casse_societarie: 1100000, valore_squadra: 5500000 }
    ];
    
    console.log('⚽ Creating test teams...');
    for (const squadraData of squadre) {
      try {
        const squadraId = await createSquadra({
          lega_id: legaId,
          nome: squadraData.nome,
          casse_societarie: squadraData.casse_societarie,
          valore_squadra: squadraData.valore_squadra,
          is_orfana: true
        });
        
        console.log(`✅ Squadra ${squadraData.nome} creata con ID: ${squadraId}`);
        
        // 4. Crea giocatori per ogni squadra
        const giocatori = [
          { nome: 'Portiere', ruolo: 'P', squadra: squadraData.nome, costo: 1000000 },
          { nome: 'Difensore 1', ruolo: 'D', squadra: squadraData.nome, costo: 800000 },
          { nome: 'Difensore 2', ruolo: 'D', squadra: squadraData.nome, costo: 750000 },
          { nome: 'Centrocampista 1', ruolo: 'C', squadra: squadraData.nome, costo: 1200000 },
          { nome: 'Centrocampista 2', ruolo: 'C', squadra: squadraData.nome, costo: 1100000 },
          { nome: 'Attaccante 1', ruolo: 'A', squadra: squadraData.nome, costo: 1500000 },
          { nome: 'Attaccante 2', ruolo: 'A', squadra: squadraData.nome, costo: 1400000 }
        ];
        
        for (const giocatoreData of giocatori) {
          try {
            const giocatoreId = await createGiocatore({
              lega_id: legaId,
              squadra_id: squadraId,
              nome: giocatoreData.nome,
              ruolo: giocatoreData.ruolo,
              squadra_reale: giocatoreData.squadra,
              costo_attuale: giocatoreData.costo
            });
            
            console.log(`✅ Giocatore ${giocatoreData.nome} creato con ID: ${giocatoreId}`);
          } catch (error) {
            console.error(`❌ Errore creazione giocatore ${giocatoreData.nome}:`, error.message);
          }
        }
        
      } catch (error) {
        console.error(`❌ Errore creazione squadra ${squadraData.nome}:`, error.message);
      }
    }
    
    console.log('✅ Test data creation completed!');
    
    // 5. Verifica i dati creati
    const legheCount = await db.query('SELECT COUNT(*) as count FROM leghe');
    const squadreCount = await db.query('SELECT COUNT(*) as count FROM squadre');
    const giocatoriCount = await db.query('SELECT COUNT(*) as count FROM giocatori');
    
    console.log('📊 Final counts:');
    console.log(`  Leghe: ${legheCount.rows[0].count}`);
    console.log(`  Squadre: ${squadreCount.rows[0].count}`);
    console.log(`  Giocatori: ${giocatoriCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
  }
}

createTestData(); 