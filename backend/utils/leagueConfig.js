import { getDb } from '../db/config.js';

// Funzione per ottenere le configurazioni di una lega
export function getLeagueConfig(legaId) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(`
      SELECT 
        roster_ab, cantera, contratti, triggers,
        max_portieri, min_portieri,
        max_difensori, min_difensori,
        max_centrocampisti, min_centrocampisti,
        max_attaccanti, min_attaccanti,
        modalita
      FROM leghe 
      WHERE id = ?
    `, [legaId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || {});
      }
    });
  });
}

// Funzione per controllare se una funzionalità è abilitata
export function isFeatureEnabled(legaId, feature) {
  return new Promise((resolve, reject) => {
    getLeagueConfig(legaId)
      .then(config => {
        switch (feature) {
          case 'roster_ab':
            resolve(config.roster_ab === 1);
          case 'cantera':
            resolve(config.cantera === 1);
          case 'contratti':
            resolve(config.contratti === 1);
          case 'triggers':
            resolve(config.triggers === 1);
          default:
            resolve(false);
        }
      })
      .catch(reject);
  });
}

// Funzione per controllare se una lega è di tipo Classic
export function isClassicLeague(legaId) {
  return new Promise((resolve, reject) => {
    getLeagueConfig(legaId)
      .then(config => {
        const classicPatterns = [
          'Classic Serie A',
          'Classic Euroleghe',
          'Serie A Classic',
          'Euroleghe Classic',
          'Classic'
        ];
        resolve(classicPatterns.some(pattern => config.modalita && config.modalita.includes(pattern)));
      })
      .catch(reject);
  });
}

// Funzione per validare i limiti di ruolo durante uno scambio
export function validateRoleLimits(legaId, squadraId, giocatoreIn, giocatoreOut = null) {
  return new Promise((resolve, reject) => {
    Promise.all([
      getLeagueConfig(legaId),
      getSquadraGiocatori(squadraId)
    ])
    .then(([config, giocatoriSquadra]) => {
      if (!isClassicLeague(legaId)) {
        resolve({ valid: true }); // Non applicare limiti per leghe non Classic
        return;
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

      resolve({
        valid: errori.length === 0,
        errors: errori,
        conteggi
      });
    })
    .catch(reject);
  });
}

// Funzione helper per ottenere i giocatori di una squadra
function getSquadraGiocatori(squadraId) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all('SELECT * FROM giocatori WHERE squadra_id = ?', [squadraId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
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
        !['Triggers'].includes(col)
      );
    }
    if (filteredData.giocatori) {
      filteredData.giocatori = filteredData.giocatori.map(g => {
        const { triggers, ...rest } = g;
        return rest;
      });
    }
  }
  
  return filteredData;
} 