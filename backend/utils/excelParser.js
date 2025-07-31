import ExcelJS from 'exceljs';
import fs from 'fs';

/**
 * Parser per file Excel delle rose (Classic/Mantra)
 * Gestisce il formato specifico con tabelle multiple per squadra
 * Ogni tabella inizia con il nome della squadra, ha intestazioni Ruolo/Calciatore/Squadra/Costo
 * e termina con "Crediti Residui"
 */
export async function parseSquadreFromExcel(filePath, validationParams = {}) {
  try {
    console.log('Inizio parsing Excel:', filePath);
    console.log('Parametri di validazione:', validationParams);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    console.log('📋 Fogli disponibili nel file:', workbook.worksheets.map(ws => ws.name));
    
    let allSquadre = [];
    
    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name;
      console.log(`📄 Processando foglio: ${sheetName}`);
      
      if (!worksheet) {
        console.log(`⚠️ Foglio ${sheetName} vuoto, salto`);
        continue;
      }
      
      // Converti il foglio in array di righe
      const sheetData = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData = [];
        row.eachCell((cell, colNumber) => {
          rowData[colNumber - 1] = cell.value || '';
        });
        sheetData.push(rowData);
      });
      
      console.log(`📊 Foglio ${sheetName}: ${sheetData.length} righe, ${sheetData[0] ? sheetData[0].length : 0} colonne`);
      
      if (sheetData.length < 2) {
        console.log(`⚠️ Foglio ${sheetName} troppo piccolo, salto`);
        continue;
      }
      
      const sheetSquadre = parseSquadreFromSheet(sheetData, sheetName);
      console.log(`✅ Foglio ${sheetName}: trovate ${sheetSquadre.length} squadre`);
      
      allSquadre = allSquadre.concat(sheetSquadre);
    }
    
    console.log(`📈 TOTALE squadre trovate in tutti i fogli: ${allSquadre.length}`);
    
    // Rimuovi duplicati basati sul nome della squadra
    const uniqueSquadre = [];
    const seenNames = new Set();
    
    for (const squadra of allSquadre) {
      const normalizedName = squadra.nome.toLowerCase().trim();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueSquadre.push(squadra);
      } else {
        console.log(`⚠️ Squadra duplicata rimossa: ${squadra.nome}`);
      }
    }
    
    console.log(`🎯 Squadre uniche trovate: ${uniqueSquadre.length}`);
    
    // Validazione finale
    validateSquadreData(uniqueSquadre, validationParams);
    
    return uniqueSquadre;
  } catch (error) {
    console.error('Errore nel parsing Excel:', error);
    throw new Error(`Errore nel parsing del file Excel: ${error.message}`);
  }
}

function parseSquadreFromSheet(data, sheetName) {
  const squadre = [];
  
  console.log(`🔍 [${sheetName}] Parsing struttura: colonna E divisore, 2 squadre per riga (A-D e F-I)`);
  console.log(`🔍 [${sheetName}] Dimensione dati: ${data.length} righe`);
  
  // Lista di parole da escludere dal riconoscimento nomi squadra
  const excludeWords = [
    'ruolo', 'calciatore', 'squadra', 'costo', 'crediti', 'residui', 'rose', 'lega', 
    'fantaleague', 'https', 'calciatori', 'download'
  ];
  
  // Cerca i nomi delle squadre in tutte le righe da 4 in poi
  for (let currentRow = 4; currentRow < data.length; currentRow++) {
    const row = data[currentRow];
    if (!row || row.length < 9) {
      console.log(`⚠️ [${sheetName}] Riga ${currentRow} saltata: row=${!!row}, length=${row?.length}`);
      continue;
    }
    
    // Estrai i nomi delle due squadre (colonne A-D e F-I)
    const squadra1 = String(row[0] || '').trim();
    const squadra2 = String(row[5] || '').trim();
    
    // Valida i nomi delle squadre
    const squadra1Valida = isValidSquadraName(squadra1, excludeWords);
    const squadra2Valida = isValidSquadraName(squadra2, excludeWords);
    
    console.log(`🔍 [${sheetName}] Riga ${currentRow}: Squadra1="${squadra1}" (valida: ${squadra1Valida}), Squadra2="${squadra2}" (valida: ${squadra2Valida})`);
    
    // Processa la prima squadra se valida
    if (squadra1Valida) {
      console.log(`⚽ [${sheetName}] Processando squadra 1: ${squadra1}`);
      const squadra = processSquadraTable(data, currentRow, 0, squadra1, sheetName);
      if (squadra && squadra.giocatori.length > 0) {
        squadre.push(squadra);
        console.log(`✅ [${sheetName}] Squadra 1 aggiunta: ${squadra1} con ${squadra.giocatori.length} giocatori`);
      } else {
        console.log(`⚠️ [${sheetName}] Squadra 1 scartata: ${squadra1} (nessun giocatore trovato)`);
      }
    } else {
      console.log(`❌ [${sheetName}] Squadra 1 non valida: ${squadra1}`);
    }
    
    // Processa la seconda squadra se valida
    if (squadra2Valida) {
      console.log(`⚽ [${sheetName}] Processando squadra 2: ${squadra2}`);
      const squadra = processSquadraTable(data, currentRow, 5, squadra2, sheetName);
      if (squadra && squadra.giocatori.length > 0) {
        squadre.push(squadra);
        console.log(`✅ [${sheetName}] Squadra 2 aggiunta: ${squadra2} con ${squadra.giocatori.length} giocatori`);
      } else {
        console.log(`⚠️ [${sheetName}] Squadra 2 scartata: ${squadra2} (nessun giocatore trovato)`);
      }
    } else {
      console.log(`❌ [${sheetName}] Squadra 2 non valida: ${squadra2}`);
    }
  }
  
  console.log(`📊 [${sheetName}] Totale squadre processate: ${squadre.length}`);
  return squadre;
}

function isValidSquadraName(nome, excludeWords) {
  if (!nome || nome.length < 3) {
    console.log(`🔍 isValidSquadraName: "${nome}" - troppo corto o vuoto`);
    return false;
  }
  
  const nomeLower = nome.toLowerCase();
  
  // Controlla se contiene parole da escludere
  if (excludeWords && excludeWords.some(word => nomeLower.includes(word.toLowerCase()))) {
    console.log(`🔍 isValidSquadraName: "${nome}" - contiene parola esclusa`);
    return false;
  }
  
  // Controlla se contiene parole chiave che indicano che non è una squadra
  if (nomeLower.includes('crediti') || nomeLower.includes('residui')) {
    console.log(`🔍 isValidSquadraName: "${nome}" - contiene crediti/residui`);
    return false;
  }
  
  console.log(`✅ isValidSquadraName: "${nome}" - VALIDO`);
  return true;
}

function processSquadraTable(data, startRow, startCol, nomeSquadra, sheetName) {
  console.log(`⚽ [${sheetName}] Processando squadra: ${nomeSquadra} (colonne ${startCol}-${startCol+3})`);
  
  const squadra = {
    nome: nomeSquadra,
    giocatori: [],
    casseSocietarie: 1,
    valoreRosa: 0
  };
  
  let currentRow = startRow + 1;
  let foundHeaders = false;
  let foundCreditiResidui = false;
  let playerCount = 0;
  
  console.log(`🔍 [${sheetName}] Inizio parsing squadra ${nomeSquadra} dalla riga ${currentRow}`);
  
  while (currentRow < data.length) {
    const row = data[currentRow];
    if (!row) {
      console.log(`🔍 [${sheetName}] Riga ${currentRow} vuota, salto`);
      currentRow++;
      continue;
    }
    
    // Controlla se è la fine della squadra
    const firstCell = String(row[startCol] || '').trim();
    const secondCell = String(row[startCol + 1] || '').trim();
    
    console.log(`🔍 [${sheetName}] Riga ${currentRow}: firstCell="${firstCell}", secondCell="${secondCell}"`);
    
    // Se troviamo "Crediti Residui", è la fine della squadra
    if (firstCell.toLowerCase().includes('crediti residui')) {
      console.log(`💰 [${sheetName}] Crediti residui trovati per ${nomeSquadra} alla riga ${currentRow}`);
      
      // Estrai il valore numerico dai crediti residui
      const creditiMatch = firstCell.match(/crediti residui:\s*(\d+)/i);
      if (creditiMatch && creditiMatch[1]) {
        const creditiValue = parseInt(creditiMatch[1]);
        squadra.casseSocietarie = creditiValue;
        console.log(`💰 [${sheetName}] Crediti residui estratti per ${nomeSquadra}: ${creditiValue}`);
      } else {
        console.log(`⚠️ [${sheetName}] Impossibile estrarre crediti residui da: "${firstCell}"`);
      }
      
      foundCreditiResidui = true;
      // Continua a leggere per trovare la riga vuota finale
    }
    
    // Se abbiamo già trovato "Crediti Residui" e ora troviamo una riga vuota, fermiamoci
    if (foundCreditiResidui && firstCell === '' && secondCell === '') {
      console.log(`💰 [${sheetName}] Fine squadra ${nomeSquadra} alla riga ${currentRow} (riga vuota dopo crediti)`);
      break;
    }
    
    // Se troviamo un nuovo nome squadra (che non è un ruolo), fermiamoci
    if (firstCell.length > 3 && !firstCell.toLowerCase().includes('ruolo') && 
        !firstCell.toLowerCase().includes('crediti') && !firstCell.toLowerCase().includes('residui') &&
        !['p', 'por', 'd', 'dd', 'dc', 'ds', 'e', 'c', 'm', 't', 'w', 'a', 'pc', 'b'].includes(firstCell.toLowerCase()) &&
        !firstCell.includes(';')) {
      console.log(`💰 [${sheetName}] Fine squadra ${nomeSquadra} alla riga ${currentRow} (nuovo nome squadra: ${firstCell})`);
      break;
    }
    
    // Controlla se sono le intestazioni
    if (!foundHeaders) {
      const ruoloCell = String(row[startCol] || '').toLowerCase().trim();
      const calciatoreCell = String(row[startCol + 1] || '').toLowerCase().trim();
      const squadraCell = String(row[startCol + 2] || '').toLowerCase().trim();
      const costoCell = String(row[startCol + 3] || '').toLowerCase().trim();
      
      console.log(`🔍 [${sheetName}] Controllo intestazioni riga ${currentRow}: ruolo="${ruoloCell}", calciatore="${calciatoreCell}", squadra="${squadraCell}", costo="${costoCell}"`);
      
      if (ruoloCell.includes('ruolo') && calciatoreCell.includes('calciatore') && 
          squadraCell.includes('squadra') && costoCell.includes('costo')) {
        console.log(`📋 [${sheetName}] Intestazioni trovate per ${nomeSquadra} alla riga ${currentRow}`);
        foundHeaders = true;
        currentRow++;
        continue;
      }
    }
    
    // Se abbiamo trovato le intestazioni, processa i giocatori
    if (foundHeaders) {
      const validRoles = ['p', 'por', 'd', 'dd', 'dc', 'ds', 'e', 'c', 'm', 't', 'w', 'a', 'pc', 'b'];
      
      // Controlla se il ruolo è valido (singolo o combinazione)
      const isRoleValid = (role) => {
        const roleLower = role.toLowerCase().trim();
        
        // Se è un ruolo singolo, controlla se è nella lista
        if (validRoles.includes(roleLower)) {
          return true;
        }
        
        // Se contiene semicoloni, controlla se tutte le parti sono ruoli validi
        if (roleLower.includes(';')) {
          const parts = roleLower.split(';').map(part => part.trim());
          return parts.length > 1 && parts.every(part => validRoles.includes(part));
        }
        
        return false;
      };
      
      console.log(`🔍 [${sheetName}] Controllo giocatore riga ${currentRow}: firstCell="${firstCell}", isRoleValid=${isRoleValid(firstCell)}, row.length=${row.length}`);
      
      if (isRoleValid(firstCell) && row.length >= startCol + 4) {
        // Estrai dati giocatore
        const playerData = {
          ruolo: String(row[startCol] || '').trim(),
          nome: String(row[startCol + 1] || '').trim(),
          squadra: String(row[startCol + 2] || '').trim(),
          costo: String(row[startCol + 3] || '0').trim()
        };
        
        console.log(`🔍 [${sheetName}] Dati giocatore riga ${currentRow}: ruolo="${playerData.ruolo}", nome="${playerData.nome}", squadra="${playerData.squadra}", costo="${playerData.costo}"`);
        
        if (playerData.nome && playerData.nome.length > 0 && 
            !playerData.nome.toLowerCase().includes('crediti') && 
            !playerData.nome.toLowerCase().includes('residui')) {
          
          const player = {
            nome: playerData.nome,
            cognome: '', // Cognome non disponibile nella struttura attuale
            ruolo: playerData.ruolo, // NON normalizzare - usa il ruolo originale
            squadra: playerData.squadra,
            costo: parseInt(playerData.costo) || 0
          };
          
          squadra.giocatori.push(player);
          squadra.valoreRosa += player.costo;
          playerCount++;
          console.log(`⚽ [${sheetName}] Giocatore aggiunto a ${nomeSquadra}: ${player.nome} (${player.ruolo}) - Costo: ${player.costo} - Totale giocatori: ${playerCount}`);
        } else {
          console.log(`⚠️ [${sheetName}] Giocatore scartato riga ${currentRow}: nome vuoto o contiene parole chiave`);
        }
      } else {
        console.log(`⚠️ [${sheetName}] Riga ${currentRow} non è un giocatore valido: firstCell="${firstCell}", isRoleValid=${isRoleValid(firstCell)}, row.length=${row.length}`);
        
        // Debug aggiuntivo per capire perché non è valido
        if (firstCell && firstCell.length > 0) {
          console.log(`🔍 [${sheetName}] Debug firstCell: "${firstCell}", length: ${firstCell.length}, contains role: ${validRoles.some(role => firstCell.toLowerCase().includes(role))}`);
        }
      }
    } else {
      console.log(`🔍 [${sheetName}] Intestazioni non ancora trovate alla riga ${currentRow}`);
    }
    
    currentRow++;
  }
  
  console.log(`✅ [${sheetName}] Squadra ${nomeSquadra} completata con ${squadra.giocatori.length} giocatori, crediti: ${squadra.casseSocietarie}`);
  return squadra;
}

function validateSquadreData(squadre, validationParams = {}) {
  if (!squadre || squadre.length === 0) {
    throw new Error('Nessuna squadra trovata nel file Excel');
  }
  
  const expectedTeams = validationParams.numeroSquadre || 0;
  const minPlayers = validationParams.minGiocatori || 0;
  const maxPlayers = validationParams.maxGiocatori || 0;
  
  console.log(`🔍 Validazione: ${squadre.length} squadre trovate, ${expectedTeams} attese`);
  
  if (expectedTeams > 0 && squadre.length !== expectedTeams) {
    console.warn(`⚠️ Attenzione: trovate ${squadre.length} squadre, ma ne erano attese ${expectedTeams}`);
  }
  
  for (const squadra of squadre) {
    if (!squadra.nome) {
      throw new Error('Nome squadra mancante');
    }
    
    if (!Array.isArray(squadra.giocatori)) {
      squadra.giocatori = [];
    }
    
    if (minPlayers > 0 && squadra.giocatori.length < minPlayers) {
      console.warn(`⚠️ Squadra ${squadra.nome}: ${squadra.giocatori.length} giocatori, minimo atteso ${minPlayers}`);
    }
    
    if (maxPlayers > 0 && squadra.giocatori.length > maxPlayers) {
      console.warn(`⚠️ Squadra ${squadra.nome}: ${squadra.giocatori.length} giocatori, massimo atteso ${maxPlayers}`);
    }
    
    if (squadra.giocatori.length === 0) {
      console.warn(`⚠️ Squadra ${squadra.nome} senza giocatori`);
    } else {
      console.log(`✅ Squadra ${squadra.nome}: ${squadra.giocatori.length} giocatori`);
    }
    
    for (const giocatore of squadra.giocatori) {
      if (!giocatore.nome) {
        throw new Error(`Giocatore senza nome nella squadra ${squadra.nome}`);
      }
      
      if (!giocatore.ruolo) {
        console.warn(`⚠️ Giocatore ${giocatore.nome} senza ruolo, impostato default`);
        giocatore.ruolo = 'C';
      }
      
      if (giocatore.costo === undefined || giocatore.costo === null) {
        console.warn(`⚠️ Giocatore ${giocatore.nome} senza costo, impostato 0`);
        giocatore.costo = 0;
      }
    }
  }
  
  console.log(`✅ Validazione completata: ${squadre.length} squadre valide`);
}

export function validateExcelFile(filePath) {
  try {
    const squadre = parseSquadreFromExcel(filePath);
    return {
      valid: true,
      squadre: squadre.length,
      giocatori: squadre.reduce((total, sq) => total + sq.giocatori.length, 0)
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Test da linea di comando: node utils/excelParser.js path/al/file.xlsx
if (process.argv[1] && process.argv[1].endsWith('excelParser.js') && process.argv[2]) {
  const filePath = process.argv[2];
  console.log('Test parsing Excel:', filePath);
  
  try {
    const result = parseSquadreFromExcel(filePath);
    console.log('Risultato parsing:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Errore:', error.message);
  }
}

// Funzione di debug per analizzare la struttura del file Excel
export async function debugExcelStructure(filePath) {
  try {
    console.log('🔍 Debug struttura Excel:', filePath);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('📋 Fogli disponibili:', workbook.worksheets.map(ws => ws.name));
    
    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name;
      console.log(`\n📄 Analisi foglio: ${sheetName}`);
      
      // Converti il foglio in array di righe
      const sheetData = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData = [];
        row.eachCell((cell, colNumber) => {
          rowData[colNumber - 1] = cell.value || '';
        });
        sheetData.push(rowData);
      });
      
      console.log(`📊 Righe totali: ${sheetData.length}`);
      
      // Analizza le prime 10 righe per capire la struttura
      for (let i = 0; i < Math.min(10, sheetData.length); i++) {
        const row = sheetData[i];
        console.log(`Riga ${i + 1}: [${row.slice(0, 10).map(cell => `"${cell}"`).join(', ')}]`);
      }
      
      // Cerca possibili nomi squadra nelle righe 4-10
      console.log('\n🔍 Ricerca nomi squadra nelle righe 4-10:');
      for (let i = 4; i < Math.min(11, sheetData.length); i++) {
        const row = sheetData[i];
        if (row && row.length >= 9) {
          const squadra1 = String(row[0] || '').trim();
          const squadra2 = String(row[5] || '').trim();
          console.log(`Riga ${i + 1}: Squadra1="${squadra1}", Squadra2="${squadra2}"`);
        }
      }
    }
  } catch (error) {
    console.error('Errore debug Excel:', error);
  }
}

