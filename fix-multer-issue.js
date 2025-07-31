#!/bin/bash

echo "🔧 Fixing multer configuration issue..."

# Create the corrected multer configuration
cat > temp-multer-fix.js << 'EOF'
// Fix multer configuration
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer with better error handling
const upload = multer({ 
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB limit for fields
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', file.originalname, 'mimetype:', file.mimetype);
    
    // Accept Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

const uploadExcel = upload.single('excel');
EOF

# Create a patch for the leghe.js file
cat > temp-leghe-patch.js << 'EOF'
// Fix multer configuration in leghe.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer with better error handling and logging
const upload = multer({ 
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    fieldSize: 50 * 1024 * 1024, // 50MB limit for fields
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer processing file:', file.originalname, 'mimetype:', file.mimetype);
    
    // Accept Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      console.log('✅ File accepted by multer');
      cb(null, true);
    } else {
      console.log('❌ File rejected by multer - not an Excel file');
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

const uploadExcel = upload.single('excel');
const uploadPdf = upload.single('pdf');
EOF

# Upload the patch
echo "📤 Uploading multer fix..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no temp-leghe-patch.js root@top-league.org:/var/www/html/temp-multer-fix.js

# Apply the patch to leghe.js
echo "🔧 Applying multer fix to leghe.js..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && sed -i '16,25c\\' leghe.js && cat temp-multer-fix.js >> leghe.js && rm temp-multer-fix.js"

# Create uploads directory if it doesn't exist
echo "📁 Ensuring uploads directory exists..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "mkdir -p /var/www/html/uploads && chmod 755 /var/www/html/uploads"

# Restart the backend
echo "🔄 Restarting backend..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && pm2 restart topleague-backend"

# Test the endpoint
echo "🧪 Testing FormData with Excel file after multer fix..."
sleep 5

echo "✅ Testing with Excel file..."
curl -s -X POST https://www.top-league.org/api/leghe/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" \
  -F "nome=TestLega" \
  -F "modalita=Test" \
  -F "admin_id=1" \
  -F "is_pubblica=true" \
  -F "excel=@test_players.csv" | head -c 300

# Clean up
rm temp-multer-fix.js

echo "🎉 Multer fix completed!"
echo "📊 Now try creating a league on the website - it should work!" 