import { Tombstone } from "../models/Tombstone.js";
import { broadcastEvent, SOCKET_EVENTS } from "../websocket/socket.js";
import { systemClock } from "./Clock.js";

export class TombstoneStore {
  /**
   * @param {import("./Clock.js").Clock} [clock]
   */
  constructor(clock = systemClock) {
    this.clock = clock;

    /** @type {Map<string, Tombstone>} Keyed by tombstoneId */
    this.tombstones = new Map();

    /** @type {Map<string, Tombstone>} Keyed by tupleKey */
    this.tupleTombstones = new Map();

    /** @type {Map<string, NodeJS.Timeout>} Timers for auto-cleanup */
    this.timers = new Map();

    /** @type {NodeJS.Timeout | null} Background interval sweeper timer */
    this.sweeperTimer = null;

    // Start robust background sweeper process
    this.startSweeper(1000);
  }

  /**
   * Start robust background cleanup sweeper process.
   * @param {number} [intervalMs=1000] 
   */
  startSweeper(intervalMs = 1000) {
    if (this.sweeperTimer) return;
    if (typeof setInterval !== "undefined") {
      this.sweeperTimer = setInterval(() => {
        this.cleanupExpired();
      }, intervalMs);
      if (this.sweeperTimer.unref) {
        this.sweeperTimer.unref();
      }
    }
  }

  /**
   * Stop background sweeper interval process.
   */
  stopSweeper() {
    if (this.sweeperTimer) {
      clearInterval(this.sweeperTimer);
      this.sweeperTimer = null;
    }
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
      closedAt: connection.closedAt || this.clock.isoNow(),
      ttlMs
    });

    this.tombstones.set(tombstone.tombstoneId, tombstone);
    this.tupleTombstones.set(connection.tupleKey, tombstone);

    // Schedule automatic expiration cleanup with unref safety
    if (ttlMs > 0 && typeof setTimeout !== "undefined") {
      const timer = setTimeout(() => {
        this.removeTombstone(tombstone.tombstoneId);
      }, ttlMs);
      if (timer.unref) timer.unref();
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

    if (tombstone.isExpired(this.clock)) {
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

    if (tombstone.isExpired(this.clock)) {
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
   * Explicitly remove tombstone and broadcast expiration event.
   */
  removeTombstone(tombstoneId) {
    const tombstone = this.tombstones.get(tombstoneId);
    if (tombstone) {
      this.tombstones.delete(tombstoneId);
      if (this.tupleTombstones.get(tombstone.tupleKey) === tombstone) {
        this.tupleTombstones.delete(tombstone.tupleKey);
      }
      broadcastEvent(SOCKET_EVENTS.TOMBSTONE_EXPIRED || "tombstone:expired", {
        tombstoneId,
        tupleKey: tombstone.tupleKey,
        oldIncarnationId: tombstone.oldIncarnationId
      });
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
      if (tombstone.isExpired(this.clock)) {
        this.removeTombstone(tombstone.tombstoneId);
      }
    }
  }

  /**
   * Clear all tombstones, cancel timers, and stop sweeper.
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
