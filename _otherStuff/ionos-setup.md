# 🚀 TopLeague - Guida Deployment IONOS con MariaDB

## 📋 Prerequisiti

### 1. Account IONOS
- Account hosting IONOS attivo
- Accesso al pannello di controllo (cPanel, Plesk, o altro)
- Database MariaDB configurato

### 2. Informazioni Database MariaDB
Hai bisogno delle seguenti informazioni da IONOS:

```
Host: mysql.ionos.it (o IP del server)
Porta: 3306
Database: topleague_db
Username: topleague_user
Password: [password fornita da IONOS]
```

## 🔧 Configurazione Database

### 1. Creare Database MariaDB su IONOS

**Via cPanel:**
1. Accedi al cPanel di IONOS
2. Vai su "Database MySQL"
3. Crea un nuovo database: `topleague_db`
4. Crea un nuovo utente: `topleague_user`
5. Assegna l'utente al database con tutti i privilegi

**Via Plesk:**
1. Accedi al Plesk Panel
2. Vai su "Database"
3. Crea nuovo database MariaDB
4. Crea nuovo utente database
5. Assegna privilegi completi

### 2. Configurare Variabili Ambiente

Copia il file `env.ionos.template` in `.env` e configura:

```bash
# Database MariaDB IONOS
DATABASE_URL=mysql://topleague_user:password@mysql.ionos.it:3306/topleague_db

# Configurazione applicazione
NODE_ENV=production
PORT=3001
REACT_APP_HOSTING=ionos

# Sicurezza
JWT_SECRET=your-super-secret-jwt-key-change-this

# Dominio
DOMAIN_URL=https://your-domain.ionos.it
```

## 🚀 Deployment

### 1. Preparare il Package

```bash
# Esegui lo script di deployment
./ionos-deploy.sh
```

Questo creerà:
- `topleague-ionos.zip` - Package completo per IONOS
- `frontend/build/` - Frontend React ottimizzato
- `backend/` - Backend Node.js con MariaDB

### 2. Caricare su IONOS

**Via FTP/SFTP:**
1. Connettiti al server IONOS via FTP
2. Carica il contenuto di `topleague-ionos.zip` nella root del dominio
3. Estrai i file nella directory principale

**Via File Manager:**
1. Accedi al file manager di IONOS
2. Carica e estrai `topleague-ionos.zip`
3. Posiziona i file nella directory principale

### 3. Configurare .htaccess

Il file `.htaccess` è già incluso e configurato per:
- Proxying delle richieste API a Node.js
- Routing SPA per React
- Compressione e caching

### 4. Configurare Variabili Ambiente

Crea il file `.env` nella root del progetto con le tue credenziali:

```bash
# Copia il template
cp env.ionos.template .env

# Modifica con le tue credenziali
nano .env
```

### 5. Installare Dipendenze

```bash
# Installa dipendenze backend
cd backend
npm install

# Installa mysql2 per MariaDB
npm install mysql2
```

### 6. Avviare l'Applicazione

```bash
# Avvia il backend
cd backend
npm start
```

## 🔍 Verifica Deployment

### 1. Test API
```bash
curl https://your-domain.ionos.it/api/test/status
```

### 2. Test Database
```bash
curl https://your-domain.ionos.it/api/test/ping
```

### 3. Test Frontend
Apri `https://your-domain.ionos.it` nel browser

## 🛠️ Troubleshooting

### Errore Database Connection
- Verifica che `DATABASE_URL` sia corretto
- Controlla che l'utente database abbia i privilegi
- Verifica che il database esista

### Errore Porta
- IONOS potrebbe richiedere una porta specifica
- Controlla la documentazione IONOS per le porte disponibili

### Errore CORS
- Il file `.htaccess` dovrebbe gestire il CORS
- Verifica che Apache sia configurato correttamente

## 📞 Supporto

### Log dell'Applicazione
```bash
# Visualizza log in tempo reale
tail -f backend/logs/app.log
```

### Test Database
```bash
# Test connessione database
mysql -h mysql.ionos.it -u topleague_user -p topleague_db
```

## 🎯 Prossimi Passi

1. **Configurare SSL**: Attiva HTTPS su IONOS
2. **Backup Database**: Configura backup automatici
3. **Monitoring**: Configura alerting per l'applicazione
4. **Performance**: Ottimizza query database e caching

---

**Nota**: Questa guida è specifica per MariaDB su IONOS. Se usi PostgreSQL, consulta la guida originale. 