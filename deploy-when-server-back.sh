#!/bin/bash

echo "🚀 Waiting for server to come back online..."

# Server details
SERVER="root@217.154.43.87"
SERVER_PATH="/var/www/top-league.org"

# Function to check if server is online
check_server() {
    ping -c 1 217.154.43.87 > /dev/null 2>&1
    return $?
}

# Wait for server to come online
echo "⏳ Waiting for server to respond..."
while ! check_server; do
    echo "🔍 Server not responding, waiting 30 seconds..."
    sleep 30
done

echo "✅ Server is online! Starting deployment..."

# Create server directory structure
echo "📁 Creating server directory structure..."
ssh $SERVER "mkdir -p $SERVER_PATH/{backend,frontend}"

# Upload backend files
echo "📤 Uploading backend files..."
scp -r ../backend/* $SERVER:$SERVER_PATH/backend/

# Upload frontend files (including the built version)
echo "📤 Uploading frontend files..."
scp -r * $SERVER:$SERVER_PATH/frontend/

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
ssh $SERVER "cd $SERVER_PATH/backend && npm install"

# Set up backend environment
echo "🔧 Setting up backend environment..."
ssh $SERVER "cd $SERVER_PATH/backend && cp env.ionos .env"

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
ssh $SERVER "cd $SERVER_PATH/backend && pm2 start index.js --name 'topleague-backend' --env production"

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
ssh $SERVER "pm2 save && pm2 startup"

# Set up Nginx configuration
echo "🔧 Setting up Nginx configuration..."
ssh $SERVER "cat > /etc/nginx/sites-available/top-league.org << 'EOF'
server {
    listen 80;
    server_name top-league.org www.top-league.org;
    
    location / {
        root /var/www/top-league.org/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache busting headers
        add_header Cache-Control 'no-cache, no-store, must-revalidate, max-age=0';
        add_header Pragma 'no-cache';
        add_header Expires '-1';
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"

# Enable Nginx site
echo "🔧 Enabling Nginx site..."
ssh $SERVER "ln -sf /etc/nginx/sites-available/top-league.org /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default"

# Test and reload Nginx
echo "🔧 Testing and reloading Nginx..."
ssh $SERVER "nginx -t && systemctl reload nginx"

# Start Nginx if not running
echo "🚀 Starting Nginx..."
ssh $SERVER "systemctl start nginx && systemctl enable nginx"

echo "✅ Deployment complete!"
echo "🌐 Server: $SERVER"
echo "📁 Path: $SERVER_PATH"
echo "📊 PM2 Status:"
ssh $SERVER "pm2 status"
echo "🔧 Nginx Status:"
ssh $SERVER "systemctl status nginx --no-pager" 