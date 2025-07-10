import { getDb } from '../db/config.js';
import { getLegaById } from './lega.js';
import { getGiocatoriBySquadra } from './giocatore.js';

const db = getDb();

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
    return new Promise((resolve, reject) => {
      getLegaById(this.legaId, (err, lega) => {
        if (err) return reject(err);
        resolve(lega && lega.roster_ab === 1);
      });
    });
  }

  /**
   * Ottiene i giocatori di una squadra divisi per roster
   */
  async getGiocatoriByRoster(squadraId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT *,
               COALESCE(qa, quotazione_attuale) as quotazione_attuale,
               fvm as fv_mp,
               qi
        FROM giocatori 
        WHERE squadra_id = ? 
        ORDER BY roster, nome, cognome
      `;
      
      db.all(sql, [squadraId], (err, giocatori) => {
        if (err) return reject(err);
        
        const rosterA = giocatori.filter(g => g.roster === 'A');
        const rosterB = giocatori.filter(g => g.roster === 'B');
        
        resolve({
          rosterA,
          rosterB,
          total: giocatori.length
        });
      });
    });
  }

  /**
   * Sposta un giocatore da Roster A a Roster B
   * Solo se il giocatore è in prestito
   */
  async moveToRosterB(giocatoreId) {
    return new Promise((resolve, reject) => {
      // Prima verifica se il giocatore è in prestito
      db.get('SELECT prestito FROM giocatori WHERE id = ?', [giocatoreId], (err, giocatore) => {
        if (err) return reject(err);
        
        if (!giocatore) {
          return reject(new Error('Giocatore non trovato'));
        }
        
        if (!giocatore.prestito) {
          return reject(new Error('Solo i giocatori in prestito possono essere spostati in Roster B'));
        }
        
        const sql = `UPDATE giocatori SET roster = 'B' WHERE id = ?`;
        db.run(sql, [giocatoreId], function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        });
      });
    });
  }

  /**
   * Sposta un giocatore da Roster B a Roster A
   * Solo se il giocatore non è più in prestito
   */
  async moveToRosterA(giocatoreId) {
    return new Promise((resolve, reject) => {
      // Prima verifica se il giocatore è ancora in prestito
      db.get('SELECT prestito FROM giocatori WHERE id = ?', [giocatoreId], (err, giocatore) => {
        if (err) return reject(err);
        
        if (!giocatore) {
          return reject(new Error('Giocatore non trovato'));
        }
        
        if (giocatore.prestito) {
          return reject(new Error('I giocatori in prestito devono rimanere in Roster B'));
        }
        
        const sql = `UPDATE giocatori SET roster = 'A' WHERE id = ?`;
        db.run(sql, [giocatoreId], function(err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        });
      });
    });
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

    // Prima imposta prestito = 0 per indicare che il giocatore non è più in prestito
    await new Promise((resolve, reject) => {
      db.run('UPDATE giocatori SET prestito = 0 WHERE id = ?', [giocatoreId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    // Ottieni il numero massimo di giocatori dalla lega
    const lega = await new Promise((resolve, reject) => {
      getLegaById(this.legaId, (err, lega) => {
        if (err) reject(err);
        else resolve(lega);
      });
    });

    const maxGiocatori = lega.max_giocatori || 30;
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
  }

  /**
   * Calcola il costo salariale solo per i giocatori in Roster A
   */
  async calculateRosterASalary(squadraId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT SUM(salario) as totale_salari
        FROM giocatori 
        WHERE squadra_id = ? AND roster = 'A'
      `;
      
      db.get(sql, [squadraId], (err, result) => {
        if (err) return reject(err);
        resolve(result ? result.totale_salari || 0 : 0);
      });
    });
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

    return new Promise((resolve, reject) => {
      const sql = `UPDATE giocatori SET roster = ? WHERE id = ?`;
      db.run(sql, [targetRoster, giocatoreId], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Verifica se una squadra ha giocatori in prestito che potrebbero tornare
   */
  async getPendingLoanReturns(squadraId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT *,
               COALESCE(qa, quotazione_attuale) as quotazione_attuale,
               qi
        FROM giocatori 
        WHERE squadra_id = ? AND prestito = 1 AND roster = 'B'
        ORDER BY nome, cognome
      `;
      
      db.all(sql, [squadraId], (err, giocatori) => {
        if (err) return reject(err);
        resolve(giocatori);
      });
    });
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