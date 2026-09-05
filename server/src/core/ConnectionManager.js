import { Connection, CONNECTION_STATES } from "../models/Connection.js";
import { incarnationManager } from "./IncarnationManager.js";
import { tombstoneStore } from "./TombstoneStore.js";
import { broadcastEvent, SOCKET_EVENTS } from "../websocket/socket.js";

export class ConnectionManager {
  constructor() {
    /** @type {Map<string, Connection>} Maps 4-tuple key to active Connection */
    this.activeConnections = new Map();

    /** @type {Map<string, Connection>} Maps connectionId to Connection (active + closed) */
    this.allConnections = new Map();
  }

  /**
   * Utility to format 4-tuple key.
   */
  static getTupleKey(sourceIp, sourcePort, destinationIp, destinationPort) {
    return `${sourceIp}:${sourcePort}->${destinationIp}:${destinationPort}`;
  }

  /**
   * Create a new connection with a unique 128-bit incarnation ID.
   */
  createConnection({
    connectionId,
    sourceIp = "10.0.0.1",
    sourcePort = 5000,
    destinationIp = "10.0.0.2",
    destinationPort = 8080,
    autoEstablish = true
  }) {
    const tupleKey = ConnectionManager.getTupleKey(
      sourceIp,
      sourcePort,
      destinationIp,
      destinationPort
    );

    if (this.activeConnections.has(tupleKey)) {
      const existing = this.activeConnections.get(tupleKey);
      throw new Error(
        `Active connection already exists for tuple ${tupleKey} (Connection ID: ${existing.connectionId})`
      );
    }

    const id = connectionId || `conn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Generate fresh incarnation ID via IncarnationManager
    const incarnation = incarnationManager.createIncarnation();

    const connection = new Connection({
      connectionId: id,
      sourceIp,
      sourcePort,
      destinationIp,
      destinationPort,
      incarnationId: incarnation.incarnationId
    });

    if (autoEstablish) {
      connection.transitionTo(CONNECTION_STATES.CONNECTING);
      connection.transitionTo(CONNECTION_STATES.ESTABLISHED);
    }

    this.activeConnections.set(tupleKey, connection);
    this.allConnections.set(id, connection);

    broadcastEvent(SOCKET_EVENTS.CONNECTION_CREATED, connection.toJSON());

    return connection;
  }

  /**
   * Lookup active connection by 4-tuple.
   */
  getConnectionByTuple(sourceIp, sourcePort, destinationIp, destinationPort) {
    const tupleKey = ConnectionManager.getTupleKey(
      sourceIp,
      sourcePort,
      destinationIp,
      destinationPort
    );
    return this.activeConnections.get(tupleKey) || null;
  }

  /**
   * Lookup connection by connection ID.
   */
  getConnection(connectionId) {
    return this.allConnections.get(connectionId) || null;
  }

  /**
   * Close connection, create tombstone, and free up the 4-tuple endpoint for rapid reuse.
   * @param {string} connectionId 
   * @param {number} [tombstoneTtlMs=5000] 
   */
  closeConnection(connectionId, tombstoneTtlMs = 5000) {
    const connection = this.allConnections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    if (connection.state === CONNECTION_STATES.CLOSED) {
      return connection;
    }

    if (connection.state === CONNECTION_STATES.ESTABLISHED) {
      connection.transitionTo(CONNECTION_STATES.CLOSING);
    }
    connection.transitionTo(CONNECTION_STATES.CLOSED);

    // Remove from active 4-tuple map so endpoint can be reused immediately
    this.activeConnections.delete(connection.tupleKey);

    // Create Tombstone record preserving teardown state & old incarnation ID
    const tombstone = tombstoneStore.createTombstone(connection, tombstoneTtlMs);

    broadcastEvent(SOCKET_EVENTS.CONNECTION_CLOSED, {
      connectionId,
      tombstone: tombstone ? tombstone.toJSON() : null
    });

    return connection;
  }

  /**
   * Get array of all currently active connections.
   */
  getActiveConnections() {
    return Array.from(this.activeConnections.values());
  }

  /**
   * Get array of all connections (active and closed).
   */
  getAllConnections() {
    return Array.from(this.allConnections.values());
  }

  /**
   * Reset all connection state.
   */
  reset() {
    this.activeConnections.clear();
    this.allConnections.clear();
    incarnationManager.reset();
    tombstoneStore.reset();
  }
}

// Singleton instance for server core
export const connectionManager = new ConnectionManager();
