import { getPrismaClient, inMemoryDb } from "../client.js";

export class PacketEventRepository {
  /**
   * Save packet provenance event record asynchronously.
   * Downstream of fast validation path (never blocks packet validation loop).
   */
  static async recordPacketEvent(eventData) {
    const record = {
      packetId: eventData.packetId || "UNKNOWN",
      connectionId: eventData.connectionId || "UNKNOWN",
      incarnationId: eventData.incarnationId || "NONE",
      generation: Number(eventData.generation || 1),
      sequenceNumber: Number(eventData.sequenceNumber || 0),
      sourceIp: eventData.sourceIp || "10.0.0.1",
      sourcePort: Number(eventData.sourcePort || 5000),
      destinationIp: eventData.destinationIp || "10.0.0.2",
      destinationPort: Number(eventData.destinationPort || 8080),
      payload: eventData.payload || null,
      eventType: eventData.eventType || "VALIDATION",
      status: eventData.status || "CREATED",
      rejectionReason: eventData.rejectionReason || null,
      networkDelay: Number(eventData.networkDelay || 0),
      createdAt: (eventData.createdAt && !isNaN(new Date(eventData.createdAt).getTime())) ? new Date(eventData.createdAt) : new Date(),
      deliveredAt: (eventData.deliveredAt && !isNaN(new Date(eventData.deliveredAt).getTime())) ? new Date(eventData.deliveredAt) : new Date()
    };

    // Store in high-speed in-memory database fallback buffer
    inMemoryDb.packetEvents.unshift(record);
    if (inMemoryDb.packetEvents.length > 2000) inMemoryDb.packetEvents.pop();

    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        await prisma.packetEvent.create({ data: record });
      }
    } catch (err) {
      console.error("Failed to record packet event to Prisma:", err.message);
    }
  }

  /**
   * Query packet provenance records with optional filters.
   */
  static async getProvenanceRecords(filter = {}, limit = 100) {
    const { packetId, connectionId, status, rejectionReason } = filter;

    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        const whereClause = {};
        if (packetId) whereClause.packetId = packetId;
        if (connectionId) whereClause.connectionId = connectionId;
        if (status) whereClause.status = status;
        if (rejectionReason) whereClause.rejectionReason = rejectionReason;

        return await prisma.packetEvent.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: limit
        });
      }
    } catch (err) {
      // Fallback to in-memory filter
    }

    return inMemoryDb.packetEvents.filter(e => {
      if (packetId && e.packetId !== packetId) return false;
      if (connectionId && e.connectionId !== connectionId) return false;
      if (status && e.status !== status) return false;
      if (rejectionReason && e.rejectionReason !== rejectionReason) return false;
      return true;
    }).slice(0, limit);
  }
}
