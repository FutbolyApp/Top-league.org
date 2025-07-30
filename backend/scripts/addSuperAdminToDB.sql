-- Add SuperAdmin user to database
INSERT INTO users (nome, cognome, username, provenienza, squadra_cuore, come_conosciuto, email, password_hash, ruolo) 
VALUES (
    'Futboly',
    'Admin', 
    'futboly',
    'Roma',
    'Roma',
    'Setup',
    'admin@top-league.org',
    '$2a$10$wNjPfaKfMCIfw/YAhckCFeFzQhzpZi4uZtp1gQUFEDcMWabqw5doC',
    'SuperAdmin'
) ON DUPLICATE KEY UPDATE id=id; 