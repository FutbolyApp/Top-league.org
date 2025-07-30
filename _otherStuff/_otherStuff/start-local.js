import { initializeDatabase } from './db/postgres.js';
import app from './server.js';

// Configurazione per database locale
process.env.DATABASE_URL = 'postgresql://topleague_db_user:topleague_db_password@localhost:5432/topleague_db';
process.env.NODE_ENV = 'development';

const PORT = process.env.PORT || 3001;

async function startLocalServer() {
  try {
    console.log('🚀 Avviando server locale con PostgreSQL...');
    
    // Inizializza il database
    await initializeDatabase();
    
    // Avvia il server
    app.listen(PORT, () => {
      console.log(`✅ Server locale avviato su http://localhost:${PORT}`);
      console.log('📊 Database: PostgreSQL locale');
      console.log('🔧 Modalità: Development');
    });
    
  } catch (error) {
    console.error('❌ Errore avvio server locale:', error);
    process.exit(1);
  }
}

startLocalServer(); 