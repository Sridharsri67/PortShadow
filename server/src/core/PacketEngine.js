import { Packet, PACKET_STATUS } from "../models/Packet.js";
import { sequenceManager } from "./SequenceManager.js";

export class PacketEngine {
  constructor() {
    /** @type {Map<string, Packet>} */
    this.packets = new Map();

    /** Auto-incrementing packet counter for default packet ID generation */
    this.packetCounter = 1;
  }

  /**
   * Create a simulated packet that inherits the active connection's incarnation ID and 4-tuple.
   */
  createPacket({
    connection,
    packetId = null,
    payload = "DATA",
    status = PACKET_STATUS.CREATED,
    createdAt = null
  }) {
    if (!connection) {
      throw new Error("Cannot create packet without a valid connection instance");
    }

    const id = packetId || `P-${this.packetCounter++}`;
    const seq = sequenceManager.getNextSequenceNumber(connection.connectionId, connection.sequenceNumber);

    // Create packet — INHERITS connection.incarnationId
    const packetOpts = {
      packetId: id,
      sourceIp: connection.sourceIp,
      sourcePort: connection.sourcePort,
      destinationIp: connection.destinationIp,
      destinationPort: connection.destinationPort,
      connectionId: connection.connectionId,
      incarnationId: connection.incarnationId,
      sequenceNumber: seq,
      payload,
      status
    };

    if (createdAt) {
      packetOpts.createdAt = createdAt;
    }

    const packet = new Packet(packetOpts);

    this.packets.set(id, packet);
    return packet;
  }

  /**
   * Get packet by packet ID.
   */
  getPacket(packetId) {
    return this.packets.get(packetId) || null;
  }

  /**
   * Get all packets created for a connection.
   */
  getPacketsForConnection(connectionId) {
    return Array.from(this.packets.values()).filter(
      (p) => p.connectionId === connectionId
    );
  }

  /**
   * Get all created packets.
   */
  getAllPackets() {
    return Array.from(this.packets.values());
  }

  /**
   * Update packet status and optional rejection reason.
   */
  updatePacketStatus(packetId, nextStatus, reason = null) {
    const packet = this.packets.get(packetId);
    if (!packet) {
      throw new Error(`Packet not found: ${packetId}`);
    }
    packet.setStatus(nextStatus, reason);
    return packet;
  }

  /**
   * Clear packet store and reset sequence tracking.
   */
  reset() {
    this.packets.clear();
    this.packetCounter = 1;
    sequenceManager.reset();
  }
}

export const packetEngine = new PacketEngine();
