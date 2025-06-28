import PlaywrightScraper from './utils/playwrightScraper.js';
import fs from 'fs';
import path from 'path';

async function debugHtmlStructure() {
    console.log('🔍 Debug struttura HTML per capire perché non estrae dati');
    
    const credentials = {
        username: 'nemeneme',
        password: 'laziomerda'
    };
    
    const leagueUrl = 'https://leghe.fantacalcio.it/fantaleague-11';
    const roseUrl = 'https://leghe.fantacalcio.it/fantaleague-11/rose';
    const classificaUrl = 'https://leghe.fantacalcio.it/fantaleague-11/classifica';
    
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🚀 Inizializzazione Playwright...');
        if (!await scraper.init()) {
            throw new Error('Impossibile inizializzare Playwright');
        }

        // Login
        console.log('🔐 Login...');
        const loginSuccess = await scraper.login(credentials.username, credentials.password, leagueUrl);
        if (!loginSuccess) {
            throw new Error('Login fallito');
        }
        
        console.log('✅ Login completato');
        
        // Crea directory per i dump HTML se non esiste
        const dumpDir = './uploads/playwright_debug/html_dumps';
        if (!fs.existsSync(dumpDir)) {
            fs.mkdirSync(dumpDir, { recursive: true });
        }
        
        // ANALISI PAGINA ROSE
        console.log('📊 Analisi pagina rose...');
        await scraper.page.goto(roseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await scraper.acceptAllPrivacyPopups();
        await scraper.page.waitForTimeout(3000);
        
        const roseAnalysis = await scraper.page.evaluate(() => {
            const analysis = {
                url: window.location.href,
                title: document.title,
                tables: [],
                tableDetails: [],
                allElements: [],
                errors: []
            };
            
            try {
                // Analizza tutte le tabelle
                const tables = document.querySelectorAll('table');
                console.log(`Trovate ${tables.length} tabelle nella pagina rose`);
                
                tables.forEach((table, index) => {
                    const tableInfo = {
                        index,
                        id: table.id,
                        className: table.className,
                        rows: table.querySelectorAll('tr').length,
                        headers: [],
                        sampleData: [],
                        html: table.outerHTML.substring(0, 1000) // Primi 1000 caratteri
                    };
                    
                    // Analizza header
                    table.querySelectorAll('th').forEach(th => {
                        tableInfo.headers.push(th.textContent?.trim());
                    });
                    
                    // Analizza prime righe di dati
                    table.querySelectorAll('tr').forEach((row, rowIndex) => {
                        if (rowIndex < 10) { // Prime 10 righe
                            const rowData = [];
                            row.querySelectorAll('td').forEach(td => {
                                rowData.push(td.textContent?.trim());
                            });
                            if (rowData.length > 0) {
                                tableInfo.sampleData.push(rowData);
                            }
                        }
                    });
                    
                    analysis.tables.push(tableInfo);
                    
                    // Analisi dettagliata della tabella
                    const detailedTable = {
                        index,
                        id: table.id,
                        className: table.className,
                        rows: table.querySelectorAll('tr').length,
                        headers: [],
                        firstRow: [],
                        lastRow: [],
                        allClasses: [],
                        allIds: []
                    };
                    
                    // Header dettagliati
                    table.querySelectorAll('th').forEach(th => {
                        detailedTable.headers.push({
                            text: th.textContent?.trim(),
                            className: th.className,
                            id: th.id
                        });
                    });
                    
                    // Prima riga
                    const firstRow = table.querySelector('tr');
                    if (firstRow) {
                        firstRow.querySelectorAll('td, th').forEach(cell => {
                            detailedTable.firstRow.push({
                                text: cell.textContent?.trim(),
                                className: cell.className,
                                tagName: cell.tagName.toLowerCase()
                            });
                        });
                    }
                    
                    // Ultima riga
                    const rows = table.querySelectorAll('tr');
                    if (rows.length > 1) {
                        const lastRow = rows[rows.length - 1];
                        lastRow.querySelectorAll('td, th').forEach(cell => {
                            detailedTable.lastRow.push({
                                text: cell.textContent?.trim(),
                                className: cell.className,
                                tagName: cell.tagName.toLowerCase()
                            });
                        });
                    }
                    
                    // Tutte le classi e ID nella tabella
                    table.querySelectorAll('*').forEach(el => {
                        if (el.className) detailedTable.allClasses.push(el.className);
                        if (el.id) detailedTable.allIds.push(el.id);
                    });
                    
                    analysis.tableDetails.push(detailedTable);
                });
                
                // Analizza tutti gli elementi con testo
                const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a');
                textElements.forEach((el, index) => {
                    if (index < 200) { // Limita a 200 elementi
                        const text = el.textContent?.trim();
                        if (text && text.length > 2 && text.length < 100) {
                            analysis.allElements.push({
                                tag: el.tagName.toLowerCase(),
                                text: text,
                                className: el.className,
                                id: el.id
                            });
                        }
                    }
                });
                
                // Cerca errori o messaggi
                const errorElements = document.querySelectorAll('[class*="error"], [class*="warning"], [class*="message"], [class*="alert"]');
                errorElements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text) {
                        analysis.errors.push({
                            type: el.className,
                            text: text
                        });
                    }
                });
                
            } catch (error) {
                analysis.errors.push({
                    type: 'JavaScript Error',
                    text: error.message
                });
            }
            
            return analysis;
        });
        
        // Salva analisi rose
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const roseAnalysisPath = path.join(dumpDir, `rose_analysis_${timestamp}.json`);
        fs.writeFileSync(roseAnalysisPath, JSON.stringify(roseAnalysis, null, 2));
        console.log(`💾 Analisi rose salvata in: ${roseAnalysisPath}`);
        
        // Salva HTML completo della pagina rose
        const roseHtml = await scraper.page.content();
        const roseHtmlPath = path.join(dumpDir, `rose_page_${timestamp}.html`);
        fs.writeFileSync(roseHtmlPath, roseHtml);
        console.log(`💾 HTML rose salvato in: ${roseHtmlPath}`);
        
        console.log('📊 RISULTATI ANALISI ROSE:');
        console.log(`- Tabelle trovate: ${roseAnalysis.tables.length}`);
        console.log(`- Elementi con testo: ${roseAnalysis.allElements.length}`);
        console.log(`- Errori: ${roseAnalysis.errors.length}`);
        
        // ANALISI PAGINA CLASSIFICA
        console.log('🏆 Analisi pagina classifica...');
        await scraper.page.goto(classificaUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await scraper.acceptAllPrivacyPopups();
        await scraper.page.waitForTimeout(3000);
        
        const classificaAnalysis = await scraper.page.evaluate(() => {
            const analysis = {
                url: window.location.href,
                title: document.title,
                tables: [],
                tableDetails: [],
                allElements: [],
                errors: []
            };
            
            try {
                // Analizza tutte le tabelle
                const tables = document.querySelectorAll('table');
                console.log(`Trovate ${tables.length} tabelle nella pagina classifica`);
                
                tables.forEach((table, index) => {
                    const tableInfo = {
                        index,
                        id: table.id,
                        className: table.className,
                        rows: table.querySelectorAll('tr').length,
                        headers: [],
                        sampleData: [],
                        html: table.outerHTML.substring(0, 1000)
                    };
                    
                    // Analizza header
                    table.querySelectorAll('th').forEach(th => {
                        tableInfo.headers.push(th.textContent?.trim());
                    });
                    
                    // Analizza prime righe di dati
                    table.querySelectorAll('tr').forEach((row, rowIndex) => {
                        if (rowIndex < 10) {
                            const rowData = [];
                            row.querySelectorAll('td').forEach(td => {
                                rowData.push(td.textContent?.trim());
                            });
                            if (rowData.length > 0) {
                                tableInfo.sampleData.push(rowData);
                            }
                        }
                    });
                    
                    analysis.tables.push(tableInfo);
                });
                
                // Analizza tutti gli elementi con testo
                const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a');
                textElements.forEach((el, index) => {
                    if (index < 200) {
                        const text = el.textContent?.trim();
                        if (text && text.length > 2 && text.length < 100) {
                            analysis.allElements.push({
                                tag: el.tagName.toLowerCase(),
                                text: text,
                                className: el.className,
                                id: el.id
                            });
                        }
                    }
                });
                
                // Cerca errori
                const errorElements = document.querySelectorAll('[class*="error"], [class*="warning"], [class*="message"], [class*="alert"]');
                errorElements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text) {
                        analysis.errors.push({
                            type: el.className,
                            text: text
                        });
                    }
                });
                
            } catch (error) {
                analysis.errors.push({
                    type: 'JavaScript Error',
                    text: error.message
                });
            }
            
            return analysis;
        });
        
        // Salva analisi classifica
        const classificaAnalysisPath = path.join(dumpDir, `classifica_analysis_${timestamp}.json`);
        fs.writeFileSync(classificaAnalysisPath, JSON.stringify(classificaAnalysis, null, 2));
        console.log(`💾 Analisi classifica salvata in: ${classificaAnalysisPath}`);
        
        // Salva HTML completo della pagina classifica
        const classificaHtml = await scraper.page.content();
        const classificaHtmlPath = path.join(dumpDir, `classifica_page_${timestamp}.html`);
        fs.writeFileSync(classificaHtmlPath, classificaHtml);
        console.log(`💾 HTML classifica salvato in: ${classificaHtmlPath}`);
        
        console.log('🏆 RISULTATI ANALISI CLASSIFICA:');
        console.log(`- Tabelle trovate: ${classificaAnalysis.tables.length}`);
        console.log(`- Elementi con testo: ${classificaAnalysis.allElements.length}`);
        console.log(`- Errori: ${classificaAnalysis.errors.length}`);
        
        // Log dettagliato delle tabelle
        console.log('\n📋 DETTAGLI TABELLE ROSE:');
        roseAnalysis.tables.forEach((table, index) => {
            console.log(`\nTabella ${index + 1}:`);
            console.log(`  - ID: ${table.id || 'N/A'}`);
            console.log(`  - Classi: ${table.className || 'N/A'}`);
            console.log(`  - Righe: ${table.rows}`);
            console.log(`  - Header: ${table.headers.join(', ')}`);
            console.log(`  - Dati di esempio:`, table.sampleData.slice(0, 3));
        });
        
        console.log('\n📋 DETTAGLI TABELLE CLASSIFICA:');
        classificaAnalysis.tables.forEach((table, index) => {
            console.log(`\nTabella ${index + 1}:`);
            console.log(`  - ID: ${table.id || 'N/A'}`);
            console.log(`  - Classi: ${table.className || 'N/A'}`);
            console.log(`  - Righe: ${table.rows}`);
            console.log(`  - Header: ${table.headers.join(', ')}`);
            console.log(`  - Dati di esempio:`, table.sampleData.slice(0, 3));
        });
        
        await scraper.close();
        console.log('✅ Debug HTML completato!');
        console.log(`📁 Tutti i file salvati in: ${dumpDir}`);
        
    } catch (error) {
        console.error('❌ Errore durante il debug HTML:', error);
        await scraper.close();
    }
}

debugHtmlStructure().catch(console.error); 