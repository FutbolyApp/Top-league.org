const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function debugCompetitionsPage() {
    console.log('🔍 Debug pagina competizioni...');
    
    // Dynamic import per il modulo ES
    const mod = await import('./utils/playwrightScraper.js');
    console.log('DEBUG EXPORT KEYS:', Object.keys(mod));
    const PlaywrightScraper = mod.default;
    
    const dbPath = path.join(__dirname, 'db', 'topleague.db');
    console.log('SQLite DB Path:', dbPath);
    
    const db = new sqlite3.Database(dbPath);
    
    try {
        // Ottieni credenziali dalla tabella leghe
        const credentials = await new Promise((resolve, reject) => {
            db.all('SELECT id, fantacalcio_url, fantacalcio_username, fantacalcio_password, tipo_lega FROM leghe', (err, rows) => {
                if (err) reject(err);
                else {
                    // Trova la prima riga con tutti i campi valorizzati
                    const found = rows.find(r => r.fantacalcio_url && r.fantacalcio_username && r.fantacalcio_password);
                    resolve(found);
                }
            });
        });
        
        if (!credentials) {
            console.error('❌ Credenziali non trovate');
            return;
        }
        
        console.log('📋 Uso credenziali dalla tabella leghe...');
        console.log('Credenziali trovate per lega id:', credentials.id);
        
        // Inizializza Playwright
        console.log('🔧 Inizializzazione Playwright...');
        const scraper = new PlaywrightScraper();
        await scraper.init();
        
        try {
            // Login
            console.log('📋 Testando login...');
            const loginResult = await scraper.login(credentials.fantacalcio_username, credentials.fantacalcio_password, credentials.fantacalcio_url);
            console.log('Login result:', loginResult);
            
            if (!loginResult) {
                console.error('❌ Login fallito');
                return;
            }
            
            console.log('✅ Login riuscito, analizzando pagina competizioni...');
            
            // Imposta il tipo di lega
            scraper.setLeagueType(credentials.tipo_lega, credentials.fantacalcio_url);
            
            // Naviga alla pagina delle competizioni
            const competitionsUrl = `${credentials.fantacalcio_url}lista-competizioni`;
            console.log(`📍 Navigazione a: ${competitionsUrl}`);
            
            await scraper.page.goto(competitionsUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });
            
            // Gestisci popup se necessario
            try {
                await scraper.acceptAllPrivacyPopups();
            } catch (error) {
                console.log('⚠️ Errore gestione popup:', error.message);
            }
            
            // Attendi un po' per il caricamento
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Analizza la struttura della pagina e stampa i link delle sezioni
            const debug = await scraper.page.evaluate(() => {
                const result = { headings: [], sectionLinks: [] };
                // Trova tutte le sezioni con heading
                document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
                    result.headings.push({ tag: h.tagName, text: h.textContent?.trim(), class: h.className });
                });
                // Trova tutti i link nelle sezioni visibili
                document.querySelectorAll('a').forEach(a => {
                    result.sectionLinks.push({
                        text: a.textContent?.trim(),
                        href: a.getAttribute('href'),
                        class: a.className
                    });
                });
                return result;
            });
            console.log('\n--- HEADINGS TROVATI ---');
            debug.headings.forEach(h => console.log(`<${h.tag}> ${h.text} [${h.class}]`));
            console.log('\n--- LINK TROVATI ---');
            debug.sectionLinks.forEach(l => console.log(`${l.text} -> ${l.href} [${l.class}]`));
        } finally {
            await scraper.close();
        }
        
    } catch (error) {
        console.error('❌ Errore durante debug:', error);
    } finally {
        db.close();
    }
}

debugCompetitionsPage().catch(console.error); 