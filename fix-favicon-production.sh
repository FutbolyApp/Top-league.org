#!/bin/bash

echo "🚀 Fixing favicon and manifest references in production..."
echo "✅ Using: root@top-league.org with password: VQJ7tSzw"

# Backup del frontend attuale
echo "📦 Creating backup..."
sshpass -p "VQJ7tSzw" ssh -o StrictHostKeyChecking=no root@top-league.org "cd /var/www/html && tar -czf frontend-backup-favicon-fix-$(date +%Y%m%d_%H%M%S).tar.gz index.html static/"

# Create a corrected index.html file
echo "📤 Creating corrected index.html..."
cat > temp-index.html << 'EOF'
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico?v=1.0.17" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=1.0.17" />
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=1.0.17" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#007bff" />
    <meta
      name="description"
      content="TopLeague - Il miglior fantasy football manager italiano"
    />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=1.0.17" />
    <link rel="manifest" href="/site.webmanifest?v=1.0.17" />
    
    <!-- AGGRESSIVE CACHE BUSTING -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="-1" />
    <meta name="cache-bust" content="v1.0.17-favicon" />
    
    <title>TopLeague - Fantasy Football Manager</title>
    
    <!-- CRITICAL: URL cleanup BEFORE React loads -->
    <script>
      console.log('🔧 Pre-React URL cleanup starting...');
      
      // Function to clean and validate URL
      function cleanUrl() {
        try {
          const currentUrl = window.location.href;
          const currentPath = window.location.pathname;
          const currentSearch = window.location.search;
          const currentHash = window.location.hash;
          
          console.log('🔍 Current URL:', currentUrl);
          console.log('🔍 Current Path:', currentPath);
          console.log('🔍 Current Search:', currentSearch);
          
          let needsRedirect = false;
          let cleanPath = currentPath;
          let cleanSearch = currentSearch;
          
          // Handle SPA redirect pattern from 404.html
          if (currentSearch && currentSearch.startsWith('?/')) {
            console.log('🔧 Detected SPA redirect pattern');
            const redirectPath = currentSearch.slice(2); // Remove '?/'
            cleanPath = '/' + redirectPath.replace(/&/g, '?').replace(/~and~/g, '&');
            cleanSearch = '';
            needsRedirect = true;
          }
          
          // Handle malformed paths
          if (currentPath.includes('?/')) {
            console.log('🔧 Detected malformed path');
            cleanPath = currentPath.replace(/\?\//g, '/');
            needsRedirect = true;
          }
          
          // Handle encoded patterns
          if (currentPath.includes('~and~')) {
            console.log('🔧 Detected encoded pattern');
            cleanPath = currentPath.replace(/~and~/g, '&');
            needsRedirect = true;
          }
          
          // Clean up double slashes
          cleanPath = cleanPath.replace(/\/+/g, '/');
          
          // Ensure path starts with /
          if (!cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
            needsRedirect = true;
          }
          
          if (needsRedirect) {
            const newUrl = cleanPath + cleanSearch + currentHash;
            console.log('🔧 Redirecting to clean URL:', newUrl);
            window.location.replace(newUrl);
            return false; // Prevent React from loading
          }
          
          console.log('✅ URL is clean, proceeding with React');
          return true;
          
        } catch (error) {
          console.error('🚨 URL cleanup error:', error);
          // If cleanup fails, redirect to home
          window.location.replace('/');
          return false;
        }
      }
      
      // Run cleanup immediately
      const shouldProceed = cleanUrl();
      
      // If we shouldn't proceed, stop here
      if (!shouldProceed) {
        console.log('🛑 Stopping React load due to URL redirect');
        throw new Error('URL redirect in progress');
      }
    </script>
    
    <!-- React App -->
    <script type="module" crossorigin src="/static/js/main.js"></script>
    <link rel="stylesheet" href="/static/css/main.css">
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Upload the corrected index.html
echo "📤 Uploading corrected index.html..."
sshpass -p "VQJ7tSzw" scp -o StrictHostKeyChecking=no temp-index.html root@top-league.org:/var/www/html/index.html

# Clean up temporary file
rm temp-index.html

# Test the favicon loading
echo "🧪 Testing favicon loading..."
sleep 5

echo "✅ Testing favicon.ico..."
curl -s -I https://www.top-league.org/favicon.ico | head -1

echo "✅ Testing favicon.svg..."
curl -s -I https://www.top-league.org/favicon.svg | head -1

echo "✅ Testing site.webmanifest..."
curl -s -I https://www.top-league.org/site.webmanifest | head -1

echo "🎉 Favicon fix completed!"
echo "📊 Check the website at https://www.top-league.org to verify favicon loading" 