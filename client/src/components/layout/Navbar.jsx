import React from "react";
import { useSimulationStore } from "../../store/useSimulationStore";
import {
  Shield,
  Search,
  Bell,
  BookOpen,
  User
} from "lucide-react";

export function Navbar() {
  const activeTab = useSimulationStore((state) => state.activeTab);
  const setActiveTab = useSimulationStore((state) => state.setActiveTab);
  const setCommandPaletteOpen = useSimulationStore((state) => state.setCommandPaletteOpen);
  const setProfileDrawerOpen = useSimulationStore((state) => state.setProfileDrawerOpen);
  const addToast = useSimulationStore((state) => state.addToast);


  const navItems = [
    { key: "overview", label: "Overview" },
    { key: "connections", label: "Connections" },
    { key: "packets", label: "Packets" },
    { key: "scenarios", label: "Scenarios" },
    { key: "isolation", label: "Isolation" },
    { key: "comparison", label: "Comparison" },
    { key: "tombstones", label: "Tombstones" },
    { key: "metrics", label: "Metrics" }
  ];

  return (
    <nav
      style={{
        height: "58px",
        backgroundColor: "#000000",
        borderBottom: "1px solid #141414",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        flexShrink: 0,
        userSelect: "none"
      }}
    >
      {/* 1. Left Section: Brand Text */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: "1.45rem", fontWeight: "800", letterSpacing: "-0.025em", color: "#ffffff" }}>
          PortShadow
        </span>
      </div>



      {/* 2. Center Section: Floating Segmented Pill Nav Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#0a0a0a",
          border: "1px solid #1c1c1c",
          borderRadius: "9999px",
          padding: "3px 4px",
          gap: "2px",
          overflowX: "auto",
          scrollbarWidth: "none",
          maxWidth: "calc(100vw - 420px)"
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.key || (item.key === "scenarios" && activeTab === "network");

          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                backgroundColor: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#000000" : "#888888",
                border: "none",
                borderRadius: "9999px",
                padding: "0.38rem 1.05rem",
                fontSize: "0.8rem",
                fontFamily: "var(--font-mono)",
                fontWeight: isActive ? "600" : "500",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#888888";
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 3. Right Section: Search ⌘K + Action Icons + Profile Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexShrink: 0 }}>
        {/* Search Pill Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.38rem 0.85rem",
            backgroundColor: "#0a0a0a",
            border: "1px solid #1c1c1c",
            borderRadius: "9999px",
            color: "#888888",
            fontSize: "0.75rem",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#333333";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1c1c1c";
            e.currentTarget.style.color = "#888888";
          }}
        >
          <Search style={{ width: "0.8rem", height: "0.8rem" }} />
          <span>Search ⌘K</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => addToast("PortShadow engine running cleanly (Socket.IO active)", "info")}
          style={{
            position: "relative",
            background: "none",
            border: "none",
            color: "#888888",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.2rem",
            transition: "color 0.15s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
          title="Notifications"
        >
          <Bell style={{ width: "1.1rem", height: "1.1rem" }} />
          {/* Active notification indicator dot */}
          <span
            style={{
              position: "absolute",
              top: "1px",
              right: "1px",
              width: "6px",
              height: "6px",
              backgroundColor: "#6ee7a0",
              borderRadius: "50%",
              boxShadow: "0 0 6px rgba(110, 231, 160, 0.6)"
            }}
          />
        </button>

        {/* Documentation Icon */}
        <button
          onClick={() => setActiveTab("docs")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "docs" ? "#ffffff" : "#888888",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.2rem",
            transition: "color 0.15s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => {
            if (activeTab !== "docs") e.currentTarget.style.color = "#888888";
          }}
          title="Documentation"
        >
          <BookOpen style={{ width: "1.1rem", height: "1.1rem" }} />
        </button>

        {/* User Profile Avatar Circle */}
        <button
          onClick={() => setProfileDrawerOpen(true)}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginLeft: "0.2rem",
            transition: "transform 0.15s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          title="User Profile & Settings"
        >
          <User style={{ width: "1rem", height: "1rem", color: "#000000" }} />
        </button>
      </div>
    </nav>
  );
}

