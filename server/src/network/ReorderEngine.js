export class ReorderEngine {
  /**
   * Reorder a list of packets according to custom indices or sequence permutation.
   * @param {Array<import("../models/Packet.js").Packet>} packets 
   * @param {Array<number>} customOrder - Array of 0-based indices detailing desired delivery order.
   */
  reorderPackets(packets, customOrder = null) {
    if (!Array.isArray(packets)) {
      throw new Error("Packets parameter must be an array");
    }

    if (!customOrder) {
      // Default reorder: reverse array order
      return [...packets].reverse();
    }

    if (customOrder.length !== packets.length) {
      throw new Error("Custom order array length must match packets array length");
    }

    return customOrder.map((idx) => {
      if (idx < 0 || idx >= packets.length) {
        throw new Error(`Invalid index in custom order: ${idx}`);
      }
      return packets[idx];
    });
  }
}

export const reorderEngine = new ReorderEngine();
