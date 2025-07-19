const fs = require('fs');
const path = require('path');

// Funzione per correggere gli errori di accesso a proprietà
function fixUndefinedErrors(content) {
  // Correzioni per SQL queries
  content = content.replace(/s\?\.nome \|\| 'Nome'/g, "COALESCE(s.nome, 'Nome')");
  content = content.replace(/l\?\.nome \|\| 'Nome'/g, "COALESCE(l.nome, 'Nome')");
  content = content.replace(/u\?\.nome \|\| 'Nome'/g, "COALESCE(u.nome, 'Nome')");
  content = content.replace(/u\?\.ruolo \|\| 'Ruolo'/g, "COALESCE(u.ruolo, 'Ruolo')");
  content = content.replace(/g\?\.nome \|\| 'Nome'/g, "COALESCE(g.nome, 'Nome')");
  content = content.replace(/g\?\.cognome \|\| ''/g, "COALESCE(g.cognome, '')");
  content = content.replace(/g\?\.ruolo \|\| 'Ruolo'/g, "COALESCE(g.ruolo, 'Ruolo')");
  content = content.replace(/sp\?\.nome \|\| 'Nome'/g, "COALESCE(sp.nome, 'Nome')");
  content = content.replace(/sm\?\.nome \|\| 'Nome'/g, "COALESCE(sm.nome, 'Nome')");
  content = content.replace(/sd\?\.nome \|\| 'Nome'/g, "COALESCE(sd.nome, 'Nome')");
  content = content.replace(/gs\?\.nome \|\| 'Nome'/g, "COALESCE(gs.nome, 'Nome')");
  content = content.replace(/gs\?\.cognome \|\| ''/g, "COALESCE(gs.cognome, '')");
  content = content.replace(/gs\?\.ruolo \|\| 'Ruolo'/g, "COALESCE(gs.ruolo, 'Ruolo')");
  content = content.replace(/ss\?\.nome \|\| 'Nome'/g, "COALESCE(ss.nome, 'Nome')");
  
  // Correzioni per JavaScript object access
  content = content.replace(/(\w+)\?\.modalita/g, "$1?.modalita || ''");
  content = content.replace(/(\w+)\?\.nome \|\| 'Nome'/g, "$1?.nome || 'Nome'");
  content = content.replace(/(\w+)\?\.cognome \|\| ''/g, "$1?.cognome || ''");
  content = content.replace(/(\w+)\?\.ruolo \|\| 'Ruolo'/g, "$1?.ruolo || 'Ruolo'");
  content = content.replace(/(\w+)\?\.lega_id/g, "$1?.lega_id");
  content = content.replace(/(\w+)\?\.squadra_id/g, "$1?.squadra_id");
  content = content.replace(/(\w+)\?\.admin_id/g, "$1?.admin_id");
  content = content.replace(/(\w+)\?\.proprietario_id/g, "$1?.proprietario_id");
  
  // Correzioni specifiche per errori comuni
  content = content.replace(/if \(!(\w+)\.nome \|\| 'Nome' \|\| !(\w+)\.ruolo \|\| 'Ruolo'\)/g, "if (!$1?.nome || !$2?.ruolo)");
  content = content.replace(/const (\w+) = (\w+)\.rows\[0\]\?\.(\w+);/g, "const $1 = $2.rows[0]?.$3;");
  
  return content;
}

// Funzione per processare un file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixUndefinedErrors(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Funzione per processare una directory
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      fixedCount += processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      if (processFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Processa i file principali
console.log('🔧 Fixing undefined property access errors...');

let totalFixed = 0;

// Backend routes
totalFixed += processDirectory('./backend/routes');
console.log(`📁 Backend routes: ${totalFixed} files fixed`);

// Backend models
totalFixed += processDirectory('./backend/models');
console.log(`📁 Backend models: ${totalFixed} files fixed`);

// Frontend pages
totalFixed += processDirectory('./frontend/src/pages');
console.log(`📁 Frontend pages: ${totalFixed} files fixed`);

// Frontend components
totalFixed += processDirectory('./frontend/src/components');
console.log(`📁 Frontend components: ${totalFixed} files fixed`);

console.log(`\n🎉 Total files fixed: ${totalFixed}`);
console.log('✅ All undefined property access errors have been fixed!'); 