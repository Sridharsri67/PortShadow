import React from "react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { Search } from "lucide-react";

export function Topbar() {
  const setCommandPaletteOpen = useSimulationStore((state) => state.setCommandPaletteOpen);

  return (
    <header
      style={{
        height: "50px",
        backgroundColor: "var(--background)",
        borderBottom: "1px solid var(--border-default)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.25rem",
        flexShrink: 0
      }}
    >
      {/* Left Brand Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontSize: "0.95rem", fontWeight: "700", letterSpacing: "-0.01em" }}>PORTSHADOW</span>
        <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.05em", marginLeft: "0.25rem" }}>
          TRANSPORT OBSERVABILITY
        </span>
      </div>

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.35rem 0.75rem",
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            cursor: "pointer",
            fontFamily: "var(--font-sans)"
          }}
        >
          <Search style={{ width: "0.8rem", height: "0.8rem" }} />
          <span>Search or ⌘K</span>
        </button>
      </div>
    </header>
  );
}


