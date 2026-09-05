import { connectionManager } from "../core/ConnectionManager.js";
import { packetEngine } from "../core/PacketEngine.js";
import { networkSimulator } from "../network/NetworkSimulator.js";
import { packetValidator } from "../core/PacketValidator.js";
import { PACKET_STATUS } from "../models/Packet.js";

/**
 * Runs Out-of-Order Stream Reordering scenario.
 * Demonstrates packets sent as B1, B2, B3 being delivered out of order as B1, B3, B2.
 * Receiver buffers B3 as BUFFERED until B2 arrives, then auto-flushes B3 to ACCEPTED.
 */
export function runReorderingScenario({
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

  // 2. Create Packets B1 (Seq 100), B2 (Seq 101), B3 (Seq 102)
  const b1 = packetEngine.createPacket({ connection: connB, packetId: "B1", payload: "DATA-B1" });
  const b2 = packetEngine.createPacket({ connection: connB, packetId: "B2", payload: "DATA-B2" });
  const b3 = packetEngine.createPacket({ connection: connB, packetId: "B3", payload: "DATA-B3" });

  // 3. Deliver B1 -> ACCEPTED
  networkSimulator.transmitPacket(b1);
  const valB1 = packetValidator.validateAndProcess(b1);
  timeline.push({ step: 2, event: "PACKET_B1_PROCESSED", packet: b1.toJSON(), result: valB1 });

  // 4. Deliver B3 out of order -> BUFFERED
  networkSimulator.transmitPacket(b3);
  const valB3 = packetValidator.validateAndProcess(b3);
  timeline.push({ step: 3, event: "PACKET_B3_OUT_OF_ORDER_BUFFERED", packet: b3.toJSON(), result: valB3 });

  // 5. Deliver missing B2 -> ACCEPTED & Flushes B3 to ACCEPTED
  networkSimulator.transmitPacket(b2);
  const valB2 = packetValidator.validateAndProcess(b2);
  timeline.push({ step: 4, event: "PACKET_B2_PROCESSED_AND_BUFFER_FLUSHED", packet: b2.toJSON(), result: valB2, flushedB3Status: b3.status });

  return {
    summary: {
      connection: connB.toJSON(),
      b1Status: b1.status,
      b2Status: b2.status,
      b3Status: b3.status,
      reorderingResolved: b1.status === PACKET_STATUS.ACCEPTED && b2.status === PACKET_STATUS.ACCEPTED && b3.status === PACKET_STATUS.ACCEPTED
    },
    timeline
  };
}
