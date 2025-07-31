#!/bin/bash

echo "🚀 Fixing database schema issues..."
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Create SQL script to fix database schema
echo "📤 Creating database schema fix script..."
cat > temp-fix-schema.sql << 'EOF'
-- Fix richieste_ingresso table
ALTER TABLE richieste_ingresso 
ADD COLUMN IF NOT EXISTS data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER data_richiesta;

-- Fix notifiche table if needed
ALTER TABLE notifiche 
ADD COLUMN IF NOT EXISTS letto TINYINT(1) DEFAULT 0 AFTER messaggio,
ADD COLUMN IF NOT EXISTS data_lettura TIMESTAMP NULL AFTER letto;

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

-- Update existing records to have data_creazione if it's NULL
UPDATE richieste_ingresso SET data_creazione = data_richiesta WHERE data_creazione IS NULL;

-- Show table structures
SELECT 'richieste_ingresso' as table_name, COUNT(*) as record_count FROM richieste_ingresso
UNION ALL
SELECT 'leghe' as table_name, COUNT(*) as record_count FROM leghe
UNION ALL
SELECT 'squadre' as table_name, COUNT(*) as record_count FROM squadre
UNION ALL
SELECT 'giocatori' as table_name, COUNT(*) as record_count FROM giocatori
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM users;
EOF

# Upload the SQL script
echo "📤 Uploading SQL script..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no temp-fix-schema.sql root@top-league.org:/var/www/html/

# Execute the SQL script
echo "🔧 Executing database schema fixes..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "mysql -u root -p25QQj2Fh topleague_prod < /var/www/html/temp-fix-schema.sql"

# Clean up
rm temp-fix-schema.sql

# Test the endpoints
echo "🧪 Testing endpoints after schema fix..."
sleep 5

echo "✅ Testing /api/leghe/all..."
curl -s https://www.top-league.org/api/leghe/all -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" | head -c 200

echo "✅ Testing /api/leghe/richieste/admin..."
curl -s https://www.top-league.org/api/leghe/richieste/admin -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0b3AtbGVhZ3VlLm9yZyIsInJ1b2xvIjoiU3VwZXJBZG1pbiIsImlhdCI6MTc1Mzk2MzI3OCwiZXhwIjoxNzU0NTY4MDc4fQ.WqcCS-KnWeNWE164ICwNINN3VK2uanBuGiC_Ukp_PGE" | head -c 200

echo "🎉 Database schema fix completed!"
echo "📊 Check the website now - you should be able to create and see leagues" 