#!/bin/bash

# Script di deployment per VPS IONOS
# TopLeague - Deployment Script

set -e

echo "🚀 Iniziando deployment su VPS IONOS..."
echo "📍 Host: 217.154.43.87"
echo "👤 User: root"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per log colorato
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifica connessione SSH
log_info "Testando connessione SSH..."
log_warning "Inserisci la password quando richiesto: 25QQj2Fh"

# Setup iniziale del server
log_info "Configurando ambiente server..."

sshpass -p '25QQj2Fh' ssh root@217.154.43.87 << 'EOF'
# Aggiorna sistema
apt update && apt upgrade -y

# Installa dipendenze base
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Installa Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Installa MariaDB
apt install -y mariadb-server mariadb-client

# Installa Nginx
apt install -y nginx

# Installa PM2 per process management
npm install -g pm2

# Configura firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3001
ufw --force enable

# Crea directory per l'applicazione
mkdir -p /var/www/topleague
mkdir -p /var/www/topleague/backend
mkdir -p /var/www/topleague/frontend
mkdir -p /var/www/topleague/logs

# Imposta permessi
chown -R www-data:www-data /var/www/topleague
chmod -R 755 /var/www/topleague

echo "✅ Setup iniziale completato"
EOF

log_success "Setup iniziale del server completato"

# Configurazione MariaDB
log_info "Configurando MariaDB..."

ssh root@217.154.43.87 << 'EOF'
# Configura MariaDB
mysql_secure_installation << 'MYSQL_SCRIPT'
Y
1
Y
Y
Y
Y
MYSQL_SCRIPT

# Crea database e utente per TopLeague
mysql -u root -p1 << 'MYSQL_SCRIPT'
CREATE DATABASE IF NOT EXISTS topleague_prod;
CREATE USER IF NOT EXISTS 'topleague'@'localhost' IDENTIFIED BY 'topleague123';
GRANT ALL PRIVILEGES ON topleague_prod.* TO 'topleague'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo "✅ MariaDB configurato"
EOF

log_success "MariaDB configurato"

# Copia file di configurazione
log_info "Copiando file di configurazione..."

# Crea file di configurazione per il server
cat > nginx-topleague.conf << 'EOF'
server {
    listen 80;
    server_name top-league.org www.top-league.org 217.154.43.87;
    
    # Frontend
    location / {
        root /var/www/topleague/frontend;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Backend API
    location /api/ {
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
    
    # Logs
    access_log /var/log/nginx/topleague_access.log;
    error_log /var/log/nginx/topleague_error.log;
}
EOF

# Crea file di configurazione PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'topleague-backend',
    script: '/var/www/topleague/backend/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: 'mysql://topleague:topleague123@localhost:3306/topleague_prod'
    },
    error_file: '/var/www/topleague/logs/err.log',
    out_file: '/var/www/topleague/logs/out.log',
    log_file: '/var/www/topleague/logs/combined.log',
    time: true
  }]
};
EOF

# Copia file di configurazione sul server
scp nginx-topleague.conf root@217.154.43.87:/etc/nginx/sites-available/topleague
scp ecosystem.config.js root@217.154.43.87:/var/www/topleague/

# Configura Nginx
ssh root@217.154.43.87 << 'EOF'
# Abilita sito Nginx
ln -sf /etc/nginx/sites-available/topleague /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "✅ Nginx configurato"
EOF

log_success "Configurazione Nginx completata"

# Build del frontend
log_info "Build del frontend..."

cd frontend
npm install
npm run build

# Copia frontend build sul server
scp -r build/* root@217.154.43.87:/var/www/topleague/frontend/

log_success "Frontend deployato"

# Copia backend sul server
log_info "Deploy del backend..."

cd ../backend
scp -r * root@217.154.43.87:/var/www/topleague/backend/
scp env.production root@217.154.43.87:/var/www/topleague/backend/.env

# Installa dipendenze backend sul server
ssh root@217.154.43.87 << 'EOF'
cd /var/www/topleague/backend
npm install --production
EOF

log_success "Backend deployato"

# Avvia applicazione
log_info "Avviando applicazione..."

ssh root@217.154.43.87 << 'EOF'
cd /var/www/topleague
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Imposta permessi finali
chown -R www-data:www-data /var/www/topleague
chmod -R 755 /var/www/topleague

echo "✅ Applicazione avviata"
EOF

log_success "Deployment completato!"

echo ""
echo "🎉 DEPLOYMENT COMPLETATO!"
echo "📍 URL: http://217.154.43.87"
echo "🌐 Dominio: http://top-league.org (quando configurato)"
echo ""
echo "📋 Prossimi passi:"
echo "1. Configura il dominio top-league.org per puntare a 217.154.43.87"
echo "2. Configura SSL/HTTPS con Let's Encrypt"
echo "3. Testa l'applicazione"
echo ""
echo "🔧 Comandi utili:"
echo "- Controlla logs: ssh root@217.154.43.87 'pm2 logs'"
echo "- Riavvia app: ssh root@217.154.43.87 'pm2 restart topleague-backend'"
echo "- Controlla status: ssh root@217.154.43.87 'pm2 status'" 