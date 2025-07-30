import { getDb } from './db/postgres.js';

async function debugColumns() {
    console.log('🔍 DEBUG: Analisi colonne per trovare quotazioni corrette...');
    
    const db = getDb();
    if (!db) {
        console.error('❌ Database non disponibile');
        return;
    }
    
    try {
        // Test con lega_id 79 (quella che stai usando)
        const legaId = 79;
        
        console.log(`📊 Analizzando dati per lega ${legaId}...`);
        
        // Valori corretti che mi hai fornito per Roma
        const quotazioniCorrette = [16, 13, 11, 8, 11, 9, 5, 9, 5, 5, 10, 5, 15, 11, 15, 12, 15, 12, 26, 22, 23, 15, 17, 22, 19, 21, 26, 22];
        
        console.log('📋 QUOTAZIONI CORRETTE per Roma:', quotazioniCorrette);
        
        // Prima mostra tutte le squadre disponibili
        const allSquadreResult = await db.query('SELECT * FROM squadre_scraping WHERE lega_id = $1', [legaId]);
        const allSquadre = allSquadreResult.rows;
        
        console.log(`🏆 Tutte le squadre trovate: ${allSquadre.length}`);
        allSquadre.forEach((squadra, index) => {
            console.log(`  ${index + 1}. ID: ${squadra.id}, Nome: "${squadra.nome}", Data: ${squadra.data_scraping}`);
        });
        
        // Trova la squadra Roma (o simile)
        const squadreResult = await db.query('SELECT * FROM squadre_scraping WHERE lega_id = $1 AND (nome LIKE \'%Roma%\' OR nome LIKE \'%roma%\')', [legaId]);
        const squadre = squadreResult.rows;
        
        console.log(`\n🏆 Squadre Roma trovate: ${squadre.length}`);
        if (squadre.length === 0) {
            console.log('❌ Nessuna squadra Roma trovata. Analizziamo la prima squadra disponibile...');
            
            // Analizza la prima squadra disponibile
            if (allSquadre.length > 0) {
                const primaSquadra = allSquadre[0];
                console.log(`📊 Analizzando ${primaSquadra.nome}...`);
                
                const giocatoriResult = await db.query('SELECT * FROM giocatori_scraping WHERE squadra_scraping_id = $1 ORDER BY id LIMIT 10', [primaSquadra.id]);
                const giocatori = giocatoriResult.rows;
                
                console.log(`    ⚽ Primi 10 giocatori di ${primaSquadra.nome}:`);
                giocatori.forEach((giocatore, gIndex) => {
                    console.log(`      ${gIndex + 1}. ${giocatore.nome} (${giocatore.ruolo})`);
                    console.log(`         - Squadra Reale: "${giocatore.squadra_reale}"`);
                    console.log(`         - Quotazione: "${giocatore.quotazione}"`);
                    console.log(`         - FV MP: "${giocatore.fv_mp}"`);
                });
            }
            return;
        }
        
        for (const squadra of squadre) {
            console.log(`  ${squadre.indexOf(squadra) + 1}. ID: ${squadra.id}, Nome: "${squadra.nome}", Data: ${squadra.data_scraping}`);
            
            // Trova tutti i giocatori di questa squadra
            const giocatoriResult = await db.query('SELECT * FROM giocatori_scraping WHERE squadra_scraping_id = $1 ORDER BY id', [squadra.id]);
            const giocatori = giocatoriResult.rows;
            
            console.log(`    ⚽ Tutti i giocatori di ${squadra.nome} (${giocatori.length}):`);
            
            // Confronta con i valori corretti
            giocatori.forEach((giocatore, gIndex) => {
                const quotazioneCorretta = quotazioniCorrette[gIndex] || 'N/A';
                const matchQuotazione = giocatore.quotazione == quotazioneCorretta;
                const matchFvMp = giocatore.fv_mp == quotazioneCorretta;
                
                console.log(`      ${gIndex + 1}. ${giocatore.nome} (${giocatore.ruolo})`);
                console.log(`         - Squadra Reale: "${giocatore.squadra_reale}"`);
                console.log(`         - Quotazione: "${giocatore.quotazione}" ${matchQuotazione ? '✅' : '❌'} (dovrebbe essere ${quotazioneCorretta})`);
                console.log(`         - FV MP: "${giocatore.fv_mp}" ${matchFvMp ? '✅' : '❌'} (dovrebbe essere ${quotazioneCorretta})`);
            });
            
            // Analisi statistica
            console.log('\n📊 ANALISI STATISTICA:');
            
            const quotazioniMatch = giocatori.filter((g, i) => g.quotazione == quotazioniCorrette[i]).length;
            const fvMpMatch = giocatori.filter((g, i) => g.fv_mp == quotazioniCorrette[i]).length;
            
            console.log(`   Quotazione: ${quotazioniMatch}/${giocatori.length} match (${Math.round(quotazioniMatch/giocatori.length*100)}%)`);
            console.log(`   FV MP: ${fvMpMatch}/${giocatori.length} match (${Math.round(fvMpMatch/giocatori.length*100)}%)`);
            
            if (fvMpMatch > quotazioniMatch) {
                console.log('   🎯 CONCLUSIONE: Le quotazioni corrette sono nella colonna FV MP!');
                console.log('   🔧 AZIONE: Devo scambiare colonna 2 (FV MP) con colonna 4 (Quotazione)');
            } else if (quotazioniMatch > fvMpMatch) {
                console.log('   🎯 CONCLUSIONE: Le quotazioni corrette sono nella colonna Quotazione!');
                console.log('   🔧 AZIONE: Il mapping attuale è corretto');
            } else {
                console.log('   ❓ CONCLUSIONE: Nessuna colonna corrisponde perfettamente');
            }
        }
        
    } catch (error) {
        console.error('❌ Errore debug:', error);
    }
}

// Esegui il debug
debugColumns().then(() => {
    console.log('✅ Debug colonne completato');
    process.exit(0);
}).catch(error => {
    console.error('❌ Errore debug:', error);
    process.exit(1);
}); 