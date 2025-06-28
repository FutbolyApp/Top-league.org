import PlaywrightScraper from './utils/playwrightScraper.js';

async function testLeagueScraping() {
    console.log('🧪 Test scraping lega reale: Fantaleague 11');
    
    const scraper = new PlaywrightScraper();
    
    try {
        // URL della lega reale
        const leagueUrl = 'https://leghe.fantacalcio.it/fantaleague-11';
        
        // Credenziali di test (sostituisci con quelle reali)
        const testCredentials = {
            username: 'test@example.com',
            password: 'testpassword'
        };
        
        // URL di scraping basati sulla lega
        const scrapingUrls = {
            rose: `${leagueUrl}/rose`,
            classifica: `${leagueUrl}/classifica`,
            voti: `${leagueUrl}/voti`,
            formazioni: `${leagueUrl}/formazioni`,
            mercato: `${leagueUrl}/mercato`
        };
        
        console.log('🚀 Avvio test scraping lega reale...');
        console.log('📝 Credenziali di test:', testCredentials.username);
        console.log('🏆 Lega:', leagueUrl);
        console.log('🌐 URL di scraping:', scrapingUrls);
        
        const results = await scraper.scrapeLeague(
            leagueUrl,
            scrapingUrls,
            testCredentials
        );
        
        console.log('📊 Risultati scraping:');
        console.log(JSON.stringify(results, null, 2));
        
        if (results.summary) {
            console.log(`✅ Summary: ${results.summary.squadre_trovate} squadre, ${results.summary.giocatori_totali} giocatori`);
        }
        
        console.log('✅ Test lega reale completato!');
        
    } catch (error) {
        console.error('❌ Errore nel test lega reale:', error);
    } finally {
        await scraper.close();
    }
}

// Esegui il test
testLeagueScraping(); 