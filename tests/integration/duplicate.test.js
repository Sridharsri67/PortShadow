import { describe, it, expect } from "vitest";
import { runDuplicatePacketScenario } from "../../server/src/scenarios/DuplicatePacket.js";
import { PACKET_STATUS } from "../../server/src/models/Packet.js";

describe("Duplicate Packet Scenario Integration (Phase 7)", () => {
  it("should classify duplicate packet copy as DUPLICATE without raising false stale incarnation error", () => {
    const result = runDuplicatePacketScenario();
    const { summary, timeline } = result;

    expect(timeline).toHaveLength(4);
    expect(summary.originalPacket.status).toBe(PACKET_STATUS.ACCEPTED);
    expect(summary.duplicatePacket.status).toBe(PACKET_STATUS.DUPLICATE);
    expect(summary.deduplicated).toBe(true);
  });
});
