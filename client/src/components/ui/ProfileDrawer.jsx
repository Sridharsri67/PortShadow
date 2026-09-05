import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, ShieldCheck, Database, Server, Zap, RefreshCw, Terminal, CheckCircle2 } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";
import { resetSimulation, runScenario } from "../../services/api";

export function ProfileDrawer() {
  const isOpen = useSimulationStore((state) => state.profileDrawerOpen);
  const setOpen = useSimulationStore((state) => state.setProfileDrawerOpen);
  const setCommandPaletteOpen = useSimulationStore((state) => state.setCommandPaletteOpen);
  const setActiveTab = useSimulationStore((state) => state.setActiveTab);
  const addToast = useSimulationStore((state) => state.addToast);
  const stats = useSimulationStore((state) => state.stats);

  if (!isOpen) return null;

  const handleResetEngine = async () => {
    try {
      await resetSimulation();
      addToast("PortShadow Engine State Reset Successfully", "warning");
    } catch (err) {
      addToast(`Engine Reset Failed: ${err.message}`, "error");
    }
  };

  const handleRunBenchmark = async () => {
    try {
      const comp = await runScenario("comparison");
      useSimulationStore.getState().setComparisonData(comp);
      setActiveTab("comparison");
      setOpen(false);
      addToast("Naive vs PortShadow Benchmark Executed", "success");
    } catch (err) {
      addToast(`Benchmark Execution Failed: ${err.message}`, "error");
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          justifyContent: "flex-end"
        }}
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "420px",
            height: "100%",
            backgroundColor: "var(--surface-1)",
            borderLeft: "1px solid var(--border-medium)",
            boxShadow: "var(--shadow-elevated)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            overflowY: "auto"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000000"
                }}
              >
                <User style={{ width: "1.2rem", height: "1.2rem" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "#ffffff", lineHeight: 1.1 }}>
                  System Administrator
                </h3>
                <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                  ROOT TRANSPORT SECURITY ENGINEER
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X style={{ width: "1.2rem", height: "1.2rem" }} />
            </button>
          </div>

          {/* User Profile Info Card */}
          <div style={{ padding: "1rem", backgroundColor: "var(--surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.6rem", letterSpacing: "0.08em" }}>
              USER PRIVILEGES & SESSION
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Role:</span>
                <span style={{ color: "#ffffff", fontWeight: "600" }}>Root Incarnation Admin</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Access Level:</span>
                <span style={{ color: "var(--status-success)" }}>Level 5 (Full Mutation Right)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Session Status:</span>
                <span style={{ color: "#ffffff" }}>Authenticated (Active)</span>
              </div>
            </div>
          </div>

          {/* System & Database Connectivity */}
          <div style={{ padding: "1rem", backgroundColor: "var(--surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.6rem", letterSpacing: "0.08em" }}>
              SYSTEM CONNECTIVITY & INFRASTRUCTURE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Database style={{ width: "0.85rem", height: "0.85rem", color: "var(--text-muted)" }} />
                  <span>PostgreSQL Database</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                  <span className="dot-indicator dot-success" />
                  <span style={{ color: "var(--status-success)" }}>Neon Cloud Live</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Server style={{ width: "0.85rem", height: "0.85rem", color: "var(--text-muted)" }} />
                  <span>Express API Gateway</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                  <span className="dot-indicator dot-success" />
                  <span style={{ color: "#ffffff" }}>Port 5005 OK</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Zap style={{ width: "0.85rem", height: "0.85rem", color: "var(--text-muted)" }} />
                  <span>Realtime Socket Engine</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                  <span className="dot-indicator dot-success" />
                  <span style={{ color: "#ffffff" }}>Socket.IO Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Interactive Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
              ADMINISTRATIVE CONTROLS
            </div>

            <button
              className="btn-secondary"
              onClick={handleResetEngine}
              style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem", padding: "0.5rem" }}
            >
              <RefreshCw style={{ width: "0.85rem", height: "0.85rem" }} />
              <span>Reset PortShadow Engine State</span>
            </button>

            <button
              className="btn-secondary"
              onClick={handleRunBenchmark}
              style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem", padding: "0.5rem" }}
            >
              <Zap style={{ width: "0.85rem", height: "0.85rem" }} />
              <span>Run Benchmark Comparison</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                setOpen(false);
                setCommandPaletteOpen(true);
              }}
              style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem", padding: "0.5rem" }}
            >
              <Terminal style={{ width: "0.85rem", height: "0.85rem" }} />
              <span>Open Command Palette (⌘K)</span>
            </button>
          </div>

          {/* Security Guarantee Invariant Footer */}
          <div style={{ marginTop: "auto", padding: "1rem", backgroundColor: "var(--surface-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", color: "var(--status-success)" }}>
              <CheckCircle2 style={{ width: "0.95rem", height: "0.95rem" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Zero State Mutation Guarantee</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
              PortShadow active. Stale transport packets following rapid endpoint 4-tuple reuse are mathematically isolated using 128-bit Incarnation IDs.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
