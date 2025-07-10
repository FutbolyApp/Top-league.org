const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function analyzePageStructure() {
    console.log('🔍 Analisi struttura pagina...');
    
    const browser = await chromium.launch({ 
        headless: true,
        slowMo: 500 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    try {
        // Vai alla pagina principale
        console.log('📄 Navigazione alla pagina principale...');
        await page.goto('https://leghe.fantacalcio.it/fantaleague-11', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        // Analizza tutti i link
        console.log('🔗 Analisi di tutti i link...');
        const allLinks = await page.locator('a').all();
        console.log(`Trovati ${allLinks.length} link totali`);
        
        const linkInfo = [];
        for (let i = 0; i < Math.min(allLinks.length, 20); i++) {
            try {
                const link = allLinks[i];
                const href = await link.getAttribute('href');
                const text = await link.textContent();
                const isVisible = await link.isVisible();
                const className = await link.getAttribute('class');
                
                linkInfo.push({
                    index: i,
                    href: href,
                    text: text?.trim(),
                    visible: isVisible,
                    class: className
                });
                
                console.log(`Link ${i}: href="${href}", text="${text?.trim()}", visible=${isVisible}, class="${className}"`);
            } catch (e) {
                console.log(`Errore analisi link ${i}:`, e.message);
            }
        }
        
        // Cerca specificamente link di login
        console.log('\n🔐 Ricerca specifica link di login...');
        const loginKeywords = ['login', 'accedi', 'signin', 'entra'];
        const loginLinks = [];
        
        for (const link of linkInfo) {
            if (link.href && loginKeywords.some(keyword => 
                link.href.toLowerCase().includes(keyword) || 
                (link.text && link.text.toLowerCase().includes(keyword))
            )) {
                loginLinks.push(link);
                console.log(`✅ Link di login trovato:`, link);
            }
        }
        
        // Analizza tutti i bottoni
        console.log('\n🔘 Analisi di tutti i bottoni...');
        const allButtons = await page.locator('button').all();
        console.log(`Trovati ${allButtons.length} bottoni totali`);
        
        for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
            try {
                const button = allButtons[i];
                const text = await button.textContent();
                const isVisible = await button.isVisible();
                const className = await button.getAttribute('class');
                
                console.log(`Button ${i}: text="${text?.trim()}", visible=${isVisible}, class="${className}"`);
            } catch (e) {
                console.log(`Errore analisi button ${i}:`, e.message);
            }
        }
        
        // Analizza elementi con testo "accedi" o "login"
        console.log('\n🔍 Ricerca elementi con testo login/accedi...');
        const loginElements = await page.locator('*:has-text("accedi"), *:has-text("login")').all();
        console.log(`Trovati ${loginElements.length} elementi con testo login/accedi`);
        
        for (let i = 0; i < Math.min(loginElements.length, 5); i++) {
            try {
                const element = loginElements[i];
                const tagName = await element.evaluate(el => el.tagName);
                const text = await element.textContent();
                const isVisible = await element.isVisible();
                const className = await element.getAttribute('class');
                
                console.log(`Elemento login ${i}: tag="${tagName}", text="${text?.trim()}", visible=${isVisible}, class="${className}"`);
            } catch (e) {
                console.log(`Errore analisi elemento login ${i}:`, e.message);
            }
        }
        
        // Salva l'analisi in un file
        const analysis = {
            totalLinks: allLinks.length,
            linkInfo: linkInfo,
            loginLinks: loginLinks,
            totalButtons: allButtons.length,
            loginElements: loginElements.length
        };
        
        fs.writeFileSync('page_analysis.json', JSON.stringify(analysis, null, 2));
        console.log('\n✅ Analisi salvata in page_analysis.json');
        
        // Estrai HTML per analisi manuale
        const pageHtml = await page.content();
        fs.writeFileSync('page_structure.html', pageHtml);
        console.log('✅ HTML salvato in page_structure.html');
        
    } catch (error) {
        console.error('❌ Errore durante l\'analisi:', error);
    } finally {
        await browser.close();
    }
}

analyzePageStructure().catch(console.error);
