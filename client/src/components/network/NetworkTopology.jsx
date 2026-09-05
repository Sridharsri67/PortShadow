import React from "react";
import { motion } from "framer-motion";
import { Server, Laptop, Activity, ArrowRight } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";

export function NetworkTopology() {
  const packets = useSimulationStore((state) => state.packets);
  const recentPacket = packets.length > 0 ? packets[packets.length - 1] : null;

  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
            NETWORK LAYER SIMULATION TOPOLOGY
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Transport Routing Channel</h3>
        </div>
        <span className="tag">3 Nodes Connected</span>
      </div>

      <div
        style={{
          position: "relative",
          padding: "2.5rem 1.5rem",
          backgroundColor: "var(--surface-2)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr 1fr",
          gap: "1.5rem",
          alignItems: "center"
        }}
      >
        {/* Node 1: CLIENT */}
        <div style={{ padding: "1rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
          <Laptop style={{ width: "1.5rem", height: "1.5rem", color: "var(--text-primary)", margin: "0 auto 0.5rem" }} />
          <div style={{ fontSize: "0.85rem", fontWeight: "700", fontFamily: "var(--font-mono)" }}>CLIENT</div>
          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>10.0.0.1:5000</div>
        </div>

        {/* Node 2: NETWORK SIMULATOR & Animated Packet Route */}
        <div style={{ position: "relative", padding: "1rem", backgroundColor: "var(--surface-4)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
          <Activity style={{ width: "1.5rem", height: "1.5rem", color: "var(--status-info)", margin: "0 auto 0.5rem" }} />
          <div style={{ fontSize: "0.85rem", fontWeight: "700", fontFamily: "var(--font-mono)" }}>NETWORK SIMULATOR</div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>Delay / Reorder / Drop / Duplicate</div>

          {/* Animated Packet Traveling along path */}
          {recentPacket && (
            <motion.div
              key={recentPacket.packetId + "-" + Math.random()}
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: ["0%", "50%", "100%"], opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "0.2rem 0.5rem",
                backgroundColor: recentPacket.status === "REJECTED" ? "var(--status-error)" : "var(--status-success)",
                color: "#000000",
                fontSize: "0.65rem",
                fontFamily: "var(--font-mono)",
                fontWeight: "700",
                borderRadius: "3px",
                pointerEvents: "none"
              }}
            >
              {recentPacket.packetId}
            </motion.div>
          )}
        </div>

        {/* Node 3: SERVER */}
        <div style={{ padding: "1rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
          <Server style={{ width: "1.5rem", height: "1.5rem", color: "var(--text-primary)", margin: "0 auto 0.5rem" }} />
          <div style={{ fontSize: "0.85rem", fontWeight: "700", fontFamily: "var(--font-mono)" }}>SERVER</div>
          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>10.0.0.2:8080</div>
        </div>
      </div>
    </div>
  );
}
