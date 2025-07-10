import PlaywrightScraper from './utils/playwrightScraper.js';
import { getLegaById } from './models/lega.js';

async function debugTournamentsStructure() {
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🔧 Inizializzazione Playwright...');
        await scraper.init();
        
        // Configura per Euroleghe
        const legaId = '76';
        // Usa getLegaById con callback
        await new Promise((resolve, reject) => {
            getLegaById(legaId, async (err, leagueInfo) => {
                if (err || !leagueInfo) {
                    reject(new Error('Lega non trovata'));
                    return;
                }
                try {
                    console.log('✅ Lega trovata:', leagueInfo);
                    
                    // Imposta tipo lega e URL
                    scraper.setLeagueType(leagueInfo.tipo_lega, leagueInfo.fantacalcio_url);
                    
                    // Login
                    console.log('🔐 Tentativo login...');
                    const loginSuccess = await scraper.login(leagueInfo.fantacalcio_username, leagueInfo.fantacalcio_password, leagueInfo.fantacalcio_url);
                    
                    if (!loginSuccess) {
                        reject(new Error('Login fallito'));
                        return;
                    }
                    
                    console.log('✅ Login riuscito');
                    
                    // Naviga alla pagina principale
                    console.log('🌐 Navigazione alla pagina principale...');
                    await scraper.page.goto(leagueInfo.fantacalcio_url, {
                        waitUntil: 'domcontentloaded',
                        timeout: 15000
                    });
                    
                    await scraper.acceptAllPrivacyPopups();
                    await new Promise(resolve2 => setTimeout(resolve2, 3000));
                    
                    // Analizza la struttura della pagina
                    console.log('🔍 Analisi struttura pagina...');
                    const pageStructure = await scraper.page.evaluate(() => {
                        const structure = {
                            competitionList: null,
                            competitionCards: [],
                            selects: [],
                            links: [],
                            buttons: [],
                            divs: []
                        };
                        
                        // Cerca div competition-list
                        const competitionList = document.querySelector('.competition-list');
                        if (competitionList) {
                            structure.competitionList = {
                                className: competitionList.className,
                                id: competitionList.id,
                                childrenCount: competitionList.children.length,
                                innerHTML: competitionList.innerHTML.substring(0, 500) + '...'
                            };
                            
                            // Cerca competition-card
                            const cards = competitionList.querySelectorAll('.competition-card');
                            structure.competitionCards = Array.from(cards).map((card, index) => ({
                                index,
                                className: card.className,
                                id: card.id,
                                childrenCount: card.children.length,
                                innerHTML: card.innerHTML.substring(0, 300) + '...'
                            }));
                        }
                        
                        // Cerca tutti i select
                        const selects = document.querySelectorAll('select');
                        structure.selects = Array.from(selects).map((select, index) => ({
                            index,
                            id: select.id,
                            name: select.name,
                            className: select.className,
                            optionsCount: select.options.length,
                            options: Array.from(select.options).map(opt => ({
                                value: opt.value,
                                text: opt.textContent?.trim()
                            }))
                        }));
                        
                        // Cerca link che potrebbero essere tornei
                        const links = document.querySelectorAll('a');
                        structure.links = Array.from(links)
                            .filter(link => {
                                const text = link.textContent?.trim();
                                const href = link.href;
                                return text && text.length > 2 && text.length < 100 &&
                                    (href.includes('id=') || href.includes('tournament') || 
                                        text.toLowerCase().includes('lega') || text.toLowerCase().includes('torneo') ||
                                        text.toLowerCase().includes('competizione') || text.toLowerCase().includes('supercup'));
                            })
                            .map((link, index) => ({
                                index,
                                text: link.textContent?.trim(),
                                href: link.href,
                                className: link.className,
                                id: link.id
                            }));
                        
                        // Cerca bottoni che potrebbero essere tornei
                        const buttons = document.querySelectorAll('button');
                        structure.buttons = Array.from(buttons)
                            .filter(button => {
                                const text = button.textContent?.trim();
                                return text && text.length > 2 && text.length < 100 &&
                                    (text.toLowerCase().includes('lega') || text.toLowerCase().includes('torneo') ||
                                        text.toLowerCase().includes('competizione') || text.toLowerCase().includes('supercup'));
                            })
                            .map((button, index) => ({
                                index,
                                text: button.textContent?.trim(),
                                className: button.className,
                                id: button.id
                            }));
                        
                        // Cerca div che potrebbero contenere tornei
                        const divs = document.querySelectorAll('div');
                        structure.divs = Array.from(divs)
                            .filter(div => {
                                const text = div.textContent?.trim();
                                const className = div.className;
                                return text && text.length > 10 && text.length < 500 &&
                                    (className.includes('competition') || className.includes('tournament') ||
                                        className.includes('league') || text.toLowerCase().includes('lega') ||
                                        text.toLowerCase().includes('torneo') || text.toLowerCase().includes('competizione'));
                            })
                            .map((div, index) => ({
                                index,
                                text: div.textContent?.trim().substring(0, 200) + '...',
                                className: div.className,
                                id: div.id
                            }));
                        
                        return structure;
                    });
                    
                    console.log('📊 STRUTTURA PAGINA:');
                    console.log(JSON.stringify(pageStructure, null, 2));
                    resolve();
                } catch (err2) {
                    reject(err2);
                }
            });
        });
        
        // Prova a estrarre tornei con logica migliorata
        console.log('🔍 Estrazione tornei con logica migliorata...');
        const tournaments = await scraper.page.evaluate(() => {
            const tournaments = [];
            
            // Logica 1: Cerca nel div competition-list
            const competitionList = document.querySelector('.competition-list');
            if (competitionList) {
                console.log('✅ Trovato div competition-list');
                const cards = competitionList.querySelectorAll('.competition-card');
                cards.forEach((card, index) => {
                    const panel = card.querySelector('.panel-competition');
                    if (panel) {
                        const dataId = panel.getAttribute('data-id');
                        const name = panel.querySelector('.competition-name')?.textContent?.trim();
                        if (dataId && name) {
                            tournaments.push({
                                id: dataId,
                                name: name,
                                source: 'competition-card'
                            });
                        }
                    }
                });
            }
            
            // Logica 2: Cerca in tutti i link
            const links = document.querySelectorAll('a');
            links.forEach((link, index) => {
                const text = link.textContent?.trim();
                const href = link.href;
                
                if (text && text.length > 2 && text.length < 100) {
                    // Filtra link che sembrano tornei
                    if (href.includes('id=') || href.includes('tournament') || 
                        text.toLowerCase().includes('lega') || text.toLowerCase().includes('torneo') ||
                        text.toLowerCase().includes('competizione') || text.toLowerCase().includes('supercup')) {
                        
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
                            source: 'link'
                        });
                    }
                }
            });
            
            // Logica 3: Cerca in tutti i bottoni
            const buttons = document.querySelectorAll('button');
            buttons.forEach((button, index) => {
                const text = button.textContent?.trim();
                
                if (text && text.length > 2 && text.length < 100) {
                    if (text.toLowerCase().includes('lega') || text.toLowerCase().includes('torneo') ||
                        text.toLowerCase().includes('competizione') || text.toLowerCase().includes('supercup')) {
                        
                        tournaments.push({
                            id: `button_${index}`,
                            name: text,
                            source: 'button'
                        });
                    }
                }
            });
            
            // Logica 4: Cerca in tutti i div
            const divs = document.querySelectorAll('div');
            divs.forEach((div, index) => {
                const text = div.textContent?.trim();
                const className = div.className;
                
                if (text && text.length > 5 && text.length < 200) {
                    if (className.includes('competition') || className.includes('tournament') ||
                        className.includes('league') || text.toLowerCase().includes('lega') ||
                        text.toLowerCase().includes('torneo') || text.toLowerCase().includes('competizione')) {
                        
                        tournaments.push({
                            id: `div_${index}`,
                            name: text.substring(0, 100),
                            className: className,
                            source: 'div'
                        });
                    }
                }
            });
            
            return tournaments;
        });
        
        console.log('🏆 TORNEI TROVATI:');
        console.log(JSON.stringify(tournaments, null, 2));
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await scraper.close();
    }
}

debugTournamentsStructure(); 