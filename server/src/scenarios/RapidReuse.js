import { connectionManager } from "../core/ConnectionManager.js";
import { packetEngine } from "../core/PacketEngine.js";
import { networkSimulator } from "../network/NetworkSimulator.js";
import { packetValidator } from "../core/PacketValidator.js";
import { tombstoneStore } from "../core/TombstoneStore.js";
import { PACKET_STATUS, REJECTION_REASONS } from "../models/Packet.js";

/**
 * Executes the master Rapid Reuse Core MVP simulation scenario.
 */
export function runRapidReuseScenario({
  sourceIp = "10.0.0.1",
  sourcePort = 5000,
  destinationIp = "10.0.0.2",
  destinationPort = 8080,
  delayMs = 5000
} = {}) {
  // 1. Reset simulation state
  connectionManager.reset();
  packetEngine.reset();
  networkSimulator.reset();
  packetValidator.reset();

  const timeline = [];

  // 2. Create Connection A (Incarnation A)
  const connA = connectionManager.createConnection({
    connectionId: "connection-A",
    sourceIp,
    sourcePort,
    destinationIp,
    destinationPort
  });
  timeline.push({ step: 1, event: "CONNECTION_A_CREATED", connection: connA.toJSON() });

  // 3. Create and transmit Packet A1 -> ACCEPTED
  const a1 = packetEngine.createPacket({ connection: connA, packetId: "A1", payload: "DATA-A1" });
  networkSimulator.transmitPacket(a1, { delayMs: 0 });
  const valA1 = packetValidator.validateAndProcess(a1);
  timeline.push({ step: 2, event: "PACKET_A1_PROCESSED", packet: a1.toJSON(), result: valA1 });

  // 4. Create Packet A2 -> DELAYED in NetworkSimulator
  const a2 = packetEngine.createPacket({ connection: connA, packetId: "A2", payload: "DATA-A2" });
  networkSimulator.transmitPacket(a2, { delayMs });
  timeline.push({ step: 3, event: "PACKET_A2_DELAYED", packet: a2.toJSON() });

  // 5. Create Packet A3 -> ACCEPTED
  const a3 = packetEngine.createPacket({ connection: connA, packetId: "A3", payload: "DATA-A3" });
  networkSimulator.transmitPacket(a3, { delayMs: 0 });
  const valA3 = packetValidator.validateAndProcess(a3);
  timeline.push({ step: 4, event: "PACKET_A3_PROCESSED", packet: a3.toJSON(), result: valA3 });

  // 6. Close Connection A -> Tombstone Created & 4-Tuple Freed
  connectionManager.closeConnection("connection-A");
  const tombstone = tombstoneStore.getTombstoneByTuple(sourceIp, sourcePort, destinationIp, destinationPort);
  timeline.push({ step: 5, event: "CONNECTION_A_CLOSED", connectionId: "connection-A", tombstone: tombstone ? tombstone.toJSON() : null });

  // 7. Immediately bind Connection B on identical 4-tuple -> Fresh Incarnation B
  const connB = connectionManager.createConnection({
    connectionId: "connection-B",
    sourceIp,
    sourcePort,
    destinationIp,
    destinationPort
  });
  timeline.push({ step: 6, event: "CONNECTION_B_CREATED_RAPID_REUSE", connection: connB.toJSON() });

  // 8. Create & transmit Packet B1 -> ACCEPTED
  const b1 = packetEngine.createPacket({ connection: connB, packetId: "B1", payload: "DATA-B1" });
  networkSimulator.transmitPacket(b1, { delayMs: 0 });
  const valB1 = packetValidator.validateAndProcess(b1);
  timeline.push({ step: 7, event: "PACKET_B1_PROCESSED", packet: b1.toJSON(), result: valB1 });

  // 9. Release Delayed Packet A2 into Connection B's active endpoint -> REJECTED (STALE_INCARNATION)
  const releasedA2 = networkSimulator.releaseDelayedPacket("A2");
  const valA2 = packetValidator.validateAndProcess(releasedA2);
  timeline.push({ step: 8, event: "DELAYED_PACKET_A2_RELEASED", packet: releasedA2.toJSON(), result: valA2 });

  // 10. Create & transmit Packet B2 -> ACCEPTED
  const b2 = packetEngine.createPacket({ connection: connB, packetId: "B2", payload: "DATA-B2" });
  networkSimulator.transmitPacket(b2, { delayMs: 0 });
  const valB2 = packetValidator.validateAndProcess(b2);
  timeline.push({ step: 9, event: "PACKET_B2_PROCESSED", packet: b2.toJSON(), result: valB2 });

  return {
    summary: {
      connectionA: connA.toJSON(),
      connectionB: connB.toJSON(),
      delayedPacket: releasedA2.toJSON(),
      staleIsolationVerified: releasedA2.status === PACKET_STATUS.REJECTED && releasedA2.rejectionReason === REJECTION_REASONS.STALE_INCARNATION,
      connectionBTrafficContinued: b2.status === PACKET_STATUS.ACCEPTED
    },
    timeline
  };
}
