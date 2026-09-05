import React, { useState } from "react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { IncarnationBadge } from "../security/IncarnationBadge";
import { Server, ArrowRight, Plus, Clock, RefreshCw, Skull, Zap, Play, ShieldAlert } from "lucide-react";
import { CreateConnectionModal } from "../ui/CreateConnectionModal";
import {
  createConnection,
  closeConnection,
  sendPacket,
  transmitNetworkPacket,
  releaseDelayedPacket
} from "../../services/api";

export function ConnectionTable() {
  const connections = useSimulationStore((state) => state.connections);
  const packets = useSimulationStore((state) => state.packets);
  const setSelectedConnection = useSimulationStore((state) => state.setSelectedConnection);
  const addToast = useSimulationStore((state) => state.addToast);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const delayedPackets = packets.filter((p) => p.status === "DELAYED");

  // Handler: Quick Inject & Delay Data Packet for a Connection
  const handleInjectAndDelay = async (conn, e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const pktId = `P-${Math.floor(100 + Math.random() * 900)}`;
      const payloadText = `PREVIOUS_PORT_${conn.sourcePort}_PAYLOAD`;
      const pkt = await sendPacket({
        connectionId: conn.connectionId,
        packetId: pktId,
        payload: payloadText,
        status: "SENT"
      });

      await transmitNetworkPacket(pkt.packetId, { delayMs: 10000 });
      addToast(`🕒 Packet ${pkt.packetId} ("${payloadText}") DELAYED in queue on Port ${conn.sourcePort}!`, "warning");
    } catch (err) {
      addToast(`Failed to inject/delay packet: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Rapid Reuse Port (Close old connection & immediately rebind same 4-tuple)
  const handleReusePort = async (conn, e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      // 1. Close current connection
      await closeConnection(conn.connectionId);

      // 2. Create new connection on the exact same 4-tuple
      const newConnId = `conn-reuse-${Math.floor(100 + Math.random() * 900)}`;
      const newConn = await createConnection({
        connectionId: newConnId,
        sourceIp: conn.sourceIp,
        sourcePort: conn.sourcePort,
        destinationIp: conn.destinationIp,
        destinationPort: conn.destinationPort,
        autoEstablish: true
      });

      addToast(`🔄 Port ${conn.sourcePort} Reused! Old connection closed, new Incarnation ID bound: ${newConn.incarnationId.slice(0, 8)}`, "info");
    } catch (err) {
      addToast(`Failed port reuse: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Close Connection
  const handleClose = async (connId, e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await closeConnection(connId);
      addToast(`Connection ${connId} Closed. Tombstone created (5s TTL). Port freed!`, "warning");
    } catch (err) {
      addToast(`Failed: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Release Delayed Packet & Validate
  const handleReleasePacket = async (pktId) => {
    setActionLoading(true);
    try {
      const res = await releaseDelayedPacket(pktId);
      const val = res.validationResult;
      if (val.status === "REJECTED" && val.reason === "STALE_INCARNATION") {
        addToast(`🔒 STALE PACKET ISOLATED: Packet ${pktId} REJECTED! Incarnation mismatch. Protected against stale data injection!`, "error");
      } else {
        addToast(`Packet ${pktId} RELEASED and ${val.status}`, "success");
      }
    } catch (err) {
      addToast(`Failed to release packet: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      {/* Delayed Packets Banner for Rapid Port Reuse Testing */}
      {delayedPackets.length > 0 && (
        <div
          className="panel"
          style={{
            marginBottom: "1rem",
            backgroundColor: "var(--surface-2)",
            border: "1px solid var(--status-warning)",
            padding: "0.85rem 1.25rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Clock style={{ width: "1.1rem", height: "1.1rem", color: "var(--status-warning)" }} />
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  DELAYED PACKETS IN NETWORK QUEUE ({delayedPackets.length})
                </div>
                <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  Ready to test stale packet rejection across rapid port reuse
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              {delayedPackets.map((p) => (
                <div
                  key={p.packetId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.35rem 0.65rem",
                    backgroundColor: "var(--surface-3)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)"
                  }}
                >
                  <span style={{ fontWeight: "600", color: "var(--status-warning)" }}>{p.packetId}</span>
                  <span style={{ color: "var(--text-secondary)" }}>"{p.payload}"</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>Incarnation: {p.incarnationId.slice(0, 8)}</span>
                  <button
                    className="btn-primary"
                    onClick={() => handleReleasePacket(p.packetId)}
                    disabled={actionLoading}
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.675rem", marginLeft: "0.25rem" }}
                  >
                    <Play style={{ width: "0.65rem", height: "0.65rem" }} />
                    <span>RELEASE & VALIDATE</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Server style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              TRANSPORT CONNECTIONS STORE
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="tag">{connections.length} Total</span>
            <button
              className="btn-secondary"
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em"
              }}
            >
              <Plus style={{ width: "0.85rem", height: "0.85rem" }} />
              <span>+ CREATE CONNECTION</span>
            </button>
          </div>
        </div>


      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.825rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-medium)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              <th style={{ padding: "0.6rem 0.5rem" }}>STATUS</th>
              <th style={{ padding: "0.6rem 0.5rem" }}>CONNECTION ID</th>
              <th style={{ padding: "0.6rem 0.5rem" }}>TRANSPORT 4-TUPLE</th>
              <th style={{ padding: "0.6rem 0.5rem" }}>INCARNATION ID (128-BIT)</th>
              <th style={{ padding: "0.6rem 0.5rem" }}>STATE</th>
              <th style={{ padding: "0.6rem 0.5rem" }}>SEQ</th>
              <th style={{ padding: "0.6rem 0.5rem", textAlign: "right" }}>PORT REUSE & DATA ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {connections.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                  No active or historical connections. Click "+ CREATE CONNECTION" to trigger a binding.
                </td>
              </tr>
            ) : (
              connections.map((conn) => {
                const isEstablished = conn.state === "ESTABLISHED";

                return (
                  <tr
                    key={conn.connectionId}
                    onClick={() => setSelectedConnection(conn)}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease"
                    }}
                    className="cmd-item"
                  >
                    <td style={{ padding: "0.65rem 0.5rem" }}>
                      <span className={`dot-indicator ${isEstablished ? "dot-success" : "dot-error"}`} />
                    </td>
                    <td style={{ padding: "0.65rem 0.5rem", fontFamily: "var(--font-mono)", fontWeight: "600", color: "var(--text-primary)" }}>
                      {conn.connectionId}
                    </td>
                    <td style={{ padding: "0.65rem 0.5rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      {conn.sourceIp}:{conn.sourcePort} <ArrowRight style={{ width: "0.7rem", height: "0.7rem", display: "inline" }} /> {conn.destinationIp}:{conn.destinationPort}
                    </td>
                    <td style={{ padding: "0.65rem 0.5rem" }}>
                      <IncarnationBadge incarnationId={conn.incarnationId} shortLength={8} />
                    </td>
                    <td style={{ padding: "0.65rem 0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      <span style={{ color: isEstablished ? "var(--status-success)" : "var(--text-muted)" }}>{conn.state}</span>
                    </td>
                    <td style={{ padding: "0.65rem 0.5rem", fontFamily: "var(--font-mono)", fontWeight: "600" }}>
                      #{conn.sequenceNumber}
                    </td>
                    <td style={{ padding: "0.65rem 0.5rem", textAlign: "right" }}>
                      {isEstablished ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button
                            className="btn-secondary"
                            onClick={(e) => handleInjectAndDelay(conn, e)}
                            disabled={actionLoading}
                            title="Inject packet data and delay in network queue"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.675rem", borderColor: "var(--status-warning)", color: "var(--status-warning)" }}
                          >
                            <Clock style={{ width: "0.7rem", height: "0.7rem" }} />
                            <span>DELAY DATA</span>
                          </button>

                          <button
                            className="btn-secondary"
                            onClick={(e) => handleReusePort(conn, e)}
                            disabled={actionLoading}
                            title="Close connection and bind new connection on same port"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.675rem", borderColor: "var(--status-info)", color: "var(--status-info)" }}
                          >
                            <RefreshCw style={{ width: "0.7rem", height: "0.7rem" }} />
                            <span>REUSE PORT</span>
                          </button>

                          <button
                            className="btn-secondary"
                            onClick={(e) => handleClose(conn.connectionId, e)}
                            disabled={actionLoading}
                            title="Close connection"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.675rem", color: "var(--status-error)" }}
                          >
                            <Skull style={{ width: "0.7rem", height: "0.7rem" }} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>CLOSED</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    <CreateConnectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

