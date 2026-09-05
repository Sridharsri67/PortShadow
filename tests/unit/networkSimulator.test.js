import { describe, it, expect, beforeEach } from "vitest";
import { ConnectionManager } from "../../server/src/core/ConnectionManager.js";
import { PacketEngine } from "../../server/src/core/PacketEngine.js";
import { NetworkSimulator } from "../../server/src/network/NetworkSimulator.js";
import { PACKET_STATUS } from "../../server/src/models/Packet.js";

describe("NetworkSimulator & Engines (Phase 4)", () => {
  let cm;
  let packetEngine;
  let net;

  beforeEach(() => {
    cm = new ConnectionManager();
    packetEngine = new PacketEngine();
    net = new NetworkSimulator();
  });

  it("should delay a packet and release it on command", () => {
    const conn = cm.createConnection({ connectionId: "conn-A" });
    const packet = packetEngine.createPacket({ connection: conn, packetId: "A2" });

    // Delay packet
    const result = net.transmitPacket(packet, { delayMs: 5000 });
    expect(result.action).toBe("DELAYED");
    expect(packet.status).toBe(PACKET_STATUS.DELAYED);
    expect(net.getDelayedPackets()).toHaveLength(1);

    // Release packet
    const released = net.releaseDelayedPacket("A2");
    expect(released.packetId).toBe("A2");
    expect(released.status).toBe(PACKET_STATUS.RELEASED);
    expect(net.getDelayedPackets()).toHaveLength(0);
  });

  it("should reorder packet sequences cleanly", () => {
    const conn = cm.createConnection({ connectionId: "conn-A" });
    const p1 = packetEngine.createPacket({ connection: conn, packetId: "A1" });
    const p2 = packetEngine.createPacket({ connection: conn, packetId: "A2" });
    const p3 = packetEngine.createPacket({ connection: conn, packetId: "A3" });

    const original = [p1, p2, p3];
    // Deliver in order: A1 (idx 0), A3 (idx 2), A2 (idx 1)
    const reordered = net.reorder(original, [0, 2, 1]);

    expect(reordered.map((p) => p.packetId)).toEqual(["A1", "A3", "A2"]);
  });

  it("should generate a duplicate packet copy retaining identical incarnation ID and sequence number", () => {
    const conn = cm.createConnection({ connectionId: "conn-B" });
    const packet = packetEngine.createPacket({ connection: conn, packetId: "B1" });

    const result = net.transmitPacket(packet, { duplicate: true });
    expect(result.duplicates).toHaveLength(1);

    const dup = result.duplicates[0];
    expect(dup.packetId).toBe("B1-DUP");
    expect(dup.incarnationId).toBe(packet.incarnationId);
    expect(dup.sequenceNumber).toBe(packet.sequenceNumber);
    expect(dup.status).toBe(PACKET_STATUS.DUPLICATE);
  });

  it("should drop a packet simulating network loss", () => {
    const conn = cm.createConnection({ connectionId: "conn-C" });
    const packet = packetEngine.createPacket({ connection: conn, packetId: "C1" });

    const result = net.transmitPacket(packet, { drop: true });
    expect(result.action).toBe("DROPPED");
    expect(packet.status).toBe(PACKET_STATUS.DROPPED);
  });
});
