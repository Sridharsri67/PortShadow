import { getPrismaClient, inMemoryDb } from "../client.js";

export class BenchmarkRepository {
  /**
   * Record performance benchmark results asynchronously.
   */
  static async recordBenchmark(benchmarkData) {
    const record = {
      packetCount: Number(benchmarkData.packetCount || 0),
      durationMs: Number(benchmarkData.durationMs || 0),
      throughput: Number(benchmarkData.throughput || 0),
      averageLatency: Number(benchmarkData.averageLatency || 0),
      createdAt: benchmarkData.createdAt ? new Date(benchmarkData.createdAt) : new Date()
    };

    inMemoryDb.benchmarkResults.unshift(record);
    if (inMemoryDb.benchmarkResults.length > 500) inMemoryDb.benchmarkResults.pop();

    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        await prisma.benchmarkResult.create({ data: record });
      }
    } catch (err) {
      console.error("Failed to record benchmark result to Prisma:", err.message);
    }
  }

  /**
   * Get historical benchmark results.
   */
  static async getBenchmarkResults(limit = 50) {
    try {
      const prisma = await getPrismaClient();
      if (prisma) {
        return await prisma.benchmarkResult.findMany({
          orderBy: { createdAt: "desc" },
          take: limit
        });
      }
    } catch (err) {
      // Fallback
    }

    return inMemoryDb.benchmarkResults.slice(0, limit);
  }
}
