import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulationStore } from "../../store/useSimulationStore";
import { Activity } from "lucide-react";
import { IncarnationBadge } from "../security/IncarnationBadge";

export function LiveActivity() {
  const packets = useSimulationStore((state) => state.packets);

  return (
    <div className="panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Activity style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            LIVE TRANSPORT ACTIVITY FEED
          </span>
        </div>
        <span className="tag">{packets.length} Events</span>
      </div>

      <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {packets.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
            No transport activity recorded. Click "RUN CORE SCENARIO" above to trigger packet traffic.
          </div>
        ) : (
          <AnimatePresence>
            {packets.slice(-15).reverse().map((pkt) => {
              const isStale = pkt.status === "REJECTED" && pkt.rejectionReason === "STALE_INCARNATION";
              const isAccepted = pkt.status === "ACCEPTED";

              return (
                <motion.div
                  key={pkt.packetId + "-" + (pkt.createdAt || Math.random())}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-mono)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{pkt.packetId}</span>
                    <span style={{ color: "var(--text-muted)" }}>SEQ #{pkt.sequenceNumber}</span>
                    <IncarnationBadge incarnationId={pkt.incarnationId} shortLength={6} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span className={`dot-indicator ${isAccepted ? "dot-success" : isStale ? "dot-error" : "dot-warning"}`} />
                    <span style={{ color: isAccepted ? "var(--status-success)" : isStale ? "var(--status-error)" : "var(--status-warning)" }}>
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
