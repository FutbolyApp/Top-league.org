#!/usr/bin/expect -f

set timeout 30
set password "VQJ7tSzw"

# Function to upload a file
proc upload_file {local_file remote_path} {
    global password
    spawn scp $local_file root@top-league.org:$remote_path
    expect {
        "password:" {
            send "$password\r"
            expect eof
        }
        eof
    }
}

# Function to execute SSH command
proc ssh_command {command} {
    global password
    spawn ssh root@top-league.org $command
    expect {
        "password:" {
            send "$password\r"
            expect eof
        }
        eof
    }
}

puts "🚀 Deploying API fixes to production..."

# Backup del backend attuale
puts "📦 Creating backup..."
ssh_command "cd /var/www/html && tar -czf backend-backup-$(date +%Y%m%d_%H%M%S).tar.gz backend/"

# Upload dei file corretti
puts "📤 Uploading fixed files..."

# Upload backend files
upload_file "backend/index.js" "/var/www/html/backend/"
upload_file "backend/routes/auth.js" "/var/www/html/backend/routes/"
upload_file "backend/routes/notifiche.js" "/var/www/html/backend/routes/"
upload_file "backend/middleware/errorHandler.js" "/var/www/html/backend/middleware/"

# Upload frontend files
upload_file "frontend/src/api/config.js" "/var/www/html/frontend/src/api/"
upload_file "frontend/src/api/auth.js" "/var/www/html/frontend/src/api/"
upload_file "frontend/src/components/NetworkErrorHandler.js" "/var/www/html/frontend/src/components/"
upload_file "frontend/src/App.js" "/var/www/html/frontend/src/"

# Restart del backend
puts "🔄 Restarting backend..."
ssh_command "cd /var/www/html/backend && pm2 restart backend"

# Build del frontend
puts "🔨 Building frontend..."
ssh_command "cd /var/www/html/frontend && npm run build"

puts "🎉 Deployment completed!"
puts "📊 Check logs with: ssh root@top-league.org 'pm2 logs backend'" 