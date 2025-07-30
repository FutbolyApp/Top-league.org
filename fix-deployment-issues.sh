#!/bin/bash

# Fix deployment issues
PASSWORD="VQJ7tSzw"
SERVER="root@217.154.43.87"

echo "🔧 FIXING DEPLOYMENT ISSUES..."
echo "==============================="

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

echo "🔧 1. Creating database setup file..."
cat > setup-db.sql << 'EOF'
CREATE USER IF NOT EXISTS 'topleague'@'localhost' IDENTIFIED BY 'TopLeague2025!';
CREATE DATABASE IF NOT EXISTS topleague_local;
GRANT ALL PRIVILEGES ON topleague_local.* TO 'topleague'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "🔧 2. Uploading and executing database setup..."
scp_with_password "setup-db.sql" "/tmp/setup-db.sql"
ssh_with_password "mysql < /tmp/setup-db.sql"

echo "🔧 3. Creating backend directory structure..."
ssh_with_password "mkdir -p /var/www/top-league.org/backend"

echo "🔧 4. Uploading backend files individually..."
scp_with_password "backend/index.js" "/var/www/top-league.org/backend/index.js"
scp_with_password "backend/package.json" "/var/www/top-league.org/backend/package.json"
scp_with_password "backend/env.ionos" "/var/www/top-league.org/backend/env.ionos"

echo "🔧 5. Installing backend dependencies..."
ssh_with_password "cd /var/www/top-league.org/backend && npm install"

echo "🔧 6. Starting backend with PM2..."
ssh_with_password "cd /var/www/top-league.org/backend && pm2 start index.js --name topleague-backend"

echo "🔧 7. Creating frontend directory..."
ssh_with_password "mkdir -p /var/www/html"

echo "🔧 8. Uploading frontend files individually..."
scp_with_password "frontend/build/index.html" "/var/www/html/index.html"
scp_with_password "frontend/build/asset-manifest.json" "/var/www/html/asset-manifest.json"
scp_with_password "frontend/build/favicon.ico" "/var/www/html/favicon.ico"
scp_with_password "frontend/build/manifest.json" "/var/www/html/manifest.json"

echo "🔧 9. Uploading static directory..."
ssh_with_password "mkdir -p /var/www/html/static"
scp_with_password "frontend/build/static/css" "/var/www/html/static/"
scp_with_password "frontend/build/static/js" "/var/www/html/static/"

echo "🔧 10. Setting permissions..."
ssh_with_password "chown -R www-data:www-data /var/www/html/"
ssh_with_password "chmod -R 755 /var/www/html/"

echo "🔧 11. Testing system..."
ssh_with_password "curl -I http://localhost"
ssh_with_password "curl http://localhost:3001/api/ping"
ssh_with_password "curl http://localhost/api/ping"

echo "🔧 12. Checking PM2 status..."
ssh_with_password "pm2 list"

echo "✅ DEPLOYMENT ISSUES FIXED!" 