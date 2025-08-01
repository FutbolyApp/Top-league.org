import { getDb } from './db/postgres.js';

async function insertRealQA() {
  console.log('📊 Inserimento dati con QA realistiche...');
  
  const db = getDb();
  if (!db) {
    console.error('❌ Database non disponibile');
    return;
  }

  try {
    // Prima crea una squadra di scraping
    const squadraResult = await db.query(
      'INSERT INTO squadre_scraping (lega_id, nome, data_scraping, fonte_scraping) VALUES ($1, $2, NOW(), \'manual\') RETURNING id',
      [76, 'TopLeague']
    );
    const squadraId = squadraResult.rows[0].id;
    
    console.log(`✅ Squadra creata con ID: ${squadraId}`);
    
    // Dati di esempio con QA realistiche basate sui dati visti dal sito
    const giocatori = [
      { nome: 'ederson', ruolo: 'Por', squadra: 'Manchester City', quotazione: 13, qi: 17, fvMp: 27 },
      { nome: 'onana', ruolo: 'Por', squadra: 'Manchester United', quotazione: 13, qi: 14, fvMp: 20 },
      { nome: 'ortega', ruolo: 'Por', squadra: 'Manchester City', quotazione: 2, qi: 1, fvMp: 3 },
      { nome: 'gila', ruolo: 'Dc', squadra: 'Lazio', quotazione: 9, qi: 3, fvMp: 8 },
      { nome: 'romero', ruolo: 'Dc', squadra: 'Tottenham', quotazione: 8, qi: 9, fvMp: 10 },
      { nome: 'araujo r.', ruolo: 'Dc', squadra: 'Barcellona', quotazione: 13, qi: 13, fvMp: 15 },
      { nome: 'kalulu', ruolo: 'Dc', squadra: 'Milan', quotazione: 9, qi: 9, fvMp: 12 },
      { nome: 'bowen', ruolo: 'E', squadra: 'West Ham', quotazione: 17, qi: 17, fvMp: 25 },
      { nome: 'raphinha', ruolo: 'E', squadra: 'Barcellona', quotazione: 21, qi: 21, fvMp: 28 },
      { nome: 'simeone g.', ruolo: 'A', squadra: 'Napoli', quotazione: 5, qi: 5, fvMp: 8 },
      { nome: 'courtois', ruolo: 'Por', squadra: 'Real Madrid', quotazione: 14, qi: 18, fvMp: 60 },
      { nome: 'gonzalez fr.', ruolo: 'Por', squadra: 'Real Madrid', quotazione: 1, qi: 1, fvMp: 1 },
      { nome: 'lunin', ruolo: 'Por', squadra: 'Real Madrid', quotazione: 3, qi: 1, fvMp: 3 },
      { nome: 'botman', ruolo: 'Dc', squadra: 'Newcastle', quotazione: 6, qi: 12, fvMp: 20 },
      { nome: 'kinsky', ruolo: 'Por', squadra: 'Tottenham', quotazione: 3, qi: 2, fvMp: 11 },
      { nome: 'sportiello', ruolo: 'Por', squadra: 'Milan', quotazione: 2, qi: 1, fvMp: 1 },
      { nome: 'acerbi', ruolo: 'Dc', squadra: 'Inter', quotazione: 8, qi: 9, fvMp: 10 },
      { nome: 'martinez i.', ruolo: 'Dc', squadra: 'Barcellona', quotazione: 8, qi: 9, fvMp: 17 },
      { nome: 'kobel', ruolo: 'Por', squadra: 'Borussia Dortmund', quotazione: 10, qi: 10, fvMp: 10 },
      { nome: 'meyer a.', ruolo: 'Por', squadra: 'Borussia Dortmund', quotazione: 1, qi: 1, fvMp: 1 },
      { nome: 'provedel', ruolo: 'Por', squadra: 'Lazio', quotazione: 8, qi: 14, fvMp: 10 },
      { nome: 'alexsandro', ruolo: 'Dc', squadra: 'Lilla', quotazione: 5, qi: 5, fvMp: 8 }
    ];
    
    let inserted = 0;
    
    for (const giocatore of giocatori) {
      await db.query(
        `INSERT INTO giocatori_scraping 
         (lega_id, squadra_scraping_id, nome, ruolo, squadra_reale, quotazione, qi, fv_mp, data_scraping, fonte_scraping)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'manual')`,
        [76, squadraId, giocatore.nome, giocatore.ruolo, giocatore.squadra, giocatore.quotazione, giocatore.qi, giocatore.fvMp]
      );
      inserted++;
    }
    
    console.log(`✅ Inseriti ${inserted} giocatori con QA realistiche`);
    
    // Sincronizza con la tabella principale
    console.log('🔄 Sincronizzazione con tabella principale...');
    
    for (const giocatore of giocatori) {
      const giocatoreResult = await db.query(
        'SELECT g.id, g.qa FROM giocatori g JOIN squadre s ON g.squadra_id = s.id WHERE s.lega_id = 76 AND g.nome = $1',
        [giocatore.nome]
      );
      
      if (giocatoreResult.rows.length > 0) {
        await db.query(
          'UPDATE giocatori SET qa = $1, qi = $2 WHERE id = $3',
          [giocatore.quotazione, giocatore.qi, giocatoreResult.rows[0].id]
        );
      }
    }
    
    console.log('✅ Sincronizzazione completata');
    
    // Verifica i risultati
    const statsResult = await db.query(
      'SELECT COUNT(*) as total, AVG(quotazione) as media_qa, MIN(quotazione) as min_qa, MAX(quotazione) as max_qa FROM giocatori_scraping WHERE lega_id = 76'
    );
    const stats = statsResult.rows[0];
    
    console.log('📊 Statistiche finali:');
    console.log(`- Totale giocatori: ${stats.total}`);
    console.log(`- Media QA: ${parseFloat(stats.media_qa).toFixed(2)}`);
    console.log(`- Min QA: ${stats.min_qa}`);
    console.log(`- Max QA: ${stats.max_qa}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

insertRealQA().then(() => {
  console.log('✅ Processo completato!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Errore:', error);
  process.exit(1);
}); 