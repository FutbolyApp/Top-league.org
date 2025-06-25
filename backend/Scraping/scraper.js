import axios from 'axios';
import * as cheerio from 'cheerio';
import { getDb } from '../db/config.js';

const db = getDb();

// Configurazione per evitare blocchi
const axiosConfig = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  },
  timeout: 10000
};

// Scraping classifica da leghe.fantacalcio.it
export async function scrapeClassifica(url) {
  try {
    console.log(`Scraping classifica da: ${url}`);
    
    const response = await axios.get(url, axiosConfig);
    const $ = cheerio.load(response.data);
    
    const classifica = [];
    
    // Cerca la tabella classifica
    $('table').each((i, table) => {
      const rows = $(table).find('tr');
      
      rows.each((j, row) => {
        const cells = $(row).find('td');
        
        if (cells.length >= 8) {
          const posizione = $(cells[0]).text().trim();
          const squadra = $(cells[1]).text().trim();
          const punti = $(cells[8]).text().trim();
          const gFatti = $(cells[5]).text().trim();
          const gSubiti = $(cells[6]).text().trim();
          const differenza = $(cells[7]).text().trim();
          
          if (posizione && squadra && punti && !isNaN(parseInt(posizione))) {
            classifica.push({
              posizione: parseInt(posizione),
              squadra: squadra,
              punti: parseFloat(punti),
              g_fatti: parseInt(gFatti) || 0,
              g_subiti: parseInt(gSubiti) || 0,
              differenza: parseInt(differenza) || 0
            });
          }
        }
      });
    });
    
    console.log(`Classifica scrapata: ${classifica.length} squadre trovate`);
    return classifica;
    
  } catch (error) {
    console.error('Errore scraping classifica:', error.message);
    throw new Error(`Errore nel scraping della classifica: ${error.message}`);
  }
}

// Scraping risultati partite
export async function scrapeRisultati(url) {
  try {
    console.log(`Scraping risultati da: ${url}`);
    
    const response = await axios.get(url, axiosConfig);
    const $ = cheerio.load(response.data);
    
    const risultati = [];
    
    // Cerca i risultati delle partite
    $('.partita, .match, [class*="risultato"]').each((i, element) => {
      const $el = $(element);
      
      // Estrai nomi squadre
      const squadre = $el.find('.squadra, .team, [class*="nome"]').map((j, el) => $(el).text().trim()).get();
      
      // Estrai punteggi
      const punteggi = $el.find('.punteggio, .score, [class*="gol"]').map((j, el) => $(el).text().trim()).get();
      
      // Estrai punti fantacalcio
      const punti = $el.find('.punti, .points, [class*="punti"]').map((j, el) => $(el).text().trim()).get();
      
      if (squadre.length >= 2 && punteggi.length >= 2) {
        risultati.push({
          casa: squadre[0],
          trasferta: squadre[1],
          gol_casa: parseInt(punteggi[0]) || 0,
          gol_trasferta: parseInt(punteggi[1]) || 0,
          punti_casa: parseFloat(punti[0]) || 0,
          punti_trasferta: parseFloat(punti[1]) || 0,
          data: new Date().toISOString().split('T')[0] // Data odierna come fallback
        });
      }
    });
    
    console.log(`Risultati scrapati: ${risultati.length} partite trovate`);
    return risultati;
    
  } catch (error) {
    console.error('Errore scraping risultati:', error.message);
    throw new Error(`Errore nel scraping dei risultati: ${error.message}`);
  }
}

// Scraping lista calciatori
export async function scrapeCalciatori(url) {
  try {
    console.log(`Scraping calciatori da: ${url}`);
    
    const response = await axios.get(url, axiosConfig);
    const $ = cheerio.load(response.data);
    
    const calciatori = [];
    
    // Cerca la tabella calciatori
    $('table').each((i, table) => {
      const rows = $(table).find('tr');
      
      rows.each((j, row) => {
        const cells = $(row).find('td');
        
        if (cells.length >= 4) {
          const nome = $(cells[0]).text().trim();
          const ruolo = $(cells[1]).text().trim();
          const squadra = $(cells[2]).text().trim();
          const quotazione = $(cells[3]).text().trim();
          
          if (nome && ruolo && !isNaN(parseFloat(quotazione))) {
            calciatori.push({
              nome: nome,
              ruolo: normalizeRuolo(ruolo),
              squadra_reale: squadra,
              quotazione: parseFloat(quotazione),
              costo_attuale: parseFloat(quotazione) * 1000 // Converti in FM
            });
          }
        }
      });
    });
    
    console.log(`Calciatori scrapati: ${calciatori.length} giocatori trovati`);
    return calciatori;
    
  } catch (error) {
    console.error('Errore scraping calciatori:', error.message);
    throw new Error(`Errore nel scraping dei calciatori: ${error.message}`);
  }
}

// Scraping voti giornata
export async function scrapeVoti(url) {
  try {
    console.log(`Scraping voti da: ${url}`);
    
    const response = await axios.get(url, axiosConfig);
    const $ = cheerio.load(response.data);
    
    const voti = [];
    
    // Cerca i voti dei giocatori
    $('table').each((i, table) => {
      const rows = $(table).find('tr');
      
      rows.each((j, row) => {
        const cells = $(row).find('td');
        
        if (cells.length >= 3) {
          const nome = $(cells[0]).text().trim();
          const squadra = $(cells[1]).text().trim();
          const voto = $(cells[2]).text().trim();
          
          if (nome && squadra && !isNaN(parseFloat(voto))) {
            voti.push({
              nome: nome,
              squadra_reale: squadra,
              voto: parseFloat(voto),
              giornata: getCurrentGiornata()
            });
          }
        }
      });
    });
    
    console.log(`Voti scrapati: ${voti.length} giocatori trovati`);
    return voti;
    
  } catch (error) {
    console.error('Errore scraping voti:', error.message);
    throw new Error(`Errore nel scraping dei voti: ${error.message}`);
  }
}

// Funzione per aggiornare la classifica nel database
export async function updateClassificaFromScraping(legaId, url) {
  try {
    const classifica = await scrapeClassifica(url);
    
    // Aggiorna i punti delle squadre nel database
    for (const posizione of classifica) {
      db.run(
        `UPDATE squadre 
         SET punti_campionato = ?, 
             gol_fatti = ?, 
             gol_subiti = ?, 
             differenza_reti = ?
         WHERE lega_id = ? AND nome = ?`,
        [posizione.punti, posizione.g_fatti, posizione.g_subiti, posizione.differenza, legaId, posizione.squadra],
        function(err) {
          if (err) {
            console.error(`Errore aggiornamento squadra ${posizione.squadra}:`, err);
          }
        }
      );
    }
    
    console.log(`Classifica aggiornata per lega ${legaId}`);
    return { success: true, message: 'Classifica aggiornata con successo' };
    
  } catch (error) {
    console.error('Errore aggiornamento classifica:', error);
    throw error;
  }
}

// Funzione per aggiornare i voti dei giocatori
export async function updateVotiFromScraping(legaId, url) {
  try {
    const voti = await scrapeVoti(url);
    
    // Aggiorna i voti dei giocatori nel database
    for (const voto of voti) {
      db.run(
        `UPDATE giocatori 
         SET voto_ultima_giornata = ?,
             data_ultimo_voto = datetime('now')
         WHERE lega_id = ? AND nome = ? AND squadra_reale = ?`,
        [voto.voto, legaId, voto.nome, voto.squadra_reale],
        function(err) {
          if (err) {
            console.error(`Errore aggiornamento voto ${voto.nome}:`, err);
          }
        }
      );
    }
    
    console.log(`Voti aggiornati per lega ${legaId}`);
    return { success: true, message: 'Voti aggiornati con successo' };
    
  } catch (error) {
    console.error('Errore aggiornamento voti:', error);
    throw error;
  }
}

// Funzione per importare calciatori da scraping
export async function importCalciatoriFromScraping(legaId, url) {
  try {
    const calciatori = await scrapeCalciatori(url);
    
    // Importa i calciatori nel database
    for (const calciatore of calciatori) {
      db.run(
        `INSERT OR REPLACE INTO giocatori 
         (nome, ruolo, squadra_reale, quotazione, costo_attuale, lega_id, stato)
         VALUES (?, ?, ?, ?, ?, ?, 'disponibile')`,
        [calciatore.nome, calciatore.ruolo, calciatore.squadra_reale, calciatore.quotazione, calciatore.costo_attuale, legaId],
        function(err) {
          if (err) {
            console.error(`Errore importazione calciatore ${calciatore.nome}:`, err);
          }
        }
      );
    }
    
    console.log(`Calciatori importati per lega ${legaId}`);
    return { success: true, message: 'Calciatori importati con successo' };
    
  } catch (error) {
    console.error('Errore importazione calciatori:', error);
    throw error;
  }
}

// Funzioni di utilità
function normalizeRuolo(ruolo) {
  const ruoloStr = String(ruolo).toUpperCase().trim();
  
  const ruoloMap = {
    'P': 'P', 'PORTIERE': 'P', 'GOALKEEPER': 'P', 'GK': 'P',
    'D': 'D', 'DIFENSORE': 'D', 'DEFENDER': 'D', 'DEF': 'D',
    'C': 'C', 'CENTROCAMPISTA': 'C', 'MIDFIELDER': 'C', 'MID': 'C',
    'A': 'A', 'ATTACCANTE': 'A', 'FORWARD': 'A', 'FWD': 'A', 'ST': 'A'
  };
  
  return ruoloMap[ruoloStr] || 'C';
}

function getCurrentGiornata() {
  // Logica per determinare la giornata corrente
  // Per ora restituisce un valore fisso
  return 15;
}

// Funzione per testare il scraping
export async function testScraping(url) {
  try {
    console.log('Test scraping per URL:', url);
    
    const response = await axios.get(url, axiosConfig);
    const $ = cheerio.load(response.data);
    
    // Analizza la struttura della pagina
    const pageInfo = {
      title: $('title').text(),
      tables: $('table').length,
      links: $('a').length,
      forms: $('form').length
    };
    
    console.log('Informazioni pagina:', pageInfo);
    
    return {
      success: true,
      pageInfo,
      sampleData: {
        title: pageInfo.title,
        tables: pageInfo.tables,
        sampleText: $('body').text().substring(0, 200) + '...'
      }
    };
    
  } catch (error) {
    console.error('Errore test scraping:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
} 