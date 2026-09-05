import React from "react";
import { Navbar } from "./Navbar";
import { ToastContainer } from "../ui/Toast";
import { CommandPalette } from "../ui/CommandPalette";
import { ConnectionDrawer } from "../ui/Drawer";
import { ProfileDrawer } from "../ui/ProfileDrawer";
import { useSimulationStore } from "../../store/useSimulationStore";

export function AppShell({ children }) {
  const selectedConnection = useSimulationStore((state) => state.selectedConnection);
  const setSelectedConnection = useSimulationStore((state) => state.setSelectedConnection);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "var(--background)" }}>
      <Navbar />

      <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem", backgroundColor: "var(--bg-subtle)" }}>
        {children}
      </main>

      {/* Global Overlays */}
      <ToastContainer />
      <CommandPalette />
      <ConnectionDrawer connection={selectedConnection} onClose={() => setSelectedConnection(null)} />
      <ProfileDrawer />
    </div>
  );
}




