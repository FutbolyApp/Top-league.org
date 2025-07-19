const fs = require('fs');
const path = require('path');

// Funzione per cercare e sostituire pattern in un file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern da cercare e sostituire
    const patterns = [
      // Frontend patterns
      { 
        search: /lega\.modalita/g, 
        replace: 'lega?.modalita || \'N/A\'' 
      },
      { 
        search: /config\.modalita/g, 
        replace: 'config?.modalita || \'\'' 
      },
      { 
        search: /\.modalita\s*\)/g, 
        replace: '?.modalita || \'\')' 
      },
      { 
        search: /\.modalita\s*\+/g, 
        replace: '?.modalita || \'\' +' 
      },
      { 
        search: /\.modalita\s*===/g, 
        replace: '?.modalita || \'\' ===' 
      },
      { 
        search: /\.modalita\s*!==/g, 
        replace: '?.modalita || \'\' !==' 
      },
      { 
        search: /\.modalita\s*&&/g, 
        replace: '?.modalita || \'\' &&' 
      },
      { 
        search: /\.modalita\s*\|\|/g, 
        replace: '?.modalita || \'\' ||' 
      },
      { 
        search: /\.modalita\s*</g, 
        replace: '?.modalita || \'\' <' 
      },
      { 
        search: /\.modalita\s*>/g, 
        replace: '?.modalita || \'\' >' 
      },
      { 
        search: /\.modalita\s*=/g, 
        replace: '?.modalita || \'\' =' 
      },
      { 
        search: /\.modalita\s*;/g, 
        replace: '?.modalita || \'\';' 
      },
      { 
        search: /\.modalita\s*,/g, 
        replace: '?.modalita || \'\',' 
      },
      { 
        search: /\.modalita\s*}/g, 
        replace: '?.modalita || \'\'}' 
      },
      { 
        search: /\.modalita\s*\)/g, 
        replace: '?.modalita || \'\')' 
      },
      { 
        search: /\.modalita\s*\[/g, 
        replace: '?.modalita || \'\'[' 
      },
      { 
        search: /\.modalita\s*\?/g, 
        replace: '?.modalita || \'\'?' 
      },
      { 
        search: /\.modalita\s*:/g, 
        replace: '?.modalita || \'\':' 
      },
      { 
        search: /\.modalita\s*\./g, 
        replace: '?.modalita || \'\'.' 
      },
      { 
        search: /\.modalita\s*$/gm, 
        replace: '?.modalita || \'\'' 
      }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Funzione per cercare file ricorsivamente
function findFiles(dir, extensions = ['.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Salta le cartelle node_modules e .git
        if (item !== 'node_modules' && item !== '.git' && !item.startsWith('.')) {
          traverse(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Funzione per cercare file che contengono "modalita"
function findModalitaFiles(dir) {
  const allFiles = findFiles(dir);
  const modalitaFiles = [];
  
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('modalita')) {
        modalitaFiles.push(file);
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }
  
  return modalitaFiles;
}

// Esegui la correzione
console.log('🔍 Searching for files with modalita...');
const modalitaFiles = findModalitaFiles('./frontend/src');
const backendFiles = findModalitaFiles('./backend');

console.log(`Found ${modalitaFiles.length} frontend files with modalita`);
console.log(`Found ${backendFiles.length} backend files with modalita`);

let fixedCount = 0;

// Correggi file frontend
modalitaFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

// Correggi file backend
backendFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files with modalita errors`);
console.log('✅ All modalita undefined property errors should now be fixed!'); 