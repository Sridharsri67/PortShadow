import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

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

    // Listen to all telemetry events
    const events = [
      "connection:created",
      "connection:closed",
      "packet:sent",
      "packet:delayed",
      "packet:released",
      "packet:accepted",
      "packet:rejected",
      "tombstone:created"
    ];

    events.forEach((evt) => {
      socketIo.on(evt, (data) => {
        setLastEvent({ name: evt, payload: data, timestamp: new Date().toLocaleTimeString() });
      });
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return { socket, isConnected, lastEvent };
}
