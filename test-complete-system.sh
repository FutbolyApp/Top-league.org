#!/bin/bash

# Comprehensive test script for the complete system
echo "🔍 COMPREHENSIVE SYSTEM TEST"
echo "============================================================"

API_BASE="https://top-league.org/api"

# Test 1: API Health
echo -e "\n🔍 TEST 1: API Health"
curl -s "${API_BASE}/version" | jq .

# Test 2: Database Health
echo -e "\n🔍 TEST 2: Database Health"
curl -s "${API_BASE}/health" | jq .

# Test 3: Login
echo -e "\n🔍 TEST 3: Login"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@top-league.org","password":"futboly"}' \
  "${API_BASE}/auth/login")

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq .

# Extract token if login successful
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "✅ Login successful, token obtained"
  
  # Test 4: Leghe
  echo -e "\n🔍 TEST 4: Leghe"
  curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/leghe" | jq .
  
  # Test 5: Squadre
  echo -e "\n🔍 TEST 5: Squadre"
  curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/squadre" | jq .
  
  # Test 6: Specific Squadra
  echo -e "\n🔍 TEST 6: Squadra 72"
  curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/squadre/72" | jq .
  
  # Test 7: Giocatori for Squadra 72
  echo -e "\n🔍 TEST 7: Giocatori for Squadra 72"
  curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/giocatori/squadra/72" | jq .
  
  # Test 8: Database Schema
  echo -e "\n🔍 TEST 8: Database Schema"
  curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/schema" | jq .
  
  # Test 9: Count all squadre
  echo -e "\n🔍 TEST 9: Count all squadre"
  SQUADRE_COUNT=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/squadre" | jq '.data | length')
  echo "Total squadre found: $SQUADRE_COUNT"
  
  # Test 10: Count all giocatori
  echo -e "\n🔍 TEST 10: Count all giocatori"
  curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/giocatori" | jq '.data | length'
  
else
  echo "❌ Login failed, cannot proceed with authenticated tests"
fi

echo -e "\n============================================================"
echo "✅ System test completed!" 