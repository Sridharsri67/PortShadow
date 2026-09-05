import { Router } from "express";
import { connectionManager, incarnationManager, packetEngine, sequenceManager } from "../core/index.js";
import { networkSimulator } from "../network/index.js";
import { PACKET_STATUS } from "../models/Packet.js";

const router = Router();

// System Status
router.get("/status", (req, res) => {
  res.json({
    status: "online",
    system: "PortShadow — Incarnation-Aware Transport Simulator",
    phase: 4,
    phaseStatus: "Phase 4 Complete — Network Simulator Operational",
    activeConnectionsCount: connectionManager.getActiveConnections().length,
    packetsCreatedCount: packetEngine.getAllPackets().length,
    delayedPacketsCount: networkSimulator.getDelayedPackets().length
  });
});

// ----------------------------------------------------
// CONNECTIONS API
// ----------------------------------------------------

router.get("/connections", (req, res) => {
  res.json(connectionManager.getActiveConnections());
});

router.get("/connections/all", (req, res) => {
  res.json(connectionManager.getAllConnections());
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
    const { connectionId, sourceIp, sourcePort, destinationIp, destinationPort, autoEstablish } = req.body;
    const connection = connectionManager.createConnection({
      connectionId,
      sourceIp,
      sourcePort,
      destinationIp,
      destinationPort,
      autoEstablish
    });
    res.status(201).json(connection);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/connections/:id/close", (req, res) => {
  try {
    const connection = connectionManager.closeConnection(req.params.id);
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
// PACKETS API
// ----------------------------------------------------

router.get("/packets", (req, res) => {
  res.json(packetEngine.getAllPackets());
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

    res.status(201).json(packet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// NETWORK SIMULATOR API
// ----------------------------------------------------

// POST /api/network/transmit — Transmit packet with network options (delayMs, drop, duplicate)
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

// POST /api/network/release/:packetId — Release a delayed packet into receiver channel
router.post("/network/release/:packetId", (req, res) => {
  try {
    const releasedPacket = networkSimulator.releaseDelayedPacket(req.params.packetId);
    res.json(releasedPacket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/network/delayed — List currently delayed packets
router.get("/network/delayed", (req, res) => {
  res.json(networkSimulator.getDelayedPackets());
});

// ----------------------------------------------------
// RESET API
// ----------------------------------------------------

router.post("/reset", (req, res) => {
  connectionManager.reset();
  packetEngine.reset();
  networkSimulator.reset();
  res.json({ message: "Simulation state reset successfully" });
});

export default router;
