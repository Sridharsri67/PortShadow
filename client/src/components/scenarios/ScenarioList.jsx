import React, { useState } from "react";
import { Play, Zap, ArrowRight, RefreshCw, Layers, RotateCcw, GitCompare } from "lucide-react";
import { runScenario } from "../../services/api";
import { useSimulationStore } from "../../store/useSimulationStore";

export function ScenarioList() {
  const [running, setRunning] = useState(null);
  const addToast = useSimulationStore((state) => state.addToast);
  const setActiveTab = useSimulationStore((state) => state.setActiveTab);

  const scenarioGroups = [
    {
      category: "CORE",
      items: [
        {
          key: "rapid-reuse",
          name: "Rapid Endpoint Reuse (Core MVP)",
          desc: "Simulates immediate 4-tuple recycling with delayed packet isolation.",
          icon: Zap
        },
        {
          key: "comparison",
          name: "Naive vs PortShadow Comparison",
          desc: "Side-by-side benchmark highlighting false acceptances & false rejections.",
          icon: GitCompare
        }
      ]
    },
    {
      category: "TRANSPORT BEHAVIOR",
      items: [
        {
          key: "retransmission",
          name: "Legitimate Retransmission",
          desc: "Proves legitimate retransmissions matching active incarnation are accepted.",
          icon: RefreshCw
        },
        {
          key: "reordering",
          name: "Out-of-Order Delivery Queue",
          desc: "Demonstrates sequence gap buffering and auto-flushing.",
          icon: Layers
        },
        {
          key: "duplicate",
          name: "Duplicate Packet Deduplication",
          desc: "Verifies transport-layer sequence deduplication.",
          icon: RotateCcw
        },
        {
          key: "mixed",
          name: "Mixed Traffic Stream Chaos",
          desc: "Complex stream combining delayed stale packets, out-of-order packets, and duplicates.",
          icon: Play
        }
      ]
    }
  ];

  const handleRun = async (scenarioKey) => {
    setRunning(scenarioKey);
    try {
      const res = await runScenario(scenarioKey);
      if (scenarioKey === "comparison") {
        useSimulationStore.getState().setComparisonData(res);
        setActiveTab("comparison");
      }
      addToast(`Scenario '${scenarioKey}' executed successfully!`, "success");
    } catch (err) {
      addToast(`Scenario execution error: ${err.message}`, "error");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
            PRE-CONFIGURED EDGE-CASE LAUNCHER
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Simulation Scenarios</h3>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {scenarioGroups.map((grp) => (
          <div key={grp.category}>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-faint)", marginBottom: "0.6rem", letterSpacing: "0.08em" }}>
              {grp.category}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0.85rem" }}>
              {grp.items.map((sc) => {
                const Icon = sc.icon;
                const isRunning = running === sc.key;

                return (
                  <div
                    key={sc.key}
                    onClick={() => handleRun(sc.key)}
                    style={{
                      padding: "1rem 1.1rem",
                      backgroundColor: "var(--surface-2)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease"
                    }}
                    className="cmd-item"
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                      <div style={{ padding: "0.4rem", backgroundColor: "var(--surface-3)", borderRadius: "var(--radius-sm)", marginTop: "0.1rem" }}>
                        <Icon style={{ width: "1rem", height: "1rem", color: "var(--text-primary)" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                          {sc.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                          {sc.desc}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap", marginLeft: "1rem" }}>
                      <span>{isRunning ? "..." : "RUN"}</span>
                      <ArrowRight style={{ width: "0.9rem", height: "0.9rem" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
