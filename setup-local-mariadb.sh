#!/bin/bash

echo "🚀 SETUP SVILUPPO LOCALE TOPLEAGUED (MariaDB)"
echo "================================================"

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

# 2. CONFIGURAZIONE BACKEND LOCALE (MariaDB)
echo "🔧 Configurazione backend locale con MariaDB..."

# Crea file env locale con MariaDB
cat > backend/env.local << EOF
# Database Configuration (MariaDB)
DATABASE_URL=mysql://dbu3477698:TopLeague.1@db5018267668.hosting-data.io:3306/db5018267668

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

# 3. CONFIGURAZIONE FRONTEND LOCALE
echo "🎨 Configurazione frontend locale..."

# Crea file .env per frontend
cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_ENV=development
EOF

# 4. TEST CONNESSIONE DATABASE
echo "🗄️ Test connessione database..."

# Test connessione MariaDB
if mysql -h db5018267668.hosting-data.io -P 3306 -u dbu3477698 -pTopLeague.1 -e "SELECT 1;" 2>/dev/null; then
    echo "✅ Connessione database riuscita!"
else
    echo "❌ Errore connessione database"
    echo "🔍 Verifica:"
    echo "  - Host: db5018267668.hosting-data.io"
    echo "  - Port: 3306"
    echo "  - User: dbu3477698"
    echo "  - Password: TopLeague.1"
    exit 1
fi

# 5. SCRIPT DI AVVIO
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
echo "🗄️ Database: MariaDB (db5018267668.hosting-data.io)"
echo ""
echo "Per fermare: Ctrl+C"

# Aspetta che i processi finiscano
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x start-local.sh

# 6. SCRIPT DI TEST
echo "🧪 Creazione script di test..."

cat > test-local.sh << 'EOF'
#!/bin/bash

echo "🧪 TEST SVILUPPO LOCALE"
echo "========================"

# Test database
echo "🗄️ Test database..."
mysql -h db5018267668.hosting-data.io -P 3306 -u dbu3477698 -pTopLeague.1 -e "SELECT 1;" 2>/dev/null && echo "✅ Database connesso" || echo "❌ Database non raggiungibile"

# Test backend
echo "⚙️ Test backend..."
curl -s http://localhost:3001/api/health 2>/dev/null && echo "✅ Backend raggiungibile" || echo "❌ Backend non raggiungibile"

# Test frontend
echo "📱 Test frontend..."
curl -s http://localhost:3000 2>/dev/null | head -5 && echo "✅ Frontend raggiungibile" || echo "❌ Frontend non raggiungibile"

echo "✅ Test completato!"
EOF

chmod +x test-local.sh

# 7. SCRIPT DI RESET DATABASE
echo "🔄 Creazione script reset database..."

cat > reset-db.sh << 'EOF'
#!/bin/bash

echo "🔄 RESET DATABASE (ATTENZIONE!)"
echo "==============================="
echo "⚠️ Questo script cancellerà tutti i dati!"
echo ""

read -p "Sei sicuro? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Cancellazione dati..."
    
    # Lista tabelle da cancellare
    TABLES="utenti leghe squadre giocatori notifiche offerte contratti tornei log_operazioni"
    
    for table in $TABLES; do
        echo "🗑️ Cancellazione tabella: $table"
        mysql -h db5018267668.hosting-data.io -P 3306 -u dbu3477698 -pTopLeague.1 -e "DELETE FROM $table;" 2>/dev/null || echo "⚠️ Tabella $table non trovata o già vuota"
    done
    
    echo "✅ Database resettato!"
else
    echo "❌ Operazione annullata"
fi
EOF

chmod +x reset-db.sh

echo ""
echo "🎉 SETUP COMPLETATO!"
echo "==================="
echo ""
echo "📋 COMANDI DISPONIBILI:"
echo "  ./start-local.sh     - Avvia sviluppo locale"
echo "  ./reset-db.sh        - Reset database (ATTENZIONE!)"
echo "  ./test-local.sh      - Test servizi"
echo "  cd frontend && npm start  - Solo frontend"
echo "  cd backend && npm run dev  - Solo backend"
echo ""
echo "🌐 URL:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:3001"
echo "  Database: MariaDB (db5018267668.hosting-data.io)"
echo ""
echo "👤 CREDENZIALI DATABASE:"
echo "  Host: db5018267668.hosting-data.io"
echo "  Port: 3306"
echo "  User: dbu3477698"
echo "  Password: TopLeague.1"
echo ""
echo "🚀 Per iniziare: ./start-local.sh" 