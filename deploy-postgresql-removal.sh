#!/bin/bash

echo "🚀 Deploying PostgreSQL removal fixes to production..."
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Backup del backend attuale
echo "📦 Creating backup..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && tar -czf backend-backup-postgresql-removal-$(date +%Y%m%d_%H%M%S).tar.gz ."

# Upload dei file corretti con rimozione PostgreSQL
echo "📤 Uploading fixed files..."

# Upload backend files with MariaDB imports
echo "📤 Uploading backend files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/index.js root@top-league.org:/var/www/html/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/squadre.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/auth.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/notifiche.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/middleware/errorHandler.js root@top-league.org:/var/www/html/middleware/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/middleware/validations.js root@top-league.org:/var/www/html/middleware/

# Upload model files with MariaDB imports
echo "📤 Uploading model files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/logSquadra.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/notifica.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/log.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/richiestaAdmin.js root@top-league.org:/var/www/html/models/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/models/logContratto.js root@top-league.org:/var/www/html/models/

# Upload utility files with MariaDB imports
echo "📤 Uploading utility files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/utils/leagueConfig.js root@top-league.org:/var/www/html/utils/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/utils/scraperPuppeteer.js root@top-league.org:/var/www/html/utils/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/utils/backup.js root@top-league.org:/var/www/html/utils/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/utils/scraper.js root@top-league.org:/var/www/html/utils/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/utils/playwrightScraper.js root@top-league.org:/var/www/html/utils/

# Upload script files with MariaDB imports
echo "📤 Uploading script files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/scripts/resetUsers.js root@top-league.org:/var/www/html/scripts/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/scripts/create_missing_tables.js root@top-league.org:/var/www/html/scripts/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/scripts/update_schema.js root@top-league.org:/var/www/html/scripts/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/scripts/fix_notifiche_table.js root@top-league.org:/var/www/html/scripts/

# Upload frontend files with favicon fixes
echo "📤 Uploading frontend files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no frontend/public/index.html root@top-league.org:/var/www/html/

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

echo "🎉 Deployment completed!"
echo "📊 Check logs with: sshpass -p 'VQJ7tSzw' ssh root@top-league.org 'pm2 logs topleague-backend'" 