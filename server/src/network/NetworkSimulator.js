import { delayEngine } from "./DelayEngine.js";
import { reorderEngine } from "./ReorderEngine.js";
import { duplicateEngine } from "./DuplicateEngine.js";
import { dropEngine } from "./DropEngine.js";
import { PACKET_STATUS } from "../models/Packet.js";
import { SeedableRandom, systemRandom } from "../core/Random.js";

export class NetworkSimulator {
  constructor() {
    this.delayEngine = delayEngine;
    this.reorderEngine = reorderEngine;
    this.duplicateEngine = duplicateEngine;
    this.dropEngine = dropEngine;
    this.random = systemRandom;

    /** @type {Array<import("../models/Packet.js").Packet>} Network audit log of transmitted/processed packets */
    this.transitLog = [];
  }

  /**
   * Set deterministic PRNG seed for exact scenario replayability.
   * @param {number} seed 
   */
  setSeed(seed) {
    this.random = new SeedableRandom(seed);
  }

  /**
   * Transmit a packet through simulated network channel.
   * Options:
   *  - delayMs: number (if > 0, holds packet in DelayEngine)
   *  - drop: boolean (if true, drops packet via DropEngine)
   *  - duplicate: boolean (if true, creates duplicate copy via DuplicateEngine)
   */
  transmitPacket(packet, options = {}) {
    if (!packet) {
      throw new Error("Valid packet required for transmission");
    }

    const { delayMs = 0, drop = false, duplicate = false } = options;

    if (drop) {
      const droppedPacket = this.dropEngine.dropPacket(packet);
      this.transitLog.push(droppedPacket);
      return { packet: droppedPacket, action: "DROPPED", duplicates: [] };
    }

    const duplicates = [];
    if (duplicate) {
      const dup = this.duplicateEngine.duplicatePacket(packet);
      duplicates.push(dup);
      this.transitLog.push(dup);
    }

    if (delayMs > 0) {
      const delayedPacket = this.delayEngine.delayPacket(packet, delayMs);
      this.transitLog.push(delayedPacket);
      return { packet: delayedPacket, action: "DELAYED", duplicates };
    }

    packet.setStatus(PACKET_STATUS.SENT);
    this.transitLog.push(packet);
    return { packet, action: "SENT", duplicates };
  }

  /**
   * Release a held delayed packet from NetworkSimulator.
   */
  releaseDelayedPacket(packetId) {
    const releasedPacket = this.delayEngine.releasePacket(packetId);
    return releasedPacket;
  }

  /**
   * Reorder a list of packets.
   */
  reorder(packets, customOrder = null) {
    return this.reorderEngine.reorderPackets(packets, customOrder);
  }

  /**
   * Get all currently delayed packets in the network channel.
   */
  getDelayedPackets() {
    return this.delayEngine.getDelayedPackets();
  }

  /**
   * Get transit log of all packets processed by the network simulator.
   */
  getTransitLog() {
    return [...this.transitLog];
  }

  /**
   * Reset network simulator state.
   */
  reset() {
    this.delayEngine.reset();
    this.transitLog = [];
  }
}

export const networkSimulator = new NetworkSimulator();
