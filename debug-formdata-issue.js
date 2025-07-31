#!/bin/bash

echo "🔍 DEBUG: FormData Issue Investigation"
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Check the current index.js content
echo "📋 Checking current index.js middleware order..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "grep -n 'app.use' /var/www/html/index.js"

# Check if multer is properly configured in leghe.js
echo "📋 Checking multer configuration in leghe.js..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "grep -A 10 -B 5 'upload.single' /var/www/html/routes/leghe.js"

# Test the server logs in real-time
echo "📋 Starting real-time log monitoring..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "pm2 logs topleague-backend --lines 0" &
LOG_PID=$!

# Wait a moment for logs to start
sleep 2

# Test FormData endpoint with detailed debugging
echo "🧪 Testing FormData endpoint with detailed debugging..."

# Test 1: Simple FormData without file
echo "✅ Test 1: Simple FormData without file..."
curl -v -X POST https://www.top-league.org/api/leghe/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" \
  -F "nome=TestLega" \
  -F "modalita=Test" \
  -F "admin_id=1" \
  -F "is_pubblica=true" 2>&1 | head -20

sleep 3

# Test 2: Check if the request reaches the server
echo "✅ Test 2: Checking server logs for the request..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "pm2 logs topleague-backend --lines 10"

# Test 3: Check the actual request processing
echo "✅ Test 3: Testing with a different approach..."
curl -s -X POST https://www.top-league.org/api/leghe/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" \
  -H "Content-Type: application/json" \
  -d '{"nome":"TestLega","modalita":"Test","admin_id":1,"is_pubblica":true}' | head -c 200

echo ""

# Test 4: Check if JSON works but FormData doesn't
echo "✅ Test 4: Testing JSON vs FormData..."
echo "JSON request:"
curl -s -X POST https://www.top-league.org/api/leghe/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" \
  -H "Content-Type: application/json" \
  -d '{"nome":"TestLega","modalita":"Test","admin_id":1,"is_pubblica":true}' | head -c 200

echo ""
echo "FormData request:"
curl -s -X POST https://www.top-league.org/api/leghe/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" \
  -F "nome=TestLega" \
  -F "modalita=Test" \
  -F "admin_id=1" \
  -F "is_pubblica=true" | head -c 200

# Stop log monitoring
kill $LOG_PID 2>/dev/null

echo ""
echo "🔍 DEBUG: Checking if the issue is in the middleware order..."
echo "The problem might be that express.json() is still being applied to FormData requests."
echo "Let me check the exact middleware configuration..." 