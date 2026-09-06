import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../../.env");
const serverEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: serverEnvPath });
dotenv.config({ path: envPath });

let prismaInstance = null;
let prismaPromise = null;
let isDbConnected = false;

// In-Memory Fallback Stores for Packet Provenance & Historical Data
export const inMemoryDb = {
  connections: [],
  packetEvents: [],
  scenarioRuns: [],
  benchmarkResults: []
};

let currentDbUrl = null;

/**
 * Initialize Prisma Client if @prisma/client is installed & DATABASE_URL is set.
 * Dynamically updates if DATABASE_URL switches between local PostgreSQL and Neon DB.
 */
export async function getPrismaClient() {
  dotenv.config({ path: serverEnvPath });
  const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : "";

  if (!dbUrl) {
    if (prismaInstance) {
      await prismaInstance.$disconnect().catch(() => {});
      prismaInstance = null;
      prismaPromise = null;
      currentDbUrl = null;
      isDbConnected = false;
    }
    return null;
  }

  // If DATABASE_URL changed, disconnect existing instance so new URL is bound
  if (prismaInstance && currentDbUrl !== dbUrl) {
    await prismaInstance.$disconnect().catch(() => {});
    prismaInstance = null;
    prismaPromise = null;
    isDbConnected = false;
  }

  if (prismaInstance) return prismaInstance;
  if (prismaPromise) return prismaPromise;

  currentDbUrl = dbUrl;
  prismaPromise = (async () => {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const client = new PrismaClient({
        datasources: { db: { url: dbUrl } },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
      });
      await client.$connect();
      prismaInstance = client;
      isDbConnected = true;
      const targetLabel = dbUrl.includes("neon.tech") ? "Neon Cloud PostgreSQL" : "Local PostgreSQL";
      console.log(`⚡ [PortShadow DB] Connected to ${targetLabel} via Prisma.`);

      return prismaInstance;
    } catch (err) {
      console.warn("⚠️ [PortShadow DB] Database connection unavailable:", err.message);
      prismaInstance = null;
      prismaPromise = null;
      currentDbUrl = null;
      isDbConnected = false;
      return null;
    }
  })();

  return prismaPromise;
}

/**
 * Returns whether real PostgreSQL database is currently connected.
 */
export function isDatabaseConnected() {
  return isDbConnected;
}

export default getPrismaClient;
