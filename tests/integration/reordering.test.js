import { describe, it, expect } from "vitest";
import { runReorderingScenario } from "../../server/src/scenarios/Reordering.js";
import { PACKET_STATUS } from "../../server/src/models/Packet.js";

describe("Stream Reordering Scenario Integration (Phase 7)", () => {
  it("should buffer out-of-order packet B3 and auto-flush to ACCEPTED when missing sequence B2 arrives", () => {
    const result = runReorderingScenario();
    const { summary, timeline } = result;

    expect(timeline).toHaveLength(4);
    expect(summary.b1Status).toBe(PACKET_STATUS.ACCEPTED);
    expect(summary.b2Status).toBe(PACKET_STATUS.ACCEPTED);
    expect(summary.b3Status).toBe(PACKET_STATUS.ACCEPTED); // Flushed from BUFFERED to ACCEPTED!
    expect(summary.reorderingResolved).toBe(true);
  });
});
