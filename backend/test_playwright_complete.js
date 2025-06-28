import PlaywrightScraper from './utils/playwrightScraper.js';

async function testCompletePlaywrightScraping() {
    console.log('🧪 Test completo sistema Playwright con screenshot e debugging');
    
    const scraper = new PlaywrightScraper();
    
    try {
        // Test con credenziali di esempio (non valide, ma per testare il flusso)
        const testCredentials = {
            username: 'test@example.com',
            password: 'testpassword'
        };
        
        const testUrls = {
            rose: 'https://leghe.fantacalcio.it/test-league/rose',
            classifica: 'https://leghe.fantacalcio.it/test-league/classifica',
            voti: 'https://leghe.fantacalcio.it/test-league/voti',
            formazioni: 'https://leghe.fantacalcio.it/test-league/formazioni',
            mercato: 'https://leghe.fantacalcio.it/test-league/mercato'
        };
        
        console.log('🚀 Avvio test completo scraping...');
        console.log('📝 Credenziali di test:', testCredentials.username);
        console.log('🌐 URL di test:', testUrls);
        
        const results = await scraper.scrapeLeague(
            'https://leghe.fantacalcio.it/test-league',
            testUrls,
            testCredentials
        );
        
        console.log('📊 Risultati scraping:');
        console.log(JSON.stringify(results, null, 2));
        
        if (results.summary) {
            console.log(`✅ Summary: ${results.summary.squadre_trovate} squadre, ${results.summary.giocatori_totali} giocatori`);
        }
        
        console.log('✅ Test completo completato!');
        
    } catch (error) {
        console.error('❌ Errore nel test completo:', error);
    } finally {
        await scraper.close();
    }
}

// Esegui il test
testCompletePlaywrightScraping(); 