# 📐 Architecture Decision Records (ADR) — PortShadow

This document captures the primary architectural decisions, trade-offs, and design rationale behind **PortShadow**.

---

## ADR-001: 128-bit UUID Incarnation IDs (`crypto.randomUUID()`)

### Context
When transport endpoints (IP:Port tuples) are rapidly reused across consecutive connection lifetimes, packets delayed in the network from an earlier connection incarnation can arrive at the newly bound endpoint. The receiver requires a deterministic mechanism to distinguish stale packets from active connection packets.

### Decision
Use 128-bit UUID v4 identifiers generated natively via Node.js `crypto.randomUUID()` for every connection generation.

```javascript
const incarnationId = crypto.randomUUID();
// Example: 550e8400-e29b-41d4-a716-446655440000
```

### Rationale
- **Collision Resistance**: 128-bit space ($2^{122}$ random bits) guarantees negligible collision probability across millions of simulated connection generations.
- **Native Support**: Standard built-in Node.js feature requiring zero external dependencies.
- **Non-Truncated Retention**: Internal core logic retains full 128-bit UUIDs for verification while exposing a short 8-character hex string (`shortId`) strictly for UI visualization.

### Alternatives Considered
- *32-bit / 64-bit integer counters*: Prone to rollover or collisions in multi-node/distributed simulations.
- *Timestamps*: Vulnerable to clock skew, network jitter, and timestamp collisions.

---

## ADR-002: Transport 4-Tuple Mapping + Incarnation Validation Pipeline

### Context
A transport endpoint is identified by a 4-tuple: `(sourceIp, sourcePort, destinationIp, destinationPort)`. Because identical 4-tuples are reused across connection generations, the 4-tuple alone cannot distinguish Connection A from Connection B.

### Decision
Implement a 3-tier validation pipeline:
1. **Tier 1: 4-Tuple Lookup** — Match incoming packet against active transport table.
2. **Tier 2: Incarnation ID Verification** — Assert exact match (`packet.incarnationId === activeConnection.incarnationId`).
3. **Tier 3: Sequence Number & Ordering** — Check expected sequence number, duplicates, and out-of-order buffering.

### Rationale
Enforces the primary security invariant: **A packet from a previous incarnation must never alter the state of an active connection**.

---

## ADR-003: Immediate Endpoint/Port Reuse vs. TCP TIME-WAIT Delay

### Context
Real TCP stacks enforce a `TIME-WAIT` delay (typically 2 * MSL = 60 to 120 seconds) before releasing a closed socket tuple to ensure in-flight packets dissipate.

### Decision
PortShadow allows **immediate 4-tuple reuse** upon connection closure.

### Rationale
The goal of PortShadow is to demonstrate **active transport isolation** through explicit incarnation identifiers under rapid endpoint recycling. Simulating immediate reuse allows instant edge-case testing without forcing arbitrary wait delays.

---

## ADR-004: Modular Environment Variable Isolation

### Context
Monorepos with mixed backend/frontend workloads can risk exposing backend environment variables or secrets to frontend bundles.

### Decision
Maintain dedicated `.env` configuration files in `server/.env` and `client/.env`, removing root-level `.env` files.

### Rationale
- **Component Isolation**: Backend variables (`PORT`, `CLIENT_URL`) remain scoped to `server/`.
- **Frontend Security**: Client variables (`VITE_API_URL`, `VITE_PORT`) are explicitly prefixed with `VITE_` and scoped to `client/`.

---

## ADR-005: Decoupled Monorepo Workspaces (`server` + `client`)

### Context
The system requires an Express REST API backend, real-time WebSockets, and a React dashboard interface.

### Decision
Use npm Workspaces (`"workspaces": ["server", "client"]`) with shared Vitest testing at root.

### Rationale
Provides clean separation of concerns, single-command dependency management (`npm install`), and synchronized test execution (`npm test`).
