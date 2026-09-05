import { describe, it, expect } from "vitest";
import { runRapidReuseScenario } from "../../server/src/scenarios/RapidReuse.js";
import { PACKET_STATUS, REJECTION_REASONS } from "../../server/src/models/Packet.js";

describe("Rapid Reuse Core MVP Integration Scenario (Phase 6)", () => {
  it("should execute full Core MVP timeline: delay A2 -> close A -> reuse 4-tuple B -> release A2 -> reject STALE -> continue B2", () => {
    const result = runRapidReuseScenario({
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080,
      delayMs: 5000
    });

    const { summary, timeline } = result;

    // 1. Verify 9 distinct steps occurred in timeline
    expect(timeline).toHaveLength(9);

    // 2. Connection A and Connection B share identical 4-tuples
    expect(summary.connectionA.tupleKey).toBe("10.0.0.1:5000->10.0.0.2:8080");
    expect(summary.connectionB.tupleKey).toBe("10.0.0.1:5000->10.0.0.2:8080");

    // 3. Incarnation IDs MUST be distinct across rapid reuse
    expect(summary.connectionA.incarnationId).not.toBe(summary.connectionB.incarnationId);

    // 4. Delayed Packet A2 MUST carry Connection A's incarnation ID
    expect(summary.delayedPacket.incarnationId).toBe(summary.connectionA.incarnationId);

    // 5. CORE MVP INVARIANT ASSERTION: Delayed Packet A2 MUST be REJECTED with STALE_INCARNATION
    expect(summary.staleIsolationVerified).toBe(true);
    expect(summary.delayedPacket.status).toBe(PACKET_STATUS.REJECTED);
    expect(summary.delayedPacket.rejectionReason).toBe(REJECTION_REASONS.STALE_INCARNATION);

    // 6. Connection B traffic MUST continue unaffected
    expect(summary.connectionBTrafficContinued).toBe(true);
  });
});
