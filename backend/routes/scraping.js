import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDb } from '../db/postgres.js';
import { 
  testScraping, 
  scrapeClassifica, 
  scrapeRisultati, 
  scrapeCalciatori,
  scrapeVoti,
  updateClassificaFromScraping,
  updateVotiFromScraping,
  importCalciatoriFromScraping
} from '../utils/scraper.js';

// Importa il nuovo scraper Puppeteer
import FantacalcioScraper from '../utils/scraperPuppeteer.js';
import { testCredentialsWithPuppeteer } from '../utils/scraperPuppeteer.js';

// Importa il nuovo scraper Playwright
import PlaywrightScraper from '../utils/playwrightScraper.js';

const router = express.Router();
const db = getDb();

// Test scraping per un URL
router.post('/test', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL richiesto' });
    }
    
    const result = await testScraping(url);
    res.json(result);
    
  } catch (error) {
    console.error('Errore test scraping:', error);
    res.status(500).json({ error: 'Errore nel test dello scraping' });
  }
});

// Nuovo endpoint per scraping con Puppeteer (login richiesto)
router.post('/puppeteer/league', requireAuth, async (req, res) => {
  try {
    const { 
      leagueUrl, 
      scrapingUrls,
      username, 
      password, 
      tournamentId = null,
      lega_id = null
    } = req.body;
    
    if (!leagueUrl || !username || !password) {
      return res.status(400).json({ 
        error: 'leagueUrl, username e password sono richiesti' 
      });
    }
    
    console.log(`Avvio scraping Puppeteer per: ${leagueUrl}`);
    console.log(`Username ricevuto: ${username}`);
    console.log(`Password ricevuta: ${password}`);
    console.log(`URL di scraping:`, scrapingUrls);
    console.log(`Dettagli richiesta:`, {
      leagueUrl,
      scrapingUrls,
      username,
      password: password ? '***' : 'MISSING',
      tournamentId,
      lega_id,
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });
    
    const scraper = new FantacalcioScraper();
    
    try {
      const results = await scraper.scrapeLeague(
        leagueUrl,
        scrapingUrls,
        { username, password },
        tournamentId,
        lega_id
      );
      
      if (results) {
        console.log('Scraping completato con successo');
        
        let message = 'Scraping completato con successo';
        if (results.database) {
          message += `. Salvati nel database: ${results.database.squadre_salvate} squadre, ${results.database.giocatori_salvati} giocatori`;
        }
        
        res.json({ 
          success: true, 
          message: message,
          data: results 
        });
      } else {
        console.log('Scraping fallito - risultati nulli');
        res.json({ 
          success: false, 
          error: 'Scraping fallito - controlla le credenziali e l\'URL',
          message: 'Le credenziali potrebbero essere errate o l\'URL non è valido'
        });
      }
    } catch (scrapingError) {
      console.error('Errore durante lo scraping:', scrapingError);
      res.json({ 
        success: false,
        error: 'Errore durante lo scraping: ' + scrapingError.message,
        message: 'Si è verificato un errore durante il processo di scraping'
      });
    }
    
  } catch (error) {
    console.error('Errore generale scraping Puppeteer:', error);
    res.json({ 
      success: false,
      error: 'Errore durante lo scraping: ' + error.message,
      message: 'Si è verificato un errore generale nel sistema di scraping'
    });
  }
});

// NUOVO ENDPOINT: Scraping con login manuale
router.post('/puppeteer/manual-login', requireAuth, async (req, res) => {
  try {
    const { 
      leagueUrl, 
      scrapingUrls,
      username, 
      password, 
      tournamentId = null,
      lega_id = null
    } = req.body;
    
    if (!leagueUrl) {
      return res.status(400).json({ 
        error: 'leagueUrl è richiesto' 
      });
    }
    
    console.log(`🚀 Avvio scraping con login manuale per: ${leagueUrl}`);
    console.log(`🌐 URL di scraping:`, scrapingUrls);
    console.log(`📊 Dettagli richiesta:`, {
      leagueUrl,
      scrapingUrls,
      username: username || 'NON RICHIESTO',
      password: password ? '***' : 'NON RICHIESTO',
      tournamentId,
      lega_id,
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });
    
    const scraper = new FantacalcioScraper();
    
    try {
      const results = await scraper.scrapeLeagueWithManualLogin(
        leagueUrl, 
        scrapingUrls, 
        { username: username || '', password: password || '' }, 
        tournamentId, 
        lega_id
      );
      
      if (results) {
        console.log('✅ Scraping con login manuale completato con successo');
        
        let message = 'Scraping con login manuale completato con successo';
        if (results.database) {
          message += `. Salvati nel database: ${results.database.squadre_salvate} squadre, ${results.database.giocatori_salvati} giocatori`;
        }
        
        res.json({ 
          success: true, 
          message: message,
          data: results 
        });
      } else {
        console.log('❌ Scraping con login manuale fallito - risultati nulli');
        res.json({ 
          success: false, 
          error: 'Scraping fallito - controlla l\'URL e il processo di login',
          message: 'Il processo di scraping non è riuscito a completarsi'
        });
      }
    } catch (scrapingError) {
      console.error('❌ Errore durante lo scraping con login manuale:', scrapingError);
      res.json({ 
        success: false,
        error: 'Errore durante lo scraping: ' + scrapingError.message,
        message: 'Si è verificato un errore durante il processo di scraping con login manuale'
      });
    }
    
  } catch (error) {
    console.error('❌ Errore generale scraping con login manuale:', error);
    res.json({ 
      success: false,
      error: 'Errore durante lo scraping: ' + error.message,
      message: 'Si è verificato un errore generale nel sistema di scraping con login manuale'
    });
  }
});

// Endpoint per aggiornare credenziali di una lega
router.post('/update-credentials', requireAuth, async (req, res) => {
  try {
    const { 
      lega_id, 
      username, 
      password 
    } = req.body;
    
    if (!lega_id || !username || !password) {
      return res.status(400).json({ 
        error: 'lega_id, username e password sono richiesti' 
      });
    }
    
    console.log(`🔐 Aggiornamento credenziali per lega ${lega_id}`);
    
    // Aggiorna le credenziali nel database
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    try {
      const result = await db.query(
        `UPDATE leghe 
         SET fantacalcio_username = $1, fantacalcio_password = $2, updated_at = NOW()
         WHERE id = $3`,
        [username, password, lega_id]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({ 
          error: 'Lega non trovata' 
        });
      }
      
      console.log('✅ Credenziali aggiornate con successo');
      res.json({ 
        success: true, 
        message: 'Credenziali aggiornate con successo',
        lega_id: lega_id
      });
      
    } catch (error) {
      console.error('❌ Errore aggiornamento credenziali:', error);
      return res.status(500).json({ 
        error: 'Errore nell\'aggiornamento delle credenziali nel database' 
      });
    }
    
  } catch (error) {
    console.error('❌ Errore aggiornamento credenziali:', error);
    res.status(500).json({ 
      error: 'Errore nell\'aggiornamento delle credenziali' 
    });
  }
});

// Endpoint per avviare scraping automatico (ogni 3 ore)
router.post('/start-auto-scraping', requireAuth, async (req, res) => {
  try {
    const { lega_id } = req.body;
    
    if (!lega_id) {
      return res.status(400).json({ error: 'lega_id richiesto' });
    }
    
    // TODO: Implementa il cron job per lo scraping automatico
    // Per ora restituisce successo
    res.json({ 
      success: true, 
      message: 'Scraping automatico avviato (ogni 3 ore)' 
    });
    
  } catch (error) {
    console.error('Errore avvio scraping automatico:', error);
    res.status(500).json({ 
      error: 'Errore nell\'avvio dello scraping automatico' 
    });
  }
});

// Endpoint per fermare scraping automatico
router.post('/stop-auto-scraping', requireAuth, async (req, res) => {
  try {
    const { lega_id } = req.body;
    
    if (!lega_id) {
      return res.status(400).json({ error: 'lega_id richiesto' });
    }
    
    // TODO: Ferma il cron job per lo scraping automatico
    res.json({ 
      success: true, 
      message: 'Scraping automatico fermato' 
    });
    
  } catch (error) {
    console.error('Errore stop scraping automatico:', error);
    res.status(500).json({ 
      error: 'Errore nel fermare lo scraping automatico' 
    });
  }
});

// Scraping classifica
router.post('/classifica', requireAuth, async (req, res) => {
  try {
    const { url, lega_id } = req.body;
    
    if (!url || !lega_id) {
      return res.status(400).json({ error: 'URL e lega_id richiesti' });
    }
    
    const classifica = await scrapeClassifica(url);
    res.json({ success: true, classifica });
    
  } catch (error) {
    console.error('Errore scraping classifica:', error);
    res.status(500).json({ error: 'Errore nel scraping della classifica' });
  }
});

// Scraping risultati
router.post('/risultati', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL richiesto' });
    }
    
    const risultati = await scrapeRisultati(url);
    res.json({ success: true, risultati });
    
  } catch (error) {
    console.error('Errore scraping risultati:', error);
    res.status(500).json({ error: 'Errore nel scraping dei risultati' });
  }
});

// Scraping calciatori
router.post('/calciatori', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL richiesto' });
    }
    
    const calciatori = await scrapeCalciatori(url);
    res.json({ success: true, calciatori });
    
  } catch (error) {
    console.error('Errore scraping calciatori:', error);
    res.status(500).json({ error: 'Errore nel scraping dei calciatori' });
  }
});

// Scraping voti
router.post('/voti', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL richiesto' });
    }
    
    const voti = await scrapeVoti(url);
    res.json({ success: true, voti });
    
  } catch (error) {
    console.error('Errore scraping voti:', error);
    res.status(500).json({ error: 'Errore nel scraping dei voti' });
  }
});

// Aggiorna classifica nel database
router.post('/update-classifica', requireAuth, async (req, res) => {
  try {
    const { url, lega_id } = req.body;
    
    if (!url || !lega_id) {
      return res.status(400).json({ error: 'URL e lega_id richiesti' });
    }
    
    const result = await updateClassificaFromScraping(lega_id, url);
    res.json(result);
    
  } catch (error) {
    console.error('Errore aggiornamento classifica:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della classifica' });
  }
});

// Aggiorna voti nel database
router.post('/update-voti', requireAuth, async (req, res) => {
  try {
    const { url, lega_id } = req.body;
    
    if (!url || !lega_id) {
      return res.status(400).json({ error: 'URL e lega_id richiesti' });
    }
    
    const result = await updateVotiFromScraping(lega_id, url);
    res.json(result);
    
  } catch (error) {
    console.error('Errore aggiornamento voti:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dei voti' });
  }
});

// Importa calciatori nel database
router.post('/import-calciatori', requireAuth, async (req, res) => {
  try {
    const { url, lega_id } = req.body;
    
    if (!url || !lega_id) {
      return res.status(400).json({ error: 'URL e lega_id richiesti' });
    }
    
    const result = await importCalciatoriFromScraping(lega_id, url);
    res.json(result);
    
  } catch (error) {
    console.error('Errore importazione calciatori:', error);
    res.status(500).json({ error: 'Errore nell\'importazione dei calciatori' });
  }
});

// Scraping completo per una lega
router.post('/completo', requireAuth, async (req, res) => {
  try {
    const { 
      lega_id, 
      classifica_url, 
      voti_url, 
      calciatori_url 
    } = req.body;
    
    if (!lega_id) {
      return res.status(400).json({ error: 'lega_id richiesto' });
    }
    
    const results = {};
    
    // Scraping classifica se fornito URL
    if (classifica_url) {
      try {
        results.classifica = await updateClassificaFromScraping(lega_id, classifica_url);
      } catch (error) {
        results.classifica = { error: error.message };
      }
    }
    
    // Scraping voti se fornito URL
    if (voti_url) {
      try {
        results.voti = await updateVotiFromScraping(lega_id, voti_url);
      } catch (error) {
        results.voti = { error: error.message };
      }
    }
    
    // Scraping calciatori se fornito URL
    if (calciatori_url) {
      try {
        results.calciatori = await importCalciatoriFromScraping(lega_id, calciatori_url);
      } catch (error) {
        results.calciatori = { error: error.message };
      }
    }
    
    res.json({ success: true, results });
    
  } catch (error) {
    console.error('Errore scraping completo:', error);
    res.status(500).json({ error: 'Errore nel scraping completo' });
  }
});

// Test manuale delle credenziali
router.post('/test-credentials', requireAuth, async (req, res) => {
    try {
        const { leagueId, username, password } = req.body;
        
        if (!leagueId || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'League ID, username e password sono richiesti'
            });
        }

        console.log('🧪 TEST MANUALE CREDENZIALI:');
        console.log('League ID:', leagueId);
        console.log('Username:', username);
        console.log('Password:', '***');

        const scraper = new FantacalcioScraper();
        
        try {
            // Usa il nuovo metodo per testare solo le credenziali
            const result = await scraper.testCredentialsOnly(username, password);
            
            return res.json(result);

        } catch (error) {
            console.error('❌ Errore test credenziali:', error);
            return res.status(500).json({
                success: false,
                message: `Errore durante il test: ${error.message}`
            });
        }

    } catch (error) {
        console.error('❌ Errore endpoint test credenziali:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// Debug: ottieni credenziali dal database
router.get('/debug-credentials/:leagueId', requireAuth, async (req, res) => {
    try {
        const { leagueId } = req.params;
        const userId = req.user.id;

        console.log('🔍 DEBUG: Richiesta credenziali per lega:', leagueId);

        // Verifica che l'utente sia admin della lega
        const lega = await Lega.findOne({
            where: { id: leagueId, admin_id: userId }
        });

        if (!lega) {
            return res.status(404).json({
                success: false,
                message: 'Lega non trovata o non autorizzato'
            });
        }

        console.log('🔍 DEBUG: Credenziali trovate:', {
            id: lega.id,
            nome: lega.nome,
            username: lega.fantacalcio_username,
            password: lega.fantacalcio_password ? '***' : 'NON IMPOSTATA',
            hasPassword: !!lega.fantacalcio_password
        });

        res.json({
            success: true,
            data: {
                leagueId: lega.id,
                leagueName: lega.nome,
                username: lega.fantacalcio_username,
                hasPassword: !!lega.fantacalcio_password,
                passwordLength: lega.fantacalcio_password ? lega.fantacalcio_password.length : 0
            }
        });

    } catch (error) {
        console.error('❌ Errore debug credenziali:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// Test URL di scraping
router.post('/test-urls', requireAuth, async (req, res) => {
    try {
        const { leagueUrl } = req.body;
        
        if (!leagueUrl) {
            return res.status(400).json({
                success: false,
                message: 'League URL è richiesto'
            });
        }

        console.log('🔗 TEST URL SCRAPING:', leagueUrl);

        const urlsToTest = [
            { name: 'classifica', url: `${leagueUrl}/classifica` },
            { name: 'voti', url: `${leagueUrl}/voti` },
            { name: 'voti-giornata', url: `${leagueUrl}/voti-giornata` },
            { name: 'calciatori', url: `${leagueUrl}/calciatori` },
            { name: 'rose', url: `${leagueUrl}/rose` },
            { name: 'giocatori', url: `${leagueUrl}/giocatori` },
            { name: 'squadre', url: `${leagueUrl}/squadre` }
        ];

        const results = [];

        for (const urlTest of urlsToTest) {
            try {
                const response = await fetch(urlTest.url, {
                    method: 'HEAD',
                    timeout: 10000
                });
                
                results.push({
                    name: urlTest.name,
                    url: urlTest.url,
                    status: response.status,
                    exists: response.ok
                });
                
                console.log(`✅ ${urlTest.name}: ${response.status} - ${response.ok ? 'ESISTE' : 'NON ESISTE'}`);
                
            } catch (error) {
                results.push({
                    name: urlTest.name,
                    url: urlTest.url,
                    status: 'ERROR',
                    exists: false,
                    error: error.message
                });
                
                console.log(`❌ ${urlTest.name}: ERRORE - ${error.message}`);
            }
        }

        const existingUrls = results.filter(r => r.exists);
        const suggestedUrls = {
            classifica: existingUrls.find(r => r.name === 'classifica')?.url || `${leagueUrl}/classifica`,
            voti: existingUrls.find(r => r.name === 'voti' || r.name === 'voti-giornata')?.url || `${leagueUrl}/voti-giornata`,
            calciatori: existingUrls.find(r => r.name === 'rose' || r.name === 'calciatori' || r.name === 'giocatori')?.url || `${leagueUrl}/rose`
        };

        return res.json({
            success: true,
            message: `Test completato - ${existingUrls.length} URL validi trovati`,
            results,
            suggestedUrls
        });

    } catch (error) {
        console.error('❌ Errore test URL:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// Test credenziali con Puppeteer
router.post('/test-credentials-puppeteer', requireAuth, async (req, res) => {
    try {
        const { lega_id, username, password } = req.body;
        if (!lega_id || !username || !password) {
            return res.status(400).json({ success: false, message: 'lega_id, username e password sono richiesti' });
        }
        const result = await testCredentialsWithPuppeteer(username, password);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Test URL di scraping con Puppeteer (per siti protetti)
router.post('/test-urls-puppeteer', requireAuth, async (req, res) => {
    try {
        const { leagueUrl, scrapingUrls, username, password } = req.body;
        
        if (!leagueUrl) {
            return res.status(400).json({
                success: false,
                message: 'League URL è richiesto'
            });
        }
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username e password sono richiesti per testare URL protetti'
            });
        }

        console.log('🔗 TEST URL SCRAPING CON PUPPETEER:', leagueUrl);
        console.log('🌐 URL di scraping da testare:', scrapingUrls);

        const scraper = new FantacalcioScraper();
        
        try {
            // Testa tutti gli URL di scraping
            const results = await scraper.testUrls(leagueUrl, scrapingUrls, { username, password });
            
            return res.json({
                success: true,
                message: 'Test URL completato con successo',
                data: results
            });
        
    } catch (error) {
            console.error('❌ Errore test URL Puppeteer:', error);
            return res.status(500).json({
                success: false,
                message: `Errore durante il test: ${error.message}`
            });
        }

    } catch (error) {
        console.error('❌ Errore endpoint test URL Puppeteer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Errore interno del server'
        });
    }
});

// Endpoint per ottenere i dati di scraping di una lega
router.get('/dati-scraping/:legaId', requireAuth, async (req, res) => {
  try {
    const { legaId } = req.params;
    console.log(`[DEBUG] /dati-scraping/${legaId} - Inizio richiesta`);
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica che l'utente abbia accesso alla lega
    let lega;
    try {
      const legaResult = await db.query('SELECT * FROM leghe WHERE id = $1', [legaId]);
      lega = legaResult.rows[0];
    } catch (err) {
      console.error(`[DEBUG] Errore query lega:`, err);
      return res.status(500).json({ error: 'Errore query lega', details: err.message });
    }
    
    if (!lega) {
      console.warn(`[DEBUG] Lega non trovata: ${legaId}`);
      return res.status(404).json({ error: 'Lega non trovata', legaId });
    }
    
    // Ottieni squadre di scraping
    let squadreScraping;
    try {
      const squadreResult = await db.query(`
        SELECT id, nome, data_scraping, fonte_scraping 
        FROM squadre_scraping 
        WHERE lega_id = $1 
        ORDER BY nome
      `, [legaId]);
      squadreScraping = squadreResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query squadre_scraping:`, err);
      return res.status(500).json({ error: 'Errore query squadre_scraping', details: err.message });
    }
    
    // Ottieni giocatori di scraping
    let giocatoriScraping;
    try {
      const giocatoriResult = await db.query(`
        SELECT gs.*, ss.nome as nome_squadra_scraping
        FROM giocatori_scraping gs
        JOIN squadre_scraping ss ON gs.squadra_scraping_id = ss.id
        WHERE gs.lega_id = $1
        ORDER BY ss.nome, gs.nome
      `, [legaId]);
      giocatoriScraping = giocatoriResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query giocatori_scraping:`, err);
      return res.status(500).json({ error: 'Errore query giocatori_scraping', details: err.message });
    }
    
    // Raggruppa giocatori per squadra
    const squadreConGiocatori = squadreScraping.map(squadra => ({
      ...squadra,
      giocatori: giocatoriScraping.filter(g => g.squadra_scraping_id === squadra.id)
    }));
    
    // Ottieni classifica di scraping
    let classificaScraping;
    try {
      const classificaResult = await db.query(`
        SELECT posizione, squadra, punti, partite, data_scraping
        FROM classifica_scraping 
        WHERE lega_id = $1 
        ORDER BY posizione
      `, [legaId]);
      classificaScraping = classificaResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query classifica_scraping:`, err);
      classificaScraping = [];
    }
    
    // Ottieni voti di scraping
    let votiScraping;
    try {
      const votiResult = await db.query(`
        SELECT giocatore, voto, squadra, giornata, data_scraping
        FROM voti_scraping 
        WHERE lega_id = $1 
        ORDER BY giornata DESC, voto DESC
      `, [legaId]);
      votiScraping = votiResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query voti_scraping:`, err);
      votiScraping = [];
    }
    
    // Ottieni formazioni di scraping
    let formazioniScraping;
    try {
      const formazioniResult = await db.query(`
        SELECT squadra, modulo, titolari, panchinari, data_scraping
        FROM formazioni_scraping 
        WHERE lega_id = $1 
        ORDER BY squadra
      `, [legaId]);
      formazioniScraping = formazioniResult.rows.map(row => ({
        ...row,
        titolari: row.titolari ? (() => {
          try {
            return JSON.parse(row.titolari);
          } catch (e) {
            console.warn(`[DEBUG] Errore parsing JSON titolari per formazione ${row.id}:`, e.message);
            return [];
          }
        })() : [],
        panchinari: row.panchinari ? (() => {
          try {
            return JSON.parse(row.panchinari);
          } catch (e) {
            console.warn(`[DEBUG] Errore parsing JSON panchinari per formazione ${row.id}:`, e.message);
            return [];
          }
        })() : []
      }));
    } catch (err) {
      console.error(`[DEBUG] Errore query formazioni_scraping:`, err);
      formazioniScraping = [];
    }
    
    // Ottieni mercato di scraping
    let mercatoScraping;
    try {
      const mercatoResult = await db.query(`
        SELECT giocatore, da, a, prezzo, tipo, data_scraping
        FROM mercato_scraping 
        WHERE lega_id = $1 
        ORDER BY data_scraping DESC
      `, [legaId]);
      mercatoScraping = mercatoResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query mercato_scraping:`, err);
      mercatoScraping = [];
    }
    
    console.log(`[DEBUG] /dati-scraping/${legaId} - Successo, squadre: ${squadreScraping.length}, giocatori: ${giocatoriScraping.length}, classifica: ${classificaScraping.length}, voti: ${votiScraping.length}, formazioni: ${formazioniScraping.length}, mercato: ${mercatoScraping.length}`);
    res.json({
      success: true,
      lega: {
        id: lega.id,
        nome: lega.nome
      },
      dati_scraping: {
        rose: squadreConGiocatori,
        classifica: classificaScraping,
        voti: votiScraping,
        formazioni: formazioniScraping,
        mercato: mercatoScraping,
        totale_squadre: squadreScraping.length,
        totale_giocatori: giocatoriScraping.length,
        totale_posizioni: classificaScraping.length,
        totale_voti: votiScraping.length,
        totale_formazioni: formazioniScraping.length,
        totale_movimenti: mercatoScraping.length,
        ultimo_scraping: squadreScraping.length > 0 ? 
          Math.max(...squadreScraping.map(s => new Date(s.data_scraping).getTime())) : null
      }
    });
    
  } catch (error) {
    console.error('[DEBUG] Errore generico dati-scraping:', error);
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Endpoint per confrontare dati ufficiali vs scraping
router.get('/confronto/:legaId', requireAuth, async (req, res) => {
  try {
    const { legaId } = req.params;
    console.log(`[DEBUG] /confronto/${legaId} - Inizio richiesta`);
    
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database non disponibile' });
    }

    // Verifica che l'utente abbia accesso alla lega
    let lega;
    try {
      const legaResult = await db.query('SELECT * FROM leghe WHERE id = $1', [legaId]);
      lega = legaResult.rows[0];
    } catch (err) {
      console.error(`[DEBUG] Errore query lega:`, err);
      return res.status(500).json({ error: 'Errore query lega', details: err.message });
    }
    
    if (!lega) {
      console.warn(`[DEBUG] Lega non trovata: ${legaId}`);
      return res.status(404).json({ error: 'Lega non trovata', legaId });
    }
    
    // Ottieni squadre ufficiali
    let squadreUfficiali;
    try {
      const squadreResult = await db.query(`
        SELECT id, nome, casse_societarie, valore_squadra 
        FROM squadre 
        WHERE lega_id = $1 
        ORDER BY nome
      `, [legaId]);
      squadreUfficiali = squadreResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query squadre ufficiali:`, err);
      return res.status(500).json({ error: 'Errore query squadre ufficiali', details: err.message });
    }
    
    // Ottieni giocatori ufficiali
    let giocatoriUfficiali;
    try {
      const giocatoriResult = await db.query(`
        SELECT g.*, s.nome as nome_squadra
        FROM giocatori g
        JOIN squadre s ON g.squadra_id = s.id
        WHERE s.lega_id = $1
        ORDER BY s.nome, g.nome
      `, [legaId]);
      giocatoriUfficiali = giocatoriResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query giocatori ufficiali:`, err);
      return res.status(500).json({ error: 'Errore query giocatori ufficiali', details: err.message });
    }
    
    // Ottieni squadre di scraping
    let squadreScraping;
    try {
      const squadreScrapingResult = await db.query(`
        SELECT id, nome, data_scraping 
        FROM squadre_scraping 
        WHERE lega_id = $1 
        ORDER BY nome
      `, [legaId]);
      squadreScraping = squadreScrapingResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query squadre_scraping:`, err);
      return res.status(500).json({ error: 'Errore query squadre_scraping', details: err.message });
    }
    
    // Ottieni giocatori di scraping
    let giocatoriScraping;
    try {
      const giocatoriScrapingResult = await db.query(`
        SELECT gs.*, ss.nome as nome_squadra_scraping
        FROM giocatori_scraping gs
        JOIN squadre_scraping ss ON gs.squadra_scraping_id = ss.id
        WHERE gs.lega_id = $1
        ORDER BY ss.nome, gs.nome
      `, [legaId]);
      giocatoriScraping = giocatoriScrapingResult.rows;
    } catch (err) {
      console.error(`[DEBUG] Errore query giocatori_scraping:`, err);
      return res.status(500).json({ error: 'Errore query giocatori_scraping', details: err.message });
    }
    
    // Analisi del confronto
    const confronto = {
      squadre_ufficiali: squadreUfficiali.length,
      squadre_scraping: squadreScraping.length,
      giocatori_ufficiali: giocatoriUfficiali.length,
      giocatori_scraping: giocatoriScraping.length,
      squadre_comuni: 0,
      giocatori_comuni: 0,
      differenze: []
    };
    
    // Trova squadre comuni
    const nomiSquadreUfficiali = squadreUfficiali.map(s => s.nome.toLowerCase());
    const nomiSquadreScraping = squadreScraping.map(s => s.nome.toLowerCase());
    
    confronto.squadre_comuni = nomiSquadreUfficiali.filter(nome => 
      nomiSquadreScraping.includes(nome)
    ).length;
    
    // Trova giocatori comuni
    const nomiGiocatoriUfficiali = giocatoriUfficiali.map(g => g.nome.toLowerCase());
    const nomiGiocatoriScraping = giocatoriScraping.map(g => g.nome.toLowerCase());
    
    confronto.giocatori_comuni = nomiGiocatoriUfficiali.filter(nome => 
      nomiGiocatoriScraping.includes(nome)
    ).length;
    
    console.log(`[DEBUG] /confronto/${legaId} - Successo, squadre ufficiali: ${squadreUfficiali.length}, scraping: ${squadreScraping.length}`);
    res.json({
      success: true,
      lega: {
        id: lega.id,
        nome: lega.nome
      },
      confronto,
      dati_ufficiali: {
        squadre: squadreUfficiali,
        giocatori: giocatoriUfficiali
      },
      dati_scraping: {
        squadre: squadreScraping,
        giocatori: giocatoriScraping
      }
    });
    
  } catch (error) {
    console.error('[DEBUG] Errore generico confronto:', error);
    res.status(500).json({ error: 'Errore interno del server', details: error.message });
  }
});

// Debug: analizza struttura pagina
router.post('/debug-page-structure', requireAuth, async (req, res) => {
    try {
        const { url, username, password } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL è richiesto'
            });
        }

        console.log('🔍 DEBUG: Analisi struttura pagina:', url);

        const scraper = new FantacalcioScraper();
        
        try {
            if (!await scraper.init()) {
                throw new Error('Impossibile inizializzare il browser Puppeteer');
            }

            // Se sono fornite credenziali, fai login
            if (username && password) {
                if (!await scraper.login(username, password)) {
                    throw new Error('Login fallito - credenziali non valide');
                }
            }

            // Analizza la struttura della pagina
            const structure = await scraper.debugPageStructure(url);
            
            await scraper.close();
            
            return res.json({
                success: true,
                message: 'Struttura pagina analizzata con successo',
                data: structure
            });

        } catch (error) {
            await scraper.close();
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Errore debug struttura pagina:', error);
        res.status(500).json({ 
            success: false, 
            message: `Errore durante l'analisi: ${error.message}`
        });
    }
});

// NUOVO ENDPOINT: Scraping con Playwright (frontend)
router.post('/playwright', requireAuth, async (req, res) => {
  try {
    const { 
      leagueUrl, 
      scrapingUrls,
      username, 
      password, 
      tournamentId = null,
      lega_id = null,
      selectedTournament = null,
      tournament = null
    } = req.body;
    
    if (!leagueUrl || !username || !password) {
      return res.status(400).json({ 
        error: 'leagueUrl, username e password sono richiesti' 
      });
    }
    
    console.log('Recupero tornei per lega:', lega_id);
    console.log('URL:', leagueUrl);
    console.log(`Avvio scraping con Playwright per: ${leagueUrl}`);
    console.log(`Username ricevuto: ${username}`);
    console.log(`Password ricevuta: ${password}`);
    console.log(`URL di scraping:`, scrapingUrls);
    console.log(`Torneo selezionato:`, tournament || selectedTournament);
    console.log(`Dettagli richiesta:`, {
      leagueUrl,
      scrapingUrls,
      username,
      password: password ? '***' : 'MISSING',
      tournamentId,
      lega_id,
      tournament: tournament || selectedTournament,
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });
    
    // Importa PlaywrightScraper dal backend
    const { default: PlaywrightScraper } = await import('../utils/playwrightScraper.js');
    const scraper = new PlaywrightScraper();
    
    try {
      const results = await scraper.scrapeLeague(
        leagueUrl,
        scrapingUrls,
        { username, password },
        tournamentId,
        lega_id
      );
      
      if (results) {
        console.log('✅ Scraping con Playwright completato con successo');
        
        // Salva i dati nel database se abbiamo una lega_id e dati validi
        if (lega_id && results) {
          try {
            console.log('💾 Salvataggio dati nel database...');
            
            // Prima elimina tutti i dati di scraping precedenti
            console.log('🗑️ Eliminazione dati di scraping precedenti...');
            await scraper.clearAllScrapingData(lega_id);
            
            results.database = {};
            
            // Salva rose
            if (results.rose && Array.isArray(results.rose) && results.rose.length > 0) {
              const roseResults = await scraper.saveRoseToDatabase(lega_id, results.rose);
              results.database.rose = roseResults;
              console.log('✅ Rose salvate nel database:', roseResults);
            }
            
            // Salva classifica
            if (results.classifica && Array.isArray(results.classifica) && results.classifica.length > 0) {
              const classificaResults = await scraper.saveClassificaToDatabase(lega_id, results.classifica);
              results.database.classifica = classificaResults;
              console.log('✅ Classifica salvata nel database:', classificaResults);
            }
            
            // Salva formazioni
            if (results.formazioni && Array.isArray(results.formazioni) && results.formazioni.length > 0) {
              const formazioniResults = await scraper.saveFormazioniToDatabase(lega_id, results.formazioni);
              results.database.formazioni = formazioniResults;
              console.log('✅ Formazioni salvate nel database:', formazioniResults);
            }
            
            console.log('✅ Tutti i dati salvati nel database');
          } catch (dbError) {
            console.error('❌ Errore salvataggio database:', dbError);
            results.database = { error: dbError.message };
          }
        }
        
        let message = 'Scraping con Playwright completato con successo';
        if (results.summary) {
          message += `. Trovate: ${results.summary.squadre_trovate} squadre, ${results.summary.giocatori_totali} giocatori`;
        }
        
        if (results.database && results.database.success) {
          message += `. Salvati nel database: ${results.database.squadre_salvate} squadre, ${results.database.giocatori_salvati} giocatori`;
        }
        
        if (tournament || selectedTournament) {
          message += ` (Torneo ID: ${tournament || selectedTournament})`;
        }
        
        res.json({ 
          success: true, 
          message: message,
          data: results 
        });
      } else {
        console.log('❌ Scraping con Playwright fallito - risultati nulli');
        res.json({ 
          success: false, 
          error: 'Scraping fallito - controlla le credenziali e l\'URL',
          message: 'Le credenziali potrebbero essere errate o l\'URL non è valido'
        });
      }
    } catch (scrapingError) {
      console.error('❌ Errore durante lo scraping con Playwright:', scrapingError);
      res.json({ 
        success: false,
        error: 'Errore durante lo scraping: ' + scrapingError.message,
        message: 'Si è verificato un errore durante il processo di scraping con Playwright'
      });
    }
    
  } catch (error) {
    console.error('❌ Errore generale scraping con Playwright:', error);
    res.json({ 
      success: false,
      error: 'Errore durante lo scraping: ' + error.message,
      message: 'Si è verificato un errore generale nel sistema di scraping con Playwright'
    });
  }
});



// Endpoint di test senza autenticazione
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server funzionante',
        timestamp: new Date().toISOString()
    });
});

// NUOVO ENDPOINT: Scraping batch di più tornei con Playwright
router.post('/playwright-batch', requireAuth, async (req, res) => {
  try {
    const { 
      leagueUrl, 
      scrapingUrls,
      username, 
      password, 
      tournamentIds = [],
      lega_id = null
    } = req.body;
    
    if (!leagueUrl || !username || !password) {
      return res.status(400).json({ 
        error: 'leagueUrl, username e password sono richiesti' 
      });
    }
    
    if (!tournamentIds || tournamentIds.length === 0) {
      return res.status(400).json({ 
        error: 'Almeno un tournamentId è richiesto per lo scraping batch' 
      });
    }
    
    console.log(`Avvio scraping batch con Playwright per ${tournamentIds.length} tornei`);
    console.log('URL:', leagueUrl);
    console.log('Tornei:', tournamentIds);
    
    // Importa PlaywrightScraper dal backend
    const { default: PlaywrightScraper } = await import('../utils/playwrightScraper.js');
    const scraper = new PlaywrightScraper();
    
    const batchResults = [];
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Inizializza il browser una sola volta per tutti i tornei
      await scraper.init();
      
      // Login una sola volta
      const loginSuccess = await scraper.login(username, password);
      if (!loginSuccess) {
        throw new Error('Login fallito per tutti i tornei');
      }
      
      // Scraping per ogni torneo
      for (let i = 0; i < tournamentIds.length; i++) {
        const tournamentId = tournamentIds[i];
        
        console.log(`Scraping torneo ${i + 1}/${tournamentIds.length}: ${tournamentId}`);
        
        try {
          // Seleziona il torneo
          await scraper.selectTournament(tournamentId);
          
          // Esegui lo scraping
          const results = await scraper.scrapeLeague(
            leagueUrl,
            scrapingUrls,
            { username, password },
            tournamentId,
            lega_id
          );
          
          if (results && results.rose) {
            successCount++;
            batchResults.push({
              tournamentId,
              success: true,
              data: results,
              summary: {
                squadre: results.rose.length,
                giocatori: results.rose.reduce((total, squadra) => total + (squadra.giocatori?.length || 0), 0)
              }
            });
            
            console.log(`✅ Torneo ${tournamentId} completato: ${results.rose.length} squadre`);
          } else {
            errorCount++;
            batchResults.push({
              tournamentId,
              success: false,
              error: 'Nessun dato estratto'
            });
            console.log(`❌ Torneo ${tournamentId} fallito: nessun dato`);
          }
          
        } catch (tournamentError) {
          errorCount++;
          batchResults.push({
            tournamentId,
            success: false,
            error: tournamentError.message
          });
          console.log(`❌ Errore torneo ${tournamentId}: ${tournamentError.message}`);
        }
        
        // Pausa tra le richieste
        if (i < tournamentIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      await scraper.close();
      
      const message = `Scraping batch completato: ${successCount} successi, ${errorCount} errori su ${tournamentIds.length} tornei`;
      
      res.json({ 
        success: successCount > 0,
        message: message,
        data: batchResults,
        summary: {
          total: tournamentIds.length,
          success: successCount,
          errors: errorCount
        }
      });
      
    } catch (scrapingError) {
      await scraper.close();
      console.error('❌ Errore durante lo scraping batch:', scrapingError);
      res.json({ 
        success: false,
        error: 'Errore durante lo scraping batch: ' + scrapingError.message,
        data: batchResults
      });
    }
    
  } catch (error) {
    console.error('❌ Errore generale scraping batch:', error);
    res.json({ 
      success: false,
      error: 'Errore durante lo scraping batch: ' + error.message
    });
  }
});

// Scraping classifica con Playwright
router.post('/playwright-classifica', requireAuth, async (req, res) => {
    try {
        const { lega_id, leagueUrl, username, password, tournamentId } = req.body;
        
        if (!lega_id || !leagueUrl || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'lega_id, leagueUrl, username e password sono obbligatori'
            });
        }

        console.log('🏆 Scraping classifica con Playwright per lega:', lega_id);
        console.log('URL:', leagueUrl);

        // Recupera il tipo di lega dal database
        const legaResult = await db.query(
            'SELECT tipo_lega FROM leghe WHERE id = $1',
            [lega_id]
        );

        if (legaResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Lega non trovata nel database'
            });
        }

        const legaInfo = legaResult.rows[0];

        const scraper = new PlaywrightScraper();
        
        try {
            // Inizializza il browser
            if (!await scraper.init()) {
                throw new Error('Impossibile inizializzare Playwright');
            }

            // Imposta il tipo di lega dal database e l'URL
            scraper.setLeagueType(legaInfo.tipo_lega, leagueUrl);

            // Login
            const loginSuccess = await scraper.login(username, password, leagueUrl);
            if (!loginSuccess) {
                throw new Error('Login fallito');
            }

            // Seleziona il torneo se specificato
            if (tournamentId) {
                await scraper.selectTournament(tournamentId);
            }

            // Costruisci l'URL della classifica in modo più flessibile
            let classificaUrl;
            if (legaInfo.tipo_lega === 'euroleghe') {
                // Per Euroleghe Mantra, prova diversi formati di URL
                const baseUrl = leagueUrl.replace(/\/$/, ''); // Rimuovi slash finale
                const tournamentParam = tournamentId ? `?id=${tournamentId}` : '';
                
                // Prova diversi formati di URL per la classifica
                const possibleUrls = [
                    `${baseUrl}/classifica${tournamentParam}`,
                    `${baseUrl}/classifica/${tournamentId || ''}`,
                    `${baseUrl}/ranking${tournamentParam}`,
                    `${baseUrl}/posizioni${tournamentParam}`,
                    `${baseUrl}/classifica`
                ];
                
                console.log('URL possibili per la classifica:', possibleUrls);
                classificaUrl = possibleUrls[0]; // Usa il primo formato come default
            } else {
                // Per Serie A Classic, usa il formato standard
                const baseUrl = leagueUrl.replace(/\/$/, ''); // Rimuovi slash finale
                classificaUrl = `${baseUrl}/classifica${tournamentId ? `?id=${tournamentId}` : ''}`;
            }
            
            console.log('URL classifica finale:', classificaUrl);
            
            // Esegui lo scraping della classifica
            const classifica = await scraper.scrapeClassifica(classificaUrl);
            
            // Salva nel database
            if (classifica && Array.isArray(classifica) && classifica.length > 0) {
                const dbResult = await scraper.saveClassificaToDatabase(lega_id, classifica);
                console.log('✅ Classifica salvata nel database:', dbResult);
            }

            await scraper.close();

            res.json({
                success: true,
                classifica: classifica,
                posizioni_trovate: classifica ? classifica.length : 0,
                tipo_lega: scraper.tipoLega
            });

        } catch (error) {
            await scraper.close();
            throw error;
        }

    } catch (error) {
        console.error('❌ Errore scraping classifica:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante lo scraping della classifica'
        });
    }
});

// Scraping formazioni con Playwright
router.post('/playwright-formazioni', requireAuth, async (req, res) => {
    try {
        const { lega_id, leagueUrl, username, password, tournamentId, giornata } = req.body;
        
        if (!lega_id || !leagueUrl || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'lega_id, leagueUrl, username e password sono obbligatori'
            });
        }

        console.log('⚽ Scraping formazioni con Playwright per lega:', lega_id);
        console.log('URL:', leagueUrl);
        console.log('Giornata:', giornata || 'non specificata');

        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database non disponibile' });
        }

        // Recupera il tipo di lega dal database
        const legaResult = await db.query(
            'SELECT tipo_lega FROM leghe WHERE id = $1',
            [lega_id]
        );

        if (legaResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Lega non trovata nel database'
            });
        }

        const legaInfo = legaResult.rows[0];

        const scraper = new PlaywrightScraper();
        
        try {
            // Inizializza il browser
            if (!await scraper.init()) {
                throw new Error('Impossibile inizializzare Playwright');
            }

            // Imposta il tipo di lega dal database e l'URL
            scraper.setLeagueType(legaInfo.tipo_lega, leagueUrl);

            // Login
            const loginSuccess = await scraper.login(username, password, leagueUrl);
            if (!loginSuccess) {
                throw new Error('Login fallito');
            }

            // Seleziona il torneo se specificato
            if (tournamentId) {
                await scraper.selectTournament(tournamentId);
            }

            // Costruisci l'URL delle formazioni
            let formazioniUrl = `${leagueUrl}/formazioni`;
            
            // Aggiungi la giornata all'URL se specificata
            if (giornata) {
                formazioniUrl += `/${giornata}`;
            }
            
            // Aggiungi il parametro del torneo se specificato
            if (tournamentId) {
                formazioniUrl += `${formazioniUrl.includes('?') ? '&' : '?'}id=${tournamentId}`;
            }
            
            console.log('🌐 URL formazioni costruito:', formazioniUrl);
            
            // Esegui lo scraping delle formazioni
            const formazioni = await scraper.scrapeFormazioni(formazioniUrl, giornata);
            
            // Salva nel database
            if (formazioni && Array.isArray(formazioni) && formazioni.length > 0) {
                const dbResult = await scraper.saveFormazioniToDatabase(lega_id, formazioni);
                console.log('✅ Formazioni salvate nel database:', dbResult);
            }

            await scraper.close();

            res.json({
                success: true,
                formazioni: formazioni,
                formazioni_trovate: formazioni ? formazioni.length : 0,
                giornata: giornata || 'non specificata',
                tipo_lega: scraper.tipoLega
            });

        } catch (error) {
            await scraper.close();
            throw error;
        }

    } catch (error) {
        console.error('❌ Errore scraping formazioni:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante lo scraping delle formazioni'
        });
    }
});

// Scraping completo (rose + classifica + formazioni) con Playwright
router.post('/playwright-completo', requireAuth, async (req, res) => {
    try {
        const { lega_id, leagueUrl, username, password, tournamentId, giornata } = req.body;
        
        if (!lega_id || !leagueUrl || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'lega_id, leagueUrl, username e password sono obbligatori'
            });
        }

        console.log('🔄 Scraping completo con Playwright per lega:', lega_id);
        console.log('URL:', leagueUrl);
        console.log('Torneo:', tournamentId || 'non specificato');
        console.log('Giornata:', giornata || 'non specificata');

        // Recupera il tipo di lega dal database
        const legaResult = await db.query(
            'SELECT tipo_lega FROM leghe WHERE id = $1',
            [lega_id]
        );

        if (legaResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Lega non trovata nel database'
            });
        }

        const legaInfo = legaResult.rows[0];

        const scraper = new PlaywrightScraper();
        
        try {
            // Costruisci gli URL di scraping
            const baseUrl = leagueUrl.replace(/\/$/, '');
            const tournamentParam = tournamentId ? `?id=${tournamentId}` : '';
            
            const scrapingUrls = {
                rose: `${baseUrl}/rose${tournamentParam}`,
                classifica: `${baseUrl}/classifica${tournamentParam}`,
                formazioni: `${baseUrl}/formazioni${tournamentParam}`
            };

            console.log('URL di scraping:', scrapingUrls);

            // Esegui lo scraping completo
            const results = await scraper.scrapeLeague(
                leagueUrl,
                scrapingUrls,
                { username, password },
                tournamentId,
                lega_id
            );

            await scraper.close();

            res.json({
                success: true,
                results: results,
                summary: {
                    squadre_trovate: results.rose ? results.rose.length : 0,
                    giocatori_totali: results.rose ? results.rose.reduce((total, squadra) => total + (squadra.giocatori?.length || 0), 0) : 0,
                    posizioni_classifica: results.classifica ? results.classifica.length : 0,
                    formazioni_trovate: results.formazioni ? results.formazioni.length : 0
                },
                tipo_lega: results.tipo_lega,
                torneo_selezionato: results.torneo_selezionato
            });

        } catch (error) {
            await scraper.close();
            throw error;
        }

    } catch (error) {
        console.error('❌ Errore scraping completo:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante lo scraping completo'
        });
    }
});

// Ottieni tornei disponibili per una lega
router.post('/tournaments', async (req, res) => {
    try {
        const { lega_id, leagueUrl, username, password } = req.body;
        
        console.log('🔍 [TOURNAMENTS] Richiesta ricevuta:', { lega_id, leagueUrl, username: username ? '***' : 'MISSING' });
        
        if (!lega_id || !leagueUrl || !username || !password) {
            console.log('❌ [TOURNAMENTS] Dati mancanti:', { lega_id: !!lega_id, leagueUrl: !!leagueUrl, username: !!username, password: !!password });
            return res.status(400).json({
                success: false,
                message: 'Dati mancanti: lega_id, leagueUrl, username, password sono obbligatori'
            });
        }

        console.log('✅ [TOURNAMENTS] Dati validi, recupero info lega...');

        // Recupera il tipo di lega dal database
        const legaResult = await db.query(
            'SELECT tipo_lega FROM leghe WHERE id = $1',
            [lega_id]
        );

        if (legaResult.rows.length === 0) {
            console.log('❌ [TOURNAMENTS] Lega non trovata nel database');
            return res.status(400).json({
                success: false,
                message: 'Lega non trovata nel database'
            });
        }

        const legaInfo = legaResult.rows[0];
        console.log('✅ [TOURNAMENTS] Lega trovata:', legaInfo);

        console.log('✅ [TOURNAMENTS] Tipo lega dal database:', legaInfo.tipo_lega);
        console.log('🔧 [TOURNAMENTS] Creazione PlaywrightScraper...');

        const scraper = new PlaywrightScraper();
        
        try {
            console.log('🔧 [TOURNAMENTS] Inizializzazione browser...');
            // Inizializza il browser
            if (!await scraper.init()) {
                throw new Error('Impossibile inizializzare Playwright');
            }

            console.log('✅ [TOURNAMENTS] Browser inizializzato');
            console.log('🔧 [TOURNAMENTS] Impostazione tipo lega e URL...');

            // Imposta il tipo di lega dal database e l'URL
            scraper.setLeagueType(legaInfo.tipo_lega, leagueUrl);

            console.log('✅ [TOURNAMENTS] Tipo lega impostato');
            console.log('🔐 [TOURNAMENTS] Tentativo login...');

            // Login
            const loginSuccess = await scraper.login(username, password, leagueUrl);
            if (!loginSuccess) {
                throw new Error('Login fallito');
            }

            console.log('✅ [TOURNAMENTS] Login riuscito');
            console.log('🔍 [TOURNAMENTS] Recupero tornei disponibili...');

            // Recupera i tornei disponibili
            const tournaments = await scraper.getAvailableTournaments();

            console.log('✅ [TOURNAMENTS] Tornei recuperati:', tournaments?.length || 0);

            // Se non sono stati trovati tornei, restituisci un messaggio informativo
            if (!tournaments || tournaments.length === 0) {
                console.log('⚠️ [TOURNAMENTS] Nessun torneo trovato, restituisco messaggio informativo');
                await scraper.close();
                
                return res.json({
                    success: true,
                    tournaments: [],
                    tipo_lega: scraper.tipoLega,
                    message: 'Nessun torneo trovato. Potrebbe essere necessario selezionare manualmente un torneo dalla pagina della lega.'
                });
            }

            await scraper.close();
            console.log('✅ [TOURNAMENTS] Browser chiuso');

            res.json({
                success: true,
                tournaments: tournaments,
                tipo_lega: scraper.tipoLega
            });

        } catch (error) {
            console.error('❌ [TOURNAMENTS] Errore durante lo scraping:', error);
            await scraper.close();
            throw error;
        }

    } catch (error) {
        console.error('❌ [TOURNAMENTS] Errore generale:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante il recupero dei tornei'
        });
    }
});

// NUOVO: API per i tornei preferiti

// Carica i tornei preferiti per una lega
router.get('/preferiti/:lega_id', requireAuth, async (req, res) => {
    try {
        const { lega_id } = req.params;
        const utente_id = req.user.id;
        
        console.log('📂 [PREFERITI] Caricamento preferiti per lega:', lega_id);
        
        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database non disponibile' });
        }

        const torneiResult = await db.query(
            'SELECT torneo_id, torneo_nome, torneo_url, created_at FROM tornei_preferiti WHERE utente_id = $1 AND lega_id = $2 ORDER BY created_at DESC',
            [utente_id, lega_id]
        );
        const tornei = torneiResult.rows;
        
        console.log('✅ [PREFERITI] Tornei trovati:', tornei?.length || 0);
        
        res.json({
            success: true,
            tornei: tornei.map(t => ({
                id: t.torneo_id,
                name: t.torneo_nome,
                url: t.torneo_url
            }))
        });
        
    } catch (error) {
        console.error('❌ [PREFERITI] Errore caricamento preferiti:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante il caricamento dei preferiti'
        });
    }
});

// Salva i tornei preferiti per una lega
router.post('/preferiti/salva', requireAuth, async (req, res) => {
    try {
        const { lega_id, tornei } = req.body;
        const utente_id = req.user.id;
        
        console.log('💾 [PREFERITI] Salvataggio preferiti per lega:', lega_id);
        console.log('📋 [PREFERITI] Tornei da salvare:', tornei?.length || 0);
        
        if (!lega_id || !tornei || !Array.isArray(tornei)) {
            return res.status(400).json({
                success: false,
                message: 'lega_id e tornei (array) sono obbligatori'
            });
        }
        
        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database non disponibile' });
        }

        // Prima rimuovi tutti i preferiti esistenti per questa lega
        await db.query(
            'DELETE FROM tornei_preferiti WHERE utente_id = $1 AND lega_id = $2',
            [utente_id, lega_id]
        );
        
        // Poi inserisci i nuovi preferiti
        let torneiSalvati = 0;
        for (const torneo of tornei) {
            await db.query(
                'INSERT INTO tornei_preferiti (utente_id, lega_id, torneo_id, torneo_nome, torneo_url, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
                [utente_id, lega_id, torneo.id, torneo.nome, torneo.url || null, new Date().toISOString()]
            );
            torneiSalvati++;
        }
        
        console.log('✅ [PREFERITI] Salvati', torneiSalvati, 'tornei preferiti');
        
        res.json({
            success: true,
            tornei_salvati: torneiSalvati,
            message: `Salvati ${torneiSalvati} tornei come preferiti`
        });
        
    } catch (error) {
        console.error('❌ [PREFERITI] Errore salvataggio preferiti:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante il salvataggio dei preferiti'
        });
    }
});

// Rimuovi un torneo dai preferiti
router.delete('/preferiti/:lega_id/:torneo_id', requireAuth, async (req, res) => {
    try {
        const { lega_id, torneo_id } = req.params;
        const utente_id = req.user.id;
        
        console.log('🗑️ [PREFERITI] Rimozione torneo dai preferiti:', { lega_id, torneo_id });
        
        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database non disponibile' });
        }

        await db.query(
            'DELETE FROM tornei_preferiti WHERE utente_id = $1 AND lega_id = $2 AND torneo_id = $3',
            [utente_id, lega_id, torneo_id]
        );
        
        console.log('✅ [PREFERITI] Torneo rimosso dai preferiti');
        
        res.json({
            success: true,
            message: 'Torneo rimosso dai preferiti con successo'
        });
        
    } catch (error) {
        console.error('❌ [PREFERITI] Errore rimozione preferito:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante la rimozione del preferito'
        });
    }
});

// NUOVO: Ottieni formazioni di scraping per una lega
router.get('/formazioni/:lega_id', requireAuth, async (req, res) => {
    try {
        const { lega_id } = req.params;
        
        console.log('📊 [FORMAZIONI] Caricamento formazioni per lega:', lega_id);
        
        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database non disponibile' });
        }

        const formazioniResult = await db.query(
            'SELECT * FROM formazioni_scraping WHERE lega_id = $1 ORDER BY created_at DESC',
            [lega_id]
        );
        const formazioni = formazioniResult.rows;
        
        console.log('✅ [FORMAZIONI] Formazioni trovate:', formazioni?.length || 0);
        
        // Parsa i dati JSON per ogni formazione
        const formazioniParsate = formazioni.map(formazione => {
            try {
                return {
                    ...formazione,
                    titolari: formazione.titolari ? JSON.parse(formazione.titolari) : [],
                    panchinari: formazione.panchinari ? JSON.parse(formazione.panchinari) : [],
                    altri_punti: formazione.altri_punti ? JSON.parse(formazione.altri_punti) : [],
                    totale: formazione.totale ? JSON.parse(formazione.totale) : null
                };
            } catch (parseError) {
                console.warn('⚠️ [FORMAZIONI] Errore parsing JSON per formazione:', formazione.id, parseError.message);
                return {
                    ...formazione,
                    titolari: [],
                    panchinari: [],
                    altri_punti: [],
                    totale: null
                };
            }
        });
        
        res.json({
            success: true,
            formazioni: formazioniParsate,
            totale: formazioniParsate.length
        });
        
    } catch (error) {
        console.error('❌ [FORMAZIONI] Errore caricamento formazioni:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante il caricamento delle formazioni'
        });
    }
});

// NUOVO: Raccogli immagini bonus
router.get('/bonus-images/:lega_id', requireAuth, async (req, res) => {
    try {
        const { lega_id } = req.params;
        
        console.log('🔍 [BONUS IMAGES] Raccolta immagini bonus per lega:', lega_id);
        
        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database non disponibile' });
        }

        // Trova l'URL delle formazioni per questa lega
        const legaResult = await db.query(
            'SELECT fantacalcio_url FROM leghe WHERE id = $1',
            [lega_id]
        );
        const lega = legaResult.rows[0];
        
        if (!lega || !lega.fantacalcio_url) {
            return res.status(404).json({
                success: false,
                message: 'URL fantacalcio non trovato per questa lega'
            });
        }
        
        const scraper = new PlaywrightScraper();
        await scraper.init();
        
        try {
            // Usa l'URL delle formazioni (sostituisci con l'URL corretto)
            const formazioniUrl = `${lega.fantacalcio_url}/formazioni`;
            const bonusImages = await scraper.collectBonusImages(formazioniUrl, 22); // giornata 22
            
            res.json({
                success: true,
                bonus_images: bonusImages,
                totale: bonusImages.length
            });
            
        } finally {
            await scraper.close();
        }
        
    } catch (error) {
        console.error('❌ [BONUS IMAGES] Errore raccolta immagini bonus:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Errore durante la raccolta delle immagini bonus'
        });
    }
});

export default router; 