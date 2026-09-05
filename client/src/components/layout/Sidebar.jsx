import React from "react";
import { useSimulationStore } from "../../store/useSimulationStore";
import {
  Activity,
  Server,
  Layers,
  Play,
  Shield,
  GitCompare,
  Skull,
  BarChart3,
  BookOpen
} from "lucide-react";

export function Sidebar() {
  const activeTab = useSimulationStore((state) => state.activeTab);
  const setActiveTab = useSimulationStore((state) => state.setActiveTab);

  const sections = [
    {
      title: "OVERVIEW",
      items: [
        { key: "overview", label: "Overview", icon: Activity },
        { key: "connections", label: "Connections", icon: Server },
        { key: "packets", label: "Packets", icon: Layers },
        { key: "network", label: "Network", icon: Play },
        { key: "scenarios", label: "Scenarios", icon: Play }
      ]
    },
    {
      title: "SECURITY",
      items: [
        { key: "isolation", label: "Incarnation Isolation", icon: Shield },
        { key: "comparison", label: "Naive Comparison", icon: GitCompare },
        { key: "tombstones", label: "Tombstones", icon: Skull }
      ]
    },
    {
      title: "ANALYTICS",
      items: [
        { key: "metrics", label: "Metrics & Benchmarks", icon: BarChart3 }
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { key: "docs", label: "Documentation", icon: BookOpen }
      ]
    }
  ];

  return (
    <aside
      style={{
        width: "220px",
        height: "100%",
        backgroundColor: "var(--background)",
        borderRight: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 0.75rem",
        flexShrink: 0
      }}
    >
      {/* Brand Header */}
      <div style={{ padding: "0 0.5rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
          <span style={{ fontSize: "1rem", fontWeight: "700", letterSpacing: "-0.02em" }}>PORTSHADOW</span>
        </div>
        <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
          TRANSPORT OBSERVBILITY
        </div>
      </div>

      {/* Nav Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto", flex: 1 }}>
        {sections.map((sec) => (
          <div key={sec.title}>
            <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-faint)", padding: "0 0.5rem 0.4rem", letterSpacing: "0.08em" }}>
              {sec.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.45rem 0.6rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: isActive ? "var(--surface-2)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      border: "none",
                      fontSize: "0.825rem",
                      fontWeight: isActive ? "500" : "400",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {/* Active vertical white indicator */}
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "20%",
                          bottom: "20%",
                          width: "2px",
                          backgroundColor: "#ffffff",
                          borderRadius: "1px"
                        }}
                      />
                    )}
                    <Icon style={{ width: "0.9rem", height: "0.9rem", color: isActive ? "#ffffff" : "var(--text-muted)" }} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
