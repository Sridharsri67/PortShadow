export class SequenceManager {
  constructor() {
    /** @type {Map<string, number>} */
    this.connectionSequences = new Map();
  }

  /**
   * Get and increment next sequence number for a connection.
   * @param {string} connectionId 
   * @param {number} [initialSeq=100] 
   * @returns {number}
   */
  getNextSequenceNumber(connectionId, initialSeq = 100) {
    if (!this.connectionSequences.has(connectionId)) {
      this.connectionSequences.set(connectionId, initialSeq);
    } else {
      const current = this.connectionSequences.get(connectionId);
      this.connectionSequences.set(connectionId, current + 1);
    }
    return this.connectionSequences.get(connectionId);
  }

  /**
   * Get current sequence number for a connection without incrementing.
   * @param {string} connectionId 
   * @returns {number}
   */
  getSequenceNumber(connectionId) {
    return this.connectionSequences.get(connectionId) || 100;
  }

  /**
   * Reset sequence counter for a specific connection.
   * @param {string} connectionId 
   */
  resetConnectionSequence(connectionId) {
    this.connectionSequences.delete(connectionId);
  }

  /**
   * Clear all connection sequence tracking.
   */
  reset() {
    this.connectionSequences.clear();
  }
}

export const sequenceManager = new SequenceManager();
