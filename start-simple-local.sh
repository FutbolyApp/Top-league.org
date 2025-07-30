#!/bin/bash

echo "🚀 AVVIO SEMPLICE SVILUPPO LOCALE TOPLEAGUED"
echo "=============================================="

# 1. CONFIGURAZIONE BACKEND SEMPLICE
echo "🔧 Configurazione backend..."

cat > backend/env.local << EOF
# Database Configuration (Semplice)
DATABASE_URL=mysql://root@localhost:3306/topleagued_test

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_local_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=debug
EOF

# 2. CONFIGURAZIONE FRONTEND
echo "🎨 Configurazione frontend..."

cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ENV=development
EOF

# 3. AVVIO BACKEND
echo "⚙️ Avvio backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Aspetta che il backend sia pronto
sleep 5

# 4. AVVIO FRONTEND
echo "📱 Avvio frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ SERVIZI AVVIATI!"
echo "=================="
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️ Backend: http://localhost:3001"
echo ""
echo "📋 NOTE:"
echo "- Il backend userà il database di fallback"
echo "- Le funzionalità potrebbero essere limitate"
echo "- Per database completo, configura MariaDB manualmente"
echo ""
echo "🛑 Per fermare: Ctrl+C"

# Aspetta che i processi finiscano
wait $BACKEND_PID $FRONTEND_PID 