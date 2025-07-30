#!/bin/bash

# Deploy fixes to production - CORRECTED VERSION
PASSWORD="VQJ7tSzw"
SERVER="root@217.154.43.87"

echo "🚀 DEPLOYING FIXES TO PRODUCTION (CORRECTED)"
echo "=============================================="

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

echo "🔧 1. Stopping existing backend..."
ssh_with_password "cd /var/www/top-league.org/backend && pkill -f 'node index.js' || true"
ssh_with_password "cd /var/www/top-league.org/backend && pm2 stop all || true"

echo "🔧 2. Creating necessary directories..."
ssh_with_password "mkdir -p /var/www/top-league.org/backend/routes"
ssh_with_password "mkdir -p /var/www/top-league.org/backend/db"

echo "🔧 3. Uploading fixed backend files..."
scp_with_password "backend/index.js" "/var/www/top-league.org/backend/"
scp_with_password "backend/package.json" "/var/www/top-league.org/backend/"
scp_with_password "backend/routes/schema.js" "/var/www/top-league.org/backend/routes/"
scp_with_password "backend/db/mock.js" "/var/www/top-league.org/backend/db/"

echo "🔧 4. Installing backend dependencies..."
ssh_with_password "cd /var/www/top-league.org/backend && npm install"

echo "🔧 5. Uploading frontend build files..."
scp_with_password "frontend/build/index.html" "/var/www/html/"
scp_with_password "frontend/build/asset-manifest.json" "/var/www/html/"
ssh_with_password "rm -rf /var/www/html/static"
scp_with_password "frontend/build/static" "/var/www/html/"

echo "🔧 6. Setting permissions..."
ssh_with_password "chmod -R 755 /var/www/html/"
ssh_with_password "chown -R www-data:www-data /var/www/html/"
ssh_with_password "chmod -R 755 /var/www/top-league.org/backend/"
ssh_with_password "chown -R www-data:www-data /var/www/top-league.org/backend/"

echo "🔧 7. Starting backend..."
ssh_with_password "cd /var/www/top-league.org/backend && NODE_ENV=production pm2 start index.js --name topleague-backend"

echo "🔧 8. Testing deployment..."
sleep 5
curl -s https://top-league.org/api/ping

echo "✅ DEPLOYMENT COMPLETE!"
echo "🔗 Test the site: https://top-league.org/super-admin-dashboard" 