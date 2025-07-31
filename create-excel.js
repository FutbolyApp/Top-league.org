const XLSX = require('xlsx');

// Crea un file Excel valido per il test con il formato corretto
function createTestExcel() {
  console.log('📊 Creazione file Excel di test con formato corretto...');
  
  // Dati per le squadre nel formato corretto (2 squadre per riga)
  const squadreData = [
    ['', '', '', '', '', '', '', '', ''], // Riga 1 vuota
    ['', '', '', '', '', '', '', '', ''], // Riga 2 vuota
    ['', '', '', '', '', '', '', '', ''], // Riga 3 vuota
    ['Milan', '', '', '', '', 'Inter', '', '', ''], // Riga 4: NOMI DELLE SQUADRE
    ['Ruolo', 'Calciatore', 'Squadra', 'Costo', '', 'Ruolo', 'Calciatore', 'Squadra', 'Costo'], // Riga 5: HEADERS
    ['P', 'D. Maignan', 'Milan', 50, '', 'P', 'S. Handanovic', 'Inter', 50], // Riga 6: Giocatori
    ['D', 'T. Hernandez', 'Milan', 45, '', 'D', 'M. Skriniar', 'Inter', 45], // Riga 7: Giocatori
    ['D', 'F. Tomori', 'Milan', 40, '', 'D', 'A. Bastoni', 'Inter', 40], // Riga 8: Giocatori
    ['C', 'S. Tonali', 'Milan', 35, '', 'C', 'N. Barella', 'Inter', 35], // Riga 9: Giocatori
    ['A', 'O. Giroud', 'Milan', 30, '', 'A', 'L. Martinez', 'Inter', 30], // Riga 10: Giocatori
    ['Crediti Residui', '', '', 100, '', 'Crediti Residui', '', '', 100] // Riga 11: Fine squadre
  ];
  
  // Crea un workbook
  const workbook = XLSX.utils.book_new();
  
  // Crea un worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(squadreData);
  
  // Aggiungi il worksheet al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Squadre');
  
  // Scrivi il file
  XLSX.writeFile(workbook, 'test-squadre.xlsx');
  
  console.log('✅ File Excel creato: test-squadre.xlsx');
}

createTestExcel(); 