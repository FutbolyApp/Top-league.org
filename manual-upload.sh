#!/bin/bash

# Manual upload without quotes issues
PASSWORD="VQJ7tSzw"
SERVER="root@217.154.43.87"

echo "🔧 MANUAL UPLOAD WITHOUT QUOTES..."
echo "==================================="

# Function to run SSH command with password
ssh_with_password() {
    expect << EOF
spawn ssh -o StrictHostKeyChecking=no $SERVER "$1"
expect "password:"
send "$PASSWORD\r"
expect eof
EOF
}

echo "🔧 1. Creating database setup..."
ssh_with_password "mysql -u root -e \"CREATE USER IF NOT EXISTS 'topleague'@'localhost' IDENTIFIED BY 'TopLeague2025!';\""
ssh_with_password "mysql -u root -e \"CREATE DATABASE IF NOT EXISTS topleague_local;\""
ssh_with_password "mysql -u root -e \"GRANT ALL PRIVILEGES ON topleague_local.* TO 'topleague'@'localhost';\""
ssh_with_password "mysql -u root -e \"FLUSH PRIVILEGES;\""

echo "🔧 2. Creating backend directory..."
ssh_with_password "mkdir -p /var/www/top-league.org/backend"

echo "🔧 3. Creating frontend directory..."
ssh_with_password "mkdir -p /var/www/html"

echo "🔧 4. Testing database connection..."
ssh_with_password "mysql -u topleague -pTopLeague2025! -e 'SELECT 1;'"

echo "🔧 5. Testing Apache..."
ssh_with_password "curl -I http://localhost"

echo "✅ MANUAL SETUP COMPLETE!"
echo "🔧 Now you can manually upload files via SSH or SCP" 