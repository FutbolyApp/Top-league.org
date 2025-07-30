import PlaywrightScraper from './utils/playwrightScraper.js';

async function debugSquadreNames() {
    console.log('🔍 Debug nomi squadre per capire come estrarli correttamente');
    
    const credentials = {
        username: 'nemeneme',
        password: 'laziomerda'
    };
    
    const leagueUrl = 'https://leghe.fantacalcio.it/fantaleague-11';
    const roseUrl = 'https://leghe.fantacalcio.it/fantaleague-11/rose';
    
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🚀 Inizializzazione Playwright...');
        if (!await scraper.init()) {
            throw new Error('Impossibile inizializzare Playwright');
        }

        // Login
        console.log('🔐 Login...');
        const loginSuccess = await scraper.login(credentials.username, credentials?.password || '', leagueUrl);
        if (!loginSuccess) {
            throw new Error('Login fallito');
        }
        
        console.log('✅ Login completato');
        
        // Analisi pagina rose
        console.log('📊 Analisi pagina rose per nomi squadre...');
        await scraper.page.goto(roseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await scraper.acceptAllPrivacyPopups();
        await scraper.page.waitForTimeout(3000);
        
        const squadreAnalysis = await scraper.page.evaluate(() => {
            const analysis = {
                tables: [],
                squadreNames: [],
                headers: [],
                structure: []
            };
            
            console.log('🔍 Analisi struttura per nomi squadre...');
            
            // Cerca tutte le tabelle con ID rosterTable
            const tables = document.querySelectorAll('#rosterTable');
            console.log(`Trovate ${tables.length} tabelle rosterTable`);
            
            tables.forEach((table, tableIndex) => {
                const tableInfo = {
                    index: tableIndex,
                    id: table.id,
                    className: table.className,
                    rows: table.querySelectorAll('tr').length,
                    headers: [],
                    firstRow: [],
                    squadraName: null
                };
                
                // Analizza l'header della tabella
                const headerRow = table.querySelector('tr');
                if (headerRow) {
                    const headerCells = headerRow.querySelectorAll('th, td');
                    headerCells.forEach((cell, cellIndex) => {
                        const text = cell.textContent?.trim();
                        tableInfo.headers.push({
                            index: cellIndex,
                            text: text,
                            tagName: cell.tagName.toLowerCase(),
                            className: cell.className
                        });
                    });
                }
                
                // Analizza la prima riga di dati
                const rows = table.querySelectorAll('tr');
                if (rows.length > 1) {
                    const firstDataRow = rows[1];
                    const cells = firstDataRow.querySelectorAll('td');
                    cells.forEach((cell, cellIndex) => {
                        const text = cell.textContent?.trim();
                        tableInfo.firstRow.push({
                            index: cellIndex,
                            text: text,
                            tagName: cell.tagName.toLowerCase(),
                            className: cell.className
                        });
                    });
                }
                
                // Cerca il nome della squadra in vari modi
                // 1. Nel contenuto della tabella (prima riga, colonna squadra)
                if (tableInfo.firstRow.length >= 4) {
                    const squadraCell = tableInfo.firstRow[3]; // Colonna 4 (indice 3)
                    if (squadraCell && squadraCell.text) {
                        const cleanSquadra = squadraCell.text.split('\n')[0].trim();
                        if (cleanSquadra && cleanSquadra.length > 0) {
                            tableInfo.squadraName = cleanSquadra;
                            analysis.squadreNames.push(cleanSquadra);
                        }
                    }
                }
                
                // 2. Cerca nel contenuto della tabella per elementi che potrebbero essere nomi squadra
                const allText = table.textContent;
                const squadraKeywords = ['Inter', 'Milan', 'Juventus', 'Roma', 'Lazio', 'Napoli', 'Fiorentina', 'Atalanta', 'Bologna', 'Torino', 'Genoa', 'Sampdoria', 'Empoli', 'Lecce', 'Salernitana', 'Monza', 'Frosinone', 'Cagliari', 'Verona', 'Udinese', 'Como', 'Parma', 'Venezia'];
                
                squadraKeywords.forEach(keyword => {
                    if (allText.includes(keyword)) {
                        console.log(`🏆 Trovata keyword squadra: ${keyword} nella tabella ${tableIndex + 1}`);
                    }
                });
                
                analysis.tables.push(tableInfo);
            });
            
            // Analizza la struttura generale della pagina
            const pageStructure = {
                title: document.title,
                h1: document.querySelector('h1')?.textContent?.trim(),
                h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()),
                h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim()),
                breadcrumbs: Array.from(document.querySelectorAll('.breadcrumb, .nav, [class*="breadcrumb"], [class*="nav"]')).map(el => el.textContent?.trim())
            };
            
            analysis.structure = pageStructure;
            
            return analysis;
        });
        
        console.log('📊 RISULTATI ANALISI NOMI SQUADRE:');
        console.log(`- Tabelle trovate: ${squadreAnalysis.tables.length}`);
        console.log(`- Nomi squadre estratti: ${squadreAnalysis.squadreNames.length}`);
        console.log(`- Nomi squadre:`, squadreAnalysis.squadreNames);
        
        console.log('\n📋 DETTAGLI TABELLE:');
        squadreAnalysis.tables.forEach((table, index) => {
            console.log(`\nTabella ${index + 1}:`);
            console.log(`  - ID: ${table.id}`);
            console.log(`  - Righe: ${table.rows}`);
            console.log(`  - Nome squadra: ${table.squadraName || 'NON TROVATO'}`);
            console.log(`  - Header:`, table.headers.map(h => h.text).join(', '));
            console.log(`  - Prima riga:`, table.firstRow.map(c => c.text).join(', '));
        });
        
        console.log('\n🏗️ STRUTTURA PAGINA:');
        console.log(`- Titolo: ${squadreAnalysis.structure.title}`);
        console.log(`- H1: ${squadreAnalysis.structure.h1}`);
        console.log(`- H2:`, squadreAnalysis.structure.h2);
        console.log(`- H3:`, squadreAnalysis.structure.h3);
        console.log(`- Breadcrumbs:`, squadreAnalysis.structure.breadcrumbs);
        
        await scraper.close();
        console.log('✅ Debug nomi squadre completato!');
        
    } catch (error) {
        console.error('❌ Errore durante il debug nomi squadre:', error);
        await scraper.close();
    }
}

debugSquadreNames().catch(console.error); 