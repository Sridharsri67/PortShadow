import { describe, it, expect, beforeEach } from "vitest";
import { ConnectionManager } from "../../server/src/core/ConnectionManager.js";
import { PacketEngine } from "../../server/src/core/PacketEngine.js";
import { PacketValidator } from "../../server/src/core/PacketValidator.js";
import { PACKET_STATUS, REJECTION_REASONS } from "../../server/src/models/Packet.js";

describe("PacketValidator — Receiver Multi-Tier Validation Pipeline (Phase 5)", () => {
  let cm;
  let packetEngine;
  let validator;

  beforeEach(() => {
    cm = new ConnectionManager();
    packetEngine = new PacketEngine();
    packetEngine.reset(); // Reset sequence numbers and packet store before each test!
    validator = new PacketValidator(cm);
  });

  it("Tier 1: should reject packet with UNKNOWN_CONNECTION when 4-tuple is not active", () => {
    const conn = cm.createConnection({ connectionId: "conn-A" });
    const packet = packetEngine.createPacket({ connection: conn, packetId: "A1" });

    // Close connection so 4-tuple is inactive
    cm.closeConnection("conn-A");

    const result = validator.validateAndProcess(packet);
    expect(result.status).toBe(PACKET_STATUS.REJECTED);
    expect(result.reason).toBe(REJECTION_REASONS.UNKNOWN_CONNECTION);
    expect(packet.status).toBe(PACKET_STATUS.REJECTED);
  });

  it("Tier 2: should reject stale packet with STALE_INCARNATION when incarnation ID mismatches active connection", () => {
    // 1. Connection A creates Packet A2
    const connA = cm.createConnection({
      connectionId: "conn-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000
    });
    const packetA2 = packetEngine.createPacket({ connection: connA, packetId: "A2" });

    // 2. Close Connection A & immediately reuse 4-tuple for Connection B
    cm.closeConnection("conn-A");
    const connB = cm.createConnection({
      connectionId: "conn-B",
      sourceIp: "10.0.0.1",
      sourcePort: 5000
    });

    // 3. Packet A2 arrives at Connection B's endpoint
    const result = validator.validateAndProcess(packetA2);
    expect(result.status).toBe(PACKET_STATUS.REJECTED);
    expect(result.reason).toBe(REJECTION_REASONS.STALE_INCARNATION);
    expect(packetA2.status).toBe(PACKET_STATUS.REJECTED);
    expect(packetA2.rejectionReason).toBe(REJECTION_REASONS.STALE_INCARNATION);
  });

  it("State Mutation Rule: should NOT alter active connection sequence state when a stale packet arrives", () => {
    const connA = cm.createConnection({ connectionId: "conn-A", sourcePort: 5000 });
    const packetA2 = packetEngine.createPacket({ connection: connA, packetId: "A2" });

    cm.closeConnection("conn-A");
    const connB = cm.createConnection({ connectionId: "conn-B", sourcePort: 5000 });

    const initialExpectedSeq = validator.getReceiverState(connB).expectedSeq;

    // Process stale packet A2
    validator.validateAndProcess(packetA2);

    const postState = validator.getReceiverState(connB);
    // Sequence state MUST remain unmutated!
    expect(postState.expectedSeq).toBe(initialExpectedSeq);
    expect(postState.acceptedSequences.size).toBe(0);
  });

  it("Tier 3: should ACCEPT current incarnation packet with matching sequence number", () => {
    const conn = cm.createConnection({ connectionId: "conn-accept" });
    const packet = packetEngine.createPacket({ connection: conn, packetId: "P1" });

    const result = validator.validateAndProcess(packet);
    expect(result.status).toBe(PACKET_STATUS.ACCEPTED);
    expect(packet.status).toBe(PACKET_STATUS.ACCEPTED);
  });

  it("Tier 3: should classify duplicate sequence numbers as DUPLICATE", () => {
    const conn = cm.createConnection({ connectionId: "conn-dup" });
    const packet = packetEngine.createPacket({ connection: conn, packetId: "P1" });

    validator.validateAndProcess(packet); // First time: ACCEPTED
    const dupResult = validator.validateAndProcess(packet); // Second time: DUPLICATE

    expect(dupResult.status).toBe(PACKET_STATUS.DUPLICATE);
    expect(packet.status).toBe(PACKET_STATUS.DUPLICATE);
  });

  it("Tier 3: should BUFFER out-of-order packets and auto-flush upon receiving missing sequence", () => {
    const conn = cm.createConnection({ connectionId: "conn-ooo" });
    const p1 = packetEngine.createPacket({ connection: conn, packetId: "P1" }); // Seq 100
    const p2 = packetEngine.createPacket({ connection: conn, packetId: "P2" }); // Seq 101
    const p3 = packetEngine.createPacket({ connection: conn, packetId: "P3" }); // Seq 102

    // 1. Deliver P1 (Seq 100) -> ACCEPTED
    validator.validateAndProcess(p1);
    expect(p1.status).toBe(PACKET_STATUS.ACCEPTED);

    // 2. Deliver P3 out-of-order (Seq 102) -> BUFFERED
    const resP3 = validator.validateAndProcess(p3);
    expect(resP3.status).toBe(PACKET_STATUS.BUFFERED);
    expect(p3.status).toBe(PACKET_STATUS.BUFFERED);

    // 3. Deliver missing P2 (Seq 101) -> ACCEPTED & Auto-Flushes P3 to ACCEPTED!
    const resP2 = validator.validateAndProcess(p2);
    expect(resP2.status).toBe(PACKET_STATUS.ACCEPTED);
    expect(p2.status).toBe(PACKET_STATUS.ACCEPTED);
    expect(p3.status).toBe(PACKET_STATUS.ACCEPTED); // P3 flushed!
  });
});
