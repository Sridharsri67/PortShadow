import { PACKET_STATUS } from "../models/Packet.js";

export class DelayEngine {
  constructor() {
    /** @type {Map<string, { packet: import("../models/Packet.js").Packet, delayMs: number, scheduledDeliveryTime: number }>} */
    this.delayedQueue = new Map();
  }

  /**
   * Hold a packet in the delay queue for a specified duration in milliseconds.
   */
  delayPacket(packet, delayMs = 1000) {
    if (!packet) {
      throw new Error("Cannot delay a null or undefined packet");
    }

    const scheduledDeliveryTime = Date.now() + delayMs;
    packet.deliveryAt = new ISOStringFromTimestamp(scheduledDeliveryTime);
    packet.setStatus(PACKET_STATUS.DELAYED);

    this.delayedQueue.set(packet.packetId, {
      packet,
      delayMs,
      scheduledDeliveryTime
    });

    return packet;
  }

  /**
   * Manually or automatically release a delayed packet into the receiver pipeline.
   */
  releasePacket(packetId) {
    const entry = this.delayedQueue.get(packetId);
    if (!entry) {
      throw new Error(`Delayed packet not found in queue: ${packetId}`);
    }

    const { packet } = entry;
    packet.setStatus(PACKET_STATUS.RELEASED);
    this.delayedQueue.delete(packetId);
    return packet;
  }

  /**
   * Get all currently delayed packets.
   */
  getDelayedPackets() {
    return Array.from(this.delayedQueue.values()).map((entry) => entry.packet);
  }

  /**
   * Check if a specific packet is currently delayed.
   */
  isDelayed(packetId) {
    return this.delayedQueue.has(packetId);
  }

  /**
   * Clear delay queue.
   */
  reset() {
    this.delayedQueue.clear();
  }
}

function ISOStringFromTimestamp(ts) {
  return new Date(ts).toISOString();
}

export const delayEngine = new DelayEngine();
