import { getDb } from './db/config.js';

const db = getDb();

async function testQAQISync() {
    console.log('🧪 Test sincronizzazione QA/QI...');
    
    // Test 1: Verifica che le colonne esistano
    console.log('\n1. Verifica colonne QA/QI nella tabella giocatori...');
    try {
        const result = await new Promise((resolve, reject) => {
            db.get("PRAGMA table_info(giocatori)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        console.log('✅ Colonne giocatori verificate');
    } catch (error) {
        console.error('❌ Errore verifica colonne:', error);
    }
    
    // Test 2: Verifica tabella qa_history
    console.log('\n2. Verifica tabella qa_history...');
    try {
        const result = await new Promise((resolve, reject) => {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='qa_history'", (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        if (result) {
            console.log('✅ Tabella qa_history esiste');
        } else {
            console.log('❌ Tabella qa_history non trovata');
        }
    } catch (error) {
        console.error('❌ Errore verifica tabella qa_history:', error);
    }
    
    // Test 3: Verifica dati di scraping
    console.log('\n3. Verifica dati di scraping...');
    try {
        const result = await new Promise((resolve, reject) => {
            db.all("SELECT COUNT(*) as count FROM giocatori_scraping", (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });
        console.log(`✅ Giocatori di scraping trovati: ${result.count}`);
        
        // Mostra alcuni esempi
        const examples = await new Promise((resolve, reject) => {
            db.all("SELECT nome, ruolo, squadra_reale, quotazione, qi, fv_mp FROM giocatori_scraping LIMIT 5", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('\n📊 Esempi giocatori di scraping:');
        examples.forEach((g, i) => {
            console.log(`  ${i+1}. ${g.nome} (${g.ruolo}) - Squadra: ${g.squadra_reale} - QA: ${g.quotazione} - QI: ${g.qi} - FV: ${g.fv_mp}`);
        });
        
    } catch (error) {
        console.error('❌ Errore verifica dati scraping:', error);
    }
    
    // Test 4: Verifica sincronizzazione
    console.log('\n4. Verifica sincronizzazione QA/QI...');
    try {
        const result = await new Promise((resolve, reject) => {
            db.all("SELECT COUNT(*) as count FROM giocatori WHERE qa IS NOT NULL OR qi IS NOT NULL", (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });
        console.log(`✅ Giocatori con QA/QI sincronizzati: ${result.count}`);
        
        // Mostra alcuni esempi
        const examples = await new Promise((resolve, reject) => {
            db.all("SELECT nome, squadra_reale, qa, qi FROM giocatori WHERE qa IS NOT NULL OR qi IS NOT NULL LIMIT 5", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('\n📊 Esempi giocatori sincronizzati:');
        examples.forEach((g, i) => {
            console.log(`  ${i+1}. ${g.nome} - Squadra: ${g.squadra_reale} - QA: ${g.qa} - QI: ${g.qi}`);
        });
        
    } catch (error) {
        console.error('❌ Errore verifica sincronizzazione:', error);
    }
    
    // Test 5: Verifica cronologia QA
    console.log('\n5. Verifica cronologia QA...');
    try {
        const result = await new Promise((resolve, reject) => {
            db.all("SELECT COUNT(*) as count FROM qa_history", (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });
        console.log(`✅ Record cronologia QA: ${result.count}`);
        
        if (result.count > 0) {
            // Mostra alcuni esempi
            const examples = await new Promise((resolve, reject) => {
                db.all(`
                    SELECT qh.qa_value, qh.data_registrazione, g.nome 
                    FROM qa_history qh 
                    JOIN giocatori g ON qh.giocatore_id = g.id 
                    ORDER BY qh.data_registrazione DESC 
                    LIMIT 5
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log('\n📊 Esempi cronologia QA:');
            examples.forEach((h, i) => {
                console.log(`  ${i+1}. ${h.nome} - QA: ${h.qa_value} - Data: ${h.data_registrazione}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Errore verifica cronologia:', error);
    }
    
    console.log('\n✅ Test completato!');
}

testQAQISync().catch(console.error); 