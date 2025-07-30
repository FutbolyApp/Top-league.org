#!/bin/bash

echo "🗑️ Force removing all Plesk components..."

# Wait for server to be online
while ! ping -c 1 217.154.43.87 > /dev/null 2>&1; do
    echo "⏳ Waiting for server to come online..."
    sleep 30
done

echo "✅ Server is online! Force removing Plesk..."

# Stop all Plesk services
ssh root@217.154.43.87 "systemctl stop plesk* apache2 nginx"

# Remove all Plesk packages
ssh root@217.154.43.87 "apt-get remove --purge -y plesk* psa-*"

# Clean up Plesk directories
ssh root@217.154.43.87 "rm -rf /usr/local/psa /opt/plesk /var/lib/psa"

# Remove Plesk from Apache
ssh root@217.154.43.87 "rm -f /etc/apache2/conf-enabled/zz010_psa_*.conf"
ssh root@217.154.43.87 "rm -f /etc/apache2/sites-enabled/zz010_psa_*.conf"

# Clean up package manager
ssh root@217.154.43.87 "apt-get autoremove -y && apt-get autoclean"

# Reinstall Apache clean
ssh root@217.154.43.87 "apt-get install -y apache2"

echo "✅ Plesk removal complete!" 