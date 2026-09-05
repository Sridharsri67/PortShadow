import React, { useEffect } from "react";
import { Command } from "cmdk";
import { useSimulationStore } from "../../store/useSimulationStore";
import { runScenario, resetSimulation, createConnection } from "../../services/api";
import { Play, RotateCcw, Activity, Server, Layers, ShieldCheck, Zap } from "lucide-react";

export function CommandPalette() {
  const isOpen = useSimulationStore((state) => state.commandPaletteOpen);
  const setOpen = useSimulationStore((state) => state.setCommandPaletteOpen);
  const setActiveTab = useSimulationStore((state) => state.setActiveTab);
  const addToast = useSimulationStore((state) => state.addToast);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const handleSelect = async (action) => {
    setOpen(false);
    try {
      switch (action) {
        case "nav-overview":
          setActiveTab("overview");
          break;
        case "nav-connections":
          setActiveTab("connections");
          break;
        case "nav-packets":
          setActiveTab("packets");
          break;
        case "nav-network":
          setActiveTab("network");
          break;
        case "nav-scenarios":
          setActiveTab("scenarios");
          break;
        case "nav-comparison":
          setActiveTab("comparison");
          break;
        case "nav-metrics":
          setActiveTab("metrics");
          break;
        case "run-rapid-reuse":
          await runScenario("rapid-reuse");
          addToast("Core MVP Rapid Reuse Scenario Triggered", "success");
          break;
        case "run-comparison":
          const comp = await runScenario("comparison");
          useSimulationStore.getState().setComparisonData(comp);
          setActiveTab("comparison");
          addToast("Naive vs PortShadow Benchmark Executed", "success");
          break;
        case "create-connection":
          await createConnection();
          addToast("New Connection Bound (Fresh 128-bit Incarnation ID)", "success");
          break;
        case "reset-engine":
          await resetSimulation();
          addToast("PortShadow Engine State Reset", "warning");
          break;
        default:
          break;
      }
    } catch (err) {
      addToast(`Action failed: ${err.message}`, "error");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh"
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "540px",
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-elevated)",
          overflow: "hidden"
        }}
      >
        <Command label="PortShadow Command Menu" style={{ width: "100%" }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Zap style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
            <Command.Input
              placeholder="Type a command or search view..."
              autoFocus
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <Command.List style={{ maxHeight: "300px", overflowY: "auto", padding: "0.5rem" }}>
            <Command.Empty style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>No results found.</Command.Empty>

            <Command.Group heading="SIMULATION SCENARIOS" style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "0.5rem 0.5rem 0.25rem", fontFamily: "var(--font-mono)" }}>
              <Item onSelect={() => handleSelect("run-rapid-reuse")} icon={Zap} title="Run Rapid Endpoint Reuse Scenario (Core MVP)" />
              <Item onSelect={() => handleSelect("run-comparison")} icon={ShieldCheck} title="Run Naive vs PortShadow Benchmark Comparison" />
              <Item onSelect={() => handleSelect("create-connection")} icon={Server} title="Create Transport Connection" />
              <Item onSelect={() => handleSelect("reset-engine")} icon={RotateCcw} title="Reset PortShadow Engine State" />
            </Command.Group>

            <Command.Group heading="NAVIGATION VIEWS" style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "0.5rem 0.5rem 0.25rem", fontFamily: "var(--font-mono)" }}>
              <Item onSelect={() => handleSelect("nav-overview")} icon={Activity} title="Overview Dashboard" />
              <Item onSelect={() => handleSelect("nav-connections")} icon={Server} title="Connections Table & Inspector" />
              <Item onSelect={() => handleSelect("nav-packets")} icon={Layers} title="Packet Event Stream" />
              <Item onSelect={() => handleSelect("nav-network")} icon={Play} title="Network Topology & Controls" />
              <Item onSelect={() => handleSelect("nav-scenarios")} icon={Play} title="Scenario Launcher" />
              <Item onSelect={() => handleSelect("nav-comparison")} icon={ShieldCheck} title="Naive Comparison View" />
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function Item({ onSelect, icon: Icon, title }) {
  return (
    <Command.Item
      onSelect={onSelect}
      style={{
        padding: "0.5rem 0.75rem",
        borderRadius: "var(--radius-sm)",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        fontSize: "0.85rem",
        color: "var(--text-primary)",
        cursor: "pointer",
        transition: "background-color 0.15s ease"
      }}
      className="cmd-item"
    >
      <Icon style={{ width: "0.9rem", height: "0.9rem", color: "var(--text-muted)" }} />
      <span>{title}</span>
    </Command.Item>
  );
}
