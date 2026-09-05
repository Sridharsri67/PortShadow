import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulationStore } from "../../store/useSimulationStore";
import { Layers } from "lucide-react";
import { IncarnationBadge } from "../security/IncarnationBadge";

export function PacketTimeline() {
  const packets = useSimulationStore((state) => state.packets);

  return (
    <div className="panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            PACKET STREAM TIMELINE
          </span>
        </div>
        <span className="tag">{packets.length} Packets</span>
      </div>

      <div style={{ maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {packets.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
            No packet stream activity recorded.
          </div>
        ) : (
          <AnimatePresence>
            {packets.slice().reverse().map((pkt, idx) => {
              const isStale = pkt.status === "REJECTED" && pkt.rejectionReason === "STALE_INCARNATION";
              const isAccepted = pkt.status === "ACCEPTED";
              const isDelayed = pkt.status === "DELAYED";

              return (
                <motion.div
                  key={pkt.packetId + "-" + idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{
                    padding: "0.55rem 0.85rem",
                    backgroundColor: "var(--surface-2)",
                    border: `1px solid ${isStale ? "rgba(248, 113, 113, 0.3)" : "var(--border-default)"}`,
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-mono)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {pkt.createdAt ? new Date(pkt.createdAt).toLocaleTimeString() : "00:00:00"}
                    </span>
                    <span style={{ fontWeight: "700", color: "var(--text-primary)", minWidth: "40px" }}>{pkt.packetId}</span>
                    <IncarnationBadge incarnationId={pkt.incarnationId} shortLength={6} />
                    <span style={{ color: "var(--text-secondary)" }}>SEQ #{pkt.sequenceNumber}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span className={`dot-indicator ${isAccepted ? "dot-success" : isStale ? "dot-error" : isDelayed ? "dot-warning" : "dot-info"}`} />
                    <span style={{ color: isAccepted ? "var(--status-success)" : isStale ? "var(--status-error)" : isDelayed ? "var(--status-warning)" : "var(--text-secondary)", fontWeight: "600" }}>
                      {pkt.status} {pkt.rejectionReason ? `(${pkt.rejectionReason})` : ""}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
