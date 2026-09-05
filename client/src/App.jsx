import React, { useEffect, useState } from "react";
import { Shield, Server, Activity, CheckCircle, Wifi } from "lucide-react";

export default function App() {
  const [serverStatus, setServerStatus] = useState("Checking...");
  const [wsStatus, setWsStatus] = useState("Disconnected");

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        setServerStatus(data.phaseStatus || "Online");
      })
      .catch((err) => {
        setServerStatus("Offline / Connecting...");
      });
  }, []);

  return (
    <div className="container">
      <header style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Shield style={{ color: "#38bdf8", width: "2rem", height: "2rem" }} />
            <h1 className="title-glow" style={{ fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.02em" }}>
              PortShadow
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Delayed Packet Isolation After Transport-Port Reuse
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <span className="badge badge-indigo">
            <Server style={{ width: "0.875rem", height: "0.875rem" }} /> Phase 1 Setup
          </span>
          <span className="badge badge-emerald">
            <CheckCircle style={{ width: "0.875rem", height: "0.875rem" }} /> System Ready
          </span>
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <Activity style={{ color: "#10b981", width: "1.25rem", height: "1.25rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Backend Service Status</h3>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
            Express backend health status and REST endpoint availability:
          </p>
          <div style={{ padding: "0.75rem", background: "rgba(0,0,0,0.3)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
            {serverStatus}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <Wifi style={{ color: "#6366f1", width: "1.25rem", height: "1.25rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Architecture Overview</h3>
          </div>
          <ul style={{ color: "var(--text-muted)", fontSize: "0.9rem", paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li><strong>Core:</strong> ConnectionManager, IncarnationManager, PacketValidator</li>
            <li><strong>Network:</strong> DelayEngine, ReorderEngine, DuplicateEngine</li>
            <li><strong>Frontend:</strong> React + Vite Dashboard</li>
            <li><strong>Protocol:</strong> Node.js `crypto.randomUUID()` (128-bit Incarnation ID)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
