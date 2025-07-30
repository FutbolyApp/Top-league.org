#!/bin/bash

echo "🚀 SETUP SVILUPPO LOCALE TOPLEAGUED"
echo "======================================"

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

# 2. SETUP DATABASE LOCALE
echo "🗄️ Setup Database MariaDB locale..."

# Installa MariaDB se non presente
if ! command -v mysql &> /dev/null; then
    echo "📥 Installazione MariaDB..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install mariadb
        brew services start mariadb
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y mariadb-server
        sudo systemctl start mariadb
        sudo systemctl enable mariadb
    fi
fi

# 3. CONFIGURAZIONE DATABASE
echo "⚙️ Configurazione database..."

# Crea database e utente
mysql -u root -e "
CREATE DATABASE IF NOT EXISTS topleagued_local;
CREATE USER IF NOT EXISTS 'topleagued_user'@'localhost' IDENTIFIED BY 'topleagued_pass';
GRANT ALL PRIVILEGES ON topleagued_local.* TO 'topleagued_user'@'localhost';
FLUSH PRIVILEGES;
"

# 4. CONFIGURAZIONE BACKEND LOCALE
echo "🔧 Configurazione backend locale..."

# Crea file env locale
cat > backend/env.local << EOF
# Database Configuration
DB_HOST=localhost
DB_USER=topleagued_user
DB_PASSWORD=topleagued_pass
DB_NAME=topleagued_local
DB_PORT=3306

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

# 5. SETUP TABELLE DATABASE
echo "🗃️ Creazione tabelle database..."

# Esegui script SQL per creare le tabelle
mysql -u topleagued_user -ptopleagued_pass topleagued_local < backend/db/create_missing_tables.sql

# 6. CONFIGURAZIONE FRONTEND LOCALE
echo "🎨 Configurazione frontend locale..."

# Crea file .env per frontend
cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ENV=development
EOF

# 7. SCRIPT DI AVVIO
echo "🚀 Creazione script di avvio..."

cat > start-local.sh << 'EOF'
#!/bin/bash

echo "🚀 AVVIO SVILUPPO LOCALE TOPLEAGUED"
echo "===================================="

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
echo "🗄️ Database: localhost:3306"
echo ""
echo "Per fermare: Ctrl+C"

# Aspetta che i processi finiscano
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x start-local.sh

# 8. SCRIPT DI RESET DATABASE
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

# Ricrea tabelle
mysql -u topleagued_user -ptopleagued_pass topleagued_local < backend/db/create_missing_tables.sql

echo "✅ Database resettato!"
EOF

chmod +x reset-db.sh

# 9. VERIFICA INSTALLAZIONE
echo "✅ Verifica installazione..."

# Test connessione database
if mysql -u topleagued_user -ptopleagued_pass topleagued_local -e "SELECT 1;" &> /dev/null; then
    echo "✅ Database connesso!"
else
    echo "❌ Errore connessione database"
    exit 1
fi

echo ""
echo "🎉 SETUP COMPLETATO!"
echo "==================="
echo ""
echo "📋 COMANDI DISPONIBILI:"
echo "  ./start-local.sh     - Avvia sviluppo locale"
echo "  ./reset-db.sh        - Reset database"
echo "  cd frontend && npm start  - Solo frontend"
echo "  cd backend && npm run dev  - Solo backend"
echo ""
echo "🌐 URL:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:3001"
echo "  Database: localhost:3306"
echo ""
echo "👤 CREDENZIALI DEFAULT:"
echo "  Database: topleagued_user / topleagued_pass"
echo "  JWT Secret: your_local_jwt_secret_key_here"
echo ""
echo "🚀 Per iniziare: ./start-local.sh" 