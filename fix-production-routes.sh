#!/bin/bash

echo "🚀 Fixing production routes and authentication issues..."
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Backup del backend attuale
echo "📦 Creating backup..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && tar -czf backend-backup-routes-fix-$(date +%Y%m%d_%H%M%S).tar.gz ."

# Upload the complete leghe.js file with all routes
echo "📤 Uploading complete leghe.js with all routes..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/leghe.js root@top-league.org:/var/www/html/routes/

# Upload the complete auth.js file
echo "📤 Uploading complete auth.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/auth.js root@top-league.org:/var/www/html/routes/

# Upload the complete notifiche.js file
echo "📤 Uploading complete notifiche.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/notifiche.js root@top-league.org:/var/www/html/routes/

# Upload the complete squadre.js file
echo "📤 Uploading complete squadre.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/squadre.js root@top-league.org:/var/www/html/routes/

# Upload the complete subadmin.js file
echo "📤 Uploading complete subadmin.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/subadmin.js root@top-league.org:/var/www/html/routes/

# Upload the complete superadmin.js file
echo "📤 Uploading complete superadmin.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/superadmin.js root@top-league.org:/var/www/html/routes/

# Upload the complete richiesteAdmin.js file
echo "📤 Uploading complete richiesteAdmin.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/richiesteAdmin.js root@top-league.org:/var/www/html/routes/

# Upload the complete giocatori.js file
echo "📤 Uploading complete giocatori.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/giocatori.js root@top-league.org:/var/www/html/routes/

# Upload the complete offerte.js file
echo "📤 Uploading complete offerte.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/offerte.js root@top-league.org:/var/www/html/routes/

# Upload the complete quotazioni.js file
echo "📤 Uploading complete quotazioni.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/quotazioni.js root@top-league.org:/var/www/html/routes/

# Upload the complete tornei.js file
echo "📤 Uploading complete tornei.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/tornei.js root@top-league.org:/var/www/html/routes/

# Upload the complete contratti.js file
echo "📤 Uploading complete contratti.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/contratti.js root@top-league.org:/var/www/html/routes/

# Upload the complete finanze.js file
echo "📤 Uploading complete finanze.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/finanze.js root@top-league.org:/var/www/html/routes/

# Upload the complete scraping.js file
echo "📤 Uploading complete scraping.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/scraping.js root@top-league.org:/var/www/html/routes/

# Upload the complete debug.js file
echo "📤 Uploading complete debug.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/debug.js root@top-league.org:/var/www/html/routes/

# Upload the complete test.js file
echo "📤 Uploading complete test.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/test.js root@top-league.org:/var/www/html/routes/

# Upload the complete logSquadra.js file
echo "📤 Uploading complete logSquadra.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/logSquadra.js root@top-league.org:/var/www/html/routes/

# Upload the complete schema.js file
echo "📤 Uploading complete schema.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/schema.js root@top-league.org:/var/www/html/routes/

# Upload the complete backup.js file
echo "📤 Uploading complete backup.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/backup.js root@top-league.org:/var/www/html/routes/

# Upload the complete log.js file
echo "📤 Uploading complete log.js..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/log.js root@top-league.org:/var/www/html/routes/

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

echo "✅ Testing /api/leghe/all..."
curl -s https://www.top-league.org/api/leghe/all -H "Content-Type: application/json" | head -c 100

echo "✅ Testing /api/leghe/admin..."
curl -s https://www.top-league.org/api/leghe/admin -H "Content-Type: application/json" | head -c 100

echo "✅ Testing /api/leghe/user-leagues..."
curl -s https://www.top-league.org/api/leghe/user-leagues -H "Content-Type: application/json" | head -c 100

echo "✅ Testing /api/leghe/richieste/admin..."
curl -s https://www.top-league.org/api/leghe/richieste/admin -H "Content-Type: application/json" | head -c 100

echo "✅ Testing /api/auth/all-users..."
curl -s https://www.top-league.org/api/auth/all-users -H "Content-Type: application/json" | head -c 100

echo "✅ Testing /api/subadmin/all..."
curl -s https://www.top-league.org/api/subadmin/all -H "Content-Type: application/json" | head -c 100

echo "✅ Testing /api/subadmin/check-all..."
curl -s https://www.top-league.org/api/subadmin/check-all -H "Content-Type: application/json" | head -c 100

echo "✅ Testing /api/notifiche..."
curl -s https://www.top-league.org/api/notifiche -H "Content-Type: application/json" | head -c 100

echo "🎉 Routes fix completed!"
echo "📊 Check logs with: sshpass -p 'VQJ7tSzw' ssh root@top-league.org 'pm2 logs topleague-backend'" 