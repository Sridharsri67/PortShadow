import React from "react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { BarChart3 } from "lucide-react";

export function MetricsPanel() {
  const stats = useSimulationStore((state) => state.stats);

  const metricsList = [
    { label: "PACKETS PROCESSED", value: stats.packetsCreatedCount.toLocaleString(), color: "var(--text-primary)" },
    { label: "STALE REJECTED", value: stats.staleRejectedCount.toLocaleString(), color: "var(--status-error)" },
    { label: "ACCEPTED", value: stats.acceptedCount.toLocaleString(), color: "var(--status-success)" },
    { label: "ACTIVE CONNECTIONS", value: stats.activeConnectionsCount.toLocaleString(), color: "var(--status-info)" },
    { label: "ACTIVE TOMBSTONES", value: stats.activeTombstonesCount.toLocaleString(), color: "var(--status-warning)" },
  ];

  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BarChart3 style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            ENGINE TELEMETRY METRICS
          </span>
        </div>
        <span className="tag">Live Metrics</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
        {metricsList.map((m) => (
          <div key={m.label} style={{ padding: "0.85rem 1rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: m.color, lineHeight: "1.2", marginBottom: "0.25rem" }}>
              {m.value}
            </div>
            <div style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
