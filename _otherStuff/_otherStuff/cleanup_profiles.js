import fs from 'fs';
import path from 'path';

async function cleanupAllProfiles() {
    console.log('🧹 Pulizia automatica profili browser...');
    
    try {
        const currentDir = process.cwd();
        const files = fs.readdirSync(currentDir);
        
        // Trova profili Playwright
        const playwrightProfiles = files.filter(file => 
            file.startsWith('playwright_profile_') && 
            fs.statSync(path.join(currentDir, file)).isDirectory()
        );
        
        // Trova profili Puppeteer
        const puppeteerProfiles = files.filter(file => 
            file.startsWith('puppeteer_profile') && 
            fs.statSync(path.join(currentDir, file)).isDirectory()
        );
        
        console.log(`🔍 Trovati ${playwrightProfiles.length} profili Playwright`);
        console.log(`🔍 Trovati ${puppeteerProfiles.length} profili Puppeteer`);
        
        let removedCount = 0;
        
        // Rimuovi profili Playwright
        for (const profile of playwrightProfiles) {
            try {
                fs.rmSync(path.join(currentDir, profile), { recursive: true, force: true });
                console.log(`✅ Rimosso profilo Playwright: ${profile}`);
                removedCount++;
            } catch (error) {
                console.log(`⚠️ Errore rimozione ${profile}: ${error.message}`);
            }
        }
        
        // Rimuovi profili Puppeteer (opzionale - commenta se vuoi mantenerli)
        for (const profile of puppeteerProfiles) {
            try {
                fs.rmSync(path.join(currentDir, profile), { recursive: true, force: true });
                console.log(`✅ Rimosso profilo Puppeteer: ${profile}`);
                removedCount++;
            } catch (error) {
                console.log(`⚠️ Errore rimozione ${profile}: ${error.message}`);
            }
        }
        
        console.log(`✅ Pulizia completata: ${removedCount} profili rimossi`);
        
    } catch (error) {
        console.error('❌ Errore durante la pulizia:', error);
    }
}

// Esegui la pulizia
cleanupAllProfiles(); 