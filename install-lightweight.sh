#!/bin/bash

# Lightweight installation for VPS XS (1GB RAM)
PASSWORD="VQJ7tSzw"
SERVER="root@217.154.43.87"

echo "🔧 LIGHTWEIGHT INSTALLATION FOR VPS XS..."
echo "=========================================="

# Function to run SSH command with password
ssh_with_password() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER "$1"
}

echo "🔧 1. Checking current memory usage..."
ssh_with_password "free -h"

echo "🔧 2. Installing only essential packages (one by one)..."
ssh_with_password "apt update"
ssh_with_password "apt install -y curl"
ssh_with_password "apt install -y apache2"
ssh_with_password "apt install -y mariadb-server"

echo "🔧 3. Installing Node.js 18.x (lightweight)..."
ssh_with_password "curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
ssh_with_password "apt install -y nodejs"

echo "🔧 4. Installing PM2 (lightweight process manager)..."
ssh_with_password "npm install -g pm2"

echo "🔧 5. Enabling only essential Apache modules..."
ssh_with_password "a2enmod proxy"
ssh_with_password "a2enmod proxy_http"

echo "🔧 6. Creating directories..."
ssh_with_password "mkdir -p /var/www/top-league.org/backend"
ssh_with_password "mkdir -p /var/www/html"

echo "🔧 7. Starting services..."
ssh_with_password "systemctl start apache2"
ssh_with_password "systemctl enable apache2"
ssh_with_password "systemctl start mariadb"
ssh_with_password "systemctl enable mariadb"

echo "🔧 8. Securing MariaDB (lightweight)..."
ssh_with_password "mysql -u root -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY 'TopLeague2025!';\""
ssh_with_password "mysql -u root -pTopLeague2025! -e \"DELETE FROM mysql.user WHERE User='';\""
ssh_with_password "mysql -u root -pTopLeague2025! -e \"DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');\""
ssh_with_password "mysql -u root -pTopLeague2025! -e \"DROP DATABASE IF EXISTS test;\""
ssh_with_password "mysql -u root -pTopLeague2025! -e \"FLUSH PRIVILEGES;\""

echo "🔧 9. Creating TopLeague database (lightweight)..."
ssh_with_password "mysql -u root -pTopLeague2025! -e \"CREATE USER IF NOT EXISTS 'topleague'@'localhost' IDENTIFIED BY 'TopLeague2025!';\""
ssh_with_password "mysql -u root -pTopLeague2025! -e \"CREATE DATABASE IF NOT EXISTS topleague_local;\""
ssh_with_password "mysql -u root -pTopLeague2025! -e \"GRANT ALL PRIVILEGES ON topleague_local.* TO 'topleague'@'localhost';\""
ssh_with_password "mysql -u root -pTopLeague2025! -e \"FLUSH PRIVILEGES;\""

echo "🔧 10. Testing database connection..."
ssh_with_password "mysql -u topleague -pTopLeague2025! -e 'SELECT 1;'"

echo "🔧 11. Testing Apache..."
ssh_with_password "curl -I http://localhost"

echo "🔧 12. Final memory check..."
ssh_with_password "free -h"

echo "✅ LIGHTWEIGHT INSTALLATION COMPLETE!"
echo "🔧 Ready for backend deployment (lightweight)" 