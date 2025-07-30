#!/bin/bash

echo "🚀 Starting services on fresh server..."

# Server details
SERVER="root@217.154.43.87"
SERVER_PATH="/var/www/top-league.org"

echo "🔧 Setting up backend environment..."
ssh $SERVER "cd $SERVER_PATH/backend && cp env.ionos .env"

echo "🏗️ Building frontend..."
ssh $SERVER "cd $SERVER_PATH/frontend && npm install && npm run build"

echo "🚀 Starting backend with PM2..."
ssh $SERVER "cd $SERVER_PATH/backend && pm2 start index.js --name 'topleague-backend' --env production"

echo "💾 Saving PM2 configuration..."
ssh $SERVER "pm2 save && pm2 startup"

echo "✅ Services started!"
echo "📊 PM2 Status:"
ssh $SERVER "pm2 status" 