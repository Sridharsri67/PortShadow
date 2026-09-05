import { PACKET_STATUS } from "../models/Packet.js";

export class DropEngine {
  /**
   * Drop a packet simulating network packet loss.
   * @param {import("../models/Packet.js").Packet} packet 
   */
  dropPacket(packet) {
    if (!packet) {
      throw new Error("Cannot drop a null packet");
    }

    packet.setStatus(PACKET_STATUS.DROPPED);
    return packet;
  }
}

export const dropEngine = new DropEngine();
