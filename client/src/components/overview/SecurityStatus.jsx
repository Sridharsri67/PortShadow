import React from "react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { ShieldCheck } from "lucide-react";

export function SecurityStatus() {
  const stats = useSimulationStore((state) => state.stats);

  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <ShieldCheck style={{ width: "1rem", height: "1rem", color: "var(--text-primary)" }} />
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            TRANSPORT INTEGRITY
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: "600", fontFamily: "var(--font-mono)" }}>
          <span className="dot-indicator dot-success animate-pulse" />
          <span style={{ color: "var(--status-success)" }}>PROTECTED</span>
        </div>
      </div>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
        Stale packet isolation is active. 128-bit cryptographically unique incarnation IDs are preventing cross-connection packet pollution.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
            ACTIVE CONNECTIONS
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "700", fontFamily: "var(--font-mono)" }}>
            {stats.activeConnectionsCount}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
            STALE PACKETS REJECTED
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--status-error)" }}>
            {stats.staleRejectedCount}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
            ACTIVE STATE MUTATIONS
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--status-success)" }}>
            0 (ISOLATED)
          </div>
        </div>
      </div>
    </div>
  );
}
