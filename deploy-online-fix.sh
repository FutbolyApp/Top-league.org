#!/bin/bash

echo "🚀 DEPLOY FIX DATABASE ONLINE - TOPLEAGUE"
echo "=========================================="

# 1. Ferma il backend attuale
echo "🛑 Fermando il backend attuale..."
ssh root@top-league.org "cd /var/www/topleague/backend && pm2 stop topleague-backend || true"

# 2. Aggiorna il codice del backend
echo "📦 Aggiornando il codice del backend..."
rsync -avz --exclude=node_modules --exclude=.git backend/ root@top-league.org:/var/www/topleague/backend/

# 3. Installa le dipendenze se necessario
echo "📦 Installando dipendenze..."
ssh root@top-league.org "cd /var/www/topleague/backend && npm install"

# 4. Riavvia il backend
echo "🔄 Riavviamo il backend..."
ssh root@top-league.org "cd /var/www/topleague/backend && pm2 start topleague-backend"

# 5. Controlla lo stato
echo "✅ Controllando lo stato del backend..."
ssh root@top-league.org "pm2 status"

echo "🎉 Deploy completato!"
echo "🔗 Testa l'API: https://top-league.org/api/ping" 