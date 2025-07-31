#!/bin/bash

echo "🚀 Deploying API fixes to production..."

# Backup del backend attuale
echo "📦 Creating backup..."
ssh root@top-league.org "cd /var/www/html && tar -czf backend-backup-$(date +%Y%m%d_%H%M%S).tar.gz backend/"

# Upload dei file corretti
echo "📤 Uploading fixed files..."

# Upload backend files
scp backend/index.js root@top-league.org:/var/www/html/backend/
scp backend/routes/auth.js root@top-league.org:/var/www/html/backend/routes/
scp backend/routes/notifiche.js root@top-league.org:/var/www/html/backend/routes/
scp backend/middleware/errorHandler.js root@top-league.org:/var/www/html/backend/middleware/

# Upload frontend files
scp frontend/src/api/config.js root@top-league.org:/var/www/html/frontend/src/api/
scp frontend/src/api/auth.js root@top-league.org:/var/www/html/frontend/src/api/
scp frontend/src/components/NetworkErrorHandler.js root@top-league.org:/var/www/html/frontend/src/components/
scp frontend/src/App.js root@top-league.org:/var/www/html/frontend/src/

# Restart del backend
echo "🔄 Restarting backend..."
ssh root@top-league.org "cd /var/www/html/backend && pm2 restart backend"

# Build del frontend
echo "🔨 Building frontend..."
ssh root@top-league.org "cd /var/www/html/frontend && npm run build"

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
echo "📊 Check logs with: ssh root@top-league.org 'pm2 logs backend'" 