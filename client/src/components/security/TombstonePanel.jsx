import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Clock, ArrowRight } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { IncarnationBadge } from "./IncarnationBadge";

export function TombstonePanel() {
  const tombstones = useSimulationStore((state) => state.tombstones);

  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Skull style={{ width: "1rem", height: "1rem", color: "var(--status-error)" }} />
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            HISTORICAL TOMBSTONE STORE
          </span>
        </div>
        <span className="tag">{tombstones.length} Active Tombstones</span>
      </div>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
        Retains teardown generation markers for closed connection 4-tuples without blocking endpoint reuse.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {tombstones.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", backgroundColor: "var(--surface-2)", borderRadius: "var(--radius-md)" }}>
            No active tombstone records. Teardown records auto-expire after 5s TTL.
          </div>
        ) : (
          <AnimatePresence>
            {tombstones.map((tb) => (
              <motion.div
                key={tb.tombstoneId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: "0.85rem 1rem",
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", fontSize: "0.85rem", color: "var(--status-error)" }}>
                    {tb.tombstoneId}
                  </span>
                  <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    FINAL SEQ #{tb.lastSequenceNumber}
                  </span>
                </div>

                <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {tb.sourceIp}:{tb.sourcePort} <ArrowRight style={{ width: "0.75rem", height: "0.75rem", display: "inline" }} /> {tb.destinationIp}:{tb.destinationPort}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>OLD INCARNATION</span>
                  <IncarnationBadge incarnationId={tb.oldIncarnationId} shortLength={8} />
                </div>

                {/* Thin countdown progress bar */}
                <div style={{ marginTop: "0.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    <span>EXPIRES IN</span>
                    <span style={{ color: "var(--status-warning)" }}>
                      <Clock style={{ width: "0.65rem", height: "0.65rem", display: "inline", marginRight: "2px" }} /> 5.0s TTL
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "3px", backgroundColor: "var(--border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      style={{ height: "100%", backgroundColor: "var(--status-warning)" }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
