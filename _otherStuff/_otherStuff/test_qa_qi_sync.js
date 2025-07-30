import { getDb } from './db/postgres.js';

async function testQAQISync() {
    console.log('🧪 Test sincronizzazione QA/QI...');
    
    const db = getDb();
    if (!db) {
        console.error('❌ Database non disponibile');
        return;
    }

    // Test 1: Verifica che le colonne esistano
    console.log('\n1. Verifica colonne QA/QI nella tabella giocatori...');
    try {
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'giocatori' 
            AND column_name IN ('qa', 'qi')
        `);
        console.log('✅ Colonne giocatori verificate:', result.rows);
    } catch (error) {
        console.error('❌ Errore verifica colonne:', error);
    }
    
    // Test 2: Verifica tabella qa_history
    console.log('\n2. Verifica tabella qa_history...');
    try {
        const result = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'qa_history'
        `);
        if (result.rows.length > 0) {
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
        const result = await db.query("SELECT COUNT(*) as count FROM giocatori_scraping");
        console.log(`✅ Giocatori di scraping trovati: ${result.rows[0].count}`);
        
        // Mostra alcuni esempi
        const examples = await db.query(`
            SELECT nome, ruolo, squadra_reale, quotazione, qi, fv_mp 
            FROM giocatori_scraping 
            LIMIT 5
        `);
        
        console.log('\n📊 Esempi giocatori di scraping:');
        examples.rows.forEach((g, i) => {
            console.log(`  ${i+1}. ${g.nome} (${g.ruolo}) - Squadra: ${g.squadra_reale} - QA: ${g.quotazione} - QI: ${g.qi} - FV: ${g.fv_mp}`);
        });
        
    } catch (error) {
        console.error('❌ Errore verifica dati scraping:', error);
    }
    
    // Test 4: Verifica sincronizzazione
    console.log('\n4. Verifica sincronizzazione QA/QI...');
    try {
        const result = await db.query(`
            SELECT COUNT(*) as count 
            FROM giocatori 
            WHERE qa IS NOT NULL OR qi IS NOT NULL
        `);
        console.log(`✅ Giocatori con QA/QI sincronizzati: ${result.rows[0].count}`);
        
        // Mostra alcuni esempi
        const examples = await db.query(`
            SELECT nome, squadra_reale, qa, qi 
            FROM giocatori 
            WHERE qa IS NOT NULL OR qi IS NOT NULL 
            LIMIT 5
        `);
        
        console.log('\n📊 Esempi giocatori sincronizzati:');
        examples.rows.forEach((g, i) => {
            console.log(`  ${i+1}. ${g.nome} - Squadra: ${g.squadra_reale} - QA: ${g.qa} - QI: ${g.qi}`);
        });
        
    } catch (error) {
        console.error('❌ Errore verifica sincronizzazione:', error);
    }
    
    // Test 5: Verifica cronologia QA
    console.log('\n5. Verifica cronologia QA...');
    try {
        const result = await db.query("SELECT COUNT(*) as count FROM qa_history");
        console.log(`✅ Record cronologia QA: ${result.rows[0].count}`);
        
        if (result.rows[0].count > 0) {
            // Mostra alcuni esempi
            const examples = await db.query(`
                SELECT qh.qa_value, qh.data_registrazione, g.nome 
                FROM qa_history qh 
                JOIN giocatori g ON qh.giocatore_id = g.id 
                ORDER BY qh.data_registrazione DESC 
                LIMIT 5
            `);
            
            console.log('\n📊 Esempi cronologia QA:');
            examples.rows.forEach((h, i) => {
                console.log(`  ${i+1}. ${h.nome} - QA: ${h.qa_value} - Data: ${h.data_registrazione}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Errore verifica cronologia:', error);
    }
    
    console.log('\n✅ Test completato!');
}

testQAQISync().catch(console.error); 