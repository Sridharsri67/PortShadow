import { connectionManager } from "../core/ConnectionManager.js";
import { packetEngine } from "../core/PacketEngine.js";
import { networkSimulator } from "../network/NetworkSimulator.js";
import { packetValidator } from "../core/PacketValidator.js";
import { PACKET_STATUS } from "../models/Packet.js";

/**
 * Runs Duplicate Packet scenario.
 * Demonstrates packet B1 arriving twice. First arrival is ACCEPTED, second arrival is classified
 * as DUPLICATE and deduplicated without triggering false stale incarnation rejections.
 */
export function runDuplicatePacketScenario({
  sourceIp = "10.0.0.1",
  sourcePort = 5000,
  destinationIp = "10.0.0.2",
  destinationPort = 8080
} = {}) {
  connectionManager.reset();
  packetEngine.reset();
  networkSimulator.reset();
  packetValidator.reset();

  const timeline = [];

  // 1. Establish Connection B
  const connB = connectionManager.createConnection({
    connectionId: "connection-B",
    sourceIp,
    sourcePort,
    destinationIp,
    destinationPort
  });
  timeline.push({ step: 1, event: "CONNECTION_CREATED", connection: connB.toJSON() });

  // 2. Create B1 & transmit with duplicate = true
  const b1 = packetEngine.createPacket({ connection: connB, packetId: "B1", payload: "DATA-B1" });
  const txResult = networkSimulator.transmitPacket(b1, { duplicate: true });
  timeline.push({ step: 2, event: "PACKET_B1_DUPLICATED_BY_NETWORK", packet: b1.toJSON(), duplicates: txResult.duplicates });

  // 3. Deliver original B1 -> ACCEPTED
  const valB1 = packetValidator.validateAndProcess(b1);
  timeline.push({ step: 3, event: "ORIGINAL_B1_PROCESSED", packet: b1.toJSON(), result: valB1 });

  // 4. Deliver duplicate copy B1-DUP -> DUPLICATE
  const dupCopy = txResult.duplicates[0];
  const valDup = packetValidator.validateAndProcess(dupCopy);
  timeline.push({ step: 4, event: "DUPLICATE_B1_PROCESSED", packet: dupCopy.toJSON(), result: valDup });

  return {
    summary: {
      connection: connB.toJSON(),
      originalPacket: b1.toJSON(),
      duplicatePacket: dupCopy.toJSON(),
      deduplicated: b1.status === PACKET_STATUS.ACCEPTED && dupCopy.status === PACKET_STATUS.DUPLICATE
    },
    timeline
  };
}
