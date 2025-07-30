const axios = require('axios');

async function testFormazioniNoAuth() {
    console.log('🚀 Test formazioni senza autenticazione...');
    
    try {
        // Testiamo direttamente l'endpoint senza token
        console.log('⚽ Test endpoint formazioni senza auth...');
        const response = await axios.post('http://localhost:3001/api/scraping/playwright-formazioni', {
            lega_id: 76,
            leagueUrl: 'https://euroleghe.fantacalcio.it/topleague/',
            username: 'nemeneme',
            password: 'laziomerda',
            tournamentId: 295,
            giornata: 22
        }, {
            headers: {
                'Content-Type': 'application/json'
                // Nessun token di autorizzazione
            },
            timeout: 120000 // 2 minuti di timeout
        });
        
        console.log('✅ Risposta API ricevuta!');
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Formazioni trovate:', response.data.formazioni_trovate);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Errore chiamata API:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            
            if (error.response.status === 401) {
                console.log('🔐 Errore 401: Token richiesto - questo è normale');
            } else if (error.response.status === 500) {
                console.log('💥 Errore 500: Errore interno nel backend');
                console.log('Dettagli errore:', error.response.data);
            }
        }
        
        throw error;
    }
}

testFormazioniNoAuth().catch(console.error); 