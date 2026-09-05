import { describe, it, expect, beforeEach } from "vitest";
import { ConnectionManager } from "../../server/src/core/ConnectionManager.js";
import { tombstoneStore } from "../../server/src/core/TombstoneStore.js";
import { CONNECTION_STATES } from "../../server/src/models/Connection.js";

describe("Tombstone & TombstoneStore (Phase 6)", () => {
  let cm;

  beforeEach(() => {
    cm = new ConnectionManager();
    cm.reset();
    tombstoneStore.reset();
  });

  it("should create a tombstone upon connection closure storing old incarnation ID and final sequence", () => {
    const conn = cm.createConnection({
      connectionId: "conn-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });

    const oldIncarnation = conn.incarnationId;
    cm.closeConnection("conn-A", 5000);

    expect(conn.state).toBe(CONNECTION_STATES.CLOSED);

    // Verify tombstone created in tombstoneStore
    const tombstone = tombstoneStore.getTombstoneByTuple("10.0.0.1", 5000, "10.0.0.2", 8080);
    expect(tombstone).toBeDefined();
    expect(tombstone.oldIncarnationId).toBe(oldIncarnation);
    expect(tombstone.shortIncarnationId).toBe(oldIncarnation.slice(0, 8));
    expect(tombstone.lastSequence).toBe(100);
    expect(tombstone.isExpired()).toBe(false);
  });

  it("should not block immediate endpoint/port reuse while preserving historical tombstone", () => {
    // 1. Create & close Connection A
    const connA = cm.createConnection({
      connectionId: "conn-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });
    cm.closeConnection("conn-A");

    // 2. Immediate reuse: create Connection B on exact same 4-tuple
    const connB = cm.createConnection({
      connectionId: "conn-B",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });

    expect(connB.state).toBe(CONNECTION_STATES.ESTABLISHED);
    expect(connB.incarnationId).not.toBe(connA.incarnationId);

    // Active connection lookup returns B
    const active = cm.getConnectionByTuple("10.0.0.1", 5000, "10.0.0.2", 8080);
    expect(active.connectionId).toBe("conn-B");

    // Tombstone lookup still records historical Connection A teardown!
    const tombstone = tombstoneStore.getTombstoneByTuple("10.0.0.1", 5000, "10.0.0.2", 8080);
    expect(tombstone.oldIncarnationId).toBe(connA.incarnationId);
  });

  it("should purge expired tombstones past TTL", async () => {
    const conn = cm.createConnection({ connectionId: "conn-short-ttl" });
    // Create tombstone with 10ms TTL
    cm.closeConnection("conn-short-ttl", 10);

    // Wait 20ms for expiration
    await new Promise((resolve) => setTimeout(resolve, 20));

    const tombstone = tombstoneStore.getTombstoneByTuple("10.0.0.1", 5000, "10.0.0.2", 8080);
    expect(tombstone).toBeNull();
  });
});
