#!/bin/bash

echo "🚀 DEPLOYING PRODUCTION FIX"
echo "================================"

# Kill any existing processes on the server
echo "📋 Step 1: Stopping existing processes..."
ssh root@top-league.org "cd /var/www/top-league.org/backend && pkill -f 'node index.js' || true"
ssh root@top-league.org "cd /var/www/top-league.org/backend && pm2 stop all || true"

# Wait a moment
sleep 3

# Copy the updated backend files
echo "📋 Step 2: Copying updated backend files..."
scp -r backend/* root@top-league.org:/var/www/top-league.org/backend/

# Copy the updated frontend build
echo "📋 Step 3: Copying updated frontend build..."
scp -r frontend/build/* root@top-league.org:/var/www/top-league.org/backend/public/

# Set proper permissions
echo "📋 Step 4: Setting permissions..."
ssh root@top-league.org "chmod -R 755 /var/www/top-league.org/backend/public/"

# Restart the server
echo "📋 Step 5: Restarting the server..."
ssh root@top-league.org "cd /var/www/top-league.org/backend && NODE_ENV=production pm2 start index.js --name topleague-backend"

# Test the server
echo "📋 Step 6: Testing the server..."
sleep 5
curl -s https://top-league.org/api/ping

echo "✅ DEPLOYMENT COMPLETE!"
echo "🔗 Test the site: https://top-league.org" 