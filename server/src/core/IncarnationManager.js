import { Incarnation } from "../models/Incarnation.js";

export class IncarnationManager {
  constructor() {
    /** @type {Map<string, Incarnation>} */
    this.incarnations = new Map();
  }

  /**
   * Generates a new 128-bit UUID incarnation and registers it.
   * @returns {Incarnation}
   */
  createIncarnation() {
    const incarnation = new Incarnation();
    this.incarnations.set(incarnation.incarnationId, incarnation);
    return incarnation;
  }

  /**
   * Get registered incarnation by ID.
   * @param {string} incarnationId 
   * @returns {Incarnation | null}
   */
  getIncarnation(incarnationId) {
    return this.incarnations.get(incarnationId) || null;
  }

  /**
   * Compares packet/connection incarnation ID against active incarnation ID.
   * @param {string} packetIncarnationId 
   * @param {string} activeIncarnationId 
   * @returns {boolean}
   */
  validateIncarnation(packetIncarnationId, activeIncarnationId) {
    if (!packetIncarnationId || !activeIncarnationId) {
      return false;
    }
    return packetIncarnationId === activeIncarnationId;
  }

  /**
   * Clears stored incarnations.
   */
  reset() {
    this.incarnations.clear();
  }
}

// Singleton instance for server core
export const incarnationManager = new IncarnationManager();
