import { getPrismaClient, inMemoryDb } from "../client.js";

export class ConnectionRepository {
  /**
   * Save connection creation record asynchronously.
   */
  static async recordConnectionCreated(connectionData) {
    const record = {
      connectionId: connectionData.connectionId,
      sourceIp: connectionData.sourceIp || "10.0.0.1",
      sourcePort: Number(connectionData.sourcePort || 5000),
      destinationIp: connectionData.destinationIp || "10.0.0.2",
      destinationPort: Number(connectionData.destinationPort || 8080),
      incarnationId: connectionData.incarnationId,
      generation: Number(connectionData.generation || 1),
      state: connectionData.state || "ESTABLISHED",
      sequenceNumber: Number(connectionData.sequenceNumber || 100),
      tupleKey: connectionData.tupleKey || `${connectionData.sourceIp}:${connectionData.sourcePort}->${connectionData.destinationIp}:${connectionData.destinationPort}`,
      createdAt: connectionData.createdAt ? new Date(connectionData.createdAt) : new Date(),
      closedAt: connectionData.closedAt ? new Date(connectionData.closedAt) : null
    };

    // Always push to in-memory fallback store
    inMemoryDb.connections.unshift(record);
    if (inMemoryDb.connections.length > 1000) inMemoryDb.connections.pop();

    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        await prisma.connection.create({ data: record });
      }
    } catch (err) {
      console.error("Failed to record connection to Prisma:", err.message);
    }
  }

  /**
   * Record connection teardown / state transition asynchronously.
   */
  static async recordConnectionClosed(connectionId, closedAt = new Date().toISOString()) {
    const inMem = inMemoryDb.connections.find(c => c.connectionId === connectionId);
    if (inMem) {
      inMem.state = "CLOSED";
      inMem.closedAt = new Date(closedAt);
    }

    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        await prisma.connection.updateMany({
          where: { connectionId },
          data: {
            state: "CLOSED",
            closedAt: new Date(closedAt)
          }
        });
      }
    } catch (err) {
      console.error("Failed to update connection close in Prisma:", err.message);
    }
  }

  /**
   * Get connection history.
   */
  static async getAllConnections(limit = 100) {
    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        return await prisma.connection.findMany({
          orderBy: { createdAt: "desc" },
          take: limit
        });
      }
    } catch (err) {
      // Fallback
    }
    return inMemoryDb.connections.slice(0, limit);
  }
}
