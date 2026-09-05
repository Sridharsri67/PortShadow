import { describe, it, expect, beforeEach } from "vitest";
import { ConnectionManager } from "../../server/src/core/ConnectionManager.js";
import { PacketEngine } from "../../server/src/core/PacketEngine.js";
import { SequenceManager } from "../../server/src/core/SequenceManager.js";
import { PACKET_STATUS, REJECTION_REASONS } from "../../server/src/models/Packet.js";

describe("PacketEngine & SequenceManager (Phase 3)", () => {
  let cm;
  let engine;

  beforeEach(() => {
    cm = new ConnectionManager();
    engine = new PacketEngine();
  });

  it("should create a packet inheriting the active connection's 128-bit incarnation ID and 4-tuple", () => {
    const connA = cm.createConnection({
      connectionId: "connection-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });

    const packet = engine.createPacket({
      connection: connA,
      packetId: "A1",
      payload: "DATA-1"
    });

    expect(packet.packetId).toBe("A1");
    expect(packet.incarnationId).toBe(connA.incarnationId); // Inherits connection incarnation!
    expect(packet.sourceIp).toBe("10.0.0.1");
    expect(packet.sourcePort).toBe(5000);
    expect(packet.sequenceNumber).toBe(100);
    expect(packet.status).toBe(PACKET_STATUS.CREATED);
  });

  it("should auto-increment sequence numbers for subsequent packets on the same connection", () => {
    const conn = cm.createConnection({ connectionId: "conn-1" });

    const p1 = engine.createPacket({ connection: conn, packetId: "P1" });
    const p2 = engine.createPacket({ connection: conn, packetId: "P2" });
    const p3 = engine.createPacket({ connection: conn, packetId: "P3" });

    expect(p1.sequenceNumber).toBe(100);
    expect(p2.sequenceNumber).toBe(101);
    expect(p3.sequenceNumber).toBe(102);
  });

  it("should properly assign distinct incarnation IDs to packets across rapid endpoint reuse", () => {
    // 1. Connection A creates A1, A2, A3
    const connA = cm.createConnection({
      connectionId: "connection-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000
    });
    const a1 = engine.createPacket({ connection: connA, packetId: "A1" });
    const a2 = engine.createPacket({ connection: connA, packetId: "A2" });

    // 2. Close Connection A & immediately reuse 4-tuple for Connection B
    cm.closeConnection("connection-A");
    const connB = cm.createConnection({
      connectionId: "connection-B",
      sourceIp: "10.0.0.1",
      sourcePort: 5000
    });
    const b1 = engine.createPacket({ connection: connB, packetId: "B1" });
    const b2 = engine.createPacket({ connection: connB, packetId: "B2" });

    // Packets inherit respective connection incarnations
    expect(a1.incarnationId).toBe(connA.incarnationId);
    expect(a2.incarnationId).toBe(connA.incarnationId);

    expect(b1.incarnationId).toBe(connB.incarnationId);
    expect(b2.incarnationId).toBe(connB.incarnationId);

    // Incarnations differ despite identical 4-tuples!
    expect(a2.incarnationId).not.toBe(b1.incarnationId);
  });

  it("should update packet status and rejection reason cleanly", () => {
    const conn = cm.createConnection({ connectionId: "conn-X" });
    const pkt = engine.createPacket({ connection: conn, packetId: "PX" });

    pkt.setStatus(PACKET_STATUS.REJECTED, REJECTION_REASONS.STALE_INCARNATION);

    expect(pkt.status).toBe(PACKET_STATUS.REJECTED);
    expect(pkt.rejectionReason).toBe(REJECTION_REASONS.STALE_INCARNATION);
  });
});
