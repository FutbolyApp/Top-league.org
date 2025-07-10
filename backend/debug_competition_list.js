import { default as PlaywrightScraper } from './utils/playwrightScraper.js';

async function debugCompetitionList() {
    console.log('🔍 DEBUG: Analisi specifica competition-list...');
    
    const scraper = new PlaywrightScraper();
    
    try {
        const testUrl = 'https://euroleghe.fantacalcio.it/topleague/';
        
        console.log('1. Inizializzazione browser...');
        if (!await scraper.init()) {
            throw new Error('Impossibile inizializzare Playwright');
        }
        
        console.log('2. Login...');
        const loginSuccess = await scraper.login('nemeneme', 'laziomerda', testUrl);
        if (!loginSuccess) {
            throw new Error('Login fallito');
        }
        
        console.log('3. Analisi competition-list...');
        const analysis = await scraper.page.evaluate(() => {
            const result = {
                items: []
            };
            const competitionList = document.querySelector('.competition-list');
            if (competitionList) {
                const items = competitionList.querySelectorAll('li.dropdown-item > a');
                items.forEach((link, index) => {
                    result.items.push({
                        index,
                        text: link.textContent?.trim(),
                        href: link.getAttribute('href'),
                        className: link.className,
                        dataId: link.getAttribute('data-id'),
                        dataIsin: link.getAttribute('data-isin')
                    });
                });
            }
            return result;
        });
        
        console.log('4. Link trovati in competition-list:');
        analysis.items.forEach(item => {
            console.log(`  ${item.index + 1}. text="${item.text}" href="${item.href}" class="${item.className}" data-id="${item.dataId}" data-isin="${item.dataIsin}"`);
        });
        
        console.log('✅ Debug completato!');
        
    } catch (error) {
        console.error('❌ Errore durante il debug:', error);
    } finally {
        await scraper.close();
    }
}

debugCompetitionList(); 