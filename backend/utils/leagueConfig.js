import { getDb } from '../db/postgres.js';

// Funzione per ottenere le configurazioni di una lega
export async function getLeagueConfig(legaId) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const result = await db.query(`
      SELECT 
        roster_ab, cantera, contratti, triggers,
        max_portieri, min_portieri,
        max_difensori, min_difensori,
        max_centrocampisti, min_centrocampisti,
        max_attaccanti, min_attaccanti,
        modalita
      FROM leghe 
      WHERE id = $1
    `, [legaId]);
    
    return result.rows[0] || {};
  } catch (error) {
    console.error('Errore in getLeagueConfig:', error);
    return {};
  }
}

// Funzione per controllare se una funzionalità è abilitata
export async function isFeatureEnabled(legaId, feature) {
  try {
    const config = await getLeagueConfig(legaId);
    switch (feature) {
      case 'roster_ab':
        return config.roster_ab === 1;
      case 'cantera':
        return config.cantera === 1;
      case 'contratti':
        return config.contratti === 1;
      case 'triggers':
        return config.triggers === 1;
      default:
        return false;
    }
  } catch (error) {
    console.error('Errore in isFeatureEnabled:', error);
    return false;
  }
}

// Funzione per controllare se una lega è di tipo Classic
export async function isClassicLeague(legaId) {
  try {
    const config = await getLeagueConfig(legaId);
    const classicPatterns = [
      'Classic Serie A',
      'Classic Euroleghe',
      'Serie A Classic',
      'Euroleghe Classic',
      'Classic'
    ];
    return classicPatterns.some(pattern => config??.modalita || '' || '' && config??.modalita || '' || ''.includes(pattern));
  } catch (error) {
    console.error('Errore in isClassicLeague:', error);
    return false;
  }
}

// Funzione per validare i limiti di ruolo durante uno scambio
export async function validateRoleLimits(legaId, squadraId, giocatoreIn, giocatoreOut = null) {
  try {
    const [config, giocatoriSquadra] = await Promise.all([
      getLeagueConfig(legaId),
      getSquadraGiocatori(squadraId)
    ]);
    
    if (!(await isClassicLeague(legaId))) {
      return { valid: true }; // Non applicare limiti per leghe non Classic
    }

    // Conta i giocatori per ruolo nella squadra
    const conteggi = {
      P: 0, D: 0, C: 0, A: 0
    };

    giocatoriSquadra.forEach(g => {
      const ruoli = g.ruolo ? g.ruolo.split(',') : [];
      ruoli.forEach(ruolo => {
        const ruoloTrim = ruolo.trim();
        if (conteggi.hasOwnProperty(ruoloTrim)) {
          conteggi[ruoloTrim]++;
        }
      });
    });

    // Simula l'aggiunta/rimozione del giocatore
    if (giocatoreIn) {
      const ruoliIn = giocatoreIn.ruolo ? giocatoreIn.ruolo.split(',') : [];
      ruoliIn.forEach(ruolo => {
        const ruoloTrim = ruolo.trim();
        if (conteggi.hasOwnProperty(ruoloTrim)) {
          conteggi[ruoloTrim]++;
        }
      });
    }

    if (giocatoreOut) {
      const ruoliOut = giocatoreOut.ruolo ? giocatoreOut.ruolo.split(',') : [];
      ruoliOut.forEach(ruolo => {
        const ruoloTrim = ruolo.trim();
        if (conteggi.hasOwnProperty(ruoloTrim)) {
          conteggi[ruoloTrim]--;
        }
      });
    }

    // Controlla i limiti
    const errori = [];
    
    if (conteggi.P > config.max_portieri) {
      errori.push(`Troppi portieri: ${conteggi.P}/${config.max_portieri}`);
    }
    if (conteggi.P < config.min_portieri) {
      errori.push(`Troppi pochi portieri: ${conteggi.P}/${config.min_portieri}`);
    }
    if (conteggi.D > config.max_difensori) {
      errori.push(`Troppi difensori: ${conteggi.D}/${config.max_difensori}`);
    }
    if (conteggi.D < config.min_difensori) {
      errori.push(`Troppi pochi difensori: ${conteggi.D}/${config.min_difensori}`);
    }
    if (conteggi.C > config.max_centrocampisti) {
      errori.push(`Troppi centrocampisti: ${conteggi.C}/${config.max_centrocampisti}`);
    }
    if (conteggi.C < config.min_centrocampisti) {
      errori.push(`Troppi pochi centrocampisti: ${conteggi.C}/${config.min_centrocampisti}`);
    }
    if (conteggi.A > config.max_attaccanti) {
      errori.push(`Troppi attaccanti: ${conteggi.A}/${config.max_attaccanti}`);
    }
    if (conteggi.A < config.min_attaccanti) {
      errori.push(`Troppi pochi attaccanti: ${conteggi.A}/${config.min_attaccanti}`);
    }

    return {
      valid: errori.length === 0,
      errors: errori,
      conteggi
    };
  } catch (error) {
    console.error('Errore in validateRoleLimits:', error);
    return { valid: false, errors: ['Errore nella validazione'], conteggi: {} };
  }
}

// Funzione helper per ottenere i giocatori di una squadra
async function getSquadraGiocatori(squadraId) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('Database non disponibile');
    }
    
    const result = await db.query('SELECT * FROM giocatori WHERE squadra_id = $1', [squadraId]);
    return result.rows || [];
  } catch (error) {
    console.error('Errore in getSquadraGiocatori:', error);
    return [];
  }
}

// Funzione per filtrare i dati in base alle configurazioni
export function filterDataByConfig(data, config) {
  const filteredData = { ...data };
  
  // Filtra colonne e dati in base alle configurazioni
  if (config.contratti !== 1) {
    // Rimuovi colonne relative ai contratti
    if (filteredData.columns) {
      filteredData.columns = filteredData.columns.filter(col => 
        !['Ingaggio', 'Anni Contratto', 'Rinnovo Contratto'].includes(col)
      );
    }
    if (filteredData.giocatori) {
      filteredData.giocatori = filteredData.giocatori.map(g => {
        const { salario, anni_contratto, ...rest } = g;
        return rest;
      });
    }
  }
  
  if (config.roster_ab !== 1) {
    // Rimuovi colonne relative al roster A/B
    if (filteredData.columns) {
      filteredData.columns = filteredData.columns.filter(col => 
        !['Roster'].includes(col)
      );
    }
    if (filteredData.giocatori) {
      filteredData.giocatori = filteredData.giocatori.map(g => {
        const { roster, ...rest } = g;
        return rest;
      });
    }
  }
  
  if (config.cantera !== 1) {
    // Rimuovi colonne relative alla cantera
    if (filteredData.columns) {
      filteredData.columns = filteredData.columns.filter(col => 
        !['Cantera'].includes(col)
      );
    }
    if (filteredData.giocatori) {
      filteredData.giocatori = filteredData.giocatori.map(g => {
        const { cantera, ...rest } = g;
        return rest;
      });
    }
  }
  
  if (config.triggers !== 1) {
    // Rimuovi colonne relative ai triggers
    if (filteredData.columns) {
      filteredData.columns = filteredData.columns.filter(col => 
        !['Trigger'].includes(col)
      );
    }
    if (filteredData.giocatori) {
      filteredData.giocatori = filteredData.giocatori.map(g => {
        const { trigger, ...rest } = g;
        return rest;
      });
    }
  }
  
  return filteredData;
} 