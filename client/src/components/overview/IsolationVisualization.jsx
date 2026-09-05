import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, ArrowRight, XCircle, RefreshCw } from "lucide-react";
import { runScenario } from "../../services/api";
import { useSimulationStore } from "../../store/useSimulationStore";

export function IsolationVisualization() {
  const [animating, setAnimating] = useState(false);
  const [stage, setStage] = useState(0); // 0: Idle, 1: Conn A, 2: Delay A2, 3: Reuse Conn B, 4: Release A2, 5: Rejection
  const addToast = useSimulationStore((state) => state.addToast);

  const connections = useSimulationStore((state) => state.connections);
  const activeConn = connections.find(c => c.state === "ESTABLISHED") || connections[0];
  const closedConn = connections.find(c => c.state === "CLOSED") || connections[1];

  const connAId = closedConn ? closedConn.incarnationId?.slice(0, 8).toUpperCase() : "A7F91C2D";
  const connBId = activeConn ? activeConn.incarnationId?.slice(0, 8).toUpperCase() : "C29D8E41";

  const handleSimulate = async () => {
    setAnimating(true);
    setStage(1);

    setTimeout(() => setStage(2), 800);
    setTimeout(() => setStage(3), 1600);
    setTimeout(() => setStage(4), 2400);

    try {
      await runScenario("rapid-reuse");
      setTimeout(() => {
        setStage(5);
        setAnimating(false);
        addToast(`Stale Packet Isolation Demonstrated: ${connAId} ≠ ${connBId}`, "error");
      }, 3200);
    } catch (err) {
      setAnimating(false);
      setStage(0);
    }
  };

  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
            CORE ARCHITECTURE DEMONSTRATION
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Incarnation Isolation Pipeline</h3>
        </div>

        <button className="btn-secondary" onClick={handleSimulate} disabled={animating}>
          <Play style={{ width: "0.85rem", height: "0.85rem" }} />
          <span>{animating ? "SIMULATING..." : "DEMONSTRATE REJECTION"}</span>
        </button>
      </div>

      {/* Cinematic Visualization Canvas */}
      <div
        style={{
          position: "relative",
          padding: "2rem 1.5rem",
          backgroundColor: "var(--surface-2)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1.5rem", alignItems: "center" }}>
          {/* Left: Connection A Teardown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>CLOSED INCARNATION</div>
              <div style={{ fontSize: "0.9rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                {closedConn?.connectionId || "CONNECTION A"}
              </div>
              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#a1a1aa" }}>
                {closedConn ? `${closedConn.sourceIp}:${closedConn.sourcePort}` : "10.0.0.1:5000"}
              </div>
              <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--status-warning)" }}>
                ID: {connAId}
              </div>
            </div>

            <div style={{ padding: "0.6rem 0.8rem", backgroundColor: "var(--background)", border: "1px dashed var(--border-medium)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              Packet A2 Delayed in Network Queue
            </div>
          </div>

          {/* Center Pipeline Arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              RAPID 4-TUPLE REUSE
            </div>
            <ArrowRight style={{ width: "1.5rem", height: "1.5rem", color: "var(--text-muted)" }} />
          </div>

          {/* Right: Connection B Active */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--status-success)" }}>ACTIVE INCARNATION</div>
              <div style={{ fontSize: "0.9rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                {activeConn?.connectionId || "CONNECTION B"}
              </div>
              <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#a1a1aa" }}>
                {activeConn ? `${activeConn.sourceIp}:${activeConn.sourcePort} (REUSED)` : "10.0.0.1:5000 (REUSED)"}
              </div>
              <div style={{ marginTop: "0.35rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--status-info)" }}>
                ID: {connBId}
              </div>
            </div>

            <div style={{ padding: "0.6rem 0.8rem", backgroundColor: "var(--background)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
              Packet B1 Accepted (Incarnation {connBId.slice(0, 4)})
            </div>
          </div>
        </div>

        {/* Money-Shot Judgment Banner */}
        <motion.div
          animate={{ opacity: stage >= 5 ? 1 : 0.8, scale: stage >= 5 ? 1 : 0.99 }}
          transition={{ duration: 0.2 }}
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            backgroundColor: stage >= 5 ? "rgba(248, 113, 113, 0.08)" : "var(--surface-3)",
            border: `1px solid ${stage >= 5 ? "var(--status-error)" : "var(--border-default)"}`,
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
              VALIDATOR DECISION ON DELAYED PACKET A2
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.95rem" }}>
              <span style={{ color: "var(--status-warning)" }}>{connAId}</span>
              <span style={{ color: "var(--status-error)", fontWeight: "700" }}>≠</span>
              <span style={{ color: "var(--status-info)" }}>{connBId}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: stage >= 5 ? "var(--status-error)" : "var(--text-muted)" }}>
                {stage >= 5 ? "● REJECTED (STALE INCARNATION)" : "EVALUATING INCARNATION..."}
              </div>
              <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                ACTIVE CONNECTION STATE UNCHANGED
              </div>
            </div>
            {stage >= 5 ? (
              <XCircle style={{ width: "1.5rem", height: "1.5rem", color: "var(--status-error)" }} />
            ) : (
              <RefreshCw className="animate-pulse" style={{ width: "1.25rem", height: "1.25rem", color: "var(--text-muted)" }} />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
