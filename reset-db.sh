#!/bin/bash

echo "🔄 RESET DATABASE LOCALE"
echo "========================"

# Drop e ricrea database
mysql -u root -e "
DROP DATABASE IF EXISTS topleagued_local;
CREATE DATABASE topleagued_local;
GRANT ALL PRIVILEGES ON topleagued_local.* TO 'topleagued_user'@'localhost';
FLUSH PRIVILEGES;
"

# Ricrea tabelle
mysql -u topleagued_user -ptopleagued_pass topleagued_local < backend/db/create_missing_tables.sql

echo "✅ Database resettato!"
