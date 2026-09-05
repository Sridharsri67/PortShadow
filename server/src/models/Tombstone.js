import crypto from "node:crypto";

export class Tombstone {
  constructor({
    tombstoneId = null,
    connectionId,
    tupleKey,
    oldIncarnationId,
    lastSequence,
    closedAt = new Date().toISOString(),
    ttlMs = 5000
  }) {
    if (!connectionId) {
      throw new Error("connectionId is required for Tombstone");
    }
    if (!oldIncarnationId) {
      throw new Error("oldIncarnationId is required for Tombstone");
    }
    if (!tupleKey) {
      throw new Error("tupleKey is required for Tombstone");
    }

    this.tombstoneId = tombstoneId || crypto.randomUUID();
    this.connectionId = connectionId;
    this.tupleKey = tupleKey;
    this.oldIncarnationId = oldIncarnationId;
    this.lastSequence = Number(lastSequence);
    this.closedAt = closedAt;
    this.ttlMs = ttlMs;
    this.expiresAt = new Date(new Date(closedAt).getTime() + ttlMs).toISOString();
  }

  /**
   * Returns a 8-character truncated string strictly for UI display purposes.
   */
  get shortIncarnationId() {
    return this.oldIncarnationId ? this.oldIncarnationId.slice(0, 8) : "";
  }

  isExpired(clock = null) {
    const nowMs = clock && typeof clock.now === "function" ? clock.now() : Date.now();
    return nowMs > new Date(this.expiresAt).getTime();
  }

  toJSON() {
    return {
      tombstoneId: this.tombstoneId,
      connectionId: this.connectionId,
      tupleKey: this.tupleKey,
      oldIncarnationId: this.oldIncarnationId,
      shortIncarnationId: this.shortIncarnationId,
      lastSequence: this.lastSequence,
      closedAt: this.closedAt,
      ttlMs: this.ttlMs,
      expiresAt: this.expiresAt,
      isExpired: this.isExpired()
    };
  }
}
