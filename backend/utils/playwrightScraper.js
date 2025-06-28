import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db/config.js';

class PlaywrightScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.userDataDir = null;
        this.screenshotDir = './uploads/playwright_debug';
        this.leagueUrl = null;
        this.scrapingUrls = null;
        this.tipoLega = null; // 'serie_a' o 'euroleghe'
        this.torneoSelezionato = null;
    }

    async init() {
        try {
            console.log('🔧 Inizializzazione Playwright...');
            
            // Crea directory per screenshot se non esiste
            if (!fs.existsSync(this.screenshotDir)) {
                fs.mkdirSync(this.screenshotDir, { recursive: true });
            }
            
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

    async takeScreenshot(stepName) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = path.join(this.screenshotDir, `playwright_${stepName}_${timestamp}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot '${stepName}' salvato: ${screenshotPath}`);
            return screenshotPath;
        } catch (error) {
            console.log(`❌ Errore screenshot '${stepName}': ${error.message}`);
            return null;
        }
    }

    async acceptAllPrivacyPopups() {
        try {
            console.log('🍪 Gestione popup privacy/cookie...');
            await this.takeScreenshot('before_cookie');
            
            // Prima gestione: cerca e clicca bottoni con testo specifico
            const keywords = [
                'accetta', 'accept', 'consenti', 'ok', 'continua', 'chiudi', 'agree', 'ho capito', 'continue', 
                'continue without accepting', 'rifiuta', 'reject', 'manage', 'gestisci', 'impostazioni', 'settings',
                'tutti', 'all', 'conferma', 'confirm', 'procedi', 'proceed'
            ];
            
            let popupHandled = false;
            let attempts = 0;
            const maxAttempts = 5;
            
            while (!popupHandled && attempts < maxAttempts) {
                attempts++;
                console.log(`🍪 Tentativo ${attempts}/${maxAttempts} gestione popup...`);
                
                // Cerca tutti i bottoni
                const buttons = await this.page.$$('button, input[type="button"], input[type="submit"], a[role="button"]');
                console.log(`🔍 Trovati ${buttons.length} bottoni da controllare`);
                
                let clickedSomething = false;
                
                for (const btn of buttons) {
                    try {
                        const text = (await this.page.evaluate(el => el.innerText || el.value || el.title || '', btn)).toLowerCase();
                        const isVisible = await btn.isVisible();
                        
                        if (isVisible && keywords.some(k => text.includes(k))) {
                            console.log(`🍪/🔒 Click su bottone con testo: "${text}"`);
                            await btn.click();
                            await this.page.waitForTimeout(1000);
                            clickedSomething = true;
                        }
                    } catch (e) {
                        // Ignora errori sui singoli bottoni
                    }
                }
                
                // Se non abbiamo cliccato nulla, prova a rimuovere elementi CMP
                if (!clickedSomething) {
                    const cmpHiddenSelectors = [
                        '.qc-cmp-cleanslate',
                        '#qc-cmp2-container',
                        '.qc-cmp2-container',
                        '[data-nosnippet]',
                        '.cookie-banner',
                        '.privacy-banner',
                        '.gdpr-banner',
                        '.consent-banner',
                        '[class*="cookie"]',
                        '[class*="privacy"]',
                        '[class*="consent"]',
                        '[class*="gdpr"]'
                    ];
                    
                    for (const selector of cmpHiddenSelectors) {
                        try {
                            const elements = await this.page.$$(selector);
                            for (const element of elements) {
                        const isVisible = await element.isVisible();
                        if (isVisible) {
                                    console.log(`🔒 Rimozione elemento CMP visibile: ${selector}`);
                                    await this.page.evaluate(el => el.remove(), element);
                                    await this.page.waitForTimeout(500);
                                    clickedSomething = true;
                        }
                    }
                } catch (e) {
                            // Ignora errori
                        }
                    }
                }
                
                // Se non abbiamo fatto nulla, probabilmente non ci sono più popup
                if (!clickedSomething) {
                    popupHandled = true;
                    console.log('✅ Nessun popup trovato o tutti gestiti');
                } else {
                    // Aspetta un po' e ricontrolla
                    await this.page.waitForTimeout(2000);
                }
            }
            
            await this.takeScreenshot('after_cookie');
            console.log('✅ Gestione popup privacy/cookie completata');
        } catch (error) {
            console.log('⚠️ Errore gestione popup privacy/cookie:', error.message);
        }
    }

    async login(username, password, leagueUrl = null) {
        try {
            // Determina l'URL di login corretto in base al tipo di lega
            let loginUrl = 'https://leghe.fantacalcio.it/login'; // Default per Serie A
            
            if (this.tipoLega === 'euroleghe') {
                loginUrl = 'https://euroleghe.fantacalcio.it/login';
                console.log('🔐 Login su euroleghe.fantacalcio.it...');
            } else {
                console.log('🔐 Login su leghe.fantacalcio.it...');
            }
            
            // Vai direttamente alla pagina di login
            console.log(`🌐 Navigazione alla pagina di login: ${loginUrl}`);
            await this.page.goto(loginUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await this.takeScreenshot('login_page');
            
            // Gestisci popup privacy/cookie
            await this.acceptAllPrivacyPopups();
            
            console.log('📝 Inserimento credenziali...');
            
            // Cerca i campi username e password
            const usernameField = await this.page.$('input[name="username"], input[name="email"], input[type="email"], input[placeholder="Username"], input[id*="username"], input[id*="email"]');
            if (!usernameField) {
                console.log('❌ Campo username non trovato');
                // Debug: log tutti i campi input presenti
                const allInputs = await this.page.$$('input');
                console.log(`🔍 Trovati ${allInputs.length} campi input totali`);
                for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
                    const input = allInputs[i];
                    const type = await this.page.evaluate(el => el.type, input);
                    const name = await this.page.evaluate(el => el.name, input);
                    const id = await this.page.evaluate(el => el.id, input);
                    const placeholder = await this.page.evaluate(el => el.placeholder, input);
                    console.log(`  Input ${i + 1}: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
                }
                return false;
            }

            const passwordField = await this.page.$('input[name="password"], input[type="password"], input[placeholder="Password"], input[id*="password"]');
            if (!passwordField) {
                console.log('❌ Campo password non trovato');
                return false;
            }
            
            // Compila i campi
            await usernameField.click();
            await usernameField.fill(username, { delay: 100 });
            
            await passwordField.click();
            await passwordField.fill(password, { delay: 100 });
            
            await this.takeScreenshot('credentials_filled');
            
            // Cerca e clicca il bottone di login
            console.log('🖱️ Cerca bottone login...');
            const loginButton = await this.page.$('button[type="submit"], input[type="submit"], button:has-text("accedi"), button:has-text("login"), button:has-text("entra")');
            if (loginButton) {
                await loginButton.click();
            } else {
                // Fallback: premi Enter
                await this.page.keyboard.press('Enter');
            }
            
            // Aspetta il redirect
            console.log('⏳ Attesa risposta login...');
            await this.page.waitForTimeout(5000);
            
            await this.takeScreenshot('after_login');
            
            // Verifica se il login è riuscito
            const currentUrl = this.page.url();
            console.log(`📍 URL dopo login: ${currentUrl}`);
            
            // Se non siamo più nella pagina di login, è riuscito
            if (!currentUrl.includes('login') && !currentUrl.includes('signin')) {
                console.log('✅ Login riuscito!');
                
                // Se abbiamo un URL di lega, naviga di nuovo lì
                if (leagueUrl) {
                    console.log(`🌐 Navigazione di nuovo alla lega: ${leagueUrl}`);
                    try {
                        await this.page.goto(leagueUrl, { 
                            waitUntil: 'domcontentloaded',
                            timeout: 60000  // Aumento timeout a 60 secondi
                        });
                        await this.acceptAllPrivacyPopups();
                        console.log('✅ Navigazione alla lega corretta completata');
                    } catch (navError) {
                        console.log(`⚠️ Errore navigazione alla lega: ${navError.message}`);
                        // Non fallire il login se la navigazione fallisce
                        // Potremmo già essere nella pagina giusta
                    }
                }
                
                        return true;
            } else {
                console.log('❌ Login fallito - ancora nella pagina di login');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Errore durante il login:', error);
            return false;
        }
    }

    async isStillLoggedIn() {
        try {
            // Verifica che la pagina sia ancora valida
            if (!this.page || this.page.isClosed()) {
                console.log('❌ Pagina chiusa o non valida');
                        return false;
                    }
            
            // Controlla se siamo ancora loggati
            const loginStatus = await this.page.evaluate(() => {
                try {
                    const currentUrl = window.location.href;
                    
                    // Se siamo su leghe.fantacalcio.it o euroleghe.fantacalcio.it
                    if (currentUrl.includes('leghe.fantacalcio.it') || currentUrl.includes('euroleghe.fantacalcio.it')) {
                        // Se siamo su una pagina di lega specifica, probabilmente siamo loggati
                        if (currentUrl.includes('/fantaleague') || currentUrl.includes('/topleague') || currentUrl.includes('/rose') || currentUrl.includes('/classifica') || currentUrl.includes('/formazioni')) {
                            // Cerca elementi che indicano che NON siamo loggati
                            const loginElements = document.querySelectorAll('a[href*="login"], button, input[type="submit"]');
                            let hasLoginElements = false;
                            
                            loginElements.forEach(el => {
                                const text = (el.textContent || el.value || '').toLowerCase();
                                if (text.includes('accedi') || text.includes('login') || text.includes('entra') || text.includes('sign in')) {
                                    hasLoginElements = true;
                                }
                            });
                            
                            // Se non ci sono elementi di login, siamo loggati
                            if (!hasLoginElements) {
                                return { loggedIn: true, reason: 'Siamo su una pagina di lega senza elementi di login' };
                            }
                        }
                        
                        // Se siamo nella pagina di login, non siamo loggati
                        if (currentUrl.includes('login') || currentUrl.includes('signin')) {
                            return { loggedIn: false, reason: 'Siamo nella pagina di login' };
                        }
                        
                        // Cerca elementi che indicano che siamo loggati
                        const loggedInElements = document.querySelectorAll('a[href*="logout"], a[href*="profilo"], a[href*="account"], .user-menu, .profile-link');
                        if (loggedInElements.length > 0) {
                            return { loggedIn: true, reason: 'Elementi di profilo/logout trovati' };
                        }
                        
                        // Cerca form di login
                        const loginForms = document.querySelectorAll('form[action*="login"], form input[name="username"], form input[name="password"]');
                        if (loginForms.length > 0) {
                            return { loggedIn: false, reason: 'Form di login trovati' };
                        }
                    }
                    
                    // Se non siamo su leghe.fantacalcio.it, controlli generici
                    const loginButtons = document.querySelectorAll('a[href*="login"], button, input[type="submit"]');
                    let hasGenericLoginElements = false;
                    
                    loginButtons.forEach(btn => {
                        const text = (btn.textContent || btn.value || '').toLowerCase();
                        if (text.includes('accedi') || text.includes('login') || text.includes('entra')) {
                            hasGenericLoginElements = true;
                        }
                    });
                    
                    if (hasGenericLoginElements) {
                        return { loggedIn: false, reason: 'Elementi di login generici trovati' };
                    }
                    
                    // Se non trova elementi di login e non siamo nella pagina di login, probabilmente siamo loggati
                    return { loggedIn: true, reason: 'Nessun elemento di login trovato' };
                    
                } catch (e) {
                    return { loggedIn: false, reason: `Errore JavaScript: ${e.message}` };
                }
            });
            
            console.log(`🔍 Stato login: ${loginStatus.loggedIn ? 'LOGGATO' : 'NON LOGGATO'} - ${loginStatus.reason}`);
            return loginStatus.loggedIn;
            
        } catch (error) {
            // Se c'è un errore di frame detached, probabilmente la pagina è stata ricaricata
            if (error.message.includes('detached')) {
                console.log('⚠️ Frame detached - pagina probabilmente ricaricata, riprovo...');
                // Aspetta un po' e riprova
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await this.isStillLoggedIn();
            }
            
            console.log('❌ Errore controllo login:', error.message);
            return false;
        }
    }

    async scrapeRose(url) {
        try {
            console.log(`📊 Scraping rose da: ${url}`);
            
            await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await this.acceptAllPrivacyPopups();
            await this.page.waitForTimeout(3000);
            
            await this.takeScreenshot('rose_page');
            
            const roseData = await this.page.evaluate(() => {
                function pulisciDatiASPNet(dato) {
                    if (dato) return dato.split('\n')[0].trim();
                    return dato;
                }
                const squadre = [];
                
                console.log('🔍 Analisi pagina rose...');
                
                // Cerca tutte le tabelle delle rose
                const allTables = document.querySelectorAll('table');
                console.log(`Trovate ${allTables.length} tabelle totali`);
                
                // Filtra le tabelle che contengono giocatori (escludi la tabella classifica)
                const roseTables = [];
                allTables.forEach((table, index) => {
                    const tableText = table.textContent?.toLowerCase() || '';
                    
                    // Escludi la tabella classifica
                    if (tableText.includes('gruppo') || tableText.includes('posizione') || 
                        tableText.includes('punti') || tableText.includes('partite')) {
                        console.log(`Salto tabella ${index}: tabella classifica`);
                        return;
                    }
                    
                    // Cerca tabelle che contengono giocatori
                    if (tableText.includes('ruolo') || tableText.includes('nome') || 
                        tableText.includes('squadra') || tableText.includes('quotazione')) {
                        roseTables.push(table);
                        console.log(`Tabella ${index} aggiunta: contiene dati giocatori`);
                    }
                });
                
                console.log(`Trovate ${roseTables.length} tabelle di rose`);
                
                // Per ogni tabella, estrai squadra e giocatori
                roseTables.forEach((table, tableIndex) => {
                    console.log(`Analizzando tabella ${tableIndex + 1}`);
                    
                    // Cerca il nome della squadra sopra la tabella
                    let squadraNome = `Squadra ${tableIndex + 1}`;
                    
                    // Cerca il nome squadra nell'elemento padre o nei fratelli
                    let currentElement = table.parentElement;
                    for (let i = 0; i < 5; i++) { // Cerca fino a 5 livelli sopra
                        if (!currentElement) break;
                        
                        // Cerca titoli o header che potrebbero contenere il nome squadra
                        const titleElements = currentElement.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .team-title, .squadra-title');
                        for (const titleEl of titleElements) {
                            const titleText = titleEl.textContent?.trim();
                            if (titleText && titleText.length > 2 && titleText.length < 30 &&
                                !titleText.toLowerCase().includes('rose') &&
                                !titleText.toLowerCase().includes('classifica') &&
                                !titleText.toLowerCase().includes('formazioni') &&
                                !titleText.toLowerCase().includes('strumenti') &&
                                !titleText.toLowerCase().includes('riordina') &&
                                !titleText.toLowerCase().includes('personalizza') &&
                                !titleText.toLowerCase().includes('previous') &&
                                !titleText.toLowerCase().includes('next') &&
                                !titleText.toLowerCase().includes('finale') &&
                                !titleText.toLowerCase().includes('per l\'admin')) {
                                squadraNome = titleText;
                                console.log(`Nome squadra trovato: ${squadraNome}`);
                                break;
                            }
                        }
                        
                        if (squadraNome !== `Squadra ${tableIndex + 1}`) break;
                        currentElement = currentElement.parentElement;
                    }
                    
                    // Se non abbiamo trovato un nome specifico, cerca nella tabella stessa
                    if (squadraNome === `Squadra ${tableIndex + 1}`) {
                        const rows = table.querySelectorAll('tr');
                        if (rows.length > 0) {
                            const firstRow = rows[0];
                            const cells = firstRow.querySelectorAll('td, th');
                            
                            // Cerca nella prima riga per il nome squadra
                            cells.forEach(cell => {
                                const cellText = cell.textContent?.trim();
                                if (cellText && cellText.length > 2 && cellText.length < 30 &&
                                    !cellText.toLowerCase().includes('ruolo') &&
                                    !cellText.toLowerCase().includes('nome') &&
                                    !cellText.toLowerCase().includes('squadra') &&
                                    !cellText.toLowerCase().includes('quotazione') &&
                                    !cellText.toLowerCase().includes('fv') &&
                                    !cellText.toLowerCase().includes('q.att')) {
                                    squadraNome = cellText;
                                    console.log(`Nome squadra trovato nella tabella: ${squadraNome}`);
                                }
                            });
                        }
                    }
                    
                    // Ora estrai i giocatori dalla tabella
                    const giocatori = [];
                    const rows = table.querySelectorAll('tr');
                    
                    rows.forEach((row, rowIndex) => {
                        const cells = row.querySelectorAll('td');
                        
                        // Salta la riga di header
                        if (rowIndex === 0) return;
                        
                        // Verifica che abbiamo abbastanza celle
                        if (cells.length >= 5) {
                            const ruolo = cells[0]?.textContent?.trim();
                            const nome = cells[1]?.textContent?.trim();
                            const fvMp = cells[2]?.textContent?.trim();
                            const squadraReale = cells[3]?.textContent?.trim();
                            const qi = cells[cells.length-2]?.textContent?.trim(); // Penultima colonna
                            const quotazione = cells[cells.length-1]?.textContent?.trim(); // Ultima colonna
                            
                            if (nome && nome.length > 2 && !nome.includes('<')) {
                                // Normalizza il nome preservando la capitalizzazione
                                let nomeNormalizzato = nome;
                                
                                // Se il nome è tutto minuscolo, prova a capitalizzarlo
                                if (nome === nome.toLowerCase() && nome.length > 2) {
                                    // Capitalizza la prima lettera di ogni parola
                                    nomeNormalizzato = nome.split(' ').map(word => {
                                        if (word.length > 0) {
                                            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                        }
                                        return word;
                                    }).join(' ');
                                    
                                    // Gestisci casi speciali come "de", "da", "di", "del", "della", "dello", "degli", "delle"
                                    const preposizioni = ['de', 'da', 'di', 'del', 'della', 'dello', 'degli', 'delle', 'al', 'dal', 'nel', 'sul'];
                                    preposizioni.forEach(prep => {
                                        const regex = new RegExp(`\\b${prep}\\b`, 'gi');
                                        nomeNormalizzato = nomeNormalizzato.replace(regex, prep.toLowerCase());
                                    });
                                }
                                
                                // Pulisci i dati dal codice ASP.NET
                                const fvMpPulito = pulisciDatiASPNet(fvMp);
                                const squadraRealePulita = pulisciDatiASPNet(squadraReale);
                                const qiPulito = pulisciDatiASPNet(qi);
                                const quotazionePulita = pulisciDatiASPNet(quotazione);
                                
                                // MAPPING CORRETTO anche per la parte alternativa
                                giocatori.push({
                                    nome: nomeNormalizzato,
                                    ruolo: ruolo || 'N/A',
                                    squadra: squadraRealePulita || 'N/A',   // squadra reale (colonna 3)
                                    quotazione: quotazionePulita || '1.0',  // quotazione (ultima colonna)
                                    fvMp: fvMpPulito || '0.0',               // FV MP (colonna 2)
                                    qi: qiPulito || '0.0'                    // QI (penultima colonna)
                                });
                            }
                        }
                    });
                    
                    // Aggiungi la squadra solo se ha giocatori
                    if (giocatori.length > 0) {
                        squadre.push({
                            nome: squadraNome,
                            giocatori: giocatori
                        });
                        console.log(`✅ Squadra ${squadraNome}: ${giocatori.length} giocatori`);
                    }
                });
                
                // Se non abbiamo trovato nulla, prova un approccio alternativo
                if (squadre.length === 0) {
                    console.log('🔄 Nessuna squadra trovata, prova approccio alternativo...');
                    
                    // Cerca tutti i div che potrebbero contenere squadre
                    const squadreDivs = document.querySelectorAll('.panel, .widget, .squadra-container, [class*="squadra"], [class*="team"]');
                    
                    squadreDivs.forEach((div, divIndex) => {
                        const title = div.querySelector('.panel-title, h3, h4, .title, .team-title')?.textContent?.trim();
                        const table = div.querySelector('table');
                        
                        if (table && title && !title.includes('<') && !title.includes('select') && 
                            !title.toLowerCase().includes('classifica') && 
                            !title.toLowerCase().includes('ultima giornata') &&
                            !title.toLowerCase().includes('in questa competizione') &&
                            !title.toLowerCase().includes('strumenti') &&
                            !title.toLowerCase().includes('riordina') &&
                            !title.toLowerCase().includes('personalizza') &&
                            !title.toLowerCase().includes('previous') &&
                            !title.toLowerCase().includes('next') &&
                            !title.toLowerCase().includes('finale') &&
                            !title.toLowerCase().includes('per l\'admin')) {
                            
                            const rows = table.querySelectorAll('tr');
                            const giocatori = [];
                            
                            rows.forEach(row => {
                                const cells = row.querySelectorAll('td');
                                if (cells.length >= 5) {
                                    const ruolo = cells[0]?.textContent?.trim();
                                    const nome = cells[1]?.textContent?.trim();
                                    const fvMp = cells[2]?.textContent?.trim();
                                    const squadraReale = cells[3]?.textContent?.trim();
                                    const quotazione = cells[4]?.textContent?.trim();
                                    
                                    if (nome && nome.length > 2 && !nome.includes('<')) {
                                        // Normalizza il nome preservando la capitalizzazione
                                        let nomeNormalizzato = nome;
                                        
                                        // Se il nome è tutto minuscolo, prova a capitalizzarlo
                                        if (nome === nome.toLowerCase() && nome.length > 2) {
                                            // Capitalizza la prima lettera di ogni parola
                                            nomeNormalizzato = nome.split(' ').map(word => {
                                                if (word.length > 0) {
                                                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                                }
                                                return word;
                                            }).join(' ');
                                            
                                            // Gestisci casi speciali come "de", "da", "di", "del", "della", "dello", "degli", "delle"
                                            const preposizioni = ['de', 'da', 'di', 'del', 'della', 'dello', 'degli', 'delle', 'al', 'dal', 'nel', 'sul'];
                                            preposizioni.forEach(prep => {
                                                const regex = new RegExp(`\\b${prep}\\b`, 'gi');
                                                nomeNormalizzato = nomeNormalizzato.replace(regex, prep.toLowerCase());
                                            });
                                        }
                                        
                                        // Pulisci i dati dal codice ASP.NET
                                        const fvMpPulito = pulisciDatiASPNet(fvMp);
                                        const squadraRealePulita = pulisciDatiASPNet(squadraReale);
                                        const quotazionePulita = pulisciDatiASPNet(quotazione);
                                        
                                        // MAPPING CORRETTO anche per la parte alternativa
                                        giocatori.push({
                                            nome: nomeNormalizzato,
                                            ruolo: ruolo || 'N/A',
                                            squadra: squadraRealePulita || 'N/A',   // squadra reale (colonna 3)
                                            quotazione: quotazionePulita || '1.0',  // quotazione (colonna 4)
                                            fvMp: fvMpPulito || '0.0',               // FV MP (colonna 2)
                                            qi: qi || '0.0'                           // QI (colonna 5)
                                        });
                                    }
                                }
                            });
                            
                            if (giocatori.length > 0) {
                                squadre.push({ nome: title, giocatori });
                                console.log(`✅ Squadra alternativa ${title}: ${giocatori.length} giocatori`);
                            }
                        }
                    });
                }
                
                console.log(`✅ Risultato finale: ${squadre.length} squadre trovate`);
                squadre.forEach(s => {
                    console.log(`  - ${s.nome}: ${s.giocatori.length} giocatori`);
                });
                
                // Ordina i giocatori per ruolo decrescente (P, D, C, A)
                squadre.forEach(squadra => {
                    squadra.giocatori.sort((a, b) => {
                        const ruoli = { 'P': 4, 'D': 3, 'C': 2, 'A': 1 };
                        const ruoloA = ruoli[a.ruolo] || 0;
                        const ruoloB = ruoli[b.ruolo] || 0;
                        return ruoloB - ruoloA; // Decrescente
                    });
                });
                
                return squadre;
            });
            
            console.log(`✅ Rose estratte: ${roseData.length} squadre trovate`);
            
            // Debug: log dettagliato dei risultati
            roseData.forEach((squadra, index) => {
                console.log(`Squadra ${index + 1}: ${squadra.nome} (${squadra.giocatori.length} giocatori)`);
                squadra.giocatori.slice(0, 3).forEach((giocatore, gIndex) => {
                    console.log(`  - ${gIndex + 1}. ${giocatore.nome} (${giocatore.ruolo}) - ${giocatore.squadra} - QI:${giocatore.qi} - QA:${giocatore.quotazione} - FV:${giocatore.fvMp}`);
                });
                if (squadra.giocatori.length > 3) {
                    console.log(`  ... e altri ${squadra.giocatori.length - 3} giocatori`);
                }
            });
            
            return roseData;
        } catch (error) {
            console.error('❌ Errore scraping rose:', error);
            throw error;
        }
    }

    async scrapeClassifica(url) {
        try {
            console.log(`🏆 Scraping classifica da: ${url}`);
            
            await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await this.acceptAllPrivacyPopups();
                    await this.page.waitForTimeout(3000);
            
            await this.takeScreenshot('classifica_page');
            
            const classificaData = await this.page.evaluate(() => {
                const posizioni = [];
                
                console.log('Analisi pagina classifica...');
                
                // Debug: mostra tutte le tabelle presenti
                const allTables = document.querySelectorAll('table');
                console.log(`Trovate ${allTables.length} tabelle nella pagina`);
                
                allTables.forEach((table, index) => {
                    const className = table.className;
                    const id = table.id;
                    const rows = table.querySelectorAll('tr').length;
                    console.log(`Tabella ${index}: class="${className}", id="${id}", righe=${rows}`);
                });
                
                // Cerca la tabella della classifica con selettori più flessibili
                let table = null;
                const selectors = [
                    '.widget-body.smart-table.table.table-striped',
                    'table.table',
                    'table[class*="classifica"]',
                    'table[class*="ranking"]',
                    'table[class*="table"]',
                    'table'
                ];
                
                for (const selector of selectors) {
                    table = document.querySelector(selector);
                    if (table) {
                        console.log(`✅ Tabella trovata con selettore: ${selector}`);
                        break;
                    }
                }
                
                if (!table) {
                    console.log('❌ Nessuna tabella trovata per la classifica');
                    return posizioni;
                }
                
                console.log('Tabella classifica trovata');
                
                // Analizza le righe della tabella
                const rows = table.querySelectorAll('tr');
                console.log(`Analizzando ${rows.length} righe della classifica`);
                
                rows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll('td');
                    
                    // Salta le righe vuote o header
                    if (cells.length < 10) return;
                    
                    // Estrai i dati della posizione
                    const posizione = cells[0]?.textContent?.trim();
                    const squadra = cells[2]?.textContent?.trim();
                    const partiteGiocate = cells[3]?.textContent?.trim();
                    const vittorie = cells[4]?.textContent?.trim();
                    const pareggi = cells[5]?.textContent?.trim();
                    const sconfitte = cells[6]?.textContent?.trim();
                    const golFatti = cells[7]?.textContent?.trim();
                    const golSubiti = cells[8]?.textContent?.trim();
                    const differenzaReti = cells[9]?.textContent?.trim();
                    const punti = cells[10]?.textContent?.trim();
                    const puntiTotali = cells[11]?.textContent?.trim();
                    
                    // Verifica che sia una posizione valida
                    if (posizione && squadra && !posizione.includes('Gruppo')) {
                        // Pulisci il nome della squadra rimuovendo il codice ASP.NET
                        const cleanSquadra = squadra.split('\n')[0].trim();
                        
                        if (cleanSquadra && cleanSquadra.length > 0) {
                            console.log(`Posizione ${posizione}: ${cleanSquadra} - ${punti} punti`);
                            
                            posizioni.push({
                                posizione: parseInt(posizione) || rowIndex + 1,
                                squadra: cleanSquadra,
                                partite: parseInt(partiteGiocate) || 0,
                                vittorie: parseInt(vittorie) || 0,
                                pareggi: parseInt(pareggi) || 0,
                                sconfitte: parseInt(sconfitte) || 0,
                                golFatti: parseInt(golFatti) || 0,
                                golSubiti: parseInt(golSubiti) || 0,
                                differenzaReti: parseInt(differenzaReti) || 0,
                                punti: parseInt(punti) || 0,
                                puntiTotali: parseFloat(puntiTotali) || 0
                            });
                        }
                    }
                });
                
                console.log(`Classifica estratta: ${posizioni.length} posizioni trovate`);
                
                // Debug: mostra le prime 5 posizioni estratte
                posizioni.slice(0, 5).forEach((pos, index) => {
                    console.log(`Debug posizione ${index + 1}:`, pos);
                });
                
                return posizioni;
            });
            
            console.log(`Classifica estratta: ${classificaData.length} posizioni trovate`);
            
            // Debug: log dettagliato dei risultati
            classificaData.slice(0, 5).forEach((posizione, index) => {
                console.log(`${posizione.posizione}. ${posizione.squadra} - ${posizione.punti} punti (${posizione.partite} partite)`);
            });
            
            return classificaData;
            
        } catch (error) {
            console.error('Errore scraping classifica:', error);
            throw error;
        }
    }

    async scrapeFormazioni(formazioniUrl, giornata = null) {
        try {
            console.log(`⚽ Scraping formazioni da: ${formazioniUrl}${giornata ? '/' + giornata : ''}`);
            
            // Costruisci l'URL completo con la giornata se specificata
            const urlCompleto = giornata ? `${formazioniUrl}/${giornata}` : formazioniUrl;
            
            await this.page.goto(urlCompleto, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            await this.acceptAllPrivacyPopups();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const formazioniData = await this.page.evaluate(() => {
                const formazioni = [];
                
                // Cerca le formazioni nella pagina
                const formazioniElements = document.querySelectorAll('.formazione, .formation, [class*="formazione"], [class*="formation"]');
                
                formazioniElements.forEach(formazioneEl => {
                    const squadra = formazioneEl.querySelector('.squadra, .team, .nome')?.textContent?.trim();
                    const modulo = formazioneEl.querySelector('.modulo, .module')?.textContent?.trim();
                    const titolari = [];
                    const panchinari = [];
                    
                    // Cerca titolari e panchinari
                    const titolariElements = formazioneEl.querySelectorAll('.titolare, .starter');
                    const panchinariElements = formazioneEl.querySelectorAll('.panchinaro, .substitute');
                    
                    titolariElements.forEach(titolareEl => {
                        const nome = titolareEl.textContent?.trim();
                        if (nome) titolari.push(nome);
                    });
                    
                    panchinariElements.forEach(panchinaroEl => {
                        const nome = panchinaroEl.textContent?.trim();
                        if (nome) panchinari.push(nome);
                    });
                    
                    if (squadra) {
                        formazioni.push({
                            squadra,
                            modulo: modulo || 'N/A',
                            titolari,
                            panchinari
                        });
                    }
                });
                
                return formazioni;
            });
            
            console.log(`✅ Formazioni estratte: ${formazioniData.length} formazioni trovate`);
            return formazioniData;
            
        } catch (error) {
            console.error('❌ Errore scraping formazioni:', error);
            throw error;
        }
    }

    async scrapeLeague(leagueUrl, scrapingUrls, credentials, tournamentId = null, legaId = null, selectedTournament = null) {
        try {
            console.log('Inizio scraping con Playwright');
            
            // Salva gli URL per uso futuro
            this.leagueUrl = leagueUrl;
            this.scrapingUrls = { ...scrapingUrls };
            
            // Rileva il tipo di lega
            this.detectLeagueType(leagueUrl);
            
            if (!await this.init()) {
                throw new Error('Impossibile inizializzare Playwright');
            }

            // STEP 1: LOGIN DIRETTO SULLA LEGA
            console.log('STEP 1: Login diretto sulla lega');
            const loginSuccess = await this.login(credentials.username, credentials.password, leagueUrl);
                    if (!loginSuccess) {
                throw new Error('Login fallito');
            }
            
            console.log('Login completato');

            // STEP 2: SELEZIONE TORNEO (se richiesto)
            if (selectedTournament || tournamentId) {
                console.log('STEP 2: Selezione torneo');
                const tournamentToSelect = selectedTournament || tournamentId;
                const tournamentSelected = await this.selectTournament(tournamentToSelect);
                if (!tournamentSelected) {
                    console.log('Torneo non selezionato, continuo con il torneo corrente');
                } else {
                    console.log(`✅ Torneo selezionato: ${tournamentToSelect}`);
                    console.log('URL aggiornati:', this.scrapingUrls);
                }
            }

            // STEP 3: SCRAPING
            console.log('STEP 3: Scraping dati');
            
            const results = {
                rose: null,
                classifica: null,
                formazioni: null,
                summary: {
                    squadre_trovate: 0,
                    giocatori_totali: 0
                },
                tipo_lega: this.tipoLega,
                torneo_selezionato: this.torneoSelezionato
            };

            // Scraping Rose
            if (scrapingUrls.rose) {
                console.log(`📊 Scraping rose: ${scrapingUrls.rose}`);
                try {
                    results.rose = await this.scrapeRose(scrapingUrls.rose);
                    console.log('✅ Rose completate');
                } catch (error) {
                    console.error('❌ Errore scraping rose:', error.message);
                    results.rose = { error: error.message };
                }
            }

            // Scraping Classifica
            if (scrapingUrls.classifica) {
                console.log(`📊 Scraping classifica: ${scrapingUrls.classifica}`);
                try {
                    results.classifica = await this.scrapeClassifica(scrapingUrls.classifica);
                    console.log('✅ Classifica completata');
                } catch (error) {
                    console.error('❌ Errore scraping classifica:', error.message);
                    results.classifica = { error: error.message };
                }
            }

            // Scraping Formazioni
            if (scrapingUrls.formazioni) {
                console.log(`📊 Scraping formazioni: ${scrapingUrls.formazioni}`);
                try {
                    // Estrai la giornata dall'URL se presente
                    const giornata = scrapingUrls.formazioni.match(/\/(\d+)$/)?.[1] || null;
                    results.formazioni = await this.scrapeFormazioni(scrapingUrls.formazioni, giornata);
                    console.log('✅ Formazioni completate');
                } catch (error) {
                    console.error('❌ Errore scraping formazioni:', error.message);
                    results.formazioni = { error: error.message };
                }
            }

            // Calcola summary
            if (results.rose && Array.isArray(results.rose)) {
                results.summary.squadre_trovate = results.rose.length;
                results.summary.giocatori_totali = results.rose.reduce((total, squadra) => total + (squadra.giocatori?.length || 0), 0);
            }

            // Salva nel database se necessario
            if (legaId) {
                console.log('💾 Salvataggio dati nel database...');
                
                // Salva rose
                if (results.rose && !results.rose.error) {
                    const dbResults = await this.saveRoseToDatabase(legaId, results.rose);
                    results.database = { ...results.database, rose: dbResults };
                }
                
                // Salva classifica
                if (results.classifica && Array.isArray(results.classifica) && results.classifica.length > 0) {
                    console.log(`📊 Salvataggio classifica con ${results.classifica.length} posizioni...`);
                    const classificaResults = await this.saveClassificaToDatabase(legaId, results.classifica);
                    results.database = { ...results.database, classifica: classificaResults };
                    console.log('✅ Classifica salvata nel database:', classificaResults);
                } else {
                    console.log('⚠️ Nessuna classifica da salvare:', results.classifica);
                }
                
                // Salva formazioni
                if (results.formazioni && Array.isArray(results.formazioni) && results.formazioni.length > 0) {
                    console.log(`📊 Salvataggio formazioni con ${results.formazioni.length} formazioni...`);
                    const formazioniResults = await this.saveFormazioniToDatabase(legaId, results.formazioni);
                    results.database = { ...results.database, formazioni: formazioniResults };
                    console.log('✅ Formazioni salvate nel database:', formazioniResults);
                } else {
                    console.log('⚠️ Nessuna formazione da salvare:', results.formazioni);
                }
            }

            await this.close();
            console.log('✅ Scraping completato con successo');
            return results;

        } catch (error) {
            console.error('❌ Errore durante lo scraping:', error);
            await this.close();
            throw error;
        }
    }

    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 Browser Playwright chiuso');
            }
            
            // Pulisci il profilo temporaneo
            if (this.userDataDir && fs.existsSync(this.userDataDir)) {
                try {
                    fs.rmSync(this.userDataDir, { recursive: true, force: true });
                    console.log(`🧹 Profilo temporaneo rimosso: ${this.userDataDir}`);
                } catch (cleanupError) {
                    console.log(`⚠️ Errore pulizia profilo: ${cleanupError.message}`);
                }
            }
        } catch (error) {
            console.error('❌ Errore chiusura browser:', error);
        }
    }

    // Metodo per pulire tutti i profili Playwright accumulati
    static async cleanupAllProfiles() {
        try {
            const currentDir = process.cwd();
            const files = fs.readdirSync(currentDir);
            
            const profileDirs = files.filter(file => 
                file.startsWith('playwright_profile_') && 
                fs.statSync(path.join(currentDir, file)).isDirectory()
            );
            
            console.log(`🧹 Trovati ${profileDirs.length} profili Playwright da pulire`);
            
            for (const profileDir of profileDirs) {
                try {
                    fs.rmSync(path.join(currentDir, profileDir), { recursive: true, force: true });
                    console.log(`✅ Rimosso profilo: ${profileDir}`);
                } catch (error) {
                    console.log(`⚠️ Errore rimozione ${profileDir}: ${error.message}`);
                }
            }
            
            console.log('✅ Pulizia profili Playwright completata');
        } catch (error) {
            console.error('❌ Errore pulizia profili:', error);
        }
    }

    // Metodi per salvare i dati nel database
    async saveRoseToDatabase(legaId, roseData) {
        try {
            console.log(`💾 Salvataggio rose di scraping nel database per lega ${legaId}...`);
            
            // Prima elimina i dati precedenti
            await this.clearRoseScraping(legaId);
            
            let squadreSalvate = 0;
            let giocatoriSalvati = 0;
            
            for (const squadra of roseData) {
                // Salva la squadra nella tabella di scraping
                const squadraId = await this.saveSquadraScraping(legaId, squadra.nome);
                squadreSalvate++;
                
                // Ordina i giocatori per ruolo decrescente (P, D, C, A)
                const giocatoriOrdinati = squadra.giocatori.sort((a, b) => {
                    const ruoloA = this.normalizeRuolo(a.ruolo);
                    const ruoloB = this.normalizeRuolo(b.ruolo);
                    const ordineRuoli = { 'P': 4, 'D': 3, 'C': 2, 'A': 1 };
                    return ordineRuoli[ruoloB] - ordineRuoli[ruoloA];
                });
                
                // Salva i giocatori della squadra nella tabella di scraping (ordinati)
                for (const giocatore of giocatoriOrdinati) {
                    await this.saveGiocatoreScraping(legaId, squadraId, giocatore);
                    giocatoriSalvati++;
                }
            }
            
            console.log(`✅ Database scraping aggiornato: ${squadreSalvate} squadre, ${giocatoriSalvati} giocatori`);
                return {
                success: true,
                squadre_salvate: squadreSalvate,
                giocatori_salvati: giocatoriSalvati,
                tipo: 'scraping'
            };
            
        } catch (error) {
            console.error('❌ Errore salvataggio nel database di scraping:', error);
            throw error;
        }
    }
    
    async saveSquadraScraping(legaId, nomeSquadra) {
        return new Promise(async (resolve, reject) => {
            const { getDb } = await import('../db/config.js');
            const db = getDb();
            
            // Prima controlla se la squadra di scraping esiste già
            db.get(
                'SELECT id FROM squadre_scraping WHERE lega_id = ? AND nome = ?',
                [legaId, nomeSquadra],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (row) {
                        // Squadra di scraping già esistente, aggiorna la data
                        db.run(
                            'UPDATE squadre_scraping SET data_scraping = datetime("now") WHERE id = ?',
                            [row.id],
                            function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(row.id);
                                }
                            }
                        );
                    } else {
                        // Crea nuova squadra di scraping
                        db.run(
                            'INSERT INTO squadre_scraping (lega_id, nome, data_scraping, fonte_scraping) VALUES (?, ?, datetime("now"), "playwright")',
                            [legaId, nomeSquadra],
                            function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(this.lastID);
                                }
                            }
                        );
                    }
                }
            );
        });
    }
    
    async saveGiocatoreScraping(legaId, squadraScrapingId, giocatore) {
        return new Promise(async (resolve, reject) => {
            const { getDb } = await import('../db/config.js');
            const db = getDb();
            
            // Normalizza il ruolo usando il tipo di lega corrente
            const ruolo = this.normalizeRuolo(giocatore.ruolo);
            
            // Debug dei dati ricevuti
            console.log('🔍 DEBUG saveGiocatoreScraping:', {
                nome: giocatore.nome,
                ruolo: giocatore.ruolo,
                squadra: giocatore.squadra,
                quotazione: giocatore.quotazione,
                qi: giocatore.qi,
                fvMp: giocatore.fvMp
            });
            
            // Corretto: squadra_reale = giocatore.quotazione (nome squadra reale), quotazione = parseFloat(giocatore.squadra) (valore numerico)
            const squadraReale = giocatore.quotazione;
            const quotazione = parseFloat(giocatore.squadra) || 1.0;
            const qi = parseFloat(giocatore.qi) || 0;
            const fvMp = giocatore.fvMp || '0';
            
            // Debug dei dati processati
            console.log('🔍 DEBUG dati processati:', {
                ruolo_normalizzato: ruolo,
                quotazione_corretta: quotazione,
                qi_corretto: qi,
                squadra_reale_corretta: squadraReale,
                fv_mp_corretto: fvMp
            });
            
            // Controlla se il giocatore di scraping esiste già
            db.get(
                'SELECT id FROM giocatori_scraping WHERE lega_id = ? AND nome = ? AND squadra_scraping_id = ?',
                [legaId, giocatore.nome, squadraScrapingId],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (row) {
                        // Aggiorna giocatore di scraping esistente
                        db.run(
                            `UPDATE giocatori_scraping 
                             SET ruolo = ?, squadra_reale = ?, quotazione = ?, qi = ?, fv_mp = ?, data_scraping = datetime("now")
                             WHERE id = ?`,
                            [ruolo, squadraReale, quotazione, qi, fvMp, row.id],
                            (err) => {
                                if (err) reject(err);
                                else resolve(row.id);
                            }
                        );
                    } else {
                        // Crea nuovo giocatore di scraping
                        db.run(
                            `INSERT INTO giocatori_scraping 
                             (lega_id, squadra_scraping_id, nome, ruolo, squadra_reale, quotazione, qi, fv_mp, data_scraping, fonte_scraping)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), "playwright")`,
                            [legaId, squadraScrapingId, giocatore.nome, ruolo, squadraReale, quotazione, qi, fvMp],
                            function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(this.lastID);
                                }
                            }
                        );
                    }
                }
            );
        });
    }
    
    normalizeRuolo(ruolo) {
        if (!ruolo) return 'N/A';
        
        const ruoloUpper = ruolo.toUpperCase();
        
        // Se è una lega Euroleghe, mantieni i ruoli originali senza normalizzazione
        if (this.tipoLega === 'euroleghe') {
            // Per Euroleghe Mantra, mantieni sempre i ruoli originali
            return ruoloUpper;
        }
        
        // Per Serie A Classic, usa la normalizzazione originale
        const ruoloLower = ruolo.toLowerCase();
        if (ruoloLower.includes('portiere') || ruoloLower.includes('p')) return 'P';
        if (ruoloLower.includes('difensore') || ruoloLower.includes('d')) return 'D';
        if (ruoloLower.includes('centrocampista') || ruoloLower.includes('c')) return 'C';
        if (ruoloLower.includes('attaccante') || ruoloLower.includes('a')) return 'A';
        
        return ruolo.toUpperCase();
    }

    // Metodo per eliminare i dati di rose precedenti
    async clearRoseScraping(legaId) {
        return new Promise(async (resolve, reject) => {
            const { getDb } = await import('../db/config.js');
            const db = getDb();
            
            try {
                console.log(`🗑️ Eliminazione dati rose precedenti per lega ${legaId}...`);
                
                // Prima elimina i giocatori
                db.run(
                    'DELETE FROM giocatori_scraping WHERE lega_id = ?',
                    [legaId],
                    function(err) {
                        if (err) {
                            console.error('❌ Errore eliminazione giocatori:', err);
                            reject(err);
                            return;
                        }
                        
                        console.log(`🗑️ Eliminati ${this.changes} giocatori precedenti`);
                        
                        // Poi elimina le squadre
                        db.run(
                            'DELETE FROM squadre_scraping WHERE lega_id = ?',
                            [legaId],
                            function(err) {
                                if (err) {
                                    console.error('❌ Errore eliminazione squadre:', err);
                                    reject(err);
                                    return;
                                }
                                
                                console.log(`🗑️ Eliminate ${this.changes} squadre precedenti`);
                                resolve();
                            }
                        );
                    }
                );
            } catch (error) {
                console.error('❌ Errore clearRoseScraping:', error);
                reject(error);
            }
        });
    }

    // Metodo per salvare la classifica nel database
    async saveClassificaToDatabase(legaId, classificaData) {
        return new Promise(async (resolve, reject) => {
            const { getDb } = await import('../db/config.js');
            const db = getDb();
            
            try {
                console.log(`💾 Salvataggio classifica di scraping nel database per lega ${legaId}...`);
                
                // Prima elimina i dati precedenti
                db.run(
                    'DELETE FROM classifica_scraping WHERE lega_id = ?',
                    [legaId],
                    function(err) {
                        if (err) {
                            console.error('❌ Errore eliminazione classifica precedente:', err);
                            reject(err);
                            return;
                        }
                        
                        console.log(`🗑️ Eliminati ${this.changes} record di classifica precedenti per lega ${legaId}`);
                        
                        // Poi inserisci i nuovi dati
                        let insertedCount = 0;
                        const totalCount = classificaData.length;
                        
                        if (totalCount === 0) {
                            console.log('⚠️ Nessun dato di classifica da salvare');
                            resolve({ success: true, posizioni_salvate: 0, tipo: 'classifica_scraping' });
                            return;
                        }
                        
                        classificaData.forEach((posizione, index) => {
                            db.run(
                                'INSERT INTO classifica_scraping (lega_id, posizione, squadra, punti, partite, data_scraping, fonte_scraping) VALUES (?, ?, ?, ?, ?, datetime("now"), "playwright")',
                                [legaId, posizione.posizione, posizione.squadra, posizione.punti, posizione.partite],
                                function(err) {
                                    if (err) {
                                        console.error('❌ Errore inserimento posizione:', err);
                                        reject(err);
                                        return;
                                    }
                                    
                                    insertedCount++;
                                    
                                    if (insertedCount === totalCount) {
                                        console.log(`✅ Classifica scraping salvata: ${insertedCount} posizioni`);
                                        resolve({ 
                                            success: true, 
                                            posizioni_salvate: insertedCount, 
                                            tipo: 'classifica_scraping' 
                                        });
                                    }
                                }
                            );
                        });
                    }
                );
            } catch (error) {
                console.error('❌ Errore saveClassificaToDatabase:', error);
                reject(error);
            }
        });
    }

    // Metodo per salvare le formazioni nel database
    async saveFormazioniToDatabase(legaId, formazioniData) {
        return new Promise(async (resolve, reject) => {
            const { getDb } = await import('../db/config.js');
            const db = getDb();
            
            try {
                console.log(`💾 Salvataggio formazioni di scraping nel database per lega ${legaId}...`);
                
                // Prima elimina i dati precedenti
                db.run(
                    'DELETE FROM formazioni_scraping WHERE lega_id = ?',
                    [legaId],
                    function(err) {
                        if (err) {
                            console.error('❌ Errore eliminazione formazioni precedenti:', err);
                            reject(err);
                            return;
                        }
                        
                        console.log(`🗑️ Eliminati ${this.changes} record di formazioni precedenti per lega ${legaId}`);
                        
                        // Poi inserisci i nuovi dati
                        let insertedCount = 0;
                        const totalCount = formazioniData.length;
                        
                        if (totalCount === 0) {
                            console.log('⚠️ Nessun dato di formazioni da salvare');
                            resolve({ success: true, formazioni_salvate: 0, tipo: 'formazioni_scraping' });
                            return;
                        }
                        
                        formazioniData.forEach((formazione, index) => {
                            const titolari = formazione.titolari ? formazione.titolari.join(', ') : '';
                            const panchinari = formazione.panchinari ? formazione.panchinari.join(', ') : '';
                            
                            db.run(
                                'INSERT INTO formazioni_scraping (lega_id, squadra, modulo, titolari, panchinari, giornata, data_scraping, fonte_scraping) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), "playwright")',
                                [legaId, formazione.squadra, formazione.modulo, titolari, panchinari, formazione.giornata || 1],
                                function(err) {
                                    if (err) {
                                        console.error('❌ Errore inserimento formazione:', err);
                                        reject(err);
                                        return;
                                    }
                                    
                                    insertedCount++;
                                    
                                    if (insertedCount === totalCount) {
                                        console.log(`✅ Formazioni scraping salvate: ${insertedCount} formazioni`);
                                        resolve({ 
                                            success: true, 
                                            formazioni_salvate: insertedCount, 
                                            tipo: 'formazioni_scraping' 
                                        });
                                    }
                                }
                            );
                        });
                    }
                );
            } catch (error) {
                console.error('❌ Errore saveFormazioniToDatabase:', error);
                reject(error);
            }
        });
    }

    // Metodo per eliminare tutti i dati di scraping precedenti
    async clearAllScrapingData(legaId) {
        try {
            console.log(`🗑️ Eliminazione di tutti i dati di scraping precedenti per lega ${legaId}...`);
            
            await this.clearRoseScraping(legaId);
            
            // Elimina anche classifica e formazioni
            const { getDb } = await import('../db/config.js');
            const db = getDb();
            
            return new Promise((resolve, reject) => {
                db.run('DELETE FROM classifica_scraping WHERE lega_id = ?', [legaId], function(err) {
                    if (err) {
                        console.error('❌ Errore eliminazione classifica:', err);
                        reject(err);
                        return;
                    }
                    
                    db.run('DELETE FROM formazioni_scraping WHERE lega_id = ?', [legaId], function(err) {
                        if (err) {
                            console.error('❌ Errore eliminazione formazioni:', err);
                            reject(err);
                            return;
                        }
                        
                        console.log(`🗑️ Eliminazione di tutti i dati di scraping precedenti per lega ${legaId} completata`);
                        resolve();
                    });
                });
            });
        } catch (error) {
            console.error('❌ Errore eliminazione dati scraping:', error);
            throw error;
        }
    }

    // Rileva automaticamente il tipo di lega dall'URL
    detectLeagueType(leagueUrl) {
        // Salva l'URL della lega
        this.leagueUrl = leagueUrl;
        
        if (leagueUrl.includes('euroleghe.fantacalcio.it')) {
            this.tipoLega = 'euroleghe';
            console.log('Rilevata lega EuroLeghe');
        } else if (leagueUrl.includes('leghe.fantacalcio.it')) {
            this.tipoLega = 'serie_a';
            console.log('Rilevata lega Serie A');
        } else {
            throw new Error('URL non riconosciuto. Deve essere leghe.fantacalcio.it o euroleghe.fantacalcio.it');
        }
        return this.tipoLega;
    }

    // Metodo di debug per analizzare la struttura della pagina
    async debugPageStructure(url) {
        try {
            console.log(`🔍 DEBUG: Analisi struttura pagina ${url}`);
            
            await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await this.acceptAllPrivacyPopups();
            await this.page.waitForTimeout(3000);
            
            const pageStructure = await this.page.evaluate(() => {
                const structure = {
                    url: window.location.href,
                    title: document.title,
                    links: [],
                    buttons: [],
                    tables: [],
                    lists: [],
                    headings: [],
                    divs: []
                };
                
                // Analizza tutti i link
                document.querySelectorAll('a').forEach((link, index) => {
                    if (index < 50) { // Limita a 50 link
                        structure.links.push({
                            text: link.textContent?.trim(),
                            href: link.href,
                            className: link.className,
                            id: link.id
                        });
                    }
                });
                
                // Analizza tutti i bottoni
                document.querySelectorAll('button, input[type="button"], input[type="submit"]').forEach((btn, index) => {
                    if (index < 20) { // Limita a 20 bottoni
                        structure.buttons.push({
                            text: btn.textContent?.trim() || btn.value,
                            className: btn.className,
                            id: btn.id
                        });
                    }
                });
                
                // Analizza tabelle
                document.querySelectorAll('table').forEach((table, index) => {
                    const tableInfo = {
                        index,
                        className: table.className,
                        id: table.id,
                        rows: table.querySelectorAll('tr').length,
                        headers: []
                    };
                    
                    table.querySelectorAll('th').forEach(th => {
                        tableInfo.headers.push(th.textContent?.trim());
                    });
                    
                    structure.tables.push(tableInfo);
                });
                
                // Analizza liste
                document.querySelectorAll('ul, ol').forEach((list, index) => {
                    const listInfo = {
                        index,
                        className: list.className,
                        id: list.id,
                        items: list.querySelectorAll('li').length
                    };
                    structure.lists.push(listInfo);
                });
                
                // Analizza headings
                document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading, index) => {
                    if (index < 20) { // Limita a 20 headings
                        structure.headings.push({
                            tag: heading.tagName.toLowerCase(),
                            text: heading.textContent?.trim(),
                            className: heading.className,
                            id: heading.id
                        });
                    }
                });
                
                // Analizza div principali
                document.querySelectorAll('div').forEach((div, index) => {
                    if (index < 30) { // Limita a 30 div
                        const text = div.textContent?.trim();
                        if (text && text.length > 2 && text.length < 200) {
                            structure.divs.push({
                                text: text,
                                className: div.className,
                                id: div.id
                            });
                        }
                    }
                });
                
                return structure;
            });
            
            console.log('📊 STRUTTURA PAGINA ANALIZZATA:');
            console.log(JSON.stringify(pageStructure, null, 2));
            
            return pageStructure;
            
        } catch (error) {
            console.error('❌ Errore debug struttura pagina:', error);
            throw error;
        }
    }

    // Ottiene la lista dei tornei disponibili
    async getAvailableTournaments() {
        try {
            console.log('🔍 Recupero tornei disponibili...');
            console.log('🔍 leagueUrl corrente:', this.leagueUrl);
            console.log('🔍 tipoLega corrente:', this.tipoLega);
            
            if (!this.leagueUrl) {
                console.error('❌ leagueUrl non impostata!');
                throw new Error('leagueUrl non impostata');
            }
            
            // Per Euroleghe Mantra, cerca i tornei direttamente nella pagina principale
            if (this.tipoLega === 'euroleghe') {
                console.log('🏆 Euroleghe Mantra rilevata, cerco tornei nella pagina principale...');
                
                // Vai alla pagina principale della lega
                await this.page.goto(this.leagueUrl, {
                    waitUntil: 'networkidle',
                    timeout: 30000
                });
                
                await this.acceptAllPrivacyPopups();
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const tournaments = await this.page.evaluate(() => {
                    const tournaments = [];
                    
                    console.log('🔍 Analisi pagina principale Euroleghe per tornei...');
                    
                    // Cerca dropdown o menu delle competizioni nella pagina principale
                    const selectors = [
                        '.competition-list',
                        '.tournament-select',
                        '.league-select',
                        'select[name*="competition"]',
                        'select[name*="tournament"]',
                        'select[name*="league"]',
                        '.dropdown-menu',
                        '.competition-dropdown',
                        '[data-toggle="dropdown"]'
                    ];
                    
                    let competitionElement = null;
                    for (const selector of selectors) {
                        competitionElement = document.querySelector(selector);
                        if (competitionElement) {
                            console.log(`✅ Trovato elemento competizioni con selector: ${selector}`);
                            break;
                        }
                    }
                    
                    if (!competitionElement) {
                        console.log('❌ Nessun dropdown competizioni trovato nella pagina principale');
                        
                        // Prova a cercare link che potrebbero essere tornei
                        const allLinks = document.querySelectorAll('a');
                        allLinks.forEach(link => {
                            const href = link.href;
                            const text = link.textContent?.trim();
                            
                            if (href && text && text.length > 2 && text.length < 50) {
                                // Se il link sembra essere un torneo
                                if (href.includes('id=') || href.includes('tournament') || href.includes('competition')) {
                                    console.log(`🔍 Link potenziale torneo: ${text} -> ${href}`);
                                    // Estrai ID dal link se possibile
                                    const urlParams = new URLSearchParams(href.split('?')[1] || '');
                                    const id = urlParams.get('id') || 'unknown';
                                    
                                    tournaments.push({
                                        id: id,
                                        name: text,
                                        url: href
                                    });
                                }
                            }
                        });
                        
                        return tournaments;
                    }
                    
                    // Analizza il dropdown trovato
                    const dropdownItems = competitionElement.querySelectorAll('option, .dropdown-item, li');
                    console.log(`📋 Trovati ${dropdownItems.length} elementi nel dropdown`);
                    
                    dropdownItems.forEach((item, index) => {
                        const value = item.value || item.getAttribute('data-id');
                        const text = item.textContent?.trim();
                        const href = item.href || item.getAttribute('href');
                        
                        console.log(`🔍 Elemento ${index}: Value=${value}, Text="${text}", Href="${href}"`);
                        
                        // Filtra elementi che non sono competizioni reali
                        if (!text || text.length < 2) {
                            console.log(`⚠️ Elemento ${index}: testo mancante, saltato`);
                            return;
                        }
                        
                        // Escludi elementi di amministrazione e creazione
                        const isAdminElement = text.toLowerCase().includes('impostazioni') ||
                                             text.toLowerCase().includes('crea') ||
                                             text.toLowerCase().includes('riordina') ||
                                             text.toLowerCase().includes('seleziona');
                        
                        if (isAdminElement) {
                            console.log(`⚠️ Elemento ${index}: elemento amministrativo, saltato`);
                            return;
                        }
                        
                        // Usa value come ID se disponibile, altrimenti genera un ID
                        const tournamentId = value || `tournament_${index}`;
                        
                        console.log(`✅ Torneo valido trovato: ${text} (ID: ${tournamentId})`);
                        tournaments.push({
                            id: tournamentId,
                            name: text,
                            url: href || '#'
                        });
                    });
                    
                    console.log(`✅ Totale tornei trovati: ${tournaments.length}`);
                    return tournaments;
                });
                
                console.log(`✅ Tornei estratti da Euroleghe: ${tournaments.length} trovati`);
                tournaments.forEach(t => {
                    console.log(`  - ${t.name} (ID: ${t.id})`);
                });
                
                return tournaments;
            }
            
            // Per Serie A Classic, usa il metodo originale
            console.log('🏆 Serie A Classic rilevata, uso metodo originale...');
            
            // Costruisci l'URL delle competizioni
            const competitionsUrl = this.leagueUrl.replace(/\/[^\/]*$/, '/lista-competizioni');
            console.log(`📍 Navigazione a: ${competitionsUrl}`);
            
            await this.page.goto(competitionsUrl, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            
            await this.acceptAllPrivacyPopups();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const tournaments = await this.page.evaluate(() => {
                const tournaments = [];
                
                console.log('🔍 Analisi dropdown competizioni...');
                
                // Cerca il dropdown delle competizioni
                const competitionDropdown = document.querySelector('.competition-list');
                if (!competitionDropdown) {
                    console.log('❌ Dropdown competizioni non trovato');
                    return tournaments;
                }
                
                console.log('✅ Dropdown competizioni trovato');
                
                // Analizza tutti gli elementi del dropdown
                const dropdownItems = competitionDropdown.querySelectorAll('.dropdown-item');
                console.log(`📋 Trovati ${dropdownItems.length} elementi nel dropdown`);
                
                dropdownItems.forEach((item, index) => {
                    const link = item.querySelector('a');
                    if (!link) {
                        console.log(`⚠️ Elemento ${index}: link non trovato`);
                        return;
                    }
                    
                    const tournamentId = link.getAttribute('data-id');
                    const tournamentName = link.textContent?.trim();
                    const href = link.getAttribute('href');
                    
                    console.log(`🔍 Elemento ${index}: ID=${tournamentId}, Nome="${tournamentName}", Href="${href}"`);
                    
                    // Filtra elementi che non sono competizioni reali
                    if (!tournamentId || !tournamentName) {
                        console.log(`⚠️ Elemento ${index}: dati mancanti, saltato`);
                        return;
                    }
                    
                    // Escludi elementi di amministrazione e creazione
                    const isAdminElement = link.classList.contains('no-competition') || 
                                         tournamentName.toLowerCase().includes('impostazioni') ||
                                         tournamentName.toLowerCase().includes('crea') ||
                                         tournamentName.toLowerCase().includes('riordina');
                    
                    if (isAdminElement) {
                        console.log(`⚠️ Elemento ${index}: elemento amministrativo, saltato`);
                        return;
                    }
                    
                    // Verifica che sia un ID numerico valido
                    const numericId = parseInt(tournamentId);
                    if (isNaN(numericId)) {
                        console.log(`⚠️ Elemento ${index}: ID non numerico (${tournamentId}), saltato`);
                        return;
                    }
                    
                    console.log(`✅ Torneo valido trovato: ${tournamentName} (ID: ${tournamentId})`);
                    tournaments.push({
                        id: tournamentId,
                        name: tournamentName,
                        url: href || '#'
                    });
                });
                
                console.log(`✅ Totale tornei trovati: ${tournaments.length}`);
                return tournaments;
            });
            
            console.log(`✅ Tornei estratti da Serie A: ${tournaments.length} trovati`);
            tournaments.forEach(t => {
                console.log(`  - ${t.name} (ID: ${t.id})`);
            });
            
            return tournaments;
            
        } catch (error) {
            console.error('❌ Errore recupero tornei:', error);
            throw error;
        }
    }

    // Seleziona un torneo specifico e aggiorna gli URL di scraping
    async selectTournament(tournamentId) {
        try {
            console.log(`Selezione torneo con ID: ${tournamentId}`);
            
            // Aggiorna gli URL di scraping con l'ID del torneo
            if (this.scrapingUrls) {
                const baseUrl = this.leagueUrl.replace(/\/$/, '');
                this.scrapingUrls.rose = `${baseUrl}/rose?id=${tournamentId}`;
                this.scrapingUrls.classifica = `${baseUrl}/classifica?id=${tournamentId}`;
                this.scrapingUrls.formazioni = `${baseUrl}/formazioni?id=${tournamentId}`;
                
                console.log('URL aggiornati con ID torneo:', this.scrapingUrls);
            }
            
            this.torneoSelezionato = tournamentId;
            console.log(`Torneo selezionato: ID ${tournamentId}`);
            return true;
            
        } catch (error) {
            console.error('Errore selezione torneo:', error);
            return false;
        }
    }

    // Imposta il tipo di lega dal database (più affidabile del rilevamento automatico)
    setLeagueType(tipoLega, leagueUrl) {
        console.log('🔧 setLeagueType chiamato con:', { tipoLega, leagueUrl });
        
        // Salva l'URL della lega
        this.leagueUrl = leagueUrl;
        console.log('🔧 leagueUrl impostata a:', this.leagueUrl);
        
        // Valida e imposta il tipo di lega
        if (tipoLega === 'euroleghe' || tipoLega === 'serie_a') {
            this.tipoLega = tipoLega;
            console.log(`✅ Tipo lega impostato dal database: ${tipoLega}`);
        } else {
            // Fallback al rilevamento automatico se il tipo non è valido
            console.log(`⚠️ Tipo lega non valido dal database: ${tipoLega}, uso rilevamento automatico`);
            this.detectLeagueType(leagueUrl);
        }
        
        console.log('🔧 Stato finale - leagueUrl:', this.leagueUrl, 'tipoLega:', this.tipoLega);
        return this.tipoLega;
    }
}

export default PlaywrightScraper;