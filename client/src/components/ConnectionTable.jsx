import React from "react";
import { Server, Key, ArrowRight } from "lucide-react";

export function ConnectionTable({ connections = [] }) {
  return (
    <div className="glass-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Server style={{ color: "#38bdf8", width: "1.25rem", height: "1.25rem" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Active & Past Connections</h3>
        </div>
        <span className="badge badge-indigo">{connections.length} Total</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
              <th style={{ padding: "0.75rem 0.5rem" }}>Connection ID</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>Transport 4-Tuple</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>State</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>Incarnation ID (128-bit)</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>Sequence</th>
            </tr>
          </thead>
          <tbody>
            {connections.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No connections recorded yet. Click a scenario button below to start simulation.
                </td>
              </tr>
            ) : (
              connections.map((conn) => {
                const isEstablished = conn.state === "ESTABLISHED";
                const shortId = conn.incarnationId ? conn.incarnationId.slice(0, 8) : "N/A";

                return (
                  <tr key={conn.connectionId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: "600", fontFamily: "var(--font-mono)" }}>
                      {conn.connectionId}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
                      {conn.sourceIp}:{conn.sourcePort} <ArrowRight style={{ width: "0.75rem", height: "0.75rem", display: "inline" }} /> {conn.destinationIp}:{conn.destinationPort}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <span className={`badge ${isEstablished ? "badge-emerald" : "badge-rose"}`}>
                        {conn.state}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      <span style={{ color: "#38bdf8" }} title={conn.incarnationId}>
                        <Key style={{ width: "0.75rem", height: "0.75rem", display: "inline", marginRight: "4px" }} />
                        {shortId}...
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontFamily: "var(--font-mono)" }}>
                      #{conn.sequenceNumber}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
