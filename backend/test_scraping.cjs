const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testScraping() {
    // Dynamic import per ES module
    const { default: PlaywrightScraper } = await import('./utils/playwrightScraper.js');
    const scraper = new PlaywrightScraper();
    
    const dbPath = path.join(__dirname, 'db', 'topleague.db');
    console.log('SQLite DB Path:', dbPath);
    
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('🚀 Avvio test scraping tornei...');
        
        // Ottieni credenziali dalla tabella leghe
        const credentials = await new Promise((resolve, reject) => {
            db.get('SELECT fantacalcio_username, fantacalcio_password, fantacalcio_url, tipo_lega FROM leghe WHERE fantacalcio_username = ?', ['nemeneme'], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!credentials) {
            console.error('❌ Credenziali non trovate');
            return;
        }
        
        console.log('📋 Uso credenziali dalla tabella leghe...');
        console.log('Credenziali trovate per:', credentials.fantacalcio_username);
        
        // Inizializza Playwright
        console.log('🔧 Inizializzazione Playwright...');
        await scraper.init();
        
        try {
            // Login
            console.log('📋 Testando login...');
            const loginResult = await scraper.login(credentials.fantacalcio_username, credentials.fantacalcio_password, credentials.fantacalcio_url);
            console.log('Login result:', loginResult);
            
            if (!loginResult) {
                console.error('❌ Login fallito');
                return;
            }
            
            console.log('✅ Login riuscito, testando scraping tornei...');
            
            // Imposta il tipo di lega
            scraper.setLeagueType(credentials.tipo_lega, credentials.fantacalcio_url);
            
            const tournaments = await scraper.getAvailableTournaments();
            console.log('🏆 Tornei trovati:', tournaments);
            
            console.log('\n📊 DETTAGLI TORNEI:');
            if (tournaments && tournaments.length > 0) {
                tournaments.forEach((tournament, index) => {
                    console.log(`${index + 1}. ${tournament.name} (ID: ${tournament.id})`);
                    console.log(`   Source: ${tournament.source}`);
                    console.log(`   URL: ${tournament.url}`);
                    console.log(`   Class: ${tournament.className}`);
                    console.log('---');
                });
            } else {
                console.log('❌ Nessun torneo trovato');
            }
        } catch (error) {
            console.error('❌ Errore durante il test:', error);
        } finally {
            await scraper.close();
        }
    } catch (error) {
        console.error('❌ Errore durante il test:', error);
    } finally {
        db.close();
    }
}

testScraping(); 