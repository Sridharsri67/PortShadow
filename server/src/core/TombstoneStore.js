import { Tombstone } from "../models/Tombstone.js";

export class TombstoneStore {
  constructor() {
    /** @type {Map<string, Tombstone>} Keyed by tombstoneId */
    this.tombstones = new Map();

    /** @type {Map<string, Tombstone>} Keyed by tupleKey */
    this.tupleTombstones = new Map();

    /** @type {Map<string, NodeJS.Timeout>} Timers for auto-cleanup */
    this.timers = new Map();
  }

  /**
   * Create a tombstone record from a closed connection.
   * @param {import("../models/Connection.js").Connection} connection 
   * @param {number} [ttlMs=5000] 
   */
  createTombstone(connection, ttlMs = 5000) {
    if (!connection) {
      throw new Error("Connection object is required to create a tombstone");
    }

    const tombstone = new Tombstone({
      connectionId: connection.connectionId,
      tupleKey: connection.tupleKey,
      oldIncarnationId: connection.incarnationId,
      lastSequence: connection.sequenceNumber,
      closedAt: connection.closedAt || new Date().toISOString(),
      ttlMs
    });

    this.tombstones.set(tombstone.tombstoneId, tombstone);
    this.tupleTombstones.set(connection.tupleKey, tombstone);

    // Schedule automatic expiration cleanup
    if (ttlMs > 0 && typeof setTimeout !== "undefined") {
      const timer = setTimeout(() => {
        this.removeTombstone(tombstone.tombstoneId);
      }, ttlMs);
      this.timers.set(tombstone.tombstoneId, timer);
    }

    return tombstone;
  }

  /**
   * Lookup unexpired tombstone by 4-tuple.
   */
  getTombstoneByTuple(sourceIp, sourcePort, destinationIp, destinationPort) {
    const tupleKey = `${sourceIp}:${sourcePort}->${destinationIp}:${destinationPort}`;
    const tombstone = this.tupleTombstones.get(tupleKey);
    if (!tombstone) return null;

    if (tombstone.isExpired()) {
      this.removeTombstone(tombstone.tombstoneId);
      return null;
    }
    return tombstone;
  }

  /**
   * Get tombstone by ID.
   */
  getTombstone(tombstoneId) {
    const tombstone = this.tombstones.get(tombstoneId);
    if (!tombstone) return null;

    if (tombstone.isExpired()) {
      this.removeTombstone(tombstoneId);
      return null;
    }
    return tombstone;
  }

  /**
   * Get array of all currently active/valid tombstones.
   */
  getAllTombstones() {
    this.cleanupExpired();
    return Array.from(this.tombstones.values());
  }

  /**
   * Explicitly remove tombstone.
   */
  removeTombstone(tombstoneId) {
    const tombstone = this.tombstones.get(tombstoneId);
    if (tombstone) {
      this.tombstones.delete(tombstoneId);
      if (this.tupleTombstones.get(tombstone.tupleKey) === tombstone) {
        this.tupleTombstones.delete(tombstone.tupleKey);
      }
    }

    if (this.timers.has(tombstoneId)) {
      clearTimeout(this.timers.get(tombstoneId));
      this.timers.delete(tombstoneId);
    }
  }

  /**
   * Sweep and remove expired tombstones.
   */
  cleanupExpired() {
    for (const tombstone of this.tombstones.values()) {
      if (tombstone.isExpired()) {
        this.removeTombstone(tombstone.tombstoneId);
      }
    }
  }

  /**
   * Clear all tombstones and cleanup timers.
   */
  reset() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.tombstones.clear();
    this.tupleTombstones.clear();
  }
}

export const tombstoneStore = new TombstoneStore();
