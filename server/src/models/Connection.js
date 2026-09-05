export const CONNECTION_STATES = {
  NEW: "NEW",
  CONNECTING: "CONNECTING",
  ESTABLISHED: "ESTABLISHED",
  CLOSING: "CLOSING",
  CLOSED: "CLOSED"
};

const VALID_TRANSITIONS = {
  [CONNECTION_STATES.NEW]: [CONNECTION_STATES.CONNECTING, CONNECTION_STATES.ESTABLISHED, CONNECTION_STATES.CLOSED],
  [CONNECTION_STATES.CONNECTING]: [CONNECTION_STATES.ESTABLISHED, CONNECTION_STATES.CLOSING, CONNECTION_STATES.CLOSED],
  [CONNECTION_STATES.ESTABLISHED]: [CONNECTION_STATES.CLOSING, CONNECTION_STATES.CLOSED],
  [CONNECTION_STATES.CLOSING]: [CONNECTION_STATES.CLOSED],
  [CONNECTION_STATES.CLOSED]: []
};

export class Connection {
  constructor({
    connectionId,
    sourceIp = "10.0.0.1",
    sourcePort = 5000,
    destinationIp = "10.0.0.2",
    destinationPort = 8080,
    incarnationId,
    generation = 1,
    initialSequenceNumber = 100
  }) {
    if (!connectionId) {
      throw new Error("connectionId is required");
    }
    if (!incarnationId) {
      throw new Error("incarnationId is required");
    }

    this.connectionId = connectionId;
    this.sourceIp = sourceIp;
    this.sourcePort = Number(sourcePort);
    this.destinationIp = destinationIp;
    this.destinationPort = Number(destinationPort);
    this.incarnationId = incarnationId;
    this.generation = Number(generation);
    this.state = CONNECTION_STATES.NEW;
    this.sequenceNumber = initialSequenceNumber;
    this.createdAt = new Date().toISOString();
    this.closedAt = null;
  }

  get tupleKey() {
    return `${this.sourceIp}:${this.sourcePort}->${this.destinationIp}:${this.destinationPort}`;
  }

  /**
   * Transition connection state enforcing valid lifecycle paths.
   * @param {string} nextState 
   */
  transitionTo(nextState) {
    const allowed = VALID_TRANSITIONS[this.state];
    if (!allowed || !allowed.includes(nextState)) {
      throw new Error(
        `Invalid state transition from ${this.state} to ${nextState} for connection ${this.connectionId}`
      );
    }
    this.state = nextState;
    if (nextState === CONNECTION_STATES.CLOSED) {
      this.closedAt = new Date().toISOString();
    }
    return this.state;
  }

  toJSON() {
    return {
      connectionId: this.connectionId,
      sourceIp: this.sourceIp,
      sourcePort: this.sourcePort,
      destinationIp: this.destinationIp,
      destinationPort: this.destinationPort,
      incarnationId: this.incarnationId,
      generation: this.generation,
      state: this.state,
      sequenceNumber: this.sequenceNumber,
      createdAt: this.createdAt,
      closedAt: this.closedAt,
      tupleKey: this.tupleKey
    };
  }
}
