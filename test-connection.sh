#!/bin/bash

echo "🔍 Testing server connections..."

# Test 1: root@top-league.org with VQJ7tSzw
echo "Testing root@top-league.org with VQJ7tSzw..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "echo '✅ root@top-league.org works!'" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: root@top-league.org with VQJ7tSzw"
    USER="root"
    PASS="VQJ7tSzw"
else
    echo "❌ FAILED: root@top-league.org with VQJ7tSzw"
fi

# Test 2: root@top-league.org with 25QQj2Fh
echo "Testing root@top-league.org with 25QQj2Fh..."
sshpass -p "25QQj2Fh" ssh -o StrictHostKeyChecking=no root@top-league.org "echo '✅ root@top-league.org works!'" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: root@top-league.org with 25QQj2Fh"
    USER="root"
    PASS="25QQj2Fh"
else
    echo "❌ FAILED: root@top-league.org with 25QQj2Fh"
fi

# Test 3: topleagued@top-league.org with VQJ7tSzw
echo "Testing topleagued@top-league.org with VQJ7tSzw..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no topleagued@top-league.org "echo '✅ topleagued@top-league.org works!'" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: topleagued@top-league.org with VQJ7tSzw"
    USER="topleagued"
    PASS="VQJ7tSzw"
else
    echo "❌ FAILED: topleagued@top-league.org with VQJ7tSzw"
fi

# Test 4: topleagued@top-league.org with 25QQj2Fh
echo "Testing topleagued@top-league.org with 25QQj2Fh..."
sshpass -p "25QQj2Fh" ssh -o StrictHostKeyChecking=no topleagued@top-league.org "echo '✅ topleagued@top-league.org works!'" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: topleagued@top-league.org with 25QQj2Fh"
    USER="topleagued"
    PASS="25QQj2Fh"
else
    echo "❌ FAILED: topleagued@top-league.org with 25QQj2Fh"
fi

echo "🎯 Working combination: $USER@top-league.org with password: $PASS" 