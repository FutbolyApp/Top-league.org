#!/bin/bash

echo "🚀 Fixing production database imports..."
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Backup del backend attuale
echo "📦 Creating backup..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && tar -czf backend-backup-database-fix-$(date +%Y%m%d_%H%M%S).tar.gz ."

# Upload dei file corretti con database imports
echo "📤 Uploading fixed files..."

# Upload all route files with MariaDB imports
echo "📤 Uploading route files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/schema.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/contratti.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/scraping.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/tornei.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/subadmin.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/debug.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/superadmin.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/richiesteAdmin.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/giocatori.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/finanze.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/test.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/offerte.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/quotazioni.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/logSquadra.js root@top-league.org:/var/www/html/routes/

# Upload all model files with MariaDB imports
echo "📤 Uploading model files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/rosterManager.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/lega.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/squadra.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/subadmin.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/offerta.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/pendingChanges.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/giocatore.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/utente.js root@top-league.org:/var/www/html/models/

# Upload script files with MariaDB imports
echo "📤 Uploading script files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/scripts/fix_remaining_columns.js root@top-league.org:/var/www/html/scripts/

# Upload database files
echo "📤 Uploading database files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/db/mariadb.js root@top-league.org:/var/www/html/db/

# Restart del backend
echo "🔄 Restarting backend..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && pm2 restart topleague-backend"

# Test degli endpoint
echo "🧪 Testing endpoints..."
sleep 10

echo "✅ Testing /api/version..."
curl -s https://www.top-league.org/api/version | head -c 100

echo "✅ Testing /api/squadre/utente..."
curl -s https://www.top-league.org/api/squadre/utente -H "Content-Type: application/json" | head -c 100

echo "✅ Testing /api/auth/login..."
curl -s -X POST https://www.top-league.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' | head -c 100

echo "🎉 Database fix completed!"
echo "📊 Check logs with: sshpass -p 'VQJ7tSzw' ssh root@top-league.org 'pm2 logs topleague-backend'" 