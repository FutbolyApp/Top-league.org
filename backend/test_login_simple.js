import PlaywrightScraper from './utils/playwrightScraper.js';

async function testLoginSimple() {
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🔍 Test login semplice...');
        
        // Credenziali di test
        const credentials = {
            username: 'massimolasorsa@gmail.com',
            password: 'Massimo2024!'
        };
        
        // URL di test per Serie A
        const leagueUrl = 'https://leghe.fantacalcio.it/fantaleague-11';
        
        console.log('🚀 Inizializzazione Playwright...');
        await scraper.init();
        
        // Imposta il tipo di lega
        scraper.setLeagueType('serie_a', leagueUrl);
        
        console.log('🔐 Login...');
        const loginSuccess = await scraper.login(credentials.username, credentials.password, leagueUrl);
        
        if (loginSuccess) {
            console.log('✅ Login riuscito!');
            
            // Prova a navigare alla classifica
            const classificaUrl = `${leagueUrl}/classifica?id=1751067489455`;
            console.log(`🌐 Navigazione alla classifica: ${classificaUrl}`);
            
            await scraper.page.goto(classificaUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });
            
            await scraper.acceptAllPrivacyPopups();
            await scraper.page.waitForTimeout(3000);
            
            // Verifica se siamo nella pagina giusta
            const currentUrl = scraper.page.url();
            const pageTitle = await scraper.page.title();
            
            console.log(`📍 URL corrente: ${currentUrl}`);
            console.log(`📄 Titolo pagina: ${pageTitle}`);
            
            // Conta le tabelle
            const tableCount = await scraper.page.evaluate(() => {
                return document.querySelectorAll('table').length;
            });
            
            console.log(`📊 Tabelle trovate: ${tableCount}`);
            
            // Screenshot
            await scraper.page.screenshot({ 
                path: 'test_login_success.png', 
                fullPage: true 
            });
            console.log('📸 Screenshot salvato come test_login_success.png');
            
        } else {
            console.log('❌ Login fallito');
            
            // Screenshot della pagina di login
            await scraper.page.screenshot({ 
                path: 'test_login_failed.png', 
                fullPage: true 
            });
            console.log('📸 Screenshot salvato come test_login_failed.png');
        }
        
    } catch (error) {
        console.error('❌ Errore test login:', error);
    } finally {
        await scraper.close();
    }
}

testLoginSimple(); 