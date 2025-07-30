#!/bin/bash

echo "🔍 Testing login functionality..."

# Test local login
echo "Testing local login..."
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@topleague.com","password":"admin123"}'

echo -e "\n\nTesting external login..."
curl -X POST http://217.154.43.87/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@topleague.com","password":"admin123"}'

echo -e "\n\n✅ Login test complete!" 