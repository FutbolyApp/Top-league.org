#!/bin/bash

# Script di deployment per IONOS
# Questo script prepara l'applicazione per il deployment su IONOS

echo "🚀 Iniziando deployment per IONOS..."

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per stampare messaggi colorati
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Controlla se siamo nella directory corretta
if [ ! -f "package.json" ]; then
    print_error "Questo script deve essere eseguito dalla directory root del progetto"
    exit 1
fi

# Installa dipendenze
print_status "Installazione dipendenze..."
npm run install:all

if [ $? -ne 0 ]; then
    print_error "Errore durante l'installazione delle dipendenze"
    exit 1
fi

# Build del frontend
print_status "Building frontend..."
cd frontend
npm run build:ionos

if [ $? -ne 0 ]; then
    print_error "Errore durante il build del frontend"
    exit 1
fi

cd ..

# Crea directory per il deployment
DEPLOY_DIR="ionos-deploy"
print_status "Creazione directory di deployment: $DEPLOY_DIR"

if [ -d "$DEPLOY_DIR" ]; then
    rm -rf "$DEPLOY_DIR"
fi

mkdir -p "$DEPLOY_DIR"

# Copia file necessari per il backend
print_status "Copia file backend..."
cp -r backend "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp .htaccess "$DEPLOY_DIR/"

# Copia file statici del frontend
print_status "Copia file statici frontend..."
mkdir -p "$DEPLOY_DIR/frontend/build"
cp -r frontend/build/* "$DEPLOY_DIR/frontend/build/"

# Copia file di configurazione
if [ -f "env.local" ]; then
    cp env.local "$DEPLOY_DIR/"
    print_status "File env.local copiato"
else
    print_warning "File env.local non trovato. Assicurati di configurarlo sul server"
fi

# Crea file di avvio per IONOS
cat > "$DEPLOY_DIR/start.sh" << 'EOF'
#!/bin/bash
echo "Avvio applicazione TopLeague su IONOS..."
cd backend
npm install --production
node index.js
EOF

chmod +x "$DEPLOY_DIR/start.sh"

# Crea file di configurazione per IONOS
cat > "$DEPLOY_DIR/ionos-config.json" << 'EOF'
{
  "name": "topleague-ionos",
  "version": "1.0.0",
  "description": "TopLeague Fantasy Football Management App - IONOS Deployment",
  "main": "backend/index.js",
  "scripts": {
    "start": "cd backend && node index.js",
    "install": "cd backend && npm install --production"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

# Crea README per il deployment
cat > "$DEPLOY_DIR/README-IONOS.md" << 'EOF'
# TopLeague - Deployment IONOS

## Configurazione

1. **Database**: Configura la variabile d'ambiente `DATABASE_URL` nel pannello di controllo IONOS
2. **Porta**: L'applicazione utilizzerà la porta 3001 per il backend
3. **File statici**: Il frontend React è già buildato e servito dal backend

## Struttura file

- `backend/` - Server Node.js/Express
- `frontend/build/` - File statici React (già buildati)
- `.htaccess` - Configurazione Apache per routing
- `start.sh` - Script di avvio
- `env.local` - Variabili d'ambiente (da configurare)

## Variabili d'ambiente necessarie

- `DATABASE_URL` - URL del database PostgreSQL
- `PORT` - Porta del server (default: 3001)
- `JWT_SECRET` - Chiave segreta per JWT (opzionale)

## Avvio

```bash
chmod +x start.sh
./start.sh
```

## Note

- L'applicazione serve sia l'API che i file statici del frontend
- Il routing React è gestito dal backend Express
- Tutte le richieste API sono sotto `/api/*`
EOF

print_status "✅ Deployment package creato in: $DEPLOY_DIR"
print_status "📦 Contenuto del package:"
ls -la "$DEPLOY_DIR"

print_status "📋 Prossimi passi:"
echo "1. Carica il contenuto di '$DEPLOY_DIR' sul server IONOS"
echo "2. Configura le variabili d'ambiente nel pannello di controllo IONOS"
echo "3. Assicurati che Node.js 18+ sia installato sul server"
echo "4. Esegui 'npm install' e poi 'npm start' nella directory del progetto"

print_status "🎉 Deployment package pronto!" 