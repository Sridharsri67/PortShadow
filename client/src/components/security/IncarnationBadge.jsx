import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export function IncarnationBadge({ incarnationId, shortLength = 8 }) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!incarnationId) return <span className="font-mono text-faint">N/A</span>;

  const shortId = incarnationId.slice(0, shortLength);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(incarnationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.15rem 0.45rem",
        borderRadius: "4px",
        backgroundColor: "var(--surface-3)",
        border: "1px solid var(--border-default)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        color: "var(--text-primary)",
        cursor: "pointer",
        transition: "border-color 0.15s ease"
      }}
      title={`Full Incarnation ID: ${incarnationId}`}
      onClick={handleCopy}
    >
      <span style={{ color: "#a1a1aa" }}>ID</span>
      <span>{isHovered ? incarnationId : shortId}</span>
      {copied ? (
        <Check style={{ width: "0.7rem", height: "0.7rem", color: "var(--status-success)" }} />
      ) : (
        <Copy style={{ width: "0.7rem", height: "0.7rem", color: "var(--text-muted)", opacity: isHovered ? 1 : 0.5 }} />
      )}
    </div>
  );
}
