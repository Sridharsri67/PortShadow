import React, { useState } from "react";
import { Plus, Send, Clock, Skull, Check, Play, ShieldAlert } from "lucide-react";
import {
  createConnection,
  closeConnection,
  sendPacket,
  transmitNetworkPacket,
  releaseDelayedPacket
} from "../../services/api";
import { useSimulationStore } from "../../store/useSimulationStore";

export function ManualTestPanel() {
  const connections = useSimulationStore((state) => state.connections);
  const activeConnections = connections.filter((c) => c.state === "ESTABLISHED");
  const packets = useSimulationStore((state) => state.packets);
  const addToast = useSimulationStore((state) => state.addToast);

  // Form State: Create Connection
  const [connId, setConnId] = useState("conn-user-1");
  const [sourceIp, setSourceIp] = useState("10.0.0.1");
  const [sourcePort, setSourcePort] = useState(5000);
  const [destIp, setDestIp] = useState("10.0.0.2");
  const [destPort, setDestPort] = useState(8080);

  // Form State: Send Packet
  const [selectedConnId, setSelectedConnId] = useState("");
  const [pktId, setPktId] = useState("P1");
  const [payload, setPayload] = useState("USER_DATA_PAYLOAD");

  // Form State: Transmit/Delay
  const [transmitPktId, setTransmitPktId] = useState("");
  const [delayMs, setDelayMs] = useState(5000);

  // Form State: Release Delayed
  const delayedPackets = packets.filter((p) => p.status === "DELAYED");
  const [releasePktId, setReleasePktId] = useState("");

  // Loading States
  const [loading, setLoading] = useState(false);

  // 1. Create Connection
  const handleCreateConnection = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const conn = await createConnection({
        connectionId: connId,
        sourceIp,
        sourcePort: Number(sourcePort),
        destinationIp: destIp,
        destinationPort: Number(destPort),
        autoEstablish: true,
        forceReuse: true
      });
      addToast(`Connection ${conn.connectionId} created with Incarnation ID: ${conn.incarnationId.slice(0, 8)}`, "success");
      setConnId(`conn-user-${Math.floor(Math.random() * 1000)}`);
      setSelectedConnId(conn.connectionId);
    } catch (err) {
      addToast(`Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Packet
  const handleSendPacket = async (e) => {
    e.preventDefault();
    const connTarget = selectedConnId || (activeConnections[0] && activeConnections[0].connectionId);
    if (!connTarget) {
      addToast("Please create or select an active connection first!", "warning");
      return;
    }
    setLoading(true);
    try {
      const pkt = await sendPacket({
        connectionId: connTarget,
        packetId: pktId,
        payload,
        status: "SENT"
      });
      addToast(`Packet ${pkt.packetId} injected under Incarnation: ${pkt.incarnationId.slice(0, 8)}`, "info");
      setTransmitPktId(pkt.packetId);
      setPktId(`P${Math.floor(Math.random() * 100)}`);
    } catch (err) {
      addToast(`Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // 3. Transmit / Delay Packet
  const handleTransmit = async (e) => {
    e.preventDefault();
    const target = transmitPktId || (packets[0] && packets[0].packetId);
    if (!target) {
      addToast("Please create a packet first!", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await transmitNetworkPacket(target, { delayMs: Number(delayMs) });
      if (Number(delayMs) > 0) {
        addToast(`Packet ${target} DELAYED in network queue for ${delayMs}ms`, "warning");
      } else {
        addToast(`Packet ${target} TRANSMITTED directly to receiver`, "success");
      }
    } catch (err) {
      addToast(`Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // 4. Release Delayed Packet
  const handleRelease = async (e) => {
    e.preventDefault();
    const target = releasePktId || (delayedPackets[0] && delayedPackets[0].packetId);
    if (!target) {
      addToast("No delayed packets currently in network queue!", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await releaseDelayedPacket(target);
      const val = res.validationResult;
      if (val.status === "REJECTED" && val.reason === "STALE_INCARNATION") {
        addToast(`🔒 STALE PACKET ISOLATED: Packet ${target} REJECTED! Incarnation mismatch.`, "error");
      } else {
        addToast(`Packet ${target} RELEASED and ${val.status}`, "success");
      }
    } catch (err) {
      addToast(`Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // 5. Teardown Connection
  const handleCloseConn = async (connIdToClose) => {
    setLoading(true);
    try {
      await closeConnection(connIdToClose);
      addToast(`Connection ${connIdToClose} Closed. Tombstone created (5s TTL). 4-Tuple Freed!`, "warning");
    } catch (err) {
      addToast(`Failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
            MANUAL INTERACTIVE TESTING SUITE
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Live User Testing Controls</h3>
        </div>
        <span className="tag">Full Manual Control</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        {/* Form 1: Create Connection */}
        <form onSubmit={handleCreateConnection} style={{ padding: "1rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "700", fontFamily: "var(--font-mono)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Plus style={{ width: "0.9rem", height: "0.9rem", color: "var(--status-info)" }} />
            <span>1. BIND CONNECTION</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
            <div>
              <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Connection ID</label>
              <input
                type="text"
                value={connId}
                onChange={(e) => setConnId(e.target.value)}
                style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Source IP:Port</label>
                <input
                  type="text"
                  value={`${sourceIp}:${sourcePort}`}
                  onChange={(e) => {
                    const [ip, port] = e.target.value.split(":");
                    if (ip) setSourceIp(ip);
                    if (port) setSourcePort(port);
                  }}
                  style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }}
                />
              </div>
              <div>
                <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Dest IP:Port</label>
                <input
                  type="text"
                  value={`${destIp}:${destPort}`}
                  onChange={(e) => {
                    const [ip, port] = e.target.value.split(":");
                    if (ip) setDestIp(ip);
                    if (port) setDestPort(port);
                  }}
                  style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }}
                />
              </div>
            </div>

            <button type="submit" className="btn-secondary" disabled={loading} style={{ marginTop: "0.5rem", width: "100%", justifyContent: "center" }}>
              <span>CREATE CONNECTION</span>
            </button>
          </div>
        </form>

        {/* Form 2: Inject Custom Packet */}
        <form onSubmit={handleSendPacket} style={{ padding: "1rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "700", fontFamily: "var(--font-mono)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Send style={{ width: "0.9rem", height: "0.9rem", color: "var(--status-success)" }} />
            <span>2. INJECT PACKET</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
            <div>
              <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Target Connection</label>
              <select
                value={selectedConnId}
                onChange={(e) => setSelectedConnId(e.target.value)}
                style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }}
              >
                {activeConnections.length === 0 ? (
                  <option value="">No active connections (create one first)</option>
                ) : (
                  activeConnections.map((c) => (
                    <option key={c.connectionId} value={c.connectionId}>
                      {c.connectionId} ({c.incarnationId.slice(0, 8)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.5rem" }}>
              <div>
                <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Packet ID</label>
                <input
                  type="text"
                  value={pktId}
                  onChange={(e) => setPktId(e.target.value)}
                  style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }}
                />
              </div>
              <div>
                <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Payload</label>
                <input
                  type="text"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }}
                />
              </div>
            </div>

            <button type="submit" className="btn-secondary" disabled={loading || activeConnections.length === 0} style={{ marginTop: "0.5rem", width: "100%", justifyContent: "center" }}>
              <span>INJECT PACKET</span>
            </button>
          </div>
        </form>

        {/* Form 3: Network Delay / Transmit */}
        <form onSubmit={handleTransmit} style={{ padding: "1rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "700", fontFamily: "var(--font-mono)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Clock style={{ width: "0.9rem", height: "0.9rem", color: "var(--status-warning)" }} />
            <span>3. DELAY / TRANSMIT</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
            <div>
              <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Select Packet</label>
              <select
                value={transmitPktId}
                onChange={(e) => setTransmitPktId(e.target.value)}
                style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }}
              >
                {packets.length === 0 ? (
                  <option value="">No created packets</option>
                ) : (
                  packets.map((p) => (
                    <option key={p.packetId} value={p.packetId}>
                      {p.packetId} (Seq #{p.sequenceNumber} - {p.incarnationId.slice(0, 8)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Delay (ms)</label>
              <input
                type="number"
                value={delayMs}
                onChange={(e) => setDelayMs(e.target.value)}
                style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }}
              />
            </div>

            <button type="submit" className="btn-secondary" disabled={loading || packets.length === 0} style={{ marginTop: "0.5rem", width: "100%", justifyContent: "center" }}>
              <span>HOLD / DELAY PACKET</span>
            </button>
          </div>
        </form>

        {/* Form 4: Release Delayed Packet & Teardown Connection */}
        <div style={{ padding: "1rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: "700", fontFamily: "var(--font-mono)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ShieldAlert style={{ width: "0.9rem", height: "0.9rem", color: "var(--status-error)" }} />
              <span>4. RELEASE & TEARDOWN</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
              {/* Release Delayed */}
              <div>
                <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Delayed Queue ({delayedPackets.length})</label>
                <select
                  value={releasePktId}
                  onChange={(e) => setReleasePktId(e.target.value)}
                  style={{ width: "100%", padding: "0.4rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", marginBottom: "0.4rem" }}
                >
                  {delayedPackets.length === 0 ? (
                    <option value="">No delayed packets</option>
                  ) : (
                    delayedPackets.map((p) => (
                      <option key={p.packetId} value={p.packetId}>
                        {p.packetId} ({p.incarnationId.slice(0, 8)})
                      </option>
                    ))
                  )}
                </select>

                <button onClick={handleRelease} className="btn-primary" disabled={loading || delayedPackets.length === 0} style={{ width: "100%", justifyContent: "center" }}>
                  <span>RELEASE & VALIDATE</span>
                </button>
              </div>

              {/* Close Connection */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem" }}>
                <label style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Teardown Active Connection</label>
                {activeConnections.length === 0 ? (
                  <span style={{ color: "var(--text-muted)" }}>No active connections</span>
                ) : (
                  activeConnections.map((c) => (
                    <button
                      key={c.connectionId}
                      onClick={() => handleCloseConn(c.connectionId)}
                      className="btn-secondary"
                      style={{ width: "100%", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.75rem" }}
                    >
                      <span>Close {c.connectionId}</span>
                      <Skull style={{ width: "0.75rem", height: "0.75rem", color: "var(--status-error)" }} />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
