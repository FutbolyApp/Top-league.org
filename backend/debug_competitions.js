import { default as PlaywrightScraper } from './utils/playwrightScraper.js';

async function debugCompetitionsPage() {
    console.log('🔍 DEBUG: Analisi pagina competizioni...');
    
    const scraper = new PlaywrightScraper();
    
    try {
        // Test URL
        const testUrl = 'https://euroleghe.fantacalcio.it/topleague/';
        
        console.log('1. Inizializzazione browser...');
        if (!await scraper.init()) {
            throw new Error('Impossibile inizializzare Playwright');
        }
        
        console.log('2. Rilevamento tipo lega...');
        scraper.detectLeagueType(testUrl);
        
        console.log('3. Debug struttura pagina competizioni...');
        const competizioniUrl = testUrl.replace(/\/$/, '') + '/lista-competizioni';
        const pageStructure = await scraper.debugPageStructure(competizioniUrl);
        
        console.log('4. Test recupero tornei migliorato...');
        const tournaments = await scraper.getAvailableTournaments();
        console.log(`   Tornei trovati: ${tournaments.length}`);
        
        if (tournaments.length > 0) {
            console.log('   Tornei trovati:');
            tournaments.forEach((t, i) => {
                console.log(`     ${i + 1}. ${t.name} (ID: ${t.id}) [${t.method}]`);
            });
        } else {
            console.log('   ❌ Nessun torneo trovato');
        }
        
        console.log('✅ Debug completato!');
        
    } catch (error) {
        console.error('❌ Errore durante il debug:', error);
    } finally {
        await scraper.close();
    }
}

// Esegui il debug
debugCompetitionsPage(); 