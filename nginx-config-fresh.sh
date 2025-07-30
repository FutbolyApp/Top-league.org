#!/bin/bash

echo "🔧 Setting up Nginx configuration for fresh server..."

# Server details
SERVER="root@217.154.43.87"

echo "📝 Creating Nginx configuration..."
ssh $SERVER "cat > /etc/nginx/sites-available/top-league.org << 'EOF'
server {
    listen 80;
    server_name top-league.org www.top-league.org;
    
    # Frontend static files
    location / {
        root /var/www/top-league.org/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache busting headers
        add_header Cache-Control 'no-cache, no-store, must-revalidate, max-age=0';
        add_header Pragma 'no-cache';
        add_header Expires '-1';
    }
    
    # API proxy to Node.js backend
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
    
    # Handle 404s for SPA
    error_page 404 /index.html;
}
EOF"

echo "🔗 Enabling site..."
ssh $SERVER "ln -sf /etc/nginx/sites-available/top-league.org /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default"

echo "✅ Testing Nginx configuration..."
ssh $SERVER "nginx -t"

echo "🔄 Reloading Nginx..."
ssh $SERVER "systemctl reload nginx"

echo "✅ Nginx configuration complete!" 