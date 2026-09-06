import React, { useState } from "react";
import { X, Server, Plus, Zap, Clock, Send } from "lucide-react";
import { createConnection, sendPacket, transmitNetworkPacket } from "../../services/api";
import { useSimulationStore } from "../../store/useSimulationStore";

export function CreateConnectionModal({ isOpen, onClose }) {
  const [connectionId, setConnectionId] = useState(`conn-user-${Math.floor(100 + Math.random() * 900)}`);
  const [sourceIp, setSourceIp] = useState("10.0.0.1");
  const [sourcePort, setSourcePort] = useState("5000");
  const [destinationIp, setDestinationIp] = useState("10.0.0.2");
  const [destinationPort, setDestinationPort] = useState("8080");
  const [payload, setPayload] = useState("CONFIDENTIAL_PAYLOAD_101");
  const [delayMs, setDelayMs] = useState(5000);
  const [shouldDelay, setShouldDelay] = useState(false);
  const [forceReuse, setForceReuse] = useState(true);
  const [loading, setLoading] = useState(false);

  const addToast = useSimulationStore((state) => state.addToast);

  if (!isOpen) return null;

  const handleEstablish = async (e, mode = "normal") => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // 1. Create Connection with forceReuse enabled so repeated ports automatically teardown old state
      const conn = await createConnection({
        connectionId: connectionId.trim() || undefined,
        sourceIp: sourceIp.trim() || "10.0.0.1",
        sourcePort: parseInt(sourcePort, 10) || 5000,
        destinationIp: destinationIp.trim() || "10.0.0.2",
        destinationPort: parseInt(destinationPort, 10) || 8080,
        autoEstablish: true,
        forceReuse
      });

      addToast(`Connection Bound: ${conn.connectionId} (${conn.sourceIp}:${conn.sourcePort} → ${conn.destinationIp}:${conn.destinationPort})`, "success");

      // 2. Optional Payload Injection / Delay
      if (mode === "delay" || (payload && payload.trim().length > 0)) {
        try {
          const pktId = `P-${Math.floor(100 + Math.random() * 900)}`;
          const pkt = await sendPacket({
            connectionId: conn.connectionId,
            packetId: pktId,
            payload: payload.trim(),
            status: "SENT"
          });

          if (mode === "delay") {
            await transmitNetworkPacket(pkt.packetId, { delayMs: parseInt(delayMs, 10) || 5000 });
            addToast(`🕒 Packet ${pkt.packetId} ("${pkt.payload}") DELAYED in queue for ${delayMs}ms for Port Reuse Testing!`, "warning");
          } else {
            addToast(`Packet ${pkt.packetId} ("${pkt.payload}") injected on Incarnation ${conn.incarnationId.slice(0, 8)}`, "info");
          }
        } catch (pktErr) {
          console.warn("Packet injection notice:", pktErr.message);
        }
      }

      // 3. Always close modal when connection creation succeeds
      onClose();
      // Reset default values for next open
      setConnectionId(`conn-user-${Math.floor(100 + Math.random() * 900)}`);
      setPayload("");
    } catch (err) {
      addToast(`Failed to create connection: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "540px",
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-elevated)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Server style={{ width: "1.1rem", height: "1.1rem", color: "var(--text-primary)" }} />
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-primary)" }}>
                Establish Transport Connection
              </h3>
              <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                BINDS ENDPOINT 4-TUPLE, PAYLOAD DATA & INCARNATION ID
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X style={{ width: "1.1rem", height: "1.1rem" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleEstablish(e, "normal")} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Connection ID */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
              CONNECTION ID
            </label>
            <input
              type="text"
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              placeholder="e.g. conn-user-1"
              required
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>

          {/* Source IP & Port */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                SOURCE IP ADDRESS
              </label>
              <input
                type="text"
                value={sourceIp}
                onChange={(e) => setSourceIp(e.target.value)}
                placeholder="10.0.0.1"
                required
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                SOURCE PORT
              </label>
              <input
                type="number"
                value={sourcePort}
                onChange={(e) => setSourcePort(e.target.value)}
                placeholder="5000"
                min="1"
                max="65535"
                required
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Destination IP & Port */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                DESTINATION IP ADDRESS
              </label>
              <input
                type="text"
                value={destinationIp}
                onChange={(e) => setDestinationIp(e.target.value)}
                placeholder="10.0.0.2"
                required
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                DEST PORT
              </label>
              <input
                type="number"
                value={destinationPort}
                onChange={(e) => setDestinationPort(e.target.value)}
                placeholder="8080"
                min="1"
                max="65535"
                required
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Data Payload Input Section */}
          <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "0.85rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--status-info)", fontWeight: "600", marginBottom: "0.4rem" }}>
              ENTER INITIAL PACKET DATA / PAYLOAD (FOR REUSE TEST)
            </label>
            <input
              type="text"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="e.g. PAYLOAD_DATA_STRING"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.6rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={forceReuse}
                onChange={(e) => setForceReuse(e.target.checked)}
                style={{ accentColor: "var(--status-info)" }}
              />
              <span>Force Reuse Port (Automatically teardown old connection if port is active)</span>
            </label>
          </div>

          {/* Incarnation Info Banner */}
          <div style={{ padding: "0.6rem 0.8rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.725rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            ⚡ A fresh 128-bit Incarnation ID will isolate this connection from stale delayed data.
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{ padding: "0.45rem 0.8rem", fontSize: "0.75rem" }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={(e) => handleEstablish(e, "delay")}
              disabled={loading}
              style={{ padding: "0.45rem 0.88rem", fontSize: "0.75rem", borderColor: "var(--status-warning)", color: "var(--status-warning)" }}
            >
              <Clock style={{ width: "0.85rem", height: "0.85rem" }} />
              <span>ESTABLISH & DELAY DATA</span>
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ padding: "0.45rem 0.88rem", fontSize: "0.75rem" }}
            >
              <Zap style={{ width: "0.85rem", height: "0.85rem" }} />
              <span>{loading ? "BINDING..." : "ESTABLISH CONNECTION"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

