import React, { useState } from "react";
import { Play, RotateCcw, Zap, GitCompare, RefreshCw, Layers } from "lucide-react";

export function SimulationControls({ onRunScenario, onReset }) {
  const [loadingScenario, setLoadingScenario] = useState(null);

  const scenarios = [
    { key: "rapid-reuse", label: "1. Rapid Reuse (Core MVP)", icon: Zap, color: "#38bdf8" },
    { key: "retransmission", label: "2. Retransmission", icon: RefreshCw, color: "#10b981" },
    { key: "reordering", label: "3. Reordering Buffer", icon: Layers, color: "#6366f1" },
    { key: "duplicate", label: "4. Duplicate Packets", icon: RotateCcw, color: "#f59e0b" },
    { key: "mixed", label: "5. Mixed Traffic Stream", icon: Play, color: "#ec4899" },
    { key: "comparison", label: "6. Naive vs PortShadow Comparison", icon: GitCompare, color: "#a855f7" }
  ];

  const handleRun = async (scenarioKey) => {
    setLoadingScenario(scenarioKey);
    try {
      await onRunScenario(scenarioKey);
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Interactive Simulation Controls</h3>
        <button
          onClick={onReset}
          className="badge badge-rose"
          style={{ cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}
        >
          <RotateCcw style={{ width: "0.75rem", height: "0.75rem" }} /> Reset Engine
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isLoading = loadingScenario === sc.key;

          return (
            <button
              key={sc.key}
              onClick={() => handleRun(sc.key)}
              disabled={isLoading}
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${sc.color}40`,
                borderRadius: "8px",
                color: "#f8fafc",
                fontWeight: "500",
                fontSize: "0.875rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease"
              }}
            >
              <Icon style={{ color: sc.color, width: "1rem", height: "1rem" }} />
              {isLoading ? "Running..." : sc.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
