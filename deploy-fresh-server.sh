#!/bin/bash

echo "🚀 Deploying to fresh server..."

# Server details
SERVER="root@217.154.43.87"
SERVER_PATH="/var/www/top-league.org"

echo "📁 Creating server directory structure..."
ssh $SERVER "mkdir -p $SERVER_PATH/{backend,frontend}"

echo "📤 Uploading backend files..."
scp -r backend/* $SERVER:$SERVER_PATH/backend/

echo "📤 Uploading frontend files..."
scp -r frontend/* $SERVER:$SERVER_PATH/frontend/

echo "🔧 Installing backend dependencies..."
ssh $SERVER "cd $SERVER_PATH/backend && npm install"

echo "🔧 Installing frontend dependencies..."
ssh $SERVER "cd $SERVER_PATH/frontend && npm install"

echo "🏗️ Building frontend..."
ssh $SERVER "cd $SERVER_PATH/frontend && npm run build"

echo "✅ Deployment complete!"
echo "🌐 Server: $SERVER"
echo "📁 Path: $SERVER_PATH" 