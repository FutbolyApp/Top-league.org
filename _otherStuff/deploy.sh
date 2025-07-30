#!/bin/bash

# Configurazione
SERVER="217.154.43.87"
USER="root"
PASSWORD="25QQj2Fh"
REMOTE_PATH="/var/www/top-league.org"

echo "🚀 Deploy automatico su TopLeague Production"

# Funzione per eseguire comandi SSH
ssh_exec() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "$1"
}

# Deploy frontend
echo "📦 Deploy frontend..."
rsync -avz --delete ionos-deploy/frontend/ "$USER@$SERVER:$REMOTE_PATH/frontend/" --password-file <(echo "$PASSWORD")

# Deploy backend
echo "🔧 Deploy backend..."
rsync -avz --delete backend/ "$USER@$SERVER:$REMOTE_PATH/backend/" --exclude=node_modules --exclude=uploads --exclude=backups --exclude="playwright_profile_*" --exclude=puppeteer_profile --password-file <(echo "$PASSWORD")

# Installa dipendenze e riavvia
echo "⚙️ Installazione dipendenze e riavvio..."
ssh_exec "cd $REMOTE_PATH/backend && npm install && pm2 restart all"

echo "✅ Deploy completato!" 