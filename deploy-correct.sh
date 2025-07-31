#!/bin/bash

echo "🚀 Deploying API fixes to production..."
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Backup del backend attuale
echo "📦 Creating backup..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && tar -czf backend-backup-$(date +%Y%m%d_%H%M%S).tar.gz ."

# Upload dei file corretti
echo "📤 Uploading fixed files..."

# Upload backend files (struttura corretta)
echo "📤 Uploading backend files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/index.js root@top-league.org:/var/www/html/backend/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/auth.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/notifiche.js root@top-league.org:/var/www/html/routes/
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/middleware/errorHandler.js root@top-league.org:/var/www/html/middleware/

# Il frontend è già buildato, aggiorniamo solo i file statici
echo "📤 Frontend is already built, skipping frontend upload..."

# Restart del backend
echo "🔄 Restarting backend..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && pm2 restart backend"

# Test degli endpoint
echo "🧪 Testing endpoints..."
sleep 10

echo "✅ Testing /api/version..."
curl -s https://www.top-league.org/api/version | head -c 100

echo "✅ Testing /api/auth/login..."
curl -s -X POST https://www.top-league.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' | head -c 100

echo "✅ Testing /api/notifiche..."
curl -s -X GET https://www.top-league.org/api/notifiche \
  -H "Authorization: Bearer invalid_token" | head -c 100

echo "🎉 Deployment completed!"
echo "📊 Check logs with: sshpass -p 'VQJ7tSzw' ssh root@top-league.org 'pm2 logs backend'" 