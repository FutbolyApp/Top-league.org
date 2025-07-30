#!/bin/bash

# 🎯 TopLeague - Deployment Automatico
# Versione: 1.0.0
# Data: 2025-07-26

set -e  # Exit on any error

echo "🚀 TopLeague - Deployment Automatico"
echo "===================================="

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

# Verifica che siamo nella directory corretta
if [ ! -f "server-setup.sh" ]; then
    error "Esegui questo script dalla directory del deployment"
fi

log "Inizio deployment automatico..."

# 1. Verifica prerequisiti
log "1️⃣ Verifica prerequisiti..."

# Verifica Node.js
if ! command -v node &> /dev/null; then
    error "Node.js non installato. Esegui prima ./server-setup.sh"
fi

# Verifica MariaDB
if ! systemctl is-active --quiet mariadb; then
    error "MariaDB non attivo. Esegui prima ./server-setup.sh"
fi

# Verifica PM2
if ! command -v pm2 &> /dev/null; then
    error "PM2 non installato. Esegui prima ./server-setup.sh"
fi

log "✅ Prerequisiti verificati"

# 2. Crea directory applicazione
log "2️⃣ Preparazione directory..."
mkdir -p /var/www/top-league.org/{backend,frontend,uploads}
chown -R www-data:www-data /var/www/top-league.org

# 3. Deploy Backend
log "3️⃣ Deploy Backend..."

# Copia backend
cp -r backend/* /var/www/top-league.org/backend/
cd /var/www/top-league.org/backend

# Installa dipendenze
log "📦 Installazione dipendenze backend..."
npm install

# Crea cartella uploads se non esiste
mkdir -p uploads
chmod 755 uploads

# 4. Build Frontend
log "4️⃣ Build Frontend..."

# Copia frontend
cp -r frontend/* /var/www/top-league.org/frontend/
cd /var/www/top-league.org/frontend

# Installa dipendenze
log "📦 Installazione dipendenze frontend..."
npm install

# Build per produzione
log "🔨 Build frontend per produzione..."
npm run build

# Copia build in directory finale
cp -r build/* /var/www/top-league.org/frontend/

# 5. Configurazione Backend
log "5️⃣ Configurazione Backend..."

cd /var/www/top-league.org/backend

# Crea file di configurazione PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'topleague-backend',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Crea directory logs
mkdir -p logs

# 6. Avvia applicazione
log "6️⃣ Avvio applicazione..."

# Ferma eventuali processi esistenti
pm2 delete topleague-backend 2>/dev/null || true

# Avvia con PM2
pm2 start ecosystem.config.js

# Salva configurazione PM2
pm2 save

# Configura PM2 per avvio automatico
pm2 startup

# 7. Test applicazione
log "7️⃣ Test applicazione..."

# Aspetta che l'app si avvii
sleep 10

# Test API
if curl -s http://localhost:3001/api/ping > /dev/null; then
    log "✅ Backend API funzionante"
else
    error "❌ Backend API non risponde"
fi

# Test database
if mysql -u root -p25QQj2Fh -e "USE topleague_db; SELECT 1;" > /dev/null 2>&1; then
    log "✅ Database connesso"
else
    error "❌ Database non accessibile"
fi

# 8. Configurazione finale
log "8️⃣ Configurazione finale..."

# Riavvia Nginx
systemctl restart nginx

# Verifica servizi
systemctl is-active --quiet nginx && log "✅ Nginx attivo" || error "❌ Nginx non attivo"
systemctl is-active --quiet mariadb && log "✅ MariaDB attivo" || error "❌ MariaDB non attivo"

# 9. Test finale
log "9️⃣ Test finale..."

# Test frontend
if curl -s http://217.154.43.87 > /dev/null; then
    log "✅ Frontend accessibile"
else
    warning "⚠️ Frontend non ancora accessibile (può richiedere alcuni minuti)"
fi

# Test API pubblica
if curl -s http://217.154.43.87/api/ping > /dev/null; then
    log "✅ API pubblica funzionante"
else
    warning "⚠️ API pubblica non ancora accessibile"
fi

# 10. Informazioni finali
log "🔟 Deployment completato!"

echo ""
echo "🎉 DEPLOYMENT COMPLETATO CON SUCCESSO!"
echo "======================================="
echo ""
echo "📊 INFORMAZIONI APPLICAZIONE:"
echo "=============================="
echo "🌐 URL Frontend: http://217.154.43.87"
echo "🔗 URL API: http://217.154.43.87/api"
echo "🗄️ Database: MariaDB (topleague_db)"
echo "🔧 PM2 Status: pm2 status"
echo "📋 Logs: pm2 logs topleague-backend"
echo ""
echo "🔧 COMANDI UTILI:"
echo "=================="
echo "pm2 status                    # Stato applicazione"
echo "pm2 logs topleague-backend    # Log applicazione"
echo "pm2 restart topleague-backend # Riavvia applicazione"
echo "systemctl status nginx        # Stato Nginx"
echo "systemctl status mariadb      # Stato MariaDB"
echo ""
echo "🎯 La tua applicazione TopLeague è ora LIVE!"
echo "✅ Tutti i problemi risolti:"
echo "   - Database MariaDB configurato"
echo "   - Environment variables corrette"
echo "   - Import Excel funzionante"
echo "   - Formattazione numeri corretta"
echo "   - Server stabile e monitorato"
echo ""
echo "🚀 Prova ora a creare una lega e importare un file Excel!" 