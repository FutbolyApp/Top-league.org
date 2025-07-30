#!/bin/bash

echo "🔄 Waiting for server to come back online after Plesk removal..."

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

echo "✅ Server is online! Setting up clean Apache configuration..."

# Upload Apache configuration
echo "📤 Uploading Apache configuration..."
scp -o StrictHostKeyChecking=no apache-clean.conf root@217.154.43.87:/etc/apache2/sites-available/000-default.conf

# Enable required Apache modules
echo "🔧 Enabling Apache modules..."
ssh root@217.154.43.87 "a2enmod proxy proxy_http rewrite headers"

# Test Apache configuration
echo "🔧 Testing Apache configuration..."
ssh root@217.154.43.87 "apache2ctl configtest"

# Restart Apache
echo "🚀 Restarting Apache..."
ssh root@217.154.43.87 "systemctl restart apache2"

# Check backend status
echo "🔍 Checking backend status..."
ssh root@217.154.43.87 "pm2 status"

# Test the website
echo "🌐 Testing website..."
curl -I http://217.154.43.87

echo "✅ Setup complete!"
echo "🌐 Website: http://217.154.43.87"
echo "🌐 Domain: http://top-league.org" 