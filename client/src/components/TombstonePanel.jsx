import React from "react";
import { Skull, Clock, ArrowRight } from "lucide-react";

export function TombstonePanel({ tombstones = [] }) {
  return (
    <div className="glass-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Skull style={{ color: "#f43f5e", width: "1.25rem", height: "1.25rem" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Tombstone Historical Store</h3>
        </div>
        <span className="badge badge-rose">{tombstones.length} Active Tombstones</span>
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Retains historical generation markers for closed connection 4-tuples without blocking endpoint reuse.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
              <th style={{ padding: "0.5rem" }}>Tombstone ID</th>
              <th style={{ padding: "0.5rem" }}>Transport 4-Tuple</th>
              <th style={{ padding: "0.5rem" }}>Old Incarnation</th>
              <th style={{ padding: "0.5rem" }}>Final Seq</th>
              <th style={{ padding: "0.5rem" }}>TTL</th>
            </tr>
          </thead>
          <tbody>
            {tombstones.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No active tombstone records.
                </td>
              </tr>
            ) : (
              tombstones.map((tb) => (
                <tr key={tb.tombstoneId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)", fontWeight: "600", color: "#f43f5e" }}>
                    {tb.tombstoneId}
                  </td>
                  <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)" }}>
                    {tb.sourceIp}:{tb.sourcePort} <ArrowRight style={{ width: "0.7rem", height: "0.7rem", display: "inline" }} /> {tb.destinationIp}:{tb.destinationPort}
                  </td>
                  <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)", color: "#a5b4fc" }}>
                    {tb.oldIncarnationId ? tb.oldIncarnationId.slice(0, 8) : "N/A"}
                  </td>
                  <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)" }}>
                    #{tb.lastSequenceNumber}
                  </td>
                  <td style={{ padding: "0.5rem", color: "#fbbf24" }}>
                    <Clock style={{ width: "0.75rem", height: "0.75rem", display: "inline", marginRight: "4px" }} />
                    5s TTL
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
