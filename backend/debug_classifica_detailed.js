import PlaywrightScraper from './utils/playwrightScraper.js';

async function debugClassificaDetailed() {
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🔍 Debug dettagliato classifica...');
        
        // Credenziali di test
        const credentials = {
            username: 'massimolasorsa@gmail.com',
            password: 'Massimo2024!'
        };
        
        // URL di test per Serie A (che sappiamo funzionare)
        const leagueUrl = 'https://leghe.fantacalcio.it/fantaleague-11';
        const classificaUrl = 'https://leghe.fantacalcio.it/fantaleague-11/classifica?id=1751067489455';
        
        console.log('🚀 Inizializzazione Playwright...');
        await scraper.init();
        
        console.log('🔐 Login...');
        const loginSuccess = await scraper.login(credentials.username, credentials.password);
        if (!loginSuccess) {
            throw new Error('Login fallito');
        }
        
        console.log('✅ Login completato');
        
        // Prima naviga alla pagina principale della lega (come negli altri scraper)
        console.log(`🌐 Navigazione alla pagina principale: ${leagueUrl}`);
        await scraper.page.goto(leagueUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });
        
        await scraper.acceptAllPrivacyPopups();
        await scraper.page.waitForTimeout(2000);
        
        // Poi naviga alla classifica
        console.log(`🌐 Navigazione alla classifica: ${classificaUrl}`);
        await scraper.page.goto(classificaUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });
        
        await scraper.acceptAllPrivacyPopups();
        await scraper.page.waitForTimeout(3000);
        
        console.log('🔍 Analisi dettagliata tabelle classifica...');
        
        const detailedAnalysis = await scraper.page.evaluate(() => {
            const analysis = {
                tables: [],
                bestTable: null,
                rawData: []
            };
            
            // Analizza tutte le tabelle
            const allTables = document.querySelectorAll('table');
            console.log(`Trovate ${allTables.length} tabelle nella pagina`);
            
            allTables.forEach((table, tableIndex) => {
                const rows = table.querySelectorAll('tr');
                const tableData = {
                    index: tableIndex,
                    rows: rows.length,
                    hasHeader: false,
                    header: [],
                    dataRows: [],
                    posizioniNumerate: 0,
                    potentialClassifica: false
                };
                
                console.log(`\n📊 Analisi tabella ${tableIndex} con ${rows.length} righe:`);
                
                // Analizza ogni riga
                rows.forEach((row, rowIndex) => {
                    const cells = row.querySelectorAll('td, th');
                    const rowData = {
                        rowIndex,
                        cells: cells.length,
                        cellTexts: [],
                        isHeader: false
                    };
                    
                    cells.forEach((cell, cellIndex) => {
                        const cellText = cell.textContent?.trim() || '';
                        rowData.cellTexts.push(cellText);
                        
                        // Determina se è header
                        if (rowIndex === 0) {
                            const lowerText = cellText.toLowerCase();
                            if (lowerText.includes('pos') || lowerText.includes('punti') || 
                                lowerText.includes('partite') || lowerText.includes('vittorie') ||
                                lowerText.includes('pareggi') || lowerText.includes('sconfitte') ||
                                lowerText.includes('gol') || lowerText.includes('diff')) {
                                tableData.hasHeader = true;
                                tableData.header.push(cellText);
                                rowData.isHeader = true;
                            }
                        }
                    });
                    
                    // Se non è header, analizza per posizioni numerate
                    if (!rowData.isHeader && rowData.cells >= 2) {
                        const firstCell = rowData.cellTexts[0];
                        const secondCell = rowData.cellTexts[1];
                        
                        if (firstCell && !isNaN(parseInt(firstCell)) && 
                            secondCell && secondCell.length > 2 && isNaN(parseInt(secondCell))) {
                            tableData.posizioniNumerate++;
                            tableData.dataRows.push(rowData);
                        }
                    }
                    
                    tableData.rawData.push(rowData);
                });
                
                // Determina se è una classifica potenziale
                tableData.potentialClassifica = tableData.posizioniNumerate >= 3;
                
                console.log(`  - Header: ${tableData.hasHeader ? 'Sì' : 'No'}`);
                console.log(`  - Posizioni numerate: ${tableData.posizioniNumerate}`);
                console.log(`  - Potenziale classifica: ${tableData.potentialClassifica ? 'SÌ' : 'No'}`);
                
                if (tableData.hasHeader) {
                    console.log(`  - Header trovato: [${tableData.header.join(', ')}]`);
                }
                
                if (tableData.potentialClassifica) {
                    console.log(`  - Prime 3 righe dati:`);
                    tableData.dataRows.slice(0, 3).forEach((row, idx) => {
                        console.log(`    ${idx + 1}. [${row.cellTexts.join(' | ')}]`);
                    });
                }
                
                analysis.tables.push(tableData);
                
                // Trova la migliore tabella
                if (tableData.potentialClassifica && !analysis.bestTable) {
                    analysis.bestTable = tableData;
                }
            });
            
            // Analisi dettagliata della migliore tabella
            if (analysis.bestTable) {
                console.log(`\n🎯 MIGLIORE TABELLA TROVATA: Tabella ${analysis.bestTable.index}`);
                console.log(`Header: [${analysis.bestTable.header.join(', ')}]`);
                console.log(`Righe dati: ${analysis.bestTable.dataRows.length}`);
                
                // Estrai tutti i dati dalla migliore tabella
                analysis.bestTable.dataRows.forEach((row, idx) => {
                    const posizione = parseInt(row.cellTexts[0]) || 0;
                    const squadra = row.cellTexts[1] || '';
                    const punti = parseFloat(row.cellTexts[2]?.replace(',', '.')) || 0;
                    const partite = parseInt(row.cellTexts[3]) || 0;
                    const vittorie = parseInt(row.cellTexts[4]) || 0;
                    const pareggi = parseInt(row.cellTexts[5]) || 0;
                    const sconfitte = parseInt(row.cellTexts[6]) || 0;
                    const golFatti = parseInt(row.cellTexts[7]) || 0;
                    const golSubiti = parseInt(row.cellTexts[8]) || 0;
                    const differenza = parseInt(row.cellTexts[9]) || 0;
                    
                    analysis.rawData.push({
                        posizione,
                        squadra,
                        punti,
                        partite,
                        vittorie,
                        pareggi,
                        sconfitte,
                        golFatti,
                        golSubiti,
                        differenza,
                        rawRow: row.cellTexts
                    });
                    
                    console.log(`  ${posizione}. ${squadra} - Punti: ${punti}, Partite: ${partite}, V: ${vittorie}, P: ${pareggi}, S: ${sconfitte}, GF: ${golFatti}, GS: ${golSubiti}, Diff: ${differenza}`);
                });
            }
            
            return analysis;
        });
        
        console.log('\n📊 RISULTATO ANALISI DETTAGLIATA:');
        console.log('=====================================');
        console.log(`Tabelle trovate: ${detailedAnalysis.tables.length}`);
        console.log(`Migliore tabella: ${detailedAnalysis.bestTable ? `Tabella ${detailedAnalysis.bestTable.index}` : 'Nessuna'}`);
        console.log(`Dati estratti: ${detailedAnalysis.rawData.length} posizioni`);
        
        if (detailedAnalysis.bestTable) {
            console.log('\n🎯 DATI ESTRATTI DALLA MIGLIORE TABELLA:');
            detailedAnalysis.rawData.forEach((pos, index) => {
                console.log(`${pos.posizione}. ${pos.squadra}`);
                console.log(`  Punti: ${pos.punti}, Partite: ${pos.partite}`);
                console.log(`  V: ${pos.vittorie}, P: ${pos.pareggi}, S: ${pos.sconfitte}`);
                console.log(`  GF: ${pos.golFatti}, GS: ${pos.golSubiti}, Diff: ${pos.differenza}`);
                console.log(`  Raw: [${pos.rawRow.join(' | ')}]`);
                console.log('');
            });
        }
        
        // Screenshot della pagina
        await scraper.page.screenshot({ 
            path: 'debug_classifica_detailed.png', 
            fullPage: true 
        });
        console.log('\n📸 Screenshot salvato come debug_classifica_detailed.png');
        
    } catch (error) {
        console.error('❌ Errore debug classifica dettagliato:', error);
    } finally {
        await scraper.close();
    }
}

debugClassificaDetailed(); 