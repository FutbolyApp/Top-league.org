const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testClassifica() {
    console.log('🏆 Test scraping classifica...');
    
    // Dynamic import per il modulo ES
    const { PlaywrightScraper } = await import('./utils/playwrightScraper.js');
    
    const dbPath = path.join(__dirname, 'db', 'topleague.db');
    console.log('SQLite DB Path:', dbPath);
    
    const db = new sqlite3.Database(dbPath);
    
    try {
        // Ottieni credenziali dalla tabella leghe
        const credentials = await new Promise((resolve, reject) => {
            db.get('SELECT username, password, league_url, tipo_lega FROM leghe WHERE username = ?', ['nemeneme'], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!credentials) {
            console.error('❌ Credenziali non trovate');
            return;
        }
        
        console.log('📋 Uso credenziali dalla tabella leghe...');
        console.log('Credenziali trovate per:', credentials.username);
        
        // Inizializza Playwright
        console.log('🔧 Inizializzazione Playwright...');
        const scraper = new PlaywrightScraper();
        await scraper.init();
        
        try {
            // Login
            console.log('📋 Testando login...');
            const loginResult = await scraper.login(credentials.username, credentials.password, credentials.league_url);
            console.log('Login result:', loginResult);
            
            if (!loginResult) {
                console.error('❌ Login fallito');
                return;
            }
            
            console.log('✅ Login riuscito, testando scraping classifica...');
            
            // Imposta il tipo di lega
            scraper.setLeagueType(credentials.tipo_lega, credentials.league_url);
            
            // URL della classifica
            const classificaUrl = `${credentials.league_url}classifica`;
            console.log(`📍 URL classifica: ${classificaUrl}`);
            
            // Scraping classifica
            console.log('🏆 Avvio scraping classifica...');
            const classificaData = await scraper.scrapeClassifica(classificaUrl);
            
            console.log(`✅ Classifica estratta: ${classificaData.length} posizioni trovate`);
            
            // Mostra i primi 3 risultati con tutti i campi
            console.log('\n📊 PRIMI 3 RISULTATI:');
            classificaData.slice(0, 3).forEach((posizione, index) => {
                console.log(`${posizione.posizione}. ${posizione.squadra}`);
                console.log(`  Punti: ${posizione.punti}, Partite: ${posizione.partite}`);
                console.log(`  Vittorie: ${posizione.vittorie}, Pareggi: ${posizione.pareggi}, Sconfitte: ${posizione.sconfitte}`);
                console.log(`  Gol fatti: ${posizione.golFatti}, Gol subiti: ${posizione.golSubiti}, Differenza: ${posizione.differenzaReti}`);
                console.log('---');
            });
            
            // Salva nel database
            if (classificaData.length > 0) {
                console.log('💾 Salvataggio nel database...');
                const saveResult = await scraper.saveClassificaToDatabase(1, classificaData); // lega_id = 1
                console.log('✅ Risultato salvataggio:', saveResult);
                
                // Verifica nel database
                console.log('🔍 Verifica nel database...');
                const savedData = await new Promise((resolve, reject) => {
                    db.all(`
                        SELECT posizione, squadra, punti, partite, vittorie, pareggi, sconfitte, gol_fatti, gol_subiti, differenza_reti
                        FROM classifica_scraping 
                        WHERE lega_id = 1 
                        ORDER BY posizione
                        LIMIT 5
                    `, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });
                
                console.log('\n📊 DATI SALVATI NEL DATABASE:');
                savedData.forEach(row => {
                    console.log(`${row.posizione}. ${row.squadra}`);
                    console.log(`  Punti: ${row.punti}, Partite: ${row.partite}`);
                    console.log(`  V/P/S: ${row.vittorie}/${row.pareggi}/${row.sconfitte}`);
                    console.log(`  GF/GS/DR: ${row.gol_fatti}/${row.gol_subiti}/${row.differenza_reti}`);
                    console.log('---');
                });
            }
            
        } finally {
            await scraper.close();
        }
        
    } catch (error) {
        console.error('❌ Errore durante test classifica:', error);
    } finally {
        db.close();
    }
}

testClassifica().catch(console.error); 