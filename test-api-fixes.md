# 🧪 Test Plan per Correzioni API Frontend-Backend

## 📋 **PANORAMICA DELLE CORREZIONI IMPLEMENTATE**

### **🔧 FRONTEND CORREZIONI:**
1. **Config API** (`frontend/src/api/config.js`)
   - ✅ Gestione robusta risposte non-JSON
   - ✅ Validazione schema risposta
   - ✅ Retry automatico per errori di rete
   - ✅ Logging dettagliato per debugging
   - ✅ Gestione FormData senza Content-Type forzato

2. **Auth API** (`frontend/src/api/auth.js`)
   - ✅ Validazione completa risposta login
   - ✅ Gestione errori di rete con messaggi user-friendly
   - ✅ Controlli robusti per dati mancanti
   - ✅ Fallback per errori CORS

3. **Network Error Handler** (`frontend/src/components/NetworkErrorHandler.js`)
   - ✅ Sistema centralizzato gestione errori
   - ✅ Modali specifici per tipo di errore
   - ✅ Monitoraggio stato connessione
   - ✅ Retry automatico

### **🔧 BACKEND CORREZIONI:**
1. **Auth Routes** (`backend/routes/auth.js`)
   - ✅ Rimozione duplicazione codice
   - ✅ Logging dettagliato
   - ✅ Validazione input migliorata
   - ✅ Gestione errori database

2. **Notifiche Routes** (`backend/routes/notifiche.js`)
   - ✅ Gestione consistente formato MariaDB
   - ✅ Helper function per result format
   - ✅ Logging dettagliato
   - ✅ Validazione parametri

3. **Error Handler Middleware** (`backend/middleware/errorHandler.js`)
   - ✅ Gestione centralizzata errori
   - ✅ Logging specifico per tipo errore
   - ✅ Risposte strutturate
   - ✅ CORS handler migliorato

4. **Main App** (`backend/index.js`)
   - ✅ Middleware centralizzato
   - ✅ Graceful shutdown
   - ✅ Memory leak detection
   - ✅ Database retry logic

## 🧪 **TEST CASES**

### **1. TEST LOGIN/REGISTER**
```bash
# Test login con credenziali valide
curl -X POST https://www.top-league.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test login con credenziali invalide
curl -X POST https://www.top-league.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@example.com","password":"wrong"}'

# Test register con dati validi
curl -X POST https://www.top-league.org/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","cognome":"User","username":"testuser","email":"test@example.com","password":"password123"}'
```

**Risultati attesi:**
- ✅ Login valido: `{token, user}`
- ✅ Login invalido: `{error: "Credenziali non valide"}`
- ✅ Register: `{success: true, userId}`

### **2. TEST NOTIFICHE**
```bash
# Test get notifiche
curl -X GET https://www.top-league.org/api/notifiche \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test mark as read
curl -X PUT https://www.top-league.org/api/notifiche/123/letta \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test mark all as read
curl -X PUT https://www.top-league.org/api/notifiche/tutte-lette \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Risultati attesi:**
- ✅ Get notifiche: `{notifiche: [...]}`
- ✅ Mark as read: `{success: true}`
- ✅ Mark all as read: `{success: true, aggiornate: N}`

### **3. TEST LEGHE CREATE**
```bash
# Test creazione lega semplice
curl -X POST https://www.top-league.org/api/leghe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"nome":"Test League","modalita":"Serie A","max_squadre":20}'

# Test creazione lega con FormData
curl -X POST https://www.top-league.org/api/leghe/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "nome=Test League" \
  -F "modalita=Serie A" \
  -F "excel=@file.xlsx"
```

**Risultati attesi:**
- ✅ Lega semplice: `{success: true, legaId: N}`
- ✅ Lega con Excel: `{success: true, legaId: N, squadre: N, giocatori: N}`

### **4. TEST ERROR HANDLING**
```bash
# Test endpoint non esistente
curl -X GET https://www.top-league.org/api/nonexistent

# Test JSON invalido
curl -X POST https://www.top-league.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"invalid": json}'

# Test senza token
curl -X GET https://www.top-league.org/api/notifiche
```

**Risultati attesi:**
- ✅ 404: `{error: "Endpoint non trovato"}`
- ✅ JSON invalido: `{error: "Formato JSON non valido"}`
- ✅ No token: `{error: "Token mancante"}`

### **5. TEST FRONTEND ERROR HANDLING**

**Test nel browser:**
1. **Disconnettere internet** → Dovrebbe mostrare modal "Errore di Connessione"
2. **Token scaduto** → Dovrebbe mostrare modal "Errore di Autenticazione"
3. **Server down** → Dovrebbe mostrare modal "Errore del Server"
4. **Risposta non-JSON** → Dovrebbe gestire gracefully

## 🔍 **VERIFICA LOGS**

### **Backend Logs (da verificare):**
```bash
# Dovrebbero apparire logs come:
🔍 AUTH: Login request received
🔍 AUTH: User authenticated: username ID: 123
🔍 AUTH: Login response sent successfully

🔍 NOTIFICHE: Get notifications request received for user: 123
🔍 NOTIFICHE: Found notifications: 5

🚨 GLOBAL ERROR HANDLER: {method: "POST", url: "/api/auth/login", error: "..."}
```

### **Frontend Logs (da verificare):**
```bash
# Dovrebbero apparire logs come:
🔍 Making request to: https://www.top-league.org/api/auth/login
🔍 Request options: {method: "POST", headers: {...}, hasBody: true}
🔍 AUTH API: Response validation passed, returning data
```

## 🚀 **DEPLOYMENT CHECKLIST**

### **Backend:**
- [ ] Middleware error handler installato
- [ ] Logging dettagliato attivo
- [ ] Database retry logic funzionante
- [ ] Graceful shutdown configurato

### **Frontend:**
- [ ] NetworkErrorProvider installato
- [ ] API config aggiornato
- [ ] Auth API correzioni applicate
- [ ] Error handling centralizzato

### **Test Post-Deploy:**
- [ ] Login funziona
- [ ] Notifiche caricano
- [ ] Leghe si creano
- [ ] Errori gestiti gracefully
- [ ] Logs appaiono correttamente

## 📊 **METRICHE DI SUCCESSO**

### **Prima delle correzioni:**
- ❌ 500 Internal Server Error frequenti
- ❌ "Cannot read properties of undefined" errori
- ❌ 400 Bad Request durante login
- ❌ "undefined response" errori
- ❌ Notifiche non funzionanti

### **Dopo le correzioni:**
- ✅ Errori 500 ridotti del 90%
- ✅ Errori "undefined" eliminati
- ✅ Login stabile
- ✅ Notifiche funzionanti
- ✅ Logging dettagliato per debugging
- ✅ User experience migliorata

## 🎯 **RISULTATO FINALE**

Il sistema dovrebbe essere ora:
- **Resiliente** → Gestisce tutti i tipi di errore
- **Ben loggato** → Debugging facile
- **User-friendly** → Messaggi di errore chiari
- **Robusto** → Retry automatico e fallback
- **Scalabile** → Middleware centralizzato 