#!/bin/bash

echo "🚀 SETUP SVILUPPO LOCALE TOPLEAGUED (MariaDB Locale)"
echo "======================================================"

# 1. INSTALLAZIONE DEPENDENCIES
echo "📦 Installazione dependencies..."

# Frontend
echo "📱 Setup Frontend..."
cd frontend
npm install
cd ..

# Backend
echo "⚙️ Setup Backend..."
cd backend
npm install
cd ..

# 2. SETUP MARIADB LOCALE
echo "🗄️ Setup MariaDB locale..."

# Avvia MariaDB se non attivo
if ! brew services list | grep mariadb | grep started > /dev/null; then
    echo "🚀 Avvio MariaDB..."
    brew services start mariadb
    sleep 3
fi

# 3. CONFIGURAZIONE DATABASE LOCALE
echo "⚙️ Configurazione database locale..."

# Crea database e utente locale
mysql -u root -e "
CREATE DATABASE IF NOT EXISTS topleagued_local;
CREATE USER IF NOT EXISTS 'topleagued_user'@'localhost' IDENTIFIED BY 'topleagued_pass';
GRANT ALL PRIVILEGES ON topleagued_local.* TO 'topleagued_user'@'localhost';
FLUSH PRIVILEGES;
" 2>/dev/null || echo "⚠️ Errore configurazione database (potrebbe essere già configurato)"

# 4. CONFIGURAZIONE BACKEND LOCALE
echo "🔧 Configurazione backend locale..."

# Crea file env locale con MariaDB locale
cat > backend/env.local << EOF
# Database Configuration (MariaDB Locale)
DATABASE_URL=mysql://topleagued_user:topleagued_pass@localhost:3306/topleagued_local

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

# 5. CONFIGURAZIONE FRONTEND LOCALE
echo "🎨 Configurazione frontend locale..."

# Crea file .env per frontend
cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ENV=development
EOF

# 6. TEST CONNESSIONE DATABASE
echo "🗄️ Test connessione database..."

# Test connessione MariaDB locale
if mysql -u topleagued_user -ptopleagued_pass topleagued_local -e "SELECT 1;" 2>/dev/null; then
    echo "✅ Connessione database locale riuscita!"
else
    echo "❌ Errore connessione database locale"
    echo "🔍 Tentativo configurazione manuale..."
    
    # Prova configurazione manuale
    mysql -u root -e "
    DROP DATABASE IF EXISTS topleagued_local;
    CREATE DATABASE topleagued_local;
    DROP USER IF EXISTS 'topleagued_user'@'localhost';
    CREATE USER 'topleagued_user'@'localhost' IDENTIFIED BY 'topleagued_pass';
    GRANT ALL PRIVILEGES ON topleagued_local.* TO 'topleagued_user'@'localhost';
    FLUSH PRIVILEGES;
    "
    
    # Test di nuovo
    if mysql -u topleagued_user -ptopleagued_pass topleagued_local -e "SELECT 1;" 2>/dev/null; then
        echo "✅ Connessione database locale riuscita!"
    else
        echo "❌ Impossibile configurare database locale"
        exit 1
    fi
fi

# 7. SCRIPT DI AVVIO
echo "🚀 Creazione script di avvio..."

cat > start-local.sh << 'EOF'
#!/bin/bash

echo "🚀 AVVIO SVILUPPO LOCALE TOPLEAGUED"
echo "===================================="

# Avvia MariaDB se non attivo
if ! brew services list | grep mariadb | grep started > /dev/null; then
    echo "🚀 Avvio MariaDB..."
    brew services start mariadb
    sleep 3
fi

# Avvia backend
echo "⚙️ Avvio backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Aspetta che il backend sia pronto
sleep 5

# Avvia frontend
echo "📱 Avvio frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ Servizi avviati!"
echo "🌐 Frontend: http://localhost:3000"
echo "⚙️ Backend: http://localhost:3001"
echo "🗄️ Database: MariaDB locale (localhost:3306)"
echo ""
echo "Per fermare: Ctrl+C"

# Aspetta che i processi finiscano
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x start-local.sh

# 8. SCRIPT DI TEST
echo "🧪 Creazione script di test..."

cat > test-local.sh << 'EOF'
#!/bin/bash

echo "🧪 TEST SVILUPPO LOCALE"
echo "========================"

# Test database
echo "🗄️ Test database..."
mysql -u topleagued_user -ptopleagued_pass topleagued_local -e "SELECT 1;" 2>/dev/null && echo "✅ Database connesso" || echo "❌ Database non raggiungibile"

# Test backend
echo "⚙️ Test backend..."
curl -s http://localhost:3001/api/health 2>/dev/null && echo "✅ Backend raggiungibile" || echo "❌ Backend non raggiungibile"

# Test frontend
echo "📱 Test frontend..."
curl -s http://localhost:3000 2>/dev/null | head -5 && echo "✅ Frontend raggiungibile" || echo "❌ Frontend non raggiungibile"

echo "✅ Test completato!"
EOF

chmod +x test-local.sh

# 9. SCRIPT DI RESET DATABASE
echo "🔄 Creazione script reset database..."

cat > reset-db.sh << 'EOF'
#!/bin/bash

echo "🔄 RESET DATABASE LOCALE"
echo "========================"

# Drop e ricrea database
mysql -u root -e "
DROP DATABASE IF EXISTS topleagued_local;
CREATE DATABASE topleagued_local;
GRANT ALL PRIVILEGES ON topleagued_local.* TO 'topleagued_user'@'localhost';
FLUSH PRIVILEGES;
"

echo "✅ Database resettato!"
echo "🗄️ Nuovo database pronto per l'uso"
EOF

chmod +x reset-db.sh

echo ""
echo "🎉 SETUP COMPLETATO!"
echo "==================="
echo ""
echo "📋 COMANDI DISPONIBILI:"
echo "  ./start-local.sh     - Avvia sviluppo locale"
echo "  ./reset-db.sh        - Reset database"
echo "  ./test-local.sh      - Test servizi"
echo "  cd frontend && npm start  - Solo frontend"
echo "  cd backend && npm run dev  - Solo backend"
echo ""
echo "🌐 URL:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:3001"
echo "  Database: MariaDB locale (localhost:3306)"
echo ""
echo "👤 CREDENZIALI DATABASE LOCALE:"
echo "  Host: localhost"
echo "  Port: 3306"
echo "  User: topleagued_user"
echo "  Password: topleagued_pass"
echo "  Database: topleagued_local"
echo ""
echo "🚀 Per iniziare: ./start-local.sh" 