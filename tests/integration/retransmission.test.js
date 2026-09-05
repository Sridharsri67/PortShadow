import { describe, it, expect } from "vitest";
import { runRetransmissionScenario } from "../../server/src/scenarios/Retransmission.js";
import { PACKET_STATUS } from "../../server/src/models/Packet.js";

describe("Retransmission Scenario Integration (Phase 7)", () => {
  it("should accept legitimate retransmissions matching the active incarnation ID", () => {
    const result = runRetransmissionScenario();
    const { summary, timeline } = result;

    expect(timeline).toHaveLength(3);
    expect(summary.initialPacket.status).toBe(PACKET_STATUS.DROPPED);
    expect(summary.retransmittedPacket.status).toBe(PACKET_STATUS.ACCEPTED);
    expect(summary.retransmissionAccepted).toBe(true);

    // Retransmitted packet inherits active incarnation ID
    expect(summary.retransmittedPacket.incarnationId).toBe(summary.connection.incarnationId);
  });
});
