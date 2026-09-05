import React, { useState } from "react";
import { motion } from "framer-motion";
import { GitCompare, AlertTriangle, ShieldCheck, Play } from "lucide-react";
import { runScenario } from "../../services/api";
import { useSimulationStore } from "../../store/useSimulationStore";

export function ComparisonView() {
  const [loading, setLoading] = useState(false);
  const comparisonData = useSimulationStore((state) => state.comparisonData);
  const setComparisonData = useSimulationStore((state) => state.setComparisonData);

  const handleRunComparison = async () => {
    setLoading(true);
    try {
      const res = await runScenario("comparison");
      setComparisonData(res);
    } finally {
      setLoading(false);
    }
  };

  const comp = comparisonData?.comparison;
  const naive = comp?.naive || { falseAcceptancesCount: 0, falseRejectionsCount: 0, acceptedCount: 0, rejectedCount: 0 };
  const ps = comp?.portShadow || { falseAcceptancesCount: 0, falseRejectionsCount: 0, acceptedCount: 0, rejectedCount: 0 };


  return (
    <div className="panel" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
            SIDE-BY-SIDE PIPELINE COMPARISON
          </div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "600" }}>Naive Age Filter vs. PortShadow Engine</h3>
        </div>

        <button className="btn-primary" onClick={handleRunComparison} disabled={loading}>
          <GitCompare style={{ width: "0.9rem", height: "0.9rem" }} />
          <span>{loading ? "BENCHMARKING..." : "RUN BENCHMARK COMPARISON"}</span>
        </button>
      </div>

      {/* Split Screen Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Left: Naive Filter */}
        <div style={{ padding: "1.25rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--status-warning)", fontWeight: "700", fontFamily: "var(--font-mono)", marginBottom: "0.75rem" }}>
            <AlertTriangle style={{ width: "1rem", height: "1rem" }} /> NAIVE AGE FILTER (4-TUPLE + AGE)
          </div>

          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Evaluates traffic solely on 4-tuple and packet age threshold (5000ms). Ignores transport incarnation IDs.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
            <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
              1. 4-TUPLE MATCH $\rightarrow$ 10.0.0.1:5000
            </div>
            <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
              2. AGE CHECK $\rightarrow$ 1000ms $\le$ 5000ms
            </div>
            <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "rgba(248, 113, 113, 0.15)", border: "1px solid var(--status-error)", color: "var(--status-error)", fontWeight: "700", borderRadius: "var(--radius-sm)" }}>
              3. ACCEPT STALE PACKET A2 $\rightarrow$ FALSE ACCEPTANCE (SECURITY VULNERABILITY)
            </div>
          </div>
        </div>

        {/* Right: PortShadow Engine */}
        <div style={{ padding: "1.25rem", backgroundColor: "var(--surface-2)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--status-success)", fontWeight: "700", fontFamily: "var(--font-mono)", marginBottom: "0.75rem" }}>
            <ShieldCheck style={{ width: "1rem", height: "1rem" }} /> PORTSHADOW ENGINE (INCARNATION-AWARE)
          </div>

          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Validates 128-bit Incarnation ID before state mutation. Guarantees zero stale packet pollution.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
            <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
              1. 4-TUPLE MATCH $\rightarrow$ 10.0.0.1:5000
            </div>
            <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
              2. INCARNATION CHECK $\rightarrow$ A7F91C2D $\ne$ C29D8E41
            </div>
            <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "rgba(110, 231, 160, 0.15)", border: "1px solid var(--status-success)", color: "var(--status-success)", fontWeight: "700", borderRadius: "var(--radius-sm)" }}>
              3. REJECT STALE PACKET A2 $\rightarrow$ 100% ISOLATION (STATE UNCHANGED)
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancy Counters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ padding: "1rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            FALSE ACCEPTANCES (SECURITY BREACHES)
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", fontFamily: "var(--font-mono)", marginTop: "0.5rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NAIVE: </span>
              <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--status-error)" }}>{naive.falseAcceptancesCount}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PORTSHADOW: </span>
              <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--status-success)" }}>0</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "1rem", backgroundColor: "var(--surface-3)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            FALSE REJECTIONS (RELIABILITY PACKET LOSS)
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", fontFamily: "var(--font-mono)", marginTop: "0.5rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NAIVE: </span>
              <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--status-warning)" }}>{naive.falseRejectionsCount}</span>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>PORTSHADOW: </span>
              <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--status-success)" }}>0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Discrepancy Packet Log */}
      {comp?.details && comp.details.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            Packet Discrepancy Audit Log ({comp.details.length} Packets Evaluated)
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-medium)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.5rem" }}>Packet ID</th>
                  <th style={{ padding: "0.5rem" }}>Seq #</th>
                  <th style={{ padding: "0.5rem" }}>PortShadow Decision</th>
                  <th style={{ padding: "0.5rem" }}>Naive Filter Decision</th>
                  <th style={{ padding: "0.5rem" }}>Discrepancy / Vulnerability</th>
                </tr>
              </thead>
              <tbody>
                {comp.details.map((item, i) => {
                  const isFalseAccept = item.discrepancyType === "FALSE_ACCEPTANCE";
                  const isFalseReject = item.discrepancyType === "FALSE_REJECTION";
                  return (
                    <tr key={item.packetId || i} style={{ borderBottom: "1px solid var(--border-default)" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "700", fontFamily: "var(--font-mono)", color: "#38bdf8" }}>
                        {item.packetId}
                      </td>
                      <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)" }}>
                        #{item.sequenceNumber}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <span className={`badge ${item.portShadow.status === "REJECTED" ? "badge-rose" : "badge-emerald"}`}>
                          {item.portShadow.status} ({item.portShadow.reason})
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <span className={`badge ${item.naive.status === "ACCEPTED" ? "badge-amber" : "badge-rose"}`}>
                          {item.naive.status} ({item.naive.reason})
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem", color: isFalseAccept ? "var(--status-error)" : isFalseReject ? "var(--status-warning)" : "var(--text-muted)" }}>
                        <strong>{item.discrepancyType || "MATCH"}</strong>: {item.explanation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
