export const PACKET_STATUS = {
  CREATED: "CREATED",
  SENT: "SENT",
  DELAYED: "DELAYED",
  RELEASED: "RELEASED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  BUFFERED: "BUFFERED",
  DUPLICATE: "DUPLICATE",
  DROPPED: "DROPPED"
};

export const REJECTION_REASONS = {
  UNKNOWN_CONNECTION: "UNKNOWN_CONNECTION",
  STALE_INCARNATION: "STALE_INCARNATION",
  INVALID_SEQUENCE: "INVALID_SEQUENCE"
};

export class Packet {
  constructor({
    packetId,
    sourceIp,
    sourcePort,
    destinationIp,
    destinationPort,
    connectionId,
    incarnationId,
    generation = 1,
    sequenceNumber,
    payload = "DATA",
    createdAt = new Date().toISOString(),
    deliveryAt = null,
    status = PACKET_STATUS.CREATED,
    rejectionReason = null
  }) {
    if (!packetId) {
      throw new Error("packetId is required");
    }
    if (!incarnationId) {
      throw new Error("incarnationId is required for packet creation");
    }

    this.packetId = packetId;
    this.sourceIp = sourceIp;
    this.sourcePort = Number(sourcePort);
    this.destinationIp = destinationIp;
    this.destinationPort = Number(destinationPort);
    this.connectionId = connectionId;
    this.incarnationId = incarnationId;
    this.generation = Number(generation); // Inherited from connection
    this.sequenceNumber = Number(sequenceNumber);
    this.payload = payload;
    this.createdAt = createdAt;
    this.deliveryAt = deliveryAt;
    this.status = status;
    this.rejectionReason = rejectionReason;
  }

  get tupleKey() {
    return `${this.sourceIp}:${this.sourcePort}->${this.destinationIp}:${this.destinationPort}`;
  }

  setStatus(nextStatus, reason = null) {
    if (!Object.values(PACKET_STATUS).includes(nextStatus)) {
      throw new Error(`Invalid packet status: ${nextStatus}`);
    }
    this.status = nextStatus;
    if (reason) {
      this.rejectionReason = reason;
    }
    return this.status;
  }

  toJSON() {
    return {
      packetId: this.packetId,
      sourceIp: this.sourceIp,
      sourcePort: this.sourcePort,
      destinationIp: this.destinationIp,
      destinationPort: this.destinationPort,
      connectionId: this.connectionId,
      incarnationId: this.incarnationId,
      generation: this.generation,
      sequenceNumber: this.sequenceNumber,
      payload: this.payload,
      createdAt: this.createdAt,
      deliveryAt: this.deliveryAt,
      status: this.status,
      rejectionReason: this.rejectionReason,
      tupleKey: this.tupleKey
    };
  }
}
