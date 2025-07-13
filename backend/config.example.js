// Esempio di configurazione per le variabili d'ambiente
// Copia questo file come .env e modifica i valori

export const config = {
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://topleague_user:password@dpg-cp8j8v8cmk4c73c8v8v0-a.oregon-postgres.render.com/topleague_db',
  
  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT Secret (per autenticazione)
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
}; 