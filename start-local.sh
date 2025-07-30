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
