const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function debugLoginPage() {
    console.log('🔍 Debug pagina di login...');
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 1000 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // 1. Vai alla pagina di login
        console.log('📄 Navigazione alla pagina di login...');
        await page.goto('https://leghe.fantacalcio.it/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'login_page_1.png', fullPage: true });
        
        // 2. Gestisci popup cookie
        console.log('🍪 Gestione popup cookie...');
        try {
            const cookieButton = await page.locator('button:has-text("Continue without accepting")').first();
            if (await cookieButton.isVisible()) {
                console.log('✅ Chiuso popup cookie');
                await cookieButton.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'login_page_2_after_cookie.png', fullPage: true });
            }
        } catch (e) {
            console.log('Nessun popup cookie trovato');
        }
        
        // 3. Analizza tutti gli input
        console.log('🔍 Analisi campi input...');
        const inputs = await page.locator('input').all();
        console.log(`Trovati ${inputs.length} campi input`);
        
        for (let i = 0; i < inputs.length; i++) {
            try {
                const input = inputs[i];
                const type = await input.getAttribute('type');
                const name = await input.getAttribute('name');
                const id = await input.getAttribute('id');
                const placeholder = await input.getAttribute('placeholder');
                const isVisible = await input.isVisible();
                
                console.log(`Input ${i}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}", visible=${isVisible}`);
            } catch (e) {
                console.log(`Errore analisi input ${i}:`, e.message);
            }
        }
        
        // 4. Analizza tutti i bottoni
        console.log('🔘 Analisi bottoni...');
        const buttons = await page.locator('button').all();
        console.log(`Trovati ${buttons.length} bottoni`);
        
        for (let i = 0; i < buttons.length; i++) {
            try {
                const button = buttons[i];
                const type = await button.getAttribute('type');
                const text = await button.textContent();
                const isVisible = await button.isVisible();
                
                console.log(`Button ${i}: type="${type}", text="${text?.trim()}", visible=${isVisible}`);
            } catch (e) {
                console.log(`Errore analisi button ${i}:`, e.message);
            }
        }
        
        // 5. Cerca form di login
        console.log('📋 Analisi form...');
        const forms = await page.locator('form').all();
        console.log(`Trovati ${forms.length} form`);
        
        for (let i = 0; i < forms.length; i++) {
            try {
                const form = forms[i];
                const action = await form.getAttribute('action');
                const method = await form.getAttribute('method');
                const isVisible = await form.isVisible();
                
                console.log(`Form ${i}: action="${action}", method="${method}", visible=${isVisible}`);
            } catch (e) {
                console.log(`Errore analisi form ${i}:`, e.message);
            }
        }
        
        // 6. Estrai HTML della pagina
        const pageHtml = await page.content();
        fs.writeFileSync('login_page.html', pageHtml);
        console.log('✅ HTML salvato in: login_page.html');
        
        // 7. Estrai testo della pagina
        const pageText = await page.textContent('body');
        fs.writeFileSync('login_page.txt', pageText);
        console.log('✅ Testo salvato in: login_page.txt');
        
        console.log('✅ Debug completato!');
        
    } catch (error) {
        console.error('❌ Errore:', error);
        await page.screenshot({ path: 'login_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

debugLoginPage().catch(console.error); 