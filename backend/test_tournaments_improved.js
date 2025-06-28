import { getDb } from './db/config.js';
import FantacalcioScraper from './utils/scraperPuppeteer.js';

const db = getDb();

async function testTournamentsImproved() {
    console.log('🧪 Test tornei migliorato...');
    
    try {
        // Recupera le credenziali di FantaLeague11 dal database
        const credentials = await new Promise((resolve, reject) => {
            db.get(
                'SELECT fantacalcio_username as username, fantacalcio_password as password FROM leghe WHERE nome = ? AND fantacalcio_username IS NOT NULL AND fantacalcio_username != ""',
                ['FantaLeague11'],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
        
        if (!credentials) {
            throw new Error('Credenziali FantaLeague11 non trovate nel database');
        }
        
        console.log('✅ Credenziali trovate per FantaLeague11');
        console.log('DEBUG CREDENZIALI:', credentials);
        
        // Inizializza lo scraper
        const scraper = new FantacalcioScraper();
        
        if (!await scraper.init()) {
            throw new Error('Impossibile inizializzare il browser');
        }
        
        // Login
        console.log('🔐 Login...');
        if (!await scraper.login(credentials.username, credentials.password)) {
            throw new Error('Login fallito');
        }
        
        // Imposta l'URL della lega
        scraper.leagueUrl = 'https://leghe.fantacalcio.it/fantaleague11';
        
        // Testa il recupero tornei
        console.log('🔍 Test recupero tornei...');
        const tournaments = await scraper.getAvailableTournaments();
        
        console.log('\n📊 RISULTATI:');
        console.log(`Trovati ${tournaments.length} tornei:`);
        tournaments.forEach((tournament, index) => {
            console.log(`${index + 1}. ${tournament.name} (ID: ${tournament.id})`);
        });
        
        // Verifica che abbiamo trovato i tornei attesi
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
        
        await scraper.close();
        console.log('\n✅ Test completato con successo');
        
    } catch (error) {
        console.error('❌ Errore test:', error);
    } finally {
        process.exit(0);
    }
}

testTournamentsImproved(); 