const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function closeCookiePopup(page) {
    const selectors = [
        'button:has-text("Continue without accepting")',
        'button:has-text("Continua senza accettare")',
        'button:has-text("Accept all")',
        'button:has-text("Accetta")',
        'button:has-text("OK")',
        'button:has-text("Chiudi")',
        '.cookie-accept',
        '.cookie-decline',
        '.gdpr-accept',
        '.gdpr-decline',
        '#pubtech-cmp button',
        '.pt-00A button'
    ];
    for (const selector of selectors) {
        try {
            const btn = await page.locator(selector).first();
            if (await btn.isVisible()) {
                console.log(`✅ Chiuso popup cookie con: ${selector}`);
                await btn.click();
                await page.waitForTimeout(1000);
                return true;
            }
        } catch (e) {}
    }
    return false;
}

async function testFormazioniFrontendUrl() {
    console.log('🚀 Test formazioni con URL del frontend...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // 1. Login con URL del frontend
        console.log('🔐 Login con URL frontend...');
        await page.goto('https://euroleghe.fantacalcio.it/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await closeCookiePopup(page);
        
        await page.fill('input[placeholder="Username"]', 'nemeneme');
        await page.fill('input[placeholder="Password"]', 'laziomerda');
        await page.click('button:has-text("LOGIN")');
        
        // 2. Aspetta login
        console.log('⏳ Attendo login...');
        await page.waitForTimeout(5000);
        
        // 3. Vai alla pagina principale per vedere dove siamo
        console.log('🏠 Navigazione alla pagina principale...');
        await page.goto('https://euroleghe.fantacalcio.it/topleague/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await closeCookiePopup(page);
        
        const mainPageUrl = page.url();
        console.log('📍 URL pagina principale:', mainPageUrl);
        
        // Screenshot della pagina principale
        await page.screenshot({ path: 'frontend_main_page.png', fullPage: true });
        console.log('✅ Screenshot pagina principale salvato');
        
        // 4. Prova diversi URL per le formazioni
        console.log('⚽ Test URL formazioni frontend...');
        
        const formazioniUrls = [
            'https://euroleghe.fantacalcio.it/topleague/formazioni/22?id=295',
            'https://euroleghe.fantacalcio.it/topleague/formazioni/22',
            'https://euroleghe.fantacalcio.it/topleague/formazioni?id=295',
            'https://euroleghe.fantacalcio.it/topleague/formazioni'
        ];
        
        for (let i = 0; i < formazioniUrls.length; i++) {
            const url = formazioniUrls[i];
            console.log(`🔄 Prova ${i + 1}/${formazioniUrls.length}: ${url}`);
            
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                await page.waitForTimeout(3000);
                await closeCookiePopup(page);
                
                const finalUrl = page.url();
                console.log(`URL finale: ${finalUrl}`);
                
                // Screenshot
                await page.screenshot({ path: `frontend_formazioni_test_${i + 1}.png`, fullPage: true });
                
                // Controlla se siamo nella pagina delle formazioni
                const tables = await page.locator('table').all();
                const formationElements = await page.locator('*:has-text("formazione")').all();
                const playerElements = await page.locator('*:has-text("giocatore"), *:has-text("player")').all();
                
                console.log(`📊 Trovate ${tables.length} tabelle`);
                console.log(`⚽ Trovati ${formationElements.length} elementi formazione`);
                console.log(`👤 Trovati ${playerElements.length} elementi giocatore`);
                
                // Se troviamo dati, estraiamo tutto
                if (tables.length > 0 || formationElements.length > 0 || playerElements.length > 0) {
                    console.log(`✅ SUCCESSO! Dati trovati con URL: ${url}`);
                    
                    // Estrai contenuto
                    const pageText = await page.textContent('body');
                    fs.writeFileSync(`frontend_formazioni_success_${i + 1}.txt`, pageText);
                    
                    const pageHtml = await page.content();
                    fs.writeFileSync(`frontend_formazioni_success_${i + 1}.html`, pageHtml);
                    
                    console.log('✅ Contenuto estratto e salvato!');
                    
                    // Analizza le tabelle trovate
                    for (let j = 0; j < tables.length; j++) {
                        try {
                            const tableText = await tables[j].textContent();
                            console.log(`📋 Tabella ${j + 1}:`, tableText?.substring(0, 300) + '...');
                        } catch (e) {
                            console.log(`Errore lettura tabella ${j + 1}:`, e.message);
                        }
                    }
                    
                    break;
                } else {
                    console.log(`❌ Nessun dato trovato con URL: ${url}`);
                }
                
            } catch (e) {
                console.log(`❌ Errore con URL ${i + 1}: ${e.message}`);
                await page.screenshot({ path: `frontend_formazioni_error_${i + 1}.png`, fullPage: true });
            }
        }
        
        console.log('✅ Test completato!');
        
    } catch (error) {
        console.error('❌ Errore:', error);
        await page.screenshot({ path: 'frontend_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testFormazioniFrontendUrl().catch(console.error); 