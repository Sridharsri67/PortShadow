import { Server } from "socket.io";

/** @type {Server | null} */
let ioInstance = null;

export const SOCKET_EVENTS = {
  CONNECTION_CREATED: "connection:created",
  CONNECTION_CLOSED: "connection:closed",
  PACKET_SENT: "packet:sent",
  PACKET_DELAYED: "packet:delayed",
  PACKET_RELEASED: "packet:released",
  PACKET_ACCEPTED: "packet:accepted",
  PACKET_REJECTED: "packet:rejected",
  TOMBSTONE_CREATED: "tombstone:created",
  SCENARIO_STEP: "scenario:step",
  SYSTEM_RESET: "system:reset"
};

export function setupSocket(server, clientUrl) {
  const io = new Server(server, {
    cors: {
      origin: clientUrl || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.emit("system:ready", {
      message: "PortShadow Engine WebSockets Connected",
      phase: 10,
      timestamp: new Date().toISOString()
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Broadcast real-time telemetry event to all connected clients.
 * 
 * @param {string} event 
 * @param {object} payload 
 */
export function broadcastEvent(event, payload) {
  if (ioInstance) {
    ioInstance.emit(event, {
      event,
      timestamp: new Date().toISOString(),
      data: payload
    });
  }
}

export function getIO() {
  return ioInstance;
}
