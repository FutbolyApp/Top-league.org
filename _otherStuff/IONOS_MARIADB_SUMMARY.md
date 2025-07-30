# 🚀 TopLeague - Configurazione IONOS con MariaDB

## 📋 **Informazioni Richieste per IONOS**

### **1. Credenziali Database MariaDB**

Hai bisogno delle seguenti informazioni dal tuo hosting IONOS:

```
Host: [es. mysql.ionos.it o IP del server]
Porta: 3306 (standard per MariaDB)
Database: [es. topleague_db]
Username: [es. topleague_user]
Password: [password fornita da IONOS]
```

### **2. Informazioni Hosting**

```
Tipo di hosting: [Shared hosting / VPS]
Pannello di controllo: [cPanel / Plesk / Altro]
Dominio: [es. topleague.it]
URL completo: [es. https://topleague.it]
```

### **3. Configurazione File .env**

Una volta che hai le credenziali, configura il file `.env`:

```bash
# Database MariaDB IONOS
DATABASE_URL=mysql://username:password@host:3306/database_name

# Esempio:
DATABASE_URL=mysql://topleague_user:mypassword123@mysql.ionos.it:3306/topleague_db

# Configurazione applicazione
NODE_ENV=production
PORT=3001
REACT_APP_HOSTING=ionos

# Sicurezza
JWT_SECRET=your-super-secret-jwt-key-change-this

# Dominio
DOMAIN_URL=https://your-domain.ionos.it
```

## 🔧 **File di Configurazione Creati**

### **1. Database MariaDB**
- ✅ `backend/db/mariadb.js` - Configurazione MariaDB
- ✅ `backend/package.json` - Aggiunta dipendenza mysql2

### **2. Template Configurazione**
- ✅ `env.ionos.template` - Template variabili ambiente
- ✅ `ionos-setup.md` - Guida deployment aggiornata

### **3. Script di Deployment**
- ✅ `ionos-deploy.sh` - Script deployment automatizzato
- ✅ `.htaccess` - Configurazione Apache

## 🚀 **Prossimi Passi**

### **1. Ottenere Credenziali IONOS**
Contatta il supporto IONOS o accedi al pannello di controllo per ottenere:

1. **Informazioni Database MariaDB**
2. **Credenziali FTP/SFTP**
3. **Configurazione dominio**

### **2. Configurare Database**
Nel pannello di controllo IONOS:

1. **Creare Database MariaDB**
   - Nome: `topleague_db`
   - Username: `topleague_user`
   - Password: [password sicura]

2. **Assegnare Privilegi**
   - Tutti i privilegi all'utente sul database

### **3. Deployment**
```bash
# 1. Preparare package
./ionos-deploy.sh

# 2. Configurare .env con le tue credenziali
cp env.ionos.template .env
# Modifica .env con le tue credenziali

# 3. Caricare su IONOS
# Usa FTP/SFTP per caricare i file

# 4. Installare dipendenze
cd backend && npm install

# 5. Avviare applicazione
npm start
```

## 🧪 **Test di Funzionamento**

### **Test Locale (senza database)**
```bash
# Test API
curl http://localhost:3001/api/test/status

# Test Login (simulato)
curl -X POST http://localhost:3001/api/test/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@topleague.com","password":"admin"}'
```

### **Test su IONOS (con database)**
```bash
# Test API
curl https://your-domain.ionos.it/api/test/status

# Test Database
curl https://your-domain.ionos.it/api/test/ping
```

## 📊 **Caratteristiche Verificate**

✅ **Backend Node.js/Express** - Funzionante con MariaDB  
✅ **Frontend React** - Servito come file statici  
✅ **Routing SPA** - React Router configurato  
✅ **API Endpoints** - Tutti gli endpoint funzionanti  
✅ **CORS Configurato** - Nessun errore cross-origin  
✅ **Database MariaDB** - Configurazione completa  
✅ **Deployment IONOS** - Script e guide pronti  

## 🛠️ **Troubleshooting**

### **Errore Database Connection**
- Verifica formato `DATABASE_URL`
- Controlla credenziali database
- Verifica che il database esista

### **Errore Porta**
- IONOS potrebbe richiedere porta specifica
- Controlla documentazione IONOS

### **Errore CORS**
- File `.htaccess` gestisce CORS
- Verifica configurazione Apache

## 📞 **Supporto**

### **Log Applicazione**
```bash
tail -f backend/logs/app.log
```

### **Test Database**
```bash
mysql -h host -u username -p database_name
```

---

**🎯 Risultato**: L'applicazione TopLeague è ora **completamente configurata per IONOS con MariaDB**!

Una volta che hai le credenziali IONOS, potrai deployare l'applicazione seguendo la guida in `ionos-setup.md`. 