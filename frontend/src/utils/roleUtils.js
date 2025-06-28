// Utility per gestire i ruoli multipli Euroleghe
export const splitRoles = (ruolo) => {
  if (!ruolo) return [];
  
  const ruoloUpper = ruolo.toUpperCase().trim();
  
  // Se il ruolo contiene separatori (;, spazio, virgola), dividi normalmente
  if (/[;\s,]/.test(ruoloUpper)) {
    return ruoloUpper.split(/[;\s,]+/).filter(r => r.length > 0);
  }
  
  // Per ruoli concatenati senza separatori (es. "DDC", "EC", "MTA")
  // Lista dei ruoli Euroleghe validi
  const eurolegheRoles = ['POR', 'DD', 'DC', 'DS', 'B', 'E', 'M', 'T', 'W', 'A', 'PC'];
  
  // Prova a dividere il ruolo concatenato
  const roles = [];
  let remaining = ruoloUpper;
  
  while (remaining.length > 0) {
    let found = false;
    
    // Prova prima con ruoli di 2 lettere
    for (const role of eurolegheRoles) {
      if (remaining.startsWith(role)) {
        roles.push(role);
        remaining = remaining.substring(role.length);
        found = true;
        break;
      }
    }
    
    // Se non trova ruoli di 2 lettere, prova con ruoli di 1 lettera
    if (!found) {
      for (const role of eurolegheRoles) {
        if (role.length === 1 && remaining.startsWith(role)) {
          roles.push(role);
          remaining = remaining.substring(1);
          found = true;
          break;
        }
      }
    }
    
    // Se non trova nulla, prendi il primo carattere
    if (!found) {
      roles.push(remaining[0]);
      remaining = remaining.substring(1);
    }
  }
  
  return roles.filter(r => r.length > 0);
};

// Funzione per ottenere la classe CSS del ruolo
export const getRoleClass = (ruolo) => {
  const roleLower = ruolo.toLowerCase();
  
  // Ruoli Serie A Classic
  if (roleLower === 'p') return 'ruolo-p';
  if (roleLower === 'd') return 'ruolo-d';
  if (roleLower === 'c') return 'ruolo-c';
  if (roleLower === 'a') return 'ruolo-a';
  
  // Ruoli Euroleghe Mantra
  if (roleLower === 'por') return 'ruolo-por';
  if (roleLower === 'dc') return 'ruolo-dc';
  if (roleLower === 'dd') return 'ruolo-dd';
  if (roleLower === 'ds') return 'ruolo-ds';
  if (roleLower === 'b') return 'ruolo-b';
  if (roleLower === 'e') return 'ruolo-e';
  if (roleLower === 'm') return 'ruolo-m';
  if (roleLower === 't') return 'ruolo-t';
  if (roleLower === 'w') return 'ruolo-w';
  if (roleLower === 'a') return 'ruolo-a';
  if (roleLower === 'pc') return 'ruolo-pc';
  
  // Fallback
  return 'ruolo-default';
}; 