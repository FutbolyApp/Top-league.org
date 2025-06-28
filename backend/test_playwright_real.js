import PlaywrightScraper from './utils/playwrightScraper.js';

async function testPlaywrightReal() {
    console.log('🧪 Test Playwright con credenziali reali e miglioramenti');
    
    // Credenziali reali (da sostituire con quelle vere)
    const credentials = {
        username: 'nemeneme', // Sostituisci con username reale
        password: 'laziomerda' // Sostituisci con password reale
    };
    
    // URL della lega reale
    const leagueUrl = 'https://leghe.fantacalcio.it/fantaleague-11';
    const scrapingUrls = {
        rose: 'https://leghe.fantacalcio.it/fantaleague-11/rose',
        classifica: 'https://leghe.fantacalcio.it/fantaleague-11/classifica',
        formazioni: 'https://leghe.fantacalcio.it/fantaleague-11/formazioni' // URL base senza giornata
    };
    
    console.log('🚀 Avvio test con credenziali reali...');
    console.log('📝 Credenziali:', credentials.username);
    console.log('🌐 URL di test:', scrapingUrls);
    
    const scraper = new PlaywrightScraper();
    
    try {
        console.log('🚀 Inizio scraping con Playwright');
        
        if (!await scraper.init()) {
            throw new Error('Impossibile inizializzare Playwright');
        }

        // STEP 1: LOGIN DIRETTO SULLA LEGA
        console.log('🔐 STEP 1: Login diretto sulla lega');
        const loginSuccess = await scraper.login(credentials.username, credentials.password, leagueUrl);
        if (!loginSuccess) {
            throw new Error('Login fallito');
        }
        
        console.log('✅ Login completato');

        // STEP 2: SCRAPING
        console.log('🌐 STEP 2: Scraping dati');
        
        const results = {
            rose: null,
            classifica: null,
            formazioni: null,
            summary: {
                squadre_trovate: 0,
                giocatori_totali: 0
            }
        };

        // Scraping Rose
        if (scrapingUrls.rose) {
            console.log(`📊 Scraping rose: ${scrapingUrls.rose}`);
            try {
                results.rose = await scraper.scrapeRose(scrapingUrls.rose);
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
                results.classifica = await scraper.scrapeClassifica(scrapingUrls.classifica);
                console.log('✅ Classifica completata');
            } catch (error) {
                console.error('❌ Errore scraping classifica:', error.message);
                results.classifica = { error: error.message };
            }
        }

        // Scraping Formazioni
        if (scrapingUrls.formazioni) {
            console.log(`📊 Scraping formazioni: ${scrapingUrls.formazioni}`);
            try {
                // Passa la giornata come parametro separato
                const giornata = '2'; // Esempio: giornata 2
                results.formazioni = await scraper.scrapeFormazioni(scrapingUrls.formazioni, giornata);
                console.log('✅ Formazioni completate');
            } catch (error) {
                console.error('❌ Errore scraping formazioni:', error.message);
                results.formazioni = { error: error.message };
            }
        }

        // Calcola summary
        if (results.rose && Array.isArray(results.rose)) {
            results.summary.squadre_trovate = results.rose.length;
            results.summary.giocatori_totali = results.rose.reduce((total, squadra) => total + (squadra.giocatori?.length || 0), 0);
        }

        console.log('📊 Risultati scraping:');
        console.log(JSON.stringify(results, null, 2));
        
        console.log('✅ Summary:', results.summary.squadre_trovate, 'squadre,', results.summary.giocatori_totali, 'giocatori');
        
        // Test salvataggio nel database (con lega_id di test)
        if (results.rose && Array.isArray(results.rose) && results.rose.length > 0) {
            console.log('💾 Test salvataggio nel database...');
            try {
                const dbResults = await scraper.saveRoseToDatabase('79', results.rose); // Usa lega_id 79 per test
                console.log('✅ Dati salvati nel database:', dbResults);
            } catch (dbError) {
                console.error('❌ Errore salvataggio database:', dbError);
            }
        }

        await scraper.close();
        console.log('✅ Test con credenziali reali completato!');
        
    } catch (error) {
        console.error('❌ Errore durante il test:', error);
        await scraper.close();
    }
}

testPlaywrightReal().catch(console.error); 