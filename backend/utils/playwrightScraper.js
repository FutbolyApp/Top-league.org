import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db/postgres.js';

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
        // Completamente disabilitato
        return;
    }

    async acceptAllPrivacyPopups() {
        try {
            console.log('🍪 Gestione popup privacy/cookie...');
            
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
                waitUntil: 'networkidle',
                timeout: 30000
            });
            
            await this.takeScreenshot('login_page');
            
            // Gestisci popup privacy/cookie
            await this.acceptAllPrivacyPopups();
            
            // Aspetta un po' per assicurarsi che la pagina sia completamente caricata
            await this.page.waitForTimeout(2000);

            console.log('📝 Inserimento credenziali...');
            
            // Cerca i campi username e password con selettori più ampi
            const usernameSelectors = [
                'input[name="username"]',
                'input[name="email"]', 
                'input[type="email"]',
                'input[placeholder*="Username"]',
                'input[placeholder*="Email"]',
                'input[id*="username"]',
                'input[id*="email"]',
                'input[type="text"]',
                'input:not([type="password"]):not([type="submit"]):not([type="button"])'
            ];
            
            const passwordSelectors = [
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="Password"]',
                'input[id*="password"]'
            ];
            
            let usernameField = null;
            let passwordField = null;
            
            // Prova tutti i selettori per username
            for (const selector of usernameSelectors) {
                try {
                    usernameField = await this.page.$(selector);
                    if (usernameField) {
                        console.log(`✅ Campo username trovato con selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continua con il prossimo selector
                }
            }
            
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
                
                // Prova a fare uno screenshot per debug
                await this.takeScreenshot('login_debug_no_username');
                return false;
            }

            // Prova tutti i selettori per password
            for (const selector of passwordSelectors) {
                try {
                    passwordField = await this.page.$(selector);
                    if (passwordField) {
                        console.log(`✅ Campo password trovato con selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continua con il prossimo selector
                }
            }
            
            if (!passwordField) {
                console.log('❌ Campo password non trovato');
                await this.takeScreenshot('login_debug_no_password');
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
            const loginButtonSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("accedi")',
                'button:has-text("login")',
                'button:has-text("entra")',
                'button:has-text("Accedi")',
                'button:has-text("Login")',
                'button:has-text("Entra")',
                '.btn-primary',
                '.btn-login',
                'button'
            ];
            
            let loginButton = null;
            for (const selector of loginButtonSelectors) {
                try {
                    loginButton = await this.page.$(selector);
                    if (loginButton) {
                        const buttonText = await this.page.evaluate(el => el.textContent || el.value || '', loginButton);
                        console.log(`✅ Bottone login trovato con selector: ${selector}, testo: "${buttonText}"`);
                        break;
                    }
                } catch (e) {
                    // Continua con il prossimo selector
                }
            }
            
            if (loginButton) {
                await loginButton.click();
            } else {
                // Fallback: premi Enter
                console.log('⚠️ Bottone login non trovato, uso Enter');
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
                
                // Debug: controlla se ci sono messaggi di errore
                try {
                    const errorMessages = await this.page.evaluate(() => {
                        const errors = [];
                        // Cerca messaggi di errore comuni
                        const errorSelectors = [
                            '.alert-danger',
                            '.error-message',
                            '.login-error',
                            '.alert',
                            '[class*="error"]',
                            '[class*="alert"]'
                        ];
                        
                        errorSelectors.forEach(selector => {
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(el => {
                                const text = el.textContent?.trim();
                                if (text && text.length > 0) {
                                    errors.push(text);
                                }
                            });
                        });
                        
                        return errors;
                    });
                    
                    if (errorMessages.length > 0) {
                        console.log('❌ Messaggi di errore trovati:');
                        errorMessages.forEach(msg => console.log(`  - ${msg}`));
                    } else {
                        console.log('ℹ️ Nessun messaggio di errore trovato');
                    }
                } catch (e) {
                    console.log('⚠️ Errore nel controllo messaggi di errore:', e.message);
                }
                
                // Prova a fare uno screenshot per debug
                await this.takeScreenshot('login_failed_debug');
                
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
                timeout: 15000
            });
            
            await this.acceptAllPrivacyPopups();
            await this.page.waitForTimeout(3000);
            
            const classificaData = await this.page.evaluate(() => {
                const posizioni = [];
                
                console.log('Analisi pagina classifica...');
                
                // Funzione per pulire i dati dal codice ASP.NET
                function pulisciDatiASPNet(dato) {
                    if (dato) return dato.split('\n')[0].trim();
                    return dato;
                }
                
                // Funzione per estrarre numero da stringa
                function extractNumber(text) {
                    if (!text) return 0;
                    const match = text.toString().match(/\d+/);
                    return match ? parseInt(match[0]) : 0;
                }
                
                // Funzione per estrarre nome squadra da cella combinata
                function extractTeamName(cellText) {
                    if (!cellText) return '';
                    // Rimuovi numeri e caratteri speciali, mantieni solo il nome
                    return cellText.replace(/\d+/g, '').replace(/[^\w\s]/g, '').trim();
                }
                
                // Metodo 1: Analisi specifica per la struttura Fantacalcio
                console.log('🔍 Metodo 1: Analisi specifica struttura Fantacalcio...');
                const allTables = document.querySelectorAll('table');
                console.log(`Trovate ${allTables.length} tabelle nella pagina`);
                
                for (let i = 0; i < allTables.length; i++) {
                    const table = allTables[i];
                    const rows = table.querySelectorAll('tr');
                    
                    if (rows.length < 3) continue; // Salta tabelle troppo piccole
                    
                    console.log(`Analizzando tabella ${i} con ${rows.length} righe...`);
                    
                    // Controlla se la prima riga contiene header di classifica
                    const firstRow = rows[0];
                    const firstRowCells = firstRow.querySelectorAll('td, th');
                    const firstRowText = Array.from(firstRowCells).map(cell => cell.textContent?.trim().toLowerCase()).join(' ');
                    
                    console.log(`Header tabella ${i}: "${firstRowText}"`);
                    
                    // Verifica se sembra una tabella di classifica
                    if (firstRowText.includes('g') && firstRowText.includes('v') && firstRowText.includes('n') && 
                        firstRowText.includes('p') && firstRowText.includes('g+') && firstRowText.includes('g-') && 
                        firstRowText.includes('dr') && firstRowText.includes('pt')) {
                        
                        console.log(`✅ Tabella ${i} sembra essere una classifica Fantacalcio`);
                        
                        // Analizza le righe dati (dalla seconda in poi)
                        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
                            const row = rows[rowIndex];
                            const cells = row.querySelectorAll('td');
                            
                            if (cells.length < 10) continue; // Salta righe con troppe poche celle
                            
                            const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');
                            console.log(`Riga ${rowIndex} celle: [${cellTexts.join(' | ')}]`);
                            
                            // Estrai posizione dalla prima cella
                            const posizioneText = cellTexts[0];
                            if (!posizioneText || isNaN(parseInt(posizioneText))) continue;
                            
                            const posizione = parseInt(posizioneText);
                            
                            // Estrai nome squadra dalla terza cella (che contiene "Bolzano 0" o "Viterbo 0")
                            const squadraCompleta = cellTexts[2] || '';
                            const squadra = extractTeamName(squadraCompleta);
                            
                            if (!squadra) continue;
                            
                            // Estrai i dati numerici dalle altre celle
                            const rowData = {
                                posizione: posizione,
                                squadra: pulisciDatiASPNet(squadra),
                                punti: 0,
                                partite: 0,
                                vittorie: 0,
                                pareggi: 0,
                                sconfitte: 0,
                                golFatti: 0,
                                golSubiti: 0,
                                differenzaReti: 0,
                                puntiTotali: 0
                            };
                            
                            // Mappa le colonne in base alla struttura vista
                            // [pos |  | squadra | g | v | n | p | g+ | g- | dr | pt | pt totali |  | ]
                            if (cellTexts.length >= 12) {
                                rowData.partite = parseInt(cellTexts[3]) || 0;      // g
                                rowData.vittorie = parseInt(cellTexts[4]) || 0;     // v
                                rowData.pareggi = parseInt(cellTexts[5]) || 0;      // n
                                rowData.sconfitte = parseInt(cellTexts[6]) || 0;    // p
                                rowData.golFatti = parseInt(cellTexts[7]) || 0;     // g+
                                rowData.golSubiti = parseInt(cellTexts[8]) || 0;    // g-
                                rowData.differenzaReti = parseInt(cellTexts[9]) || 0; // dr
                                rowData.punti = parseInt(cellTexts[10]) || 0;       // pt
                                rowData.puntiTotali = parseFloat(cellTexts[11]) || 0; // pt totali
                            }
                            
                            console.log(`✅ Posizione ${rowData.posizione}: ${rowData.squadra} - ${rowData.punti} punti (${rowData.partite} partite)`);
                            posizioni.push(rowData);
                        }
                        
                        // Se abbiamo trovato dati in questa tabella, usiamoli
                        if (posizioni.length > 0) {
                            console.log(`✅ Metodo 1: Trovate ${posizioni.length} posizioni nella tabella ${i}`);
                            break;
                        }
                    }
                }
                
                // Metodo 2: Cerca tabelle con posizioni numerate progressive (fallback)
                if (posizioni.length === 0) {
                    console.log('🔍 Metodo 2: Cerca tabelle con posizioni numerate progressive...');
                    
                    for (let i = 0; i < allTables.length; i++) {
                        const table = allTables[i];
                        const rows = table.querySelectorAll('tr');
                        
                        if (rows.length < 3) continue; // Salta tabelle troppo piccole
                        
                        console.log(`Analizzando tabella ${i} con ${rows.length} righe...`);
                        
                        // Conta quante righe hanno un numero progressivo nella prima colonna
                        let posizioniNumerate = 0;
                        let righeValide = [];
                        
                        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                            const row = rows[rowIndex];
                            const cells = row.querySelectorAll('td');
                            
                            if (cells.length >= 2) {
                                const firstCellText = cells[0]?.textContent?.trim();
                                const secondCellText = cells[1]?.textContent?.trim();
                                
                                // Se la prima cella è un numero e la seconda è testo (nome squadra)
                                if (firstCellText && !isNaN(parseInt(firstCellText)) && 
                                    secondCellText && secondCellText.length > 2 && isNaN(parseInt(secondCellText))) {
                                    posizioniNumerate++;
                                    righeValide.push({
                                        rowIndex,
                                        posizione: parseInt(firstCellText),
                                        squadra: secondCellText,
                                        cells: cells
                                    });
                                }
                            }
                        }
                        
                        console.log(`Tabella ${i}: ${posizioniNumerate} righe con posizioni numerate`);
                        
                        // Se abbiamo almeno 3 posizioni numerate, probabilmente è una classifica
                        if (posizioniNumerate >= 3) {
                            console.log(`✅ Tabella ${i} sembra essere una classifica con ${posizioniNumerate} posizioni`);
                            
                            // Estrai i dati da ogni riga valida
                            righeValide.forEach((riga, index) => {
                                const rowData = {
                                    posizione: riga.posizione,
                                    squadra: pulisciDatiASPNet(riga.squadra),
                                    punti: 0,
                                    partite: 0,
                                    vittorie: 0,
                                    pareggi: 0,
                                    sconfitte: 0,
                                    golFatti: 0,
                                    golSubiti: 0,
                                    differenzaReti: 0,
                                    puntiTotali: 0
                                };
                                
                                // Analizza le altre celle per estrarre dati numerici
                                riga.cells.forEach((cell, cellIndex) => {
                                    if (cellIndex < 2) return; // Salta posizione e squadra
                                    
                                    const cellText = cell.textContent?.trim();
                                    if (!cellText) return;
                                    
                                    // Se è un numero, prova a mapparlo
                                    if (!isNaN(parseFloat(cellText))) {
                                        const numValue = parseFloat(cellText);
                                        
                                        // Basandosi sulla posizione della cella, assegna il valore
                                        switch (cellIndex) {
                                            case 2: // Terza colonna: spesso punti
                                                rowData.punti = numValue;
                                                break;
                                            case 3: // Quarta colonna: spesso partite
                                                rowData.partite = numValue;
                                                break;
                                            case 4: // Quinta colonna: spesso vittorie
                                                rowData.vittorie = numValue;
                                                break;
                                            case 5: // Sesta colonna: spesso pareggi
                                                rowData.pareggi = numValue;
                                                break;
                                            case 6: // Settima colonna: spesso sconfitte
                                                rowData.sconfitte = numValue;
                                                break;
                                            case 7: // Ottava colonna: spesso gol fatti
                                                rowData.golFatti = numValue;
                                                break;
                                            case 8: // Nona colonna: spesso gol subiti
                                                rowData.golSubiti = numValue;
                                                break;
                                            case 9: // Decima colonna: spesso differenza
                                                rowData.differenzaReti = numValue;
                                                break;
                                            default:
                                                // Salva come campo generico
                                                rowData[`colonna_${cellIndex}`] = cellText;
                                        }
                                    }
                                });
                                
                                console.log(`✅ Posizione ${rowData.posizione}: ${rowData.squadra} - ${rowData.punti} punti`);
                                posizioni.push(rowData);
                            });
                            
                            // Se abbiamo trovato dati in questa tabella, usiamoli
                            if (posizioni.length > 0) {
                                console.log(`✅ Metodo 2: Trovate ${posizioni.length} posizioni nella tabella ${i}`);
                                break;
                            }
                        }
                    }
                }
                
                // Metodo 3: Analisi completa della tabella classifica (fallback finale)
                if (posizioni.length === 0) {
                    console.log('🔍 Metodo 3: Analisi completa tabella classifica...');
                    
                    for (let i = 0; i < allTables.length; i++) {
                        const table = allTables[i];
                        const tableText = table.textContent?.toLowerCase() || '';
                        
                        // Cerca tabelle che potrebbero contenere una classifica
                        if (tableText.includes('posizione') || tableText.includes('punti') || 
                            tableText.includes('partite') || tableText.includes('vittorie') ||
                            tableText.includes('pareggi') || tableText.includes('sconfitte') ||
                            tableText.includes('gol fatti') || tableText.includes('gol subiti') ||
                            tableText.includes('diff') || tableText.includes('differenza')) {
                            
                            console.log(`Analizzando tabella ${i} per classifica...`);
                            const rows = table.querySelectorAll('tr');
                            console.log(`Tabella ${i} ha ${rows.length} righe`);
                            
                            // Analizza l'header per capire le colonne
                            let headers = [];
                            if (rows.length > 0) {
                                const headerRow = rows[0];
                                const headerCells = headerRow.querySelectorAll('th, td');
                                headers = Array.from(headerCells).map(cell => 
                                    cell.textContent?.trim().toLowerCase() || ''
                                );
                                console.log(`Header tabella ${i}:`, headers);
                            }
                            
                            // Analizza ogni riga dati
                            for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
                                const row = rows[rowIndex];
                                const cells = row.querySelectorAll('td');
                                
                                // Salta righe con troppe poche celle
                                if (cells.length < 2) continue;
                                
                                // Estrai tutti i dati dalle celle
                                const rowData = {};
                                
                                cells.forEach((cell, cellIndex) => {
                                    const cellText = cell.textContent?.trim() || '';
                                    const header = headers[cellIndex] || `colonna_${cellIndex}`;
                                    
                                    // Mappa i dati in base alla posizione e al contenuto
                                    if (cellIndex === 0 && !isNaN(parseInt(cellText))) {
                                        rowData.posizione = parseInt(cellText);
                                    } else if (cellText && cellText.length > 2 && !isNaN(parseInt(cellText))) {
                                        // Potrebbe essere punti, partite, vittorie, etc.
                                        if (header.includes('punti totali') || header.includes('pt totali') || header.includes('pttotali') || header.includes('pt') && cellText.includes('.')) {
                                            rowData.puntiTotali = parseFloat(cellText.replace(',', '.'));
                                        } else if (header.includes('punti') || header.includes('points')) {
                                            rowData.punti = parseInt(cellText);
                                        } else if (header.includes('partite') || header.includes('giocate') || header.includes('played')) {
                                            rowData.partite = parseInt(cellText);
                                        } else if (header.includes('vittorie') || header.includes('win')) {
                                            rowData.vittorie = parseInt(cellText);
                                        } else if (header.includes('pareggi') || header.includes('draw')) {
                                            rowData.pareggi = parseInt(cellText);
                                        } else if (header.includes('sconfitte') || header.includes('loss')) {
                                            rowData.sconfitte = parseInt(cellText);
                                        } else if (header.includes('gol fatti') || header.includes('gf') || header.includes('for')) {
                                            rowData.golFatti = parseInt(cellText);
                                        } else if (header.includes('gol subiti') || header.includes('gs') || header.includes('against')) {
                                            rowData.golSubiti = parseInt(cellText);
                                        } else if (header.includes('diff') || header.includes('differenza')) {
                                            rowData.differenzaReti = parseInt(cellText);
                                        } else {
                                            // Salva come campo generico
                                            rowData[`campo_${cellIndex}`] = cellText;
                                        }
                                    } else if (cellText && cellText.length > 2) {
                                        // Potrebbe essere il nome della squadra
                                        if (!rowData.squadra && !isNaN(parseInt(cellText))) {
                                            // Non è una squadra se è un numero
                                        } else if (!rowData.squadra) {
                                            rowData.squadra = pulisciDatiASPNet(cellText);
                                        } else {
                                            // Salva come campo generico
                                            rowData[`campo_${cellIndex}`] = cellText;
                                        }
                                    }
                                });
                                
                                // Verifica che sia una posizione valida
                                if (rowData.posizione && rowData.squadra && !isNaN(rowData.posizione)) {
                                    console.log(`✅ Tabella ${i}, Riga ${rowIndex}:`, rowData);
                                    
                                    posizioni.push({
                                        posizione: rowData.posizione,
                                        squadra: rowData.squadra,
                                        punti: rowData.punti || 0,
                                        partite: rowData.partite || 0,
                                        vittorie: rowData.vittorie || 0,
                                        pareggi: rowData.pareggi || 0,
                                        sconfitte: rowData.sconfitte || 0,
                                        golFatti: rowData.golFatti || 0,
                                        golSubiti: rowData.golSubiti || 0,
                                        differenzaReti: rowData.differenzaReti || 0,
                                        puntiTotali: rowData.puntiTotali || 0,
                                        // Aggiungi tutti gli altri campi trovati
                                        ...Object.fromEntries(
                                            Object.entries(rowData)
                                                .filter(([key]) => key.startsWith('campo_'))
                                                .map(([key, value]) => [key.replace('campo_', 'colonna_'), value])
                                        )
                                    });
                                }
                            }
                            
                            // Se abbiamo trovato dati in questa tabella, usiamoli
                            if (posizioni.length > 0) {
                                console.log(`✅ Metodo 3: Trovate ${posizioni.length} posizioni nella tabella ${i}`);
                                break;
                            }
                        }
                    }
                }
                
                console.log(`Classifica estratta: ${posizioni.length} posizioni trovate`);
                
                // Debug: mostra le prime 3 posizioni estratte con tutti i campi
                posizioni.slice(0, 3).forEach((pos, index) => {
                    console.log(`Debug posizione ${index + 1}:`, pos);
                });
                
                return posizioni;
            });
            
            console.log(`Classifica estratta: ${classificaData.length} posizioni trovate`);
            
            // Debug: log dettagliato dei risultati
            classificaData.slice(0, 3).forEach((posizione, index) => {
                console.log(`${posizione.posizione}. ${posizione.squadra} - ${posizione.punti} punti (${posizione.partite} partite)`);
                if (posizione.vittorie !== undefined) {
                    console.log(`  Vittorie: ${posizione.vittorie}, Pareggi: ${posizione.pareggi}, Sconfitte: ${posizione.sconfitte}`);
                }
                if (posizione.golFatti !== undefined) {
                    console.log(`  Gol: ${posizione.golFatti} fatti, ${posizione.golSubiti} subiti, Diff: ${posizione.differenzaReti}`);
                }
            });
            
            return classificaData;
            
        } catch (error) {
            console.error('Errore scraping classifica:', error);
            throw error;
        }
    }

    async scrapeFormazioni(formazioniUrl, giornata = null) {
        try {
            console.log(`⚽ Scraping formazioni da: ${formazioniUrl}`);
            
            // Se l'URL già contiene la giornata, usalo così com'è
            // Altrimenti aggiungi la giornata se specificata
            const urlCompleto = formazioniUrl.includes('/formazioni/') 
                ? formazioniUrl 
                : (giornata ? `${formazioniUrl}/${giornata}` : formazioniUrl);
            
            console.log(`🌐 URL completo per scraping: ${urlCompleto}`);
            
            await this.page.goto(urlCompleto, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await this.acceptAllPrivacyPopups();
            await this.page.waitForTimeout(3000);
            
            await this.takeScreenshot('formazioni_page');
            
            const formazioniData = await this.page.evaluate((giornata) => {
                // Mapping delle icone bonus in testo di 3 lettere
                const bonusMapping = {
                    'portiereImbattuto.png': 'PIB',
                    'portiereVittoria.png': 'PVT',
                    'portiereParata.png': 'PPA',
                    'portiereRigore.png': 'PRI',
                    'portiereAutogol.png': 'PAU',
                    'difensoreGol.png': 'DGO',
                    'difensoreAssist.png': 'DAS',
                    'difensoreVittoria.png': 'DVT',
                    'difensoreParata.png': 'DPA',
                    'centrocampistaGol.png': 'CGO',
                    'centrocampistaAssist.png': 'CAS',
                    'centrocampistaVittoria.png': 'CVT',
                    'attaccanteGol.png': 'AGO',
                    'attaccanteAssist.png': 'AAS',
                    'attaccanteVittoria.png': 'AVT',
                    'rigoreSegnato.png': 'RSE',
                    'rigoreSbagliato.png': 'RSB',
                    'autogol.png': 'AUT',
                    'ammonizione.png': 'AMM',
                    'espulsione.png': 'ESP'
                };

                const formazioni = [];
                
                console.log('🔍 Analisi pagina formazioni...');
                console.log('🔍 DEBUG - CODICE AGGIORNATO IN ESECUZIONE - VERSIONE 2.0');
                
                // Trova il container principale delle formazioni
                const formazioniContainer = document.querySelector('.tab-content.transfers-tab-content.no-border.loading-box');
                
                if (!formazioniContainer) {
                    console.log('❌ Container formazioni non trovato');
                    return formazioni;
                }
                
                console.log('✅ Container formazioni trovato');
                
                // Trova tutte le squadre (home e away) - migliorato per l'ordine
                const squadreDivs = formazioniContainer.querySelectorAll('._col-xs-6.col-home, ._col-xs-6.col-away');
                console.log(`📊 Trovate ${squadreDivs.length} squadre`);
                
                // Ordina le squadre: prima home, poi away
                const squadreOrdinate = Array.from(squadreDivs).sort((a, b) => {
                    const aIsHome = a.classList.contains('col-home');
                    const bIsHome = b.classList.contains('col-home');
                    return bIsHome - aIsHome; // Home prima di Away
                });
                
                // Prima di tutto, raccogliamo tutti i nomi delle squadre dal match-header
                console.log(`🔍 DEBUG - RACCOLTA NOMI SQUADRE DAL MATCH-HEADER`);
                const allMatchHeaders = formazioniContainer.querySelectorAll('.match-header');
                console.log(`🔍 DEBUG - Trovati ${allMatchHeaders.length} match headers`);
                
                const teamNamesMap = new Map(); // Map per associare home/away ai nomi
                
                allMatchHeaders.forEach((matchHeader, matchIndex) => {
                    console.log(`🔍 DEBUG - Analizzando match header ${matchIndex + 1}`);
                    const teamHeaders = matchHeader.querySelectorAll('.team-header .media-body .media-heading.ellipsis');
                    console.log(`🔍 DEBUG - Team headers in questo match: ${teamHeaders.length}`);
                    
                    teamHeaders.forEach((teamHeader, teamIndex) => {
                        const teamName = teamHeader.textContent.trim();
                        console.log(`🔍 DEBUG - Team ${teamIndex + 1} nel match ${matchIndex + 1}: ${teamName}`);
                        
                        if (teamName && teamName.length > 2 && teamName.length < 30 && 
                            !teamName.includes('vs') && !teamName.includes('Home') && !teamName.includes('Away') &&
                            !teamName.includes('Titolari') && !teamName.includes('Panchina')) {
                            
                            const key = `${matchIndex}-${teamIndex === 0 ? 'home' : 'away'}`;
                            teamNamesMap.set(key, teamName);
                            console.log(`🔍 DEBUG - Salvato nome squadra: ${key} = ${teamName}`);
                        }
                    });
                });
                
                console.log(`🔍 DEBUG - Mappa nomi squadre:`, Array.from(teamNamesMap.entries()));
                
                squadreOrdinate.forEach((squadraDiv, index) => {
                    console.log(`🔍 Analisi squadra ${index + 1}...`);
                    console.log(`🔍 DEBUG - INIZIO ANALISI SQUADRA ${index + 1} - Codice aggiornato`);
                    
                    // Determina se questa squadra è home o away
                    const isHome = squadraDiv.classList.contains('col-home');
                    console.log(`🔍 DEBUG - Squadra ${index + 1} è home: ${isHome}`);
                    
                    // Trova il match index per questa squadra
                    let matchIndex = 0;
                    let currentElement = squadraDiv;
                    
                    // Risali fino a trovare il match-details
                    for (let i = 0; i < 10 && currentElement; i++) {
                        if (currentElement.classList.contains('match-details')) {
                            const dataIndex = currentElement.getAttribute('data-index');
                            matchIndex = dataIndex ? parseInt(dataIndex) : 0;
                            console.log(`🔍 DEBUG - Match index trovato: ${matchIndex}`);
                            break;
                        }
                        currentElement = currentElement.parentElement;
                    }
                    
                    // Cerca il nome squadra nella mappa
                    const teamKey = `${matchIndex}-${isHome ? 'home' : 'away'}`;
                    let nomeSquadra = teamNamesMap.get(teamKey) || `Squadra ${index + 1}`;
                    
                    console.log(`🔍 DEBUG - Chiave squadra: ${teamKey}`);
                    console.log(`🔍 DEBUG - Nome squadra trovato: ${nomeSquadra}`);
                    
                    if (nomeSquadra.match(/^Squadra \d+$/)) {
                        console.log(`⚠️ Nome squadra non trovato nella mappa, cercando alternative...`);
                        
                        // Fallback: cerca nel match-header più vicino
                        let currentElement = squadraDiv;
                        let matchHeader = null;
                        
                        for (let i = 0; i < 5 && currentElement; i++) {
                            if (currentElement.classList.contains('match-header')) {
                                matchHeader = currentElement;
                                break;
                            }
                            currentElement = currentElement.parentElement;
                        }
                        
                        if (matchHeader) {
                            const teamHeaders = matchHeader.querySelectorAll('.team-header .media-body .media-heading.ellipsis');
                            const targetIndex = isHome ? 0 : 1;
                            
                            if (teamHeaders[targetIndex]) {
                                const text = teamHeaders[targetIndex].textContent.trim();
                                if (text && text.length > 2 && text.length < 30 && 
                                    !text.includes('vs') && !text.includes('Home') && !text.includes('Away') &&
                                    !text.includes('Titolari') && !text.includes('Panchina')) {
                                    nomeSquadra = text;
                                    console.log(`✅ Nome squadra trovato nel fallback: ${nomeSquadra}`);
                                }
                            }
                        }
                    }
                    
                    // Estrai modulo formazione - cercando nel match-header
                    let modulo = 'N/A';
                    
                    // Cerca il modulo nel match-header corrispondente
                    let currentElementForModulo = squadraDiv;
                    let matchHeaderForModulo = null;
                    
                    // Risali fino a trovare il match-header
                    for (let i = 0; i < 5 && currentElementForModulo; i++) {
                        if (currentElementForModulo.classList.contains('match-header')) {
                            matchHeaderForModulo = currentElementForModulo;
                            break;
                        }
                        currentElementForModulo = currentElementForModulo.parentElement;
                    }
                    
                    if (matchHeaderForModulo) {
                        const teamHeaders = matchHeaderForModulo.querySelectorAll('.team-header .media-body h5');
                        const targetIndex = isHome ? 0 : 1;
                        
                        if (teamHeaders[targetIndex]) {
                            const moduloText = teamHeaders[targetIndex].textContent.trim();
                            console.log(`🔍 DEBUG - Testo completo modulo: ${moduloText}`);
                            
                            // Estrai solo il modulo (es. "4-3-3") dal testo completo
                            // Gestisce anche il formato "4-2-3-1 (dopo le sostituzioni 4-2-3-1)"
                            const moduloMatch = moduloText.match(/(\d+-\d+-\d+(?:-\d+)?)/);
                            if (moduloMatch) {
                                modulo = moduloMatch[1];
                                console.log(`✅ Modulo trovato: ${modulo} (da: ${moduloText})`);
                            } else {
                                console.log(`⚠️ Modulo non riconosciuto nel testo: ${moduloText}`);
                            }
                        } else {
                            console.log(`⚠️ Elemento h5 non trovato per questa squadra`);
                        }
                    } else {
                        console.log(`⚠️ Match header non trovato per modulo`);
                    }
                    
                    console.log(`📋 Squadra: ${nomeSquadra}, Modulo: ${modulo}`);
                    
                    // Crea oggetto formazione per questa squadra
                    const formazione = {
                        squadra: nomeSquadra,
                        modulo: modulo,
                        giornata: giornata || 'N/A',
                        titolari: [],
                        panchinari: [],
                        altri_punti: [],
                        totale: null,
                        tipo_squadra: squadraDiv.classList.contains('col-home') ? 'home' : 'away'
                    };
                    
                    // Estrai titolari (formationTable)
                    const titolariTable = squadraDiv.querySelector('#formationTable');
                    if (titolariTable) {
                        const titolariRows = Array.from(titolariTable.querySelectorAll('tbody tr'));
                        formazione.titolari = titolariRows.map(row => {
                                const cells = Array.from(row.querySelectorAll('td'));
                            if (cells.length >= 6) {
                                // Estrai ruolo e nome separatamente - migliorato
                                const ruoloNomeText = cells[0]?.textContent?.trim() || '';
                                const nomeText = cells[1]?.textContent?.trim() || '';
                                
                                // Separa ruolo e nome se sono nella stessa cella
                                let ruolo = '';
                                let nome = '';
                                
                                if (ruoloNomeText && !nomeText) {
                                    // Se c'è solo la prima cella, prova a separare ruolo e nome
                                    // Cerca pattern come "por\nMartinez Jo." o "dc\nParedes A."
                                    const lines = ruoloNomeText.split('\n').filter(line => line.trim());
                                    if (lines.length >= 2) {
                                        ruolo = lines[0].trim();
                                        nome = lines.slice(1).join(' ').trim();
                                    } else {
                                        // Se non ci sono newline, cerca pattern come "por Martinez Jo."
                                        const match = ruoloNomeText.match(/^([a-z]+)\s+(.+)$/i);
                                        if (match) {
                                            ruolo = match[1].trim();
                                            nome = match[2].trim();
                                        } else {
                                            ruolo = ruoloNomeText;
                                            nome = '';
                                        }
                                    }
                                } else {
                                    ruolo = ruoloNomeText;
                                    nome = nomeText;
                                }
                                
                                // Pulisci il ruolo (rimuovi spazi extra e caratteri strani)
                                ruolo = ruolo.replace(/\s+/g, '').toLowerCase();
                                
                                console.log(`🎯 Ruolo: "${ruolo}", Nome: "${nome}"`);
                                
                                // Estrai bonus dall'icona - AGGIORNATO per gestire più bonus per giocatore
                                const bonusIcons = cells[2]?.querySelectorAll('img.icon.match-icon, img[src*=".png"], img[src*=".jpg"], img[src*=".gif"]');
                                let bonus = 'N/A';
                                let bonusImageName = '';
                                let bonusArray = [];
                                
                                if (bonusIcons && bonusIcons.length > 0) {
                                    bonusArray = Array.from(bonusIcons).map(icon => {
                                        const bonusSrc = icon.src || '';
                                        const imageName = bonusSrc.split('/').pop() || '';
                                        const bonusText = Object.keys(bonusMapping).find(key => bonusSrc.includes(key));
                                        if (bonusText) {
                                            return bonusMapping[bonusText];
                                        } else if (imageName) {
                                            return imageName.replace(/\.(png|jpg|gif)$/i, '').toUpperCase();
                                        }
                                        return 'N/A';
                                    }).filter(b => b !== 'N/A');
                                    if (bonusArray.length > 0) {
                                        bonus = bonusArray.join(',');
                                        bonusImageName = bonusArray.join(',');
                                    }
                                    console.log(`🎯 Bonus trovati: ${bonusArray.length} - ${bonus} (immagini: ${bonusImageName})`);
                                }
                                
                                // Estrai voto
                                const votoEl = cells[3]?.querySelector('.vote');
                                const voto = votoEl ? votoEl.textContent.trim() : '';
                                
                                // Estrai fantavoto
                                const fantavotoEl = cells[4]?.querySelector('.total');
                                const fantavoto = fantavotoEl ? fantavotoEl.textContent.trim() : '';
                                
                                // Migliora logica per "In Campo" - solo se ha voto valido
                                const inCampoEl = cells[5]?.querySelector('.mantra-pos');
                                const hasVoto = voto && voto !== '-' && voto !== 's.v.' && voto !== '';
                                const inCampo = hasVoto && inCampoEl ? inCampoEl.getAttribute('data-malus') === '0' : false;
                                
                                    return {
                                    ruolo: ruolo,
                                    nome: nome,
                                    bonus: bonus,
                                    bonus_image: bonusImageName,
                                    voto: voto,
                                    fantavoto: fantavoto,
                                    in_campo: inCampo
                                };
                            } else if (cells.length >= 2) {
                                    return {
                                    ruolo: cells[0]?.textContent?.trim() || '',
                                    nome: cells[1]?.textContent?.trim() || '',
                                    bonus: 'N/A',
                                        voto: '',
                                    fantavoto: '',
                                    in_campo: false
                                    };
                                }
                                return null;
                            }).filter(Boolean);
                            
                        console.log(`✅ Titolari: ${formazione.titolari.length} giocatori`);
                    }
                    
                    // Estrai panchina (releaseTable)
                    const panchinaTable = squadraDiv.querySelector('#releaseTable');
                    if (panchinaTable) {
                        const panchinaRows = Array.from(panchinaTable.querySelectorAll('tbody tr'));
                        formazione.panchinari = panchinaRows.map(row => {
                            const cells = Array.from(row.querySelectorAll('td'));
                            if (cells.length >= 6) {
                                // Estrai ruolo e nome separatamente
                                const ruoloNomeText = cells[0]?.textContent?.trim() || '';
                                const nomeText = cells[1]?.textContent?.trim() || '';
                                
                                // Separa ruolo e nome se sono nella stessa cella
                                let ruolo = '';
                                let nome = '';
                                
                                if (ruoloNomeText && !nomeText) {
                                    // Se c'è solo la prima cella, prova a separare ruolo e nome
                                    const parts = ruoloNomeText.split('\\n').filter(p => p.trim());
                                    if (parts.length >= 2) {
                                        ruolo = parts[0].trim();
                                        nome = parts.slice(1).join(' ').trim();
                                    } else {
                                        ruolo = ruoloNomeText;
                                        nome = '';
                                    }
                                } else {
                                    ruolo = ruoloNomeText;
                                    nome = nomeText;
                                }
                                
                                // Estrai bonus dall'icona - migliorato
                                const bonusIcon = cells[2]?.querySelector('img.icon.match-icon, img[src*=".png"], img[src*=".jpg"], img[src*=".gif"]');
                                let bonus = 'N/A';
                                let bonusImageName = '';
                                
                                if (bonusIcon) {
                                    const bonusSrc = bonusIcon.src || '';
                                    bonusImageName = bonusSrc.split('/').pop() || '';
                                    
                                    const bonusText = Object.keys(bonusMapping).find(key => bonusSrc.includes(key));
                                    if (bonusText) {
                                        bonus = bonusMapping[bonusText];
                                    } else if (bonusImageName) {
                                        bonus = bonusImageName.replace(/\.(png|jpg|gif)$/i, '').toUpperCase();
                                    }
                                    
                                    console.log(`🎯 Bonus trovato: ${bonus} (immagine: ${bonusImageName})`);
                                }
                                
                                // Estrai voto
                                const votoEl = cells[3]?.querySelector('.vote');
                                const voto = votoEl ? votoEl.textContent.trim() : '';
                                
                                // Estrai fantavoto
                                const fantavotoEl = cells[4]?.querySelector('.total');
                                const fantavoto = fantavotoEl ? fantavotoEl.textContent.trim() : '';
                                
                                // Migliora logica per "In Campo" - solo se ha voto valido
                                const inCampoEl = cells[5]?.querySelector('.mantra-pos');
                                const hasVoto = voto && voto !== '-' && voto !== 's.v.' && voto !== '';
                                const inCampo = hasVoto && inCampoEl ? inCampoEl.getAttribute('data-malus') === '0' : false;
                                
                                return {
                                    ruolo: ruolo,
                                    nome: nome,
                                    bonus: bonus,
                                    voto: voto,
                                    fantavoto: fantavoto,
                                    in_campo: inCampo
                                };
                            } else if (cells.length >= 2) {
                                return {
                                    ruolo: cells[0]?.textContent?.trim() || '',
                                    nome: cells[1]?.textContent?.trim() || '',
                                    bonus: 'N/A',
                                    voto: '',
                                    fantavoto: '',
                                    in_campo: false
                                };
                            }
                            return null;
                        }).filter(Boolean);
                        
                        console.log(`✅ Panchina: ${formazione.panchinari.length} giocatori`);
                    }
                    
                    // Estrai altri punti (otherScoresTable)
                    const altriPuntiTable = squadraDiv.querySelector('#otherScoresTable');
                    if (altriPuntiTable) {
                        const altriPuntiRows = Array.from(altriPuntiTable.querySelectorAll('tbody tr'));
                        formazione.altri_punti = altriPuntiRows.map(row => {
                            const cells = Array.from(row.querySelectorAll('td'));
                            if (cells.length >= 2) {
                                return {
                                    descrizione: cells[0]?.textContent?.trim() || '',
                                    punti: cells[1]?.textContent?.trim() || ''
                                };
                            }
                            return null;
                        }).filter(Boolean);
                        
                        console.log(`✅ Altri punti: ${formazione.altri_punti.length} elementi`);
                    }
                    
                    // Estrai totale (totalTable)
                    const totaleTable = squadraDiv.querySelector('#totalTable');
                    if (totaleTable) {
                        const totaleRow = totaleTable.querySelector('tbody tr');
                        if (totaleRow) {
                            const cells = Array.from(totaleRow.querySelectorAll('td'));
                            if (cells.length >= 2) {
                                formazione.totale = {
                                    descrizione: cells[0]?.textContent?.trim() || '',
                                    punti: cells[1]?.textContent?.trim() || ''
                                };
                            }
                        }
                        
                        console.log(`✅ Totale: ${formazione.totale ? 'trovato' : 'non trovato'}`);
                    }
                    
                    // Aggiungi la formazione solo se ha almeno titolari o panchina
                    if (formazione.titolari.length > 0 || formazione.panchinari.length > 0) {
                        formazioni.push(formazione);
                        console.log(`✅ Formazione aggiunta per ${formazione.squadra}`);
                    } else {
                        console.log(`⚠️ Nessun giocatore trovato per ${formazione.squadra}`);
                    }
                });

                console.log(`🎯 Formazioni estratte: ${formazioni.length} squadre trovate`);
                formazioni.forEach((f, i) => {
                    console.log(`  Squadra ${i + 1}: ${f.squadra} (${f.tipo_squadra}) - ${f.titolari.length} titolari, ${f.panchinari.length} panchina`);
                });
                
                return formazioni;
            }, giornata);
            
            console.log(`✅ Formazioni estratte: ${formazioniData.length} squadre trovate`);
            formazioniData.forEach((f, i) => {
                console.log(`  Squadra ${i + 1}: ${f.squadra} (${f.tipo_squadra}) - ${f.titolari.length} titolari, ${f.panchinari.length} panchina`);
            });
            
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
                    const giornata = scrapingUrls.formazioni.match(/\/formazioni\/(\d+)/)?.[1] || null;
                    
                    // Costruisci l'URL corretto se abbiamo torneo e giornata
                    let formazioniUrl = scrapingUrls.formazioni;
                    if (giornata && selectedTournament) {
                        formazioniUrl = `${this.leagueUrl}/formazioni/${giornata}?id=${selectedTournament}`;
                        console.log(`🌐 URL formazioni aggiornato: ${formazioniUrl}`);
                    }
                    
                    results.formazioni = await this.scrapeFormazioni(formazioniUrl, giornata);
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
            
            // Sincronizza QA/QI nella tabella principale
            await this.syncQAQIGiocatoriMainTable(legaId, roseData);
            
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
            
            // Mapping corretto dei dati
            const squadraReale = giocatore.squadra; // squadra reale
            const quotazione = parseFloat(giocatore.quotazione) || 1.0; // quotazione (QA)
            const qi = parseFloat(giocatore.qi) || 0; // QI
            const fvMp = giocatore.fvMp || '0'; // FV MP
            
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
                                'INSERT INTO classifica_scraping (lega_id, posizione, squadra, punti, partite, vittorie, pareggi, sconfitte, gol_fatti, gol_subiti, differenza_reti, punti_totali, data_scraping, fonte_scraping) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), "playwright")',
                                [
                                    legaId, 
                                    posizione.posizione, 
                                    posizione.squadra, 
                                    posizione.punti || 0, 
                                    posizione.partite || 0,
                                    posizione.vittorie || 0,
                                    posizione.pareggi || 0,
                                    posizione.sconfitte || 0,
                                    posizione.golFatti || 0,
                                    posizione.golSubiti || 0,
                                    posizione.differenzaReti || 0,
                                    posizione.puntiTotali || 0
                                ],
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
                            // Salva tutti i dati dei titolari (oggetti completi con ruolo, nome, bonus, voto, fantavoto, in_campo)
                            const titolari = JSON.stringify(formazione.titolari || []);
                            
                            // Salva tutti i dati della panchina (oggetti completi con ruolo, nome, bonus, voto, fantavoto, in_campo)
                            const panchinari = JSON.stringify(formazione.panchinari || []);
                            
                            db.run(
                                'INSERT INTO formazioni_scraping (lega_id, squadra, modulo, titolari, panchinari, giornata, tipo_squadra, data_scraping, fonte_scraping) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), "playwright")',
                                [legaId, formazione.squadra, formazione.modulo, titolari, panchinari, formazione.giornata || 1, formazione.tipo_squadra],
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
            
            if (!this.leagueUrl) {
                throw new Error('leagueUrl non impostata');
            }
            
            // Per Serie A Classic, naviga alla pagina delle competizioni
            if (this.tipoLega === 'serie_a') {
                console.log('🏆 Serie A Classic rilevata, navigo alla pagina delle competizioni...');
                
                const competitionsUrl = `${this.leagueUrl}/lista-competizioni`;
                console.log(`📍 Navigazione a: ${competitionsUrl}`);
                
                await this.page.goto(competitionsUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 15000
                });
                
                // Gestisci popup se necessario
                try {
                    await this.acceptAllPrivacyPopups();
                } catch (error) {
                    console.log('⚠️ Errore gestione popup:', error.message);
                }
                
                // Attendi un po' per il caricamento
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Estrai i tornei dalla pagina delle competizioni
                const tournaments = await this.page.evaluate(() => {
                    console.log('🔍 Inizio estrazione tornei dalle sezioni corrette per Serie A...');
                    const tournaments = [];
                    
                    try {
                        // Cerca direttamente i link con class="competition-name" che sono i tornei
                        const competitionLinks = document.querySelectorAll('a.competition-name');
                        console.log(`🔍 Trovati ${competitionLinks.length} link competition-name`);
                        
                        competitionLinks.forEach((link, linkIndex) => {
                            const text = link.textContent?.trim();
                            const href = link.getAttribute('href');
                            const title = link.getAttribute('title');
                            
                            console.log(`🔍 Link ${linkIndex}: "${text}" -> ${href} (title: "${title}")`);
                            
                            if (text && href && text.length > 2) {
                                // Estrai ID dall'URL del link
                                let id = null;
                                
                                // Pattern: /dettaglio-competizione/12296?id=12296
                                const urlMatch = href.match(/\/dettaglio-competizione\/(\d+)/);
                                if (urlMatch) {
                                    id = urlMatch[1];
                                } else {
                                    // Fallback: cerca parametro id
                                    const idMatch = href.match(/[?&]id=(\d+)/);
                                    if (idMatch) {
                                        id = idMatch[1];
                                    }
                                }
                                
                                if (id) {
                                    console.log(`🔍 ✅ ID estratto: ${id} per "${text}"`);
                                    
                                    // Verifica che non sia già stato aggiunto
                                    const alreadyExists = tournaments.find(t => t.id === id);
                                    if (!alreadyExists) {
                                        tournaments.push({
                                            id: id,
                                            name: text,
                                            url: href,
                                            source: 'competition_name_link',
                                            className: link.className || ''
                                        });
                                        console.log(`🔍 ✅ Torneo aggiunto: ${text} (ID: ${id})`);
                                    } else {
                                        console.log(`🔍 ⚠️ Torneo già presente: ${text} (ID: ${id})`);
                                    }
                                } else {
                                    console.log(`🔍 ❌ Nessun ID trovato per: "${text}"`);
                                }
                            }
                        });
                        
                        // Se non abbiamo trovato link competition-name, prova con il fallback generico
                        if (tournaments.length === 0) {
                            console.log('🔍 Nessun link competition-name trovato, uso fallback generico...');
                            
                            // Cerca tutti i link che potrebbero essere tornei
                            const allLinks = document.querySelectorAll('a[href*="dettaglio-competizione"]');
                            console.log(`🔍 Trovati ${allLinks.length} link con dettaglio-competizione`);
                            
                            allLinks.forEach((link, linkIndex) => {
                                const text = link.textContent?.trim();
                                const href = link.getAttribute('href');
                                
                                console.log(`🔍 Link ${linkIndex}: "${text}" -> ${href}`);
                                
                                if (text && href && text.length > 2) {
                                    // Escludi link che non sono tornei
                                    const excludePatterns = [
                                        'impostazioni', 'crea', 'riordina', 'classifica', 
                                        'formazioni', 'calendario', 'regole', 'dettaglio',
                                        'visualizza', 'modifica', 'elimina'
                                    ];
                                    
                                    const isExcluded = excludePatterns.some(pattern => 
                                        text.toLowerCase().includes(pattern) || 
                                        href.toLowerCase().includes(pattern)
                                    );
                                    
                                    if (!isExcluded) {
                                        // Estrai ID dall'URL del link
                                        let id = null;
                                        
                                        // Pattern: /dettaglio-competizione/12296?id=12296
                                        const urlMatch = href.match(/\/dettaglio-competizione\/(\d+)/);
                                        if (urlMatch) {
                                            id = urlMatch[1];
                                        } else {
                                            // Fallback: cerca parametro id
                                            const idMatch = href.match(/[?&]id=(\d+)/);
                                            if (idMatch) {
                                                id = idMatch[1];
                                            }
                                        }
                                        
                                        if (id) {
                                            console.log(`🔍 ✅ ID estratto: ${id} per "${text}"`);
                                            
                                            // Verifica che non sia già stato aggiunto
                                            const alreadyExists = tournaments.find(t => t.id === id);
                                            if (!alreadyExists) {
                                                tournaments.push({
                                                    id: id,
                                                    name: text,
                                                    url: href,
                                                    source: 'dettaglio_competizione_link',
                                                    className: link.className || ''
                                                });
                                                console.log(`🔍 ✅ Torneo aggiunto: ${text} (ID: ${id})`);
                                            } else {
                                                console.log(`🔍 ⚠️ Torneo già presente: ${text} (ID: ${id})`);
                                            }
                                        } else {
                                            console.log(`🔍 ❌ Nessun ID trovato per: "${text}"`);
                                        }
                                    } else {
                                        console.log(`🔍 ❌ Link escluso: "${text}" (pattern escluso)`);
                                    }
                                }
                            });
                        }
                        
                        console.log(`🔍 Totale tornei estratti: ${tournaments.length}`);
                        
                    } catch (error) {
                        console.error('❌ Errore durante estrazione tornei:', error);
                    }
                    
                    return tournaments;
                });
                
                console.log(`✅ Tornei estratti da Serie A: ${tournaments.length} trovati`);
                tournaments.forEach(t => {
                    console.log(`  - ${t.name} (ID: ${t.id}) [${t.source}]`);
                });
                
                return tournaments;
            }
            
            // Per Euroleghe Mantra, cerca i tornei direttamente nella pagina principale
            if (this.tipoLega === 'euroleghe') {
                console.log('🏆 Euroleghe Mantra rilevata, cerco tornei nella pagina principale...');
                
                // Naviga alla pagina principale della lega
                await this.page.goto(this.leagueUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 15000
                });
                
                // Gestisci popup se necessario
                try {
                    await this.acceptAllPrivacyPopups();
                } catch (error) {
                    console.log('⚠️ Errore gestione popup:', error.message);
                }
                
                // Attendi un po' per il caricamento
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Estrai i tornei dalla pagina con logica corretta per le sezioni
                const tournaments = await this.page.evaluate(() => {
                    console.log('🔍 Inizio estrazione tornei dalle sezioni corrette per Euroleghe...');
                    const tournaments = [];
                    
                    try {
                        // Cerca la sezione competition-list che contiene i tornei
                        const competitionList = document.querySelector('.competition-list');
                        if (competitionList) {
                            console.log('🔍 ✅ Sezione competition-list trovata');
                            // Prendi solo i link figli di <li class="dropdown-item">
                            const items = competitionList.querySelectorAll('li.dropdown-item > a');
                            console.log(`🔍 Trovati ${items.length} link in dropdown-item`);
                            items.forEach((link, index) => {
                                const text = link.textContent?.trim();
                                const href = link.getAttribute('href');
                                const className = link.className || '';
                                const dataId = link.getAttribute('data-id');
                                
                                // Escludi elementi che non sono tornei
                                const excludeTexts = [
                                    'topleague', 'archivio', 'nemeneme', 'classic', 'mantra', 
                                    'impostazioni', 'crea', 'riordina', 'admin', 'settings'
                                ];
                                
                                const isExcluded = excludeTexts.some(excludeText => 
                                    text && text.toLowerCase().includes(excludeText)
                                );
                                
                                // Prendi solo link con href="#" e data-id numerico e non esclusi
                                if (href === '#' && dataId && /^\d+$/.test(dataId) && !isExcluded) {
                                    // Verifica che non sia già stato aggiunto
                                    const alreadyExists = tournaments.find(t => t.id === dataId);
                                    if (!alreadyExists) {
                                        tournaments.push({
                                            id: dataId,
                                            name: text,
                                            url: href,
                                            source: 'competition_list_euroleghe',
                                            className: className
                                        });
                                        console.log(`�� ✅ Torneo aggiunto: ${text} (ID: ${dataId})`);
                                    }
                                } else {
                                    console.log(`🔍 ❌ Link escluso: "${text}" href="${href}" data-id="${dataId}" excluded=${isExcluded}`);
                                }
                            });
                        } else {
                            console.log('🔍 ❌ Sezione competition-list non trovata');
                        }
                        
                        console.log(`🔍 Totale tornei estratti: ${tournaments.length}`);
                        
                    } catch (error) {
                        console.error('❌ Errore durante estrazione tornei:', error);
                    }
                    
                    return tournaments;
                });
                
                console.log(`✅ Tornei estratti da Euroleghe: ${tournaments.length} trovati`);
                tournaments.forEach(t => {
                    console.log(`  - ${t.name} (ID: ${t.id}) [${t.source}]`);
                });
                
                return tournaments;
            }
            
            // Fallback: logica generica per altri tipi di lega
            console.log('⚠️ Tipo lega non riconosciuto, uso logica generica...');
            return [];
            
        } catch (error) {
            console.error('❌ Errore nel recupero tornei:', error);
            return [];
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

    // Funzione per raccogliere tutte le immagini dei bonus
    async collectBonusImages(formazioniUrl, giornata = null) {
        try {
            console.log(`🔍 Raccolta immagini bonus da: ${formazioniUrl}`);
            
            const urlCompleto = formazioniUrl.includes('/formazioni/') 
                ? formazioniUrl 
                : (giornata ? `${formazioniUrl}/${giornata}` : formazioniUrl);
            
            await this.page.goto(urlCompleto, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await this.acceptAllPrivacyPopups();
            await this.page.waitForTimeout(3000);
            
            const bonusImages = await this.page.evaluate(() => {
                const bonusData = [];
                
                // Cerca tutte le immagini nei contenitori delle formazioni
                const formazioniContainer = document.querySelector('.tab-content.transfers-tab-content.no-border.loading-box');
                if (formazioniContainer) {
                    // Cerca tutte le immagini che potrebbero essere bonus
                    const allImages = formazioniContainer.querySelectorAll('img[src*=".png"], img[src*=".jpg"], img[src*=".gif"]');
                    
                    allImages.forEach(img => {
                        const src = img.src;
                        const alt = img.alt || '';
                        const title = img.title || '';
                        const className = img.className || '';
                        
                        if (src) {
                            const imageName = src.split('/').pop();
                            const imageUrl = src;
                            
                            // Estrai informazioni dal nome del file o attributi
                            let bonusName = '';
                            if (alt) bonusName = alt;
                            else if (title) bonusName = title;
                            else if (imageName) {
                                // Prova a estrarre il nome dal nome del file
                                const nameWithoutExt = imageName.replace(/\.[^/.]+$/, '');
                                bonusName = nameWithoutExt.replace(/[_-]/g, ' ').toUpperCase();
                            }
                            
                            // Filtra solo immagini che sembrano essere bonus (piccole, con nomi specifici)
                            if (imageName && (imageName.includes('bonus') || imageName.includes('gol') || 
                                imageName.includes('assist') || imageName.includes('amm') || 
                                imageName.includes('esp') || imageName.includes('aut') ||
                                imageName.includes('par') || imageName.includes('vit') ||
                                alt.toLowerCase().includes('bonus') || title.toLowerCase().includes('bonus'))) {
                                
                                bonusData.push({
                                    name: bonusName || imageName,
                                    image_url: imageUrl,
                                    file_name: imageName,
                                    alt: alt,
                                    title: title,
                                    class: className
                                });
                            }
                        }
                    });
                }
                
                // Rimuovi duplicati basati sull'URL
                const uniqueBonus = bonusData.filter((bonus, index, self) => 
                    index === self.findIndex(b => b.image_url === bonus.image_url)
                );
                
                return uniqueBonus;
            });
            
            console.log('🎯 Bonus images trovate:', bonusImages);
            return bonusImages;
            
        } catch (error) {
            console.error('❌ Errore raccolta immagini bonus:', error);
            throw error;
        }
    }
}

export default PlaywrightScraper;