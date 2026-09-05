import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { ConnectionManager } from "../../server/src/core/ConnectionManager.js";
import { PacketEngine } from "../../server/src/core/PacketEngine.js";
import { PacketValidator } from "../../server/src/core/PacketValidator.js";
import { PACKET_STATUS, REJECTION_REASONS } from "../../server/src/models/Packet.js";

describe("Phase 9 — Property-Based Testing (Fast-Check)", () => {
  it("PROPERTY: A packet from an earlier connection incarnation must NEVER modify active connection state", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Number of stale packets
        fc.integer({ min: 1, max: 1000 }), // Random sequence number for stale packet
        fc.string({ minLength: 1, maxLength: 20 }), // Random payload
        (staleCount, randomSeq, randomPayload) => {
          const cm = new ConnectionManager();
          const pe = new PacketEngine();
          const pv = new PacketValidator(cm);

          const sourceIp = "10.0.0.1";
          const sourcePort = 5000;
          const destinationIp = "10.0.0.2";
          const destinationPort = 8080;

          // 1. Connection A (Incarnation A) created & closed
          const connA = cm.createConnection({
            connectionId: "conn-A",
            sourceIp,
            sourcePort,
            destinationIp,
            destinationPort
          });

          // Generate stale packets under Incarnation A
          const stalePackets = [];
          for (let i = 0; i < staleCount; i++) {
            const pkt = pe.createPacket({
              connection: connA,
              packetId: `STALE-${i}-${randomSeq}`,
              payload: `${randomPayload}-${i}`
            });
            stalePackets.push(pkt);
          }

          // Close Connection A
          cm.closeConnection("conn-A");

          // 2. Connection B (Incarnation B) rapidly reuses identical 4-tuple
          const connB = cm.createConnection({
            connectionId: "conn-B",
            sourceIp,
            sourcePort,
            destinationIp,
            destinationPort
          });

          // Snapshot active Connection B's initial state
          const initialConnBSeq = connB.sequenceNumber;
          const initialConnBState = connB.state;
          const receiverStateB = pv.getReceiverState(connB);
          const initialExpectedSeq = receiverStateB.expectedSeq;
          const initialAcceptedCount = receiverStateB.acceptedSequences.size;

          // 3. Process every stale packet against active Connection B
          for (const stalePacket of stalePackets) {
            const result = pv.validateAndProcess(stalePacket, cm);

            // ASSERTIONS:
            // a) Status MUST be REJECTED with STALE_INCARNATION reason
            expect(result.status).toBe(PACKET_STATUS.REJECTED);
            expect(result.reason).toBe(REJECTION_REASONS.STALE_INCARNATION);

            // b) Connection B sequence & lifecycle state MUST NOT mutate
            expect(connB.sequenceNumber).toBe(initialConnBSeq);
            expect(connB.state).toBe(initialConnBState);

            // c) Receiver state MUST NOT mutate
            expect(receiverStateB.expectedSeq).toBe(initialExpectedSeq);
            expect(receiverStateB.acceptedSequences.size).toBe(initialAcceptedCount);
            expect(receiverStateB.buffer.size).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
