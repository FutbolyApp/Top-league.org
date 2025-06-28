import { getDb } from './db/config.js';
import FantacalcioScraper from './utils/scraperPuppeteer.js';

const db = getDb();

async function testTournamentsManual() {
    console.log('🧪 Test tornei con login manuale...');
    
    try {
        // Inizializza lo scraper per login manuale
        const scraper = new FantacalcioScraper();
        
        if (!await scraper.initForManualLogin()) {
            throw new Error('Impossibile inizializzare il browser per login manuale');
        }
        
        // Imposta l'URL della lega (useremo TopLeague per testare Euroleghe)
        const leagueUrl = 'https://euroleghe.fantacalcio.it/topleague';
        scraper.leagueUrl = leagueUrl;
        
        // Attendi login manuale
        console.log('🔐 Attendo login manuale...');
        const loginSuccess = await scraper.waitForManualLogin(leagueUrl, {});
        if (!loginSuccess) {
            throw new Error('Login manuale non completato');
        }
        
        console.log('✅ Login manuale completato');
        
        // Testa il recupero tornei
        console.log('🔍 Test recupero tornei...');
        const tournaments = await scraper.getAvailableTournaments();
        
        console.log('\n📊 RISULTATI:');
        console.log(`Trovati ${tournaments.length} tornei:`);
        tournaments.forEach((tournament, index) => {
            console.log(`${index + 1}. ${tournament.name} (ID: ${tournament.id})`);
        });
        
        // Verifica che abbiamo trovato i tornei attesi per TopLeague
        const expectedTournaments = [
            '[LA] Lega A',
            '[LB] Lega B', 
            '[SCA] SuperCup A',
            '[SCB] SuperCup B',
            '[CL] Final Phase',
            'Playoff A',
            'PLAYOFF B',
            'SA - Finale'
        ];
        
        console.log('\n✅ VERIFICA:');
        expectedTournaments.forEach(expected => {
            const found = tournaments.find(t => t.name === expected);
            if (found) {
                console.log(`✅ ${expected} - TROVATO (ID: ${found.id})`);
            } else {
                console.log(`❌ ${expected} - NON TROVATO`);
            }
        });
        
        console.log('\n✅ Test completato con successo');
        console.log('💡 Il browser rimarrà aperto per 30 secondi per permetterti di verificare i risultati...');
        
        // Mantieni il browser aperto per 30 secondi
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        await scraper.close();
        
    } catch (error) {
        console.error('❌ Errore test:', error);
    } finally {
        process.exit(0);
    }
}

testTournamentsManual(); 