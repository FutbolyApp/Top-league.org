-- Add SuperAdmin user with correct email
INSERT INTO users (nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo)
VALUES (
  'Admin',
  'Test',
  'admin',
  'Roma',
  'Roma',
  'Setup',
  'admin@top-league.org',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'admin'
) ON CONFLICT (email) DO NOTHING; 