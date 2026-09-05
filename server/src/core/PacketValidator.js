import { PACKET_STATUS, REJECTION_REASONS } from "../models/Packet.js";
import { connectionManager as defaultConnectionManager } from "./ConnectionManager.js";

export class PacketValidator {
  /**
   * @param {import("./ConnectionManager.js").ConnectionManager} [connectionMgr] 
   */
  constructor(connectionMgr = defaultConnectionManager) {
    this.connectionManager = connectionMgr;
    /** @type {Map<string, { expectedSeq: number, acceptedSequences: Set<number>, buffer: Map<number, import("../models/Packet.js").Packet> }>} */
    this.receiverStates = new Map();
  }

  /**
   * Get or initialize receiver transport state for a connection.
   */
  getReceiverState(connection) {
    if (!this.receiverStates.has(connection.connectionId)) {
      this.receiverStates.set(connection.connectionId, {
        expectedSeq: connection.sequenceNumber,
        acceptedSequences: new Set(),
        buffer: new Map()
      });
    }
    return this.receiverStates.get(connection.connectionId);
  }

  /**
   * Execute multi-tier receiver validation pipeline for an incoming packet.
   *
   * @param {import("../models/Packet.js").Packet} packet
   * @param {import("./ConnectionManager.js").ConnectionManager} [connMgr]
   * @returns {{ status: string, reason: string | null, activeConnectionId: string | null }}
   */
  validateAndProcess(packet, connMgr = this.connectionManager) {
    if (!packet) {
      throw new Error("Invalid null or undefined packet passed for validation");
    }

    const cm = connMgr || this.connectionManager;

    // ---------------------------------------------------------------
    // Tier 1: 4-Tuple Lookup
    // ---------------------------------------------------------------
    const activeConnection = cm.getConnectionByTuple(
      packet.sourceIp,
      packet.sourcePort,
      packet.destinationIp,
      packet.destinationPort
    );

    if (!activeConnection) {
      packet.setStatus(PACKET_STATUS.REJECTED, REJECTION_REASONS.UNKNOWN_CONNECTION);
      return {
        status: PACKET_STATUS.REJECTED,
        reason: REJECTION_REASONS.UNKNOWN_CONNECTION,
        activeConnectionId: null
      };
    }

    // ---------------------------------------------------------------
    // Tier 2: Incarnation ID Verification
    // ---------------------------------------------------------------
    if (packet.incarnationId !== activeConnection.incarnationId) {
      // CRITICAL INVARIANT: DO NOT MUTATE activeConnection state!
      packet.setStatus(PACKET_STATUS.REJECTED, REJECTION_REASONS.STALE_INCARNATION);
      return {
        status: PACKET_STATUS.REJECTED,
        reason: REJECTION_REASONS.STALE_INCARNATION,
        activeConnectionId: activeConnection.connectionId
      };
    }

    // ---------------------------------------------------------------
    // Tier 3: Sequence & Ordering Check
    // ---------------------------------------------------------------
    const state = this.getReceiverState(activeConnection);
    const seq = packet.sequenceNumber;

    // Duplicate Check: Already in accepted set or below expected window
    if (state.acceptedSequences.has(seq) || seq < state.expectedSeq) {
      packet.setStatus(PACKET_STATUS.DUPLICATE, "ALREADY_RECEIVED");
      return {
        status: PACKET_STATUS.DUPLICATE,
        reason: "ALREADY_RECEIVED",
        activeConnectionId: activeConnection.connectionId
      };
    }

    // Out-of-Order Check: Future sequence number ahead of expected
    if (seq > state.expectedSeq) {
      packet.setStatus(PACKET_STATUS.BUFFERED, "OUT_OF_ORDER");
      state.buffer.set(seq, packet);
      return {
        status: PACKET_STATUS.BUFFERED,
        reason: "OUT_OF_ORDER",
        activeConnectionId: activeConnection.connectionId
      };
    }

    // Expected Sequence Matched -> ACCEPT
    packet.setStatus(PACKET_STATUS.ACCEPTED, null);
    state.acceptedSequences.add(seq);
    state.expectedSeq = seq + 1;

    // Flush any buffered consecutive out-of-order packets
    this.flushBuffer(state);

    return {
      status: PACKET_STATUS.ACCEPTED,
      reason: "CURRENT_INCARNATION",
      activeConnectionId: activeConnection.connectionId
    };
  }

  /**
   * Flush consecutive buffered packets if sequence gaps are filled.
   */
  flushBuffer(state) {
    while (state.buffer.has(state.expectedSeq)) {
      const bufferedPacket = state.buffer.get(state.expectedSeq);
      state.buffer.delete(state.expectedSeq);

      bufferedPacket.setStatus(PACKET_STATUS.ACCEPTED, null);
      state.acceptedSequences.add(state.expectedSeq);
      state.expectedSeq += 1;
    }
  }

  /**
   * Reset validator receiver states.
   */
  reset() {
    this.receiverStates.clear();
  }
}

export const packetValidator = new PacketValidator();
