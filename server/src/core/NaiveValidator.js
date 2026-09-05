import { PACKET_STATUS, REJECTION_REASONS } from "../models/Packet.js";
import { connectionManager as defaultConnectionManager } from "./ConnectionManager.js";

/**
 * Naive transport-layer packet validator.
 * 
 * Filters incoming traffic SOLELY based on 4-tuple lookup and packet age threshold.
 * Completely ignores incarnation IDs, rendering it vulnerable to stale packet injection
 * upon rapid 4-tuple endpoint reuse, while causing false rejections for legitimate
 * long-delay retransmissions.
 */
export class NaiveValidator {
  /**
   * @param {import("./ConnectionManager.js").ConnectionManager} [connectionMgr]
   * @param {number} [maxAgeMs=5000] Maximum allowed packet age in milliseconds
   */
  constructor(connectionMgr = defaultConnectionManager, maxAgeMs = 5000) {
    this.connectionManager = connectionMgr;
    this.maxAgeMs = maxAgeMs;
  }

  /**
   * Validate packet using naive age-based strategy.
   *
   * @param {import("../models/Packet.js").Packet} packet
   * @param {import("./ConnectionManager.js").ConnectionManager} [connMgr]
   * @param {number} [nowMs] Optional current timestamp override for testing
   * @returns {{ status: string, reason: string | null, activeConnectionId: string | null, ageMs: number }}
   */
  validateAndProcess(packet, connMgr = this.connectionManager, nowMs = Date.now()) {
    if (!packet) {
      throw new Error("Invalid null or undefined packet passed for naive validation");
    }

    const cm = connMgr || this.connectionManager;

    // 1. 4-Tuple Endpoint Lookup
    const activeConnection = cm.getConnectionByTuple(
      packet.sourceIp,
      packet.sourcePort,
      packet.destinationIp,
      packet.destinationPort
    );

    if (!activeConnection) {
      return {
        status: PACKET_STATUS.REJECTED,
        reason: REJECTION_REASONS.UNKNOWN_CONNECTION,
        activeConnectionId: null,
        ageMs: 0
      };
    }

    // 2. Naive Packet Age Calculation (Timestamp filter)
    const createdAtMs = new Date(packet.createdAt).getTime();
    const ageMs = Math.max(0, nowMs - createdAtMs);

    // Naive Decision: Accept if age <= maxAgeMs, else Reject (TOO_OLD)
    if (ageMs > this.maxAgeMs) {
      return {
        status: PACKET_STATUS.REJECTED,
        reason: "TOO_OLD",
        activeConnectionId: activeConnection.connectionId,
        ageMs
      };
    }

    // NAIVE VULNERABILITY: ACCEPTS packet because age is young, ignoring incarnation mismatch!
    return {
      status: PACKET_STATUS.ACCEPTED,
      reason: "WITHIN_AGE_THRESHOLD",
      activeConnectionId: activeConnection.connectionId,
      ageMs
    };
  }

  reset() {
    // No stateful receiver state needed for naive age validator
  }
}

export const naiveValidator = new NaiveValidator();
