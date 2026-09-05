import React, { useEffect, useState } from "react";
import { Shield, Server, CheckCircle, Wifi, Activity } from "lucide-react";
import {
  ConnectionTable,
  PacketTimeline,
  TombstonePanel,
  MetricsPanel,
  SimulationControls
} from "./components";
import { getStatus, getConnections, getTombstones, getPackets, runScenario, resetSimulation } from "./services/api";
import { useSocket } from "./hooks/useSocket";

export default function App() {
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [connections, setConnections] = useState([]);
  const [tombstones, setTombstones] = useState([]);
  const [packets, setPackets] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const { isConnected, lastEvent } = useSocket();

  const refreshData = async () => {
    try {
      const statusRes = await getStatus();
      setServerStatus(statusRes.phaseStatus || "Online");

      const connRes = await getConnections();
      setConnections(connRes || []);

      const tombRes = await getTombstones();
      setTombstones(tombRes || []);

      const pktRes = await getPackets();
      setPackets(pktRes || []);
    } catch (err) {
      setServerStatus("Offline / Connecting...");
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastEvent) {
      refreshData();
    }
  }, [lastEvent]);

  const handleRunScenario = async (scenarioName) => {
    const result = await runScenario(scenarioName);
    if (scenarioName === "comparison") {
      setComparisonData(result);
    }
    await refreshData();
  };

  const handleReset = async () => {
    await resetSimulation();
    setComparisonData(null);
    await refreshData();
  };

  return (
    <div className="container" style={{ paddingBottom: "3rem" }}>
      {/* Header */}
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Shield style={{ color: "#38bdf8", width: "2.25rem", height: "2.25rem" }} />
            <h1 className="title-glow" style={{ fontSize: "2.25rem", fontWeight: "700", letterSpacing: "-0.02em" }}>
              PortShadow
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Incarnation-Aware Transport Isolation Engine & Security Dashboard
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span className="badge badge-indigo">
            <Server style={{ width: "0.875rem", height: "0.875rem" }} /> {serverStatus}
          </span>
          <span className={`badge ${isConnected ? "badge-emerald" : "badge-rose"}`}>
            <Wifi style={{ width: "0.875rem", height: "0.875rem" }} /> {isConnected ? "Live Telemetry" : "Connecting WS"}
          </span>
        </div>
      </header>

      {/* Simulation Controls */}
      <div style={{ marginBottom: "1.5rem" }}>
        <SimulationControls onRunScenario={handleRunScenario} onReset={handleReset} />
      </div>

      {/* Analytics & Metrics */}
      <div style={{ marginBottom: "1.5rem" }}>
        <MetricsPanel comparisonData={comparisonData} />
      </div>

      {/* Grid: Connection Table & Tombstone Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <ConnectionTable connections={connections} />
        <TombstonePanel tombstones={tombstones} />
      </div>

      {/* Packet Stream Timeline */}
      <div>
        <PacketTimeline packets={packets} />
      </div>
    </div>
  );
}
