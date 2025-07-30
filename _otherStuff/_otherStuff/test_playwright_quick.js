import { chromium } from 'playwright';

class PlaywrightScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.userDataDir = null;
    }

    async init() {
        try {
            console.log('🔧 Inizializzazione Playwright...');
            
            // Crea una directory temporanea per il profilo
            this.userDataDir = `./playwright_profile_${Date.now()}`;
            
            this.browser = await chromium.launchPersistentContext(this.userDataDir, {
                headless: true, // Headless per essere invisibile
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-extensions-except',
                    '--disable-plugins-discovery',
                    '--disable-default-apps',
                    '--no-default-browser-check',
                    '--disable-sync',
                    '--disable-translate',
                    '--hide-scrollbars',
                    '--mute-audio'
                ]
            });
            
            this.page = this.browser.pages()[0] || await this.browser.newPage();
            
            // Configura viewport e user agent realistico
            await this.page.setViewportSize({ width: 1920, height: 1080 });
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            });
            
            // Nascondi che siamo Playwright
            await this.page.addInitScript(() => {
                delete navigator.__proto__.webdriver;
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });
            
            console.log('✅ Playwright inizializzato');
            return true;
        } catch (error) {
            console.error('❌ Errore nell\'inizializzazione di Playwright:', error);
            return false;
        }
    }

    async testConnectivity() {
        try {
            console.log('🌐 Test connessione a fantacalcio.it...');
            
            await this.page.goto('https://www.fantacalcio.it', {
                waitUntil: 'networkidle'
            });
            
            const title = await this.page.title();
            console.log(`✅ Connessione riuscita - Titolo: ${title}`);
            
            // Test pagina di login
            console.log('🔐 Test pagina di login...');
            await this.page.goto('https://www.fantacalcio.it/login', {
                waitUntil: 'networkidle'
            });
            
            const loginTitle = await this.page.title();
            console.log(`✅ Pagina login caricata - Titolo: ${loginTitle}`);
            
            // Test gestione cookie CMP
            console.log('🍪 Test gestione cookie CMP...');
            await this.acceptAllPrivacyPopups();
            
            // Test ricerca campi login
            console.log('🔍 Test ricerca campi login...');
            const usernameField = await this.page.$('input[name="username"]');
            const passwordField = await this.page.$('input[name="password"]');
            
            if (usernameField && passwordField) {
                console.log('✅ Campi login trovati correttamente');
                return true;
            } else {
                console.log('❌ Campi login non trovati');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Errore test connessione:', error);
            return false;
        }
    }

    async acceptAllPrivacyPopups() {
        try {
            console.log('🍪 Gestione popup privacy/cookie...');
            
            // Clicca tutti i bottoni con testo accetta/accept/consenti/ok/continua/chiudi/agree/ho capito/continue senza accettare
            const keywords = [
                'accetta', 'accept', 'consenti', 'ok', 'continua', 'chiudi', 'agree', 'ho capito', 'continue', 'continue without accepting', 'rifiuta', 'reject', 'manage', 'gestisci', 'impostazioni', 'settings'
            ];
            
            const buttons = await this.page.$$('button, input[type="button"], input[type="submit"]');
            console.log(`🔍 Trovati ${buttons.length} bottoni da controllare`);
            
            for (const btn of buttons) {
                try {
                    const text = (await this.page.evaluate(el => el.innerText || el.value || '', btn)).toLowerCase();
                    if (keywords.some(k => text.includes(k))) {
                        console.log(`🍪/🔒 Click su bottone con testo: "${text}"`);
                        await btn.click();
                        await this.page.waitForTimeout(1000);
                    }
                } catch (e) {
                    // Ignora errori sui singoli bottoni
                }
            }
            
            // Prova anche a cliccare elementi specifici per CMP
            const cmpHiddenSelectors = [
                '.qc-cmp-cleanslate',
                '#qc-cmp2-container',
                '.qc-cmp2-container',
                '[data-nosnippet]',
                '.cookie-banner',
                '.privacy-banner'
            ];
            
            for (const selector of cmpHiddenSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        console.log(`🔒 Rimozione elemento CMP: ${selector}`);
                        await this.page.evaluate(el => el.remove(), element);
                        await this.page.waitForTimeout(500);
                    }
                } catch (e) {
                    // Ignora errori
                }
            }
            
            console.log('✅ Gestione popup privacy/cookie completata');
        } catch (error) {
            console.log('⚠️ Errore gestione popup privacy/cookie:', error.message);
        }
    }

    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 Browser Playwright chiuso');
            }
        } catch (error) {
            console.error('❌ Errore chiusura browser:', error);
        }
    }
}

async function testPlaywrightQuick() {
    console.log('🧪 Test rapido sistema Playwright');
    
    const scraper = new PlaywrightScraper();
    
    try {
        if (!await scraper.init()) {
            throw new Error('Impossibile inizializzare Playwright');
        }
        
        const connectivityTest = await scraper.testConnectivity();
        
        if (connectivityTest) {
            console.log('✅ Test rapido completato con successo!');
            console.log('🎉 Il sistema Playwright è pronto per lo scraping');
        } else {
            console.log('❌ Test rapido fallito');
        }
        
    } catch (error) {
        console.error('❌ Errore durante il test rapido:', error);
    } finally {
        await scraper.close();
    }
}

// Esegui il test
testPlaywrightQuick(); 