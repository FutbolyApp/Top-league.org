import { default as PlaywrightScraper } from './utils/playwrightScraper.js';

async function debugPageStructure() {
    console.log('🔍 DEBUG: Analisi struttura pagina Euroleghe...');
    
    const scraper = new PlaywrightScraper();
    
    try {
        // Test URL
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
        
        console.log('3. Analisi struttura pagina...');
        const pageStructure = await scraper.page.evaluate(() => {
            const analysis = {
                headings: [],
                links: [],
                sections: [],
                allElements: []
            };
            
            // Analizza tutti gli heading
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading, index) => {
                const text = heading.textContent?.trim();
                if (text && text.length > 2) {
                    analysis.headings.push({
                        tag: heading.tagName.toLowerCase(),
                        text: text,
                        className: heading.className,
                        id: heading.id
                    });
                }
            });
            
            // Analizza tutti i link
            document.querySelectorAll('a').forEach((link, index) => {
                const text = link.textContent?.trim();
                const href = link.getAttribute('href');
                if (text && text.length > 2) {
                    analysis.links.push({
                        text: text,
                        href: href,
                        className: link.className,
                        id: link.id
                    });
                }
            });
            
            // Cerca sezioni con classi specifiche
            document.querySelectorAll('[class*="section"], [class*="competition"], [class*="tournament"]').forEach((section, index) => {
                const text = section.textContent?.trim();
                if (text && text.length > 10) {
                    analysis.sections.push({
                        className: section.className,
                        text: text.substring(0, 100) + '...',
                        tag: section.tagName.toLowerCase()
                    });
                }
            });
            
            return analysis;
        });
        
        console.log('4. Risultati analisi:');
        console.log('   Headings trovati:', pageStructure.headings.length);
        pageStructure.headings.forEach((h, i) => {
            console.log(`     ${i + 1}. <${h.tag}> "${h.text}" [${h.className}]`);
        });
        
        console.log('\n   Links trovati:', pageStructure.links.length);
        pageStructure.links.slice(0, 20).forEach((link, i) => {
            console.log(`     ${i + 1}. "${link.text}" -> ${link.href} [${link.className}]`);
        });
        
        console.log('\n   Sezioni trovate:', pageStructure.sections.length);
        pageStructure.sections.forEach((section, i) => {
            console.log(`     ${i + 1}. <${section.tag}> [${section.className}] "${section.text}"`);
        });
        
        console.log('✅ Debug completato!');
        
    } catch (error) {
        console.error('❌ Errore durante il debug:', error);
    } finally {
        await scraper.close();
    }
}

debugPageStructure(); 