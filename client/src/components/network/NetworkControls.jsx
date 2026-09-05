import React, { useState } from "react";
import { Sliders, RotateCcw, Check } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";

export function NetworkControls() {
  const [latency, setLatency] = useState(120);
  const [jitter, setJitter] = useState(20);
  const [loss, setLoss] = useState(0);
  const [reordering, setReordering] = useState(25);
  const [duplication, setDuplication] = useState(0);
  const addToast = useSimulationStore((state) => state.addToast);

  const handleApply = () => {
    addToast(`Network Conditions Applied: ${latency}ms latency, ${loss}% loss, ${reordering}% reordering`, "success");
  };

  const handleReset = () => {
    setLatency(0);
    setJitter(0);
    setLoss(0);
    setReordering(0);
    setDuplication(0);
    addToast("Network simulator controls reset to zero delay.", "info");
  };

  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sliders style={{ width: "1rem", height: "1rem", color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            NETWORK CONDITIONS CONTROL PANEL
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn-secondary" onClick={handleReset}>
            <RotateCcw style={{ width: "0.8rem", height: "0.8rem" }} />
            <span>RESET</span>
          </button>
          <button className="btn-primary" onClick={handleApply}>
            <Check style={{ width: "0.8rem", height: "0.8rem" }} />
            <span>APPLY</span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
        {/* Latency */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            <span>Latency</span>
            <span style={{ color: "var(--text-primary)" }}>{latency} ms</span>
          </div>
          <input
            type="range"
            min="0"
            max="5000"
            step="50"
            value={latency}
            onChange={(e) => setLatency(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#ffffff", cursor: "pointer" }}
          />
        </div>

        {/* Jitter */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            <span>Jitter</span>
            <span style={{ color: "var(--text-primary)" }}>{jitter} ms</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={jitter}
            onChange={(e) => setJitter(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#ffffff", cursor: "pointer" }}
          />
        </div>

        {/* Packet Loss */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            <span>Packet Loss</span>
            <span style={{ color: "var(--text-primary)" }}>{loss}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={loss}
            onChange={(e) => setLoss(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#ffffff", cursor: "pointer" }}
          />
        </div>

        {/* Reordering */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            <span>Reordering</span>
            <span style={{ color: "var(--text-primary)" }}>{reordering}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={reordering}
            onChange={(e) => setReordering(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#ffffff", cursor: "pointer" }}
          />
        </div>

        {/* Duplication */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
            <span>Duplication</span>
            <span style={{ color: "var(--text-primary)" }}>{duplication}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={duplication}
            onChange={(e) => setDuplication(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#ffffff", cursor: "pointer" }}
          />
        </div>
      </div>
    </div>
  );
}
