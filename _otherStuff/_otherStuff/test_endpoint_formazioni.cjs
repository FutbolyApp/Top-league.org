const axios = require('axios');

async function testEndpointFormazioni() {
    console.log('🚀 Test endpoint formazioni...');
    
    try {
        // Prima testiamo se il backend risponde
        console.log('🔍 Test connessione backend...');
        const pingResponse = await axios.get('http://localhost:3001/api/ping');
        console.log('✅ Backend risponde:', pingResponse.data);
        
        // Ora testiamo l'endpoint delle formazioni
        console.log('⚽ Test endpoint formazioni...');
        const response = await axios.post('http://localhost:3001/api/scraping/playwright-formazioni', {
            lega_id: 76,
            leagueUrl: 'https://euroleghe.fantacalcio.it/topleague/',
            username: 'nemeneme',
            password: 'laziomerda',
            tournamentId: 295,
            giornata: 22
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // Questo dovrebbe dare 401, non 500
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
            
            // Se è 401, il problema è l'autenticazione
            if (error.response.status === 401) {
                console.log('🔐 Errore 401: Token non valido - questo è normale per il test');
            }
            // Se è 500, c'è un errore interno nel backend
            else if (error.response.status === 500) {
                console.log('💥 Errore 500: Errore interno nel backend');
                console.log('Dettagli errore:', error.response.data);
            }
        }
        
        throw error;
    }
}

testEndpointFormazioni().catch(console.error); 