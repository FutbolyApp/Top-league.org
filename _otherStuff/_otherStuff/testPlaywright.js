const PlaywrightScraper = require('./utils/playwrightScraper');

async function testPlaywright() {
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🧪 Test Playwright Scraper');
        
        // Inizializza il browser
        const initialized = await scraper.init();
        if (!initialized) {
            console.log('❌ Impossibile inizializzare Playwright');
            return;
        }
        
        // Test navigazione semplice
        console.log('\n📱 Test navigazione...');
        const navigationSuccess = await scraper.navigateToPage('https://www.fantacalcio.it', false);
        
        if (navigationSuccess) {
            console.log('✅ Navigazione riuscita');
            
            // Test scraping dati
            console.log('\n📊 Test scraping...');
            const data = await scraper.scrapeData();
            console.log('Dati estratti:', data);
        } else {
            console.log('❌ Navigazione fallita');
        }
        
        // Test login (sostituisci con le tue credenziali)
        console.log('\n🔐 Test login...');
        const username = 'TUA_EMAIL'; // Sostituisci con la tua email
        const password = 'TUA_PASSWORD'; // Sostituisci con la tua password
        
        if (username !== 'TUA_EMAIL' && password !== 'TUA_PASSWORD') {
            const loginSuccess = await scraper.login(username, password);
            if (loginSuccess) {
                console.log('✅ Login riuscito');
                
                // Test navigazione con login
                console.log('\n🌐 Test navigazione con login...');
                const privatePageSuccess = await scraper.navigateToPage(
                    'https://leghe.fantacalcio.it/topleague', 
                    true, 
                    username, 
                    password
                );
                
                if (privatePageSuccess) {
                    console.log('✅ Navigazione a pagina privata riuscita');
                    const privateData = await scraper.scrapeData();
                    console.log('Dati pagina privata:', privateData);
                } else {
                    console.log('❌ Navigazione a pagina privata fallita');
                }
            } else {
                console.log('❌ Login fallito');
            }
        } else {
            console.log('⚠️ Credenziali non configurate, salto test login');
        }
        
    } catch (error) {
        console.error('❌ Errore durante il test:', error);
    } finally {
        // Chiudi il browser
        await scraper.close();
    }
}

// Esegui il test se il file viene chiamato direttamente
if (require.main === module) {
    testPlaywright();
}

module.exports = testPlaywright; 