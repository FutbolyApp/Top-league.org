# 📁 Cartella Scraping - TopLeague Backend

Questa cartella contiene tutti i file relativi al sistema di scraping di TopLeague.

## 📋 File Principali

### 🔧 **Core Scraping**
- **`scraper.js`** - Scraper principale per siti web (axios-based)
- **`scraperPuppeteer.js`** - Scraper avanzato con Puppeteer per siti dinamici
- **`scraping.js`** - Route API per tutti gli endpoint di scraping

### 📊 **Excel Parser**
- **`excelParser.js`** - Parser per file Excel (versione corrente)
- **`excelParser_100Funzionante.js`** - Parser Excel funzionante al 100%
- **`excelParser.js.backup`** - Backup del parser Excel
- **`excelParser.js.backupcomplesso`** - Backup complesso del parser Excel

### 🧪 **Test e Debug**
- **`test-parser.js`** - Test per il parser Excel
- **`debug-parser.js`** - Debug per il parser Excel
- **`debug_*.png`** - Screenshot di debug per Puppeteer

### 🔄 **Backup**
- **`scraper.js.backup`** - Backup dello scraper principale

## 🚀 **Funzionalità**

### **Scraping Web**
- Scraping classifica da leghe.fantacalcio.it
- Scraping voti e calciatori
- Test automatico degli URL
- Gestione credenziali di login

### **Puppeteer Scraper**
- Login automatico su fantacalcio.it
- Analisi completa delle pagine
- Screenshot di debug
- Gestione popup e cookie

### **Excel Parser**
- Importazione giocatori da file Excel
- Parsing automatico delle rose
- Gestione errori e validazione

## 🔗 **Endpoint API**

### **Test e Debug**
- `POST /api/scraping/test` - Test URL di scraping
- `POST /api/scraping/test-credentials` - Test credenziali login
- `GET /api/scraping/debug-credentials/:leagueId` - Debug credenziali
- `POST /api/scraping/test-urls` - Test tutti gli URL possibili

### **Scraping Completo**
- `POST /api/scraping/completo` - Scraping completo di una lega
- `POST /api/scraping/puppeteer/league` - Scraping con Puppeteer

### **Aggiornamento Dati**
- `POST /api/scraping/update-classifica` - Aggiorna classifica
- `POST /api/scraping/update-voti` - Aggiorna voti
- `POST /api/scraping/import-calciatori` - Importa calciatori

## 🛠️ **Configurazione**

### **Credenziali Scraping**
Le credenziali per fantacalcio.it sono gestite tramite:
- Database: tabelle `leghe` (campi `fantacalcio_username`, `fantacalcio_password`)
- Frontend: pagina di gestione credenziali
- API: endpoint per aggiornamento credenziali

### **URL di Scraping**
Gli URL vengono testati automaticamente per trovare quelli corretti:
- Classifica: `/classifica`
- Voti: `/voti-giornata` o `/voti`
- Calciatori: `/rose` o `/calciatori`

## 📸 **Debug e Screenshot**

I file `debug_*.png` contengono screenshot di debug per:
- Pagina di login fantacalcio.it
- Analisi completa della pagina
- Prima e dopo il submit del login
- Errori di login

## 🔧 **Manutenzione**

### **Aggiornamento Selettori**
Se il sito fantacalcio.it cambia, aggiornare i selettori in `scraperPuppeteer.js`

### **Test Credenziali**
Usare l'endpoint `/api/scraping/test-credentials` per verificare le credenziali

### **Test URL**
Usare l'endpoint `/api/scraping/test-urls` per trovare gli URL corretti

## 📝 **Note**

- Tutti i file di backup mantengono versioni funzionanti precedenti
- I screenshot di debug aiutano a diagnosticare problemi di login
- Il sistema di test automatico trova gli URL corretti
- Le credenziali sono criptate nel database 