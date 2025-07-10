import { getDb } from './db/config.js';

const db = getDb();

async function checkCredentials() {
    console.log('🔍 Controllo credenziali salvate nel database...');
    
    try {
        // Controlla le credenziali per la lega 76 (TopLeague)
        const lega = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, nome, fantacalcio_url, fantacalcio_username, fantacalcio_password FROM leghe WHERE id = ?',
                [76],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
        
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
        const allLeghe = await new Promise((resolve, reject) => {
            db.all(
                'SELECT id, nome, fantacalcio_url, fantacalcio_username, fantacalcio_password FROM leghe',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        console.log('\n📊 TUTTE LE LEGHE:');
        allLeghe.forEach(lega => {
            console.log(`\nLega ${lega.id}: ${lega.nome}`);
            console.log(`  URL: ${lega.fantacalcio_url || 'NON IMPOSTATO'}`);
            console.log(`  Username: ${lega.fantacalcio_username || 'NON IMPOSTATO'}`);
            console.log(`  Password: ${lega.fantacalcio_password ? 'IMPOSTATA' : 'NON IMPOSTATA'}`);
        });
        
    } catch (error) {
        console.error('❌ Errore durante il controllo:', error);
    } finally {
        db.close();
    }
}

checkCredentials(); 