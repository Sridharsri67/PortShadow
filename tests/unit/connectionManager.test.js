import { describe, it, expect, beforeEach } from "vitest";
import { ConnectionManager } from "../../server/src/core/ConnectionManager.js";
import { CONNECTION_STATES } from "../../server/src/models/Connection.js";

describe("ConnectionManager & Connection Lifecycle", () => {
  let cm;

  beforeEach(() => {
    cm = new ConnectionManager();
  });

  it("should create a connection with a unique 128-bit incarnation ID and ESTABLISHED state", () => {
    const conn = cm.createConnection({
      connectionId: "conn-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });

    expect(conn.connectionId).toBe("conn-A");
    expect(conn.incarnationId).toBeDefined();
    expect(conn.state).toBe(CONNECTION_STATES.ESTABLISHED);
    expect(conn.tupleKey).toBe("10.0.0.1:5000->10.0.0.2:8080");
  });

  it("should reject creation of duplicate active connection on the same 4-tuple without closing first", () => {
    cm.createConnection({
      connectionId: "conn-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000
    });

    expect(() =>
      cm.createConnection({
        connectionId: "conn-B",
        sourceIp: "10.0.0.1",
        sourcePort: 5000
      })
    ).toThrow(/Active connection already exists/);
  });

  it("should support rapid reuse of the 4-tuple with distinct incarnation IDs after closing connection A", () => {
    // 1. Create Connection A
    const connA = cm.createConnection({
      connectionId: "conn-A",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });

    // 2. Close Connection A
    cm.closeConnection("conn-A");
    expect(connA.state).toBe(CONNECTION_STATES.CLOSED);
    expect(cm.getActiveConnections()).toHaveLength(0);

    // 3. Immediately create Connection B reusing the exact same 4-tuple
    const connB = cm.createConnection({
      connectionId: "conn-B",
      sourceIp: "10.0.0.1",
      sourcePort: 5000,
      destinationIp: "10.0.0.2",
      destinationPort: 8080
    });

    expect(connB.state).toBe(CONNECTION_STATES.ESTABLISHED);
    expect(connB.tupleKey).toBe(connA.tupleKey); // Same 4-tuple!
    expect(connB.incarnationId).not.toBe(connA.incarnationId); // Distinct incarnation IDs!
  });

  it("should enforce valid connection state transitions", () => {
    const conn = cm.createConnection({
      connectionId: "conn-1",
      autoEstablish: false
    });

    expect(conn.state).toBe(CONNECTION_STATES.NEW);

    conn.transitionTo(CONNECTION_STATES.CONNECTING);
    expect(conn.state).toBe(CONNECTION_STATES.CONNECTING);

    conn.transitionTo(CONNECTION_STATES.ESTABLISHED);
    expect(conn.state).toBe(CONNECTION_STATES.ESTABLISHED);

    conn.transitionTo(CONNECTION_STATES.CLOSING);
    expect(conn.state).toBe(CONNECTION_STATES.CLOSING);

    conn.transitionTo(CONNECTION_STATES.CLOSED);
    expect(conn.state).toBe(CONNECTION_STATES.CLOSED);

    // Cannot transition out of CLOSED
    expect(() => conn.transitionTo(CONNECTION_STATES.ESTABLISHED)).toThrow(
      /Invalid state transition/
    );
  });
});
