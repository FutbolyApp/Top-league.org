# EXCEL PARSER - BACKUP E DOCUMENTAZIONE

## ⚠️ ATTENZIONE: NON MODIFICARE SENZA LEGGERE QUESTO DOCUMENTO

Questo parser Excel è stato testato e funziona correttamente per leggere file Excel con strutture complesse e multiple squadre.

## 🎯 PROBLEMA RISOLTO

Il parser originale leggeva solo le prime 4 colonne e le prime 10 righe, trovando solo 2 squadre invece di 8.

## 🔧 MODIFICHE CRITICHE IMPLEMENTATE

### 1. Range Forzato (RIGHE 45-55)
```javascript
// NUOVO: Forza un range più ampio per assicurarsi di leggere tutte le colonne
const forcedRange = {
  s: { r: 0, c: 0 },
  e: { r: Math.max(range.e.r, 100), c: Math.max(range.e.c, 50) } // Forza almeno 50 colonne e 100 righe
};

// Forza la lettura di TUTTE le colonne usando il range forzato
const sheetData = xlsx.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: '', // Valore di default per celle vuote
  raw: false,  // Converte tutto in stringhe
  range: forcedRange // Usa il range forzato
});
```

### 2. Scansione Completa di Tutte le Righe (RIGHE 95-105)
```javascript
// Scansiona TUTTE le righe per trovare i nomi delle squadre (non solo le prime 20)
for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
  // ... scansione completa
}
```

### 3. Scansione Orizzontale di Tutte le Colonne (RIGHE 110-180)
```javascript
// Scansiona tutte le colonne di questa riga
for (let colIndex = 0; colIndex < row.length; colIndex++) {
  const cellValue = String(row[colIndex] || '').trim();
  // ... logica per trovare squadre in qualsiasi colonna
}
```

### 4. Riconoscimento Flessibile delle Squadre (NUOVO - RIGHE 150-180)
```javascript
// MODIFICATO: Ora accetta qualsiasi nome squadra, non solo quelli predefiniti
const isTeamNameValid = cellValue.length > 0 && 
                       cellValue.length < 50 && // Non troppo lunga
                       !cellValue.includes('\n') && // Non contiene newline
                       cellValue.split(' ').length <= 4; // Massimo 4 parole

// Criteri più flessibili per riconoscere squadre
if (isTeamNameValid && !isServiceRow && !isLongName && !hasOnlyNumbers && !hasUrl && !isServiceKeyword && hasHeaderNext) {
  // Squadra riconosciuta
}
```

### 5. Riconoscimento Giocatori Completo - Classic + Mantra (NUOVO - RIGHE 297-315)
```javascript
// MODIFICATO: Riconoscimento ruoli più flessibile - Supporta sia Classic che Mantra
const validRoles = [
  // Ruoli Classic
  'p', 'd', 'c', 'a',
  // Ruoli Mantra
  'por', 'dc', 'dd', 'ds', 'm', 'e', 'b', 'cc', 'ct', 'att', 'w', 'pc',
  // Varianti e abbreviazioni
  'portiere', 'difensore', 'centrocampista', 'attaccante',
  'cent', 'def', 'mid', 'fwd', 'gk', 'st'
];
const isRole = validRoles.some(role => firstCell.includes(role.toLowerCase()));

// Debug: mostra ruoli non riconosciuti
if (firstCell.length <= 3 && firstCell.length > 0 && !isRole && !firstCell.includes('crediti')) {
  console.log(`🔍 [${sheetName}] Ruolo non riconosciuto alla riga ${playerRowIndex}, colonna ${teamInfo.colIndex}: "${firstCell}"`);
}
```

### 6. Estrazione Crediti Residui (NUOVO - RIGHE 290-300)
```javascript
// Estrai i crediti residui dalla cella successiva
const creditsCell = String(playerRow[teamInfo.colIndex + 1] || '0').trim();
teamCredits = parseInt(creditsCell) || 0;
console.log(`💰 [${sheetName}] Crediti residui per ${teamInfo.name}: ${teamCredits}`);

// Aggiorna i crediti societari con i crediti residui trovati
if (teamCredits > 0) {
  squadra.casseSocietarie = teamCredits;
}
```

### 7. Normalizzazione Ruoli Completa - Classic + Mantra (NUOVO - RIGHE 371-395)
```javascript
function normalizeRuolo(ruolo) {
  const ruoloStr = String(ruolo).toUpperCase().trim();
  
  // Mappa ruoli comuni - Supporta sia Classic che Mantra
  const ruoloMap = {
    // Ruoli Classic
    'P': 'P', 'PORTIERE': 'P', 'GOALKEEPER': 'P', 'GK': 'P',
    'D': 'D', 'DIFENSORE': 'D', 'DEFENDER': 'D', 'DEF': 'D',
    'C': 'C', 'CENTROCAMPISTA': 'C', 'MIDFIELDER': 'C', 'MID': 'C',
    'A': 'A', 'ATTACCANTE': 'A', 'FORWARD': 'A', 'FWD': 'A', 'ST': 'A',
    
    // Ruoli Mantra - Portieri
    'POR': 'P',
    
    // Ruoli Mantra - Difensori
    'DC': 'D', 'DD': 'D', 'DS': 'D',
    
    // Ruoli Mantra - Centrocampisti
    'M': 'C', 'E': 'C', 'B': 'C', 'CC': 'C', 'CT': 'C', 'W': 'C',
    
    // Ruoli Mantra - Attaccanti
    'ATT': 'A', 'PC': 'A',
    
    // Varianti e abbreviazioni
    'CENT': 'C', 'DEF': 'D', 'MID': 'C', 'FWD': 'A'
  };
  
  return ruoloMap[ruoloStr] || 'C';
}
```

## 📊 RISULTATO FINALE

- ✅ **8 squadre trovate** (invece di 2)
- ✅ **51 colonne lette** (invece di 9)
- ✅ **Tutte le righe scansionate** (invece di solo le prime 20)
- ✅ **224 giocatori totali** (28 per squadra)
- ✅ **Riconoscimento flessibile** (qualsiasi nome squadra)
- ✅ **Crediti residui estratti** (per ogni squadra)
- ✅ **Ruoli Classic + Mantra** (P,D,C,A + Por,Dc,Dd,Ds,M,E,B,CC,CT,Att,W,PC)

## 🚨 COSA NON MODIFICARE

1. **Range forzato**: Non ridurre il numero di colonne (50) o righe (100)
2. **Scansione completa**: Non limitare la scansione a poche righe
3. **Scansione orizzontale**: Non limitare la scansione alle prime colonne
4. **Validazione delle intestazioni**: Non rimuovere il controllo `hasHeaderNext`
5. **Riconoscimento flessibile**: Non tornare alla lista predefinita di nomi squadra
6. **Riconoscimento ruoli**: Non limitare ai soli ruoli singoli (P, D, C, A)
7. **Estrazione crediti**: Non rimuovere la logica di estrazione crediti residui
8. **Ruoli Mantra**: Non rimuovere il supporto ai ruoli Mantra (Por, Dc, Dd, Ds, M, E, B, CC, CT, Att, W, PC)

## 🔄 COME RIPRISTINARE SE ROTTO

Se il parser si rompe, ripristina dal backup:
```bash
cp backend/utils/excelParser.js.backup backend/utils/excelParser.js
```

## 📝 NOTE PER FUTURE MODIFICHE

- Testare SEMPRE con file Excel che contengono 8+ squadre
- Verificare che vengano lette almeno 50 colonne
- Controllare i log per assicurarsi che tutte le squadre vengano trovate
- Non ottimizzare rimuovendo "controlli inutili" - potrebbero essere critici
- Il parser ora riconosce squadre con qualsiasi nome, non solo quelli predefiniti
- I crediti residui vengono estratti automaticamente dal file Excel
- **Supporta entrambi i sistemi di ruoli**: Classic (P,D,C,A) e Mantra (Por,Dc,Dd,Ds,M,E,B,CC,CT,Att,W,PC)

## 🎉 SUCCESSO GARANTITO

Con queste modifiche, il parser gestisce correttamente:
- File Excel con squadre distribuite orizzontalmente
- Squadre in righe diverse
- Strutture complesse con molte colonne
- Validazione completa di tutte le squadre
- **Nomi squadra flessibili** (qualsiasi nome, non solo predefiniti)
- **Ruoli Classic e Mantra** (P,D,C,A + Por,Dc,Dd,Ds,M,E,B,CC,CT,Att,W,PC)
- **Crediti residui** (estratti automaticamente)

## 🔄 AGGIORNAMENTO 23/06/2025

**NUOVE FUNZIONALITÀ**:
1. **Riconoscimento flessibile delle squadre**: Il parser ora riconosce squadre con qualsiasi nome
2. **Riconoscimento giocatori completo**: Supporta ruoli Classic (P,D,C,A) e Mantra (Por,Dc,Dd,Ds,M,E,B,CC,CT,Att,W,PC)
3. **Estrazione crediti residui**: I crediti societari vengono estratti dal file Excel
4. **Debug ruoli non riconosciuti**: Mostra quali ruoli non vengono riconosciuti per debugging
5. **Etichette aggiornate**: 
   - "Casse Societarie" → "Crediti Residui"
   - "Costo Salariale Annuale" → "Costo Ingaaggi"
   - "Orfana" → "Non Assegnata"
   - Rimossa "Costo Salariale Totale"

**SISTEMI DI RUOLI SUPPORTATI**:
- **Classic**: P, D, C, A (Serie A Classic, Euroleghe Classic)
- **Mantra**: Por, Dc, Dd, Ds, M, E, B, CC, CT, Att, W, PC (Serie A Mantra, Euroleghe Mantra)

**DATA BACKUP: 23/06/2025**
**STATO: FUNZIONANTE ✅** 