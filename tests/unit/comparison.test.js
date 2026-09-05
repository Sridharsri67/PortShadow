import { describe, it, expect, beforeEach } from "vitest";
import { ConnectionManager } from "../../server/src/core/ConnectionManager.js";
import { PacketEngine } from "../../server/src/core/PacketEngine.js";
import { PacketValidator } from "../../server/src/core/PacketValidator.js";
import { NaiveValidator } from "../../server/src/core/NaiveValidator.js";
import { ComparisonEngine } from "../../server/src/core/ComparisonEngine.js";
import { runComparisonScenario } from "../../server/src/scenarios/Comparison.js";
import { PACKET_STATUS, REJECTION_REASONS } from "../../server/src/models/Packet.js";

describe("Phase 8 — Naive vs PortShadow Comparison Engine", () => {
  let connectionManager;
  let packetEngine;
  let portShadowValidator;
  let naiveValidator;
  let comparisonEngine;

  beforeEach(() => {
    connectionManager = new ConnectionManager();
    packetEngine = new PacketEngine();
    portShadowValidator = new PacketValidator(connectionManager);
    naiveValidator = new NaiveValidator(connectionManager, 5000);
    comparisonEngine = new ComparisonEngine(portShadowValidator, naiveValidator, connectionManager);
  });

  it("should demonstrate Naive False Acceptance (Security Vulnerability) on stale packet", () => {
    // 1. Connection A created and closed
    const connA = connectionManager.createConnection({
      connectionId: "conn-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });
    const packetA2 = packetEngine.createPacket({
      connection: connA,
      packetId: "A2",
      createdAt: new Date().toISOString()
    });
    connectionManager.closeConnection("conn-A");

    // 2. Connection B created on identical 4-tuple
    const connB = connectionManager.createConnection({
      connectionId: "conn-B",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });

    // 3. Evaluate packet A2 (Age = 1000ms, Incarnation A) against active Connection B (Incarnation B)
    const nowMs = Date.now() + 1000;
    const comparison = comparisonEngine.compareSinglePacket(packetA2, nowMs, connectionManager);

    expect(comparison.portShadow.status).toBe(PACKET_STATUS.REJECTED);
    expect(comparison.portShadow.reason).toBe(REJECTION_REASONS.STALE_INCARNATION);

    expect(comparison.naive.status).toBe(PACKET_STATUS.ACCEPTED);
    expect(comparison.naive.reason).toBe("WITHIN_AGE_THRESHOLD");

    expect(comparison.discrepancyType).toBe("FALSE_ACCEPTANCE");
  });

  it("should demonstrate Naive False Rejection (Reliability Failure) on legitimate long-delay packet", () => {
    // 1. Connection B created
    const connB = connectionManager.createConnection({
      connectionId: "conn-B",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });

    // 2. Legitimate retransmitted packet B2 created 6 seconds ago (Age = 6000ms > 5000ms threshold)
    const nowMs = Date.now();
    const packetB2 = packetEngine.createPacket({
      connection: connB,
      packetId: "B2_RETRANSMIT",
      createdAt: new Date(nowMs - 6000).toISOString()
    });

    // 3. Evaluate packet B2 against Connection B
    const comparison = comparisonEngine.compareSinglePacket(packetB2, nowMs, connectionManager);

    expect(comparison.portShadow.status).toBe(PACKET_STATUS.ACCEPTED);
    expect(comparison.portShadow.reason).toBe("CURRENT_INCARNATION");

    expect(comparison.naive.status).toBe(PACKET_STATUS.REJECTED);
    expect(comparison.naive.reason).toBe("TOO_OLD");

    expect(comparison.discrepancyType).toBe("FALSE_REJECTION");
  });

  it("should execute full runComparisonScenario and produce correct summary & discrepancies", () => {
    const result = runComparisonScenario();

    expect(result.summary.falseAcceptanceDemonstrated).toBe(true);
    expect(result.summary.falseRejectionDemonstrated).toBe(true);
    expect(result.summary.naiveVulnerabilityCount).toBeGreaterThanOrEqual(1);
    expect(result.summary.naiveFailureCount).toBeGreaterThanOrEqual(1);
    expect(result.comparison.discrepanciesCount).toBeGreaterThanOrEqual(2);
    expect(result.timeline.length).toBeGreaterThan(0);
  });
});
