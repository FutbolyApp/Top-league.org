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
            
            this.browser = await chromium.launch({
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
                ],
                userDataDir: this.userDataDir
            });
            
            this.page = await this.browser.newPage();
            
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

    async login(username, password) {
        try {
            console.log('🔐 Login su Fantacalcio.it...');
            
            // Vai alla pagina di login
            await this.page.goto('https://www.fantacalcio.it/login', {
                waitUntil: 'networkidle'
            });
            
            console.log('📄 Pagina di login caricata');
            
            // Aspetta un po' per eventuali popup
            await this.page.waitForTimeout(3000);
            
            // Gestisci popup privacy/cookie
            await this.acceptAllPrivacyPopups();
            
            // Aspetta ancora un po' dopo aver gestito i popup
            await this.page.waitForTimeout(2000);
            
            // Trova e compila i campi
            console.log('📝 Inserimento credenziali...');
            
            // Username - prova diversi selettori
            let usernameField = null;
            const usernameSelectors = [
                'input[name="username"]',
                'input[name="email"]',
                'input[type="email"]',
                'input[placeholder*="username"]',
                'input[placeholder*="email"]',
                'input[placeholder*="utente"]'
            ];
            
            for (const selector of usernameSelectors) {
                try {
                    usernameField = await this.page.$(selector);
                    if (usernameField) {
                        console.log(`✅ Campo username trovato con selettore: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continua con il prossimo selettore
                }
            }
            
            if (!usernameField) {
                console.log('❌ Campo username non trovato');
                return false;
            }
            
            await usernameField.click();
            await usernameField.fill(username);
            console.log('✅ Username inserito');
            
            // Password - prova diversi selettori
            let passwordField = null;
            const passwordSelectors = [
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="password"]',
                'input[placeholder*="password"]'
            ];
            
            for (const selector of passwordSelectors) {
                try {
                    passwordField = await this.page.$(selector);
                    if (passwordField) {
                        console.log(`✅ Campo password trovato con selettore: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continua con il prossimo selettore
                }
            }
            
            if (!passwordField) {
                console.log('❌ Campo password non trovato');
                return false;
            }
            
            await passwordField.click();
            await passwordField.fill(password);
            console.log('✅ Password inserita');
            
            // Clicca login - prova diversi metodi
            console.log('🖱️ Tentativo click login...');
            
            // Metodo 1: Cerca bottone submit
            const loginButton = await this.page.$('button[type="submit"], input[type="submit"]');
            if (loginButton) {
                console.log('✅ Bottone submit trovato, click...');
                await loginButton.click();
            } else {
                // Metodo 2: Premi Enter
                console.log('⚠️ Bottone submit non trovato, premendo Enter...');
                await this.page.keyboard.press('Enter');
            }
            
            // Aspetta il redirect
            console.log('⏳ Attesa risposta login...');
            await this.page.waitForTimeout(5000);
            
            // Verifica se il login è riuscito
            const currentUrl = this.page.url();
            console.log(`📍 URL dopo login: ${currentUrl}`);
            
            // Se non siamo più nella pagina di login, è riuscito
            if (!currentUrl.includes('login') && !currentUrl.includes('signin')) {
                console.log('✅ Login riuscito!');
                return true;
            } else {
                console.log('❌ Login fallito - ancora nella pagina di login');
                
                // Debug: controlla se ci sono messaggi di errore
                try {
                    const errorMessages = await this.page.$$('.error, .alert, .message, [class*="error"], [class*="alert"]');
                    for (const error of errorMessages) {
                        const text = await error.textContent();
                        if (text && text.trim()) {
                            console.log(`⚠️ Messaggio di errore trovato: "${text.trim()}"`);
                        }
                    }
                } catch (e) {
                    // Ignora errori debug
                }
                
                return false;
            }
            
        } catch (error) {
            console.error('❌ Errore durante il login:', error);
            return false;
        }
    }

    async scrapeRose(leagueUrl) {
        try {
            console.log(`📊 Scraping rose da: ${leagueUrl}`);
            await this.page.goto(leagueUrl, {
                waitUntil: 'networkidle'
            });
            
            await this.page.waitForTimeout(5000);
            
            const roseData = await this.page.evaluate(() => {
                const squadre = [];
                
                console.log('🔍 Analisi pagina rose...');
                
                // Cerca la tabella principale delle rose
                const tables = document.querySelectorAll('table');
                console.log(`Trovate ${tables.length} tabelle`);
                
                // Cerca la tabella che contiene le squadre
                let mainTable = null;
                for (const table of tables) {
                    const tableText = table.textContent?.toLowerCase();
                    if (tableText && (tableText.includes('squadra') || tableText.includes('giocatori') || tableText.includes('rose'))) {
                        mainTable = table;
                        console.log('✅ Trovata tabella principale delle rose');
                        break;
                    }
                }
                
                if (!mainTable && tables.length > 0) {
                    mainTable = tables[0]; // Usa la prima tabella se non troviamo indicatori specifici
                    console.log('⚠️ Usando la prima tabella disponibile');
                }
                
                if (!mainTable) {
                    console.log('❌ Nessuna tabella trovata');
                    return squadre;
                }
                
                // Analizza le righe della tabella
                const rows = mainTable.querySelectorAll('tr');
                console.log(`Analizzando ${rows.length} righe della tabella`);
                
                let currentSquadra = null;
                let isHeaderRow = true;
                
                rows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll('td, th');
                    
                    // Salta le righe vuote
                    if (cells.length === 0) return;
                    
                    // Controlla se è una riga di header
                    const firstCellText = cells[0]?.textContent?.trim().toLowerCase();
                    if (isHeaderRow && (firstCellText === 'squadra' || firstCellText === 'nome' || firstCellText === 'giocatori')) {
                        console.log('📋 Trovata riga di header, la salto');
                        isHeaderRow = false;
                        return;
                    }
                    
                    // Cerca il nome della squadra nella prima colonna
                    const squadraCell = cells[0];
                    if (squadraCell) {
                        const squadraText = squadraCell.textContent?.trim();
                        
                        // Cerca link che potrebbero essere squadre
                        const squadraLink = squadraCell.querySelector('a');
                        if (squadraLink) {
                            const linkText = squadraLink.textContent?.trim();
                            if (linkText && linkText.length > 0) {
                                console.log(`🏆 Trovata squadra: ${linkText}`);
                                
                                // Cerca la squadra esistente o creane una nuova
                                let squadra = squadre.find(s => s.nome === linkText);
                                if (!squadra) {
                                    squadra = {
                                        nome: linkText,
                                        giocatori: []
                                    };
                                    squadre.push(squadra);
                                }
                                currentSquadra = squadra;
                            }
                        } else if (squadraText && squadraText.length > 2 && squadraText.length < 50) {
                            // Verifica se potrebbe essere un nome di squadra
                            const squadraKeywords = ['fc', 'calcio', 'united', 'city', 'real', 'barcelona', 'milan', 'inter', 'juventus', 'roma', 'lazio', 'napoli', 'fiorentina', 'atalanta', 'sassuolo', 'torino', 'genoa', 'sampdoria', 'bologna', 'empoli', 'lecce', 'salernitana', 'monza', 'frosinone', 'cagliari', 'verona', 'udinese'];
                            
                            const isSquadra = squadraKeywords.some(keyword => 
                                squadraText.toLowerCase().includes(keyword.toLowerCase())
                            );
                            
                            if (isSquadra && !squadre.find(s => s.nome === squadraText)) {
                                console.log(`🏆 Trovata squadra per keyword: ${squadraText}`);
                                const squadra = {
                                    nome: squadraText,
                                    giocatori: []
                                };
                                squadre.push(squadra);
                                currentSquadra = squadra;
                            }
                        }
                    }
                    
                    // Se abbiamo una squadra corrente, cerca giocatori nelle colonne successive
                    if (currentSquadra && cells.length > 1) {
                        // Estrai dati del giocatore dalle colonne
                        const giocatoreName = cells[1]?.textContent?.trim();
                        const giocatoreRuolo = cells[2]?.textContent?.trim();
                        const giocatoreSquadra = cells[3]?.textContent?.trim();
                        const giocatoreQuotazione = cells[4]?.textContent?.trim();
                        
                        if (giocatoreName && giocatoreName.length > 2 && giocatoreName.length < 50) {
                            // Verifica che non sia un header o un nome di squadra
                            const isGiocatore = !giocatoreName.toLowerCase().includes('squadra') && 
                                               !giocatoreName.toLowerCase().includes('nome') && 
                                               !giocatoreName.toLowerCase().includes('ruolo') &&
                                               !giocatoreName.toLowerCase().includes('quotazione') &&
                                               !giocatoreName.toLowerCase().includes('giocatori');
                            
                            if (isGiocatore) {
                                console.log(`⚽ Trovato giocatore: ${giocatoreName}`);
                                currentSquadra.giocatori.push({
                                    nome: giocatoreName,
                                    ruolo: giocatoreRuolo || 'N/A',
                                    squadra: giocatoreSquadra || 'N/A',
                                    quotazione: giocatoreQuotazione || '1.0',
                                    fvMp: '0.0'
                                });
                            }
                        }
                    }
                });
                
                console.log(`✅ Risultato finale: ${squadre.length} squadre trovate`);
                squadre.forEach(s => {
                    console.log(`  - ${s.nome}: ${s.giocatori.length} giocatori`);
                });
                
                return squadre;
            });
            
            console.log(`✅ Rose estratte: ${roseData.length} squadre trovate`);
            return roseData;
            
        } catch (error) {
            console.error('❌ Errore scraping rose:', error);
            throw error;
        }
    }

    async scrapeClassifica(classificaUrl) {
        try {
            console.log(`🏆 Scraping classifica da: ${classificaUrl}`);
            
            await this.page.goto(classificaUrl, {
                waitUntil: 'networkidle'
            });
            
            await this.page.waitForTimeout(3000);
            
            const classificaData = await this.page.evaluate(() => {
                const posizioni = [];
                
                // Cerca la tabella della classifica
                const rows = document.querySelectorAll('tr, .row, [class*="row"]');
                
                rows.forEach((row, index) => {
                    const posizione = row.querySelector('.posizione, .position, .pos')?.textContent?.trim();
                    const squadra = row.querySelector('.squadra, .team, .nome')?.textContent?.trim();
                    const punti = row.querySelector('.punti, .points')?.textContent?.trim();
                    const partite = row.querySelector('.partite, .matches')?.textContent?.trim();
                    
                    if (posizione && squadra) {
                        posizioni.push({
                            posizione: parseInt(posizione) || index + 1,
                            squadra,
                            punti: parseInt(punti) || 0,
                            partite: parseInt(partite) || 0
                        });
                    }
                });
                
                return posizioni;
            });
            
            console.log(`✅ Classifica estratta: ${classificaData.length} posizioni trovate`);
            return classificaData;

        } catch (error) {
            console.error('❌ Errore scraping classifica:', error);
            throw error;
        }
    }

    async scrapeVoti(votiUrl) {
        try {
            console.log(`⭐ Scraping voti da: ${votiUrl}`);
            
            await this.page.goto(votiUrl, {
                waitUntil: 'networkidle'
            });
            
            await this.page.waitForTimeout(3000);
            
            const votiData = await this.page.evaluate(() => {
                const voti = [];
                
                // Cerca i voti nella pagina
                const votiElements = document.querySelectorAll('.voto, .vote, [class*="voto"], [class*="vote"]');
                
                votiElements.forEach(votoEl => {
                    const giocatore = votoEl.querySelector('.giocatore, .player, .nome')?.textContent?.trim();
                    const voto = votoEl.querySelector('.voto, .vote, .punteggio')?.textContent?.trim();
                    const squadra = votoEl.querySelector('.squadra, .team')?.textContent?.trim();
                    const giornata = votoEl.querySelector('.giornata, .matchday')?.textContent?.trim();
                    
                    if (giocatore && voto) {
                        voti.push({
                            giocatore,
                            voto: parseFloat(voto) || 0,
                            squadra: squadra || 'N/A',
                            giornata: parseInt(giornata) || 1
                        });
                    }
                });
                
                return voti;
            });
            
            console.log(`✅ Voti estratti: ${votiData.length} voti trovati`);
            return votiData;
            
        } catch (error) {
            console.error('❌ Errore scraping voti:', error);
            throw error;
        }
    }

    async scrapeFormazioni(formazioniUrl) {
        try {
            console.log(`⚽ Scraping formazioni da: ${formazioniUrl}`);
            
            await this.page.goto(formazioniUrl, {
                waitUntil: 'networkidle'
            });
            
            await this.page.waitForTimeout(3000);
            
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

    async scrapeMercato(mercatoUrl) {
        try {
            console.log(`💰 Scraping mercato da: ${mercatoUrl}`);
            
            await this.page.goto(mercatoUrl, {
                waitUntil: 'networkidle'
            });
            
            await this.page.waitForTimeout(3000);
            
            const mercatoData = await this.page.evaluate(() => {
                const movimenti = [];
                
                // Cerca i movimenti di mercato
                const movimentiElements = document.querySelectorAll('.movimento, .transfer, [class*="movimento"], [class*="transfer"]');
                
                movimentiElements.forEach(movimentoEl => {
                    const giocatore = movimentoEl.querySelector('.giocatore, .player, .nome')?.textContent?.trim();
                    const da = movimentoEl.querySelector('.da, .from')?.textContent?.trim();
                    const a = movimentoEl.querySelector('.a, .to')?.textContent?.trim();
                    const prezzo = movimentoEl.querySelector('.prezzo, .price')?.textContent?.trim();
                    const tipo = movimentoEl.querySelector('.tipo, .type')?.textContent?.trim();
                    
                    if (giocatore) {
                        movimenti.push({
                            giocatore,
                            da: da || 'N/A',
                            a: a || 'N/A',
                            prezzo: prezzo || '0',
                            tipo: tipo || 'N/A'
                        });
                    }
                });

                return movimenti;
            });

            console.log(`✅ Mercato estratto: ${mercatoData.length} movimenti trovati`);
            return mercatoData;

        } catch (error) {
            console.error('❌ Errore scraping mercato:', error);
            throw error;
        }
    }

    async scrapeLeague(leagueUrl, scrapingUrls, credentials) {
        try {
            console.log('🚀 Inizio scraping con Playwright');
            
            if (!await this.init()) {
                throw new Error('Impossibile inizializzare Playwright');
            }

            // STEP 1: LOGIN
            console.log('🔐 STEP 1: Login');
            const loginSuccess = await this.login(credentials.username, credentials?.password || '');
            if (!loginSuccess) {
                throw new Error('Login fallito');
            }
            
            console.log('✅ Login completato');

            // STEP 2: SCRAPING
            console.log('🌐 STEP 2: Scraping dati');
            
            const results = {
                rose: null,
                classifica: null,
                voti: null,
                formazioni: null,
                mercato: null,
                summary: {
                    squadre_trovate: 0,
                    giocatori_totali: 0
                }
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

            // Scraping Voti
            if (scrapingUrls.voti) {
                console.log(`📊 Scraping voti: ${scrapingUrls.voti}`);
                try {
                    results.voti = await this.scrapeVoti(scrapingUrls.voti);
                    console.log('✅ Voti completati');
                } catch (error) {
                    console.error('❌ Errore scraping voti:', error.message);
                    results.voti = { error: error.message };
                }
            }

            // Scraping Formazioni
            if (scrapingUrls.formazioni) {
                console.log(`📊 Scraping formazioni: ${scrapingUrls.formazioni}`);
                try {
                    results.formazioni = await this.scrapeFormazioni(scrapingUrls.formazioni);
                    console.log('✅ Formazioni completate');
                } catch (error) {
                    console.error('❌ Errore scraping formazioni:', error.message);
                    results.formazioni = { error: error.message };
                }
            }

            // Scraping Mercato
            if (scrapingUrls.mercato) {
                console.log(`📊 Scraping mercato: ${scrapingUrls.mercato}`);
                try {
                    results.mercato = await this.scrapeMercato(scrapingUrls.mercato);
                    console.log('✅ Mercato completato');
                } catch (error) {
                    console.error('❌ Errore scraping mercato:', error.message);
                    results.mercato = { error: error.message };
                }
            }

            // Calcola summary
            if (results.rose && Array.isArray(results.rose)) {
                results.summary.squadre_trovate = results.rose.length;
                results.summary.giocatori_totali = results.rose.reduce((total, squadra) => total + (squadra.giocatori?.length || 0), 0);
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
        } catch (error) {
            console.error('❌ Errore chiusura browser:', error);
        }
    }
}

export default PlaywrightScraper; 