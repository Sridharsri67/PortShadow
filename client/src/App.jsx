import React, { useEffect } from "react";
import {
  AppShell,
  Hero,
  SecurityStatus,
  IsolationVisualization,
  ManualTestPanel,
  LiveActivity,
  ConnectionTable,
  PacketTimeline,
  NetworkTopology,
  NetworkControls,
  TombstonePanel,
  ScenarioList,
  ComparisonView,
  MetricsPanel,
  PerformancePanel
} from "./components";
import { getStatus, getConnections, getTombstones, getPackets } from "./services/api";
import { useSocket } from "./hooks/useSocket";
import { useSimulationStore } from "./store/useSimulationStore";

export default function App() {
  const activeTab = useSimulationStore((state) => state.activeTab);
  const setConnections = useSimulationStore((state) => state.setConnections);
  const setTombstones = useSimulationStore((state) => state.setTombstones);
  const setPackets = useSimulationStore((state) => state.setPackets);
  const { lastEvent } = useSocket();

  const refreshData = async () => {
    try {
      const [connRes, tombRes, pktRes] = await Promise.all([
        getConnections(),
        getTombstones(),
        getPackets()
      ]);
      setConnections(connRes || []);
      setTombstones(tombRes || []);
      setPackets(pktRes || []);
    } catch (err) {
      console.error("Failed to fetch simulation data:", err);
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

  const renderContent = () => {
    switch (activeTab) {
      case "connections":
        return <ConnectionTable />;

      case "packets":
        return <PacketTimeline />;

      case "network":
        return (
          <>
            <NetworkTopology />
            <NetworkControls />
          </>
        );

      case "scenarios":
        return (
          <>
            <ManualTestPanel />
            <ScenarioList />
          </>
        );

      case "isolation":
        return <IsolationVisualization />;

      case "comparison":
        return <ComparisonView />;

      case "tombstones":
        return <TombstonePanel />;

      case "metrics":
        return (
          <>
            <MetricsPanel />
            <PerformancePanel />
          </>
        );

      case "docs":
        return (
          <div className="panel font-mono" style={{ lineHeight: "1.6" }}>
            <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
              PORTSHADOW ARCHITECTURE SPECIFICATION
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              PortShadow prevents delayed transport-layer packets from modifying active connection state following rapid 4-tuple endpoint reuse.
            </p>
            <ul style={{ color: "var(--text-muted)", paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li><strong>128-bit UUID Incarnation ID:</strong> Cryptographically generated per connection lifetime.</li>
              <li><strong>Zero State Mutation Invariant:</strong> Incoming packets with stale Incarnation IDs are discarded without mutating receiver sequence windows.</li>
              <li><strong>Teardown Tombstones:</strong> Retains 5-second TTL historical markers for closed connections.</li>
            </ul>
          </div>
        );

      case "overview":
      default:
        return (
          <>
            <Hero />
            <IsolationVisualization />
            <ManualTestPanel />
            <ConnectionTable />
            <PacketTimeline />
            <LiveActivity />
          </>
        );
    }
  };

  return <AppShell>{renderContent()}</AppShell>;
}
