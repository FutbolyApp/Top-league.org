# Test Locale con PostgreSQL

Questo documento spiega come testare l'applicazione in locale con PostgreSQL per evitare errori in produzione.

## Prerequisiti

1. **Docker** (per PostgreSQL locale)
2. **Node.js** (già installato)

## Setup Database Locale

### 1. Avvia PostgreSQL con Docker

```bash
# Avvia il container PostgreSQL
docker-compose up -d postgres

# Verifica che sia attivo
docker ps
```

### 2. Testa la Connessione

```bash
# Testa il database locale
node backend/test-local-db.js
```

Dovresti vedere:
```
✅ Connessione al database riuscita!
✅ Tabella users creata
✅ Tabella leghe creata
✅ Tabella squadre creata
✅ Tabella giocatori creata
✅ Utente di test creato, ID: 1
✅ Lega di test creata, ID: 1
✅ Squadra di test creata, ID: 1
✅ Giocatore di test creato, ID: 1
🎉 Tutti i test sono passati!
```

### 3. Avvia il Backend Locale

```bash
# Avvia il server con database locale
node backend/start-local.js
```

Dovresti vedere:
```
🚀 Avviando server locale con PostgreSQL...
✅ Server locale avviato su http://localhost:3001
📊 Database: PostgreSQL locale
🔧 Modalità: Development
```

## Test delle Funzionalità

### Test API

```bash
# Test health check
curl http://localhost:3001/api/health

# Test creazione lega
curl -X POST http://localhost:3001/api/leghe/create \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test League","modalita":"serie_a"}'

# Test inserimento giocatore
curl -X POST http://localhost:3001/api/giocatori \
  -H "Content-Type: application/json" \
  -d '{"nome":"Mario","cognome":"Rossi","ruolo":"Attaccante","squadra_id":1}'
```

## Vantaggi del Test Locale

1. **Stesso Database**: PostgreSQL locale = PostgreSQL produzione
2. **Stessi Errori**: Se funziona in locale, funziona in produzione
3. **Debug Facile**: Log dettagliati e accesso diretto al database
4. **Sviluppo Veloce**: Nessun deploy per testare modifiche

## Troubleshooting

### Errore: "connection refused"
```bash
# Verifica che PostgreSQL sia attivo
docker ps | grep postgres

# Riavvia se necessario
docker-compose restart postgres
```

### Errore: "database does not exist"
```bash
# Ricrea il database
docker-compose down -v
docker-compose up -d postgres
node backend/test-local-db.js
```

### Errore: "column lega_id does not exist"
```bash
# Ricrea le tabelle
node backend/test-local-db.js
```

## Workflow Consigliato

1. **Sviluppa** → Modifica il codice
2. **Testa Locale** → `node backend/start-local.js`
3. **Verifica** → Testa tutte le funzionalità
4. **Deploy** → Solo se tutto funziona in locale

## Comandi Utili

```bash
# Avvia tutto
docker-compose up -d
node backend/start-local.js

# Ferma tutto
docker-compose down
pkill -f "node backend/start-local.js"

# Log database
docker-compose logs postgres

# Accesso diretto al database
docker exec -it topleague_postgres psql -U topleague_db_user -d topleague_db
```

## Configurazione Frontend

Per testare il frontend con il backend locale, modifica `frontend/src/api/config.js`:

```javascript
// Cambia da:
const API_BASE_URL = 'https://topleaguem.onrender.com/api';

// A:
const API_BASE_URL = 'http://localhost:3001/api';
```

Poi avvia il frontend:
```bash
cd frontend
npm start
```

Ora puoi testare l'intera applicazione in locale prima del deploy! 