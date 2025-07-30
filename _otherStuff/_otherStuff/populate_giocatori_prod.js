const mysql = require('mysql2/promise');

// Configurazione database di produzione
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '25QQj2Fh',
  database: 'topleague_prod'
};

// Giocatori di esempio per ogni squadra
const giocatoriEsempio = [
  // Portieri
  { nome: 'Alisson', cognome: 'Becker', ruolo: 'P', quotazione_attuale: 50, costo_attuale: 45, squadra_id: 1 },
  { nome: 'Ederson', cognome: 'Moraes', ruolo: 'P', quotazione_attuale: 48, costo_attuale: 42, squadra_id: 2 },
  { nome: 'Emiliano', cognome: 'Martinez', ruolo: 'P', quotazione_attuale: 45, costo_attuale: 40, squadra_id: 3 },
  { nome: 'Nick', cognome: 'Pope', ruolo: 'P', quotazione_attuale: 42, costo_attuale: 38, squadra_id: 4 },
  { nome: 'David', cognome: 'Raya', ruolo: 'P', quotazione_attuale: 40, costo_attuale: 35, squadra_id: 5 },
  { nome: 'Jordan', cognome: 'Pickford', ruolo: 'P', quotazione_attuale: 38, costo_attuale: 33, squadra_id: 6 },
  { nome: 'Robert', cognome: 'Sanchez', ruolo: 'P', quotazione_attuale: 35, costo_attuale: 30, squadra_id: 7 },
  { nome: 'Aaron', cognome: 'Ramsdale', ruolo: 'P', quotazione_attuale: 33, costo_attuale: 28, squadra_id: 8 },
  { nome: 'Guglielmo', cognome: 'Vicario', ruolo: 'P', quotazione_attuale: 30, costo_attuale: 25, squadra_id: 9 },
  { nome: 'Alphonse', cognome: 'Areola', ruolo: 'P', quotazione_attuale: 28, costo_attuale: 23, squadra_id: 10 },

  // Difensori
  { nome: 'Virgil', cognome: 'van Dijk', ruolo: 'D', quotazione_attuale: 55, costo_attuale: 50, squadra_id: 1 },
  { nome: 'Ruben', cognome: 'Dias', ruolo: 'D', quotazione_attuale: 52, costo_attuale: 48, squadra_id: 2 },
  { nome: 'William', cognome: 'Saliba', ruolo: 'D', quotazione_attuale: 50, costo_attuale: 45, squadra_id: 3 },
  { nome: 'John', cognome: 'Stones', ruolo: 'D', quotazione_attuale: 48, costo_attuale: 43, squadra_id: 4 },
  { nome: 'Kyle', cognome: 'Walker', ruolo: 'D', quotazione_attuale: 45, costo_attuale: 40, squadra_id: 5 },
  { nome: 'Trent', cognome: 'Alexander-Arnold', ruolo: 'D', quotazione_attuale: 42, costo_attuale: 38, squadra_id: 6 },
  { nome: 'Reece', cognome: 'James', ruolo: 'D', quotazione_attuale: 40, costo_attuale: 35, squadra_id: 7 },
  { nome: 'Ben', cognome: 'White', ruolo: 'D', quotazione_attuale: 38, costo_attuale: 33, squadra_id: 8 },
  { nome: 'Nathan', cognome: 'Ake', ruolo: 'D', quotazione_attuale: 35, costo_attuale: 30, squadra_id: 9 },
  { nome: 'Kieran', cognome: 'Trippier', ruolo: 'D', quotazione_attuale: 33, costo_attuale: 28, squadra_id: 10 },

  // Centrocampisti
  { nome: 'Kevin', cognome: 'De Bruyne', ruolo: 'C', quotazione_attuale: 60, costo_attuale: 55, squadra_id: 1 },
  { nome: 'Rodri', cognome: 'Hernandez', ruolo: 'C', quotazione_attuale: 58, costo_attuale: 53, squadra_id: 2 },
  { nome: 'Declan', cognome: 'Rice', ruolo: 'C', quotazione_attuale: 55, costo_attuale: 50, squadra_id: 3 },
  { nome: 'Martin', cognome: 'Odegaard', ruolo: 'C', quotazione_attuale: 52, costo_attuale: 48, squadra_id: 4 },
  { nome: 'Bruno', cognome: 'Fernandes', ruolo: 'C', quotazione_attuale: 50, costo_attuale: 45, squadra_id: 5 },
  { nome: 'Phil', cognome: 'Foden', ruolo: 'C', quotazione_attuale: 48, costo_attuale: 43, squadra_id: 6 },
  { nome: 'Bukayo', cognome: 'Saka', ruolo: 'C', quotazione_attuale: 45, costo_attuale: 40, squadra_id: 7 },
  { nome: 'Jude', cognome: 'Bellingham', ruolo: 'C', quotazione_attuale: 42, costo_attuale: 38, squadra_id: 8 },
  { nome: 'Enzo', cognome: 'Fernandez', ruolo: 'C', quotazione_attuale: 40, costo_attuale: 35, squadra_id: 9 },
  { nome: 'Moises', cognome: 'Caicedo', ruolo: 'C', quotazione_attuale: 38, costo_attuale: 33, squadra_id: 10 },

  // Attaccanti
  { nome: 'Erling', cognome: 'Haaland', ruolo: 'A', quotazione_attuale: 65, costo_attuale: 60, squadra_id: 1 },
  { nome: 'Harry', cognome: 'Kane', ruolo: 'A', quotazione_attuale: 62, costo_attuale: 58, squadra_id: 2 },
  { nome: 'Ollie', cognome: 'Watkins', ruolo: 'A', quotazione_attuale: 60, costo_attuale: 55, squadra_id: 3 },
  { nome: 'Dominic', cognome: 'Solanke', ruolo: 'A', quotazione_attuale: 58, costo_attuale: 53, squadra_id: 4 },
  { nome: 'Alexander', cognome: 'Isak', ruolo: 'A', quotazione_attuale: 55, costo_attuale: 50, squadra_id: 5 },
  { nome: 'Darwin', cognome: 'Nunez', ruolo: 'A', quotazione_attuale: 52, costo_attuale: 48, squadra_id: 6 },
  { nome: 'Nicolas', cognome: 'Jackson', ruolo: 'A', quotazione_attuale: 50, costo_attuale: 45, squadra_id: 7 },
  { nome: 'Rasmus', cognome: 'Hojlund', ruolo: 'A', quotazione_attuale: 48, costo_attuale: 43, squadra_id: 8 },
  { nome: 'Cole', cognome: 'Palmer', ruolo: 'A', quotazione_attuale: 45, costo_attuale: 40, squadra_id: 9 },
  { nome: 'Evan', cognome: 'Ferguson', ruolo: 'A', quotazione_attuale: 42, costo_attuale: 38, squadra_id: 10 }
];

async function populateGiocatori() {
  let connection;
  
  try {
    console.log('🔄 Connessione al database di produzione...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connesso al database topleague_prod');
    
    // Controlla se ci sono già giocatori
    const [existingCount] = await connection.execute('SELECT COUNT(*) as count FROM giocatori');
    console.log(`📊 Giocatori esistenti: ${existingCount[0].count}`);
    
    if (existingCount[0].count > 0) {
      console.log('⚠️ Il database contiene già giocatori. Vuoi continuare? (y/n)');
      // Per ora continuiamo sempre
    }
    
    // Inserisci i giocatori
    console.log('📝 Inserimento giocatori di esempio...');
    
    for (const giocatore of giocatoriEsempio) {
      const query = `
        INSERT INTO giocatori (
          nome, cognome, ruolo, quotazione_attuale, costo_attuale, 
          quotazione_iniziale, costo_iniziale, squadra_id, 
          data_creazione, data_modifica
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const values = [
        giocatore.nome,
        giocatore.cognome,
        giocatore.ruolo,
        giocatore.quotazione_attuale,
        giocatore.costo_attuale,
        giocatore.quotazione_attuale, // quotazione_iniziale = attuale
        giocatore.costo_attuale,      // costo_iniziale = attuale
        giocatore.squadra_id
      ];
      
      await connection.execute(query, values);
    }
    
    console.log(`✅ Inseriti ${giocatoriEsempio.length} giocatori`);
    
    // Verifica l'inserimento
    const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM giocatori');
    console.log(`📊 Giocatori totali nel database: ${finalCount[0].count}`);
    
    // Mostra distribuzione per squadra
    const [squadreStats] = await connection.execute(`
      SELECT squadra_id, COUNT(*) as giocatori_per_squadra 
      FROM giocatori 
      GROUP BY squadra_id 
      ORDER BY squadra_id
    `);
    
    console.log('📈 Distribuzione giocatori per squadra:');
    squadreStats.forEach(stat => {
      console.log(`   Squadra ${stat.squadra_id}: ${stat.giocatori_per_squadra} giocatori`);
    });
    
  } catch (error) {
    console.error('❌ Errore durante il popolamento:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connessione chiusa');
    }
  }
}

// Esegui lo script
populateGiocatori().then(() => {
  console.log('🎉 Popolamento completato!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Errore fatale:', error);
  process.exit(1);
}); 