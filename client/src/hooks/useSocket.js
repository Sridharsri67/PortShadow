import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSimulationStore } from "../store/useSimulationStore";

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const addToast = useSimulationStore((state) => state.addToast);
  const addPacketEvent = useSimulationStore((state) => state.addPacketEvent);

  useEffect(() => {
    const socketIo = io("/", {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5
    });

    socketIo.on("connect", () => {
      setIsConnected(true);
    });

    socketIo.on("disconnect", () => {
      setIsConnected(false);
    });

    socketIo.on("connection:created", (data) => {
      setLastEvent({ name: "connection:created", payload: data });
      addToast(`Connection Created: ${data.data?.connectionId || "Active"}`);
    });

    socketIo.on("connection:closed", (data) => {
      setLastEvent({ name: "connection:closed", payload: data });
      addToast(`Connection Teardown: ${data.data?.connectionId}`, "warning");
    });

    socketIo.on("packet:accepted", (data) => {
      setLastEvent({ name: "packet:accepted", payload: data });
      if (data.data?.packet) {
        addPacketEvent(data.data.packet);
      }
    });

    socketIo.on("packet:rejected", (data) => {
      setLastEvent({ name: "packet:rejected", payload: data });
      if (data.data?.packet) {
        addPacketEvent(data.data.packet);
        if (data.data.packet.rejectionReason === "STALE_INCARNATION") {
          addToast(`🔒 Stale Packet Rejected: ${data.data.packet.packetId} (${data.data.packet.incarnationId.slice(0, 8)})`, "error");
        }
      }
    });

    socketIo.on("tombstone:created", (data) => {
      setLastEvent({ name: "tombstone:created", payload: data });
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [addToast, addPacketEvent]);

  return { socket, isConnected, lastEvent };
}
