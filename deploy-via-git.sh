#!/bin/bash

echo "🚀 DEPLOY VIA GIT - TOPLEAGUE ONLINE"
echo "====================================="

# 1. Commit delle modifiche
echo "📝 Committing changes..."
git add .
git commit -m "Add POST endpoint for creating leagues without Excel file"

# 2. Push delle modifiche
echo "📤 Pushing to remote..."
git push origin main

echo "✅ Deploy completato!"
echo "🔗 Il server dovrebbe aggiornarsi automaticamente"
echo "🔗 Testa: https://top-league.org/api/ping" 