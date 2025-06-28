import { chromium } from 'playwright';

async function debugPageStructure() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 DEBUG: Analisi struttura pagina rose...');
        
        // Vai alla pagina di login
        await page.goto('https://leghe.fantacalcio.it/fantaleague-11/rose', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        // Gestisci popup
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await btn.textContent();
            if (text && text.toLowerCase().includes('continua senza accettare')) {
                await btn.click();
                break;
            }
        }
        
        await page.waitForTimeout(3000);
        
        // Se siamo nella pagina di login, fai login
        const currentUrl = page.url();
        if (currentUrl.includes('login') || currentUrl.includes('signin')) {
            console.log('🔐 Pagina di login rilevata, faccio login...');
            
            // Trova e compila i campi
            const usernameField = await page.$('input[type="text"], input[name="username"]');
            if (usernameField) {
                await usernameField.fill('nemeneme');
            }
            
            const passwordField = await page.$('input[type="password"], input[name="password"]');
            if (passwordField) {
                await passwordField.fill('laziomerda');
            }
            
            // Clicca login
            const loginButton = await page.$('button[type="submit"], input[type="submit"]');
            if (loginButton) {
                await loginButton.click();
            }
            
            await page.waitForTimeout(5000);
            
            // Ora vai alla pagina rose
            await page.goto('https://leghe.fantacalcio.it/fantaleague-11/rose', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await page.waitForTimeout(3000);
        }
        
        // Analizza la struttura
        const structure = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                title: document.title,
                panels: [],
                tables: [],
                squadreHeaders: []
            };
            
            // Analizza tutti i panel
            const panels = document.querySelectorAll('.panel, .widget, [class*="panel"], [class*="widget"]');
            console.log(`Trovati ${panels.length} panel`);
            
            panels.forEach((panel, index) => {
                const panelInfo = {
                    index,
                    className: panel.className,
                    title: null,
                    tables: []
                };
                
                // Cerca il titolo del panel
                const titleEl = panel.querySelector('.panel-title, h3, h4, .title, .team-title');
                if (titleEl) {
                    panelInfo.title = titleEl.textContent.trim();
                    result.squadreHeaders.push(panelInfo.title);
                }
                
                // Cerca tabelle nel panel
                const tables = panel.querySelectorAll('table');
                tables.forEach((table, tableIndex) => {
                    const tableInfo = {
                        tableIndex,
                        rows: table.querySelectorAll('tr').length,
                        headers: [],
                        sampleData: []
                    };
                    
                    // Analizza header
                    const headerRow = table.querySelector('tr');
                    if (headerRow) {
                        headerRow.querySelectorAll('th, td').forEach(cell => {
                            tableInfo.headers.push(cell.textContent.trim());
                        });
                    }
                    
                    // Analizza prime righe di dati
                    table.querySelectorAll('tr').forEach((row, rowIndex) => {
                        if (rowIndex < 5 && rowIndex > 0) { // Salta header
                            const rowData = [];
                            row.querySelectorAll('td').forEach(td => {
                                rowData.push(td.textContent.trim());
                            });
                            if (rowData.length > 0) {
                                tableInfo.sampleData.push(rowData);
                            }
                        }
                    });
                    
                    panelInfo.tables.push(tableInfo);
                });
                
                result.panels.push(panelInfo);
            });
            
            // Analizza tutte le tabelle
            const allTables = document.querySelectorAll('table');
            allTables.forEach((table, index) => {
                const tableInfo = {
                    index,
                    id: table.id,
                    className: table.className,
                    rows: table.querySelectorAll('tr').length,
                    headers: [],
                    sampleData: []
                };
                
                // Analizza header
                const headerRow = table.querySelector('tr');
                if (headerRow) {
                    headerRow.querySelectorAll('th, td').forEach(cell => {
                        tableInfo.headers.push(cell.textContent.trim());
                    });
                }
                
                // Analizza prime righe di dati
                table.querySelectorAll('tr').forEach((row, rowIndex) => {
                    if (rowIndex < 5 && rowIndex > 0) { // Salta header
                        const rowData = [];
                        row.querySelectorAll('td').forEach(td => {
                            rowData.push(td.textContent.trim());
                        });
                        if (rowData.length > 0) {
                            tableInfo.sampleData.push(rowData);
                        }
                    }
                });
                
                result.tables.push(tableInfo);
            });
            
            return result;
        });
        
        console.log('📊 STRUTTURA PAGINA ANALIZZATA:');
        console.log(JSON.stringify(structure, null, 2));
        
        // Screenshot
        await page.screenshot({ path: 'backend/uploads/debug_page_structure.png', fullPage: true });
        console.log('📸 Screenshot salvato: backend/uploads/debug_page_structure.png');
        
    } catch (error) {
        console.error('❌ Errore debug:', error);
    } finally {
        await browser.close();
    }
}

debugPageStructure(); 