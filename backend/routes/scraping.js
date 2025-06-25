import express from 'express';
import { requireAuth } from '../middleware/auth.js';
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

const router = express.Router();

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
      username, 
      password, 
      tournamentId = null 
    } = req.body;
    
    if (!leagueUrl || !username || !password) {
      return res.status(400).json({ 
        error: 'leagueUrl, username e password sono richiesti' 
      });
    }
    
    console.log(`🚀 Avvio scraping Puppeteer per: ${leagueUrl}`);
    console.log(`👤 Username ricevuto: ${username}`);
    console.log(`🔑 Password ricevuta: ${password}`);
    console.log(`📊 Dettagli richiesta:`, {
      leagueUrl,
      username,
      password: password ? '***' : 'MISSING',
      tournamentId,
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });
    
    const scraper = new FantacalcioScraper();
    
    try {
      const results = await scraper.scrapeLeague(leagueUrl, { username, password }, tournamentId);
      
      if (results) {
        console.log('✅ Scraping completato con successo');
        res.json({ 
          success: true, 
          message: 'Scraping completato con successo',
          data: results 
        });
      } else {
        console.log('❌ Scraping fallito - risultati nulli');
        res.json({ 
          success: false, 
          error: 'Scraping fallito - controlla le credenziali e l\'URL',
          message: 'Le credenziali potrebbero essere errate o l\'URL non è valido'
        });
      }
    } catch (scrapingError) {
      console.error('❌ Errore durante lo scraping:', scrapingError);
      res.json({ 
        success: false,
        error: 'Errore durante lo scraping: ' + scrapingError.message,
        message: 'Si è verificato un errore durante il processo di scraping'
      });
    }
    
  } catch (error) {
    console.error('❌ Errore generale scraping Puppeteer:', error);
    res.json({ 
      success: false,
      error: 'Errore durante lo scraping: ' + error.message,
      message: 'Si è verificato un errore generale nel sistema di scraping'
    });
  }
});

// Endpoint per aggiornare credenziali di una lega
router.post('/update-credentials', requireAuth, async (req, res) => {
  try {
    const { 
      lega_id, 
      fantacalcio_username, 
      fantacalcio_password 
    } = req.body;
    
    if (!lega_id || !fantacalcio_username || !fantacalcio_password) {
      return res.status(400).json({ 
        error: 'lega_id, fantacalcio_username e fantacalcio_password sono richiesti' 
      });
    }
    
    // TODO: Aggiorna le credenziali nel database
    // Per ora restituisce successo
    res.json({ 
      success: true, 
      message: 'Credenziali aggiornate con successo' 
    });
    
  } catch (error) {
    console.error('Errore aggiornamento credenziali:', error);
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

export default router; 