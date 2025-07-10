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

async function testFormazioniApiSimulation() {
    console.log('🚀 Test simulazione API frontend...');
    
    // Parametri esatti del frontend
    const lega_id = 76;
    const leagueUrl = 'https://euroleghe.fantacalcio.it/topleague/';
    const username = 'nemeneme';
    const password = 'laziomerda';
    const tournamentId = 295;
    const giornata = 22;
    
    console.log('📋 Parametri frontend:');
    console.log('  - Lega ID:', lega_id);
    console.log('  - URL:', leagueUrl);
    console.log('  - Username:', username);
    console.log('  - Tournament ID:', tournamentId);
    console.log('  - Giornata:', giornata);
    
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // 1. Login
        console.log('🔐 Login...');
        await page.goto('https://euroleghe.fantacalcio.it/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await closeCookiePopup(page);
        
        await page.fill('input[placeholder="Username"]', username);
        await page.fill('input[placeholder="Password"]', password);
        await page.click('button:has-text("LOGIN")');
        
        // 2. Aspetta login
        console.log('⏳ Attendo login...');
        await page.waitForTimeout(5000);
        
        // 3. Costruisci l'URL esatto come fa il backend
        console.log('🌐 Costruzione URL come backend...');
        const formazioniUrl = giornata && tournamentId 
            ? `${leagueUrl}formazioni/${giornata}?id=${tournamentId}`
            : `${leagueUrl}formazioni${tournamentId ? `?id=${tournamentId}` : ''}`;
        
        console.log('URL costruito:', formazioniUrl);
        
        // 4. Naviga alle formazioni
        console.log('⚽ Navigazione alle formazioni...');
        await page.goto(formazioniUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        await closeCookiePopup(page);
        
        // 5. Screenshot
        await page.screenshot({ path: 'api_simulation_formazioni.png', fullPage: true });
        console.log('✅ Screenshot salvato');
        
        // 6. Test del sistema di scraping aggiornato
        console.log('🔍 Test sistema scraping aggiornato...');
        
        const formazioniData = await page.evaluate((giornata) => {
            const formazioni = [];
            
            console.log('🔍 Analisi pagina formazioni...');
            
            // Trova tutte le tabelle nella pagina
            const allTables = document.querySelectorAll('table');
            console.log(`📊 Trovate ${allTables.length} tabelle totali`);
            
            // Analizza ogni tabella per trovare formazioni
            for (let i = 0; i < allTables.length; i++) {
                const table = allTables[i];
                const tableText = table.textContent?.toLowerCase() || '';
                
                // Controlla se questa tabella contiene dati di formazione
                const isFormazioneTable = tableText.includes('titolar') || 
                                        tableText.includes('panchin') || 
                                        tableText.includes('v') || 
                                        tableText.includes('fv') ||
                                        table.querySelectorAll('th, td').length > 0;
                
                if (isFormazioneTable) {
                    console.log(`📋 Analisi tabella ${i + 1}: ${tableText.substring(0, 100)}...`);
                    
                    // Estrai righe con dati
                    const rows = Array.from(table.querySelectorAll('tr'));
                    const dataRows = rows.filter(row => {
                        const cells = row.querySelectorAll('td');
                        return cells.length > 0 && cells[0].textContent?.trim();
                    });
                    
                    if (dataRows.length > 0) {
                        // Determina il tipo di tabella (titolari, panchina, altri punti)
                        let tableType = 'unknown';
                        if (tableText.includes('titolar')) tableType = 'titolari';
                        else if (tableText.includes('panchin')) tableType = 'panchina';
                        else if (tableText.includes('altri punti')) tableType = 'altri_punti';
                        else if (tableText.includes('v') && tableText.includes('fv')) tableType = 'giocatori';
                        
                        // Estrai i dati dalla tabella
                        const tableData = dataRows.map(row => {
                            const cells = Array.from(row.querySelectorAll('td'));
                            if (cells.length >= 4) {
                                return {
                                    nome: cells[0]?.textContent?.trim() || '',
                                    ruolo: cells[1]?.textContent?.trim() || '',
                                    voto: cells[2]?.textContent?.trim() || '',
                                    fv: cells[3]?.textContent?.trim() || ''
                                };
                            } else if (cells.length >= 1) {
                                return {
                                    nome: cells[0]?.textContent?.trim() || '',
                                    ruolo: '',
                                    voto: '',
                                    fv: ''
                                };
                            }
                            return null;
                        }).filter(Boolean);
                        
                        // Trova il nome della squadra (cerca nei div parent)
                        let squadraNome = '';
                        let parent = table.parentElement;
                        let searchDepth = 0;
                        
                        while (parent && !squadraNome && searchDepth < 5) {
                            // Cerca elementi che potrebbero contenere il nome della squadra
                            const teamElements = parent.querySelectorAll('h1, h2, h3, h4, h5, h6, .team-name, .squadra-nome, .competition-current-name, [class*="team"], [class*="squadra"]');
                            
                            for (const element of teamElements) {
                                const text = element.textContent?.trim();
                                if (text && text.length > 2 && text.length < 50 && 
                                    !text.toLowerCase().includes('formazione') &&
                                    !text.toLowerCase().includes('titolar') &&
                                    !text.toLowerCase().includes('panchin')) {
                                    squadraNome = text;
                                    break;
                                }
                            }
                            
                            if (!squadraNome) {
                                parent = parent.parentElement;
                                searchDepth++;
                            }
                        }
                        
                        // Cerca una formazione esistente per questa squadra
                        let formazione = formazioni.find(f => f.squadra === squadraNome);
                        
                        if (!formazione) {
                            formazione = {
                                squadra: squadraNome || `Squadra ${formazioni.length + 1}`,
                                giornata: giornata || 'N/A',
                                titolari: [],
                                panchina: [],
                                altri_punti: [],
                                totale_titolari: 0,
                                totale_panchina: 0
                            };
                            formazioni.push(formazione);
                        }
                        
                        // Aggiungi i dati alla formazione appropriata
                        if (tableType === 'titolari') {
                            formazione.titolari = tableData;
                            formazione.totale_titolari = tableData.length;
                        } else if (tableType === 'panchina') {
                            formazione.panchina = tableData;
                            formazione.totale_panchina = tableData.length;
                        } else if (tableType === 'altri_punti') {
                            formazione.altri_punti = tableData;
                        } else if (tableType === 'giocatori') {
                            // Se non riusciamo a determinare il tipo, aggiungiamo ai titolari
                            formazione.titolari = tableData;
                            formazione.totale_titolari = tableData.length;
                        }
                        
                        console.log(`✅ Tabella ${i + 1} (${tableType}): ${tableData.length} giocatori per ${formazione.squadra}`);
                    }
                }
            }

            console.log(`🎯 Formazioni estratte: ${formazioni.length} squadre trovate`);
            formazioni.forEach((f, i) => {
                console.log(`  Squadra ${i + 1}: ${f.squadra} - ${f.titolari.length} titolari, ${f.panchina.length} panchina`);
            });
            
            return formazioni;
        }, giornata);
        
        console.log(`✅ SIMULAZIONE API COMPLETATA!`);
        console.log(`📊 Formazioni estratte: ${formazioniData.length} squadre trovate`);
        
        // Mostra dettagli delle formazioni
        formazioniData.forEach((formazione, i) => {
            console.log(`\n🏆 Squadra ${i + 1}: ${formazione.squadra}`);
            console.log(`   👥 Titolari: ${formazione.totale_titolari}`);
            console.log(`   🪑 Panchina: ${formazione.totale_panchina}`);
            
            if (formazione.titolari.length > 0) {
                console.log(`   🏃 Primi 3 titolari:`);
                formazione.titolari.slice(0, 3).forEach(giocatore => {
                    console.log(`      - ${giocatore.nome} (${giocatore.ruolo}) - V:${giocatore.voto} FV:${giocatore.fv}`);
                });
            }
        });
        
        // Salva i risultati
        fs.writeFileSync('api_simulation_results.json', JSON.stringify(formazioniData, null, 2));
        console.log('✅ Risultati salvati in: api_simulation_results.json');
        
        console.log('🎉 SIMULAZIONE API COMPLETATA CON SUCCESSO!');
        
    } catch (error) {
        console.error('❌ Errore:', error);
        await page.screenshot({ path: 'api_simulation_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testFormazioniApiSimulation().catch(console.error); 