import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Server, Key, ArrowRight, ShieldCheck } from "lucide-react";
import { IncarnationBadge } from "../security/IncarnationBadge";

export function ConnectionDrawer({ connection, onClose }) {
  if (!connection) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(2px)",
          zIndex: 9000,
          display: "flex",
          justifyContent: "flex-end"
        }}
        onClick={onClose}
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
            gap: "1.5rem"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Server style={{ width: "1.1rem", height: "1.1rem", color: "var(--text-primary)" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: "600", fontFamily: "var(--font-mono)" }}>
                {connection.connectionId}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X style={{ width: "1.1rem", height: "1.1rem" }} />
            </button>
          </div>

          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            CONNECTION DETAILS & TRANSPORT STATE
          </div>

          {/* Details List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>STATUS</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className={`dot-indicator ${connection.state === "ESTABLISHED" ? "dot-success" : "dot-error"}`} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", fontWeight: "600" }}>{connection.state}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>TRANSPORT 4-TUPLE</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                {connection.sourceIp}:{connection.sourcePort} <ArrowRight style={{ width: "0.75rem", height: "0.75rem", display: "inline" }} /> {connection.destinationIp}:{connection.destinationPort}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>128-BIT INCARNATION ID</div>
              <IncarnationBadge incarnationId={connection.incarnationId} shortLength={12} />
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>TRANSPORT SEQUENCE NUMBER</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: "700" }}>
                #{connection.sequenceNumber}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>CREATED AT</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {connection.createdAt || new Date().toISOString()}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto", padding: "1rem", backgroundColor: "var(--surface-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", color: "var(--status-success)" }}>
              <ShieldCheck style={{ width: "0.9rem", height: "0.9rem" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Incarnation Protection Active</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Packets missing matching Incarnation ID <code className="font-mono">{connection.incarnationId?.slice(0, 8)}</code> will be discarded without mutating receiver sequence windows.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
