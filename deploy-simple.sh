#!/bin/bash

echo "🚀 DEPLOY SEMPLICE - TOPLEAGUE ONLINE"
echo "======================================"

# 1. Aggiorna il codice del backend
echo "📦 Aggiornando il codice del backend..."
rsync -avz --exclude=node_modules --exclude=.git backend/ root@top-league.org:/var/www/topleague/backend/

echo "✅ Deploy completato!"
echo "🔗 Il backend dovrebbe riavviarsi automaticamente"
echo "🔗 Testa: https://top-league.org/api/ping" 