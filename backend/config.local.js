// Configurazione per test locale con PostgreSQL
export const localConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    database: 'topleague_db',
    user: 'topleague_db_user',
    password: 'topleague_db_password',
    ssl: false
  },
  server: {
    port: 3001
  }
}; 