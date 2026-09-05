import { connectionManager } from "../core/ConnectionManager.js";
import { packetEngine } from "../core/PacketEngine.js";
import { networkSimulator } from "../network/NetworkSimulator.js";
import { packetValidator } from "../core/PacketValidator.js";
import { PACKET_STATUS } from "../models/Packet.js";

/**
 * Runs Legitimate Retransmission scenario.
 * Demonstrates that when Packet B1 is dropped by network loss, retransmitting B1 with the
 * SAME active incarnation ID is successfully ACCEPTED by the receiver.
 */
export function runRetransmissionScenario({
  sourceIp = "10.0.0.1",
  sourcePort = 5000,
  destinationIp = "10.0.0.2",
  destinationPort = 8080
} = {}) {
  connectionManager.reset();
  packetEngine.reset();
  networkSimulator.reset();
  packetValidator.reset();

  const timeline = [];

  // 1. Establish Connection B
  const connB = connectionManager.createConnection({
    connectionId: "connection-B",
    sourceIp,
    sourcePort,
    destinationIp,
    destinationPort
  });
  timeline.push({ step: 1, event: "CONNECTION_CREATED", connection: connB.toJSON() });

  // 2. Transmit B1 with drop = true (Simulate packet loss)
  const b1Initial = packetEngine.createPacket({ connection: connB, packetId: "B1-Initial", payload: "DATA-B1" });
  networkSimulator.transmitPacket(b1Initial, { drop: true });
  timeline.push({ step: 2, event: "PACKET_B1_DROPPED_BY_NETWORK", packet: b1Initial.toJSON() });

  // 3. Sender detects loss and Retransmits B1 carrying SAME incarnation ID & sequence number
  const b1Retransmit = packetEngine.createPacket({ connection: connB, packetId: "B1-Retransmit", payload: "DATA-B1" });
  // Overwrite sequence to match original B1 sequence number for true retransmission
  b1Retransmit.sequenceNumber = b1Initial.sequenceNumber;

  networkSimulator.transmitPacket(b1Retransmit, { delayMs: 0 });
  const valResult = packetValidator.validateAndProcess(b1Retransmit);
  timeline.push({ step: 3, event: "RETRANSMITTED_PACKET_B1_PROCESSED", packet: b1Retransmit.toJSON(), result: valResult });

  return {
    summary: {
      connection: connB.toJSON(),
      initialPacket: b1Initial.toJSON(),
      retransmittedPacket: b1Retransmit.toJSON(),
      retransmissionAccepted: b1Retransmit.status === PACKET_STATUS.ACCEPTED
    },
    timeline
  };
}
