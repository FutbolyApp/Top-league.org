import { getDb } from '../db/mariadb.js';
import { getLegaById } from './lega.js';
import { getGiocatoriBySquadra } from './giocatore.js';

/**
 * Gestisce il sistema Roster A/B per una lega
 */
export class RosterManager {
  constructor(legaId) {
    this.legaId = legaId;
  }

  /**
   * Verifica se una lega ha il sistema Roster A/B attivato
   */
  async isRosterABEnabled() {
    try {
      const lega = await getLegaById(this.legaId);
      return lega && lega?.roster_ab || false === 1;
    } catch (error) {
      console.error('Errore in isRosterABEnabled:', error);
      return false;
    }
  }

  /**
   * Ottiene i giocatori di una squadra divisi per roster
   */
  async getGiocatoriByRoster(squadraId) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      const sql = `
        SELECT *,
               quotazione_attuale
        FROM giocatori 
        WHERE squadra_id = ? 
        ORDER BY roster, nome, cognome
      `;
      
      const result = await db.query(sql, [squadraId]);
      const giocatori = result.rows || [];
      
      const rosterA = giocatori.filter(g => g.roster === 'A');
      const rosterB = giocatori.filter(g => g.roster === 'B');
      
      return {
        rosterA,
        rosterB,
        total: giocatori.length
      };
    } catch (error) {
      console.error('Errore in getGiocatoriByRoster:', error);
      if (error.message === 'Database non disponibile') {
        throw new Error('Il servizio database non è attualmente disponibile. Riprova più tardi.');
      }
      throw error;
    }
  }

  /**
   * Sposta un giocatore da Roster A a Roster B
   * Solo se il giocatore è in prestito
   */
  async moveToRosterB(giocatoreId) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      // Prima verifica se il giocatore è in prestito
      const giocatoreResult = await db.query('SELECT prestito FROM giocatori WHERE id = ?', [giocatoreId]);
      const giocatore = giocatoreResult.rows[0];
      
      if (!giocatore) {
        throw new Error('Giocatore non trovato');
      }
      
      if (!giocatore.prestito) {
        throw new Error('Solo i giocatori in prestito possono essere spostati in Roster B');
      }
      
      const sql = `UPDATE giocatori SET roster = 'B' WHERE id = ?`;
      const result = await db.query(sql, [giocatoreId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Errore in moveToRosterB:', error);
      throw error;
    }
  }

  /**
   * Sposta un giocatore da Roster B a Roster A
   * Solo se il giocatore non è più in prestito
   */
  async moveToRosterA(giocatoreId) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      // Prima verifica se il giocatore è ancora in prestito
      const giocatoreResult = await db.query('SELECT prestito FROM giocatori WHERE id = ?', [giocatoreId]);
      const giocatore = giocatoreResult.rows[0];
      
      if (!giocatore) {
        throw new Error('Giocatore non trovato');
      }
      
      if (giocatore.prestito) {
        throw new Error('I giocatori in prestito devono rimanere in Roster B');
      }
      
      const sql = `UPDATE giocatori SET roster = 'A' WHERE id = ?`;
      const result = await db.query(sql, [giocatoreId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Errore in moveToRosterA:', error);
      throw error;
    }
  }

  /**
   * Gestisce automaticamente i giocatori in prestito
   * Quando un giocatore va in prestito, viene spostato automaticamente in Roster B
   */
  async handleLoanPlayer(giocatoreId, isOnLoan) {
    if (!(await this.isRosterABEnabled())) {
      return; // Sistema Roster A/B non attivato
    }

    if (isOnLoan) {
      await this.moveToRosterB(giocatoreId);
    }
    // Nota: quando il prestito termina, il giocatore rimane in Roster B
    // L'utente dovrà manualmente decidere se riportarlo in Roster A
  }

  /**
   * Verifica se una squadra può accettare un giocatore in prestito
   * Considera i limiti del Roster A/B
   */
  async canAcceptLoanPlayer(squadraId, maxGiocatori = 30) {
    if (!(await this.isRosterABEnabled())) {
      return true; // Nessun limite se Roster A/B non attivato
    }

    const giocatori = await this.getGiocatoriByRoster(squadraId);
    
    // Se la squadra ha già raggiunto il limite massimo, può comunque accettare
    // giocatori in prestito che andranno automaticamente in Roster B
    return true;
  }

  /**
   * Gestisce il ritorno di un giocatore dal prestito
   * Se la squadra ha già raggiunto il limite massimo, il giocatore rimane in Roster B
   */
  async handleLoanReturn(squadraId, giocatoreId) {
    if (!(await this.isRosterABEnabled())) {
      return { success: true, message: 'Sistema Roster A/B non attivato' };
    }

    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      // Prima imposta prestito = 0 per indicare che il giocatore non è più in prestito
      await db.query('UPDATE giocatori SET prestito = 0 WHERE id = ?', [giocatoreId]);

      // Ottieni il numero massimo di giocatori dalla lega
      const lega = await getLegaById(this.legaId);
      const maxGiocatori = lega?.max_giocatori || '' || 30;
      const giocatori = await this.getGiocatoriByRoster(squadraId);
      
      if (giocatori.total >= maxGiocatori) {
        // Squadra al limite massimo, giocatore rimane in Roster B
        await this.moveToRosterB(giocatoreId);
        return {
          success: true,
          message: `Squadra al limite massimo di ${maxGiocatori} giocatori. Il giocatore è stato spostato in Roster B.`,
          requiresAction: true
        };
      } else {
        // Squadra sotto il limite, giocatore può tornare in Roster A
        await this.moveToRosterA(giocatoreId);
        return {
          success: true,
          message: 'Giocatore riportato in Roster A.',
          requiresAction: false
        };
      }
    } catch (error) {
      console.error('Errore in handleLoanReturn:', error);
      throw error;
    }
  }

  /**
   * Calcola il costo salariale solo per i giocatori in Roster A
   */
  async calculateRosterASalary(squadraId) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      const sql = `
        SELECT SUM(salario) as totale_salari
        FROM giocatori 
        WHERE squadra_id = ? AND roster = 'A'
      `;
      
      const result = await db.query(sql, [squadraId]);
      return result.rows[0]?.totale_salari || 0;
    } catch (error) {
      console.error('Errore in calculateRosterASalary:', error);
      return 0;
    }
  }

  /**
   * Ottiene statistiche sui roster di una squadra
   */
  async getRosterStats(squadraId) {
    const giocatori = await this.getGiocatoriByRoster(squadraId);
    const rosterASalary = await this.calculateRosterASalary(squadraId);
    
    return {
      rosterA: {
        count: giocatori.rosterA.length,
        salary: rosterASalary
      },
      rosterB: {
        count: giocatori.rosterB.length,
        salary: 0 // I giocatori in Roster B non vengono pagati
      },
      total: giocatori.total
    };
  }

  /**
   * Forza il movimento di un giocatore tra roster
   * Usato quando l'utente deve fare scelte manuali
   */
  async forceRosterMove(giocatoreId, targetRoster) {
    if (targetRoster !== 'A' && targetRoster !== 'B') {
      throw new Error('Roster deve essere A o B');
    }

    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      const sql = `UPDATE giocatori SET roster = ? WHERE id = ?`;
      const result = await db.query(sql, [targetRoster, giocatoreId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Errore in forceRosterMove:', error);
      throw error;
    }
  }

  /**
   * Verifica se una squadra ha giocatori in prestito che potrebbero tornare
   */
  async getPendingLoanReturns(squadraId) {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Database non disponibile');
      }

      const sql = `
        SELECT *,
               quotazione_attuale
        FROM giocatori 
        WHERE squadra_id = ? AND prestito = 1 AND roster = 'B'
        ORDER BY nome, cognome
      `;
      
      const result = await db.query(sql, [squadraId]);
      return result.rows || [];
    } catch (error) {
      console.error('Errore in getPendingLoanReturns:', error);
      throw error;
    }
  }
}

/**
 * Funzioni di utilità per il sistema Roster A/B
 */
export function createRosterManager(legaId) {
  return new RosterManager(legaId);
}

/**
 * Gestisce automaticamente i prestiti quando vengono accettati
 */
export async function handleLoanAcceptance(giocatoreId, squadraDestinatarioId, legaId) {
  const rosterManager = createRosterManager(legaId);
  
  if (await rosterManager.isRosterABEnabled()) {
    // Il giocatore va automaticamente in Roster B quando accettato in prestito
    await rosterManager.moveToRosterB(giocatoreId);
  }
}

/**
 * Gestisce il ritorno di un giocatore dal prestito
 */
export async function handleLoanReturn(giocatoreId, squadraId, legaId, maxGiocatori = 30) {
  const rosterManager = createRosterManager(legaId);
  
  return await rosterManager.handleLoanReturn(squadraId, giocatoreId, maxGiocatori);
} 