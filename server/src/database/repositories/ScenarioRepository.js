import { getPrismaClient, inMemoryDb } from "../client.js";

export class ScenarioRepository {
  /**
   * Record scenario run execution metrics asynchronously.
   */
  static async recordScenarioRun(scenarioData) {
    const record = {
      scenarioName: scenarioData.scenarioName || "UNKNOWN",
      startedAt: scenarioData.startedAt ? new Date(scenarioData.startedAt) : new Date(),
      completedAt: scenarioData.completedAt ? new Date(scenarioData.completedAt) : new Date(),
      totalPackets: Number(scenarioData.totalPackets || 0),
      acceptedPackets: Number(scenarioData.acceptedPackets || 0),
      rejectedPackets: Number(scenarioData.rejectedPackets || 0),
      stalePackets: Number(scenarioData.stalePackets || 0),
      duplicates: Number(scenarioData.duplicates || 0),
      outOfOrder: Number(scenarioData.outOfOrder || 0),
      summary: scenarioData.summary ? JSON.stringify(scenarioData.summary) : null
    };

    inMemoryDb.scenarioRuns.unshift(record);
    if (inMemoryDb.scenarioRuns.length > 500) inMemoryDb.scenarioRuns.pop();

    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        await prisma.scenarioRun.create({ data: record });
      }
    } catch (err) {
      console.error("Failed to record scenario run to Prisma:", err.message);
    }
  }

  /**
   * Retrieve historical scenario run results.
   */
  static async getScenarioRuns(limit = 50) {
    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        return await prisma.scenarioRun.findMany({
          orderBy: { startedAt: "desc" },
          take: limit
        });
      }
    } catch (err) {
      // Fallback
    }

    return inMemoryDb.scenarioRuns.slice(0, limit);
  }
}
