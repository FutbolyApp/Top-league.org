# 🏆 TopLeague - Fantasy Football League Management System

TopLeague è un sistema completo per la gestione di leghe di fantacalcio con funzionalità avanzate di mercato, trasferimenti e gestione squadre.

## 🚀 Caratteristiche Principali

### 👥 Sistema di Ruoli
- **SuperAdmin**: Gestione globale del sistema
- **Admin**: Gestione della propria lega
- **SubAdmin**: Gestione delegata con approvazione Admin
- **Utente**: Gestione della propria squadra

### 🏆 Gestione Leghe
- Creazione leghe con modalità Serie A/Euroleghe (Classic/Mantra)
- Importazione squadre da file Excel
- Gestione regolamenti in PDF
- Sistema di password per leghe private
- Opzioni avanzate: Roster A/B, Cantera, Contratti, Triggers

### ⚽ Gestione Squadre e Giocatori
- Importazione automatica da Excel
- Gestione casse societarie e club level
- Sistema di contratti e prestiti
- Aggiornamento automatico quotazioni via scraping
- Gestione ruoli e valori giocatori

### 💰 Sistema di Mercato
- Proposte di trasferimento e prestito
- Sistema di offerte con approvazione Admin
- Gestione pagamenti futuri
- Log completo delle transazioni

### 📊 Dashboard e Analytics
- Dashboard personalizzate per ogni ruolo
- Statistiche avanzate
- Sistema di notifiche in tempo reale
- Log dettagliato di tutte le azioni

## 🛠️ Tecnologie Utilizzate

### Backend
- **Node.js** con Express.js
- **SQLite** per il database
- **JWT** per l'autenticazione
- **Multer** per upload file
- **XLSX** per parsing Excel
- **bcryptjs** per hash password

### Frontend
- **React.js** con Hooks
- **React Router** per la navigazione
- **Styled Components** per lo styling
- **Fetch API** per le chiamate HTTP

## 📦 Installazione

### Prerequisiti
- Node.js (versione 16 o superiore)
- npm o yarn

### Setup Backend
```bash
cd backend
npm install
npm start
```

### Setup Frontend
```bash
cd frontend
npm install
npm start
```

### Setup Database
```bash
cd backend
node db/init.js
node scripts/createSuperAdmin.js
```

## 🔧 Configurazione

### Credenziali SuperAdmin
- **Email**: admin@topleague.com
- **Password**: admin123

### Credenziali Test
- **Email**: mario@test.com / giulia@test.com
- **Password**: test123

## 📁 Struttura del Progetto

```
TopLeagueC/
├── backend/
│   ├── db/                  # Database e configurazione
│   ├── models/              # Modelli dati
│   ├── routes/              # API endpoints
│   ├── middleware/          # Middleware (auth, etc.)
│   ├── utils/               # Utility (Excel parser, etc.)
│   ├── uploads/             # File caricati
│   └── scripts/             # Script di setup
├── frontend/
│   ├── src/
│   │   ├── api/             # Chiamate API
│   │   ├── components/      # Componenti React
│   │   ├── pages/           # Pagine principali
│   │   └── styles/          # Stili
│   └── public/
└── README.md
```

## 🔌 API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente
- `POST /api/superadmin/login` - Login SuperAdmin

### Leghe
- `GET /api/leghe` - Lista leghe
- `POST /api/leghe` - Crea lega
- `GET /api/leghe/:id` - Dettagli lega
- `PUT /api/leghe/:id` - Modifica lega
- `DELETE /api/leghe/:id` - Elimina lega

### Squadre
- `GET /api/squadre` - Lista squadre
- `GET /api/squadre/:id` - Dettagli squadra
- `POST /api/squadre/join` - Unisciti a squadra
- `GET /api/squadre/lega/:id` - Squadre per lega

### Giocatori
- `GET /api/giocatori` - Lista giocatori
- `GET /api/giocatori/:id` - Dettagli giocatore
- `GET /api/giocatori/lega/:id` - Giocatori per lega

### Notifiche
- `GET /api/notifiche` - Lista notifiche
- `POST /api/notifiche/:id/accept` - Accetta notifica
- `POST /api/notifiche/:id/reject` - Rifiuta notifica

### SuperAdmin
- `GET /api/superadmin/stats` - Statistiche sistema
- `GET /api/superadmin/users` - Gestione utenti
- `GET /api/superadmin/leagues` - Gestione leghe
- `GET /api/superadmin/logs` - Log sistema

## 🎨 Design System

### Colori
- **Primario**: Arancio leggero (#ff8c42)
- **Secondario**: Blu (#2196F3)
- **Successo**: Verde (#4CAF50)
- **Errore**: Rosso (#f44336)
- **Avviso**: Giallo (#FF9800)

### Stile
- Design ispirato a iOS
- Bordi arrotondati
- Ombre sottili
- Animazioni fluide
- Layout responsive

## 📊 Funzionalità Avanzate

### Sistema di Scraping
- Aggiornamento automatico quotazioni
- Supporto per Serie A ed Euroleghe
- Modalità Classic e Mantra
- Cronjob giornaliero

### Gestione File Excel
- Importazione automatica squadre
- Parsing intelligente dati
- Validazione campi
- Export modifiche

### Sistema di Notifiche
- Notifiche in tempo reale
- Filtri avanzati
- Archiviazione automatica
- Storico completo

### Log e Audit
- Log dettagliato azioni
- Filtri per data/utente/azione
- Export CSV
- Tracciabilità completa

## 🔒 Sicurezza

- Autenticazione JWT
- Hash password bcrypt
- Validazione input
- Sanitizzazione dati
- Controllo accessi per ruolo

## 🚀 Deployment

### Backend (Render)
```yaml
# render.yaml
services:
  - type: web
    name: topleague-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
```

### Frontend (Vercel)
- Build automatico da GitHub
- Deploy preview per PR
- CDN globale

## 📝 Licenza

Questo progetto è sviluppato per uso interno.

## 🤝 Contributi

Per contribuire al progetto:
1. Fork del repository
2. Crea branch feature
3. Commit delle modifiche
4. Push al branch
5. Crea Pull Request

## 📞 Supporto

Per supporto tecnico o domande:
- Email: support@topleague.com
- Documentazione: [docs.topleague.com](https://docs.topleague.com)

---

**TopLeague** - Il futuro del fantacalcio è qui! 🏆⚽ 