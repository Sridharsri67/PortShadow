import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulationStore } from "../../store/useSimulationStore";
import { CircleCheck, CircleX, Info, AlertTriangle } from "lucide-react";

export function ToastContainer() {
  const toasts = useSimulationStore((state) => state.toasts);
  const removeToast = useSimulationStore((state) => state.removeToast);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2.5rem",
        right: "1.5rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        pointerEvents: "none"
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const getIcon = () => {
            switch (toast.type) {
              case "error":
                return <CircleX style={{ width: "0.9rem", height: "0.9rem", color: "var(--status-error)" }} />;
              case "warning":
                return <AlertTriangle style={{ width: "0.9rem", height: "0.9rem", color: "var(--status-warning)" }} />;
              case "success":
                return <CircleCheck style={{ width: "0.9rem", height: "0.9rem", color: "var(--status-success)" }} />;
              default:
                return <Info style={{ width: "0.9rem", height: "0.9rem", color: "var(--status-info)" }} />;
            }
          };

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={() => removeToast(toast.id)}
              style={{
                pointerEvents: "auto",
                padding: "0.6rem 0.9rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border-medium)",
                boxShadow: "var(--shadow-elevated)",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                fontSize: "0.825rem",
                color: "var(--text-primary)",
                cursor: "pointer",
                maxWidth: "360px"
              }}
            >
              {getIcon()}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
