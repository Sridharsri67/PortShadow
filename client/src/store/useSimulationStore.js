import { create } from "zustand";

export const useSimulationStore = create((set, get) => ({
  // Navigation & View State
  activeTab: "overview",
  demoMode: false,
  commandPaletteOpen: false,
  selectedConnection: null,
  
  // Real-time Data Stores
  connections: [],
  packets: [],
  tombstones: [],
  comparisonData: null,
  benchmarkData: null,
  
  // Toasts
  toasts: [],

  // System Stats & Metrics
  stats: {
    activeConnectionsCount: 0,
    packetsCreatedCount: 0,
    staleRejectedCount: 0,
    acceptedCount: 0,
    activeTombstonesCount: 0,
  },

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDemoMode: (enabled) => set({ demoMode: enabled }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setProfileDrawerOpen: (open) => set({ profileDrawerOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setSelectedConnection: (conn) => set({ selectedConnection: conn }),

  setConnections: (connections) => set({ connections }),
  setPackets: (packets) => set((state) => {
    // Keep max 100 recent packets for smooth rendering
    const recent = packets.slice(-100);
    const staleRejected = recent.filter(p => p.status === "REJECTED" && p.rejectionReason === "STALE_INCARNATION").length;
    const accepted = recent.filter(p => p.status === "ACCEPTED").length;
    return {
      packets: recent,
      stats: {
        ...state.stats,
        packetsCreatedCount: packets.length,
        staleRejectedCount: staleRejected,
        acceptedCount: accepted
      }
    };
  }),
  
  addPacketEvent: (packet) => set((state) => {
    const nextPackets = [...state.packets, packet].slice(-100);
    const staleRejected = nextPackets.filter(p => p.status === "REJECTED" && p.rejectionReason === "STALE_INCARNATION").length;
    const accepted = nextPackets.filter(p => p.status === "ACCEPTED").length;
    return {
      packets: nextPackets,
      stats: {
        ...state.stats,
        staleRejectedCount: staleRejected,
        acceptedCount: accepted
      }
    };
  }),

  setTombstones: (tombstones) => set((state) => ({
    tombstones,
    stats: { ...state.stats, activeTombstonesCount: tombstones.length }
  })),

  setComparisonData: (comparisonData) => set({ comparisonData }),
  setBenchmarkData: (benchmarkData) => set({ benchmarkData }),

  addToast: (message, type = "info") => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}));
