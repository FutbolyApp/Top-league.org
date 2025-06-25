import puppeteer from 'puppeteer';
import cron from 'node-cron';

class FantacalcioScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
    }

    async init() {
        try {
            console.log('🔧 Inizializzazione browser Puppeteer...');
            
            this.browser = await puppeteer.launch({
                headless: true,
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
                    '--disable-renderer-backgrounding'
                ],
                timeout: 30000
            });
            
            this.page = await this.browser.newPage();
            
            // Configura viewport e user agent
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Abilita JavaScript e cookies
            await this.page.setJavaScriptEnabled(true);
            
            console.log('✅ Browser Puppeteer inizializzato con successo');
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

    async debugLoginPage() {
        try {
            console.log('🔍 DEBUG AVANZATO - Analisi completa pagina di login...');
            
            // Aspetta che la pagina sia completamente caricata
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Analisi completa della pagina
            const pageAnalysis = await this.page.evaluate(() => {
                const analysis = {
                    url: window.location.href,
                    title: document.title,
                    forms: [],
                    inputs: [],
                    buttons: [],
                    errors: [],
                    cookies: document.cookie,
                    localStorage: Object.keys(localStorage),
                    sessionStorage: Object.keys(sessionStorage)
                };

                // Analizza tutti i form
                document.querySelectorAll('form').forEach((form, index) => {
                    analysis.forms.push({
                        index,
                        action: form.action,
                        method: form.method,
                        id: form.id,
                        className: form.className,
                        enctype: form.enctype
                    });
                });

                // Analizza tutti gli input
                document.querySelectorAll('input').forEach((input, index) => {
                    analysis.inputs.push({
                        index,
                        type: input.type,
                        name: input.name,
                        id: input.id,
                        placeholder: input.placeholder,
                        className: input.className,
                        value: input.value,
                        required: input.required,
                        disabled: input.disabled,
                        visible: input.offsetParent !== null
                    });
                });

                // Analizza tutti i button
                document.querySelectorAll('button').forEach((button, index) => {
                    analysis.buttons.push({
                        index,
                        type: button.type,
                        text: button.textContent?.trim(),
                        id: button.id,
                        className: button.className,
                        disabled: button.disabled,
                        visible: button.offsetParent !== null
                    });
                });

                // Cerca messaggi di errore
                const errorSelectors = [
                    '.error', '.alert', '.alert-danger', '.alert-error',
                    '[class*="error"]', '[class*="alert"]', '[id*="error"]'
                ];
                
                errorSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el.textContent?.trim()) {
                            analysis.errors.push({
                                selector,
                                text: el.textContent.trim(),
                                visible: el.offsetParent !== null
                            });
                        }
                    });
                });

                return analysis;
            });

            console.log('📊 ANALISI COMPLETA PAGINA:');
            console.log(JSON.stringify(pageAnalysis, null, 2));

            // Screenshot della pagina
            await this.takeScreenshot('debug_complete_analysis');

            return pageAnalysis;

        } catch (error) {
            console.error('❌ Errore durante debug pagina:', error);
            return null;
        }
    }

    async login(username, password) {
        try {
            console.log('🔐 Tentativo di login su Fantacalcio.it...');
            
            await this.page.goto('https://www.fantacalcio.it/login', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            console.log('📄 Pagina di login caricata');
            
            // Debug avanzato della pagina
            const debugInfo = await this.debugLoginPage();
            
            // Aspetta un po' per eventuali popup o overlay
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Prova a chiudere eventuali popup di cookie
            try {
                const cookieButtons = [
                    'button[class*="accept"]',
                    'button[class*="cookie"]',
                    'button[class*="consent"]',
                    '.qc-cmp2-accept',
                    '[class*="accept"]',
                    '[class*="cookie"]'
                ];
                
                for (const selector of cookieButtons) {
                    try {
                        const button = await this.page.$(selector);
                        if (button) {
                            await button.click();
                            console.log(`✅ Popup cookie chiuso con: ${selector}`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            break;
                        }
                    } catch (e) {
                        // Ignora errori sui popup
                    }
                }
            } catch (e) {
                console.log('ℹ️ Nessun popup cookie trovato');
            }

            // Analizza la pagina dopo aver chiuso i popup
            const pageAnalysis = await this.page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
                    type: input.type,
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder,
                    className: input.className,
                    visible: input.offsetParent !== null
                }));
                
                const forms = Array.from(document.querySelectorAll('form')).map(form => ({
                    action: form.action,
                    method: form.method,
                    className: form.className
                }));
                
                const buttons = Array.from(document.querySelectorAll('button')).map(button => ({
                    type: button.type,
                    text: button.textContent?.trim(),
                    className: button.className,
                    visible: button.offsetParent !== null
                }));
                
                return {
                    inputs,
                    forms,
                    buttons,
                    currentUrl: window.location.href,
                    pageTitle: document.title
                };
            });

            console.log('🔍 Analisi pagina fantacalcio.it:', JSON.stringify(pageAnalysis, null, 2));
            await this.takeScreenshot('login_page_analysis');

            // Trova i campi di input
            const usernameField = pageAnalysis.inputs.find(input => 
                input.type === 'text' && 
                (input.name === 'username' || input.name === 'email' || input.placeholder?.toLowerCase().includes('username'))
            );
            
            const passwordField = pageAnalysis.inputs.find(input => 
                input.type === 'password' && 
                (input.name === 'password' || input.placeholder?.toLowerCase().includes('password'))
            );
            
            const submitButton = pageAnalysis.buttons.find(button => 
                button.type === 'submit' && 
                button.visible &&
                (button.text?.toLowerCase().includes('login') || button.text?.toLowerCase().includes('accedi'))
            );

            if (!usernameField || !passwordField || !submitButton) {
                console.log('❌ Campi di login non trovati');
                console.log('Username field:', usernameField);
                console.log('Password field:', passwordField);
                console.log('Submit button:', submitButton);
                return false;
            }

            console.log('🔍 Campi trovati:', {
                username: usernameField.name,
                password: passwordField.name,
                submit: submitButton.text
            });

            // Costruisci i selettori corretti SENZA ID vuoti
            const usernameSelector = usernameField.id && usernameField.id.trim() ? 
                `input[name="${usernameField.name}"][id="${usernameField.id}"]` : 
                `input[name="${usernameField.name}"]`;
            
            const passwordSelector = passwordField.id && passwordField.id.trim() ? 
                `input[name="${passwordField.name}"][id="${passwordField.id}"]` : 
                `input[name="${passwordField.name}"]`;
            
            const submitSelector = submitButton.className ? 
                `button[type="submit"][class*="${submitButton.className.split(' ')[0]}"]` : 
                `button[type="submit"]`;

            console.log('🔍 Selettori finali:', {
                username: usernameSelector,
                password: passwordSelector,
                submit: submitSelector
            });

            // Inserisci le credenziali
            await this.page.type(usernameSelector, username);
            console.log(`✅ Username inserito: ${usernameSelector}`);
            
            await this.page.type(passwordSelector, password);
            console.log(`✅ Password inserita: ${passwordSelector}`);

            // Screenshot prima del submit
            await this.takeScreenshot('before_submit');

            // Clicca submit
            await this.page.click(submitSelector);
            console.log(`✅ Submit cliccato: ${submitSelector}`);

            // Aspetta la navigazione con timeout più lungo
            try {
                await this.page.waitForNavigation({ 
                    waitUntil: 'networkidle2', 
                    timeout: 45000 
                });
                console.log('🔄 Navigazione completata');
            } catch (navigationError) {
                console.log('⚠️ Timeout navigazione, verifico comunque il login...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Screenshot dopo il submit
            await this.takeScreenshot('after_submit');

            // Verifica login più robusta
            const isLoggedIn = await this.page.evaluate(() => {
                const currentUrl = window.location.href;
                const pageTitle = document.title;
                
                // Controlla se siamo ancora nella pagina di login
                const loginForm = document.querySelector('form[action*="login"], .login-form, #login-form');
                const loginInputs = document.querySelectorAll('input[type="password"]');
                
                // Controlla se ci sono messaggi di errore
                const errorMessages = document.querySelectorAll('.error, .alert, .alert-danger, [class*="error"]');
                const hasErrors = Array.from(errorMessages).some(el => 
                    el.textContent && el.textContent.trim().length > 0
                );
                
                console.log('🔍 Verifica login:', {
                    currentUrl,
                    pageTitle,
                    hasLoginForm: !!loginForm,
                    passwordInputs: loginInputs.length,
                    hasErrors,
                    errorMessages: Array.from(errorMessages).map(el => el.textContent?.trim()).filter(Boolean)
                });
                
                // Se ci sono errori, login fallito
                if (hasErrors) {
                    return false;
                }
                
                // Se non ci sono form di login e non siamo più nella pagina di login
                if (!loginForm && !currentUrl.includes('login') && !currentUrl.includes('signin')) {
                    return true;
                }
                
                // Se il titolo della pagina è cambiato
                if (!pageTitle.toLowerCase().includes('login') && !pageTitle.toLowerCase().includes('accedi')) {
                    return true;
                }
                
                return false;
            });

            if (isLoggedIn) {
                this.isLoggedIn = true;
                console.log('✅ Login effettuato con successo');
                return true;
            } else {
                console.log('❌ Login fallito');
                await this.takeScreenshot('login_failed');
                return false;
            }

        } catch (error) {
            console.error('❌ Errore durante il login:', error);
            await this.takeScreenshot('login_error');
            return false;
        }
    }

    async scrapeRose(leagueUrl, tournamentId = null) {
        try {
            if (!this.isLoggedIn) {
                throw new Error('Utente non loggato');
            }

            console.log(`📊 Scraping Rose per: ${leagueUrl}`);
            
            let roseUrl = `${leagueUrl}/rose`;
            if (tournamentId) {
                roseUrl += `?id=${tournamentId}`;
            }

            await this.page.goto(roseUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            await this.page.waitForSelector('table, .roster-table, .squadre-table', { timeout: 15000 });

            const roseData = await this.page.evaluate(() => {
                const teams = [];
                const teamSections = document.querySelectorAll('.team-section, .squadra, [class*="team"], [class*="squadra"]');
                
                teamSections.forEach((teamSection, teamIndex) => {
                    const teamName = teamSection.querySelector('.team-name, .squadra-nome, h3, h4')?.textContent?.trim() || `Squadra ${teamIndex + 1}`;
                    
                    const playersTable = teamSection.querySelector('table, .players-table');
                    if (!playersTable) return;

                    const players = [];
                    const rows = playersTable.querySelectorAll('tr');
                    
                    rows.forEach((row, rowIndex) => {
                        if (rowIndex === 0) return;
                        
                        const cells = row.querySelectorAll('td');
                        if (cells.length < 3) return;

                        const player = {
                            nome: cells[0]?.textContent?.trim() || '',
                            ruolo: cells[1]?.textContent?.trim() || '',
                            qAtt: cells[2]?.textContent?.trim() || '',
                            fvMp: cells[3]?.textContent?.trim() || '',
                            squadra: cells[4]?.textContent?.trim() || ''
                        };

                        if (player.nome) {
                            players.push(player);
                        }
                    });

                    if (players.length > 0) {
                        teams.push({
                            nome: teamName,
                            giocatori: players
                        });
                    }
                });

                return teams;
            });

            console.log(`✅ Scraping Rose completato: ${roseData.length} squadre trovate`);
            return roseData;

        } catch (error) {
            console.error('❌ Errore durante lo scraping delle Rose:', error);
            return null;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser chiuso');
        }
    }

    async testCredentialsOnly(username, password) {
        try {
            console.log('🧪 TEST SOLO CREDENZIALI - Inizio test...');
            
            if (!await this.init()) {
                throw new Error('Impossibile inizializzare il browser Puppeteer');
            }

            // Test connessione al sito principale
            if (!await this.testSiteConnectivity('https://www.fantacalcio.it')) {
                throw new Error('Sito Fantacalcio.it non raggiungibile');
            }

            console.log('🔐 Test login con credenziali...');
            const loginResult = await this.login(username, password);
            
            if (loginResult) {
                console.log('✅ TEST CREDENZIALI: Login riuscito - credenziali valide');
                await this.close();
                return { success: true, message: 'Credenziali valide - Login effettuato con successo' };
            } else {
                console.log('❌ TEST CREDENZIALI: Login fallito - credenziali non valide');
                await this.close();
                return { success: false, message: 'Credenziali non valide - Login fallito' };
            }

        } catch (error) {
            console.error('❌ Errore durante test credenziali:', error);
            await this.close();
            return { success: false, message: `Errore durante il test: ${error.message}` };
        }
    }

    async scrapeLeague(leagueUrl, credentials, tournamentId = null) {
        try {
            console.log(`🚀 Avvio scraping completo per: ${leagueUrl}`);
            
            if (!await this.init()) {
                throw new Error('Impossibile inizializzare il browser Puppeteer');
            }

            // Test connessione al sito principale
            if (!await this.testSiteConnectivity('https://www.fantacalcio.it')) {
                throw new Error('Sito Fantacalcio.it non raggiungibile - verifica la connessione internet');
            }

            console.log('🔐 Tentativo di login...');
            if (!await this.login(credentials.username, credentials.password)) {
                throw new Error('Login fallito - credenziali non valide o sito non raggiungibile');
            }

            console.log('📊 Avvio scraping delle rose...');
            const roseResults = await this.scrapeRose(leagueUrl, tournamentId);
            
            if (!roseResults || roseResults.length === 0) {
                throw new Error('Nessuna squadra trovata - verifica l\'URL della lega');
            }

            const results = {
                rose: roseResults,
                summary: {
                    squadre_trovate: roseResults.length,
                    giocatori_totali: roseResults.reduce((total, squadra) => total + (squadra.giocatori?.length || 0), 0)
                }
            };

            await this.close();
            
            console.log('✅ Scraping completo terminato con successo');
            return results;

        } catch (error) {
            console.error('❌ Errore durante lo scraping completo:', error);
            await this.close();
            throw error; // Rilancia l'errore per gestirlo nel controller
        }
    }

    async takeScreenshot(filename) {
        try {
            const screenshotPath = `./debug_${filename}_${Date.now()}.png`;
            await this.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true 
            });
            console.log(`📸 Screenshot salvato: ${screenshotPath}`);
            return screenshotPath;
        } catch (error) {
            console.log(`❌ Errore screenshot: ${error.message}`);
            return null;
        }
    }
}

export default FantacalcioScraper;
