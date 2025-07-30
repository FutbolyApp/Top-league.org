#!/bin/bash

SERVER="217.154.43.87"
USER="root"
PASSWORD="25QQj2Fh"
REMOTE_PATH="/var/www/top-league.org"

echo "🔧 Riparazione server TopLeague..."

# Funzione per eseguire comandi SSH
ssh_exec() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "$1"
}

echo "1️⃣ Controllo stato PM2..."
ssh_exec "pm2 status"

echo "2️⃣ Riavvio backend..."
ssh_exec "cd $REMOTE_PATH/backend && pm2 restart all"

echo "3️⃣ Attendo 10 secondi..."
sleep 10

echo "4️⃣ Controllo stato dopo riavvio..."
ssh_exec "pm2 status"

echo "5️⃣ Test connessione API..."
ssh_exec "curl -s http://localhost:3001/api/ping"

echo "6️⃣ Controllo log backend..."
ssh_exec "cd $REMOTE_PATH/backend && pm2 logs --lines 5"

echo "✅ Riparazione completata!"
echo "🌐 Testa ora: https://top-league.org" 