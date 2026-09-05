import crypto from "node:crypto";

export class Incarnation {
  /**
   * @param {string} [id] - Optional custom UUID, otherwise generated via crypto.randomUUID()
   */
  constructor(id = null) {
    this.incarnationId = id || crypto.randomUUID();
    this.createdAt = new Date().toISOString();
    this.status = "ACTIVE";
  }

  /**
   * Returns a 8-character truncated string strictly for UI display purposes.
   * Internal logic MUST use full incarnationId.
   */
  get shortId() {
    return this.incarnationId.slice(0, 8);
  }

  toJSON() {
    return {
      incarnationId: this.incarnationId,
      shortId: this.shortId,
      createdAt: this.createdAt,
      status: this.status
    };
  }
}
