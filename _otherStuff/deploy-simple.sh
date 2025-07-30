#!/bin/bash

# Script di deployment semplificato per VPS IONOS
# TopLeague - Deployment Script

set -e

echo "🚀 Iniziando deployment su VPS IONOS..."
echo "📍 Host: 217.154.43.87"
echo "👤 User: root"
echo "🔑 Password: 25QQj2Fh"

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

# Funzione per eseguire comandi SSH
ssh_exec() {
    sshpass -p '25QQj2Fh' ssh -o StrictHostKeyChecking=no root@217.154.43.87 "$1"
}

# Funzione per copiare file
scp_copy() {
    sshpass -p '25QQj2Fh' scp -o StrictHostKeyChecking=no "$1" root@217.154.43.87:"$2"
}

# Test connessione
log_info "Testando connessione SSH..."
if ssh_exec "echo 'SSH OK'"; then
    log_success "Connessione SSH funzionante"
else
    log_error "Errore connessione SSH"
    exit 1
fi

# Setup iniziale
log_info "Setup iniziale del server..."

ssh_exec "
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

# Installa PM2
npm install -g pm2

# Configura firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3001
ufw --force enable

# Crea directory
mkdir -p /var/www/topleague
mkdir -p /var/www/topleague/backend
mkdir -p /var/www/topleague/frontend
mkdir -p /var/www/topleague/logs
mkdir -p /var/www/topleague/uploads

# Imposta permessi
chown -R www-data:www-data /var/www/topleague
chmod -R 755 /var/www/topleague

echo '✅ Setup iniziale completato'
"

log_success "Setup iniziale completato"

# Configura MariaDB
log_info "Configurando MariaDB..."

ssh_exec "
# Configura MariaDB
mysql -e \"CREATE DATABASE IF NOT EXISTS topleague_prod;\"
mysql -e \"CREATE USER IF NOT EXISTS 'topleague'@'localhost' IDENTIFIED BY 'topleague123';\"
mysql -e \"GRANT ALL PRIVILEGES ON topleague_prod.* TO 'topleague'@'localhost';\"
mysql -e \"FLUSH PRIVILEGES;\"

echo '✅ MariaDB configurato'
"

log_success "MariaDB configurato"

# Crea configurazione Nginx
log_info "Configurando Nginx..."

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

# Crea configurazione PM2
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

# Copia configurazioni
scp_copy nginx-topleague.conf /etc/nginx/sites-available/topleague
scp_copy ecosystem.config.js /var/www/topleague/

# Configura Nginx
ssh_exec "
ln -sf /etc/nginx/sites-available/topleague /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo '✅ Nginx configurato'
"

log_success "Nginx configurato"

# Build frontend
log_info "Build del frontend..."

cd frontend
npm install
npm run build

# Copia frontend
sshpass -p '25QQj2Fh' scp -o StrictHostKeyChecking=no -r build/* root@217.154.43.87:/var/www/topleague/frontend/

log_success "Frontend deployato"

# Copia backend
log_info "Deploy del backend..."

cd ../backend
sshpass -p '25QQj2Fh' scp -o StrictHostKeyChecking=no -r * root@217.154.43.87:/var/www/topleague/backend/
sshpass -p '25QQj2Fh' scp -o StrictHostKeyChecking=no env.production root@217.154.43.87:/var/www/topleague/backend/.env

# Installa dipendenze backend
ssh_exec "
cd /var/www/topleague/backend
npm install --production
echo '✅ Backend installato'
"

log_success "Backend deployato"

# Avvia applicazione
log_info "Avviando applicazione..."

ssh_exec "
cd /var/www/topleague
pm2 start ecosystem.config.js
pm2 save
pm2 startup

chown -R www-data:www-data /var/www/topleague
chmod -R 755 /var/www/topleague

echo '✅ Applicazione avviata'
"

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
echo "- Controlla logs: sshpass -p '25QQj2Fh' ssh root@217.154.43.87 'pm2 logs'"
echo "- Riavvia app: sshpass -p '25QQj2Fh' ssh root@217.154.43.87 'pm2 restart topleague-backend'"
echo "- Controlla status: sshpass -p '25QQj2Fh' ssh root@217.154.43.87 'pm2 status'" 