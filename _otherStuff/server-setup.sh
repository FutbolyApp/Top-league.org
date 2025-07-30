#!/bin/bash

# 🎯 TopLeague - Server Setup Automatico
# Versione: 1.0.0
# Data: 2025-07-26

set -e  # Exit on any error

echo "🚀 TopLeague - Setup Automatico Server"
echo "======================================"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verifica che siamo root
if [[ $EUID -ne 0 ]]; then
   error "Questo script deve essere eseguito come root"
fi

log "Inizio setup automatico..."

# 1. Aggiorna sistema
log "1️⃣ Aggiornamento sistema..."
apt update -y
apt upgrade -y

# 2. Installa dipendenze
log "2️⃣ Installazione dipendenze..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# 3. Installa Node.js 18
log "3️⃣ Installazione Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verifica Node.js
NODE_VERSION=$(node --version)
log "✅ Node.js installato: $NODE_VERSION"

# 4. Installa MariaDB
log "4️⃣ Installazione MariaDB..."
apt install -y mariadb-server mariadb-client

# Avvia e abilita MariaDB
systemctl start mariadb
systemctl enable mariadb

# 5. Configura MariaDB
log "5️⃣ Configurazione MariaDB..."

# Crea file di configurazione temporaneo
cat > /tmp/mysql_secure.sql << EOF
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
EOF

# Esegui configurazione sicura
mysql -u root < /tmp/mysql_secure.sql

# Crea database e utente
mysql -u root -e "CREATE DATABASE IF NOT EXISTS topleague_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "GRANT ALL PRIVILEGES ON topleague_db.* TO 'root'@'localhost' IDENTIFIED BY '25QQj2Fh';"
mysql -u root -e "GRANT ALL PRIVILEGES ON topleague_db.* TO 'root'@'%' IDENTIFIED BY '25QQj2Fh';"
mysql -u root -e "FLUSH PRIVILEGES;"

log "✅ Database topleague_db creato"

# 6. Installa PM2
log "6️⃣ Installazione PM2..."
npm install -g pm2

# 7. Installa Nginx
log "7️⃣ Installazione Nginx..."
apt install -y nginx

# 8. Configura Nginx
log "8️⃣ Configurazione Nginx..."

cat > /etc/nginx/sites-available/topleague << 'EOF'
server {
    listen 80;
    server_name 217.154.43.87 top-league.org;

    # Frontend
    location / {
        root /var/www/top-league.org/frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Abilita sito
ln -sf /etc/nginx/sites-available/topleague /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configurazione Nginx
nginx -t

# Riavvia Nginx
systemctl restart nginx
systemctl enable nginx

# 9. Configura firewall
log "9️⃣ Configurazione firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3306/tcp
ufw --force enable

# 10. Crea directory applicazione
log "🔟 Creazione directory applicazione..."
mkdir -p /var/www/top-league.org
chown -R www-data:www-data /var/www/top-league.org

# 11. Configurazione finale
log "1️⃣1️⃣ Configurazione finale..."

# Crea file di configurazione environment
cat > /var/www/top-league.org/backend/env.ionos << 'EOF'
# ========================================
# TOPLEAGUE - CONFIGURAZIONE IONOS
# ========================================

# Database MariaDB LOCALE
DATABASE_URL=mysql://root:25QQj2Fh@localhost:3306/topleague_db

# Ambiente
NODE_ENV=production
PORT=3001

# Hosting
REACT_APP_HOSTING=ionos

# JWT Secret
JWT_SECRET=topleague-super-secret-jwt-key-2025

# URL del dominio
DOMAIN_URL=https://top-league.org

# Log level
LOG_LEVEL=info
EOF

log "✅ Setup completato con successo!"
log "🎯 Il server è pronto per il deployment dell'applicazione"
log "📋 Prossimo passo: esegui ./deploy-app.sh"

# Mostra informazioni finali
echo ""
echo "📊 INFORMAZIONI SERVER:"
echo "========================"
echo "🌐 IP Server: 217.154.43.87"
echo "🗄️ Database: MariaDB (localhost:3306)"
echo "📁 Directory: /var/www/top-league.org"
echo "🔧 PM2: Installato e pronto"
echo "🌍 Nginx: Configurato e attivo"
echo "🔒 Firewall: Configurato"
echo ""
echo "✅ Setup completato! Ora puoi procedere con il deployment." 