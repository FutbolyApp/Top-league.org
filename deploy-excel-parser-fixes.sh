#!/bin/bash

echo "🚀 Deploying Excel Parser fixes to production..."
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Backup del backend attuale
echo "📦 Creating backup..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && tar -czf backend-excel-backup-$(date +%Y%m%d_%H%M%S).tar.gz utils/ routes/"

# Upload dei file Excel parser corretti
echo "📤 Uploading Excel parser fixed files..."

# Upload Excel parser files
echo "📤 Uploading Excel parser files..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/utils/excelParser.js root@top-league.org:/var/www/html/utils/

# Upload leghe-fixed.js if it exists
if [ -f "backend/routes/leghe-fixed.js" ]; then
    echo "📤 Uploading leghe-fixed.js..."
    sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no backend/routes/leghe-fixed.js root@top-league.org:/var/www/html/routes/
fi

# Restart del backend
echo "🔄 Restarting backend..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && pm2 restart index.js"

# Test degli endpoint
echo "🧪 Testing endpoints..."
sleep 10

echo "✅ Testing /api/version..."
curl -s https://www.top-league.org/api/version | head -c 100

echo "✅ Testing Excel upload endpoint..."
curl -s -X POST https://www.top-league.org/api/leghe/create \
  -H "Content-Type: multipart/form-data" \
  -F "nome=Test League" \
  -F "modalita=Classic Serie A" \
  -F "max_squadre=18" | head -c 100

echo "🎉 Excel Parser deployment completed!"
echo "📊 Check logs with: sshpass -p 'VQJ7tSzw' ssh root@top-league.org 'pm2 logs index'"
echo "🔍 Test Excel upload with your file to see the improved logging" 