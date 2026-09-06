import { describe, it, expect } from "vitest";
import { ConnectionManager } from "../../server/src/core/ConnectionManager.js";
import { PacketEngine } from "../../server/src/core/PacketEngine.js";
import { PacketValidator } from "../../server/src/core/PacketValidator.js";

describe("Phase 12 — Performance Benchmark Engine", () => {
  it("BENCHMARK: High-Throughput Packet Validation Rate (10,000+ packets)", () => {
    const cm = new ConnectionManager();
    const pe = new PacketEngine();
    const pv = new PacketValidator(cm);

    const sourceIp = "10.0.0.1";
    const sourcePort = 5000;
    const destinationIp = "10.0.0.2";
    const destinationPort = 8080;

    const conn = cm.createConnection({
      connectionId: "bench-conn-1",
      sourceIp,
      sourcePort,
      destinationIp,
      destinationPort
    });

    const PACKET_COUNT = 10000;
    const packets = [];

    for (let i = 0; i < PACKET_COUNT; i++) {
      packets.push(
        pe.createPacket({
          connection: conn,
          packetId: `BENCH-${i}`,
          payload: `BENCHMARK_PAYLOAD_${i}`
        })
      );
    }

    const startTime = performance.now();

    for (let i = 0; i < PACKET_COUNT; i++) {
      pv.validateAndProcess(packets[i], cm);
    }

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;
    const packetsPerSec = Math.round((PACKET_COUNT / totalTimeMs) * 1000);
    const avgLatencyMs = totalTimeMs / PACKET_COUNT;

    console.log(`\n==================================================`);
    console.log(`🔥 PORTSHADOW PERFORMANCE BENCHMARK RESULTS`);
    console.log(`==================================================`);
    console.log(`Total Packets Evaluated : ${PACKET_COUNT.toLocaleString()} packets`);
    console.log(`Total Execution Time    : ${totalTimeMs.toFixed(2)} ms`);
    console.log(`Throughput              : ${packetsPerSec.toLocaleString()} packets/sec`);
    console.log(`Avg Validation Latency  : ${avgLatencyMs.toFixed(4)} ms/packet`);
    console.log(`==================================================\n`);

    // Performance Assertions: > 10,000 packets/sec throughput & < 0.1ms average latency
    expect(packetsPerSec).toBeGreaterThan(10000);
    expect(avgLatencyMs).toBeLessThan(0.1);
  });
});
