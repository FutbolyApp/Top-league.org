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
