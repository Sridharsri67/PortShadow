import { describe, it, expect, beforeEach } from "vitest";
import { Incarnation } from "../../server/src/models/Incarnation.js";
import { IncarnationManager } from "../../server/src/core/IncarnationManager.js";

describe("Incarnation & IncarnationManager", () => {
  let manager;

  beforeEach(() => {
    manager = new IncarnationManager();
  });

  it("should generate a valid 128-bit UUID v4 incarnation ID", () => {
    const incarnation = manager.createIncarnation();
    expect(incarnation.incarnationId).toBeDefined();
    // UUID v4 regex validation
    expect(incarnation.incarnationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("should produce a short 8-character ID for UI display without truncating full ID", () => {
    const incarnation = new Incarnation("550e8400-e29b-41d4-a716-446655440000");
    expect(incarnation.incarnationId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(incarnation.shortId).toBe("550e8400");
  });

  it("should validate exact incarnation ID equality", () => {
    const incA = manager.createIncarnation();
    const incB = manager.createIncarnation();

    expect(manager.validateIncarnation(incA.incarnationId, incA.incarnationId)).toBe(true);
    expect(manager.validateIncarnation(incA.incarnationId, incB.incarnationId)).toBe(false);
  });

  it("should generate unique incarnation IDs across multiple creations", () => {
    const set = new Set();
    for (let i = 0; i < 100; i++) {
      const inc = manager.createIncarnation();
      set.add(inc.incarnationId);
    }
    expect(set.size).toBe(100);
  });
});
