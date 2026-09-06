import express from "express";
import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupSocket } from "./websocket/socket.js";
import routes from "./api/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// API Routes
app.use("/api", routes);

// WebSocket Setup
const io = setupSocket(server, CLIENT_URL);

// Serve static client assets in production
const clientDistPath = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// Basic health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PortShadow Engine Server",
    timestamp: new Date().toISOString()
  });
});

// SPA wildcard fallback for frontend routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Front-end build not found. Run 'npm run build' first.");
    }
  });
});

import { getPrismaClient } from "./database/client.js";

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`[PortShadow Server] Listening on http://localhost:${PORT}`);
    getPrismaClient().catch((err) => {
      console.warn("⚠️ [PortShadow DB] Startup connection check deferred:", err.message);
    });
  });
}

export { app, server, io };
