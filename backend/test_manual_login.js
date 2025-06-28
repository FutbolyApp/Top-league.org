import FantacalcioScraper from './utils/scraperPuppeteer.js';

async function testManualLogin() {
    console.log('🧪 Test sistema scraping con login manuale');
    
    const scraper = new FantacalcioScraper();
    
    try {
        // Test configurazione con URL reale
        const leagueUrl = 'https://leghe.fantacalcio.it/fantaleague-11';
        const scrapingUrls = {
            rose: 'https://leghe.fantacalcio.it/fantaleague-11/rose',
            classifica: 'https://leghe.fantacalcio.it/fantaleague-11/classifica',
            voti: 'https://leghe.fantacalcio.it/fantaleague-11/voti-giornata',
            formazioni: 'https://leghe.fantacalcio.it/fantaleague-11/formazioni',
            mercato: 'https://leghe.fantacalcio.it/fantaleague-11/mercato'
        };
        
        console.log('🚀 Avvio test scraping con login manuale...');
        console.log('📝 ISTRUZIONI:');
        console.log('1. Si aprirà un browser con la pagina della lega');
        console.log('2. Fai login manualmente quando richiesto');
        console.log('3. Il sistema continuerà automaticamente con lo scraping');
        console.log(`4. URL della lega: ${leagueUrl}`);
        
        const results = await scraper.scrapeLeagueWithManualLogin(
            leagueUrl,
            scrapingUrls,
            { username: '', password: '' }, // Credenziali non necessarie per login manuale
            null, // tournamentId
            null  // legaId
        );
        
        console.log('✅ Test completato!');
        console.log('📊 Risultati:', JSON.stringify(results, null, 2));
        
    } catch (error) {
        console.error('❌ Errore durante il test:', error);
    } finally {
        console.log('🔒 Browser rimane aperto per ispezione manuale');
        console.log('💡 Chiudi manualmente il browser quando hai finito');
    }
}

// Esegui il test
testManualLogin(); 