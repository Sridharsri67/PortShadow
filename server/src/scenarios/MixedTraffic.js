import { connectionManager } from "../core/ConnectionManager.js";
import { packetEngine } from "../core/PacketEngine.js";
import { networkSimulator } from "../network/NetworkSimulator.js";
import { packetValidator } from "../core/PacketValidator.js";
import { tombstoneStore } from "../core/TombstoneStore.js";
import { PACKET_STATUS, REJECTION_REASONS } from "../models/Packet.js";

/**
 * Runs Mixed Traffic Master Scenario combining all transport edge-cases:
 *  - Incarnation A active traffic
 *  - Delayed packet A2
 *  - Teardown of Connection A
 *  - Rapid 4-tuple reuse by Connection B
 *  - Legitimate B1 retransmissions
 *  - Out-of-order B2/B3 delivery
 *  - Duplicate B4 filtering
 *  - Stale A2 rejection
 */
export function runMixedTrafficScenario({
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

  // Phase 1: Connection A
  const connA = connectionManager.createConnection({ connectionId: "conn-A", sourceIp, sourcePort, destinationIp, destinationPort });
  const a1 = packetEngine.createPacket({ connection: connA, packetId: "A1" });
  packetValidator.validateAndProcess(a1);

  // A2 Delayed
  const a2 = packetEngine.createPacket({ connection: connA, packetId: "A2" });
  networkSimulator.transmitPacket(a2, { delayMs: 5000 });

  // Close Connection A
  connectionManager.closeConnection("conn-A");
  timeline.push({ step: 1, event: "CONN_A_CLOSED_TOMBSTONE_CREATED", connA: connA.toJSON() });

  // Phase 2: Rapid Reuse Connection B
  const connB = connectionManager.createConnection({ connectionId: "conn-B", sourceIp, sourcePort, destinationIp, destinationPort });
  timeline.push({ step: 2, event: "CONN_B_REUSED_ENDPOINT", connB: connB.toJSON() });

  // Retransmit B1
  const b1Loss = packetEngine.createPacket({ connection: connB, packetId: "B1" });
  networkSimulator.transmitPacket(b1Loss, { drop: true });
  const b1Retransmit = packetEngine.createPacket({ connection: connB, packetId: "B1" });
  b1Retransmit.sequenceNumber = b1Loss.sequenceNumber;
  packetValidator.validateAndProcess(b1Retransmit);
  timeline.push({ step: 3, event: "B1_RETRANSMITTED_ACCEPTED", b1: b1Retransmit.toJSON() });

  // Out-of-order B2 & B3
  const b2 = packetEngine.createPacket({ connection: connB, packetId: "B2" });
  const b3 = packetEngine.createPacket({ connection: connB, packetId: "B3" });
  packetValidator.validateAndProcess(b3); // OOO -> BUFFERED
  packetValidator.validateAndProcess(b2); // Missing -> ACCEPTED & flushes B3!
  timeline.push({ step: 4, event: "B2_B3_OUT_OF_ORDER_RESOLVED", b2: b2.toJSON(), b3: b3.toJSON() });

  // Release Delayed A2 -> REJECTED (STALE_INCARNATION)
  const releasedA2 = networkSimulator.releaseDelayedPacket("A2");
  packetValidator.validateAndProcess(releasedA2);
  timeline.push({ step: 5, event: "STALE_A2_REJECTED", a2: releasedA2.toJSON() });

  // Duplicate B4
  const b4 = packetEngine.createPacket({ connection: connB, packetId: "B4" });
  const txB4 = networkSimulator.transmitPacket(b4, { duplicate: true });
  packetValidator.validateAndProcess(b4); // ACCEPTED
  packetValidator.validateAndProcess(txB4.duplicates[0]); // DUPLICATE
  timeline.push({ step: 6, event: "B4_DUPLICATE_FILTERED", b4: b4.toJSON(), dupB4: txB4.duplicates[0].toJSON() });

  return {
    summary: {
      connA: connA.toJSON(),
      connB: connB.toJSON(),
      staleA2Rejected: releasedA2.status === PACKET_STATUS.REJECTED && releasedA2.rejectionReason === REJECTION_REASONS.STALE_INCARNATION,
      retransmissionAccepted: b1Retransmit.status === PACKET_STATUS.ACCEPTED,
      reorderResolved: b2.status === PACKET_STATUS.ACCEPTED && b3.status === PACKET_STATUS.ACCEPTED,
      duplicateFiltered: txB4.duplicates[0].status === PACKET_STATUS.DUPLICATE
    },
    timeline
  };
}
