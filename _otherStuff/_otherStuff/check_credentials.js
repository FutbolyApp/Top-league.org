import { getDb } from './db/postgres.js';

async function checkCredentials() {
    console.log('🔍 Controllo credenziali salvate nel database...');
    
    const db = getDb();
    if (!db) {
        console.error('❌ Database non disponibile');
        return;
    }

    try {
        // Controlla le credenziali per la lega 76 (TopLeague)
        const legaResult = await db.query(
            'SELECT id, nome, fantacalcio_url, fantacalcio_username, fantacalcio_password FROM leghe WHERE id = $1',
            [76]
        );
        const lega = legaResult.rows[0];
        
        if (lega) {
            console.log('\n📋 LEGA TROVATA:');
            console.log(`ID: ${lega.id}`);
            console.log(`Nome: ${lega.nome}`);
            console.log(`URL: ${lega.fantacalcio_url}`);
            console.log(`Username: ${lega.fantacalcio_username || 'NON IMPOSTATO'}`);
            console.log(`Password: ${lega.fantacalcio_password ? '***IMPOSTATA***' : 'NON IMPOSTATA'}`);
        } else {
            console.log('❌ Lega 76 non trovata');
        }
        
        // Controlla tutte le leghe
        const allLegheResult = await db.query(
            'SELECT id, nome, fantacalcio_url, fantacalcio_username, fantacalcio_password FROM leghe'
        );
        const allLeghe = allLegheResult.rows;
        
        console.log('\n📊 TUTTE LE LEGHE:');
        allLeghe.forEach(lega => {
            console.log(`\nLega ${lega.id}: ${lega.nome}`);
            console.log(`  URL: ${lega.fantacalcio_url || 'NON IMPOSTATO'}`);
            console.log(`  Username: ${lega.fantacalcio_username || 'NON IMPOSTATO'}`);
            console.log(`  Password: ${lega.fantacalcio_password ? 'IMPOSTATA' : 'NON IMPOSTATA'}`);
        });
        
    } catch (error) {
        console.error('❌ Errore durante il controllo:', error);
    }
}

checkCredentials().then(() => {
    console.log('✅ Controllo completato!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Errore:', error);
    process.exit(1);
}); 