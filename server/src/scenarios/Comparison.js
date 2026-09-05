import { connectionManager } from "../core/ConnectionManager.js";
import { packetEngine } from "../core/PacketEngine.js";
import { networkSimulator } from "../network/NetworkSimulator.js";
import { packetValidator } from "../core/PacketValidator.js";
import { tombstoneStore } from "../core/TombstoneStore.js";
import { NaiveValidator } from "../core/NaiveValidator.js";
import { ComparisonEngine } from "../core/ComparisonEngine.js";
import { PACKET_STATUS, REJECTION_REASONS } from "../models/Packet.js";

/**
 * Executes the Naive vs PortShadow Comparison scenario.
 * 
 * Demonstrates why an age-only filter fails:
 * 1. Stale Packet A2 (Age = 1000ms, Old Incarnation A7F9): Naive ACCEPT (False Acceptance / Vulnerability), PortShadow REJECT (Correct).
 * 2. Retransmitted Packet B2 (Age = 6000ms, Current Incarnation C29D): Naive REJECT (False Rejection / Packet Loss), PortShadow ACCEPT (Correct).
 */
export function runComparisonScenario({
  sourceIp = "10.0.0.1",
  sourcePort = 5000,
  destinationIp = "10.0.0.2",
  destinationPort = 8080,
  maxNaiveAgeMs = 5000
} = {}) {
  // 1. Reset simulation state
  connectionManager.reset();
  packetEngine.reset();
  networkSimulator.reset();
  packetValidator.reset();
  tombstoneStore.reset();

  const naiveVal = new NaiveValidator(connectionManager, maxNaiveAgeMs);
  const compEngine = new ComparisonEngine(packetValidator, naiveVal, connectionManager);

  const timeline = [];
  const nowMs = Date.now();

  // 2. Connection A Created (Incarnation A)
  const connA = connectionManager.createConnection({
    connectionId: "connection-A",
    sourceIp,
    sourcePort,
    destinationIp,
    destinationPort
  });
  timeline.push({ step: 1, event: "CONNECTION_A_CREATED", connection: connA.toJSON() });

  // 3. Packet A1 -> ACCEPTED by both
  const a1 = packetEngine.createPacket({ connection: connA, packetId: "A1", payload: "DATA-A1", createdAt: new Date(nowMs).toISOString() });
  networkSimulator.transmitPacket(a1, { delayMs: 0 });
  const compA1 = compEngine.compareSinglePacket(a1, nowMs);
  timeline.push({ step: 2, event: "PACKET_A1_PROCESSED", comparison: compA1 });

  // 4. Packet A2 -> DELAYED in network (Created at T=0, released at T=1000ms)
  const a2 = packetEngine.createPacket({ connection: connA, packetId: "A2", payload: "DATA-A2", createdAt: new Date(nowMs).toISOString() });
  networkSimulator.transmitPacket(a2, { delayMs: 5000 });
  timeline.push({ step: 3, event: "PACKET_A2_DELAYED", packet: a2.toJSON() });

  // 5. Packet A3 -> ACCEPTED by both
  const a3 = packetEngine.createPacket({ connection: connA, packetId: "A3", payload: "DATA-A3", createdAt: new Date(nowMs).toISOString() });
  networkSimulator.transmitPacket(a3, { delayMs: 0 });
  const compA3 = compEngine.compareSinglePacket(a3, nowMs);
  timeline.push({ step: 4, event: "PACKET_A3_PROCESSED", comparison: compA3 });

  // 6. Close Connection A -> Tombstone Created
  connectionManager.closeConnection("connection-A");
  timeline.push({ step: 5, event: "CONNECTION_A_CLOSED", connectionId: "connection-A" });

  // 7. Connection B Created on identical 4-tuple (Fresh Incarnation B)
  const connB = connectionManager.createConnection({
    connectionId: "connection-B",
    sourceIp,
    sourcePort,
    destinationIp,
    destinationPort
  });
  timeline.push({ step: 6, event: "CONNECTION_B_CREATED_RAPID_REUSE", connection: connB.toJSON() });

  // 8. Packet B1 -> ACCEPTED by both
  const b1 = packetEngine.createPacket({ connection: connB, packetId: "B1", payload: "DATA-B1", createdAt: new Date(nowMs + 500).toISOString() });
  networkSimulator.transmitPacket(b1, { delayMs: 0 });
  const compB1 = compEngine.compareSinglePacket(b1, nowMs + 500);
  timeline.push({ step: 7, event: "PACKET_B1_PROCESSED", comparison: compB1 });

  // 9. Release Delayed Packet A2 at T = +1000ms (Age = 1000ms <= 5000ms maxAge)
  const releasedA2 = networkSimulator.releaseDelayedPacket("A2");
  const compA2 = compEngine.compareSinglePacket(releasedA2, nowMs + 1000);
  timeline.push({ step: 8, event: "DELAYED_PACKET_A2_RELEASED", comparison: compA2 });

  // 10. Legitimate Retransmission B2 (Created 6000ms ago, Age = 6000ms > 5000ms maxAge, Current Incarnation C29D)
  const b2Retransmission = packetEngine.createPacket({
    connection: connB,
    packetId: "B2_RETRANSMIT",
    payload: "DATA-B2",
    createdAt: new Date(nowMs - 6000).toISOString()
  });
  networkSimulator.transmitPacket(b2Retransmission, { delayMs: 0 });
  const compB2 = compEngine.compareSinglePacket(b2Retransmission, nowMs);
  timeline.push({ step: 9, event: "RETRANSMITTED_PACKET_B2_PROCESSED", comparison: compB2 });

  // 11. Packet B3 -> ACCEPTED by both
  const b3 = packetEngine.createPacket({ connection: connB, packetId: "B3", payload: "DATA-B3", createdAt: new Date(nowMs + 1500).toISOString() });
  networkSimulator.transmitPacket(b3, { delayMs: 0 });
  const compB3 = compEngine.compareSinglePacket(b3, nowMs + 1500);
  timeline.push({ step: 10, event: "PACKET_B3_PROCESSED", comparison: compB3 });

  // Aggregate set metrics
  const setEval = compEngine.evaluateComparisonSet([
    { packet: a1, nowMs },
    { packet: a3, nowMs },
    { packet: b1, nowMs: nowMs + 500 },
    { packet: releasedA2, nowMs: nowMs + 1000 },
    { packet: b2Retransmission, nowMs },
    { packet: b3, nowMs: nowMs + 1500 }
  ]);

  return {
    summary: {
      connectionA: connA.toJSON(),
      connectionB: connB.toJSON(),
      falseAcceptanceDemonstrated: compA2.discrepancyType === "FALSE_ACCEPTANCE",
      falseRejectionDemonstrated: compB2.discrepancyType === "FALSE_REJECTION",
      naiveVulnerabilityCount: setEval.naive.falseAcceptancesCount,
      naiveFailureCount: setEval.naive.falseRejectionsCount
    },
    comparison: setEval,
    timeline
  };
}
