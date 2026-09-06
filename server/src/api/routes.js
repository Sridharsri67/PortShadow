import { Router } from "express";
import { connectionManager, incarnationManager, packetEngine, sequenceManager, packetValidator, tombstoneStore } from "../core/index.js";
import { networkSimulator } from "../network/index.js";
import {
  runRapidReuseScenario,
  runRetransmissionScenario,
  runReorderingScenario,
  runDuplicatePacketScenario,
  runMixedTrafficScenario,
  runComparisonScenario
} from "../scenarios/index.js";
import { PACKET_STATUS } from "../models/Packet.js";
import {
  isDatabaseConnected,
  ConnectionRepository,
  PacketEventRepository,
  ScenarioRepository,
  BenchmarkRepository
} from "../database/index.js";

const router = Router();

// System Status
router.get("/status", (req, res) => {
  res.json({
    status: "online",
    system: "PortShadow — Incarnation-Aware Transport Simulator",
    phase: 11,
    phaseStatus: "Phase 11 Complete — React Dashboard UI Active (Connection Table, Packet Timeline, Tombstone Store, Comparison Metrics, & Controls)",
    activeConnectionsCount: connectionManager.getActiveConnections().length,
    packetsCreatedCount: packetEngine.getAllPackets().length,
    delayedPacketsCount: networkSimulator.getDelayedPackets().length,
    activeTombstonesCount: tombstoneStore.getAllTombstones().length
  });
});

// ----------------------------------------------------
// CONNECTIONS API
// ----------------------------------------------------

router.get("/connections", (req, res) => {
  res.json(connectionManager.getActiveConnections());
});

router.get("/connections/all", async (req, res) => {
  try {
    const dbConns = await ConnectionRepository.getAllConnections(100);
    const memConns = connectionManager.getAllConnections().map(c => c.toJSON());
    const connMap = new Map();
    dbConns.forEach(c => connMap.set(c.connectionId, c));
    memConns.forEach(c => connMap.set(c.connectionId, c));
    res.json(Array.from(connMap.values()));
  } catch (err) {
    res.json(connectionManager.getAllConnections());
  }
});

router.get("/connections/:id", (req, res) => {
  const connection = connectionManager.getConnection(req.params.id);
  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }
  res.json(connection);
});

router.post("/connections", (req, res) => {
  try {
    const { connectionId, sourceIp, sourcePort, destinationIp, destinationPort, autoEstablish, forceReuse } = req.body;
    const connection = connectionManager.createConnection({
      connectionId,
      sourceIp,
      sourcePort,
      destinationIp,
      destinationPort,
      autoEstablish,
      forceReuse
    });
    res.status(201).json(connection);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/connections/:id/close", (req, res) => {
  try {
    const { tombstoneTtlMs = 5000 } = req.body || {};
    const connection = connectionManager.closeConnection(req.params.id, tombstoneTtlMs);
    res.json(connection);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/connections/:id/transition", (req, res) => {
  try {
    const { nextState } = req.body;
    const connection = connectionManager.getConnection(req.params.id);
    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }
    connection.transitionTo(nextState);
    res.json(connection);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// TOMBSTONES API
// ----------------------------------------------------

router.get("/tombstones", (req, res) => {
  res.json(tombstoneStore.getAllTombstones());
});

router.get("/tombstones/:id", (req, res) => {
  const tombstone = tombstoneStore.getTombstone(req.params.id);
  if (!tombstone) {
    return res.status(404).json({ error: "Tombstone not found or expired" });
  }
  res.json(tombstone);
});

// ----------------------------------------------------
// PACKETS API
// ----------------------------------------------------

router.get("/packets", async (req, res) => {
  try {
    const dbPackets = await PacketEventRepository.getProvenanceRecords({}, 100);
    const memPackets = packetEngine.getAllPackets().map(p => (typeof p.toJSON === "function" ? p.toJSON() : p));
    const pktMap = new Map();
    dbPackets.forEach(p => pktMap.set(p.packetId, p));
    memPackets.forEach(p => pktMap.set(p.packetId, p));
    res.json(Array.from(pktMap.values()));
  } catch (err) {
    res.json(packetEngine.getAllPackets());
  }
});

router.get("/packets/connection/:connectionId", (req, res) => {
  res.json(packetEngine.getPacketsForConnection(req.params.connectionId));
});

router.get("/packets/:id", (req, res) => {
  const packet = packetEngine.getPacket(req.params.id);
  if (!packet) {
    return res.status(404).json({ error: "Packet not found" });
  }
  res.json(packet);
});

router.post("/packets", (req, res) => {
  try {
    const { connectionId, packetId, payload, status } = req.body;
    const connection = connectionManager.getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: `Connection not found: ${connectionId}` });
    }

    const packet = packetEngine.createPacket({
      connection,
      packetId,
      payload,
      status: status || PACKET_STATUS.SENT
    });

    PacketEventRepository.recordPacketEvent({
      packetId: packet.packetId,
      connectionId: packet.connectionId,
      incarnationId: packet.incarnationId,
      generation: packet.generation || 1,
      sequenceNumber: packet.sequenceNumber,
      sourceIp: packet.sourceIp,
      sourcePort: packet.sourcePort,
      destinationIp: packet.destinationIp,
      destinationPort: packet.destinationPort,
      payload: packet.payload,
      eventType: "INJECTION",
      status: packet.status,
      createdAt: packet.createdAt
    }).catch((err) => {
      console.error("❌ [DB ERROR] Failed to record packet event:", err.message);
    });

    res.status(201).json(packet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/packets/:id/validate", (req, res) => {
  try {
    const packet = packetEngine.getPacket(req.params.id);
    if (!packet) {
      return res.status(404).json({ error: `Packet not found: ${req.params.id}` });
    }

    const validationResult = packetValidator.validateAndProcess(packet);
    res.json({ packet, validationResult });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// NETWORK SIMULATOR API
// ----------------------------------------------------

router.post("/network/transmit", (req, res) => {
  try {
    const { packetId, delayMs = 0, drop = false, duplicate = false } = req.body;
    const packet = packetEngine.getPacket(packetId);
    if (!packet) {
      return res.status(404).json({ error: `Packet not found: ${packetId}` });
    }

    const result = networkSimulator.transmitPacket(packet, { delayMs, drop, duplicate });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/network/release/:packetId", (req, res) => {
  try {
    const releasedPacket = networkSimulator.releaseDelayedPacket(req.params.packetId);
    const validationResult = packetValidator.validateAndProcess(releasedPacket);
    res.json({ releasedPacket, validationResult });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/network/delayed", (req, res) => {
  res.json(networkSimulator.getDelayedPackets());
});

// ----------------------------------------------------
// SCENARIOS API
// ----------------------------------------------------

router.post("/scenarios/rapid-reuse", (req, res) => {
  try {
    const { sourceIp, sourcePort, destinationIp, destinationPort, delayMs } = req.body || {};
    const result = runRapidReuseScenario({ sourceIp, sourcePort, destinationIp, destinationPort, delayMs });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/scenarios/retransmission", (req, res) => {
  try {
    const { sourceIp, sourcePort, destinationIp, destinationPort } = req.body || {};
    const result = runRetransmissionScenario({ sourceIp, sourcePort, destinationIp, destinationPort });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/scenarios/reordering", (req, res) => {
  try {
    const { sourceIp, sourcePort, destinationIp, destinationPort } = req.body || {};
    const result = runReorderingScenario({ sourceIp, sourcePort, destinationIp, destinationPort });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/scenarios/duplicate", (req, res) => {
  try {
    const { sourceIp, sourcePort, destinationIp, destinationPort } = req.body || {};
    const result = runDuplicatePacketScenario({ sourceIp, sourcePort, destinationIp, destinationPort });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/scenarios/mixed", (req, res) => {
  try {
    const { sourceIp, sourcePort, destinationIp, destinationPort } = req.body || {};
    const result = runMixedTrafficScenario({ sourceIp, sourcePort, destinationIp, destinationPort });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/scenarios/comparison", (req, res) => {
  try {
    const { sourceIp, sourcePort, destinationIp, destinationPort, maxNaiveAgeMs } = req.body || {};
    const result = runComparisonScenario({ sourceIp, sourcePort, destinationIp, destinationPort, maxNaiveAgeMs });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// DATABASE & PACKET PROVENANCE API
// ----------------------------------------------------

router.get("/db/status", (req, res) => {
  res.json({
    connected: isDatabaseConnected(),
    provider: isDatabaseConnected() ? "Neon PostgreSQL (Prisma)" : "In-Memory Provenance Buffer",
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "")
  });
});

router.get("/db/provenance", async (req, res) => {
  try {
    const { packetId, connectionId, status, rejectionReason, limit = 100 } = req.query;
    const records = await PacketEventRepository.getProvenanceRecords(
      { packetId, connectionId, status, rejectionReason },
      Number(limit)
    );
    res.json({
      count: records.length,
      provenanceRecords: records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/db/connections", async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const records = await ConnectionRepository.getAllConnections(Number(limit));
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/db/scenarios", async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const records = await ScenarioRepository.getScenarioRuns(Number(limit));
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/db/benchmarks", async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const records = await BenchmarkRepository.getBenchmarkResults(Number(limit));
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// RESET API
// ----------------------------------------------------

router.post("/reset", (req, res) => {
  connectionManager.reset();
  packetEngine.reset();
  networkSimulator.reset();
  packetValidator.reset();
  tombstoneStore.reset();
  res.json({ message: "Simulation state reset successfully" });
});

export default router;
