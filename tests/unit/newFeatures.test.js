import { describe, it, expect, beforeEach } from "vitest";
import { connectionManager } from "../../server/src/core/ConnectionManager.js";
import { packetEngine } from "../../server/src/core/PacketEngine.js";
import { networkSimulator } from "../../server/src/network/NetworkSimulator.js";
import { packetValidator } from "../../server/src/core/PacketValidator.js";
import { tombstoneStore, TombstoneStore } from "../../server/src/core/TombstoneStore.js";
import { VirtualClock } from "../../server/src/core/Clock.js";
import { SeedableRandom } from "../../server/src/core/Random.js";
import { PacketEventRepository } from "../../server/src/database/index.js";

describe("New Architectural Core Features", () => {
  beforeEach(() => {
    connectionManager.reset();
    packetEngine.reset();
    networkSimulator.reset();
    packetValidator.reset();
    tombstoneStore.reset();
  });

  it("1. Explicit Connection Generation Concept — increments numeric generation on 4-tuple reuse", () => {
    const conn1 = connectionManager.createConnection({
      connectionId: "conn-1",
      sourceIp: "10.0.0.1",
      sourcePort: 5000
    });
    expect(conn1.generation).toBe(1);

    connectionManager.closeConnection("conn-1");

    const conn2 = connectionManager.createConnection({
      connectionId: "conn-2",
      sourceIp: "10.0.0.1",
      sourcePort: 5000
    });
    expect(conn2.generation).toBe(2);
    expect(conn2.incarnationId).not.toBe(conn1.incarnationId);
  });

  it("2. Atomic State Mutation — stale packet rejection leaves connection state 100% untouched", () => {
    const connA = connectionManager.createConnection({ connectionId: "conn-A" });
    const pktA1 = packetEngine.createPacket({ connection: connA, packetId: "A1" });
    connectionManager.closeConnection("conn-A");

    const connB = connectionManager.createConnection({ connectionId: "conn-B" });
    const initialExpectedSeq = packetValidator.getReceiverState(connB).expectedSeq;

    // Validate stale pktA1 against connB
    const valResult = packetValidator.validateAndProcess(pktA1);

    expect(valResult.status).toBe("REJECTED");
    expect(valResult.reason).toBe("STALE_INCARNATION");

    // Enforce Invariant: Receiver sequence state remains unchanged
    const afterExpectedSeq = packetValidator.getReceiverState(connB).expectedSeq;
    expect(afterExpectedSeq).toBe(initialExpectedSeq);
  });

  it("3. Packet Provenance Record — stores generation & rejection reason in provenance database", async () => {
    const conn = connectionManager.createConnection({ connectionId: "conn-prov", generation: 3 });
    const pkt = packetEngine.createPacket({ connection: conn, packetId: "P-PROV" });
    packetValidator.validateAndProcess(pkt);

    const records = await PacketEventRepository.getProvenanceRecords({ packetId: "P-PROV" });
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].generation).toBe(3);
    expect(records[0].status).toBe("ACCEPTED");
  });

  it("4. Robust Tombstone Cleanup — cleans expired tombstones reliably via sweeper", () => {
    const vClock = new VirtualClock(1000000);
    const store = new TombstoneStore(vClock);

    const conn = { connectionId: "c-tomb", tupleKey: "1.1.1.1:80->2.2.2.2:80", incarnationId: "inc-1", sequenceNumber: 100 };
    const tb = store.createTombstone(conn, 3000);

    expect(store.getAllTombstones().length).toBe(1);

    // Advance Virtual Clock past TTL (3000ms)
    vClock.advance(3500);

    // Sweeper / Access triggers expiration cleanup
    expect(store.getAllTombstones().length).toBe(0);
    expect(store.getTombstone(tb.tombstoneId)).toBeNull();

    store.reset();
  });

  it("5. Configurable Clock Abstraction — VirtualClock controls time deterministically", () => {
    const clock = new VirtualClock(5000);
    expect(clock.now()).toBe(5000);
    clock.advance(2500);
    expect(clock.now()).toBe(7500);
    expect(clock.isoNow()).toBe(new Date(7500).toISOString());
  });

  it("6. Deterministic Simulation Seeds — SeedableRandom produces 100% reproducible sequence", () => {
    const rng1 = new SeedableRandom(1337);
    const seq1 = [rng1.next(), rng1.next(), rng1.next(), rng1.range(10, 50)];

    const rng2 = new SeedableRandom(1337);
    const seq2 = [rng2.next(), rng2.next(), rng2.next(), rng2.range(10, 50)];

    expect(seq1).toEqual(seq2);
  });
});
