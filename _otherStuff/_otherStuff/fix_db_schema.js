import mysql from 'mysql2/promise';

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...');
    
    // Connect to the database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'topleague',
      password: 'topleague123',
      database: 'topleague_prod'
    });
    
    console.log('✅ Connected to database');
    
    // Add missing columns to leghe table
    const legheColumns = [
      'modalita VARCHAR(50) NOT NULL DEFAULT "Classic Serie A"',
      'is_pubblica BOOLEAN NOT NULL DEFAULT FALSE',
      'password VARCHAR(255)',
      'max_squadre INT',
      'min_giocatori INT',
      'max_giocatori INT',
      'roster_ab BOOLEAN DEFAULT FALSE',
      'cantera BOOLEAN DEFAULT FALSE',
      'contratti BOOLEAN DEFAULT FALSE',
      'triggers BOOLEAN DEFAULT FALSE',
      'regolamento_pdf VARCHAR(255)',
      'excel_originale VARCHAR(255)',
      'excel_modificato VARCHAR(255)',
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'fantacalcio_url VARCHAR(255)',
      'fantacalcio_username VARCHAR(255)',
      'fantacalcio_password VARCHAR(255)',
      'scraping_automatico BOOLEAN DEFAULT FALSE',
      'tipo_lega VARCHAR(50) DEFAULT "serie_a"',
      'updated_at TIMESTAMP NULL',
      'max_portieri INT DEFAULT 3',
      'min_portieri INT DEFAULT 2',
      'max_difensori INT DEFAULT 8',
      'min_difensori INT DEFAULT 5',
      'max_centrocampisti INT DEFAULT 8',
      'min_centrocampisti INT DEFAULT 5',
      'max_attaccanti INT DEFAULT 6',
      'min_attaccanti INT DEFAULT 3'
    ];
    
    for (const columnDef of legheColumns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await connection.execute(`ALTER TABLE leghe ADD COLUMN ${columnName} ${columnDef.substring(columnName.length + 1)}`);
        console.log(`✅ Added column to leghe: ${columnName}`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`⚠️ Column ${columnName} already exists in leghe`);
        } else {
          console.log(`❌ Error adding column ${columnName} to leghe: ${error.message}`);
        }
      }
    }
    
    // Add missing columns to squadre table
    const squadreColumns = [
      'club_level INT DEFAULT 1',
      'casse_societarie INT DEFAULT 0',
      'costo_salariale_totale INT DEFAULT 0',
      'costo_salariale_annuale INT DEFAULT 0',
      'valore_squadra INT DEFAULT 0',
      'is_orfana BOOLEAN DEFAULT TRUE',
      'proprietario_username VARCHAR(255)',
      'logo_url VARCHAR(255)'
    ];
    
    for (const columnDef of squadreColumns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await connection.execute(`ALTER TABLE squadre ADD COLUMN ${columnName} ${columnDef.substring(columnName.length + 1)}`);
        console.log(`✅ Added column to squadre: ${columnName}`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`⚠️ Column ${columnName} already exists in squadre`);
        } else {
          console.log(`❌ Error adding column ${columnName} to squadre: ${error.message}`);
        }
      }
    }
    
    // Add missing columns to giocatori table
    const giocatoriColumns = [
      'lega_id INT NOT NULL',
      'costo_attuale INT DEFAULT 0',
      'squadra_prestito_id INT',
      'quotazione_attuale DECIMAL(10,2) DEFAULT NULL'
    ];
    
    for (const columnDef of giocatoriColumns) {
      const columnName = columnDef.split(' ')[0];
      try {
        await connection.execute(`ALTER TABLE giocatori ADD COLUMN ${columnName} ${columnDef.substring(columnName.length + 1)}`);
        console.log(`✅ Added column to giocatori: ${columnName}`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`⚠️ Column ${columnName} already exists in giocatori`);
        } else {
          console.log(`❌ Error adding column ${columnName} to giocatori: ${error.message}`);
        }
      }
    }
    
    // Add missing columns to notifiche table
    try {
      await connection.execute('ALTER TABLE notifiche ADD COLUMN lega_id INT DEFAULT NULL');
      console.log('✅ Added lega_id to notifiche table');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️ lega_id already exists in notifiche');
      } else {
        console.log('❌ Error adding lega_id to notifiche: ' + error.message);
      }
    }
    
    // Add missing columns to offerte table
    try {
      await connection.execute('ALTER TABLE offerte ADD COLUMN lega_id INT DEFAULT NULL');
      console.log('✅ Added lega_id to offerte table');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️ lega_id already exists in offerte');
      } else {
        console.log('❌ Error adding lega_id to offerte: ' + error.message);
      }
    }
    
    // Create pending_changes table if it doesn't exist
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pending_changes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          subadmin_id INT NOT NULL,
          lega_id INT NOT NULL,
          tipo VARCHAR(50) NOT NULL,
          dati TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL,
          FOREIGN KEY (subadmin_id) REFERENCES users(id),
          FOREIGN KEY (lega_id) REFERENCES leghe(id)
        )
      `);
      console.log('✅ Created pending_changes table');
    } catch (error) {
      console.log('⚠️ pending_changes table might already exist: ' + error.message);
    }
    
    await connection.end();
    console.log('\n✅ Database schema fix completed');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

fixDatabaseSchema(); 