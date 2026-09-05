import { Server } from "socket.io";

export function setupSocket(server, clientUrl) {
  const io = new Server(server, {
    cors: {
      origin: clientUrl || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.emit("system:ready", {
      message: "PortShadow Engine WebSockets Connected",
      phase: 1
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
