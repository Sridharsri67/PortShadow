import React from "react";
import { Activity, ShieldAlert, ShieldCheck, Clock, Layers } from "lucide-react";
import { useSimulationStore } from "../store/useSimulationStore";

export function PacketTimeline({ packets: propPackets }) {
  const storePackets = useSimulationStore((state) => state.packets);
  const packets = propPackets || storePackets || [];
  const getBadge = (status, reason) => {
    switch (status) {
      case "ACCEPTED":
        return <span className="badge badge-emerald"><ShieldCheck style={{ width: "0.75rem", height: "0.75rem" }} /> ACCEPTED</span>;
      case "REJECTED":
        return <span className="badge badge-rose"><ShieldAlert style={{ width: "0.75rem", height: "0.75rem" }} /> REJECTED ({reason})</span>;
      case "DELAYED":
        return <span className="badge badge-amber"><Clock style={{ width: "0.75rem", height: "0.75rem" }} /> DELAYED</span>;
      case "BUFFERED":
        return <span className="badge badge-indigo"><Layers style={{ width: "0.75rem", height: "0.75rem" }} /> BUFFERED</span>;
      default:
        return <span className="badge badge-indigo">{status}</span>;
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Activity style={{ color: "#10b981", width: "1.25rem", height: "1.25rem" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Transport Packet Stream</h3>
        </div>
        <span className="badge badge-indigo">{packets.length} Packets</span>
      </div>

      <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {packets.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            No packet stream activity recorded.
          </div>
        ) : (
          packets.map((pkt, idx) => (
            <div
              key={pkt.packetId || idx}
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(0, 0, 0, 0.25)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "#38bdf8", minWidth: "40px" }}>
                  {pkt.packetId}
                </span>
                <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  Seq: <strong style={{ color: "#f8fafc" }}>#{pkt.sequenceNumber}</strong> | Incarnation: <span style={{ color: "#a5b4fc" }}>{pkt.incarnationId ? pkt.incarnationId.slice(0, 8) : "N/A"}</span>
                </div>
              </div>
              <div>{getBadge(pkt.status, pkt.rejectionReason)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
