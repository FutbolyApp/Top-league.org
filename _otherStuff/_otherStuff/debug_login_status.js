import PlaywrightScraper from './utils/playwrightScraper.js';

async function debugLoginStatus() {
    console.log('🔍 Debug stato login per capire il problema');
    
    const credentials = {
        username: 'nemeneme',
        password: 'laziomerda'
    };
    
    const leagueUrl = 'https://leghe.fantacalcio.it/fantaleague-11';
    
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🚀 Inizializzazione Playwright...');
        if (!await scraper.init()) {
            throw new Error('Impossibile inizializzare Playwright');
        }

        // Login
        console.log('🔐 Login...');
        const loginSuccess = await scraper.login(credentials.username, credentials?.password || '', leagueUrl);
        console.log('📊 Risultato login:', loginSuccess);
        
        // Aspetta un po' dopo il login
        await scraper.page.waitForTimeout(3000);
        
        // Verifica lo stato del login
        console.log('🔍 Verifica stato login...');
        const loginStatus = await scraper.isStillLoggedIn();
        console.log('📊 Stato login dopo verifica:', loginStatus);
        
        // Analizza la pagina corrente
        console.log('🔍 Analisi pagina corrente...');
        const pageInfo = await scraper.page.evaluate(() => {
            return {
                url: window.location.href,
                title: document.title,
                hasLoginForm: !!document.querySelector('form[action*="login"], input[name="username"], input[name="password"]'),
                hasLogoutLink: !!document.querySelector('a[href*="logout"]'),
                hasProfileLink: !!document.querySelector('a[href*="profilo"], a[href*="account"]'),
                hasErrorMessages: !!document.querySelector('[class*="error"], [class*="warning"], [class*="message"]'),
                bodyText: document.body.textContent?.substring(0, 500) || '',
                allLinks: Array.from(document.querySelectorAll('a')).map(a => ({
                    text: a.textContent?.trim(),
                    href: a.href
                })).filter(a => a.text && a.text.length > 0).slice(0, 20)
            };
        });
        
        console.log('📊 INFORMAZIONI PAGINA:');
        console.log(JSON.stringify(pageInfo, null, 2));
        
        // Prova a navigare alla lega originale
        console.log('🌐 Tentativo navigazione alla lega originale...');
        try {
            await scraper.page.goto(leagueUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            console.log('✅ Navigazione alla lega riuscita');
            
            const leaguePageInfo = await scraper.page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    hasLoginElements: !!document.querySelector('a[href*="login"], button, input[type="submit"]'),
                    hasLeagueContent: !!document.querySelector('[class*="league"], [class*="lega"], [class*="fantaleague"]'),
                    bodyText: document.body.textContent?.substring(0, 500) || ''
                };
            });
            
            console.log('📊 INFORMAZIONI PAGINA LEGA:');
            console.log(JSON.stringify(leaguePageInfo, null, 2));
            
        } catch (navError) {
            console.log('❌ Errore navigazione alla lega:', navError.message);
        }
        
        // Prova a navigare alla pagina rose con timeout più breve
        console.log('🌐 Tentativo navigazione alla pagina rose...');
        try {
            await scraper.page.goto('https://leghe.fantacalcio.it/fantaleague-11/rose', { 
                waitUntil: 'domcontentloaded', 
                timeout: 10000 
            });
            console.log('✅ Navigazione alla pagina rose riuscita');
            
            const rosePageInfo = await scraper.page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    hasTables: document.querySelectorAll('table').length,
                    hasErrorMessages: !!document.querySelector('[class*="error"], [class*="warning"], [class*="message"]'),
                    bodyText: document.body.textContent?.substring(0, 500) || ''
                };
            });
            
            console.log('📊 INFORMAZIONI PAGINA ROSE:');
            console.log(JSON.stringify(rosePageInfo, null, 2));
            
        } catch (roseError) {
            console.log('❌ Errore navigazione alla pagina rose:', roseError.message);
        }
        
        await scraper.close();
        console.log('✅ Debug login completato!');
        
    } catch (error) {
        console.error('❌ Errore durante il debug login:', error);
        await scraper.close();
    }
}

debugLoginStatus().catch(console.error); 