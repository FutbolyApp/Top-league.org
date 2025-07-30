#!/bin/bash

# Complete TopLeague deployment
PASSWORD="VQJ7tSzw"
SERVER="root@217.154.43.87"

echo "🚀 TOPLEAGUE COMPLETE DEPLOYMENT STARTING..."
echo "============================================="

# Function to run SSH command with password
ssh_with_password() {
    expect << EOF
spawn ssh -o StrictHostKeyChecking=no $SERVER "$1"
expect "password:"
send "$PASSWORD\r"
expect eof
EOF
}

# Function to upload file with password
scp_with_password() {
    local local_file=$1
    local remote_path=$2
    expect << EOF
spawn scp -o StrictHostKeyChecking=no "$local_file" $SERVER:"$remote_path"
expect "password:"
send "$PASSWORD\r"
expect eof
EOF
}

echo "🔧 1. Installing essential packages..."
ssh_with_password "apt update && apt upgrade -y"
ssh_with_password "apt install -y curl wget git expect apache2 mariadb-server mariadb-client"

echo "🔧 2. Installing Node.js 18.x..."
ssh_with_password "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
ssh_with_password "apt install -y nodejs"

echo "🔧 3. Installing PM2..."
ssh_with_password "npm install -g pm2"

echo "🔧 4. Enabling Apache modules..."
ssh_with_password "a2enmod proxy"
ssh_with_password "a2enmod proxy_http"
ssh_with_password "a2enmod rewrite"

echo "🔧 5. Creating TopLeague directories..."
ssh_with_password "mkdir -p /var/www/top-league.org/backend"
ssh_with_password "mkdir -p /var/www/html"
ssh_with_password "mkdir -p /var/backups/topleague"

echo "🔧 6. Setting permissions..."
ssh_with_password "chown -R www-data:www-data /var/www/"

echo "🔧 7. Starting and enabling services..."
ssh_with_password "systemctl start apache2"
ssh_with_password "systemctl enable apache2"
ssh_with_password "systemctl start mariadb"
ssh_with_password "systemctl enable mariadb"

echo "🔧 8. Securing MariaDB..."
ssh_with_password "mysql_secure_installation << EOF
Y
0
TopLeague2025!
TopLeague2025!
Y
Y
Y
Y
EOF"

echo "🔧 9. Creating TopLeague database and user..."
ssh_with_password "mysql -u root -e \"CREATE USER IF NOT EXISTS 'topleague'@'localhost' IDENTIFIED BY 'TopLeague2025!';\""
ssh_with_password "mysql -u root -e \"CREATE DATABASE IF NOT EXISTS topleague_local;\""
ssh_with_password "mysql -u root -e \"GRANT ALL PRIVILEGES ON topleague_local.* TO 'topleague'@'localhost';\""
ssh_with_password "mysql -u root -e \"FLUSH PRIVILEGES;\""

echo "✅ BASIC SETUP COMPLETE!"
echo "🔧 Now uploading backend and frontend..."

echo "🔧 10. Uploading backend files..."
scp_with_password "backend/index.js" "/var/www/top-league.org/backend/"
scp_with_password "backend/package.json" "/var/www/top-league.org/backend/"
scp_with_password "backend/env.ionos" "/var/www/top-league.org/backend/"

echo "🔧 11. Installing backend dependencies..."
ssh_with_password "cd /var/www/top-league.org/backend && npm install"

echo "🔧 12. Starting backend with PM2..."
ssh_with_password "cd /var/www/top-league.org/backend && pm2 start index.js --name topleague-backend"

echo "🔧 13. Building frontend..."
cd frontend && npm run build && cd ..

echo "🔧 14. Uploading frontend build..."
scp_with_password "frontend/build/index.html" "/var/www/html/"
scp_with_password "frontend/build/static" "/var/www/html/"
scp_with_password "frontend/build/asset-manifest.json" "/var/www/html/"
scp_with_password "frontend/build/favicon.ico" "/var/www/html/"
scp_with_password "frontend/build/manifest.json" "/var/www/html/"

echo "🔧 15. Setting frontend permissions..."
ssh_with_password "chown -R www-data:www-data /var/www/html/"
ssh_with_password "chmod -R 755 /var/www/html/"

echo "🔧 16. Adding Apache proxy configuration..."
ssh_with_password "echo 'ProxyPass /api http://localhost:3001/api' >> /etc/apache2/sites-available/000-default.conf"
ssh_with_password "echo 'ProxyPassReverse /api http://localhost:3001/api' >> /etc/apache2/sites-available/000-default.conf"

echo "🔧 17. Restarting Apache..."
ssh_with_password "systemctl restart apache2"

echo "🔧 18. Testing system..."
ssh_with_password "curl -I http://localhost"
ssh_with_password "curl http://localhost:3001/api/ping"
ssh_with_password "curl http://localhost/api/ping"

echo "✅ TOPLEAGUE DEPLOYMENT COMPLETE!"
echo "🌐 Website: http://top-league.org"
echo "🔧 Backend: http://localhost:3001"
echo "📊 PM2 Status: pm2 list" 