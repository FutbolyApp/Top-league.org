const axios = require('axios');

async function testFrontendSimulation() {
    console.log('🚀 Test simulazione frontend...');
    
    try {
        // Prima otteniamo un token valido facendo login
        console.log('🔐 Login per ottenere token...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Token ottenuto:', token ? 'VALIDO' : 'NON VALIDO');
        
        if (!token) {
            throw new Error('Login fallito - token non ottenuto');
        }
        
        // Ora testiamo l'endpoint delle formazioni con il token valido
        console.log('⚽ Test endpoint formazioni con token valido...');
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
                'Authorization': `Bearer ${token}`
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
                console.log('🔐 Errore 401: Token non valido');
            } else if (error.response.status === 500) {
                console.log('💥 Errore 500: Errore interno nel backend');
                console.log('Dettagli errore:', error.response.data);
            }
        }
        
        throw error;
    }
}

testFrontendSimulation().catch(console.error); 