const axios = require('axios');

async function testApiEndpoint() {
    console.log('🚀 Test endpoint API backend...');
    
    try {
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
                'Authorization': 'Bearer test-token' // Sostituisci con un token valido se necessario
            },
            timeout: 120000 // 2 minuti di timeout
        });
        
        console.log('✅ Risposta API ricevuta!');
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Formazioni trovate:', response.data.formazioni_trovate);
        console.log('Giornata:', response.data.giornata);
        console.log('Tipo lega:', response.data.tipo_lega);
        
        if (response.data.formazioni && response.data.formazioni.length > 0) {
            console.log('\n📊 Dettagli formazioni:');
            response.data.formazioni.forEach((formazione, i) => {
                console.log(`  Squadra ${i + 1}: ${formazione.squadra}`);
                console.log(`    Titolari: ${formazione.totale_titolari}`);
                console.log(`    Panchina: ${formazione.totale_panchina}`);
            });
        }
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Errore chiamata API:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        
        throw error;
    }
}

testApiEndpoint().catch(console.error); 