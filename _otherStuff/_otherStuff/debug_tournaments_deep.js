import PlaywrightScraper from './utils/playwrightScraper.js';
import { getLegaById } from './models/lega.js';

async function debugTournamentsDeep() {
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🔧 Inizializzazione Playwright...');
        await scraper.init();
        
        // Configura per Euroleghe
        const legaId = '76';
        
        // Recupera info lega usando Promise
        const leagueInfo = await new Promise((resolve, reject) => {
            getLegaById(legaId, (err, lega) => {
                if (err) reject(err);
                else resolve(lega);
            });
        });
        
        if (!leagueInfo) {
            throw new Error('Lega non trovata');
        }
        
        console.log('✅ Lega trovata:', leagueInfo);
        
        // Imposta tipo lega e URL
        scraper.setLeagueType(leagueInfo.tipo_lega, leagueInfo.fantacalcio_url);
        
        // Login
        console.log('🔐 Tentativo login...');
        const loginSuccess = await scraper.login(leagueInfo.fantacalcio_username, leagueInfo.fantacalcio_password, leagueInfo.fantacalcio_url);
        
        if (!loginSuccess) {
            throw new Error('Login fallito');
        }
        
        console.log('✅ Login riuscito');
        
        // Naviga alla pagina principale
        console.log('🌐 Navigazione alla pagina principale...');
        await scraper.page.goto(leagueInfo.fantacalcio_url, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });
        
        await scraper.acceptAllPrivacyPopups();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Analisi approfondita della pagina
        console.log('🔍 ANALISI APPROFONDITA DELLA PAGINA...');
        const pageAnalysis = await scraper.page.evaluate(() => {
            const analysis = {
                allLinks: [],
                allButtons: [],
                allDivs: [],
                allSpans: [],
                allTexts: []
            };
            
            // Analizza TUTTI i link
            const allLinks = document.querySelectorAll('a');
            console.log(`🔍 Trovati ${allLinks.length} link totali`);
            
            allLinks.forEach((link, index) => {
                const text = link.textContent?.trim();
                const href = link.href;
                const className = link.className;
                const id = link.id;
                
                if (text && text.length > 0) {
                    analysis.allLinks.push({
                        index,
                        text,
                        href,
                        className,
                        id,
                        length: text.length
                    });
                }
            });
            
            // Analizza TUTTI i bottoni
            const allButtons = document.querySelectorAll('button');
            console.log(`🔍 Trovati ${allButtons.length} bottoni totali`);
            
            allButtons.forEach((button, index) => {
                const text = button.textContent?.trim();
                const className = button.className;
                const id = button.id;
                
                if (text && text.length > 0) {
                    analysis.allButtons.push({
                        index,
                        text,
                        className,
                        id,
                        length: text.length
                    });
                }
            });
            
            // Analizza TUTTI i div con testo
            const allDivs = document.querySelectorAll('div');
            console.log(`🔍 Trovati ${allDivs.length} div totali`);
            
            allDivs.forEach((div, index) => {
                const text = div.textContent?.trim();
                const className = div.className;
                const id = div.id;
                
                if (text && text.length > 2 && text.length < 200) {
                    analysis.allDivs.push({
                        index,
                        text,
                        className,
                        id,
                        length: text.length
                    });
                }
            });
            
            // Analizza TUTTI gli span con testo
            const allSpans = document.querySelectorAll('span');
            console.log(`🔍 Trovati ${allSpans.length} span totali`);
            
            allSpans.forEach((span, index) => {
                const text = span.textContent?.trim();
                const className = span.className;
                const id = span.id;
                
                if (text && text.length > 0) {
                    analysis.allSpans.push({
                        index,
                        text,
                        className,
                        id,
                        length: text.length
                    });
                }
            });
            
            // Cerca testo che contiene parole chiave
            const allTexts = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                const text = node.textContent?.trim();
                if (text && text.length > 2) {
                    const lowerText = text.toLowerCase();
                    if (lowerText.includes('lega') || lowerText.includes('torneo') || 
                        lowerText.includes('competizione') || lowerText.includes('supercup') ||
                        lowerText.includes('eurolega') || lowerText.includes('serie')) {
                        allTexts.push({
                            text,
                            length: text.length,
                            parentTag: node.parentElement?.tagName,
                            parentClass: node.parentElement?.className,
                            parentId: node.parentElement?.id
                        });
                    }
                }
            }
            
            analysis.allTexts = allTexts;
            
            return analysis;
        });
        
        console.log('📊 ANALISI COMPLETA:');
        console.log(`🔗 Link totali: ${pageAnalysis.allLinks.length}`);
        console.log(`🔘 Bottoni totali: ${pageAnalysis.allButtons.length}`);
        console.log(`📦 Div con testo: ${pageAnalysis.allDivs.length}`);
        console.log(`📝 Span con testo: ${pageAnalysis.allSpans.length}`);
        console.log(`🔍 Testi con parole chiave: ${pageAnalysis.allTexts.length}`);
        
        // Mostra i primi 20 link
        console.log('\n🔗 PRIMI 20 LINK:');
        pageAnalysis.allLinks.slice(0, 20).forEach(link => {
            console.log(`  ${link.index}: "${link.text}" -> ${link.href} (class: ${link.className})`);
        });
        
        // Mostra i primi 20 bottoni
        console.log('\n🔘 PRIMI 20 BOTTONI:');
        pageAnalysis.allButtons.slice(0, 20).forEach(button => {
            console.log(`  ${button.index}: "${button.text}" (class: ${button.className})`);
        });
        
        // Mostra tutti i testi con parole chiave
        console.log('\n🔍 TESTI CON PAROLE CHIAVE:');
        pageAnalysis.allTexts.forEach(text => {
            console.log(`  "${text.text}" (${text.parentTag}.${text.parentClass}#${text.parentId})`);
        });
        
        // Prova a estrarre tornei con logica più permissiva
        console.log('\n🔍 ESTRAZIONE TORNEI CON LOGICA PERMISSIVA...');
        const tournaments = await scraper.page.evaluate(() => {
            const tournaments = [];
            
            // Logica 1: Cerca in TUTTI i link
            const allLinks = document.querySelectorAll('a');
            allLinks.forEach((link, index) => {
                const text = link.textContent?.trim();
                const href = link.href;
                
                if (text && text.length > 0) {
                    // Estrai ID
                    let id = null;
                    if (href.includes('id=')) {
                        const urlParams = new URLSearchParams(href.split('?')[1] || '');
                        id = urlParams.get('id');
                    }
                    if (!id) {
                        const idMatch = href.match(/[?&]id=(\d+)/);
                        if (idMatch) id = idMatch[1];
                    }
                    if (!id) {
                        const numberMatch = href.match(/(\d+)/);
                        if (numberMatch) id = numberMatch[1];
                    }
                    if (!id) {
                        id = `link_${index}`;
                    }
                    
                    tournaments.push({
                        id: id,
                        name: text,
                        url: href,
                        source: 'link',
                        index: index
                    });
                }
            });
            
            // Logica 2: Cerca in TUTTI i bottoni
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach((button, index) => {
                const text = button.textContent?.trim();
                
                if (text && text.length > 0) {
                    tournaments.push({
                        id: `button_${index}`,
                        name: text,
                        source: 'button',
                        index: index
                    });
                }
            });
            
            return tournaments;
        });
        
        console.log(`🏆 TORNEI TROVATI (LOGICA PERMISSIVA): ${tournaments.length}`);
        tournaments.slice(0, 30).forEach(t => {
            console.log(`  ${t.index}: "${t.name}" (ID: ${t.id}, source: ${t.source})`);
        });
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await scraper.close();
    }
}

debugTournamentsDeep(); 