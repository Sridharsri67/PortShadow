import { Packet, PACKET_STATUS } from "../models/Packet.js";

export class DuplicateEngine {
  /**
   * Create an identical copy of a packet simulating network duplicate transmission.
   * @param {Packet} packet 
   */
  duplicatePacket(packet) {
    if (!packet) {
      throw new Error("Cannot duplicate a null packet");
    }

    const copy = new Packet({
      packetId: `${packet.packetId}-DUP`,
      sourceIp: packet.sourceIp,
      sourcePort: packet.sourcePort,
      destinationIp: packet.destinationIp,
      destinationPort: packet.destinationPort,
      connectionId: packet.connectionId,
      incarnationId: packet.incarnationId, // Retains identical incarnation ID!
      sequenceNumber: packet.sequenceNumber, // Retains identical sequence number!
      payload: packet.payload,
      createdAt: new Date().toISOString(),
      status: PACKET_STATUS.DUPLICATE
    });

    return copy;
  }
}

export const duplicateEngine = new DuplicateEngine();
