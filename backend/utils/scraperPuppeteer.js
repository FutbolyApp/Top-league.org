import puppeteer from 'puppeteer';
import cron from 'node-cron';
import { getDb } from '../db/config.js';

const db = getDb();

class FantacalcioScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.sessionCookies = [];
        this.tipoLega = null;
    }

    async init() {
        try {
            console.log('🔧 Inizializzazione browser Puppeteer con profilo persistente...');
            
            // Crea una directory per il profilo persistente
            const userDataDir = './puppeteer_profile';
            
            this.browser = await puppeteer.launch({
                headless: true,
                userDataDir: userDataDir,
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
                    '--mute-audio',
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
                    '--disable-renderer-backgrounding'
                ],
                timeout: 30000
            });
            
            this.page = await this.browser.newPage();
            
            // Configura viewport e user agent realistico
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Nascondi che siamo Puppeteer
            await this.page.evaluateOnNewDocument(() => {
                delete navigator.__proto__.webdriver;
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });
            
            // Abilita JavaScript e cookies
            await this.page.setJavaScriptEnabled(true);
            
            // Imposta headers realistici
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
            
            console.log('✅ Browser Puppeteer inizializzato con profilo persistente');
            return true;
        } catch (error) {
            console.error('❌ Errore nell\'inizializzazione del browser:', error);
            return false;
        }
    }

    async testSiteConnectivity(url) {
        try {
            console.log(`🌐 Test connessione a: ${url}`);
            
            const response = await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 20000
            });
            
            if (response && response.ok()) {
                console.log('✅ Sito raggiungibile');
                return true;
            } else {
                console.log(`❌ Sito non raggiungibile: ${response?.status()}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Errore connessione: ${error.message}`);
            return false;
        }
    }

    async login(username, password) {
        try {
            console.log('🔐 Login semplice su Fantacalcio.it...');
            
            // Vai alla pagina di login
            await this.page.goto('https://www.fantacalcio.it/login', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            console.log('📄 Pagina di login caricata');
            
            // Aspetta un po' per eventuali popup
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Chiudi popup cookie se presente
            try {
                const cookieButton = await this.page.$('button[class*="accept"], button[class*="cookie"], button[class*="consent"]');
                if (cookieButton) {
                    await cookieButton.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log('🍪 Popup cookie chiuso');
                }
            } catch (e) {
                // Ignora errori cookie
            }
            
            // Trova e compila i campi
            console.log('📝 Inserimento credenziali...');
            
            // Username
            const usernameField = await this.page.$('input[name="username"], input[name="email"], input[type="email"]');
            if (!usernameField) {
                console.log('❌ Campo username non trovato');
                return false;
            }
            await usernameField.click();
            await usernameField.type(username, { delay: 100 });
            
            // Password
            const passwordField = await this.page.$('input[name="password"], input[type="password"]');
            if (!passwordField) {
                console.log('❌ Campo password non trovato');
                return false;
            }
            await passwordField.click();
            await passwordField.type(password, { delay: 100 });
            
            // Clicca login
            console.log('🖱️ Click login...');
            const loginButton = await this.page.$('button[type="submit"], input[type="submit"]');
            if (loginButton) {
                await loginButton.click();
            } else {
                await this.page.keyboard.press('Enter');
            }
            
            // Aspetta il redirect
            console.log('⏳ Attesa risposta login...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Verifica se il login è riuscito
            const currentUrl = this.page.url();
            console.log(`📍 URL dopo login: ${currentUrl}`);
            
            // Se non siamo più nella pagina di login, è riuscito
            if (!currentUrl.includes('login') && !currentUrl.includes('signin')) {
                console.log('✅ Login riuscito!');
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

    async acceptCookiesIfPresent() {
        // Metodo rimosso - non più necessario
    }

    async acceptAllCookiesIfPresent() {
        // Metodo rimosso - non più necessario
    }

    async acceptAllPrivacyPopups() {
        // Clicca tutti i bottoni con testo accetta/accept/consenti/ok/continua/chiudi/agree/ho capito/continue senza accettare
        const keywords = [
            'accetta', 'accept', 'consenti', 'ok', 'continua', 'chiudi', 'agree', 'ho capito', 'continue', 'continue without accepting', 'rifiuta', 'reject', 'manage', 'gestisci', 'impostazioni', 'settings'
        ];
        const buttons = await this.page.$$('button, input[type="button"], input[type="submit"]');
        for (const btn of buttons) {
            const text = (await this.page.evaluate(el => el.innerText || el.value || '', btn)).toLowerCase();
            if (keywords.some(k => text.includes(k))) {
                try {
                    await btn.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log(`🍪/🔒 Popup privacy/cookie accettato con testo: ${text}`);
                } catch (e) {}
            }
        }
    }

    async scrapeRose(leagueUrl, tournamentId = null) {
        try {
            console.log(`📊 Scraping rose da: ${leagueUrl}`);
            await this.page.goto(leagueUrl, {
                    waitUntil: 'networkidle2', 
                timeout: 30000
            });
            await this.acceptAllPrivacyPopups();
                await new Promise(resolve => setTimeout(resolve, 5000));
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
                        const giocatoreRuolo = cells[0]?.textContent?.trim();
                        const fvMp = cells[2]?.textContent?.trim();
                        const giocatoreSquadra = cells[3]?.textContent?.trim();
                        const qi = cells[cells.length-2]?.textContent?.trim(); // Penultima colonna
                        const giocatoreQuotazione = cells[cells.length-1]?.textContent?.trim(); // Ultima colonna
                        
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
                                    fvMp: fvMp || '0.0',
                                    qi: qi || '0.0'
                                });
                            }
                        }
                    }
                });
                
                // Se non abbiamo trovato nulla, prova un approccio alternativo
                if (squadre.length === 0) {
                    console.log('🔄 Nessuna squadra trovata, prova approccio alternativo...');
                    
                    // Cerca tutti i link che potrebbero essere squadre
                    const allLinks = document.querySelectorAll('a');
                    allLinks.forEach(link => {
                        const linkText = link.textContent?.trim();
                        const href = link.href;
                        
                        if (linkText && linkText.length > 2 && linkText.length < 30) {
                            // Se il link contiene "rose" o sembra essere una squadra
                            if (href && (href.includes('rose') || href.includes('squadra'))) {
                                console.log(`🏆 Trovata squadra via link: ${linkText}`);
                                squadre.push({
                                    nome: linkText,
                                    giocatori: []
                                });
                            }
                        }
                    });
                }
                
                console.log(`✅ Risultato finale: ${squadre.length} squadre trovate`);
                squadre.forEach(s => {
                    console.log(`  - ${s.nome}: ${s.giocatori.length} giocatori`);
                });
                
                return squadre;
            });
            
            console.log(`✅ Rose estratte: ${roseData.length} squadre trovate`);
            
            // Debug: log dettagliato dei risultati
            roseData.forEach((squadra, index) => {
                console.log(`Squadra ${index + 1}: ${squadra.nome} (${squadra.giocatori.length} giocatori)`);
                squadra.giocatori.forEach((giocatore, gIndex) => {
                    console.log(`  - ${gIndex + 1}. ${giocatore.nome} (${giocatore.ruolo}) - ${giocatore.squadra}`);
                });
            });
            
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
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            await this.acceptAllPrivacyPopups();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
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
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            await this.acceptAllPrivacyPopups();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
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
                waitUntil: 'networkidle2',
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

    async scrapeMercato(mercatoUrl) {
        try {
            console.log(`💰 Scraping mercato da: ${mercatoUrl}`);
            
            await this.page.goto(mercatoUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            await this.acceptAllPrivacyPopups();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
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

    async testUrls(leagueUrl, scrapingUrls, credentials) {
        try {
            console.log(`🔗 Test URL per: ${leagueUrl}`);
            
            if (!await this.init()) {
                throw new Error('Impossibile inizializzare il browser Puppeteer');
            }

            if (!await this.login(credentials.username, credentials.password)) {
                throw new Error('Login fallito - credenziali non valide');
            }

            const results = {
                leagueUrl,
                urls: {}
            };

            // Testa ogni URL di scraping
            for (const [key, url] of Object.entries(scrapingUrls)) {
                if (url) {
                    try {
                        console.log(`🔍 Testando ${key}: ${url}`);
                        
                        const response = await this.page.goto(url, {
                            waitUntil: 'domcontentloaded',
                            timeout: 15000
                        });
                        
                        const status = response.status();
                        const exists = status === 200;
                        
                        results.urls[key] = {
                            url,
                            status,
                            exists,
                            error: null
                        };
                        
                        console.log(`✅ ${key}: ${status} - ${exists ? 'ESISTE' : 'NON ESISTE'}`);
                        
                    } catch (error) {
                        results.urls[key] = {
                            url,
                            status: 'ERROR',
                            exists: false,
                            error: error.message
                        };
                        
                        console.log(`❌ ${key}: ERRORE - ${error.message}`);
                    }
                }
            }

            await this.close();
            
            console.log('✅ Test URL completato');
            return results;

        } catch (error) {
            console.error('❌ Errore test URL:', error);
            await this.close();
            throw error;
        }
    }

    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 Browser Puppeteer chiuso');
            }
        } catch (error) {
            console.error('❌ Errore chiusura browser:', error);
        }
    }

    async testCredentialsOnly(username, password) {
        try {
            console.log('🔐 Test credenziali con Puppeteer...');
            
            await this.init();
            
            // Test di connessione al sito
            const isConnected = await this.testSiteConnectivity('https://leghe.fantacalcio.it');
            if (!isConnected) {
                throw new Error('Impossibile connettersi al sito fantacalcio.it');
            }
            
            // Prova il login
            const loginSuccess = await this.login(username, password);
            
            await this.close();
            
            return {
                success: loginSuccess,
                message: loginSuccess ? 
                    '✅ Login riuscito con Puppeteer' : 
                    '❌ Login fallito con Puppeteer'
            };

        } catch (error) {
            console.error('❌ Errore test credenziali Puppeteer:', error);
            await this.close();
            return {
                success: false,
                error: error.message,
                message: '❌ Errore durante il test delle credenziali'
            };
        }
    }

    async logCookies(step) {
        const cookies = await this.page.cookies();
        console.log(`🍪 [${step}] Cookies:`, cookies);
    }

    async scrapeLeague(leagueUrl, scrapingUrls, credentials, tournamentId = null, legaId = null) {
        try {
            console.log('🚀 Inizio scraping con gestione sessione robusta');
            
            if (!await this.init()) {
                throw new Error('Impossibile inizializzare il browser Puppeteer');
            }
            
            // STEP 1: LOGIN INIZIALE
            console.log('🔐 STEP 1: Login iniziale');
            await this.page.goto('https://www.fantacalcio.it/login', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            await this.acceptAllPrivacyPopups();
            
            // Fai login
            const loginSuccess = await this.login(credentials.username, credentials.password);
            if (!loginSuccess) {
                throw new Error('Login iniziale fallito');
            }
            
            console.log('✅ Login iniziale completato');
            await this.logCookies('dopo_login');
            
            // Salva i cookie di sessione
            await this.saveSessionCookies();

            // STEP 2: VAI ALLE PAGINE DI SCRAPING
            console.log('🌐 STEP 2: Navigazione alle pagine di scraping');
            
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

            // Funzione helper per navigare e fare scraping
            const navigateAndScrape = async (url, step, scrapeFunction) => {
                console.log(`📍 Navigazione a: ${url}`);
                
                // Verifica se siamo ancora loggati prima di navigare
                if (!(await this.ensureLoggedIn(credentials))) {
                    throw new Error(`Impossibile mantenere il login per ${step}`);
                }
                
                // Naviga alla pagina
                await this.page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                
                await this.acceptAllPrivacyPopups();
                await this.logCookies(`pagina_${step}`);
                
                // Verifica di nuovo se siamo loggati dopo la navigazione
                if (!(await this.ensureLoggedIn(credentials))) {
                    throw new Error(`Login perso dopo navigazione a ${step}`);
                }
                
                // Esegui lo scraping
                return await scrapeFunction();
            };

            // Scraping Rose
            if (scrapingUrls.rose) {
                console.log(`📊 Scraping rose: ${scrapingUrls.rose}`);
                try {
                    results.rose = await navigateAndScrape(
                        scrapingUrls.rose, 
                        'rose', 
                        () => this.scrapeRose(scrapingUrls.rose, tournamentId)
                    );
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
                    results.classifica = await navigateAndScrape(
                        scrapingUrls.classifica, 
                        'classifica', 
                        () => this.scrapeClassifica(scrapingUrls.classifica)
                    );
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
                    results.voti = await navigateAndScrape(
                        scrapingUrls.voti, 
                        'voti', 
                        () => this.scrapeVoti(scrapingUrls.voti)
                    );
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
                    results.formazioni = await navigateAndScrape(
                        scrapingUrls.formazioni, 
                        'formazioni', 
                        () => this.scrapeFormazioni(scrapingUrls.formazioni)
                    );
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
                    results.mercato = await navigateAndScrape(
                        scrapingUrls.mercato, 
                        'mercato', 
                        () => this.scrapeMercato(scrapingUrls.mercato)
                    );
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

            // Salva nel database se necessario
            if (legaId && results.rose && !results.rose.error) {
                console.log('💾 Salvataggio dati nel database...');
                const dbResults = await this.saveRoseToDatabase(legaId, results.rose);
                results.database = dbResults;
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

    async saveRoseToDatabase(legaId, roseData) {
        try {
            console.log(`💾 Salvataggio rose di scraping nel database per lega ${legaId}...`);
            
            let squadreSalvate = 0;
            let giocatoriSalvati = 0;
            
            for (const squadra of roseData) {
                // Salva la squadra nella tabella di scraping
                const squadraId = await this.saveSquadraScraping(legaId, squadra.nome);
                squadreSalvate++;
                
                // Salva i giocatori della squadra nella tabella di scraping
                for (const giocatore of squadra.giocatori) {
                    await this.saveGiocatoreScraping(legaId, squadraId, giocatore);
                    giocatoriSalvati++;
                }
            }

            // Sincronizza QA/QI nella tabella principale
            await this.syncQAQIGiocatoriMainTable(legaId, roseData);
            
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
        return new Promise((resolve, reject) => {
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
                            'INSERT INTO squadre_scraping (lega_id, nome, data_scraping, fonte_scraping) VALUES (?, ?, datetime("now"), "puppeteer")',
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
        return new Promise((resolve, reject) => {
            // Normalizza il ruolo
            const ruolo = this.normalizeRuolo(giocatore.ruolo);
            
            // Mapping corretto dei dati
            const squadraReale = giocatore.squadra; // squadra reale (colonna 3)
            const quotazione = parseFloat(giocatore.quotazione) || 1.0; // quotazione (ultima colonna)
            const qi = parseFloat(giocatore.qi) || 0.0; // QI (penultima colonna)
            const fvMp = giocatore.fvMp || '0.0'; // FV MP (colonna 2)
            
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
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), "puppeteer")`,
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

    async debugPageStructure(url) {
        try {
            console.log(`🔍 DEBUG: Analisi struttura pagina ${url}`);
            
            await this.page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const pageStructure = await this.page.evaluate(() => {
                const structure = {
                    url: window.location.href,
                    title: document.title,
                    tables: [],
                    links: [],
                    textContent: [],
                    forms: [],
                    divs: []
                };
                
                // Analizza tutte le tabelle
                document.querySelectorAll('table').forEach((table, index) => {
                    const tableInfo = {
                        index,
                        id: table.id,
                        className: table.className,
                        rows: table.querySelectorAll('tr').length,
                        headers: [],
                        sampleData: []
                    };
                    
                    // Analizza header
                    table.querySelectorAll('th').forEach(th => {
                        tableInfo.headers.push(th.textContent?.trim());
                    });
                    
                    // Analizza prime righe di dati
                    table.querySelectorAll('tr').forEach((row, rowIndex) => {
                        if (rowIndex < 5) { // Solo prime 5 righe
                            const rowData = [];
                            row.querySelectorAll('td').forEach(td => {
                                rowData.push(td.textContent?.trim());
                            });
                            if (rowData.length > 0) {
                                tableInfo.sampleData.push(rowData);
                            }
                        }
                    });
                    
                    structure.tables.push(tableInfo);
                });
                
                // Analizza tutti i link
                document.querySelectorAll('a').forEach((link, index) => {
                    if (index < 50) { // Limita a 50 link
                        structure.links.push({
                            text: link.textContent?.trim(),
                            href: link.href,
                            className: link.className
                        });
                    }
                });
                
                // Analizza contenuto testuale
                document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div').forEach((el, index) => {
                    if (index < 100) { // Limita a 100 elementi
                        const text = el.textContent?.trim();
                        if (text && text.length > 2 && text.length < 100) {
                            structure.textContent.push({
                                tag: el.tagName.toLowerCase(),
                                text: text,
                                className: el.className
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

    async isStillLoggedIn() {
        try {
            // Verifica che la pagina sia ancora valida
            if (!this.page || this.page.isClosed()) {
                console.log('❌ Pagina chiusa o non valida');
                return false;
            }
            
            // Controlla se siamo ancora loggati cercando elementi che indicano login
            const loginStatus = await this.page.evaluate(() => {
                try {
                    const currentUrl = window.location.href;
                    
                    // Se siamo su leghe.fantacalcio.it, controlla elementi specifici
                    if (currentUrl.includes('leghe.fantacalcio.it')) {
                        // Cerca elementi specifici di leghe.fantacalcio.it che indicano che NON siamo loggati
                        const loginElements = document.querySelectorAll('a[href*="login"], button, input[type="submit"], .login-button, .btn-login');
                        let hasLoginElements = false;
                        
                        loginElements.forEach(el => {
                            const text = (el.textContent || el.value || '').toLowerCase();
                            if (text.includes('accedi') || text.includes('login') || text.includes('entra') || text.includes('sign in')) {
                                hasLoginElements = true;
                            }
                        });
                        
                        if (hasLoginElements) {
                            return { loggedIn: false, reason: 'Elementi di login trovati su leghe.fantacalcio.it' };
                        }
                        
                        // Cerca elementi che indicano che siamo loggati su leghe.fantacalcio.it
                        const loggedInElements = document.querySelectorAll('a[href*="logout"], a[href*="profilo"], a[href*="account"], .user-menu, .profile-link');
                        if (loggedInElements.length > 0) {
                            return { loggedIn: true, reason: 'Elementi di profilo/logout trovati su leghe.fantacalcio.it' };
                        }
                        
                        // Se siamo su una pagina di lega e non ci sono elementi di login, probabilmente siamo loggati
                        if (currentUrl.includes('/fantaleague') || currentUrl.includes('/rose') || currentUrl.includes('/classifica')) {
                            return { loggedIn: true, reason: 'Siamo su una pagina di lega senza elementi di login' };
                        }
                    }
                    
                    // Controlli generici per altri siti
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
                    
                    // Cerca elementi che indicano che siamo loggati
                    const logoutElements = document.querySelectorAll('a[href*="logout"], a[href*="profilo"], a[href*="account"], a[href*="area-utente"]');
                    if (logoutElements.length > 0) {
                        return { loggedIn: true, reason: 'Elementi di logout/profilo trovati' };
                    }
                    
                    // Controlla se siamo nella pagina di login
                    if (currentUrl.includes('login') || currentUrl.includes('signin')) {
                        return { loggedIn: false, reason: 'Siamo nella pagina di login' };
                    }
                    
                    // Controlla se ci sono form di login
                    const loginForms = document.querySelectorAll('form[action*="login"], form input[name="username"], form input[name="password"]');
                    if (loginForms.length > 0) {
                        return { loggedIn: false, reason: 'Form di login trovati' };
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

    async saveSessionCookies() {
        try {
            const cookies = await this.page.cookies();
            this.sessionCookies = cookies;
            console.log(`💾 Salvati ${cookies.length} cookie di sessione`);
            return cookies;
        } catch (error) {
            console.error('❌ Errore salvataggio cookie:', error);
            return [];
        }
    }

    async restoreSessionCookies() {
        try {
            if (this.sessionCookies && this.sessionCookies.length > 0) {
                await this.page.setCookie(...this.sessionCookies);
                console.log(`🔄 Ripristinati ${this.sessionCookies.length} cookie di sessione`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Errore ripristino cookie:', error);
            return false;
        }
    }

    async ensureLoggedIn(credentials) {
        try {
            console.log('🔍 Verifica stato login...');
            
            // Controlla se siamo ancora loggati
            if (await this.isStillLoggedIn()) {
                console.log('✅ Ancora loggato, continuo...');
                return true;
            }
            
            console.log('❌ Non più loggato, rifaccio login...');
            
            // Ripristina i cookie salvati
            await this.restoreSessionCookies();
            
            // Aspetta un po' e ricontrolla
            await new Promise(resolve => setTimeout(resolve, 2000));
            if (await this.isStillLoggedIn()) {
                console.log('✅ Login ripristinato con i cookie salvati');
                return true;
            }
            
            // Se ancora non loggato, rifai il login completo
            console.log('🔄 Rifaccio login completo...');
            const loginSuccess = await this.login(credentials.username, credentials.password);
            
            if (loginSuccess) {
                // Salva i nuovi cookie di sessione
                await this.saveSessionCookies();
                console.log('✅ Login completato e cookie salvati');
                return true;
            } else {
                console.log('❌ Login fallito');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Errore ensureLoggedIn:', error);
            return false;
        }
    }

    // NUOVO METODO: Scraping ibrido con login manuale
    async initForManualLogin() {
        try {
            console.log('🔧 Inizializzazione browser Puppeteer per login manuale...');
            
            // Crea una directory per il profilo persistente
            const userDataDir = './puppeteer_profile';
            
            this.browser = await puppeteer.launch({
                headless: false, // BROWSER VISIBILE
                userDataDir: userDataDir,
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
                    '--mute-audio',
                    '--window-size=1920,1080',
                    '--start-maximized'
                ],
                timeout: 30000
            });
            
            this.page = await this.browser.newPage();
            
            // Configura viewport e user agent realistico
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Nascondi che siamo Puppeteer
            await this.page.evaluateOnNewDocument(() => {
                delete navigator.__proto__.webdriver;
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            });
            
            // Abilita JavaScript e cookies
            await this.page.setJavaScriptEnabled(true);
            
            // Imposta headers realistici
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
            
            console.log('✅ Browser Puppeteer inizializzato per login manuale');
            return true;
        } catch (error) {
            console.error('❌ Errore nell\'inizializzazione del browser per login manuale:', error);
            return false;
        }
    }

    async waitForManualLogin(leagueUrl, credentials, maxWaitTime = 300000) { // 5 minuti di attesa
        try {
            console.log('🔐 Attendo login manuale...');
            console.log('📝 ISTRUZIONI PER L\'UTENTE:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('1. Il browser si aprirà automaticamente');
            console.log('2. Fai login manualmente su fantacalcio.it');
            console.log('3. Una volta loggato, il sistema continuerà automaticamente');
            console.log('4. Hai 5 minuti per completare il login');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // Vai direttamente alla pagina della lega
            console.log(`🌐 Navigazione alla lega: ${leagueUrl}`);
            await this.page.goto(leagueUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            console.log('📄 Pagina della lega aperta, attendo login manuale...');
            
            // Attendi che l'utente faccia login
            const startTime = Date.now();
            let isLoggedIn = false;
            let checkCount = 0;
            let consecutiveErrors = 0;
            const maxConsecutiveErrors = 5;
            
            while (Date.now() - startTime < maxWaitTime && !isLoggedIn) {
                // Controlla se siamo loggati ogni 3 secondi
                await new Promise(resolve => setTimeout(resolve, 3000));
                checkCount++;
                
                try {
                    isLoggedIn = await this.isStillLoggedIn();
                    consecutiveErrors = 0; // Reset error counter on success
                    
                    if (isLoggedIn) {
                        console.log('✅ Login manuale rilevato!');
                        break;
                    } else {
                        const elapsed = Math.floor((Date.now() - startTime) / 1000);
                        const remaining = Math.floor((maxWaitTime - (Date.now() - startTime)) / 1000);
                        console.log(`⏳ Controllo ${checkCount}: Ancora in attesa del login... (${elapsed}s trascorsi, ${remaining}s rimanenti)`);
                    }
                } catch (error) {
                    consecutiveErrors++;
                    console.log(`⏳ Controllo ${checkCount}: Errore controllo login - ${error.message} (errore consecutivo ${consecutiveErrors}/${maxConsecutiveErrors})`);
                    
                    // Se troppi errori consecutivi, potrebbe esserci un problema serio
                    if (consecutiveErrors >= maxConsecutiveErrors) {
                        console.log('⚠️ Troppi errori consecutivi, potrebbe esserci un problema con la pagina');
                        // Prova a ricaricare la pagina
                        try {
                            await this.page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
                            console.log('🔄 Pagina ricaricata, riprovo...');
                            consecutiveErrors = 0;
                        } catch (reloadError) {
                            console.log('❌ Errore nel ricaricare la pagina:', reloadError.message);
                        }
                    }
                }
            }
            
            if (!isLoggedIn) {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                throw new Error(`Timeout: Login manuale non completato entro ${elapsed} secondi`);
            }
            
            // Salva i cookie di sessione
            await this.saveSessionCookies();
            console.log('💾 Cookie di sessione salvati');
            
            return true;
            
        } catch (error) {
            console.error('❌ Errore durante l\'attesa del login manuale:', error);
            return false;
        }
    }

    async scrapeLeagueWithManualLogin(leagueUrl, scrapingUrls, credentials, tournamentId = null, legaId = null) {
        try {
            console.log('🚀 Inizio scraping con login manuale');
            
            if (!await this.initForManualLogin()) {
                throw new Error('Impossibile inizializzare il browser per login manuale');
            }
            
            // STEP 1: ATTENDI LOGIN MANUALE
            console.log('🔐 STEP 1: Attendo login manuale');
            const loginSuccess = await this.waitForManualLogin(leagueUrl, credentials);
            if (!loginSuccess) {
                throw new Error('Login manuale non completato');
            }
            
            console.log('✅ Login manuale completato');
            await this.logCookies('dopo_login_manuale');
            
            // STEP 2: VAI ALLE PAGINE DI SCRAPING
            console.log('🌐 STEP 2: Navigazione alle pagine di scraping');
            
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

            // Funzione helper per navigare e fare scraping
            const navigateAndScrape = async (url, step, scrapeFunction) => {
                console.log(`📍 Navigazione a: ${url}`);
                
                // Naviga alla pagina
                await this.page.goto(url, {
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                
                await this.acceptAllPrivacyPopups();
                await this.logCookies(`pagina_${step}`);
                
                // Verifica se siamo ancora loggati
                if (!(await this.isStillLoggedIn())) {
                    throw new Error(`Login perso durante navigazione a ${step}`);
                }
                
                // Esegui lo scraping
                return await scrapeFunction();
            };

            // Scraping Rose
            if (scrapingUrls.rose) {
                console.log(`📊 Scraping rose: ${scrapingUrls.rose}`);
                try {
                    results.rose = await navigateAndScrape(
                        scrapingUrls.rose, 
                        'rose', 
                        () => this.scrapeRose(scrapingUrls.rose, tournamentId)
                    );
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
                    results.classifica = await navigateAndScrape(
                        scrapingUrls.classifica, 
                        'classifica', 
                        () => this.scrapeClassifica(scrapingUrls.classifica)
                    );
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
                    results.voti = await navigateAndScrape(
                        scrapingUrls.voti, 
                        'voti', 
                        () => this.scrapeVoti(scrapingUrls.voti)
                    );
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
                    results.formazioni = await navigateAndScrape(
                        scrapingUrls.formazioni, 
                        'formazioni', 
                        () => this.scrapeFormazioni(scrapingUrls.formazioni)
                    );
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
                    results.mercato = await navigateAndScrape(
                        scrapingUrls.mercato, 
                        'mercato', 
                        () => this.scrapeMercato(scrapingUrls.mercato)
                    );
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

            // Salva nel database se necessario
            if (legaId && results.rose && !results.rose.error) {
                console.log('💾 Salvataggio dati nel database...');
                const dbResults = await this.saveRoseToDatabase(legaId, results.rose);
                results.database = dbResults;
            }

            console.log('✅ Scraping con login manuale completato con successo');
            return results;

        } catch (error) {
            console.error('❌ Errore durante lo scraping con login manuale:', error);
            await this.close();
            throw error;
        }
    }

    async getAvailableTournaments() {
        try {
            console.log('🔍 Recupero tornei disponibili...');
            
            if (!this.leagueUrl) {
                throw new Error('leagueUrl non impostata');
            }
            
            // Costruisci l'URL delle competizioni
            const competitionsUrl = this.leagueUrl.replace(/\/[^\/]*$/, '/lista-competizioni');
            console.log(`📍 Navigazione a: ${competitionsUrl}`);
            
            await this.page.goto(competitionsUrl, {
                waitUntil: 'networkidle2',
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
            
            console.log(`✅ Tornei estratti: ${tournaments.length} trovati`);
            tournaments.forEach(t => {
                console.log(`  - ${t.name} (ID: ${t.id})`);
            });
            
            return tournaments;
            
        } catch (error) {
            console.error('❌ Errore recupero tornei:', error);
            throw error;
        }
    }

    // Metodo per impostare il tipo di lega
    setLeagueType(tipoLega) {
        this.tipoLega = tipoLega;
        console.log(`🏆 Tipo lega impostato: ${tipoLega}`);
    }

    // Sincronizza QA/QI nella tabella principale giocatori
    async syncQAQIGiocatoriMainTable(legaId, roseData) {
        return new Promise((resolve, reject) => {
            let updates = 0;
            let errors = 0;
            let historyLogs = 0;
            
            for (const squadra of roseData) {
                for (const giocatore of squadra.giocatori) {
                    // Aggiorna QA (quotazione) e QI (se presente) nella tabella giocatori
                    const qa = parseFloat(giocatore.quotazione) || null;
                    const qi = giocatore.qi !== undefined ? parseFloat(giocatore.qi) : null;
                    
                    // Prima ottieni il giocatore_id dalla tabella principale
                    db.get(
                        'SELECT id, qa FROM giocatori WHERE lega_id = ? AND nome = ? AND squadra_reale = ?',
                        [legaId, giocatore.nome, giocatore.squadra],
                        (err, row) => {
                            if (err) {
                                errors++;
                                console.error(`[SYNC QA/QI] Errore query per ${giocatore.nome}:`, err.message);
                                return;
                            }
                            
                            if (row) {
                                // Aggiorna QA/QI nella tabella principale
                                db.run(
                                    `UPDATE giocatori SET qa = ?, qi = ? WHERE id = ?`,
                                    [qa, qi, row.id],
                                    function(err) {
                                        if (err) {
                                            errors++;
                                            console.error(`[SYNC QA/QI] Errore aggiornamento per ${giocatore.nome}:`, err.message);
                                        } else if (this.changes > 0) {
                                            updates++;
                                            
                                            // Log storico QA se il valore è cambiato
                                            if (qa !== null && row.qa !== qa) {
                                                db.run(
                                                    'INSERT INTO qa_history (giocatore_id, qa_value, fonte) VALUES (?, ?, ?)',
                                                    [row.id, qa, 'scraping'],
                                                    function(err) {
                                                        if (err) {
                                                            console.error(`[QA HISTORY] Errore logging per ${giocatore.nome}:`, err.message);
                                                        } else {
                                                            historyLogs++;
                                                        }
                                                    }
                                                );
                                            }
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
            
            // Attendi un attimo per completare tutte le query
            setTimeout(() => {
                console.log(`[SYNC QA/QI] Aggiornati ${updates} giocatori, errori: ${errors}, log storici: ${historyLogs}`);
                resolve({ updates, errors, historyLogs });
            }, 1000);
        });
    }
}

async function testCredentialsWithPuppeteer(username, password) {
    const scraper = new FantacalcioScraper();
    return await scraper.testCredentialsOnly(username, password);
}

export { testCredentialsWithPuppeteer };

export default FantacalcioScraper;

