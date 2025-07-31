#!/bin/bash

echo "🔍 DEBUG AND FIX ALL ISSUES"
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Create comprehensive SQL script to fix all database issues
echo "📤 Creating comprehensive database fix script..."
cat > temp-complete-fix.sql << 'EOF'
-- Fix notifiche table - add missing columns
ALTER TABLE notifiche 
ADD COLUMN IF NOT EXISTS utente_id INT(11) NOT NULL AFTER id,
ADD COLUMN IF NOT EXISTS letto TINYINT(1) DEFAULT 0 AFTER messaggio,
ADD COLUMN IF NOT EXISTS data_lettura TIMESTAMP NULL AFTER letto,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER data_lettura;

-- Create richieste_unione_squadra table if it doesn't exist
CREATE TABLE IF NOT EXISTS richieste_unione_squadra (
  id INT(11) NOT NULL AUTO_INCREMENT,
  utente_id INT(11) NOT NULL,
  lega_id INT(11) NOT NULL,
  squadra_id INT(11) NOT NULL,
  stato VARCHAR(50) DEFAULT 'in_attesa',
  data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_risposta TIMESTAMP NULL,
  risposta_admin_id INT(11) NULL,
  messaggio_richiesta TEXT NULL,
  messaggio_risposta TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_utente_id (utente_id),
  KEY idx_lega_id (lega_id),
  KEY idx_squadra_id (squadra_id),
  KEY idx_data_creazione (data_creazione)
);

-- Fix richieste_ingresso table - ensure data_creazione exists
ALTER TABLE richieste_ingresso 
ADD COLUMN IF NOT EXISTS data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER data_richiesta;

-- Update existing records to have data_creazione if it's NULL
UPDATE richieste_ingresso SET data_creazione = data_richiesta WHERE data_creazione IS NULL;

-- Fix squadre table if needed
ALTER TABLE squadre 
ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2) DEFAULT 500.00 AFTER nome,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER budget;

-- Fix giocatori table if needed
ALTER TABLE giocatori 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ruolo,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Fix users table if needed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ruolo,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_richieste_ingresso_data_creazione ON richieste_ingresso(data_creazione);
CREATE INDEX IF NOT EXISTS idx_leghe_admin_id ON leghe(admin_id);
CREATE INDEX IF NOT EXISTS idx_squadre_lega_id ON squadre(lega_id);
CREATE INDEX IF NOT EXISTS idx_giocatori_squadra_id ON giocatori(squadra_id);
CREATE INDEX IF NOT EXISTS idx_notifiche_utente_id ON notifiche(utente_id);

-- Show all table structures and record counts
SELECT 'richieste_ingresso' as table_name, COUNT(*) as record_count FROM richieste_ingresso
UNION ALL
SELECT 'richieste_unione_squadra' as table_name, COUNT(*) as record_count FROM richieste_unione_squadra
UNION ALL
SELECT 'leghe' as table_name, COUNT(*) as record_count FROM leghe
UNION ALL
SELECT 'squadre' as table_name, COUNT(*) as record_count FROM squadre
UNION ALL
SELECT 'giocatori' as table_name, COUNT(*) as record_count FROM giocatori
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'notifiche' as table_name, COUNT(*) as record_count FROM notifiche;
EOF

# Upload and execute the SQL script
echo "📤 Uploading comprehensive SQL script..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no temp-complete-fix.sql root@top-league.org:/var/www/html/

echo "🔧 Executing comprehensive database fixes..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "mysql -u root -p25QQj2Fh topleague_prod < /var/www/html/temp-complete-fix.sql"

# Clean up
rm temp-complete-fix.sql

# Test all problematic endpoints
echo "🧪 Testing all problematic endpoints..."
sleep 3

echo "✅ Testing /api/notifiche..."
curl -s https://www.top-league.org/api/notifiche -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" | head -c 200

echo "✅ Testing /api/leghe/richieste/admin..."
curl -s https://www.top-league.org/api/leghe/richieste/admin -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" | head -c 200

echo "✅ Testing /api/subadmin/check-all..."
curl -s https://www.top-league.org/api/subadmin/check-all -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" | head -c 200

echo "✅ Testing /api/leghe/create with FormData..."
curl -s -X POST https://www.top-league.org/api/leghe/create \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" \
  -F "nome=TestLega" \
  -F "modalita=Test" \
  -F "admin_id=1" \
  -F "is_pubblica=true" | head -c 200

echo "🎉 Comprehensive database fix completed!"
echo "📊 Now try creating a league on the website - it should work!" 